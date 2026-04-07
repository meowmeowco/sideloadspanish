---
tldr: Build Cloudflare Workers backend + Lemon Squeezy payments + E2E encrypted sync for cross-device word progress
status: active
---

# Plan: Implement Paid Sync with License Keys

## Context

- Spec: [[spec - sync - mullvad-model paid sync with license keys]]
- Depends on: [[spec - sideload - progressive in-page word replacement for language learning]] (MVP complete)

Privacy-first paid sync at 5 EUR/month. No accounts — a random license key is the only identity. Server is a dumb blob store that can't read, merge, or inspect the encrypted data. All merging happens client-side.

**Key architectural decisions (from spec + coherence report):**
- Sync payload: per-word records `{ en, known, clicked_known, seen, tier, gender }` — E2E encrypted
- Conflict resolution: union on words, `max()` on counts, `OR` on known, `min()` on tier
- Server endpoints: RESTful `GET /sync` + `PUT /sync` (not POST)
- Key derivation: `PBKDF2(license_key + user_pin, account_id, 100k iterations, SHA-256)`
- Encryption: AES-256-GCM with random 12-byte IV per payload

## Phases

### Phase 1 - Backend Skeleton (Cloudflare Workers + KV) - status: open

Deployable worker that handles key validation and blob storage. No payments yet — keys created manually for testing.

1. [ ] Scaffold `sync-worker/` with wrangler: `wrangler init`, configure KV namespaces (LICENSES, SYNC_DATA)
2. [ ] Implement `src/keys.js` — key generation (`SL-XXXX-XXXX-XXXX`), hashing (SHA-256), validation
3. [ ] Implement `src/sync.js` — blob read/write: `GET /sync` returns blob, `PUT /sync` stores blob
4. [ ] Implement `src/index.js` — router: `/sync` (GET/PUT, auth required), `/validate` (POST)
   - auth: `Authorization: Bearer SL-XXXX-XXXX-XXXX` header, validate against LICENSES KV
5. [ ] Add key management CLI script: `scripts/create-key.js` — generates key, stores hash in KV (for testing)
6. [ ] Deploy to Cloudflare Workers dev environment, verify with curl:
   - create key → validate → PUT blob → GET blob → verify round-trip
7. [ ] Write integration tests for worker endpoints

### Phase 2 - E2E Encryption (Extension Client) - status: open

Extension can encrypt/decrypt sync payloads. No network calls yet — just crypto logic.

1. [ ] Implement `lib/crypto.js` — Web Crypto API wrapper:
   - `deriveKey(licenseKey, pin, accountId)` → AES-256-GCM key via PBKDF2
   - `encrypt(plaintext, key)` → `{ iv, ciphertext }` (base64)
   - `decrypt({ iv, ciphertext }, key)` → plaintext
2. [ ] Implement `lib/merge.js` — client-side merge logic:
   - `mergeWordSets(local, remote)` → merged per-word records
   - union on words, `known = a OR b`, `max()` on counts, `min()` on tier
3. [ ] Unit tests for crypto (round-trip encrypt/decrypt) and merge (all conflict cases)

### Phase 3 - Sync Client (Extension ↔ Backend) - status: open

Extension can sync with the backend. Visible result: paste key → sync works.

1. [ ] Implement `lib/sync.js` — sync client:
   - `pull(licenseKey)` → GET /sync → decrypt → return word set
   - `push(licenseKey, wordSet)` → encrypt → PUT /sync
   - `syncFull(licenseKey, pin, localWords)` → pull → merge → push
2. [ ] Add PIN setup flow in extension settings:
   - first-time: prompt for 4-digit PIN, store locally only
   - show warning: "Write this down. We cannot recover your data without it."
3. [ ] Add license key input to extension settings (popup):
   - paste key → POST /validate → if valid, store locally, show "Sync active"
   - if invalid → clear error message
4. [ ] Wire sync triggers in service worker:
   - on extension startup (if key set and not expired)
   - after every 10 words marked known (batched)
   - manual sync button in popup
5. [ ] Add sync status to popup: "Last synced: 2 min ago" or "Sync: offline mode"
6. [ ] Manual test: two browser instances with same key, mark words on one, sync on other

### Phase 4 - Lemon Squeezy Payments - status: open

Paying creates a key. Visible result: pay → get key → paste → sync.

1. [ ] Set up Lemon Squeezy product: "Sideload Spanish Sync", 5 EUR/month subscription
2. [ ] Implement `src/webhook.js` in worker:
   - `subscription_created` → generate key, store in LICENSES KV, create account ID
   - `subscription_updated` → extend expiry
   - `subscription_expired` → mark key inactive
   - verify webhook signature
3. [ ] Create static payment/thank-you page showing the key with copy button
4. [ ] Wire key expiry checks: sync returns 403 for expired keys, extension shows "Subscription expired"
5. [ ] Implement grace period: 7 days after expiry before SYNC_DATA purge (cron or lazy check)
6. [ ] E2E test: simulated webhook → key creation → sync round-trip

### Phase 5 - Key Recovery + Rotation - status: open

Users can recover lost keys and rotate compromised keys.

1. [ ] Implement email-hash → key-hash mapping in KV (webhook stores this at payment time)
2. [ ] Create recovery page: enter email → receive key(s) via email
   - email integration: Lemon Squeezy transactional email or simple SMTP
3. [ ] Implement key rotation endpoint:
   - POST /rotate (authenticated with old key) → new key → same account ID → old key invalidated
4. [ ] Handle rotation in extension:
   - detect 401 (key invalidated) → show "Key rotated — enter new key"
   - on new key entry → pull blob with old encryption key → re-encrypt with new key → push
5. [ ] Implement PIN reset flow:
   - user sets new PIN → re-encrypts local data → pushes fresh blob
   - old server blob is replaced (unrecoverable by design)
6. [ ] Manual test: full key lifecycle — pay → use → lose key → recover → rotate → re-encrypt

### Phase 6 - Polish + Verification - status: open

All 14 spec criteria pass.

1. [ ] Update extension popup with sync-specific UI polish
2. [ ] Add "Save your key" reminder in popup when sync is active
3. [ ] Final verification against all 14 spec criteria
4. [ ] Update spec status to verified

## Verification

From spec — all must pass:

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

## Adjustments

(none yet)

## Progress Log

- 2026-04-08 00:30 — Plan created. 6 phases covering backend, crypto, sync client, payments, key lifecycle, and polish.
