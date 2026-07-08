# LIVE RUNTIME PROBE — alternativinc.com hero

**Rig:** Playwright headed Chromium · 1536×743 · deviceScaleFactor 1.25 · `waitUntil:load` + networkidle + 4000ms · **real `mouse.wheel` events** in 140px steps. Target: `https://www.alternativinc.com/`.
**Artifacts:** `recon/final-2/live/` — `nodemap-rest.json`, `timeline.json`, `book-imgs.json`, `seal.json`, `BOOK_over.webp`, `BOOK_base.webp`, `sweep-00..13`, `state-1..7`, `crop-*`.
**Evidence tier:** everything below is **CONFIRMED runtime** (measured from the live DOM) unless tagged **[INFERENCE]**.

> ⚠️ **Correction to the earlier static recon.** The live runtime overturns one guess: the fading book layer (`.over`) is the **BLANK** one, not the lettered one. See Section D. The printed page text is hidden early by a blank overlay that fades OUT — the base stays lettered the whole time.

---

## A. LIVE NODE MAP (all target nodes present unless noted)

| Node | tag | pos | z | present | notes |
|---|---|---|---|---|---|
| `.hero-section-scroll-wrapper` | div | **static, h=1858** | auto | ✅ | the pin track (1858px → ~1115px of pinning) |
| `.hero-section` | div | **sticky, top:0, h=743** | auto | ✅ | sticky pin (not a GSAP pin) |
| `.navbar` | div | — | — | ✅ | |
| `.hero-section_content` | div | relative | 20 | ✅ | h=618 @top125 |
| `.hero-section_content_title-wrapper` | div | static | auto | ✅ | **animated: scale+opacity** |
| `.hero-section_content_title-line._1 / ._2` | div | static/flex | auto | ✅ | line2 is `display:flex` (seal+STORIES inline) |
| `.hero-section_content_title-line_txt.green` | div | static | auto | ✅ | "Printing", `#6ebe4a` |
| `.hero-section_content_title-line_seal` | **img** | static | auto | ✅ | SVG, width 117, spinning |
| `.hero-section_content_title-line_txt` (line2) | div | static | auto | ✅ | "Stories", white |
| `.hero-section_content_p` | p | static | auto | ✅ | 26px |
| `.button-box` / `.button.outline-white` / `.button-link.white` | div/a/a | static | auto | ✅ | |
| `.hero-section_graph-wrapper` | div | **absolute, inset0, z15** | 15 | ✅ | **animated: translateY** |
| `.hero-section_graph_book.over` | img | **absolute, z15** | 15 | ✅ | **BLANK pages**, fades out |
| `.hero-section_graph_book` (base) | img | static | auto | ✅ | **LETTERED pages**, stays |
| `.hero-section_graph-details` | div | — | — | ✅ | parent of the 8 characters |
| `.hero-section_graph-details1..8` | img | absolute | — | ✅ | character cutouts, bloom |
| `.hero-section_bg-detail1` | img | absolute, bottom-left | auto | ✅ | 295×202, **static** |
| `.hero-section_bg-detail2` | img | absolute, bottom-right | auto | ✅ | 295×202, mb −104px, **static** |
| `.hero-section_scroll-wrapper/base/dot/txt` | div×4 | static | auto | ✅ | pill: dot + "Scroll" |
| `.navbar_language-wrapper` | div | static | auto | ✅ | globe + En/Fr/Pt |
| `.navbar_menu-btn` | a>img | static | auto | ✅ | `icon_menu-white.svg` w35 |

---

## B. REST COMPUTED STYLE TABLE (scrollY = 0)

| Node | box (w×h @top,left) | font | color / bg / border | pos / margins |
|---|---|---|---|---|
| PRINTING (`.green`) | 743×114 @220,378 | **153.6px** / lh 113.66px / ls **−3.072px** / 700 / uppercase | `#6ebe4a` | static, **ml −23px** |
| Seal (img) | **146×148** @313,375 | — | — | static, **ml −11px, mt −26px, mr 9px** |
| STORIES | 605×114 @343,516 | 153.6px / lh 113.66 / ls −3.072 / 700 / uppercase | `#ffffff` | static |
| Subcopy | 962×31 @467,332 | **26px** / lh 31.2 / 400 | `#ffffff` | static, **ml 106px, mb 40px**, left-aligned |
| Button outline | 239×62 @541,570 | 18px / 500 | border **0.8px solid #fff**, radius **40px**, bg transparent | static |
| Button link | 111×20 @562,839 | 18px / 500 | `#fff`, underline | static |
| graph-wrapper | 1521×951 @476,0 | — | — | **absolute, z15, inset0** (mt 64vh via layout) |
| book `.over` | 1521×951 @476,0 | — | — | **absolute, z15** |
| book base | 1521×951 @476,0 | — | — | static |
| bg-detail1 | 295×202 @542,0 | — | — | absolute bottom-left |
| bg-detail2 | 295×202 @646,1226 | — | — | absolute bottom-right, mb −104px |
| scroll-base | **147×40** @688,687 | — | bg **rgba(12,47,74,0.39)**, radius **50px**, pad 10/25, gap 20 | static |
| scroll-dot | 6×6 @701,712 | — | bg `#fff`, radius 100% | static |
| scroll-txt | 71×20 @698,738 | **11px** / ls **5px** / 500 / uppercase | `#fff` | "Scroll" |
| nav item | 97×20 @52,332 | **16px / 500 / none (Title Case)** | `#fff` | relative |
| lang wrapper | 64×20 @52,1330 | — | — | globe icon + "En" |
| menu btn | 35×35 @45,1409 | — | — | `icon_menu-white.svg` |
| brand img | 165×28 @48,77 | — | — | logo width 165 |

---

## C. SCROLL STATE TABLE (real-wheel sweep, `timeline.json`)

| state | scrollY | titleWrap scale | titleWrap op | graphWrap ty | over.op | base.op | bloom (d1 h) | pill.op | pill.top |
|---|---|---|---|---|---|---|---|---|---|
| **REST** | 0 | 1.00 | 1 | 0 | 1 | 1 | 0 (hidden) | 1 | 688 |
| **EARLY FADE** | 280–420 | 1.00 | **0.78 → 0.51** | 0 | 1 | 1 | 0 | 1 | 688 |
| (fade deepens) | 560 | 1.00 | 0.25 | 0 | 1 | 1 | 0 | 1 | 688 |
| **MID RISE** | 700 | **1.09** | 0.002 | **−10** | 1 | 1 | 0 | 1 | 688 |
| (rise) | 840 | **2.17** | 0.03 | **−293** | 1 | 1 | scaling | 1 | 688 |
| **GHOST TITLE** | 980 | **3.00** | **0.05** | **−334** | **0.82** | 1 | 113 | 1 | 688 |
| **BLOOM START** | 1120 | 3.00 | 0.07 | −334 | **0.05** | 1 | growing | 1 | 683 |
| **BLOOM PEAK** | 1260 | 3.00 | 0.07 | −334 | **0** | 1 | **518 (full)** | 1 | 543 |
| **LANDING** | 1680–1820 | 3.00 | 0.07 | −334 | 0 | 1 | full | 1 | 123 → −17 |

**Confirmed timing sequence** (all real-wheel measured):
- **Title fade** starts immediately after rest (~y140) and reaches ~0 at **y700**. It is the **wrapper opacity** that animates (0.07 floor), *not* the text nodes (text op stays 1).
- **Title scale-up** runs **y560 → y980**: `scale 1 → 3.0`, settling at **3.0 / opacity 0.07** — the giant faint ghost.
- **Book rise** runs **y560 → y980**: `translateY 0 → −334px`, then holds. (Overlaps the title scale.)
- **`.over` (blank) fades** **y840 → y1260**: `1 → 0`, i.e. *after* the rise → reveals the lettered base.
- **Bloom** scales/fades in **~y840 → y1260**, *after* the rise, finishing as `.over` hits 0.
- **Scroll pill** never fades (op 1 throughout); it stays pinned (top 688) during the pin, then scrolls away after y1120.
- **Side ornaments** never animate (transform idle); pinned then scroll away.
- Opacity reaches **near-0, not exactly 0** for the title (floor 0.07 → deliberate ghost).

---

## D. BOOK LAYER FORENSICS  ★ (critical, corrects prior recon)

| layer | class | src file | intrinsic | z / pos | REST op | scroll behavior | content |
|---|---|---|---|---|---|---|---|
| **overlay** | `.hero-section_graph_book.over` | `632b6a18…_graph_book-hero.webp` | 2000×1251 | **z15, absolute** | 1 | **fades 1→0 (y840–1260)** | **BLANK pristine pages** (verified: `BOOK_over.webp`) |
| **base** | `.hero-section_graph_book` | `6390a6a0…_graph_book-hero-(1)(1).webp` | 2830×1770 | auto, static | 1 | stays 1 | **LETTERED pages** ("FRIENDSHIP/HAPPY/HOME/HOBBY … SUCCESS/MOTION/STYLE/DREAM") (verified: `BOOK_base.webp`) |

- Which is blank base? **The `.over` layer is blank; the static base is lettered.** (The names are counter-intuitive — verified by fetching and viewing both files.)
- `.over` absolutely positioned? **Yes** (`position:absolute; z-index:15`).
- `.over` starts visible or hidden? **Visible (op 1)** at rest.
- `.over` opacity over scroll? **1 until y840, → 0.82 (y980) → 0.05 (y1120) → 0 (y1260+).**
- `.over` vertical offset? `margin-bottom` −16px per CSS (0 at runtime desktop); no transform.
- Is lettered art hidden early / revealed later? **Yes.**

**VERDICT — how the real site hides printed text early:** the lettered pages are the *permanent base layer*; a **blank pristine-page image sits on top at `z-index:15`, opacity 1**, masking the lettering. As the book finishes rising (y840→y1260) that blank overlay **fades to 0**, revealing the printed lettering underneath at the same moment the characters bloom. It is an **opacity crossfade of a blank overlay**, not an asset swap and not a mask/clip.

**Maps to our repo:** our `public/alternativ/book_cover.webp` = the BLANK overlay (2000×1251-class); our `book_pages.webp` (2830×1770) = the LETTERED base. Our build currently renders only `book_pages.webp` (lettered) with no blank overlay → lettering shows from frame 0. *(This does not prescribe an edit — evidence only.)*

---

## E. TITLE + SEAL MEASUREMENTS (REST)

- PRINTING box 743×114 @top 220; STORIES box 605×114 @top 343.
- **PRINTING bottom (334) → STORIES top (343) = 9px gap** between the two lines (they nearly touch; line-height 74% = 113.66px on 153.6px type).
- **Seal:** rendered **146×148** (declared width 117; scales with the flex row), @top 313, left 375.
- Seal sits **inline inside `.title-line._2`** (`display:flex; align-items:center`), *before* the "Stories" text; STORIES text left edge = 516, so **seal→STORIES gap ≈ 516 − (375+146) = −5px** (they overlap slightly, seal tucks into the S). Seal offsets: **margin −26px / 9px / 0 / −11px** (top/right/bottom/left).
- Seal position mode: **static + inline (flex child)**, shifted only by negative margins; **not absolute**.
- **Seal rotateZ at REST:** transform `matrix(-0.964, 0.266, −0.266, −0.964)` → **≈ 164.6°** (mid-spin).
- Seal rotation source: **idle continuous spin** (Webflow/CSS animation), independent of scroll — value differs frame to frame; it does not scrub with scroll.
- **Seal element type:** **SVG `<img>`** (`…_en_…svg`, width 117) — not inline SVG, not textPath, not canvas, not pseudo-element. **CONFIRMED.**

---

## F. SCROLL PILL FORENSICS

- Structure: `.hero-section_scroll-wrapper > .hero-section_scroll-base > (.hero-section_scroll-dot + .hero-section_scroll-txt)`.
- Text: **"Scroll"** (rendered uppercase).
- `.scroll-txt`: font-size **11px**, letter-spacing **5px**, weight **500**, uppercase, color `#fff`.
- `.scroll-base`: **147×40**, padding **10px 25px**, gap **20px**, border-radius **50px**, background **rgba(12,47,74,0.39)** (`#0c2f4a63`), flex row.
- `.scroll-dot`: **6×6**, white, border-radius 100%.
- Position: **inside hero flow** (static), sits at viewport ~top 688 (bottom-center) during the pin; **not fixed/absolute**.
- Fade/move: **never fades** (op 1 throughout); stays put during the pin then scrolls away with the page after ~y1120.

---

## G. BLOOM CUTOUT FORENSICS (`graph-details1..8` = the character cutouts)

Assets are the `graphs-wf_book-intro1..8.webp` characters (verified: intro1 = Asterix+Obelix, intro2 = pink chocolate monster, etc.) — **the same files our build already ships.**

Two reveal mechanisms, all within **~y840→y1260, after the rise**:

| cutout | REST | GHOST y980 | PEAK y1260 | mechanism | role at peak |
|---|---|---|---|---|---|
| d1 (Asterix+Obelix) | scale 0, h0 | h113 | **h518** | **scale 0→1** | center, largest |
| d2 (pink monster) | scale 0, h0 | h59 | h374 | scale 0→1 | center-right |
| d3 | op0, h306 | op0.12 | op1, h306 | **opacity 0→1** | left framing (bed/person) |
| d4 | op0, h162 | op0.25 | op1, h162 | opacity 0→1 | left-center |
| d5 | scale 0 | h69 | h240 | scale 0→1 | right (grey monster) |
| d6 | scale 0 | h22 | h149 | scale 0→1 | small accent |
| d7 | scale 0 | h69 | h246 | scale 0→1 | right |
| d8 | scale 0 | h21 | h61 | scale 0→1 | small (star/ink) |

- **Individually animated** (each has its own transform/opacity), *plus* all ride the parent `graph-wrapper` translateY (their `top` decreases through the sweep).
- **Outside page edges at peak:** the framing characters (bottom-left speech-bubble figure, bottom-right chef, per `state-6-bloom-peak.png`) sit **beyond the book perimeter** — these are among d3/d4 (opacity-revealed, full-scale, edge-anchored). Center characters (d1/d2/d5) scale up on the pages.
- Mix: **6 scale-in (d1,d2,d5,d6,d7,d8) + 2 opacity-in (d3,d4).**

---

## H. SIDE ORNAMENT FORENSICS

| node | src | box | inset | animates? | notes |
|---|---|---|---|---|---|
| `.hero-section_bg-detail1` | `632ccd6e…_graph_symbol-repeat-white.svg` | **295×202** | bottom-left (`inset:auto auto 0 0`) | **No** (transform idle) | visible throughout, then scrolls away |
| `.hero-section_bg-detail2` | same svg | 295×202 | bottom-right (`inset:auto 0 0 auto`), **mb −104px** | **No** | identical asset, mirrored by corner anchoring, sits ~104px lower |

- Same image both sides (not a separate mirrored asset — corner-anchored).
- **Remain visible the whole intro**; no opacity or transform animation; they simply scroll off with the page after the pin.

---

## I. NAV FORENSICS

- Brand image: **width 165** (@top 48, left 77), height 28.
- Nav links (`.navbar_menu_item`): **font-size 16px, weight 500, text-transform none (Title Case), color #fff.**
- Item spacing: items at left 332 ("Our expertise" w97) etc.; gap driven by wrappers (~24px visual).
- Language toggle: `.navbar_language-wrapper` (@left 1330) = globe **`icon_language-white.svg` (w20)** + text "En", with an `option`-list dropdown (En/Fr/Pt).
- Menu button: `.navbar_menu-btn` (@left 1409, **35×35**) = **`icon_menu-white.svg` (width 35)**.
- Right-side alignment: `.navbar_right-wrapper` holds language + menu, pinned right; nav row is `justify-between` (brand left, menu center, lang+menu right).

---

## J. SCREENSHOT FILE LIST (`recon/final-2/live/`)

| state | file | scrollY |
|---|---|---|
| rest | `state-1-rest.png` | 0 |
| early fade | `state-2-early-fade.png` | 420 |
| mid rise | `state-3-mid-rise.png` | 840 |
| ghost title | `state-4-ghost.png` | 980 |
| bloom start | `state-5-bloom-start.png` | 1120 |
| bloom peak | `state-6-bloom-peak.png` | 1260 |
| landing | `state-7-landing.png` | 1820 |

Crops: `crop-nav.png`, `crop-seal.png`, `crop-pill.png`, `crop-bloompeak.png`. Book layers: `BOOK_over.webp` (blank), `BOOK_base.webp` (lettered). Full sweep: `sweep-00..13`.

---

## K. CONFIRMED vs INFERRED

**CONFIRMED (runtime-measured):** every value in Sections A–I — node presence, computed boxes/styles, the scale/opacity/translate curves and their scrollY thresholds, the two book layers' identities and fade curve, seal type + rest rotation, pill geometry, bloom per-cutout mechanics, static side ornaments, nav metrics.

**[INFERENCE]:**
- Exact per-cutout final x/y *design intent* — I measured live rects but the Webflow keyframe easing between samples is interpolated from 140px steps (fine-grained but not the raw IX2 keyframes).
- Seal's precise idle-spin **period** — confirmed it spins and is scroll-independent, but I sampled one rotation value per step, not a full-period timing.
- Character→page *authoring* (which cutout is "meant" to be edge vs on-page) — inferred from peak rects + the screenshot, not from named data attributes.

**Could not probe / why:** raw Webflow IX2 keyframe JSON is not exposed on `window` in a readable form (interactions are compiled into `webflow.js`), so timings are reconstructed from sampled runtime transforms rather than read from source. Sampling granularity = 140px wheel steps (~220ms settle).

---

## L. FINAL MISSING VALUES WE NOW KNOW FOR A 1:1 REPLICA

1. **Title:** 153.6px (=10vw@1536), line-height 113.66px (74%), letter-spacing −3.072px (−0.2vw), weight 700, uppercase; green `#6ebe4a` with `margin-left:−23px`; **9px** gap between the two lines.
2. **Ghost motion:** title-**wrapper** scales **1→3.0** and fades **1→~0.07** across **y560–980**; text nodes stay op 1. Book **graph-wrapper translateY 0→−334px** across **y560–980**.
3. **Book reveal:** lettered base is permanent; **blank overlay (`z15, opacity 1`) fades 1→0 across y840–1260** to expose the lettering. (Use `book_cover.webp` as the fading overlay over `book_pages.webp`.)
4. **Bloom:** starts **after** the rise (y840→1260); 6 cutouts **scale 0→1**, 2 (**d3,d4**) **fade opacity 0→1**; each individually keyed *and* carried by the parent rise; framing characters land **outside** the page edges.
5. **Scroll pill:** 147×40, pad 10/25, gap 20, radius 50, bg `rgba(12,47,74,0.39)`, dot 6×6 white, text 11px/ls 5px/500 uppercase "Scroll"; **never fades**, sits bottom-center in hero flow.
6. **Seal:** SVG `<img>` width 117 (renders ~146–148 in the flex row), inline in line 2, margins −26/9/0/−11, continuous scroll-independent spin.
7. **Subcopy:** 26px, lh 120%, left-aligned, **margin-left 106px**, margin-bottom 40px.
8. **CTA:** outline button 239×62, radius 40px, **border 0.8px solid #fff**, 18px/500; secondary is an underlined text link, 18px/500.
9. **Side ornaments:** two 295×202 SVGs, corner-anchored bottom-left / bottom-right (right one mb −104px), **static** (no animation).
10. **Nav:** brand w165; links 16px/500/Title-Case; language wrapper (globe w20 + "En", dropdown En/Fr/Pt); menu button 35×35 (`icon_menu-white.svg`); pin structure sticky on `.hero-section` inside an **1858px** scroll track (~1115px pin length).
