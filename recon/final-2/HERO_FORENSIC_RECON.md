# HERO FORENSIC RECON — alternativinc.com vs our AG build

**Evidence tiers used below**
- **[SRC]** our source file + line (confirmed).
- **[REF-DOM]** reference DOM, from the scraped Webflow page `public/alternativ/asset_download_37.htm` (published 2025-12-05) — confirmed.
- **[REF-CSS]** reference production stylesheet `alternativ-inc.shared.e61cb3d4b.min.css` (fetched live → `recon/final-2/altcss.css`) — confirmed.
- **[RUNTIME]** measured from screenshots on the canonical rig (computed/observed).

No files were modified.

---

## A. REAL HERO FILE MAP

Import chain: `index.html` → `src/main.jsx` → `src/App.jsx` → `src/sections/Hero.jsx`.

| Concern | Controlling file |
|---|---|
| Homepage entry / mount | [src/main.jsx](src/main.jsx), [src/App.jsx:20](src/App.jsx#L20) |
| **Hero layout, sizing, DOM** | [src/sections/Hero.jsx](src/sections/Hero.jsx) (single component, 237 lines) |
| Hero text content | [Hero.jsx:168,176,181](src/sections/Hero.jsx#L168) (hard-coded "PRINTING"/"STORIES"/subcopy) |
| Book asset | [Hero.jsx:204](src/sections/Hero.jsx#L204) → `/alternativ/book_pages.webp` (in `public/alternativ/`) |
| Circular seal/ring | [Hero.jsx:19-38](src/sections/Hero.jsx#L19) `SpinSeal` (generated SVG textPath) |
| CTA buttons | [Hero.jsx:184-195](src/sections/Hero.jsx#L184) |
| Scroll indicator | **absent** — no code |
| Bloom cutouts / assets | [Hero.jsx:8-17](src/sections/Hero.jsx#L8) `BURST` + [src/lib/assets.js:40-49](src/lib/assets.js#L40) `elements` |
| Background pattern | [Hero.jsx:152-158](src/sections/Hero.jsx#L152) (one tiled div) |
| Animation engine | GSAP ScrollTrigger [Hero.jsx:1-3,91-133](src/sections/Hero.jsx#L91); scroll driver [src/lib/smooth-scroll.jsx](src/lib/smooth-scroll.jsx) (Lenis) |
| Design tokens | [tailwind.config.js](tailwind.config.js), [src/index.css](src/index.css) |
| Nav (row above hero) | [src/components/SiteNav.jsx](src/components/SiteNav.jsx) |

Reference equivalent: a single Webflow `.hero-section` block with IX2 scroll interactions (`data-w-id` on `.hero-section-scroll-wrapper`, `.hero-section_content_title-wrapper`, `.hero-section_graph-wrapper`).

---

## B. COMPONENT / DOM HIERARCHY (our actual JSX)

```
Hero  <section #hero, height:220vh, bg #0c2f4a>              [Hero.jsx:149]
├── div.background-watermark  (one tiled repeat SVG, opacity-10, inset-0) [152]
└── div ref=pin  (sticky top-0, h-100svh, flex-center)      [160]
    ├── div ref=textWrap  (z-30, flex-col items-center)      [163]
    │   ├── div.title-block                                  [165]
    │   │   ├── div "PRINTING"  (green #7eb343, 14vw, mr-10vw)  [167]
    │   │   └── div.STORIES-row (ml-10vw, flex items-center) [172]
    │   │       ├── span > SpinSeal   (w-117px, -mt-30, mr-16) [173]
    │   │       └── "STORIES" (white, 14vw)                   [176]
    │   ├── p.subcopy  (14px, center, mt-12 mb-8)            [180]
    │   └── div.CTA-row  (gap-6)                              [184]
    │       ├── a "Our expertise" (pill, border-white/40)    [185]
    │       └── a "Our approach"  (underline)                [192]
    └── div.book-wrapper  (absolute, mt-64vh, z-10)          [199]
        └── div ref=bookWrap  (w 150/130/100vw, max-w-1400) [200]
            ├── img book_pages.webp  (z-5, drop-shadow)      [203]  ← LETTERED asset
            └── div.burst-layer (absolute center, z-20)      [210]
                └── shown[].map → div ref → img cutout       [211]
```
**No scroll indicator node. No second book layer** (`bookCoverEl` ref declared [Hero.jsx:47] but never mounted).

Reference hierarchy **[REF-DOM]**:
```
.hero-section
├── .navbar (brand · menu · right: .navbar_language-wrapper + .navbar_menu-btn)
├── .hero-section_content
│   ├── h1 > .title-wrapper > .title-line._1(green "Printing") + .title-line._2(img.seal + "Stories")
│   ├── p.hero-section_content_p
│   └── .button-box (button.outline-white + button-link.white)
├── .hero-section_graph-wrapper (mt 64vh)
│   ├── img.hero-section_graph_book        ← BLANK base
│   ├── img.hero-section_graph_book.over   ← LETTERED overlay (abs, z-15)
│   └── .hero-section_graph-details (8× graph-details1..8 = bloom cutouts)
├── img.hero-section_bg-detail1  (bottom-LEFT, 295px)
├── img.hero-section_bg-detail2  (bottom-RIGHT, 295px)
└── .hero-section_scroll-wrapper > .scroll-base > .scroll-dot + .scroll-txt "Scroll"
```

---

## C. STYLING SOURCE MAP

| Part | Our styling source |
|---|---|
| Navbar row | Tailwind classes + `.label` global class ([SiteNav.jsx:45-52](src/components/SiteNav.jsx#L45), [index.css:64](src/index.css#L64)) |
| Title line 1 (PRINTING) | Tailwind inline: `text-[20vw] md:text-[14vw]`, `text-[#7eb343]`, `leading-[0.8]`, `tracking-tight`, `mr-[10vw]` [Hero.jsx:167] |
| Title line 2 (STORIES) | Tailwind: same sizes, `text-white`, `ml-[10vw]`, flex row [Hero.jsx:172] |
| Circular text | JS-generated SVG `<textPath>`, inline `style` fontSize 13.5, `animate-[spin_22s]` [Hero.jsx:19-38] |
| Subcopy | Tailwind: `text-[14px] leading-[20px] mt-12 mb-8`, centered [Hero.jsx:180] |
| CTA row | Tailwind pills, `border-white/40` [Hero.jsx:184-195] |
| Book image | `<img>` + Tailwind `w-full drop-shadow-[...]`; wrapper vw widths + `max-w-[1400px]`, `mt-[64vh]` [Hero.jsx:200-207] |
| Scroll chip | — none — |
| Side patterns | Inline `style` backgroundImage, `backgroundSize:150px`, `opacity-10`, single full-inset div [Hero.jsx:152-158] |
| Section height/overflow | Inline `style={{height:'220vh'}}`, `bg-[#0c2f4a]`; pin is `sticky top-0 h-[100svh]` [Hero.jsx:149,160] |
| Animations | GSAP timeline + ScrollTrigger scrub, `gsap.set`/`fromTo` [Hero.jsx:91-133] |

---

## D. SPOT-THE-DIFFERENCE TABLE

| Area | Reference behavior | Our behavior | Exact reason (our code) | Sev | Fix type |
|---|---|---|---|---|---|
| Title font-size (desktop) | **10vw** `[REF-CSS]` | **14vw** | `md:text-[14vw]` [Hero.jsx:167,172] — 14vw is the reference's *991px tablet* size | **major** | sizing |
| Title line-height | 74% `[REF-CSS]` | 80% | `leading-[0.8]` | medium | typography |
| Title letter-spacing | -0.2vw `[REF-CSS]` | ~-0.05em | `tracking-tight` | minor | typography |
| Title font family | `Metrisch, 700` `[REF-CSS]` | Bricolage/system `extrabold` | `font-extrabold` + no Metrisch loaded | medium | typography |
| PRINTING↔STORIES relation | column, centered; green `margin-left:-23px` `[REF-CSS]` | diagonal stagger via `mr-[10vw]`/`ml-[10vw]` | [Hero.jsx:167,172] invented offsets | **major** | positioning |
| Brand green | `#6ebe4a` `[REF-CSS]` | `#7eb343` | [Hero.jsx:167] | minor | typography |
| Circle badge type | SVG image, `width:117` `[REF-DOM]` | generated `<textPath>` | `SpinSeal` [Hero.jsx:19-38] | medium | asset |
| Circle badge text | lowercase "printing stories" | renders **CAPS** + "PRIPRINTING" overlap | inherits `uppercase` from parent; `{text}{text}` doubled [Hero.jsx:32] | medium | typography/asset |
| Circle badge offset | `mt-26 ml-11 mr9` `[REF-CSS]` | `-mt-30 mr-16` | [Hero.jsx:173] | minor | positioning |
| Subcopy font-size | **26px** `[REF-CSS]` | **14px** | `text-[14px]` [Hero.jsx:180] | **major** | sizing |
| Subcopy align/offset | left, `margin-left:106px` `[REF-CSS]` | centered | `text-center` context [Hero.jsx:163,180] | medium | positioning |
| Subcopy bottom margin | 40px `[REF-CSS]` | 32px (`mb-8`) | [Hero.jsx:180] | minor | spacing |
| CTA button border | `1px solid white` `[REF-CSS]` | `border-white/40` | [Hero.jsx:185] | minor | typography |
| Book layers | 2 (blank base + lettered `.over` abs z15) `[REF-DOM/CSS]` | **1** (lettered only) | [Hero.jsx:203-207] renders `book_pages.webp` only | **major** | asset/masking |
| Printed page text | hidden by blank base until reveal | **always visible / too dark** | wrong asset shown as sole base | **major** | asset/masking |
| Book vertical anchor | `margin-top:64vh` abs `[REF-CSS]` | `mt-[64vh]` abs | [Hero.jsx:199] — **matches** | none | — |
| Book rise mechanism | `.visible` 64vh→26vh `[REF-CSS]` | fixed `y:-335px` | [Hero.jsx:108] | medium | animation |
| Scroll indicator | pill: dot + "Scroll", `#0c2f4a63`, r50, pad10/25 `[REF-CSS]` | **absent** | no node | **major** | asset/positioning |
| Side decorative blocks | 2 discrete 295px SVGs bottom-L/R `[REF-DOM/CSS]` | 1 full-inset tiled div @150px | [Hero.jsx:152-158] | medium | positioning/asset |
| Ghost title scale | wrapper scales up big while fading `[REF-DOM will-change]` | scales only to `1.15` then opacity 0 | [Hero.jsx:105] | **major** | animation |
| Section bg color | `#0c2f4a` | `bg-[#0c2f4a]` | **matches** | none | — |
| Hero height/overflow | Webflow pinned scroll wrapper | `height:220vh` + sticky pin | [Hero.jsx:149,160] | ok (mechanism differs) | — |

---

## E. EXACT CODE SNIPPETS CAUSING EACH PROBLEM

**ISSUE: Hero title 40% too large**
FILE: src/sections/Hero.jsx:167,172
```jsx
<div className="font-extrabold uppercase leading-[0.8] text-[#7eb343] text-[20vw] md:text-[14vw] tracking-tight relative z-10 mr-[10vw]">PRINTING</div>
...<div className="... text-white text-[20vw] md:text-[14vw] ... ml-[10vw] flex items-center">
```
WHY: `[REF-CSS] .hero-section_content_title-line_txt { font-size:10vw; line-height:74% }` on desktop. `14vw` is the reference's ≤991px value. On a 1536px viewport we render 14vw (215px) vs reference 10vw (153px). `leading-[0.8]` vs `74%` also loosens the two lines. The `mr-[10vw]`/`ml-[10vw]` produce a diagonal stagger the reference does not have (reference only nudges the green line `margin-left:-23px`).

**ISSUE: Ring in caps + "PRIPRINTING" overlap, wrong technique**
FILE: src/sections/Hero.jsx:23,31-32
```jsx
const text = 'printing stories printing stories '
<text className="fill-white" style={{ fontFamily:'sans-serif', fontSize:13.5, letterSpacing:2 }}>
  <textPath href="#sealPath" startOffset="0">{text}{text}</textPath>
</text>
```
WHY: The seal lives inside the `uppercase` STORIES div ([Hero.jsx:172]) so the SVG text inherits `text-transform:uppercase`. `{text}{text}` renders the already-doubled string ~4×, overflowing the ring → the "PRIPRINTING" seam overlap. Reference [REF-DOM] uses a **prebuilt SVG image** `..._en_...svg` at `width:117`, not generated text.

**ISSUE: Copy spacing/size**
FILE: src/sections/Hero.jsx:180
```jsx
<p className="text-[14px] leading-[20px] text-white/90 font-medium ... mt-12 mb-8">
```
WHY: `[REF-CSS] .hero-section_content_p { font-size:26px; line-height:120%; margin-left:106px; text-align:left; margin-bottom:40px }`. Ours is 14px, centered — roughly half scale and different alignment.

**ISSUE: CTA styling**
FILE: src/sections/Hero.jsx:185
```jsx
<a className="... rounded-full bg-transparent border border-white/40 px-6 py-2.5 ...">
```
WHY: `[REF-CSS] .button.outline-white { border:1px solid var(--white) }` (full-opacity white). Ours is 40% white → fainter outline.

**ISSUE: Book renders the lettered asset (printed text visible)**
FILE: src/sections/Hero.jsx:203-207
```jsx
<img src="/alternativ/book_pages.webp" alt="Book" className="w-full relative z-[5] ... drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
```
WHY: `book_pages.webp` is the **lettered** page art (2830×1770, alpha; visibly printed "FRIENDSHIP / HAPPY / HOME / HOBBY / SUCCESS / MOTION / STYLE / DREAM"). It is the sole, always-opaque base. See Section H.

**ISSUE: No masking / second book layer**
FILE: src/sections/Hero.jsx:47-48, 203-207
```jsx
const bookCoverEl = useRef(null)   // declared…
const bookPagesEl = useRef(null)   // …never attached to any element
```
WHY: `[REF-DOM/CSS]` reference stacks `img.hero-section_graph_book` (blank base) + `img.hero-section_graph_book.over { z-index:15; position:absolute }` (lettered overlay). The two-layer crossfade was scaffolded (refs) but only the lettered layer is mounted → no blank base to keep pages pristine.

**ISSUE: Decorative side patterns wrong**
FILE: src/sections/Hero.jsx:152-158
```jsx
<div className="pointer-events-none absolute inset-0 z-0 opacity-10"
  style={{ backgroundImage:'url(".../632ccd6e..._graph_symbol-repeat-white.svg")', backgroundSize:'150px 150px' }} />
```
WHY: `[REF-DOM]` uses **two** discrete `<img>` of the same SVG, `width:295`, `[REF-CSS] .bg-detail1 { inset:auto auto 0% 0% }` (bottom-left) and `.bg-detail2 { inset:auto 0% 0% auto }` (bottom-right). Ours tiles it edge-to-edge instead of two corner blocks.

**ISSUE: Hero overflow/height mechanism**
FILE: src/sections/Hero.jsx:149,160
```jsx
<section id="hero" ... className="... bg-[#0c2f4a]" style={{ height:'220vh' }}>
  <div ref={pin} className="sticky top-0 h-[100svh] flex ...">
```
WHY: This is a valid pin, but the whole intro is compressed into 220vh with a fixed `y:-335` book rise, versus the reference's vh-based 64vh→26vh reveal — phases overlap (see Section I / G).

**ISSUE: Scroll indicator missing**
FILE: (none)
WHY: `[REF-DOM]` `.hero-section_scroll-wrapper > .scroll-base > .scroll-dot + .scroll-txt "Scroll"`; `[REF-CSS] .scroll-base { background:#0c2f4a63; border-radius:50px; padding:10px 25px; gap:20px }`, `.scroll-txt { letter-spacing:5px; text-transform:uppercase; font-size:11px }`. No equivalent exists in our tree.

---

## F. REFERENCE IMPLEMENTATION OBSERVATIONS

I obtained **the reference's real source** offline: the scraped Webflow page (`asset_download_37.htm`) and its live production CSS (`recon/final-2/altcss.css`). So these are **confirmed**, not inferred:

- **Layout** is art-directed/staged, not document flow: `.hero-section_graph-wrapper` is `position:absolute; inset:0; margin-top:64vh`; the book is absolutely anchored and animates `margin-top` on a `.visible` state (64vh → 26vh) `[REF-CSS]`.
- **Book is cropped/masked by layering**: two stacked `graph_book` images; the lettered one is the `.over` layer (`z-index:15; position:absolute`) `[REF-CSS]`.
- **Circle text is a static SVG image** (`width:117`), rotated by JS (inline `rotateZ(102deg)` captured) — **not** rotated live text `[REF-DOM]`.
- **Side ornaments are two discrete `<img>` elements** (295px), corner-pinned bottom-left/right — not a pseudo-element or full tile `[REF-DOM/CSS]`.
- **Bloom cutouts** are 8 absolutely-positioned images `hero-section_graph-details1..8` using the exact `graphs-wf_book-intro1..8.webp` files we already ship in `public/alternativ/` `[REF-DOM]`.
- **Overflow**: `.hero-section_graph-wrapper` becomes `overflow:hidden` at tablet/mobile breakpoints `[REF-CSS]`.
- **Nav** has a language dropdown (`.navbar_language-wrapper`, En/Fr/Pt) and a `.navbar_menu-btn` (`icon_menu-white.svg`, width 35) `[REF-DOM]`.
- **Motion** is Webflow IX2 (scroll-scrubbed transforms on `data-w-id` nodes), whereas ours is GSAP — functionally comparable, values differ.

*(No informed-inference gap remains here — DOM + CSS were both retrieved.)*

---

## G. RESPONSIVE / SCALING FAILURE ANALYSIS

| Rule (ours) | Effect | Why it drifts from reference |
|---|---|---|
| `text-[20vw] md:text-[14vw]` [Hero.jsx:167,172] | desktop title 14vw | Reference desktop base is **10vw**; 14vw is its 991px tier. We never step down to 10vw at large widths → permanently oversized. |
| `mr-[10vw]` / `ml-[10vw]` | ±10vw diagonal stagger that grows with viewport | Reference has centered column + green `margin-left:-23px` (fixed, tiny). Ours scales the offset with vw → worsens on wide screens. |
| `leading-[0.8]` | 80% leading | Reference 74% — lines sit farther apart. |
| `text-[14px]` subcopy | fixed 14px | Reference 26px (px, not fluid); ours reads tiny at every width. |
| `w-[150vw] md:w-[130vw] lg:w-[100vw] max-w-[1400px]` [Hero.jsx:200] | book scales by vw with a hard 1400px cap | Reference book is `width:100%` of a centered wrapper (no vw ladder); our vw ladder + cap changes the book/text mass ratio across widths. |
| `y:-335` (px) book rise [Hero.jsx:108] | fixed pixel rise | Reference rise is vh-based (64vh→26vh) → ours under/over-rises depending on viewport height. |
| `b.vx*innerWidth*0.35`, `b.vy*innerHeight*-0.45` [Hero.jsx:126-127] | bloom spread tied to window size | Fine in principle, but base sizes (`130 + …`) are small → sparse on large screens. |
| `height:220vh` [Hero.jsx:149] | total scroll length of the intro | Compresses fade+rise+bloom into one short scrub; phases overlap at speed (see I). |

Primary scaling culprits: the **14vw desktop title** and the **±10vw stagger** — together they make the headline too big and diagonally misaligned versus the reference's contained, centered 10vw block.

---

## H. BOOK TEXT VISIBILITY DIAGNOSIS

**Root cause: wrong asset used as the sole, always-opaque base layer.**

Evidence:
- We render `/alternativ/book_pages.webp` [Hero.jsx:204]. Viewing that file directly: open book with **hand-lettering printed on both pages** ("FRIENDSHIP / HAPPY / HOME / HOBBY" left; "SUCCESS / MOTION / STYLE / DREAM" right). Intrinsic **2830×1770, alpha**.
- The repo **also contains `public/alternativ/book_cover.webp`** — the identical open book with **blank pristine pages** (no lettering). It is **not referenced anywhere**.
- `[REF-DOM]` the reference ships **both** as stacked layers: `img.hero-section_graph_book` (blank base) + `img.hero-section_graph_book.over` (lettered), and `[REF-CSS] .over { z-index:15; position:absolute; margin-bottom:-16px }`. The lettered layer is an overlay that reveals; the blank base keeps pages clean during the rise/ghost phase.
- Our `bookCoverEl`/`bookPagesEl` refs [Hero.jsx:47-48] show a two-layer design was intended but never wired.

So, point by point:
- Wrong asset? **Yes** — `book_pages.webp` (lettered) is used where the blank base belongs.
- Right asset cropped wrong? No — cropping/position is fine.
- Book too high? No — `mt-[64vh]` matches reference.
- Mask/overlay missing? **Yes** — the blank-base + reveal-overlay pairing is missing.
- Opacity/blend missing? **Yes** — the lettered layer runs at full opacity from frame 0 (no fade/reveal).
- Reference hides the printed text intentionally? **Yes** — until the reveal, via the blank base layer.

`[RUNTIME]` cross-check: our page lettering reads darker/busier than the reference at the same scroll point (`recon/final-2/crops/*bloom*`), consistent with showing the lettered layer as the base.

---

## I. SCROLL / EFFECTS AUDIT

Present in our build:
- **Sticky pin** — yes, `ref=pin sticky top-0 h-[100svh]` [Hero.jsx:160], section 220vh.
- **Scroll-scrubbed timeline** — yes, GSAP ScrollTrigger `scrub:0.2`, `start top top`/`end bottom bottom` [Hero.jsx:91-100].
- **Text fade/scale on scroll** — yes, `opacity:0, scale:1.15, yPercent:-15` [Hero.jsx:105].
- **Book rise** — yes, `y:-335` [Hero.jsx:108].
- **Bloom burst** — yes, per-cutout `fromTo` with `back.out(1.2)` [Hero.jsx:116-132].
- **Idle floating** on cutouts — yes, yoyo sine tween [Hero.jsx:79-87].
- **Ring rotation** — yes, CSS `animate-[spin_22s_linear_infinite]` [Hero.jsx:26].
- **Reduced-motion fallback** — yes, static hero [Hero.jsx:139-145].

Missing / weaker than reference:
- **Ghost giant-title scale** — ours scales only to 1.15 then hits opacity 0; reference scales the title-wrapper large while fading (the big faint "PRINTING STORIES" behind the book). **Missing.**
- **Scroll indicator (and any pulse on it)** — **absent.**
- **Two-layer book reveal (blank→lettered)** — **absent** (single layer).
- **Corner side-pattern blocks** — replaced by a static full tile; no parallax on them.
- **Book rise easing/target** — fixed px rise vs reference vh reveal; phases overlap so bloom fires while the book is still rising `[RUNTIME]`.

---

## J. TOP 10 THINGS THAT MUST CHANGE LATER (for pixel-perfect match)

1. **Title size + alignment** — set desktop `font-size:10vw` (not 14vw), `line-height:74%`, `letter-spacing:-0.2vw`; remove the `mr-[10vw]`/`ml-[10vw]` stagger, center the column, give the green line `margin-left:-23px`. [Hero.jsx:167,172]
2. **Book layering / printed text** — mount two layers: blank base = `book_cover.webp`, lettered overlay = `book_pages.webp` as an absolute `.over` that reveals on scroll; stop rendering the lettered art as the sole opaque base. [Hero.jsx:203-207,47-48]
3. **Add the SCROLL indicator** — dot + "Scroll" pill: `background:#0c2f4a63; border-radius:50px; padding:10px 25px; gap:20px`, text `letter-spacing:5px; uppercase; 11px`. (new node)
4. **Ghost title motion** — scale the title-wrapper up (~2.5–4×) while fading to a low non-zero opacity instead of `scale:1.15 → opacity:0`. [Hero.jsx:105]
5. **Seal as SVG, lowercase, single pass** — swap `SpinSeal` textPath for the real seal SVG (`width:117`), or at minimum add `lowercase`/`normal-case` and render `{text}` once; fix the "PRIPRINTING" overlap. [Hero.jsx:19-38]
6. **Subcopy scale/placement** — `font-size:26px; line-height:120%; text-align:left; margin-left:106px; margin-bottom:40px` (from 14px centered). [Hero.jsx:180]
7. **Nav parity** — add the language switcher (`icon_language-white.svg` + En/Fr/Pt) and the `MENU` button (`icon_menu-white.svg`); switch nav links from `.label` (uppercase, 0.28em) to `16px / weight 500 / Title Case`. [SiteNav.jsx:45-52]
8. **Side decorative blocks** — replace the full-inset tile with two corner-pinned 295px SVGs (`bg-detail1` bottom-left, `bg-detail2` bottom-right). [Hero.jsx:152-158]
9. **Brand green + CTA border** — green `#6ebe4a` (not `#7eb343`); CTA outline `1px solid white` (not `white/40`). [Hero.jsx:167,185]
10. **Book rise mechanism** — drive the rise by vh (≈64vh→26vh) and sequence bloom to fire *after* the rise settles, giving each phase its own scroll room (lengthen the pin). [Hero.jsx:108,116-132,149]

*Reference source archived at `recon/final-2/altcss.css`; scraped DOM at `public/alternativ/asset_download_37.htm`.*
