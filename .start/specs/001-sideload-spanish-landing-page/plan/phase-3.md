---
title: "Phase 3: Integration, Polish & Deploy"
status: completed
version: "1.0"
phase: 3
---

# Phase 3: Integration, Polish & Deploy

## Phase Context

**GATE**: Read all referenced files before starting this phase.

**Specification References**:
- `[ref: SDD/Deployment View]` — Cloudflare Pages deploy, domain config, cache headers
- `[ref: SDD/Quality Requirements]` — LCP, FCP, CLS targets, Lighthouse >= 90
- `[ref: PRD/Features 8-9]` — Accessibility, progressive enhancement
- `[ref: PRD/Success Metrics]` — KPIs and tracking requirements

**Key Decisions**:
- ADR-1: Deploy to Cloudflare Pages via `wrangler pages deploy site/`
- ADR-3: Lemon Squeezy redirect checkout — configure real product URL
- ADR-4: No analytics — verify zero scripts in final audit

**Dependencies**:
- Phase 1 and Phase 2 complete (all sections built and styled)

---

## Tasks

Connects the landing page to external systems (CWS, Lemon Squeezy), runs accessibility and performance audits, adds demo video, and deploys to production.

- [ ] **T3.1 Demo video** `[activity: content]`

  1. Prime: Read PRD video requirements and SDD performance targets `[ref: PRD/AC-1.4; PRD/AC-9.2; PRD/AC-9.3; SDD/Quality Requirements]`
  2. Test: 60s screen recording exists showing word replacement on a real page (Reddit or news); compressed to < 10MB; poster image extracted as JPG; `<video>` element plays correctly with poster fallback
  3. Implement: Record 60s screen capture of Sideload Spanish in action on a real webpage. Compress with `ffmpeg` (H.264, target ~5MB). Extract first frame as poster JPG. Place in `site/assets/demo.mp4` and `site/assets/demo-poster.jpg`. Add `loading="lazy"` or `preload="none"` to defer video download.
  4. Validate: Video plays in Chrome and Firefox; poster shows before play; file size < 10MB; page LCP not affected (video is lazy-loaded)
  5. Success: Video visible below hero CTA `[ref: PRD/AC-1.4]`; not blocked by ad blockers (self-hosted) `[ref: PRD/AC-9.2]`; fallback image on failure `[ref: PRD/AC-9.3]`

- [ ] **T3.2 Lemon Squeezy checkout integration** `[activity: integration]`

  1. Prime: Read SDD sync flow and Lemon Squeezy docs `[ref: SDD/Runtime View — Sync Upgrade; SDD/External Interfaces]`
  2. Test: "Get Sync" CTA links to real LS checkout URL; clicking opens LS hosted checkout page; after completion, redirects to `/sync-success.html`; after cancellation, redirects to `index.html?sync=cancelled`
  3. Implement: Configure Lemon Squeezy product in LS dashboard (€5/mo subscription). Set redirect URLs: success → `https://sideloadspanish.com/sync-success.html`, cancel → `https://sideloadspanish.com/#sync`. Update "Get Sync" `<a href>` with real checkout URL. No JS — pure redirect.
  4. Validate: Click "Get Sync" → LS checkout opens; complete test payment → redirects to success page; cancel → returns to #sync section
  5. Success: CTA redirects to payment `[ref: PRD/AC-5.4]`; cancellation returns to page `[ref: PRD/AC-5.5]`

- [ ] **T3.3 Accessibility audit** `[activity: quality]`

  1. Prime: Read PRD accessibility requirements `[ref: PRD/AC-8.1 through AC-8.4; SDD/Quality Requirements]`
  2. Test: axe-core audit returns 0 violations; all text meets 4.5:1 contrast; keyboard Tab reaches all CTAs with visible focus; video has captions; `#sync` has `aria-label`
  3. Implement: Run `npx @axe-core/cli site/index.html` (or browser extension). Fix any violations. Add video captions (VTT file) or transcript section. Verify `aria-label="Sync upgrade"` on sync section.
  4. Validate: axe-core 0 violations; manual keyboard navigation test; screen reader test (VoiceOver on macOS)
  5. Success: WCAG AA compliance `[ref: PRD/AC-8.1 through AC-8.4]`; axe-core clean `[ref: SDD/Quality Requirements]`

- [ ] **T3.4 Performance audit** `[activity: quality]` `[parallel: true]`

  1. Prime: Read SDD performance targets `[ref: SDD/Quality Requirements; SDD/Deployment View — Performance Targets]`
  2. Test: Lighthouse score >= 90; LCP < 2.5s; FCP < 1.5s; CLS < 0.1; total page weight < 2MB (excluding lazy video)
  3. Implement: Run Lighthouse audit. Optimize images (WebP with PNG fallback, explicit width/height). Verify video is lazy-loaded. Minimize CSS if needed (likely unnecessary at this scale). Verify `_headers` cache directives.
  4. Validate: Lighthouse Performance >= 90; all Core Web Vitals green
  5. Success: LCP < 2.5s `[ref: SDD/Quality Requirements]`; page weight < 2MB `[ref: SDD/Quality Requirements]`

- [ ] **T3.5 Privacy audit** `[activity: quality]` `[parallel: true]`

  1. Prime: Read PRD privacy requirements and SDD security section `[ref: PRD/AC-4.3; PRD/AC-9.1; SDD/Cross-Cutting Concepts — Security]`
  2. Test: DevTools Network tab shows zero third-party requests on page load; Application > Cookies is empty; CSP header blocks external scripts; no analytics, tracking pixels, or font CDN requests
  3. Implement: Open page in Chrome. Open DevTools Network tab. Reload. Verify every request is to `sideloadspanish.com` (or `localhost` during dev). Check Application > Cookies — must be empty. Check response headers — CSP must include `script-src 'none'`.
  4. Validate: Zero third-party requests; zero cookies; CSP enforced
  5. Success: Zero third-party scripts `[ref: PRD/AC-4.3]`; zero cookies `[ref: SDD/Quality Requirements]`; JS-disabled works `[ref: PRD/AC-9.1]`

- [ ] **T3.6 Progressive enhancement verification** `[activity: quality]`

  1. Prime: Read PRD Feature 9 `[ref: PRD/AC-9.1 through AC-9.3]`
  2. Test: With JS disabled: all content renders, all CTAs work as anchor links, video shows poster image. With ad blocker active: video loads (self-hosted), page fully functional.
  3. Implement: Disable JS in Chrome DevTools. Verify all sections render. Click all CTAs — they should work as standard `<a>` links. Enable uBlock Origin — verify no blocked requests.
  4. Validate: Full functionality without JS; no ad blocker interference
  5. Success: All content renders without JS `[ref: PRD/AC-9.1]`; video not blocked `[ref: PRD/AC-9.2]`; fallback image present `[ref: PRD/AC-9.3]`

- [ ] **T3.7 Deploy to Cloudflare Pages** `[activity: infrastructure]`

  1. Prime: Read SDD deployment view `[ref: SDD/Deployment View]`
  2. Test: Site is live at sideloadspanish.com with HTTPS; all pages load; CSP headers present in response; CWS install link works; LS checkout link works
  3. Implement: Configure Cloudflare Pages project (`sideloadspanish`). Add custom domain `sideloadspanish.com`. Deploy: `npx wrangler pages deploy site/ --project-name sideloadspanish`. Verify DNS propagation.
  4. Validate: `curl -I https://sideloadspanish.com` returns 200 with CSP headers; all links functional; Lighthouse audit on live URL
  5. Success: Site live at sideloadspanish.com `[ref: SDD/Deployment View]`; HTTPS active; CSP enforced; ready for Week 2 launch spike

- [ ] **T3.8 Phase Validation — Full Integration** `[activity: validate]`

  - End-to-end walkthrough of both user journeys:
    1. **New visitor flow:** Land on sideloadspanish.com → read all sections → click install CTA → CWS opens in new tab
    2. **Sync upgrade flow:** Navigate to sideloadspanish.com#sync → read sync section → click "Get Sync" → LS checkout opens → complete test payment → redirected to /sync-success.html
    3. **Mobile flow:** Open on mobile viewport → install CTA disabled → sync CTA active
    4. **Privacy flow:** DevTools audit — zero third-party requests, zero cookies, CSP enforced
    5. **Accessibility flow:** axe-core 0 violations, keyboard navigation complete, video captions present
