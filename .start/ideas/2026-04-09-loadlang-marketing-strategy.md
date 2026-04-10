# LoadLang Marketing Strategy

**Date:** 2026-04-09
**Status:** Design approved

---

## Brand Architecture

- **LoadLang** = parent brand (umbrella maker)
- **Sideload Spanish** = first product, launching at sideloadspanish.com
- Pipeline: Sideload French, Sideload Portuguese, Sideload Japanese, Sideload Korean

## Monetization

- Free extension (install from Chrome Web Store, no account required)
- Paid sync: €5/mo, E2E encrypted, multi-device

---

## Landing Page: sideloadspanish.com

### Hero

```
HEADLINE:   You're already reading. Might as well learn Spanish.
SUBHEAD:    Sideload Spanish sneaks vocabulary into the pages you 
            browse every day. No app, no streaks, no guilt — just 
            words showing up where you least expect them.
CTA:        [Add to Chrome — free, no signup]
```

60s demo video below CTA.

### How It Works (3 panels)

| Panel | Copy | Visual |
|-------|------|--------|
| 1. Browse | Open any page you normally read. That's it. | Screenshot: Reddit page |
| 2. Read | English words become Spanish. Hover to peek. | Screenshot: tooltip hover |
| 3. Level Up | Master a tier, harder words unlock. 3,600+ and counting. | Screenshot: popup dashboard |

### Features (4 bullets)

- 📊 **Progressive tiers** — A1 → C1, unlocked as you learn
- 🇪🇸 **Smart articles** — "the house" → "la casa", not "el casa"
- 🔍 **Struggling detection** — Words you keep missing get highlighted
- 🎚️ **Density control** — Choose how many words get replaced

### Privacy Section

```
HEADLINE:   Your browsing is yours. Period.

No account required. No telemetry. No analytics. 
Your vocabulary progress lives in your browser — 
we literally cannot see what you're learning.

Built by LoadLang. Open source on GitHub.
```

### Sync Upgrade Section (anchor: #sync)

```
HEADLINE:   Take your words with you

SUBHEAD:    Learning on your laptop and your desktop? Sync 
            keeps your progress in lockstep — end-to-end 
            encrypted, because we meant it about privacy.

PRICE:      €5/month

FEATURES:   · Multi-device sync
            · E2E encrypted (we can't read your data)
            · Cancel anytime, your words stay yours

CTA:        [Get Sync]
```

In-extension upgrade links deep-link to `sideloadspanish.com#sync`.

### Footer

```
A LoadLang product · GitHub · Privacy Policy
French · Portuguese · Japanese · Korean — coming soon
```

---

## Launch Content

### Reddit (r/languagelearning) — Week 2

```
TITLE:    I built a browser extension that replaces English 
          words with Spanish while you browse — no app, no 
          streaks, just passive exposure

BODY:
Hey r/languagelearning,

I got tired of opening Duolingo, feeling guilty for three 
days, then abandoning it again. I spend hours reading Reddit 
and news anyway — so I built something that turns that into 
practice.

Sideload Spanish replaces English words on any page with 
Spanish translations. It starts with common words (A1) and 
gets harder as you learn them. Hover any word to see the 
original + translation.

A few things that might matter to people here:

- It handles gendered articles properly ("la casa", not 
  "el casa") — compounds replace as a unit
- It detects words you're struggling with and highlights them
- Everything runs locally — no account, no tracking, no data 
  leaves your browser
- Free, open source: [GitHub link]

I've been using it myself for about a month and picked up 
~200 words without any dedicated study time. Happy to answer 
questions about the approach or the vocab selection.

[sideloadspanish.com]
```

Additional Reddit posts with tailored angles:
- **r/Spanish** — vocabulary progression angle, CEFR alignment
- **r/privacy** — zero-telemetry browser tool angle

### Show HN — Week 2

```
TITLE:    Show HN: Sideload Spanish — Learn vocabulary by 
          replacing words on pages you already read

BODY:
I built a Chrome extension that progressively replaces 
English words with Spanish on any web page. It starts with 
the 500 most common words and unlocks harder tiers as you 
learn.

Technical details that might interest HN:

- Content script does inline DOM replacement with article-noun 
  compound awareness (gender-correct: "la casa" not "el casa")
- All data stays in chrome.storage.local — zero telemetry, 
  no account required
- Optional E2E encrypted sync for multi-device (Fermyon Spin 
  backend)
- 3,600+ word vocabulary across 5 CEFR-aligned tiers
- Open source: [GitHub]

Live at sideloadspanish.com — install is free, no signup.

I'm a solo dev building this under LoadLang, with French, 
Portuguese, Japanese, and Korean versions planned.
```

### Product Hunt — Week 2

```
TAGLINE:      Learn Spanish while you browse — passive 
              vocabulary from the pages you already read

FIRST COMMENT (as maker):
Hey Product Hunt! 👋

I built Sideload Spanish because I kept abandoning language 
apps. I read the internet for hours a day — why not learn 
from that?

The extension replaces English words with Spanish on any 
page, starting easy and getting harder. Everything runs 
locally (no account, no tracking), with optional E2E 
encrypted sync if you use multiple devices.

It's free and open source. Would love your feedback — 
especially on the vocabulary progression. What words should 
unlock first?

TOPICS:       Productivity, Education, Chrome Extensions
```

---

## Messaging Layers

| Audience | Message | CTA |
|----------|---------|-----|
| New visitor | "You're already reading. Might as well learn Spanish." | Add to Chrome — free, no signup |
| Existing user | "Take your words with you" — E2E encrypted sync | Get Sync — €5/mo |
| HN/technical | DOM replacement, zero telemetry, Fermyon Spin backend | GitHub + site link |
| Reddit/casual | "I got tired of Duolingo guilt" — maker story | Site link |

---

## 30-Day Roadmap

### Week 1 — Build sideloadspanish.com
- [ ] Build landing page with all sections above
- [ ] Record 60s screen capture demo (word replacement on real Reddit/news page)
- [ ] Set up changelog or "what's new" page

### Week 2 — Launch spike
- [ ] Submit Show HN (Tuesday–Thursday, 9–11am ET, link to site)
- [ ] Post to r/languagelearning (maker story angle)
- [ ] Post to r/Spanish and r/privacy (tailored angles)
- [ ] Publish Product Hunt listing with demo video

### Week 3 — Amplification
- [ ] Identify 10 language learning / productivity YouTubers (<100k subs)
- [ ] Send personalized outreach offering free sync key for honest coverage
- [ ] Post 3 short Twitter/X clips (Reddit page, Wikipedia, news article)
- [ ] Write SEO blog post: "How to learn Spanish vocabulary without flashcards"

### Week 4 — Measure + iterate
- [ ] Post "30-day results" thread on Reddit with real usage stats
- [ ] Add testimonial / user quote to landing page
- [ ] Review install→sync conversion rate; if <2%, revise sync value proposition

---

## Channel Priority (unchanged from original)

1. **Reddit** — highest priority, free, high-trust, ICP-dense
2. **Hacker News** — one-shot, privacy/OSS fit, prepare carefully
3. **Twitter/X** — demo clips, medium effort
4. **YouTube** — organic outreach, sustained installs
5. **Product Hunt** — one-time spike, credibility builder
6. **SEO** — long-term compound, 1-2 posts now
7. **Paid ads** — not recommended until organic validated

---

## ICP (from original, unchanged)

**Primary: The Passive Optimizer**
- 25–40, knowledge worker or student
- 2–4 hours daily web reading
- Abandoned Duolingo due to time pressure or guilt mechanics
- Values privacy, low friction, no dark patterns

**Secondary:** Remote workers / digital nomads planning to live in Spanish-speaking countries.
