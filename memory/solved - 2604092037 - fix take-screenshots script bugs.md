---
tldr: Fix two bugs in sideload/scripts/take-screenshots.js found by Codex review
category: utility
---

# Todo: Fix take-screenshots script bugs

Two issues from Codex review:

1. **[P1] Documented command doesn't work** — `sideload/scripts/take-screenshots.js:3`. The header suggests `npx playwright test scripts/take-screenshots.js` but playwright.config.js only looks under `test/e2e` and the file defines no `test(...)` cases. Fix: either update the documented invocation to `node scripts/take-screenshots.js` or restructure as a Playwright test.

2. **[P2] Resource leak on failure** — `sideload/scripts/take-screenshots.js:97-101`. If anything throws after the `python3 -m http.server` starts, cleanup never runs. The background server on port 8384 and temp browser profile are left behind. Fix: wrap in try/finally.
