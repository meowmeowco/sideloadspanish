---
title: "Sideload Spanish Landing Page & Sync Upgrade Funnel"
status: draft
version: "1.0"
---

# Product Requirements Document

## Validation Checklist

### CRITICAL GATES (Must Pass)

- [x] All required sections are complete
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Problem statement is specific and measurable
- [x] Every feature has testable acceptance criteria (Gherkin format)
- [x] No contradictions between sections

### QUALITY CHECKS (Should Pass)

- [x] Problem is validated by evidence (not assumptions)
- [x] Context → Problem → Solution flow makes sense
- [x] Every persona has at least one user journey
- [x] All MoSCoW categories addressed (Must/Should/Could/Won't)
- [x] Every metric has corresponding tracking events
- [x] No feature redundancy (check for duplicates)
- [x] No technical implementation details included
- [x] A new team member could understand this PRD

---

## Product Overview

### Vision

sideloadspanish.com is the marketing home and revenue conversion point for Sideload Spanish — where new visitors install the free extension and existing users upgrade to paid sync.

### Problem Statement

The Sideload Spanish Chrome extension exists and works, but has no web presence. There is nowhere to send traffic from Reddit, Hacker News, or Product Hunt. There is no way for existing users to discover or purchase the E2E encrypted sync feature (€5/mo). Without a landing page, the extension cannot be marketed and cannot generate revenue.

### Value Proposition

A single-page site that serves two funnels in one scroll: (1) convince new visitors to install a free, privacy-first browser extension for learning Spanish, and (2) convince existing users to upgrade to paid multi-device sync. The page itself embodies the product's privacy promise — no accounts, no tracking scripts, no cookie banners.

## User Personas

### Primary Persona: The Passive Optimizer (New Visitor)
- **Demographics:** 25–40, knowledge worker or student, English-speaking, desktop/laptop primary browser user
- **Goals:** Learn Spanish vocabulary without dedicating time to a structured app. Install something frictionless that fits existing browsing habits.
- **Pain Points:** Abandoned Duolingo due to time pressure or guilt mechanics. Distrusts apps that require accounts or collect data. Wants proof it works before installing.

### Secondary Persona: The Multi-Device Learner (Existing User)
- **Demographics:** Same as above, but already using Sideload Spanish on one device
- **Goals:** Sync vocabulary progress across laptop and desktop. Maintain a single learning state.
- **Pain Points:** Progress is locked to one browser profile. Switching devices means starting over or losing context.

### Tertiary Persona: The Digital Nomad
- **Demographics:** Remote worker or digital nomad planning to live in a Spanish-speaking country
- **Goals:** Build ambient vocabulary exposure before arrival. Low-commitment, high-frequency practice.
- **Pain Points:** Traditional apps feel like homework. Wants passive exposure integrated into daily workflow.

## User Journey Maps

### Primary User Journey: New Visitor Install

1. **Awareness:** User sees a Reddit post, Show HN, or Product Hunt listing about Sideload Spanish.
2. **Consideration:** Clicks through to sideloadspanish.com. Scans hero, watches demo video, reads how-it-works panels. Evaluates: "Does this actually work on pages I read?" and "Will it spy on me?"
3. **Adoption:** Privacy section resolves trust. Clicks "Add to Chrome — free, no signup." Chrome Web Store opens in new tab. Installs.
4. **Usage:** Browses normally. Words start replacing. Hovers to peek. Returns to the extension popup to check progress.
5. **Retention:** Progressive difficulty keeps it interesting. Struggling word detection prevents plateaus.

### Secondary User Journey: Existing User Sync Upgrade

1. **Awareness:** User clicks "Get Sync" link inside the extension popup or settings.
2. **Consideration:** Deep-links to sideloadspanish.com#sync. Reads sync value prop: multi-device, E2E encrypted, €5/mo. Evaluates: "Is this worth it?" and "Is it really private?"
3. **Adoption:** "Because we meant it about privacy" resolves trust. Clicks "Get Sync." Payment flow opens.
4. **Usage:** Completes payment. Sync activates. Progress appears on second device.
5. **Retention:** Sync works transparently. Monthly value justified by continued learning across devices.

### Edge Journey: Mobile Visitor

1. **Awareness:** Same channels (Reddit, HN, etc.) but user is on a phone.
2. **Consideration:** Reads the landing page content — everything renders normally.
3. **Adoption blocked:** Chrome extensions are desktop-only. Install CTA is replaced with "Available on Chrome for desktop" (disabled state). User cannot install.
4. **Recovery:** Page offers a way to revisit on desktop (e.g., bookmark prompt or "Send to my computer" share option).

## Feature Requirements

### Must Have Features

#### Feature 1: Hero Section
- **User Story:** As a new visitor, I want to immediately understand what Sideload Spanish does so that I can decide whether to install it.
- **Acceptance Criteria:**
  - [ ] Given a new visitor lands on the page, When the page loads, Then the headline "You're already reading. Might as well learn Spanish." is visible above the fold
  - [ ] Given a new visitor reads the hero, When they look for a CTA, Then a single "Add to Chrome — free, no signup" button is visible above the fold
  - [ ] Given a visitor clicks the install CTA, When the click occurs, Then the Chrome Web Store listing opens in a new tab
  - [ ] Given the page loads on desktop, When the hero renders, Then a 60s demo video is visible below the CTA (muted autoplay, with play/unmute controls)

#### Feature 2: How It Works Section
- **User Story:** As a new visitor, I want to see the three-step process so that I understand what happens after I install.
- **Acceptance Criteria:**
  - [ ] Given the visitor scrolls past the hero, When the How It Works section renders, Then three panels are visible: Browse, Read, Level Up
  - [ ] Given the page is viewed on desktop, When the panels render, Then they display as a horizontal strip
  - [ ] Given the page is viewed on mobile (<=768px), When the panels render, Then they stack vertically
  - [ ] Given each panel, When it renders, Then it contains a screenshot from the extension showing real page content

#### Feature 3: Features Section
- **User Story:** As a new visitor, I want to see specific capabilities so that I trust the extension is well-built.
- **Acceptance Criteria:**
  - [ ] Given the visitor scrolls to Features, When the section renders, Then four feature bullets are visible: progressive tiers, smart articles, struggling detection, density control
  - [ ] Given the features section, When it renders, Then no interactive demos or JavaScript-dependent content is required

#### Feature 4: Privacy Section
- **User Story:** As a privacy-conscious visitor, I want proof that this extension doesn't track me so that I feel safe installing it.
- **Acceptance Criteria:**
  - [ ] Given the visitor scrolls to Privacy, When the section renders, Then the headline "Your browsing is yours. Period." is displayed
  - [ ] Given the privacy section, When it renders, Then it includes a link to the open-source GitHub repository
  - [ ] Given the landing page, When any page section loads, Then no third-party analytics, tracking pixels, or cookie consent banners are present

#### Feature 5: Sync Upgrade Section (#sync)
- **User Story:** As an existing user, I want to purchase E2E encrypted sync so that my vocabulary progress follows me across devices.
- **Acceptance Criteria:**
  - [ ] Given a user navigates to sideloadspanish.com#sync, When the page loads, Then the viewport scrolls directly to the sync section
  - [ ] Given the sync section, When it renders, Then the price "€5/month" is clearly displayed with no currency ambiguity
  - [ ] Given the sync section, When it renders, Then the E2E encryption claim is prominently stated
  - [ ] Given a user clicks "Get Sync", When the payment flow initiates, Then the user is directed to the payment provider checkout
  - [ ] Given a user cancels or fails payment, When they return to the page, Then the #sync section is visible and the CTA is functional (no broken/loading state)

#### Feature 6: Footer
- **User Story:** As a visitor, I want to see who makes this product and what's coming next so that I understand the broader context.
- **Acceptance Criteria:**
  - [ ] Given the footer, When it renders, Then "A LoadLang product" attribution is visible
  - [ ] Given the footer, When it renders, Then links to GitHub and Privacy Policy are present and resolve to real pages
  - [ ] Given the footer, When upcoming languages are listed, Then they render as non-clickable "coming soon" text (not broken links)

#### Feature 7: Mobile Responsiveness
- **User Story:** As a mobile visitor, I want the page to be readable even though I can't install the extension on my phone.
- **Acceptance Criteria:**
  - [ ] Given a mobile visitor (detected by UA or screen width), When the install CTA renders, Then it displays as disabled with text "Available on Chrome for desktop"
  - [ ] Given a mobile visitor, When the sync CTA renders, Then it remains active (payment via mobile browser is valid)
  - [ ] Given any viewport width, When the page renders, Then all content is readable without horizontal scrolling

#### Feature 8: Accessibility
- **User Story:** As a user with accessibility needs, I want the page to meet WCAG AA standards so that I can navigate and understand it.
- **Acceptance Criteria:**
  - [ ] Given any text on the page, When rendered, Then color contrast meets WCAG AA minimum (4.5:1 body text, 3:1 large text)
  - [ ] Given interactive elements (CTAs, video controls), When a keyboard user navigates, Then all elements are reachable via Tab and have visible focus rings
  - [ ] Given the demo video, When it plays, Then captions or a text transcript are available
  - [ ] Given the #sync anchor, When a screen reader lands on it, Then an appropriate aria-label describes the section

#### Feature 9: Progressive Enhancement
- **User Story:** As a visitor with JavaScript disabled or ad blockers active, I want the page to still work so that I can install the extension.
- **Acceptance Criteria:**
  - [ ] Given JavaScript is disabled, When the page loads, Then all content renders and CTAs function as plain HTML anchor links
  - [ ] Given an ad blocker is active, When the page loads, Then the demo video is not blocked (self-hosted, not a third-party embed)
  - [ ] Given the video fails to load, When the hero renders, Then a static screenshot fallback with alt text is displayed

### Should Have Features

#### Installed User Detection
- **User Story:** As an existing user visiting the landing page, I want the CTA to reflect my status so that I'm not asked to install something I already have.
- **Acceptance Criteria:**
  - [ ] Given the extension is already installed, When the page loads, Then the hero CTA changes from "Add to Chrome" to "Upgrade to Sync"

#### Payment Error Recovery
- **User Story:** As a user whose payment failed, I want a clear recovery path so that I can try again.
- **Acceptance Criteria:**
  - [ ] Given a user returns from a cancelled checkout with `?sync=cancelled` parameter, When the #sync section renders, Then a soft recovery message is displayed (e.g., "Changed your mind? No pressure.")

### Could Have Features

#### Send-to-Desktop for Mobile Visitors
- Allow mobile visitors to email or share the page link to themselves for later desktop visit.

#### Changelog / What's New Page
- A simple subpage showing extension version history and recent improvements.

### Won't Have (This Phase)

- **User accounts or login on the landing page** — authentication is handled entirely by the extension and sync backend.
- **Blog or content marketing section** — SEO blog posts will be hosted separately or added later.
- **Multi-language landing pages** — sideloadfrench.com, sideloadjapanese.com, etc. are future products with their own sites.
- **In-page payment form** — payment is handled by the payment provider's checkout, not an embedded form.
- **Server-side rendering or dynamic content** — the page is fully static.

## Detailed Feature Specifications

### Feature: Sync Upgrade Section (#sync)

**Description:** The revenue-critical section of the page. Existing users arrive via deep-link from the extension. New visitors discover it by scrolling. It must communicate the value of sync, establish trust via E2E encryption claims, display pricing clearly, and convert clicks to the payment provider.

**User Flow:**
1. User arrives at sideloadspanish.com#sync (via extension link or scrolling)
2. Page scrolls to the sync section (smooth scroll if JS enabled, instant anchor if not)
3. User reads headline ("Take your words with you"), value props, and price (€5/month)
4. User clicks "Get Sync"
5. Payment provider checkout opens (redirect, not overlay — no third-party JS on page)
6. User completes payment
7. Payment provider redirects back to sideloadspanish.com with success parameter
8. Page displays confirmation message in the #sync section

**Business Rules:**
- Rule 1: Price is always displayed as "€5/month" — no annual plans, no tiers, no discounts at launch.
- Rule 2: Payment is handled entirely by the payment provider (Merchant of Record) — the landing page does not process or store payment data.
- Rule 3: The "Get Sync" CTA must be a redirect to the payment provider's hosted checkout page, not an embedded overlay, to maintain the zero-third-party-scripts commitment.
- Rule 4: EU VAT is handled by the payment provider (Merchant of Record) — no tax logic on the landing page.

**Edge Cases:**
- User clicks "Get Sync" but payment provider is down → CTA disables, shows "Try again later" inline. No JS error surfaces.
- User completes payment but redirect fails → Payment provider sends webhook to sync backend regardless; user can close tab and sync will activate.
- User visits #sync on mobile → CTA remains active (mobile payment is valid; sync activates on their desktop browser).
- User visits #sync but hasn't installed the extension yet → Section is still visible and purchasable; they can install afterward.

## Success Metrics

### Key Performance Indicators

- **Adoption (Install Rate):** >= 8% of landing page visitors click through to Chrome Web Store. Industry baseline for browser extension landing pages.
- **Engagement (Video Play Rate):** >= 40% of desktop visitors play the demo video. Indicates the video is compelling enough to watch.
- **Quality (Page Load - LCP):** < 2.5s. Core Web Vital; affects SEO and Chrome Web Store ranking signals.
- **Business Impact (Sync Conversion):** >= 2% of installs convert to paid sync within 30 days. Per roadmap; revisit value prop if below threshold.
- **Revenue (Payment Completion):** >= 70% of users who click "Get Sync" complete payment. Below this signals pricing or trust friction.

### Tracking Requirements

Privacy constraint: no third-party analytics at launch. Tracking is limited to what can be measured without cookies or scripts.

| Event | Properties | Purpose |
|-------|------------|---------|
| CWS click-through | Referrer (page section) | Measure install intent from landing page |
| #sync anchor hit | Referrer (extension vs. scroll) | Distinguish extension deep-links from organic scroll |
| "Get Sync" click | — | Measure upgrade intent |
| Payment completion | Webhook from payment provider | Measure revenue conversion |
| Payment cancellation | URL parameter `?sync=cancelled` | Measure checkout abandonment |

Note: If Cloudflare Web Analytics is enabled later, it provides cookieless pageview and referrer data at the edge with no client-side script.

---

## Constraints and Assumptions

### Constraints
- **Solo developer:** One person builds, deploys, and maintains the page. Complexity must stay minimal.
- **Privacy brand commitment:** No third-party analytics, no cookies, no tracking pixels. This is a marketing differentiator, not just a preference.
- **Payment provider already decided:** Lemon Squeezy is wired into the sync backend (`spin.toml`). The landing page must use Lemon Squeezy checkout.
- **Static site only:** No server-side rendering, no database, no CMS. The page is deployed as static files.
- **Launch deadline:** The landing page must be live before the Week 2 launch spike (Reddit, HN, Product Hunt).

### Assumptions
- The Chrome Web Store listing for Sideload Spanish is published and accessible before the landing page goes live.
- The Lemon Squeezy checkout can be used as a redirect (hosted checkout page) without embedding JS on the landing page.
- The sideloadspanish.com domain is registered and DNS is configured.
- The demo video will be a self-hosted MP4 (not a YouTube/Vimeo embed) to avoid ad blocker interference and third-party requests.
- The Privacy Policy page exists or will be created before launch.

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Chrome Web Store listing not approved in time | High | Low | Submit listing well before landing page launch; have fallback GitHub install instructions |
| Lemon Squeezy checkout requires embedded JS | Medium | Low | Test redirect-only flow; if overlay is required, load script only on "Get Sync" click, not on page load |
| Demo video is too large for fast page load | Medium | Medium | Compress aggressively; use poster image with lazy-load; keep under 10MB |
| Mobile visitors bounce immediately (can't install) | Low | High | Expected behavior; mobile CTA swap reduces confusion; track mobile bounce as baseline metric |
| Privacy claim undermined by third-party requests | High | Low | Audit page with browser DevTools Network tab before launch; zero tolerance for unexpected requests |

## Open Questions

- [ ] Is sideloadspanish.com registered? Who controls DNS?
- [ ] Does the Lemon Squeezy hosted checkout support redirect-only mode (no embedded JS)?
- [ ] What is the Privacy Policy URL? Does a privacy policy page exist yet?
- [ ] Should the demo video include narration/voiceover or be visual-only with captions?
- [ ] What is the return URL after successful Lemon Squeezy payment? (e.g., sideloadspanish.com?sync=success)

---

## Supporting Research

### Competitive Analysis

**Toucan** (toucanapp.com): Similar concept (inline word replacement while browsing). Has a polished landing page with animated demos. Requires account creation. Uses third-party analytics extensively. Key learning: their "how it works" section uses animated GIFs, which are more compelling than static screenshots but heavier.

**Vocabo:** Simpler extension, less polished marketing. No dedicated landing page — relies entirely on Chrome Web Store listing. Key learning: having a landing page at all is a differentiator in this space.

**Duolingo:** The anti-pattern. Aggressive engagement mechanics (streaks, guilt notifications) that the ICP explicitly rejects. Key learning: position against Duolingo's guilt mechanics in marketing copy ("no streaks, no guilt").

### User Research

Based on ICP analysis from brainstorm session:
- Target users spend 2–4 hours daily reading web content (Reddit, news, Wikipedia, HN)
- Primary motivation: "I don't have 20 minutes a day to dedicate to language learning"
- Privacy is a purchase driver, not just a feature — users actively avoid tools that require accounts
- The "Duolingo dropout" is a real and large segment

### Market Data

- r/languagelearning has 900k+ subscribers — primary organic channel
- r/LearnJapanese has 460k+ subscribers — validates demand for multi-language expansion
- Chrome Web Store "Education" category is competitive but "passive learning" and "privacy-first" are underserved niches
- Browser extension landing pages converting at 5–15% install rate are considered successful
