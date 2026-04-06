---
tldr: Coherence report — 3 specs, 2 plans. Found contradictions in sync data model, endpoint mismatch, orphaned link, missing cross-refs.
category: core
---

# Coherence: spec graph contradictions

## Contradictions

### C1 — Sync spec contradicts itself on what gets synced

The sync spec's **Privacy Guarantee** (line 244-246) says:

> The **only** data that leaves the device during sync: the license key, a list of known English word strings (e.g. `["time", "house", "water"]`)

But the **Conflict Resolution** section (line 161) says:

> `clicked_known` count: take max(device_a, device_b) per word

And the encrypted plaintext format (line 99) shows `{ "known_words": ["time", "house", "water"], "version": 1 }` — a flat string list.

These are incompatible. Either we sync a flat word list (privacy guarantee + payload format) or we sync per-word metadata including `clicked_known` (conflict resolution). Can't be both.

Additionally: the sideload spec defines per-word state as `{ seen: number, clicked_known: number, tier: number }` and the new hover analytics plan adds meaningful `seen` tracking. The sync conflict resolution doesn't address `seen` counts at all.

**Decision needed:** What exactly is the sync payload — flat word list, or per-word record with counts?

**Resolved:** Aligned on per-word records. E2E encryption makes the payload opaque to the server regardless of structure, so there's no privacy cost. Updated: payload format (v2 with per-word records), conflict resolution (union + max on counts including `seen`), privacy guarantee (server sees opaque blob, not word list).

### C2 — Sync spec: server-side merge vs E2E encryption

The backend architecture (line 174) lists `sync.js` as containing "G-Set merge logic" in the server code. But E2E encryption (line 103-125) explicitly states:

> All merging happens client-side
> Server logic is trivial: validate key, read blob, write blob. No parsing, no merging, no knowledge of contents.

A server that can't decrypt can't merge. `sync.js` in the backend should not contain merge logic.

### C3 — Sync API endpoints: GET/PUT vs POST

The E2E protocol section (lines 108-114, 119-122) defines:

```
GET  /sync   → return stored encrypted blob
PUT  /sync   → overwrite stored encrypted blob
```

But the architecture table (line 186) defines:

```
POST /sync   → Push/pull known words (authenticated)
```

These are different API designs. The E2E section is RESTful (GET to read, PUT to write), the architecture table collapses it into one POST.

## Orphaned Links

### O1 — Truncated spec name in next snapshot

`[[spec - sideload - progressive in-page word replacement]]` in `memory/next - 2604062304` (line 24) — missing "for language learning" suffix. Actual file is `spec - sideload - progressive in-page word replacement for language learning.md`.

## Missing Cross-References

### M1 — Sideload spec doesn't reference sync spec

The sync spec declares `depends on: [[spec - sideload - progressive in-page word replacement for language learning]]` in its Interactions section. But the sideload spec has **no Interactions section at all** — it doesn't acknowledge that sync extends it, or that any other spec depends on it.

### M2 — Sideload spec doesn't reference hover analytics plan

The per-word state `{ seen: number, ... }` is defined in the sideload spec (line 50) but the spec doesn't explain what `seen` is for or how it's used. The hover analytics plan gives it meaning (struggling word detection), but the spec hasn't been updated to reflect this intent.

### M3 — No link between hover analytics plan and sync spec

If `seen` counts become meaningful (struggling word detection), the sync spec's conflict resolution needs to decide: do we sync `seen` counts? The hover analytics plan doesn't mention sync implications. The sync spec doesn't mention `seen`.

## CLAUDE.md Candidates

### CL1 — Privacy-first: no personal data leaves the device

Both specs share this principle. The sideload spec's Boundaries say "No cloud sync in MVP — local storage only." The sync spec adds "No browsing data ever leaves the device" and "No server-side analytics on user behavior." This is a project-wide architectural constraint worth codifying.

### CL2 — IndexedDB as the local persistence layer

Both specs rely on IndexedDB. The sideload spec defines the data model, the sync spec merges into it. Worth stating once in CLAUDE.md as the canonical local storage choice.

## Summary

- 3 specs analysed (seed, sideload, sync)
- 2 plans cross-referenced
- 3 contradictions found (all within sync spec)
- 1 orphaned link
- 3 missing cross-references
- 2 CLAUDE.md candidates
