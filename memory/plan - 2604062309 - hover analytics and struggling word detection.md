---
tldr: Wire hover counting, surface seen-count in tooltip, detect struggling words, use signals for smarter progression
status: active
---

# Plan: Hover Analytics and Struggling Word Detection

## Context

- Spec: [[spec - sideload - progressive in-page word replacement for language learning]]
- Parent plan: [[plan - 2604061315 - build sideload browser extension mvp]]
- Sync implications: [[spec - sync - mullvad-model paid sync with license keys]] — `seen` counts sync cross-device via per-word records (resolved in coherence C1)

The spec already defines per-word state as `{ seen: number, clicked_known: number, tier: number }` and `recordSeen()` exists in storage but is never called. This plan wires that signal, makes it visible, and uses it to detect words the user is struggling with — providing a feedback loop that pure click-to-known misses.

**Key insight:** A word hovered 10+ times without being marked known is a struggling word. That's a learning signal no flashcard app captures.

## Phases

### Phase 1 - Wire Hover Counting - status: open

Get `recordSeen()` firing on every hover. No UI change yet — just data collection.

1. [ ] Add `SideloadStorage.recordSeen(word, tier)` call in `tooltip.js` mouseover handler
   - call inside `showTooltip()` after the tooltip is displayed
   - debounce: only count once per word per page load (use a `Set` of already-counted words)
   - this prevents inflated counts from mouse wiggling
2. [ ] Verify in DevTools: open IndexedDB → sideload → words store → confirm `seen` increments on hover

### Phase 2 - Show Seen Count in Tooltip - status: open

User can see how many times they've encountered a word. Visible result: tooltip shows "Seen 7 times".

1. [ ] Fetch word record from storage when showing tooltip (`getWordProgress(word)`)
   - need to add a content-script-accessible path for single-word lookup via messaging
2. [ ] Add seen count line to tooltip UI: "Seen N times" (below tier, above action hint)
   - only show if seen > 1 (don't clutter first encounter)
3. [ ] Manual test: hover a word multiple times across page reloads, confirm count is accurate in tooltip

### Phase 3 - Struggling Word Detection - status: open

Identify words the user keeps seeing but can't mark known. Visible result: struggling words get distinct styling.

1. [ ] Implement `lib/struggling.js` — logic to classify a word as "struggling"
   - threshold: seen >= 10 AND not marked known
   - expose `isStruggling(wordRecord)` and `getStrugglingWords(progress)`
   - make threshold configurable via settings (default: 10)
2. [ ] Add visual indicator for struggling words in replacer
   - different highlight colour or icon (e.g. subtle red underline vs orange)
   - CSS class: `sideload-word--struggling`
3. [ ] Update tooltip for struggling words — show hint like "Having trouble? Try writing this word down"
4. [ ] Manual test: hover a word 10+ times without clicking known → verify styling changes and tooltip updates

### Phase 4 - Dashboard Integration - status: open

Popup shows struggling words and hover analytics. Visible result: "Words you're struggling with" section in popup.

1. [ ] Add `getStrugglingWords()` query to service worker — returns words matching struggling criteria
2. [ ] Add "Struggling Words" section to popup dashboard
   - list of words with seen count and translation
   - click a word to mark it known (same as in-page click)
   - cap display at 20 words, sorted by seen count descending
3. [ ] Add "Most Seen" mini-stat to popup header (e.g. "Most encountered: 'tiempo' — 23 times")
4. [ ] Manual test: popup reflects accurate struggling words list, marking known from popup removes from list

### Phase 5 - Smarter Progression Signals - status: open

Use hover data to influence tier progression. Visible result: struggling words factor into tier unlock readiness.

1. [ ] Update `tiers.js` — add optional "readiness" check alongside the 80% threshold
   - if > 5 struggling words exist in current tier, show a warning but don't block unlock
   - rationale: don't punish users, but surface that they might want to review
2. [ ] Add "Tier readiness" indicator to popup tier bars
   - green: 80%+ known, few struggling words
   - yellow: 80%+ known, but 5+ struggling words ("You might want to review these")
   - grey: below 80%
3. [ ] Update spec with hover analytics behaviour and struggling word definition
4. [ ] Manual test: full flow — hover words, mark some known, verify struggling detection, tier readiness indicators

## Verification

- [ ] Hover on a replaced word increments `seen` count in IndexedDB (debounced per page load)
- [ ] Tooltip shows "Seen N times" for words encountered more than once
- [ ] Words seen 10+ times without marking known get `sideload-word--struggling` styling
- [ ] Popup dashboard shows "Struggling Words" section with accurate data
- [ ] Marking a struggling word as known removes it from the struggling list
- [ ] Tier readiness indicator reflects struggling word count
- [ ] No performance regression — hover tracking doesn't cause visible lag

## Adjustments

(none yet)

## Progress Log

- 2026-04-06 23:09 — Plan created. recordSeen() exists in storage layer but is unwired. Tooltip mouseover handler is the hook point.
