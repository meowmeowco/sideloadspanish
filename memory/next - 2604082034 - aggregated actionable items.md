---
name: next - 2604082034
description: Aggregated actionable items as of 2026-04-08
type: next
---

## Prioritised Actions

### 1 - Active Plan: [[plan - 2604080030 - implement paid sync with license keys]]

**Phase 1: Sync Worker (Cloudflare)** — all unchecked
- 1.1 - Scaffold `sync-worker/` with wrangler, configure KV
- 1.2 - Key generation, hashing, validation (`src/keys.js`)
- 1.3 - Sync blob read/write (`src/sync.js`)
- 1.4 - Router (`src/index.js`): `/sync` GET/PUT, `/validate` POST
- 1.5 - Key management CLI (`scripts/create-key.js`)
- 1.6 - Deploy to Workers dev, verify with curl
- 1.7 - Integration tests for worker endpoints

**Phase 2: Client Crypto + Merge** — all unchecked
- 1.8 - Web Crypto API wrapper (`lib/crypto.js`)
- 1.9 - Client-side merge logic (`lib/merge.js`)
- 1.10 - Unit tests for crypto + merge

**Phase 3: Extension Integration** — all unchecked
- 1.11 - Sync client (`lib/sync.js`)
- 1.12 - PIN setup flow in settings
- 1.13 - License key input in popup
- 1.14 - Sync triggers in service worker
- 1.15 - Sync status in popup
- 1.16 - Manual two-browser sync test

**Phase 4: Payments (Lemon Squeezy)** — all unchecked
- 1.17 - Product setup + webhook handler + payment page
- 1.18 - Key expiry + grace period
- 1.19 - E2E test

**Phase 5: Key Recovery + Rotation** — all unchecked
- 1.20 - Recovery, rotation, PIN reset flows

**Phase 6: Polish + Verification** — all unchecked
- 1.21 - UI polish, final verification against 14 spec criteria

### 2 - Postponed (MVP plan)
- 2.1 - [p] API fallback for words not in built-in list
- 2.2 - [p] Cross-browser test: Chrome + Zen (Firefox MV3)
