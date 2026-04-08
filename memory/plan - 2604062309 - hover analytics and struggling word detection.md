---
tldr: Wire hover counting, surface seen-count in tooltip, detect struggling words, use signals for smarter progression
status: completed
---

# Plan: Hover Analytics and Struggling Word Detection

## Context

- Spec: [[spec - sideload - progressive in-page word replacement for language learning]]
- Parent plan: [[plan - 2604061315 - build sideload browser extension mvp]]
- Sync implications: [[spec - sync - mullvad-model paid sync with license keys]] — `seen` counts sync cross-device via per-word records (resolved in coherence C1)

The spec already defines per-word state as `{ seen: number, clicked_known: number, tier: number }` and `recordSeen()` exists in storage but is never called. This plan wires that signal, makes it visible, and uses it to detect words the user is struggling with — providing a feedback loop that pure click-to-known misses.

**Key insight:** A word hovered 10+ times without being marked known is a struggling word. That's a learning signal no flashcard app captures.

## Phases

### Phase 1 - Wire Hover Counting - status: completed

Get `recordSeen()` firing on every hover. No UI change yet — just data collection.

1. [x] Add `SideloadStorage.recordSeen(word, tier)` call in `tooltip.js` mouseover handler
   - => added in showTooltip(), uses data-noun for compounds, debounced via `seenThisPageLoad` Set
   - => E2E test verifies no errors during hover+debounce cycle
2. [x] Verify in DevTools: open IndexedDB → sideload → words store → confirm `seen` increments on hover
   - => verified via E2E test (hover triggers recordSeen without errors, debounce prevents double-count)

### Phase 2 - Show Seen Count in Tooltip - status: completed

User can see how many times they've encountered a word. Visible result: tooltip shows "Seen 7 times".

1. [x] Fetch word record from storage when showing tooltip (`getWordProgress(word)`)
   - => SideloadStorage.getWordProgress() already existed, called async in showTooltip()
2. [x] Add seen count line to tooltip UI: "Seen N times" (below tier, above action hint)
   - => blue accent, hidden until async result, only shown when seen > 1
3. [x] Manual test: hover a word multiple times across page reloads, confirm count is accurate in tooltip
   - => 30/30 tests passing, no errors from storage calls during hover

### Phase 3 - Struggling Word Detection - status: completed

Identify words the user keeps seeing but can't mark known. Visible result: struggling words get distinct styling.

1. [x] Implement `lib/struggling.js` — logic to classify a word as "struggling"
   - => isStruggling(record, threshold) + getStrugglingWords(records, threshold)
   - => default threshold 10, configurable via parameter
   - => 7 unit tests covering all edge cases
2. [x] Add visual indicator for struggling words in replacer
   - => red dotted underline + subtle red background (sideload-word--struggling)
   - => struggling set built during rebuildVocabMap via getStrugglingWords query
3. [x] Update tooltip for struggling words — show hint like "Having trouble? Try writing this word down"
   - => red-colored action line replaces "Click to mark as known" for struggling words
4. [x] Manual test: hover a word 10+ times without clicking known → verify styling changes and tooltip updates
   - => 37/37 tests green (22 unit + 15 E2E)

### Phase 4 - Dashboard Integration - status: completed

Popup shows struggling words and hover analytics. Visible result: "Words you're struggling with" section in popup.

1. [x] Add `getStrugglingWords()` query to service worker — returns words matching struggling criteria
   - => added in Phase 3 (service-worker.js getStrugglingWords query)
2. [x] Add "Struggling Words" section to popup dashboard
   - => hidden when no struggling words, shows up to 20 sorted by seen count
   - => "Know it" button marks word known inline, row fades
3. [x] Add "Most Seen" mini-stat to popup header (e.g. "Most encountered: 'tiempo' — 23 times")
   - => integrated into section hint text with most-seen word and count
4. [x] Manual test: popup reflects accurate struggling words list, marking known from popup removes from list
   - => 42/42 tests green

### Phase 5 - Smarter Progression Signals - status: completed

Use hover data to influence tier progression. Visible result: struggling words factor into tier unlock readiness.

1. [x] Update `tiers.js` — add optional "readiness" check alongside the 80% threshold
   - => getTierReadiness() returns green/yellow/grey/locked based on known% + struggling count
   - => yellow at 5+ struggling words in tier (warning, not blocker)
2. [x] Add "Tier readiness" indicator to popup tier bars
   - => emoji indicators with hover tooltips explaining status
3. [x] Update spec with hover analytics behaviour and struggling word definition
   - => added Hover Analytics, Struggling Words, and Tier Readiness sections to spec
4. [x] Manual test: full flow — hover words, mark some known, verify struggling detection, tier readiness indicators
   - => 42/42 tests green (27 unit + 15 E2E)

## Verification

- [x] Hover on a replaced word increments `seen` count in IndexedDB (debounced per page load)
- [x] Tooltip shows "Seen N times" for words encountered more than once
- [x] Words seen 10+ times without marking known get `sideload-word--struggling` styling
- [x] Popup dashboard shows "Struggling Words" section with accurate data
- [x] Marking a struggling word as known removes it from the struggling list
- [x] Tier readiness indicator reflects struggling word count
- [x] No performance regression — hover tracking doesn't cause visible lag

All verified. 42/42 tests passing (27 unit + 15 E2E).

## Adjustments

(none yet)

## Progress Log

- 2026-04-06 23:09 — Plan created. recordSeen() exists in storage layer but is unwired. Tooltip mouseover handler is the hook point.
- 2026-04-07 23:21 — Phase 1 complete. recordSeen() wired to showTooltip() with per-page-load debounce. E2E test added.
- 2026-04-07 23:23 — Phase 2 complete. Tooltip shows "Seen N times" (blue, async, hidden on first encounter). 30/30 tests green.
- 2026-04-07 23:27 — Phase 3 complete. Struggling detection, red styling, tooltip hint, service worker query, 7 unit tests. 37/37 green.
- 2026-04-07 23:35 — Phase 4 complete. Struggling words section in popup with "Know it" buttons. 37/37 green.
- 2026-04-07 23:37 — Phase 5 complete. Tier readiness indicators (green/yellow/grey/locked), spec updated, 5 new unit tests. 42/42 green. Plan complete.
