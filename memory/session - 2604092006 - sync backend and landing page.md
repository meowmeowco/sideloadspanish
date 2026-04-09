---
tldr: Implemented full Fermyon Spin sync backend, client crypto/merge, extension integration, Lemon Squeezy payments, key lifecycle, vouch system, landing page at loadlang.com
---

# Session — 2026-04-09 — Sync Backend + Landing Page

## What happened

### Sync Backend (Fermyon Spin) — Phases 1-6

Built the complete paid sync system in a single session:

1. **Phase 1 — Backend Skeleton**: Scaffolded `sync-worker/` with Spin 3.3, TypeScript, itty-router. KV prefix strategy (`license:`, `sync:`, `email:`, `claim:`) on single default store. Endpoints: GET/PUT `/sync`, POST `/validate`, `/webhook`, `/rotate`, `/recover`, GET `/claim`, `/thank-you`. Auth middleware with lazy grace period purge.

2. **Phase 2 — Client Crypto**: `lib/crypto.js` — PBKDF2 key derivation (license_key + PIN, salt = account_id, 100k iterations) → AES-256-GCM encrypt/decrypt via Web Crypto API.

3. **Phase 3 — Sync Client**: `lib/sync.js` (pull/push/syncFull), `lib/merge.js` (G-Set CRDT: union on words, OR/max/min on fields). Service worker extended with SYNC message handler, batched triggers (every 10 markKnown), startup sync, 60s debounce. Popup UI: license key input, PIN setup, sync status, manual sync, key reminder.

4. **Phase 4 — Payments**: Lemon Squeezy webhook handler with HMAC-SHA256 signature verification. Claim token flow: webhook stores `claim:{token} → key`, thank-you page polls `/claim?token=xxx` for one-time key retrieval.

5. **Phase 5 — Key Recovery + Rotation**: POST `/rotate` (old key auth → new key, same account_id, old key invalidated). POST `/recover` (email hash lookup). Extension handles 401 → "Key rotated". PIN reset: new PIN → re-encrypt → push fresh blob.

6. **Phase 6 — Polish + Verification**: All 14 spec criteria verified. Spec status → verified. Plan status → completed.

**Total: 115 tests (72 extension + 43 sync-worker), all passing.**

### Vouch System

Integrated mitchellh/vouch for contributor trust management:
- `.github/VOUCHED.td` with `github:nycterent`
- 3 GitHub Actions workflows: check-pr, check-issue, manage-by-issue

### Repository Setup

- Created `meowmeowco/sideloadspanish` on GitHub (initially private, flipped public for GitHub Pages)
- Pushed all branches

### Landing Page

- `docs/index.html` — 12KB static page at loadlang.com
- Self-replacing hero: Spanish words with extension-matching tooltips (dotted underline, positioned above, structured lines)
- Sections: hero, features, pricing (free vs 5 EUR/mo sync), privacy, footer
- Deployed via GitHub Pages with Cloudflare DNS (CNAME → meowmeowco.github.io)
- DNS setup automated via one-time GitHub Actions workflow using CLOUDFLARE_DNS_TOKEN secret

## Artifacts created

- `sync-worker/` — complete Fermyon Spin backend (12 source files)
- `sideload/lib/crypto.js`, `merge.js`, `sync.js` — client modules
- `sideload/background/service-worker.js` — extended with sync engine
- `sideload/popup/` — sync UI section
- `docs/index.html`, `docs/CNAME` — landing page
- `.github/VOUCHED.td` — vouch list
- `.github/workflows/` — vouch + DNS workflows
- `eidos/spec - landing - static marketing page for loadlang.md`
- `memory/next - 2604082034 - aggregated actionable items.md`

## Decisions

- Fermyon Spin over Cloudflare Workers (user choice)
- Single KV store with key prefixes (Spin limitation → design decision)
- Lazy grace period purge (no cron in Spin)
- Claim token pattern for key delivery (webhook async → thank-you page polls)
- GitHub Pages over Cloudflare Pages (user choice, required public repo)
- Vouch system for contributor gating (mitchellh/vouch)

## Open threads

- Chrome Web Store listing URL needed (CTA placeholders `#install`)
- Lemon Squeezy product not yet created (CTA placeholder `#sync`)
- Sync API URL hardcoded to `127.0.0.1:3000` — needs production URL after `spin cloud deploy`
- `subscription_updated`/`expired` webhook handlers acknowledge only — need subscription_id → key_hash mapping for full lifecycle
- Rotated Cloudflare token should be verified
- Uncommitted changes on main: sync-worker/, vouch files, crypto/merge/sync libs, service worker changes, popup changes, spec updates
