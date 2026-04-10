---
tldr: Make the extension cross-browser (Chrome + Firefox) from a single codebase and submit to AMO
status: open
---

# Plan: Firefox compatibility and AMO submission

## Context

- Spec: [[spec - sideload - progressive in-page word replacement for language learning]]
- Prior: [[plan - 2604061315 - build sideload browser extension mvp]] (completed, Chrome-only)

The Chrome MV3 extension is feature-complete with 43 tests passing. The spec mentions "Chrome/Zen" — Zen is Firefox-based, so Firefox compatibility was always intended. Phase 5 action 6 of the MVP plan explicitly postponed cross-browser testing.

Firefox supports MV3 with service workers since Firefox 121+. The main compatibility gaps are:
- `chrome.*` namespace — Firefox supports it as a compat layer, but `browser.*` with Promises is native
- `manifest.json` needs `browser_specific_settings` for AMO
- `chrome.storage.local` callback style vs Firefox's Promise-based `browser.storage.local`
- Some MV3 behaviors differ (e.g., service worker lifecycle, host permissions handling)
- AMO requires source code review for minified/bundled extensions (ours is vanilla JS, no bundler — advantage)

Strategy: introduce a thin `browser-polyfill` wrapper (Mozilla's webextension-polyfill or a minimal custom shim) so all code uses `browser.*` with Promises. Build script generates Chrome and Firefox manifests from a shared base.

## Phases

### Phase 1 - API compatibility layer - status: open

Get all `chrome.*` calls working cross-browser. Visible result: extension loads in Firefox via about:debugging.

1. [ ] Audit all `chrome.*` usage — catalog every call site, classify as (a) has direct `browser.*` equivalent, (b) needs callback→Promise conversion, (c) Chrome-only API
   - service-worker.js: ~8 call sites (runtime, tabs, storage.local)
   - storage.js (lib): ~3 call sites (runtime.sendMessage, runtime.lastError)
   - popup.js: ~12 call sites (runtime, tabs, storage.local)
   - replacer.js: ~2 call sites (runtime.getURL, runtime.onMessage)
2. [ ] Decide: Mozilla webextension-polyfill vs minimal custom shim
   - webextension-polyfill: well-tested, 5KB, handles edge cases
   - custom shim: zero dependencies, but we'd need to maintain it
   - => decision recorded here after evaluation
3. [ ] Implement the compatibility layer — either add polyfill or write shim
4. [ ] Replace all `chrome.*` calls with `browser.*` equivalents across all 4 files
5. [ ] Verify `chrome.runtime.lastError` pattern is handled (Firefox uses Promise rejection instead)
6. [ ] Manual smoke test: load unpacked in Firefox via about:debugging, confirm word replacement works

### Phase 2 - Manifest and build split - status: open

Single source manifest that produces Chrome and Firefox variants. Visible result: `npm run build:firefox` and `npm run build:chrome` produce valid packages.

1. [ ] Create `manifest.base.json` with shared fields (or use the existing manifest.json as base)
2. [ ] Add `browser_specific_settings` for Firefox:
   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "{sideload-spanish-extension-id}",
       "strict_min_version": "121.0"
     }
   }
   ```
3. [ ] Create build script (`scripts/build.js` or npm scripts) that:
   - Copies extension files to `dist/chrome/` and `dist/firefox/`
   - Merges Firefox-specific manifest fields for the Firefox build
   - Injects polyfill script into Firefox content_scripts if needed
4. [ ] Add `npm run build:chrome` and `npm run build:firefox` commands
5. [ ] Verify both builds load correctly in their respective browsers

### Phase 3 - Test suite cross-browser - status: open

Existing tests pass against Firefox. Visible result: CI can run tests for both targets.

1. [ ] Update Playwright config to add a Firefox browser project
2. [ ] Run existing 43 tests against Firefox — catalog any failures
3. [ ] Fix Firefox-specific test failures (if any)
4. [ ] Add a Firefox-specific smoke test for service worker lifecycle (Firefox may restart SW differently)
5. [ ] Verify unit tests (Vitest) still pass — these are browser-agnostic, should be unaffected

### Phase 4 - AMO submission - status: open

Extension listed on addons.mozilla.org. Visible result: public AMO listing URL.

1. [ ] Register/log in to AMO developer account (manual — user action)
2. [ ] Package Firefox build as `.xpi` (zip with .xpi extension)
3. [ ] Create AMO store listing assets:
   - Extension description (adapt from CWS listing)
   - Screenshots (Firefox-specific)
   - Privacy policy (if required — we store data locally + optional sync)
4. [ ] Create `store/firefox/` directory mirroring `store/chrome/` structure
5. [ ] Submit to AMO for review
   - No bundler/minifier means source review is straightforward
   - Note: AMO reviews can take 1-5 days
6. [ ] Document the AMO submission process in `store/firefox/README.md` for future updates

## Verification

- [ ] Extension loads and replaces words in Firefox (about:debugging)
- [ ] Extension loads and replaces words in Chrome (unchanged behavior)
- [ ] Hover tooltip works in Firefox
- [ ] Click-to-know persists across page reload in Firefox
- [ ] Popup dashboard renders correctly in Firefox
- [ ] Sync feature works in Firefox (chrome.storage.local → browser.storage.local)
- [ ] All existing tests pass against Chrome
- [ ] Tests pass against Firefox (Playwright)
- [ ] `npm run build:firefox` produces valid .xpi
- [ ] `npm run build:chrome` produces valid .zip (existing CWS flow)
- [ ] AMO submission accepted

## Adjustments

(none yet)

## Progress Log

- 2026-04-10 23:31 — Plan created. Chrome MV3 extension is feature-complete. ~30 `chrome.*` call sites across 4 files need cross-browser treatment. AMO submission included in scope.
