---
title: "Phase 2: Content Sections & Styling"
status: completed
version: "1.0"
phase: 2
---

# Phase 2: Content Sections & Styling

## Phase Context

**GATE**: Read all referenced files before starting this phase.

**Specification References**:
- `[ref: ideas/2026-04-09-loadlang-marketing-strategy.md]` — Approved copy for all sections
- `[ref: PRD/Features 1-8]` — Acceptance criteria for each section
- `[ref: SDD/User Interface & UX]` — Wireframe, responsive breakpoints, interaction states

**Key Decisions**:
- Hero copy: "You're already reading. Might as well learn Spanish." (playful tone, approved in brainstorm)
- Sync section copy: "Take your words with you" with €5/month pricing
- Screenshots reused from `sideload/store/` — no new assets needed except demo video

**Dependencies**:
- Phase 1 complete (HTML skeleton, CSS foundation, deployment config)

---

## Tasks

Populates all landing page sections with approved copy, screenshots, and styled layouts. Each task is a complete, visually finished section.

- [ ] **T2.1 Hero section** `[activity: frontend-ui]`

  1. Prime: Read approved hero copy from marketing strategy doc `[ref: ideas/loadlang-marketing-strategy.md — Hero]`; read PRD Feature 1 acceptance criteria `[ref: PRD/AC-1.1 through AC-1.4]`
  2. Test: Headline visible above fold; subhead text present; CTA button links to Chrome Web Store in new tab (`target="_blank" rel="noopener"`); video element has poster image, muted autoplay, controls visible
  3. Implement: Replace hero placeholder with approved copy. Add CTA as `<a>` styled as button. Add `<video>` with `poster="assets/demo-poster.jpg"`, `autoplay`, `muted`, `playsinline`, `controls`. Add `<img>` fallback inside `<noscript>` (though video works without JS).
  4. Validate: Hero renders above fold on 1280x800; CTA opens new tab; video plays muted; poster shows before play
  5. Success: Headline visible above fold `[ref: PRD/AC-1.1]`; CTA opens CWS in new tab `[ref: PRD/AC-1.3]`; video visible with controls `[ref: PRD/AC-1.4]`

- [ ] **T2.2 How It Works section** `[activity: frontend-ui]`

  1. Prime: Read approved panel copy and PRD Feature 2 `[ref: ideas/loadlang-marketing-strategy.md — How It Works; PRD/AC-2.1 through AC-2.4]`
  2. Test: Three panels visible (Browse, Read, Level Up); horizontal on desktop (>=769px), stacked on mobile (<=768px); each panel contains a screenshot image with alt text
  3. Implement: Add 3-panel flexbox grid. Copy screenshots from `sideload/store/` to `site/assets/`. Add `<img>` for each screenshot with descriptive alt text and explicit width/height to prevent CLS.
  4. Validate: Panels render horizontal on desktop; stack on mobile; images load; CLS < 0.1 (width/height set)
  5. Success: Three panels visible `[ref: PRD/AC-2.1]`; horizontal on desktop `[ref: PRD/AC-2.2]`; stacked on mobile `[ref: PRD/AC-2.3]`; real screenshots used `[ref: PRD/AC-2.4]`

- [ ] **T2.3 Features section** `[activity: frontend-ui]` `[parallel: true]`

  1. Prime: Read approved feature bullets `[ref: ideas/loadlang-marketing-strategy.md — Features; PRD/AC-3.1 through AC-3.2]`
  2. Test: Four feature bullets visible with exact approved copy; no JS-dependent interactive elements
  3. Implement: Add feature list as `<ul>` with styled `<li>` items. Use Unicode emoji for icons (📊 🇪🇸 🔍 🎚️). No JavaScript.
  4. Validate: All four bullets render; content matches approved copy exactly
  5. Success: Four features visible `[ref: PRD/AC-3.1]`; no JS required `[ref: PRD/AC-3.2]`

- [ ] **T2.4 Privacy section** `[activity: frontend-ui]` `[parallel: true]`

  1. Prime: Read approved privacy copy `[ref: ideas/loadlang-marketing-strategy.md — Privacy; PRD/AC-4.1 through AC-4.3]`
  2. Test: Headline "Your browsing is yours. Period." visible; GitHub repo link present and valid; no analytics/tracking scripts on page
  3. Implement: Add privacy section with approved copy. Link to GitHub repo. Link to `privacy.html`.
  4. Validate: Section renders; links work; DevTools Network tab shows zero third-party requests
  5. Success: Headline present `[ref: PRD/AC-4.1]`; GitHub link works `[ref: PRD/AC-4.2]`; zero third-party scripts `[ref: PRD/AC-4.3]`

- [ ] **T2.5 Sync upgrade section (#sync)** `[activity: frontend-ui]`

  1. Prime: Read approved sync copy, pricing, and SDD sync flow `[ref: ideas/loadlang-marketing-strategy.md — Sync; PRD/AC-5.1 through AC-5.5; SDD/Runtime View — Sync Upgrade]`
  2. Test: `#sync` anchor scrolls viewport to section; "€5/month" price displayed; E2E encryption claim visible; "Get Sync" CTA links to Lemon Squeezy checkout URL; on `?sync=cancelled` return, soft recovery message visible
  3. Implement: Add sync section with approved copy. Price as "€5/month". "Get Sync" as `<a>` to LS hosted checkout URL (placeholder URL until LS product is configured). Add `scroll-margin-top` for sticky header offset. Add hidden recovery message shown via minimal CSS/JS for `?sync=cancelled` (or link to separate cancellation page per ADR-3 pattern).
  4. Validate: `#sync` anchor works; price clear; CTA is a real link; `scroll-margin-top` prevents content hiding behind header
  5. Success: Anchor scrolls correctly `[ref: PRD/AC-5.1]`; price displayed `[ref: PRD/AC-5.2]`; encryption stated `[ref: PRD/AC-5.3]`; CTA links to payment `[ref: PRD/AC-5.4]`

- [ ] **T2.6 Footer** `[activity: frontend-ui]`

  1. Prime: Read approved footer copy `[ref: ideas/loadlang-marketing-strategy.md — Footer; PRD/AC-6.1 through AC-6.3]`
  2. Test: "A LoadLang product" visible; GitHub and Privacy Policy links resolve; upcoming languages listed as non-clickable text
  3. Implement: Add footer with LoadLang attribution, GitHub link, privacy.html link, and "French · Portuguese · Japanese · Korean — coming soon" as plain text (not links).
  4. Validate: Footer renders; links work; "coming soon" languages are not clickable
  5. Success: Attribution visible `[ref: PRD/AC-6.1]`; links resolve `[ref: PRD/AC-6.2]`; languages non-clickable `[ref: PRD/AC-6.3]`

- [ ] **T2.7 Mobile CTA swap** `[activity: frontend-ui]`

  1. Prime: Read PRD mobile responsiveness and SDD responsive behavior `[ref: PRD/AC-7.1 through AC-7.3; SDD/User Interface & UX — Responsive Breakpoints]`
  2. Test: On mobile viewport (<=768px), install CTA displays as disabled "Available on Chrome for desktop"; sync CTA remains active; no horizontal scrolling
  3. Implement: CSS media query hides install CTA and shows disabled variant on mobile. Sync CTA unaffected. Verify all sections fit mobile viewport.
  4. Validate: Resize browser to 375px width; install CTA swapped; sync CTA active; no horizontal scroll
  5. Success: Mobile install CTA disabled `[ref: PRD/AC-7.1]`; sync CTA active on mobile `[ref: PRD/AC-7.2]`; no horizontal scroll `[ref: PRD/AC-7.3]`

- [ ] **T2.8 Phase Validation** `[activity: validate]`

  - View full page on desktop (1280x800) and mobile (375x812). Verify all sections match approved copy. Check all links. Verify video plays. Run contrast checker on all text. Tab through all interactive elements. Verify zero third-party requests. Check CLS (all images have width/height).
