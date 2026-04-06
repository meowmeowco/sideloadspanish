# plan - 2604061315 - build sideload browser extension mvp

status: active

## Context

Implements [[spec - sideload - progressive in-page word replacement for language learning]].

Chrome/Zen MV3 extension. English → Spanish inline word replacement on web pages. Frequency tiers (A1→C1), hybrid vocab, IndexedDB progress, popup dashboard. Vanilla JS/TS, no frameworks.

## Phases

### Phase 1: Skeleton + First Replacement (status: active)

Get a loadable extension that replaces at least one word on a page. Visible result: load extension in Chrome, visit any page, see a Spanish word.

1. [x] Scaffold MV3 extension structure: `manifest.json`, service worker stub, content script entry, popup shell
   - => manifest.json, service-worker.js (message routing), popup shell, tooltip stub, styles.css
2. [x] Create a minimal vocabulary seed — 50 tier-1 words in `data/vocabulary.json` with schema `{ en, es, tier }`
   - => 50 A1-level words (the, is, time, house, etc.)
3. [x] Implement `lib/storage.js` — IndexedDB wrapper: `init()`, `getProgress()`, `markKnown(word)`, `getSettings()`
   - => two object stores: words (keyed by en) and settings (key-value). Also has recordSeen(), resetProgress()
4. [x] Implement `content/replacer.js` — walk text nodes, match against vocab Map, replace with `<span class="sideload-word">`, skip excluded elements (`code`, `pre`, `script`, `style`, `input`, `textarea`)
   - => TreeWalker + batched DOM replacement. Excludes proper nouns, URLs, emails. requestIdleCallback for non-blocking init.
5. [x] Add `content/styles.css` — base styling for `.sideload-word` (subtle highlight/underline)
   - => dotted orange underline, green for known state, hover highlight
6. [ ] Manual smoke test: load unpacked in Chrome, visit a news site, confirm words are replaced and styled

### Phase 2: Tooltip + Click-to-Know (status: open)

User can interact with replaced words. Visible result: hover shows original, click marks known.

1. [ ] Implement `content/tooltip.js` — hover handler shows floating tooltip (original word, tier label), click handler dispatches "known" event
2. [ ] Wire click → `storage.js` `markKnown()` — persist per-word state in IndexedDB
3. [ ] Add visual feedback on click (brief animation or style change to confirm "known")
4. [ ] Handle edge cases: tooltip positioning near viewport edges, dismiss on scroll/click-outside
5. [ ] Manual test: hover reveals original, click persists across page reload

### Phase 3: Tier System + Density Scaling (status: open)

Difficulty progression works. Visible result: as words are marked known, new tier unlocks and more words appear.

1. [ ] Expand `data/vocabulary.json` to full ~5000 words across 5 tiers (source a frequency list, curate, format)
2. [ ] Implement `lib/tiers.js` — tier unlock logic (≥80% known in current tier), density calculator (5%→30% scaling)
3. [ ] Update `replacer.js` to filter by unlocked tiers and apply density sampling
4. [ ] Update `storage.js` with aggregate progress queries (words known per tier, overall %)
5. [ ] Manual test: mark enough tier-1 words → tier 2 unlocks → new words appear → density increases

### Phase 4: Popup Dashboard + Settings (status: open)

User has a control panel. Visible result: click extension icon, see progress and settings.

1. [ ] Build `popup/popup.html` + `popup.css` — layout for progress display and settings controls
2. [ ] Implement `popup/popup.js` — read progress from IndexedDB, render current tier, % completion, words known, tier bar chart
3. [ ] Add settings UI: global toggle, density slider, domain blacklist input, reset progress button
4. [ ] Wire settings to `storage.js` and `background/service-worker.js` — broadcast setting changes to active tabs
5. [ ] Implement per-tab toggle via service worker messaging
6. [ ] Manual test: popup reflects accurate progress, settings changes take immediate effect

### Phase 5: Dynamic Content + Polish (status: open)

Extension works on modern web apps. Visible result: infinite scroll pages get replacement too.

1. [ ] Add MutationObserver in `replacer.js` — observe `childList` + `subtree` on `document.body`, re-run replacement on new nodes
2. [ ] Implement domain blacklist check — skip content script injection on blacklisted domains
3. [ ] Add proper noun / URL / email exclusion heuristics in replacer
4. [ ] Performance pass: batch DOM writes, `requestIdleCallback` for initial scan, profile on heavy pages
5. [ ] Implement `lib/translator.js` — optional API fallback for words not in built-in list, with local cache
6. [ ] Cross-browser test: verify on Chrome and Zen (Firefox-based MV3 compatibility)
7. [ ] Final verification against all spec criteria

## Verification

Drawn from the spec's verification checklist — all must pass before plan is `completed`:

- [ ] Content script replaces words on a plain HTML page with known vocabulary
- [ ] Hover tooltip shows original word and tier
- [ ] Click marks word as known; progress persists across page reloads
- [ ] Tier advancement triggers when ≥80% of tier words are known
- [ ] Replacement density increases with tier level
- [ ] `<code>`, `<pre>`, inputs, and proper nouns are never replaced
- [ ] MutationObserver catches dynamically added content
- [ ] Extension popup shows accurate progress dashboard
- [ ] Toggle on/off works per-tab and globally
- [ ] Domain blacklist prevents replacement on listed sites
- [ ] Performance: no visible page render delay on typical pages

## Progress Log

- 2026-04-06 13:15 — Plan created. Spec is draft-complete. Ready to start Phase 1.
- 2026-04-06 13:20 — Phase 1 actions 1-5 complete. Extension scaffolded with manifest, service worker, storage, replacer, styles. Ready for smoke test.

## Adjustments

(none yet)
