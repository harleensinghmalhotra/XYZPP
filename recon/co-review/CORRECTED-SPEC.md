# Alternativ Hero — CORRECTED SPEC (Single Source of Truth)

Rebuilt **only** from the live interactive co-review session (2026-07-07) with the user's
confirmations as ground truth. Every number is measured from the real site in the browser
we drove together. Where a prior recon file (BLUEPRINT.md / CATALOG.md) disagrees, the old
file **loses** — see the CONFLICTS section.

- **Target:** https://www.alternativinc.com
- **Canonical viewport:** **1536 × 743 @ devicePixelRatio 1.25** (user's real browser; CP0 pixel-match confirmed).
- **Document height:** ~9814 px. Hero is a scroll-pinned (`position: sticky`) section.
- All scrollY values below are canonical at this viewport. (Earlier 1440×900 and 1920×985 trials were VOID; their scrollY numbers do not apply.)

---

## 1. Structure (as measured)

```
.body-dark                         (scroll container, overflow:auto)
 └─ .hero-section-scroll-wrapper    (pin TRACK, static, height ≈1858px)
     └─ .hero-section               (position: STICKY, top:0)  ← the pin
         ├─ .hero-section_content   (text block; small translateY on scroll)
         │   └─ H1
         │       └─ .hero-section_content_title-wrapper   ← the FADE/ZOOM node
         │           ├─ .hero-section_content_title-line._1  "PRINTING" (green)
         │           ├─ .hero-section_content_title-line._2  "STORIES"  (white)
         │           └─ .hero-section_content_title-line_seal  ← spinning ring seal
         │       .hero-section_content_p          (subhead)
         │       .button-box                      (CTAs: pill + underlined link)
         └─ .hero-section_graph-wrapper   (absolute, Z-INDEX 15)  ← the BOOK layer
             ├─ .hero-section_graph_book "over"   (base book plate; fades to op 0)
             ├─ .hero-section_graph-details1..8   (12 <img alt="Alternativ Graphic">:
             │                                     book-page art + word graphics + character stickers)
             └─ .hero-section_scroll-wrapper       (the "SCROLL" pill + .hero-section_scroll-dot)
.services-section                    (SEPARATE normal-flow sibling, static, z auto)
```

Preloader remnants (off-screen after load): `.load-frame_content_seal-letters`, `.load-frame_content_seal-symbol` — duplicate seals, NOT the visible one.

---

## 2. Choreography — load → landing

### PHASE A — Page load (not scroll-driven)
- **Book load-in:** the open book's pages start **narrow at the spine** and **expand to full width** on page load. This is a one-time load interaction, separate from scroll.
- At rest (scrollY 0): **ZERO floating elements.** Only three alive-at-rest motions:
  1. **Seal rotation** — `.hero-section_content_title-line_seal` spins continuously (opacity 1, never fades).
  2. **Scroll-dot pulse** — the dot in the SCROLL pill pulses.
  3. The book load expansion (once).
- Resting composition: nav (wordmark + links + "Ask for a quote" in green + globe/En + circular MENU); centered **PRINTING** (green) / **STORIES** (white); seal nested between the two lines over STORIES' left edge; subhead; pill "Our expertise" (→) + underlined "Our approach"; open book with page-tips just under the CTA row; faint repeating logo-tile watermark lower-left & lower-right; **SCROLL** pill centered on the book's spine.

### PHASE B — Static hold (scrollY 0 → ~200)
- The pinned hero holds **static**. Only the seal spin + dot pulse animate. The composition scrub has **not** begun.

### PHASE C — Wind-up: text exit + book rise (≈ 200 → ~1000)
Begins in the **200 → 350** band (phase boundary).
- **Text exit** is carried by the single node `.hero-section_content_title-wrapper` and is a **combined opacity + transform** exit (NOT a pure fade):
  - opacity: 1 → **0.6486 @ y350** → ~**0.002 @ y700** (essentially out) → residual ~0.03–0.07 while it keeps scaling.
  - transform (site's OWN inline `scale3d`): scale 1 @ y350 → **1.094 @ y700** → **2.2506 @ y850** → **3.0 (capped) @ y1000**. At y850 the element's box is 1620px — wider than the 1536 viewport.
  - `.hero-section_content` also drifts up (translateY → −88 @ y850, −141 @ y1000).
  - → Net effect: the headline **fades while enlarging** ("zoom-through" ghost letters) as it exits behind the rising book. *(This scale-up is the site's inline value; see CONFLICTS #1 for the user's differing figure.)*
- **Nav never fades:** `.navbar` opacity dips to 0.6486 @ y350 then **recovers to 1.0** @ y700 and stays 1.0. It only *reads* as gone against the navy. Its curve is **separate** from the text (they merely crossed at 0.6486 near y350).
- **Book rise:** `.hero-section_graph-wrapper` translateY climbs to **−301.5 @ y850 → −334.4 @ y1000**, then **plateaus (peak) at ~y1000**. The base book plate `.hero-section_graph_book` fades to **opacity 0** (~y1150); the visible book afterward is the `graphs-wf_book-*` detail layers.
- **Watermark tiles** travel up with the book layer (parallax / baked into the book layer), not static background.

### PHASE D — Sticker burst = gradual long-bloom (≈ 1000 → ~1300)
- **First stickers become visible ≈ y1000** (scale ~0.401, slight −6°…−8° rotation). They **pop ONTO the open book-page spread**, they do NOT burst over the top edge.
- The burst is a **gradual long-bloom over hundreds of px**; characters enter in **staggered waves** from the book edges (different stickers reach scale 1.0 at different scrollY, ~y1150–1300). 11+ character/word graphics at full bloom.
- **Page-words** ("Fantasy, Words, Magic, Stories, Happy, Home, Hobby…") are **baked into the book artwork PNGs** — no DOM text, no SVG text. Their drift = the book layer's own scroll-scrubbed transform. All graphics: `animationName: none`, `transition: 0s` → **scroll-scrubbed, not time-based.**

### PHASE E — Handoff to services (≈ 1150 → ~2050)
- **Pin release ≈ y1150–1300.** After the peak, the whole composed frame **unpins and scrolls off as one block**; internal scrub transforms **freeze** (bookWrap.ty locked at −334.4; sticker translates freeze by ~y1900).
- **White curve** `.services-section-divisor-wrapper` rises: top 708 (y1150) → 108 (y1750) → crosses the top (~y1900). **Services section fully owns the screen ~y1900–2050.**
- **Book crossing:** the book (z-index 15, inside the still-releasing sticky hero) paints **over** the rising white services section → reads as **"book landed on white"** (navy cover + thickness + grandpa sticker + SCROLL pill on spine visible over white). Mechanism = **sticky pin + z-15 graph layer + a normal-flow services sibling rising beneath**. NO overflow trick, NO fixed layer, NO re-parenting. Then the sticky releases and the book **scrolls off the top by ~y1900**.
- **SCROLL pill NEVER fades** (opacity 1.0 throughout); it exits by scrolling off with the hero (~y1900). There is no pill fade-out point.
- **Seal** keeps spinning throughout, never fades, exits off-screen top with the hero.
- **Services reveal:** heading **"PRINTING SERVICES"** (navy on white) + tagline *"A turnkey service, from printing to delivery. Quality, security and peace of mind guaranteed."* + "Learn more about our process"; then cards — **Book Printing / Bag Printing / Packaging Printing / Toys** — with product photography. Faint logo-tile watermark persists at far left.

---

## 3. Canonical checkpoint table (measured @ 1536×743)

| scrollY | title-wrapper op | title-wrapper scale | nav op | bookWrap ty | stickers | SCROLL pill | notes |
|---|---|---|---|---|---|---|---|
| 0 | 1 | 1 | 1 | 0 | hidden | op1 on spine | rest; seal spin + dot pulse only |
| 200 | 1 | 1 | 1 | 0 | hidden | op1 | static hold ends |
| 350 | **0.6486** | 1 | **0.6486** | rising | hidden | op1 | fade+book-rise begin; nav & text cross at 0.6486 |
| 700 | ~0.002 | 1.094 | **1.0** | ~−300 | driven, off-screen | op1 | text ~gone; nav recovered to 1.0 |
| 850 | 0.029 | **2.2506** | 1.0 | −301.5 | scale 0 (off) | op1 | headline box 1620px > viewport |
| 1000 | 0.056 | 3.0 (cap) | 1.0 | **−334.4 (peak)** | **first visible, sc0.401** | op1 | book base fading; peak book-rise |
| 1150 | 0.07 | 3.0 | 1.0 | −334.4 | full bloom sc1.0 | op1 | book base op0; word layer legible; curve appears (708) |
| 1300 | 0.07 | 3.0 | 1.0 | −334.4 (frozen) | settling | op1 | PIN RELEASE begins; curve top 558 |
| 1600 | — | — | 1.0 | frozen | riding up | op1 | book navy cover shows; curve 258; services text visible |
| 1750 | — | — | 1.0 | frozen | frozen | op1/top53 | curve 108; book crossing onto white |
| 1900 | — | — | 1.0 | frozen | frozen | op1 [off-top] | curve crosses top; hero scrolling off |
| 2050 | off | off | 1.0 | off | off | off | **services owns screen** (cards visible) |

---

## 4. User corrections — quoted verbatim (ground truth)

**CP0:** *"(1) The book has a LOAD-IN animation — pages start narrow at the spine and EXPAND to full width on page load… (2) The spinning seal sits nested between the two headline lines, overlapping STORIES' left edge. (3) Faded repeating logo watermark tiles pattern the dark background left and bottom-right. (4) SCROLL pill sits centered ON the book's spine. (5) The two CTAs have different weights: pill button vs plain underlined link. (6) At rest, ZERO floating elements exist anywhere. Confirmed alive-at-rest motions: seal rotation, scroll-dot pulse, and the load expansion only."*

**CP2 (y200):** *"through scrollY 200 the hero holds static, only seal spin + dot pulse animate."*

**CP3 (y350):** *"What you called 'desaturation' is OPACITY dropping — the whole hero text block … fades as one unit in place, no color swap. STORIES shows it most because it's the brightest layer. … PHASE BOUNDARY — wind-up fade begins between scrollY 200 and 350; text fades IN PLACE with zero translation; book still untouched."*

**Post-CP2 rulings:** *"(1) Nav is opacity 1.0, not faded — it only LOOKS gone against the navy… (2) Headline wrapper … text exit is opacity + upward drift + shrink combined, not pure fade. (3) Sticker elements are ALREADY animating … the burst starts DURING the rise…"*

**CP y850:** *"(1) … there is NO 3x zoom at this viewport; the 'giant ghost type' effect = fade + slight shrink + the book rising past it… (2) Tiles confirmed baked into the book layer — closed. (3) Book rise 98% complete…"*

**CP y1000:** *"(1) … low-opacity text layer ON the book pages ('Fantasy, Words, Magic, Stories, Happy, Home, Hobby…'), drifting… (2) The spinning seal VISIBLE at bottom-left is still alive and rotating… (3) Sticker burst confirmed in full bloom — 11+ characters visible."*

**CP y1150:** *"(1) Stickers … burst is a GRADUAL bloom over hundreds of px, characters entering in STAGGERED WAVES from the book edges… (2) CLOSED — page-words baked into the book artwork itself, no separate DOM layer… (3) White curved boundary of the next section now visible in the bottom corners — bleed handoff has begun."*

**CP FINAL:** *"the dark bg ends via the curved boundary while the BOOK CROSSES it and lands ON the white services section … spine + thickness + grandpa sticker visible over white; the services heading/padding is laid out to respect the book's landing zone; SCROLL pill persists on the spine across the boundary."*

---

## 5. CONFLICTS — old-blueprint claims overturned by this walk

Old BLUEPRINT.md / CATALOG.md **lose** every one of these:

1. **Headline "zoom-split" — PARTIALLY OVERTURNED, one point still OPEN.**
   - OLD blueprint: a dramatic zoom-split. → Overturned as described.
   - This walk (measured, canonical): the headline exit is **opacity-out + scale-UP to 3.0 + slight upward drift** — the site's OWN inline `scale3d(2.2506)` at y850 and a rendered box (1620px) wider than the viewport both prove a scale-**up**, not a shrink.
   - ✅ **RESOLVED (2026-07-07):** user confirmed the BUILD uses **scale-UP to ~3.0** (matches the measured site and the "giant ghost type" GHOST STATE). The transient 0.898/shrink figure is discarded. Canonical = opacity 1→~0 with scale 1→3 + upward drift.

2. **Sticker timing — OVERTURNED (settled).** Old blueprint had a late "explosion window." Actual: the burst **starts during the book rise** (graphics driven from ~y700, first visible ~y1000) and blooms **gradually over hundreds of px in staggered waves** — no single explosion moment.

3. **Nav opacity — OVERTURNED (settled).** Nav does **not** fade out. `.navbar` dips to 0.6486 @ y350 then recovers to 1.0 and holds; it only reads as gone against the navy. Separate curve from the text.

4. **Watermark tiles — OVERTURNED (settled).** Not a static background — they're **baked into / travel with the book layer** (parallax up with the rise).

5. **Page-words — OVERTURNED (settled).** "Fantasy / Words / Magic / …" are **baked into the book-artwork PNGs**, not a DOM text/vector layer. Motion = the book's scroll-scrubbed transform (`animationName: none`).

6. **Book handoff "persistent object" — MEASURED CORRECTION.** The landed book is the **sticky hero's own z-15 layer**; it overlaps the white services section **transiently during the sticky release (~y1550–1850), then scrolls off the top by ~y1900.** There is no re-parenting, no fixed layer, no services-owned landing book (the services book image is only the "Book Printing" card photo). The "landing" reads as persistent but is a crossing overlap; flagged for the user.

---

## 6. Build implications (for the hero rebuild)
- One pinned `sticky` hero inside a tall track (~1858px ≈ 2.5× viewport of scroll distance).
- Scrub timeline keyed to scroll progress within the track: text opacity 1→0 + scale 1→3 (upward drift) early; book translateY 0→−334 peaking ~40% through; sticker burst as **staggered** scale-in on the page spread; all scrubbed (no time-based CSS animations on the scene).
- Nav is an independent dip-and-recover, ending at opacity 1.
- Seal spin + scroll-dot pulse are the only continuous (time-based) loops; both persist and never fade.
- Words + characters are image assets on the book, not live text.
- Handoff = sticky release; a normal-flow white services section (with a curved top divider) rises beneath the z-15 book, which then scrolls away. SCROLL pill stays on the spine, unfaded, until it exits with the hero.
