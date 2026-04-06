---
tldr: reloading page loses known word status — words marked as known revert to unknown on page reload
category: bug
---

# Todo: reloading page loses known word status

Words clicked as "known" don't persist visually across page reloads. The IndexedDB write in `markKnown()` likely works, but `replacer.js` doesn't read per-word known state back when re-rendering replacement spans.

Related files:
- `sideload/content/replacer.js` — builds replacement spans but doesn't check known status
- `sideload/lib/storage.js` — `getWordProgress()` exists but isn't called during replacement
- `sideload/content/tooltip.js` — reads `sideload-word--known` class which is only set on click
