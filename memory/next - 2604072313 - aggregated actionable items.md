# next - 2604072313 - aggregated actionable items

## 1 - Active Plan: [[plan - 2604062324 - article-noun compound replacement]]

Phase 2 (Bigram Replacer) — 1 remaining:
- 1.1 - Manual test: load extension, find "the house" → "la casa" (E2E tests already pass, but manual smoke test pending)

Phase 3 (Tooltip + Progress for Compounds) — 4 items:
- 1.2 - Update tooltip.js for compound info display
- 1.3 - Update progress tracking (compound = noun, not article)
- 1.4 - Update popup dashboard (no double-counting)
- 1.5 - Manual test: hover/click compound behaviour

Phase 4 (Spec Update + Cleanup) — 3 items:
- 1.6 - Update sideload spec with compound replacement behaviour
- 1.7 - Update sync spec payload example with gender field
- 1.8 - Verify no regressions on single-word replacement

## 2 - Active Plan: [[plan - 2604062309 - hover analytics and struggling word detection]]

Phase 1 (Wire Hover Counting) — 2 items:
- 2.1 - Wire recordSeen() to tooltip mouseover handler
- 2.2 - Verify seen count in DevTools

Phase 2 (Show Seen Count in Tooltip) — 3 items
Phase 3 (Struggling Word Detection) — 4 items
Phase 4 (Dashboard Integration) — 4 items
Phase 5 (Smarter Progression Signals) — 4 items

## 3 - Active Plan: [[plan - 2604061315 - build sideload browser extension mvp]]

Phase 3 (Tier System) — 1 remaining:
- 3.1 - Manual test: tier progression

Phase 4 (Popup Dashboard) — 1 remaining:
- 3.2 - Manual test: popup accuracy + settings

Phase 5 (Dynamic Content + Polish) — 7 items:
- 3.3 - MutationObserver for dynamic content
- 3.4 - Domain blacklist check
- 3.5 - Proper noun / URL / email exclusion heuristics
- 3.6 - Performance pass
- 3.7 - lib/translator.js (API fallback)
- 3.8 - Cross-browser test (Chrome + Zen)
- 3.9 - Final verification

## 4 - Spec Verification: [[spec - sync - mullvad-model paid sync with license keys]]

- 4.1 - 14 acceptance criteria unchecked (future — no active plan yet)
