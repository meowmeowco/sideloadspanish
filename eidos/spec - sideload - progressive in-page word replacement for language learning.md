# spec - sideload - progressive in-page word replacement for language learning

status: draft

## Problem

Learning a language requires constant exposure to vocabulary in context. Traditional flashcard apps are disconnected from real reading. Learners need a way to encounter target-language words naturally, embedded in content they already consume.

## Solution

A Chrome/Zen browser extension that replaces English words on web pages with their Spanish equivalents. Replacements scale in volume and difficulty based on the user's progress through frequency tiers — beginners see a few common words swapped; advanced users see many.

## Behaviour

### Word Replacement

- The content script scans visible text nodes on any web page
- Eligible English words are replaced **inline** with their Spanish translation
- Replaced words are visually distinct (highlight or underline) so the user knows they're learning material
- **Hover** on a replaced word reveals a tooltip with: the original English word, a short definition, and the frequency tier
- **Click** on a replaced word marks it as "known" (advances mastery for that word)
- Replacement happens after DOM load; new content (infinite scroll, SPA navigation) is observed via MutationObserver
- Words inside `<code>`, `<pre>`, `<script>`, `<style>`, `<input>`, `<textarea>` are never replaced
- Proper nouns, URLs, and email addresses are excluded

### Vocabulary Source (Hybrid)

- Ship a **built-in frequency list** of the top ~5000 English-Spanish word pairs, tagged by tier
- For words not in the built-in list, optionally query a **translation API** (e.g. Google Translate, LibreTranslate) at runtime
- API lookups are cached locally to avoid repeated calls
- The built-in list is the primary source; API is a fallback, not a requirement

### Frequency Tiers

| Tier | Label | Approx. words | Description |
|------|-------|---------------|-------------|
| 1 | A1 - Beginner | 1-500 | Most common everyday words |
| 2 | A2 - Elementary | 501-1200 | Basic conversational vocabulary |
| 3 | B1 - Intermediate | 1201-2500 | Functional fluency words |
| 4 | B2 - Upper Intermediate | 2501-4000 | Nuanced expression |
| 5 | C1 - Advanced | 4001-5000+ | Sophisticated / low-frequency |

- User starts at tier 1
- Tier advancement: when ≥80% of words in the current tier are marked "known", the next tier unlocks
- Words from all unlocked tiers are eligible for replacement
- **Replacement density** increases with tier: tier 1 replaces ~5% of eligible words on a page, scaling up to ~30% at tier 5

### Progress Tracking

- Per-word state: `{ seen: number, clicked_known: number, tier: number }`
- Aggregate state: `{ current_tier: number, words_known: number, words_total: number, tier_progress_pct: number }`
- Stored in **IndexedDB** (local only for MVP)
- A simple **progress dashboard** accessible from the extension popup:
  - Current tier and % completion
  - Total words known vs. available
  - Words learned today / this week
  - Bar chart of tier completion

### Settings

- **Toggle on/off** per tab or globally
- **Replacement density** slider (override the default per-tier density)
- **Blacklist domains** where replacement should never run
- **Reset progress** (with confirmation)

## Architecture

### Manifest V3 — Vanilla JS/TS

```
sideload/
  manifest.json          # MV3 manifest
  background/
    service-worker.js    # Extension lifecycle, message routing
  content/
    replacer.js          # DOM scanning, word replacement, MutationObserver
    tooltip.js           # Hover/click UI for replaced words
    styles.css           # Replaced-word styling
  popup/
    popup.html           # Extension popup (progress + settings)
    popup.js
    popup.css
  data/
    vocabulary.json      # Built-in frequency list (en→es, tiered)
  lib/
    storage.js           # IndexedDB wrapper for progress
    tiers.js             # Tier logic, advancement rules
    translator.js        # API fallback for unknown words
```

### Data Flow

1. Page loads → content script injects
2. `replacer.js` walks text nodes, tokenises words
3. Each word checked against `vocabulary.json` (filtered by unlocked tiers)
4. Eligible words replaced with `<span class="sideload-word" data-original="..." data-tier="...">traduccion</span>`
5. `tooltip.js` attaches hover/click listeners to `.sideload-word` elements
6. Click → "known" event sent to `storage.js` → progress updated
7. MutationObserver watches for new DOM nodes → re-runs replacement on additions

### Performance Constraints

- Replacement must not block page render — run after `DOMContentLoaded` or `requestIdleCallback`
- Batch DOM mutations (don't replace word-by-word; collect all replacements, apply in one pass)
- Vocabulary lookup via a `Map` (O(1)) loaded once at content script init
- API fallback is async and non-blocking; if slow, the word stays English

## Interactions

- **depends on**: browser extension APIs (MV3), IndexedDB
- **optional dependency**: translation API for hybrid vocab fallback
- **future**: cloud sync service for cross-device progress (out of MVP scope)

## Verification

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

## Boundaries

- **Not** a flashcard app — no standalone drill mode in MVP
- **Not** a full translator — only replaces individual words, not phrases or sentences
- **Not** multi-language in MVP — English → Spanish only
- **No** cloud sync in MVP — local storage only
- **No** grammar or conjugation awareness — replaces base forms only
