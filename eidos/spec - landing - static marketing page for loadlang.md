---
tldr: Static HTML landing page at loadlang.com — install CTA + sync subscription pitch, deployed via GitHub Pages
---

# spec - landing - static marketing page for loadlang

status: draft

## Target

The extension exists but has no public-facing web presence. Users need a place to understand the product, install it, and buy sync. The domain loadlang.com needs a landing page that converts visitors into installs and subscribers.

## Behaviour

### Page Structure

Single-page static HTML. No build step, no framework, no dependencies. One `index.html`, inline CSS, no external requests except font loading (system fonts preferred).

Sections in order:

1. **Hero** — headline, subheadline, two CTAs: "Install Free" (Chrome Web Store) and "Get Sync" (Lemon Squeezy checkout)
2. **Demo / Screenshot** — visual showing the extension in action on a real-looking webpage. Replaced words visible, tooltip shown. Static image or inline HTML mock.
3. **Features** — 3-4 cards: progressive tiers, learn-by-browsing, no flashcards, struggling word detection
4. **Pricing** — two tiers side by side:
   - **Free** — extension only, local progress, unlimited use
   - **Sync (5 EUR/month)** — cross-device sync, E2E encrypted, no account needed
5. **Privacy** — explicit section: no tracking, no browsing data leaves device, sync is E2E encrypted, server is a dumb blob store, no email/account required
6. **Footer** — GitHub link, contact, "Made by meowmeowco"

### CTAs

- **Install button** — links to Chrome Web Store listing (placeholder `#install` until published)
- **Get Sync button** — links to Lemon Squeezy checkout (placeholder `#sync` until product created)
- Both CTAs appear in hero and optionally repeated in pricing section

### Tone

Friendly, consumer-facing. Approachable language, not developer jargon. Light use of colour, clean typography. Think Duolingo's clarity with Mullvad's privacy positioning.

### Responsive

- Mobile-first layout
- Hero stacks vertically on small screens
- Feature cards wrap to single column
- Pricing cards stack
- No horizontal scroll at any viewport

### Performance

- No JavaScript required for core content (JS only for minor interactions if any)
- No external CSS frameworks
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Target: <50KB total page weight (excluding screenshot image)
- Lighthouse performance score >95

## Design

### Colour Palette

Derived from the extension's existing styling:
- Primary: `#e67e22` (orange — matches extension accent)
- Text: `#2c3e50` (dark navy)
- Subtle: `#95a5a6` (grey)
- Background: `#fafafa` (off-white)
- Success/CTA: `#27ae60` (green — install button)

### File Structure

```
site/
  index.html        # The entire landing page
  screenshot.png    # Extension demo screenshot (or inline SVG mock)
```

Served from GitHub Pages via `gh-pages` branch or `/docs` directory on main.

### Deployment

- GitHub Pages from `meowmeowco/sideloadspanish` repo
- Custom domain: `loadlang.com`
- CNAME record in Cloudflare DNS pointing to GitHub Pages
- HTTPS via GitHub Pages automatic certificate
- `site/CNAME` file containing `loadlang.com`

## Verification

- [ ] Page loads at loadlang.com with HTTPS
- [ ] Hero section visible with both CTAs
- [ ] Demo/screenshot shows the extension in action
- [ ] Features section communicates core value props
- [ ] Pricing section shows Free vs Sync tiers clearly
- [ ] Privacy section explicitly states what data never leaves the device
- [ ] Mobile layout is usable (no horizontal scroll, readable text)
- [ ] Page weight <50KB (excluding image)
- [ ] Lighthouse performance >95
- [ ] No JavaScript errors in console
- [ ] CNAME resolves correctly through Cloudflare

## Interactions

- **depends on**: [[spec - sideload - progressive in-page word replacement for language learning]] (feature descriptions)
- **depends on**: [[spec - sync - mullvad-model paid sync with license keys]] (pricing, privacy claims)
- **affects**: Chrome Web Store listing (landing page URL added to extension description)

## Mapping

> [[site/index.html]]
> [[site/CNAME]]

## Future

{[!] Replace placeholder CTA hrefs when Chrome Web Store listing and Lemon Squeezy product are live}
{[?] Add a live interactive demo — replace words on the landing page itself as a demonstration}
{[?] Add testimonials section once there are users}
