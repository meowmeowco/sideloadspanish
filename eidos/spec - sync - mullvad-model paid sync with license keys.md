# spec - sync - mullvad-model paid sync with license keys

status: draft

## Problem

Users who browse on multiple devices lose progress. The free extension stores everything locally — no cross-device sync. A paid sync tier creates revenue while solving a real problem.

## Solution

Privacy-first paid sync at 5 EUR/month. No accounts, no email, no personal data. A random license key is the only identity. Pay → get key → paste into extension → sync works.

## Pricing

- **5 EUR/month**. One price. No tiers, no discounts, no annual plan.
- Adding time = paying again with the same key.
- Expired key = sync stops, local data remains, extension works fully offline.
- Grace period: 7 days after expiry before sync data is purged server-side.

## Behaviour

### Key Lifecycle

1. User visits payment page (static site or Lemon Squeezy storefront)
2. Pays 5 EUR → Lemon Squeezy webhook fires → backend generates key `SL-XXXX-XXXX-XXXX`
3. Key displayed on thank-you page + emailed to payment email (Lemon Squeezy handles this)
4. User pastes key into extension settings → extension validates against backend
5. Sync activates immediately
6. Subscription renews monthly → key stays valid
7. User cancels → key expires at end of billing period → sync stops → local data intact

### Key Format

- Pattern: `SL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}`
- Example: `SL-7K4M-R2X9-P5NW`
- Generated server-side, stored hashed in KV
- One key = one sync identity

### Key Recovery

Users will lose keys. Recovery must exist without compromising the no-account model.

- At payment time, Lemon Squeezy collects an email (they require it for receipts anyway)
- Server stores: `email_hash → [key_hash]` mapping in KV (one-way, not reversible from key to email)
- Recovery flow: user visits recovery page → enters email → receives their key(s) via email
- The email is **never** used for marketing, login, or identity — only key recovery
- Extension settings show: "Save your key: `SL-7K4M-R2X9-P5NW`" with a copy button as first line of defense
- Popup shows a persistent "your key" reminder if sync is active

### Key Rotation

Keys can be leaked or compromised. Users must be able to rotate without losing data.

- The underlying sync identity is an internal **account ID** (opaque UUID), not the key itself
- A key is a pointer to an account ID: `key_hash → account_id`
- Sync data is stored under the account ID: `account_id → { known_words, updated_at }`
- **Rotation flow:**
  1. User visits recovery page → enters email → requests new key
  2. Server generates new key, points it to the **same account ID**
  3. Old key is immediately invalidated (deleted from KV)
  4. New key sent via email
  5. User pastes new key in extension → sync resumes with all existing data
- Rotation is idempotent: rotating again just replaces the key, same account ID
- Extension detects invalidated key (sync returns 401) → shows "Key rotated — enter your new key"

### Sync Protocol

The known-words set is a grow-only CRDT (G-Set). Merge = union. No conflicts possible.

All sync data is end-to-end encrypted. The server is a dumb blob store — it cannot read, merge, or inspect the data.

### End-to-End Encryption

**Key derivation:**
```
encryption_key = PBKDF2(
  password: license_key + user_pin,
  salt: account_id,
  iterations: 100000,
  hash: SHA-256,
  keyLength: 256 bits
)
```

- The 4-digit PIN is set by the user when they first activate sync
- PIN is stored only locally, never sent to the server
- Even a leaked license key alone cannot decrypt the data
- All crypto uses Web Crypto API (built into browsers, no dependencies)

**Encryption:** AES-256-GCM with a random 12-byte IV per sync payload.

**Payload format:**
```
{ iv: base64, ciphertext: base64 }
```

The plaintext before encryption:
```json
{ "known_words": ["time", "house", "water"], "version": 1 }
```

### Sync Protocol (E2E)

Since the server cannot decrypt, all merging happens client-side.

**Sync flow (pull → merge → push):**
```
1. Client: GET /sync   (authenticated with license key)
2. Server: returns { iv, ciphertext, updated_at, expires_at }
3. Client: decrypt(ciphertext, encryption_key) → server_words
4. Client: merged = union(local_words, server_words)
5. Client: new_ciphertext = encrypt(merged, encryption_key)
6. Client: PUT /sync    body: { iv, ciphertext }
7. Server: stores blob, returns { updated_at }
```

**Server endpoints:**
```
GET  /sync   → return stored encrypted blob
PUT  /sync   → overwrite stored encrypted blob
POST /validate → check key validity
POST /webhook  → Lemon Squeezy payment events
```

**Server logic is trivial:** validate key, read blob, write blob. No parsing, no merging, no knowledge of contents.

**Conflict handling:** if two devices sync simultaneously, last-write-wins on the encrypted blob. Since the data is a G-Set (grow-only) and each client pulls before pushing, the merge window is small and no words are ever deleted, so eventual consistency is guaranteed after the next sync cycle.

### Key Rotation with E2E

When a key is rotated, the encryption key changes (new license key in the KDF input). The rotation handoff:

1. Client authenticates with old key
2. Client pulls blob → decrypts with old encryption key
3. Server rotates: new key → same account ID, old key invalidated
4. Client re-encrypts data with new encryption key (derived from new key + same PIN)
5. Client pushes re-encrypted blob with new key
6. Single atomic operation from the user's perspective

### PIN Recovery

If the user forgets their PIN, the encrypted data is unrecoverable by design. This is the trade-off of E2E encryption.

Mitigations:
- On PIN setup, show: "Write this down. We cannot recover your data without it."
- Local data is never encrypted — only the sync copy. Losing the PIN means losing sync, not losing local progress.
- User can set a new PIN, which starts a fresh sync (uploading current local state with new encryption)

### Sync Triggers

- On extension startup (if key is set and not expired)
- After every 10 words marked as known (batched, not per-click)
- Manual sync button in popup
- Never sync if no key or key expired

### Conflict Resolution

None needed. Known-words is a G-Set:
- Word marked known on device A + not on device B → after sync, known on both
- Word marked known on both devices → union is idempotent
- `clicked_known` count: take max(device_a, device_b) per word
- Progress projections are recomputed from merged data

## Architecture

### Backend: Cloudflare Workers + KV

```
sync-worker/
  src/
    index.js          # Worker entry: route /sync, /validate, /webhook
    keys.js           # Key generation, validation, expiry checks
    sync.js           # G-Set merge logic
  wrangler.toml       # Cloudflare config
```

**KV namespaces:**
- `LICENSES` — key → `{ created, expires_at, active }` (hashed key as KV key)
- `SYNC_DATA` — account_id → `{ iv, ciphertext, updated_at }` (opaque encrypted blob)

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/sync` | Push/pull known words (authenticated) |
| POST | `/validate` | Check if a key is valid and active |
| POST | `/webhook` | Lemon Squeezy payment webhook → create/extend key |

### Extension Changes

- Settings UI: license key input field + sync status indicator
- Popup: "Last synced: 2 min ago" or "Sync: offline mode"
- New `lib/sync.js`: sync client, batching logic, merge into local store
- Service worker: periodic sync scheduling

### Payment: Lemon Squeezy

- Product: "Sideload Spanish Sync" — subscription, 5 EUR/month
- No variants, no tiers, no annual option
- Webhook on `subscription_created`, `subscription_updated`, `subscription_expired`
- Webhook creates/extends key in KV, no other state needed

## Interactions

- **depends on**: Cloudflare Workers, Cloudflare KV, Lemon Squeezy
- **depends on**: [[spec - sideload - progressive in-page word replacement for language learning]] (core extension)
- **extends**: service worker CQRS model — sync is a new command that triggers projection rebuild

## Verification

- [ ] Paying creates a valid key that activates sync
- [ ] Pasting key in extension validates against backend
- [ ] Known words sync between two browser instances with same key
- [ ] Merge is correct: union of both sets, no data loss
- [ ] Expired key stops sync but local data remains functional
- [ ] Invalid/fake key is rejected with clear error
- [ ] Webhook correctly handles subscription renewal and cancellation
- [ ] No personal data stored server-side (no email, no name)
- [ ] Server-side blob is encrypted and unreadable without license key + PIN
- [ ] Key rotation re-encrypts data without loss
- [ ] Wrong PIN fails decryption cleanly with user-facing error
- [ ] Forgotten PIN: local data intact, user can reset sync with new PIN
- [ ] Sync batches writes (not per-click)
- [ ] Grace period: 7 days after expiry before server purge

## Boundaries

- **No** user accounts or login — email stored only as hash for key recovery
- **No** annual pricing or discounts — 5 EUR/month, period
- **No** free trial of sync — the extension itself is the free tier
- **No** browsing data ever leaves the device — no URLs, no page content, no links, no DOM
- **No** server-side analytics on user behavior
- **No** sync of settings — only known-words set. Settings are local preference.
- **No** multi-key management — one key per payment, user manages their own key

## Privacy Guarantee

The extension **never** transmits:
- URLs or domains the user visits
- Page content, text, or DOM structure
- Browsing history or patterns
- Timestamps of when/where words were learned

The **only** data that leaves the device during sync:
- The license key (for authentication)
- A list of known English word strings (e.g. `["time", "house", "water"]`)

The server has no way to know what pages the user visited, when they browsed, or any context about their learning. It only knows which words from the built-in vocabulary list have been marked as known.
