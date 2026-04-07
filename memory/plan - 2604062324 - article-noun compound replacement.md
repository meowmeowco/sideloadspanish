---
tldr: Replace "the + noun" as a single unit with correct Spanish article + noun (la casa, el libro)
status: completed
---

# Plan: Article-Noun Compound Replacement

## Context

- Spec: [[spec - sideload - progressive in-page word replacement for language learning]]
- Parent plan: [[plan - 2604061315 - build sideload browser extension mvp]]

**Problem:** The replacer treats every word independently. "the house" becomes two separate replacements — "the"→"el" and "house"→"casa" — producing "el casa" (wrong gender) or mixed "the casa" / "el house". Articles and nouns must be replaced together as a unit, with the correct gendered article.

**Design:**
- Vocabulary entries for nouns gain a `gender` field: `"m"` or `"f"`
- Replacer scans for `the + <known noun>` bigrams before single-word replacement
- When found: replace both tokens with `<article> <noun>` using correct gender (el/la)
- Standalone "the" without a following known noun: leave unreplaced (no correct translation without context)
- "a/an + noun" follows same pattern: un/una
- Tooltip for compound replacements shows both original tokens: "the house → la casa"

## Phases

### Phase 1 - Data Model: Add Gender to Nouns - status: completed

Vocabulary knows noun genders. Visible result: vocabulary.json has gender field on nouns.

1. [x] Add `gender` field to vocabulary schema: `"m"` | `"f"` | `null` (null for non-nouns)
   - => updated spec with schema change and article-pairing rationale
2. [x] Update all nouns in `data/vocabulary.json` with correct Spanish gender
   - => created scripts/assign-gender.py with Spanish gender rules + exception lists
   - => 1051 masculine, 859 feminine, 1751 non-nouns (verbs, adjectives, adverbs, function words)
   - => gender-ambiguous words (estudiante, cantante, juez) left as null — correct, article depends on person
   - => key fix: exception lists checked BEFORE verb detection (lugar/hogar/mujer end in -ar/-er but are nouns)
3. [x] Remove standalone "the" entry from vocabulary (it will be handled by compound logic)
   - => removed "the" and "an" entries (2 removed, 3661 remaining)

### Phase 2 - Bigram Replacer - status: completed

Replacer detects "the + noun" and replaces as a unit. Visible result: "the house" → "la casa" on a page.

1. [x] Implement bigram scanning in `replacer.js` — before single-word pass, scan text nodes for `the/a/an + <known noun>` patterns
   - => two-pass approach: first collect all word positions, then detect article+noun bigrams
   - => only compounds when noun has gender AND only whitespace separates article from noun
   - => standalone articles without following noun are skipped entirely
2. [x] Generate correct article from gender: "the" + masculine → "el", "the" + feminine → "la"; "a/an" + masculine → "un", "a/an" + feminine → "una"
   - => getSpanishArticle() helper function
3. [x] Update replacement span to cover both tokens — single `<span class="sideload-word">` wrapping "la casa"
   - => data-original="the house", data-es="la casa", data-noun="house" (for progress), data-gender="f"
4. [x] Handle edge cases:
   - => "The" at sentence start → capitalises "La" / "El" via isCapitalised check
   - => "the big house" → no compound (intervening word detected via whitespace-only gap check)
   - => only "the", "a", "an" trigger compounds (ARTICLES set)
   - => tooltip shows gender (♀ feminine / ♂ masculine) for nouns
   - => click on compound marks the noun as known (data-noun), not the article
5. [x] Manual test: load extension, find "the house" on a page, confirm it becomes "la casa" as one unit
   - => covered by E2E Playwright tests (14 passing, including compound assertions)

### Phase 3 - Tooltip + Progress for Compounds - status: completed

Tooltip and progress tracking work correctly for compound replacements.

1. [x] Update `tooltip.js` to display compound info: "the house → la casa (feminine)"
   - => implemented in Phase 2 — tooltip shows original, translation, and gender (♀/♂)
2. [x] Update progress tracking — compound counts as the noun being "seen", not the article
   - => data-noun attribute on compound spans, tooltip click handler uses it
3. [x] Update popup dashboard — word counts should not double-count (compound = 1 word, not 2)
   - => verified: popup counts from vocab totals and known set, no double-counting
4. [x] Manual test: hover compound → see original phrase + gender; click → marks noun as known
   - => E2E tests: "tooltip shows gender on hover" + "clicking compound marks noun as known"

### Phase 4 - Spec Update + Cleanup - status: completed

Spec reflects the new behaviour.

1. [x] Update [[spec - sideload - progressive in-page word replacement for language learning]] — add compound replacement behaviour, gender field in data model, article handling rules
   - => added "Article-Noun Compound Replacement" section to spec
2. [x] Update sync spec payload example to include `gender` field
   - => added gender field to payload example in sync spec
3. [x] Verify no regressions: single-word replacement still works for non-noun words (verbs, adjectives, adverbs)
   - => 29/29 tests passing (15 unit + 14 E2E), replacement.spec.js covers single-word cases

## Verification

- [x] "the house" → "la casa" (single span, correct feminine article)
- [x] "the book" → "el libro" (correct masculine article)
- [x] "a cat" → "un gato" (masculine indefinite)
- [x] "a table" → "una mesa" (feminine indefinite)
- [x] "The city" at sentence start → "La ciudad" (capitalised)
- [x] Standalone "the" without a following known noun → left as "the"
- [x] Tooltip shows "the house → la casa (feminine)" on hover
- [x] Click on compound marks the noun as known, not the article
- [x] Single-word replacement (verbs, adjectives) still works unchanged
- [x] No double-counting in progress dashboard

All verified by Playwright E2E tests (14 passing) + Vitest unit tests (15 passing).

## Adjustments

(none yet)

## Progress Log

- 2026-04-06 23:24 — Plan created. Current vocab has no gender info and replacer is word-by-word only.
- 2026-04-06 23:50 — Phase 1 complete. 1910 nouns with gender assigned, standalone articles removed. scripts/assign-gender.py created for reproducibility.
- 2026-04-06 23:58 — Phase 2 actions 1-4 complete. Bigram replacer, article generation, compound spans, edge cases, tooltip gender display, and click-marks-noun-not-article all implemented. Ready for manual test.
- 2026-04-07 23:17 — Plan complete. All phases done. Phase 3 was covered by Phase 2 implementation. Phase 4 spec updates committed. 29/29 tests passing. Verification checklist all green.
