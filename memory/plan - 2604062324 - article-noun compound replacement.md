---
tldr: Replace "the + noun" as a single unit with correct Spanish article + noun (la casa, el libro)
status: active
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

### Phase 2 - Bigram Replacer - status: open

Replacer detects "the + noun" and replaces as a unit. Visible result: "the house" → "la casa" on a page.

1. [ ] Implement bigram scanning in `replacer.js` — before single-word pass, scan text nodes for `the/a/an + <known noun>` patterns
   - tokenise text, look ahead one token when current token is an article
   - if next token is a known noun: mark both for compound replacement
   - if next token is not a known noun: skip the article entirely
2. [ ] Generate correct article from gender: "the" + masculine → "el", "the" + feminine → "la"; "a/an" + masculine → "un", "a/an" + feminine → "una"
3. [ ] Update replacement span to cover both tokens — single `<span class="sideload-word">` wrapping "la casa"
   - `data-original` stores "the house" (full original)
   - `data-es` stores "la casa"
4. [ ] Handle edge cases:
   - "The" at sentence start → capitalise "La" / "El"
   - Multiple articles: "the big house" → only replace "the house" if "big" is not in vocab, or skip compound if intervening word exists
   - Possessives and demonstratives (my, this, that) → don't trigger compound (only "the", "a", "an")
5. [ ] Manual test: load extension, find "the house" on a page, confirm it becomes "la casa" as one unit

### Phase 3 - Tooltip + Progress for Compounds - status: open

Tooltip and progress tracking work correctly for compound replacements.

1. [ ] Update `tooltip.js` to display compound info: "the house → la casa (feminine)"
   - show gender as part of the tooltip
2. [ ] Update progress tracking — compound counts as the noun being "seen", not the article
   - clicking "la casa" marks "house/casa" as known, not "the"
3. [ ] Update popup dashboard — word counts should not double-count (compound = 1 word, not 2)
4. [ ] Manual test: hover compound → see original phrase + gender; click → marks noun as known

### Phase 4 - Spec Update + Cleanup - status: open

Spec reflects the new behaviour.

1. [ ] Update [[spec - sideload - progressive in-page word replacement for language learning]] — add compound replacement behaviour, gender field in data model, article handling rules
2. [ ] Update sync spec payload example to include `gender` field
3. [ ] Verify no regressions: single-word replacement still works for non-noun words (verbs, adjectives, adverbs)

## Verification

- [ ] "the house" → "la casa" (single span, correct feminine article)
- [ ] "the book" → "el libro" (correct masculine article)
- [ ] "a cat" → "un gato" (masculine indefinite)
- [ ] "a table" → "una mesa" (feminine indefinite)
- [ ] "The city" at sentence start → "La ciudad" (capitalised)
- [ ] Standalone "the" without a following known noun → left as "the"
- [ ] Tooltip shows "the house → la casa (feminine)" on hover
- [ ] Click on compound marks the noun as known, not the article
- [ ] Single-word replacement (verbs, adjectives) still works unchanged
- [ ] No double-counting in progress dashboard

## Adjustments

(none yet)

## Progress Log

- 2026-04-06 23:24 — Plan created. Current vocab has no gender info and replacer is word-by-word only.
- 2026-04-06 23:50 — Phase 1 complete. 1910 nouns with gender assigned, standalone articles removed. scripts/assign-gender.py created for reproducibility.
