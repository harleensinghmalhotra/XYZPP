# DESIGN BIBLE — Ekta's Homepage Design Law

Extracted from: Hero.jsx, TrustStrips.jsx, WhatWePrint.jsx, Projects.jsx, Infrastructure.jsx, Cases.jsx, Marquee.jsx, CTAFooter.jsx, index.css tokens.

**This checklist is the SINGLE SOURCE OF TRUTH for every inner page.** Every page below must conform to these rules exactly. Violations are regressions.

---

## PALETTE CANON

### Root Palette (all inner pages + default)
- **Navy (primary dark)**: `#0f2444` (`rgb(15 36 68)`) — backgrounds, text on cream
- **Navy-2 (lighter variant)**: `rgb(27 58 107)` — gradients, secondary fills
- **Navy-deep**: `#0a1b33` — footer navy
- **Gold (accent)**: `#B06F14` (`rgb(176 111 20)`) — hairlines, links, on-navy accents
- **Gold-2 (brighter variant)**: `#D99637` (`rgb(215 141 38)`) — on-navy eyebrows, numbers
- **Gold-text (AA-safe)**: `#9d6f14` — eyebrow text on cream (≥4.5:1 contrast)
- **Cream (primary light)**: `#FDFAF4` — body backgrounds, text on navy
- **Cream-2 (secondary light)**: `#F0EBE0` — alternating section backgrounds
- **Cream-3 (text tone)**: `#f5f0e8` — text/overlays on navy
- **Ink (primary text)**: `#1C2019` — body text on cream (warm black)
- **Ink-2 (secondary text)**: `#444444` — meta/secondary text
- **Olive (eco accent)**: `#6B7A2A` — rare accents, quiet eco note
- **Olive-light**: `#8fa05a`
- **Olive-deep**: `#5a6623`
- **Grey-strip**: `#efede8`, `#e5e2da` — trust strips warm greys

**HOMEPAGE ONLY** (via `.home-palette` class):
- Navy overrides to `#0e1b46` (Ekta's baked sky)
- Gold overrides to `#A0661A` (Ekta's baked bubble gold)

### Forbidden Hexes (GREP & FIX)
- NEVER `#ffffff`, `#000000`, `#999999`, `#cccccc` or any grey outside the palette
- NEVER arbitrary hex not in: `#0e1b46` (hero), `#0f2444`, `#0F2444` (legacy), `#B06F14`, `#9d6f14`, `#9B7420`, `#FDFAF4`, `#F0EBE0`, `#1C2019`, `#6B7A2A` + their rgb() channel vars
- 3D sections (process3d/) and brand marks exempt — document the exception

---

## TYPOGRAPHY SYSTEM

### Font Stack (HTML/CSS LOCK)
- **Display/Headlines**: Inter Tight (loaded Google Font)
- **Body/Meta**: Inter (loaded Google Font)
- **Technical labels**: DM Mono (loaded Google Font)
- **NO OTHER FONTS** — every `.font-[family]` violates the law

### Scale (clamp-based, no px hardcodes)

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| **H1** (hero display) | `clamp(48px, 6.5vw, 92px)` | 700 bold | Inter Tight, -0.02em tracking |
| **H2** (section title) | `clamp(38px, 5vw, 68px)` | 500 medium | Inter Tight, -0.02em tracking, line-height 1.08 |
| **H3** (sub-heading) | `clamp(23px, 3vw, 32px)` | 500 medium | Inter Tight |
| **Body** | `clamp(15px, 1.2vw, 18px)` | 400 regular | Inter, line-height 1.6–1.7 |
| **Eyebrow** | `12px` | 500 medium | DM Mono, uppercase, +3px tracking |
| **Label** | `11px` | 500 medium | DM Mono, uppercase, +0.28em tracking (min 11px compliance floor) |
| **Button** | `13px` | 500 medium | Inter |
| **Hero stat number** | `clamp(64px, 9.5vw, 132px)` | 500 medium | Inter Tight, 0.92 line-height, -0.03em tracking |

### Line Heights
- **Headings**: 1.02–1.08 (tight)
- **Body**: 1.6–1.7 (open)
- **Numerals**: 0.92 (tight)

---

## SECTION RHYTHM & SPACING (THE BREATHING)

### One Golden Ratio
- **Section padding Y**: `clamp(96px, 11vh, 128px)` — the ONE vertical rhythm all sections share
- **Section padding Y alias**: `var(--section-pad-y)` (CSS custom property, non-negotiable)
- **Content max-width**: `1280px` (ONE content width, no 1200/1360/1440 drift)
- **Page gutter**: `clamp(20px, 5vw, 56px)` — sides, ONE value
- **Section gap (eyebrow→heading→intro)**: `16px` — the THREE spacing moments between type

### Hero Specific
- **Top padding**: `clamp(120px, 18vh, 176px)`
- **Bottom padding**: `clamp(64px, 9vh, 104px)`
- **Hero inner grid**: 1.15fr / 0.85fr (left copy, right stat)
- **Hero inner gap**: `clamp(36px, 5vw, 72px)`

---

## BUTTON ANATOMY

### `.u-btn` Family (Pills, on-palette)
- **Shape**: `border-radius: var(--r-btn)` (999px, pill)
- **Padding**: `13px 26px`
- **Font**: Inter 500, 13px, 0.3px tracking
- **Border**: `1.5px solid transparent`

### Variants
| Class | Fill | Border | Text | Hover |
|-------|------|--------|------|-------|
| `.u-btn--solid` | navy | transparent | cream | gold fill, navy text |
| `.u-btn--outline` | transparent | navy | navy | navy fill, cream text |
| `.u-btn--gold` | gold-2 | transparent | navy | cream-3 fill, navy text |
| `.u-btn--ghost` | transparent | cream 50% | cream-3 | cream-3 fill, navy text |

### Focus State
- **All buttons**: `outline: 2px solid var(--gold)` + `outline-offset: 3px`
- **Reduced motion**: No animation, static focus ring

### `.btn-nebula` Aura (Add-on layer)
- Rotates a conic nebula ring on the button edge (navy → gold → olive → navy)
- Resting opacity: 0.55, hover: 0.9
- Blur: 8px (light variant: 5px)
- Ring thickness: 3px
- Rotation speed: 4s (hover: 2s)
- **Reduced motion**: No rotation, static ring

### Hero Pill CTAs (Special case)
- Navy fill with gold border (`border-[var(--gold-2)]`)
- Cream text
- Hover: scale 1.02
- Active: scale 0.98
- Focus: outline var(--gold)

---

## CARD ANATOMY

### `.u-card` (Light cards, cream-2)
- **Background**: `var(--cream-2)` (#f0ebe0)
- **Border**: `1px solid rgb(var(--navy-rgb) / 0.1)` (navy 10% alpha)
- **Radius**: `var(--r-card)` (22px)
- **Padding**: `clamp(24px, 3vw, 32px)`
- **Hover**: `translateY(-6px)` + shadow lift (if hover: hover media query)

### `.u-card--navy` (Dark cards, navy)
- **Background**: `var(--navy)`
- **Border**: `rgba(245, 240, 232, 0.12)` (cream 12% alpha)
- **Text**: `var(--cream-3)`

---

## RADIUS TOKEN SCALE

| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | 3px | decorative frames, tight focus, book spines |
| `--radius-sm` | 8px | small controls, icon tiles, labels |
| `--radius-md` | 14px | inputs, list rows, thumbnails |
| `--radius-lg` | 18px | photos / media |
| `--radius-xl` | 22px | cards & panels (dominant) |
| `--radius-2xl` | 26px | large feature panels |
| `--radius-pill` | 999px | buttons, badges, CTAs |
| `--radius-round` | 50% | circles (icons, social) |

---

## SECTION HEADER BAND (Display Header Pattern)

Used on major pages: Contact, PrintOnDemand, Fulfilment, Founder, GlobalMarkets.

### Anatomy
1. **Flat navy background** (`var(--navy)`, no gradient, no texture)
2. **Gold top hairline** (3px solid `rgb(var(--gold-rgb) / 0.55)` — matches hero border)
3. **Section padding** inside: `var(--section-pad-y) var(--page-gutter)`
4. **Inner container**: `max-width: var(--content-max)`, centered

### Type Stack (top to bottom)
1. **Eyebrow** (DM Mono gold-2, uppercase, 12px, +3px tracking)
   - Text: existing locale string key for the eyebrow word
   - If no suitable single-word key exists in locales → SKIP eyebrow, keep band + H1 only
2. **Display word** (Inter Tight 800, massive, gold-2)
   - The PAGE'S OWN nav/title key from locales (existing string ONLY)
   - One word maximum; if multi-word required → use entire phrase as H1
   - Margin-bottom: 16px (section-gap-head)
3. **Supporting H1** (Inter Tight 700, navy or cream-3 on navy)
   - Existing page H1 string (byte-identical, ZERO copy changes)
   - Margin-bottom: 0

### Example Structure
```html
<section class="u-hero" style="background: var(--navy);">
  <div class="u-hero-inner">
    <div class="u-hero-copy">
      <p class="u-eyebrow">{{ eyebrow_key }}</p>
      <h1 class="u-h1" style="color: var(--gold-2);">{{ display_word }}</h1>
      <p class="sr-only">{{ original_h1 }}</p>
    </div>
  </div>
</section>
```

**Stubs** (Newsroom, CSR): minimal band only
- Eyebrow + existing stub title
- No display word (no suitable key)
- No big number on the right

---

## FOCUS RING & ACCESSIBILITY

### Standard Focus Indicator
- **Color**: `var(--gold)` (clears 3:1 non-text contrast on both cream and navy)
- **Style**: `2px solid`
- **Offset**: `3px`
- **Radius**: `var(--radius-xs)` (3px, no sharp 90° corners)
- **Class**: `.focus-ring:focus-visible`

### Reduced Motion
- All animations → duration 0.001ms, 1 iteration
- Transitions → duration 0.001ms
- Scroll-behavior → auto (no smooth scroll)
- Keyframes suppressed (fade-in/lift/spin all instant)
- Nebula ring → static, no rotation

---

## REVEAL & DATA ATTRIBUTES

### Data-reveal Pattern
- `data-reveal` attribute on sections
- Governs scroll-trigger reveals (fade-up, opacity 0→1, transform translateY only)
- Reduced-motion: instant reveal, no transition

### Transform & Opacity Only (GPU-safe)
- **Allowed**: `transform: translateY/X/scale/rotate`, `opacity`
- **Forbidden**: background-color/size shifts, width/height changes, box-shadow animated
- All animations should be GPU-composited (will-change: transform)

---

## PAPER GRAIN & TEXTURE

### `.paper-grain::after` (Light sections only)
- Applies to cream/light backgrounds
- SVG fractal noise pattern (data URI)
- Opacity: 0.5
- Mix-blend-mode: multiply
- **NO grain on navy sections** (flat navy is the rule)

### Dark Sections
- Flat `var(--navy)`, no texture, no grain
- Optional: static ribbon/aurora (hero only, explicit exceptions)

---

## HOVER BEHAVIORS

### Buttons
- **Solid**: fill → accent color
- **Outline**: fill → navy, text → cream
- **Gold**: fill → cream-3, text → navy
- **Ghost**: fill → cream-3, text → navy

### Cards
- **Lift hover** (where hover: hover): `translateY(-6px)` + shadow amplification
- **No hover on touch** (check media query: `@media (hover: hover)`)

### Links
- **Navy text links**: underline appears on hover (gold or darkened)
- **Gold accent links**: color shifts or underline highlights

---

## HAIRLINES & BORDERS

### Top Hairlines (Section separators)
- **Thickness**: 3px
- **Color**: `var(--gold)` or `rgb(var(--gold-rgb) / 0.55)`
- **Placement**: `border-top` on section start

### Internal Dividers
- **Thickness**: 1px
- **Color**: `rgb(var(--navy-rgb) / 0.08–0.1)` (navy 8–10% alpha)
- Used in trust strips, card grids

### GOLD RULE (the Ekta signature)
- **Every navy section** has a gold top-hairline (3px solid gold)
- **Every cream section** usually starts with a gold hairline above

---

## EYEBROW ANATOMY

### DM Mono Standard
- **Font**: DM Mono, 500 (medium) weight
- **Size**: 12px
- **Color** (on cream): `#9d6f14` (AA-safe gold text)
- **Color** (on navy): `var(--gold-2)` (brighter gold for contrast)
- **Transform**: `uppercase`
- **Tracking**: `+3px` (letter-spacing: 3px)
- **Margin-bottom**: `16px` (section-gap-head)

### Rule: Eyebrow exists on EVERY section's heading
- Never omit; every section has eyebrow → title → intro rhythm

---

## ANIMATION & REDUCED MOTION

### Permitted Animations
- Scroll reveals: fade-up (opacity + translateY)
- Hover effects: scale, translateY (GPU-safe only)
- Nebula ring rotation (suppressed under prefers-reduced-motion)
- Page transitions (fade, if any)

### Forbidden Animations
- Color shifts on animated backgrounds (background-color transition on dynamic fills)
- Width/height reflow during animation
- Non-GPU transforms (anything that forces layout recalc)

### Reduced Motion Rule
All animations MUST be guarded by `@media (prefers-reduced-motion: reduce)`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition-duration: 0.001ms !important; }
}
```

---

## GOLD USAGE RULES

### Primary Gold (`var(--gold)`, `#B06F14`)
- **Hairlines**: 3px section top borders
- **Large text**: heading accents (≥28px = "large text" WCAG)
- **Focus rings**: 2px outline
- **Icon strokes**: premium icons, navigation marks
- **Hover states**: interactive element highlights

### Secondary Gold (`var(--gold-2)`, `#D99637` / `#B06F14` on homepage)
- **On-navy eyebrows**: 12px DM Mono labels
- **Stat numerals**: hero numbers, trust-strip counts
- **Button accents**: pill CTAs, badge fills
- **Interior fills**: badge backgrounds

### AA-Safe Gold (`#9d6f14`, gold-text)
- **Eyebrow text on cream ONLY**: 12px DM Mono (meets ≥4.5:1)
- **Never on navy** (use var(--gold-2) instead)
- **Never on navy backgrounds** (contrast fails)

---

## NAV LINK BEHAVIOR

### `.qnav-link` (SiteNav in header)
- **Font**: Inter Tight, 500, 13px, 0.8px tracking
- **Color**: `var(--navy)` (on cream nav)
- **Hover**: color → `var(--gold)` + center-growing underline
- **Underline**: 1.5px gold, grows from center on hover
- **Transition**: 0.25s ease

---

## MARQUEE (Print Terms)

### `.mq-row` / `.mq-word` / `.mq-star`
- **Words**: Inter Tight 800, uppercase, `8vw` font-size (responsive)
- **Color**: `var(--paper)` (cream on navy)
- **Separator**: inline SVG sparkle (not font glyph), `var(--gold-2)` fill
- **NO outline stroke** (previous variant was off-brand; fix in Lane 12b)
- **Animation**: infinite marquee scroll, `38s` linear, no hover effect

---

## TRUST STRIPS (Example Pattern)

### Anatomy
1. **Top white band** (separator from hero)
2. **Countries ticker** (strip 1): gray-strip bg, navy text, left-drift scroll
3. **Institutions ticker** (strip 2): darker gray-strip, gold icons, right-drift scroll
4. **Stats bar** (strip 3): cream bg, gold numerals, 3D icon settle animations

### Color Rules per Strip
- **Country cells**: navy text on #efede8 (gray-strip)
- **Institution cells**: ink text on #e5e2da (darker gray-strip)
- **Stat numbers**: gold on cream (#fdfaf4)
- **Borders**: navy 8–10% alpha dividers

---

## CASE STUDIES (Open Book Pattern)

### Page Turn
- **CSS 3D flip**: ~520ms duration, ease-out
- **No motion**: instant crossfade (prefers-reduced-motion)
- **Input lock**: mid-flip disables clicks (JS lock FLIP_MS)

### Spine Shelf
- **Missing spine** at active position (visual affordance)
- **Hover lift**: `translateY(-6px)` on non-active spines
- **Gold foil numerals**: rotating conic gradient (foil effect on static position)

### Left Page (Text)
- Cream bg, navy ink, eyebrow + title + pills + body + CTA
- CTA uses `.btn-nebula--light` (static ring, no cream-star noise)

### Right Page (Photo)
- Navy duotone overlay, bottom scrim, inner spine shadow, page-curl hint
- Supports lazy loading, `loading="lazy"`

---

## INFRASTRUCTURE (Book Stacks & Facilities)

### Facility Book Cards (`.u-card`)
- Light cream-2, navy border, 22px radius
- Photo zone + text zone (flex column)
- Eyebrow + heading + body (same rhythm)

### Team Portrait Placeholders
- Deep navy solid fill (#0F2444), soft dot-grid pattern (tonal, opacity ~0.06)
- Gold stroke icon (1.4px stroke-width) in center
- DM Mono caption below icon

### No Photos Rule
- Missing assets → premium navy placeholder revealed, not broken frame 404
- Real photos drop in with zero CSS change (same path)

---

## REDUCED MOTION COMPLIANCE

### Every Animated Element
- Guarded by `@media (prefers-reduced-motion: reduce)` OR
- Checked via `useReducedMotion()` hook (React)

### Animation → Static Equivalents
| Animation | Reduced Motion |
|-----------|--|
| Fade-up reveal | Instant opacity 1, no translateY |
| Hover scale | No transform |
| Nebula ring rotation | Static ring, no animation |
| Page turn flip | Instant crossfade |
| Marquee scroll | No animation (grid still interactive) |
| Icon settle | No keyframe, instant final state |

---

## EXISTING EXCEPTIONS (DO NOT TOUCH)

These pages/components are already conformed and locked:
- **Homepage** (Home.jsx) — THE BIBLE itself
- **Hero.jsx** — hero outline-free art, pill CTAs
- **Projects.jsx** — globe + shelf books
- **WhatWePrint.jsx** — 8-card row (cutout pops, rotating images)
- **FacilityBook** (component) — book-stack intro for Infrastructure
- **OurStory.jsx** — timeline already conformed
- **InfrastructurePage header/book** — display band + facilities already conformed
- **SiteNav.jsx** — cream nav + gold underline already conforming
- **process3d/** — R3F conveyor section, isolated palette, DO NOT TOUCH

---

## PAGES TO CONFORM (PHASE 1)

In this order:
1. **Contact.jsx** → display band + hero stat
2. **PrintOnDemand.jsx** → display band + sections
3. **Fulfilment.jsx** → display band + sections
4. **Founder.jsx** → display band + biography
5. **GlobalMarkets.jsx** → display band + map/data
6. **Newsroom.jsx** (stub) → minimal band + stub text
7. **CSR.jsx** (stub) → minimal band + stub text
8. **NotFound.jsx** → 404 heading + nav back
9. **Legal pages** (CookiePolicy, Privacy, etc) → audit headers, footer palette

---

## COMPLIANCE CHECKLIST (Per Page)

- [ ] **Palette**: All hexes in canonical set or rgb() vars
- [ ] **Typography**: All font-family = Inter Tight / Inter / DM Mono only
- [ ] **Sizes**: All using clamp() or canonical fixed values (12px, 13px, 11px labels)
- [ ] **Spacing**: Section padding = `var(--section-pad-y)`, gaps = 16px
- [ ] **Buttons**: All pills (rounded-full or `--r-btn`), .u-btn or .btn-nebula
- [ ] **Focus**: All interactive elements have `.focus-ring` or `:focus-visible`
- [ ] **Eyebrows**: Every section heading has eyebrow (12px DM Mono, uppercase, correct color per bg)
- [ ] **Cards**: Radius = `var(--r-card)` (22px), cream-2 bg, navy 10% border
- [ ] **Hairlines**: Top borders 3px gold where appropriate
- [ ] **Hover**: No hover on touch, smooth 0.2–0.3s ease transitions
- [ ] **Reduced motion**: All animations guarded or via hook
- [ ] **Display band** (major pages): navy bg, gold top-hairline, eyebrow + display word + H1
- [ ] **No PaperGrain on navy** — flat backgrounds only
- [ ] **No shadows** except card lifts and drop-shadows (grounded imagery)
- [ ] **No arbitrary styling** — all CSS from tokens, clamp(), or this checklist

---

**RULE**: If a page element is not listed here, it defaults to **DO NOT USE**. Every line of custom CSS must anchor to a token or this document. Drift is regression.

---

**Committed**: [see git log for initial commit]

