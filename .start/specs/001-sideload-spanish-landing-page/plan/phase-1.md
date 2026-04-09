---
title: "Phase 1: Site Skeleton & Infrastructure"
status: completed
version: "1.0"
phase: 1
---

# Phase 1: Site Skeleton & Infrastructure

## Phase Context

**GATE**: Read all referenced files before starting this phase.

**Specification References**:
- `[ref: SDD/Building Block View]` — directory map, component diagram
- `[ref: SDD/Deployment View]` — Cloudflare Pages config, _headers, CSP
- `[ref: SDD/Quality Requirements]` — LCP, accessibility, zero cookies

**Key Decisions**:
- ADR-2: Plain HTML/CSS, no framework, no build step
- ADR-4: CSP `script-src: 'none'` — enforced from the start

**Dependencies**:
- None — this is the first phase

---

## Tasks

Establishes the site directory structure, HTML skeleton with semantic sections, CSS foundation with custom properties, and Cloudflare Pages deployment config.

- [ ] **T1.1 Directory structure & deployment config** `[activity: infrastructure]`

  1. Prime: Read SDD directory map and deployment view `[ref: SDD/Building Block View; SDD/Deployment View]`
  2. Test: `site/` directory exists with `index.html`, `privacy.html`, `sync-success.html`, `styles.css`, `_headers`, and `assets/` directory
  3. Implement: Create directory structure per SDD. Create `_headers` file with CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers exactly as specified in SDD.
  4. Validate: All files exist; `_headers` contains `script-src 'none'`; `npx serve site/` starts without errors
  5. Success: Directory matches SDD layout `[ref: SDD/Directory Map]`; CSP headers present `[ref: PRD/Feature 9 — Progressive Enhancement]`

- [ ] **T1.2 HTML skeleton with semantic sections** `[activity: frontend-ui]`

  1. Prime: Read SDD page structure wireframe and PRD section definitions `[ref: SDD/User Interface & UX; PRD/Features 1-6]`
  2. Test: `index.html` has `<section>` elements with IDs: `hero`, `how-it-works`, `features`, `privacy`, `sync`; plus `<header>` and `<footer>`. All sections contain placeholder content. Page renders in browser without errors.
  3. Implement: Create `index.html` with HTML5 doctype, charset, viewport meta, semantic sections matching SDD wireframe. Include `<link>` to `styles.css`. Add `<video>` element in hero with `poster` attribute. Add anchor links for `#sync`. Add `aria-label` on sync section.
  4. Validate: HTML validates (no errors); all section IDs present; page renders with placeholder content; `#sync` anchor scrolls to correct section
  5. Success: All 7 sections present with correct IDs `[ref: PRD/Features 1-6]`; `#sync` anchor works `[ref: PRD/AC-5.1]`; `aria-label` on sync section `[ref: PRD/AC-8.4]`

- [ ] **T1.3 CSS foundation with custom properties** `[activity: frontend-ui]`

  1. Prime: Read SDD quality requirements for contrast ratios, responsive breakpoints `[ref: SDD/Quality Requirements; SDD/User Interface & UX]`
  2. Test: CSS custom properties defined for colors, typography, spacing; WCAG AA contrast ratios met (4.5:1 body, 3:1 large text); responsive breakpoint at 768px; focus rings visible on interactive elements
  3. Implement: Create `styles.css` with CSS custom properties design system, base typography, section layout (flexbox), responsive media query at 768px, focus-visible styles, reduced-motion media query
  4. Validate: Page renders with consistent styling; contrast checker passes on all text; keyboard tab navigation shows focus rings; mobile layout stacks sections vertically
  5. Success: WCAG AA contrast met `[ref: PRD/AC-8.1]`; keyboard focus visible `[ref: PRD/AC-8.2]`; mobile layout stacks `[ref: PRD/AC-2.3]`

- [ ] **T1.4 Privacy & success pages** `[activity: frontend-ui]` `[parallel: true]`

  1. Prime: Read PRD privacy and sync flow requirements `[ref: PRD/Feature 6 — Footer; SDD/Runtime View — Payment Return]`
  2. Test: `privacy.html` renders with privacy policy content; `sync-success.html` renders with confirmation message and link back to main page
  3. Implement: Create `privacy.html` with privacy policy text. Create `sync-success.html` with "You're all set! Sync is active." message and link to `index.html`. Both pages link to `styles.css` for consistent styling.
  4. Validate: Both pages render; links work; no JS required; CSP headers apply
  5. Success: Privacy Policy link resolves `[ref: PRD/AC-6.2]`; payment success page shows confirmation `[ref: PRD/AC-5.5]`

- [ ] **T1.5 Phase Validation** `[activity: validate]`

  - Run `npx serve site/` and verify all pages load. Check `_headers` CSP. Verify `#sync` anchor. Tab through all interactive elements. Test with JS disabled (all content renders, CTAs are anchor links). Verify zero third-party requests in DevTools Network tab.
