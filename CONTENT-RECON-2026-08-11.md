# CONTENT-LEVEL DEAD SPACE + BROKEN CONTROLS — DEEP RECON 3

**Date:** 2026-08-11 · **Build under test:** local `HEAD 922556b` (includes Round-2 Lanes 1–3: WWP flex fix, mobile gap sweep, mobile Reach map, mobile FacilityBook deck). `pnpm build` → `vite preview` on :4188. **Read-only — no source edits, no commits.**
**Primary viewport:** 440×956, DPR 3, `isMobile`, `hasTouch` (owner's device class). Worst findings re-confirmed at **390×844** (all size-independent unless noted).

### git status — START
```
?? .lighthouseci/            ?? _assets-in/ _assets-in2/ _lane1..7/ _recon _recon2 _recon3/
?? FINAL-FIX-PLAN-2026-08-10.md  ?? MOBILE-RECON-2026-08-09.md  ?? MOBILE-UX-RECON-2026-08-09.md
?? PA11Y-AUDIT-2026-08-10.md  ?? RECON-2026-08-09.md  ?? UNLIGHTHOUSE-AUDIT-2026-08-10.md
?? "FINAL ASSETS ARE HERE.zip"  ?? "NEW QFP AV.mp4"  ?? "THE FINAL DESKTOP WEBSITE CHANGE/"
?? "WhatsApp Image 2026-07-29 at 1.12.52 PM.jpeg"  ?? drive-download-20260728T032950Z-1-001.zip
```
(all pre-existing untracked artifacts; the only file this recon adds is this report.)

---

## Method

**Content-block coverage scan.** For each route at 440×956, after a full scroll (lazy content mounted), the DOM is walked and every *painted content block* is collected — elements with direct visible text, raster media (`img`/`video`/`canvas`), and interactive controls. **Decorative SVGs and background-image layers are deliberately excluded from "content"**, so the space a decorative element *reserves* surfaces as a gap (this is precisely what section-padding audits and my own Lane-1 scan — which counted `svg` as media — missed). Blocks are merged into covered intervals; every vertical run between consecutive intervals is a gap. Measurement runs under `prefers-reduced-motion` (GSAP reveal sections early-return → everything visible → stable, no opacity:0 flicker). **Every gap was then re-screenshotted in NORMAL motion** and opened to classify **REAL VOID** (empty cream/navy) vs **FILLED** (occupied by a bg-image/canvas/line-art the scanner excluded — not dead, though possibly over-tall). Owning rule = walk the ancestor chain for the padding / min-height / fixed-height / margin that creates the space, confirmed against the component CSS/JSX.

Screenshots cited below live in the session scratchpad (`shot-*.png`); each was opened during the audit.

---

## 0. SELF-CHECK — the six owner marks all reproduce (except #1)

| # | Owner's mark | Reproduced? | True cause | Proof |
|---|---|---|---|---|
| 1 | Certs carousel arrows do nothing | **NO — arrows WORK** | `.certs-arrow onClick→scrollBy` fires on tap in **both Chromium and WebKit/Safari** (scrollLeft 0→318→636→954 Chromium; 0→636→1172 WebKit). Standard React onClick, `pointer-events:auto`, no overlay. | tapped 3×/engine; see §3 |
| 2 | Oversized gap: certs arrows → "HOW WE WORK" | **YES — 99px** | `.certs` `padding-bottom:56px` (index.css) + `.pv-section` `padding-top:43px` (ProcessVideo.css `.pv-section.pv-section`) meeting; a full band of dead cream. | shot-home-0.png |
| 3 | Dark trust band far taller than content | **YES** | `.proj-creds` credential list: `.proj-creds-grid` gap `clamp(32px,5vw,48px)` (≤639) + `.proj-cred-card` `grid-template-rows: auto 42px 1fr; gap:12px` — 4 items spread over ~748px with ~72px between each. | shot-hm2-0.png |
| 4 | Empty cream strip: process-video → trade band | **YES — 115px** | `.pv-section` `padding-bottom:64px` + `.tb-band` `padding-top:clamp(28px,4vh,44px)≈38px` — cream strip between the video and the gold rule. | shot-home-1.png |
| 5 | Marquee: too much padding for one line | **YES** | `#marquee` (Tailwind `pt-[18svh]`→capped 104px in Lane-1 + `pb-8`=32px) around one 20px word-row → a 156px band (content ratio **0.13**). Top 86px is the divider curve; ~50px is pure pad. | shot-home-2.png |
| 6 | Massive empty cream void before "Responsible by Practice" | **YES — ~458px** | `.svA-frame { height: clamp(420px,74vw,520px) }` (index.css:3347) = a **fixed 420px** "showpiece" panel whose cream→olive gradient + hairline line-art scene (`scn-sun/cloud/plant/grass`) is invisible on mobile → reads as a full screen of empty cream; + marquee `pb:32`. | shot-home-2.png, shot-hm2-1.png |

---

## 1. CONTENT-BLOCK GAP SCAN

### 1.1 — `/` (homepage) · docH 11203 @440 (11402 @390)

Gaps ordered by scroll position. "rhythm" = a section-boundary sum of two in-band 48–64px paddings (the established Round-1/2 mobile rhythm — acceptable, listed for completeness). Bold = content-level defect.

| gap | between | owning rule (file) | verdict |
|---|---|---|---|
| 69 | trust-strip ticker → WWP eyebrow | `.ts-wrap` block end + `.wwp-inner pt:56` (index.css) | rhythm |
| 120/121 | WWP last card → Reach eyebrow | `.wwp-inner pb:56` + `.gr-copy pt:48` (index.css) | rhythm |
| **90** | Reach subhead → globe/map | `.gr-subhead mb:42` + `.gr-copy pb:48` before `.gr-globe` (index.css) | shrink — copy↔map separation is 90px of navy; trim ~30px |
| 112 | Promise attribution → Projects globe canvas | `.promise pb:56` + `.proj pt:56` (index.css) | rhythm (navy→near-black) |
| **118 / 72×3** | Projects → **`.proj-creds` band** & between its 4 items | `.proj-creds mt:44 pt:32` (index.css) + `.proj-creds-grid gap:48` + `.proj-cred-card` fixed `42px` title row | **shrink — mark #3; ~72px between items** |
| 112 | proj-creds last → Infrastructure eyebrow | `.proj pb:56` + `.infra pt:56` (index.css) | rhythm |
| 75 | Infra title → facility chips | `.infra-head` end + `.ib-stage mt:44 pt:34` (FacilityBook.css) | shrink candidate (navy panel top) |
| 74/78 | facility deck arrows → infra-video thumb | `.ib-stage pb:36` + `.infra-video mt:29` (FacilityBook.css/Infrastructure) | rhythm-ish |
| **95** | infra-video → certs seal | `.infra pb:64` + `.certs pt:36` + seal offset (index.css) | shrink — cream gap before the certs seal |
| 70 | certs subhead → first cert card | `.certs-head` end + `.certs-carousel mt:38 / .certs-viewport pt:6 / .cert-card pt:16` | rhythm-ish |
| **81** | cert card body → certs arrows | `.cert-card` `min-height:280px` (index.css:2886) — the card is a fixed 280px box; body is `-webkit-line-clamp:3` (intentional truncation) so the fixed height leaves air above the arrows | shrink — the 280px fixed card min-height |
| **99** | **certs arrows → "HOW WE WORK"** | `.certs pb:56` + `.pv-section pt:43` (ProcessVideo.css) | **shrink — mark #2** |
| **115/111** | **process video → tb-band** | `.pv-section pb:64` + `.tb-band pt:≈38` (index.css) | **shrink — mark #4** |
| **152/148** | tb-band last item → marquee word | `.tb-band pb:≈38` + `#marquee pt:104` (Marquee.jsx Tailwind, curve reserves 86) | shrink — part of mark #5; the 104px marquee top |
| **458** | **marquee word → sustainability chip/"Responsible by Practice"** | `#marquee pb:32` + `.svA-frame` **fixed 420px** empty showpiece (index.css:3347) | **KILL/REDESIGN — mark #6; ~458px empty cream** |
| **81** | svA chip → sustain title | inside `.svA-frame` (chip pinned to a 420px frame's base) | part of mark #6 |
| **120** | sustainability list → Awards eyebrow | `.sustain pb:56` + `.aw-content pt:64` (index.css, Lane-1 value) | rhythm |

**Secondary (48–64px, no deep diagnosis):** 4 runs in the 48–63 band at the trust-strip/hero seam and inside the Projects destination cards — all section/sub-block rhythm.

*(Sections 1.2–1.10 for the other routes follow below, from the per-route deep passes.)*

---

## 2. OVER-TALL CONTENT BLOCKS (content-height ÷ box-height < 0.7)

| route | block | ratio | content/box | responsible spacing |
|---|---|---|---|---|
| / | `#marquee` | **0.13** | 20 / 157px | `pt:104 pb:32` around one word-row (mark #5) |
| / | `.sustain` | 0.60 | 729 / 1210px | driven by the empty `.svA-frame` 420px (mark #6) |
| / | `.promise` | 0.71 | 279 / 391px | `padding-y:56` on a 3-line pull-quote |
| / | `.tb-band` (TrustBelt) | ~0.6 | — / 407px | 6-item `.tb-grid` 1-col with generous row-gap (the "One partner, zero runaround" list — section-2 calibration) |
| / | `.proj-creds` | ~0.66 | — / 748px | mark #3 spacing |

*(Cross-route over-tall — `.ph-hero`, `.tb-band`, `.inf-tri`, `.ff-trust`, `.ab-quote` — consolidated after the per-route passes.)*

---

## 3. INTERACTIVE CONTROLS — every visible control operated (real `.tap()`)

### Homepage `/`
| control | result | notes |
|---|---|---|
| **Certs carousel arrows** | **WORKS** | scrollLeft 0→318→636→954 (Chromium) / 0→636→1172 (WebKit/Safari) via `.tap()` **and** `.click()`. **Owner mark #1 does NOT reproduce on either engine.** prev-arrow correctly `disabled` at start. |
| WWP carousel arrows | WORKS | 0→356→712→1068 |
| Facility deck: chips / swipe / arrows / dots / counter | WORKS | chip→resets to page 1; horizontal swipe advances (PAGE 01→02); vertical swipe passes to page; arrows/dots/counter track (Lane-3) |
| Awards carousel | swipe-only | `.aw-viewport` scrollable (sw 4024 / cw 344) but **no arrows, no dots** — peek is the only affordance |
| Infrastructure video "play" | WORKS | `.infra-video-thumb` tap → dialog player opens (`.infra-dialog`) |
| Process "How We Work" video | n/a control | `<video controls=false>` background/autoplay clip — no play button (decorative) |
| Language toggle EN/FR/ES | WORKS | tap FR → `localStorage qfp.lang=fr`, copy re-renders |
| Drawer / hamburger | WORKS | opens, nav links visible |
| Footer links (22) | mostly OK | **5 links with EMPTY accessible text → `/#certifications`** (cert-badge icons — a11y-label gap); mail/site links OK |

*(Per-route control tables follow.)*

---

## 4. DECORATIVE FURNITURE (>80px vertical, in-flow or reserving space)

Note: many `div.pointer-events-none` at 1000–5000px are **full-page background overlay layers** (grain/gradient/noise behind content) — NOT space-consuming furniture; excluded. The space-reserving ones:

| route | element | height | contributes |
|---|---|---|---|
| / | **`.svA-frame` (sustain showpiece)** | 420px | mark #6 — empty cream (the `scn-*` line-art doesn't read) |
| / | `svg` marquee divider curve | 86px | top of `#marquee` (intentional transition, but eats into mark #5's band) |
| / | `.aw-glow` / `.aw-vignette` | 773px each | Awards red-carpet beams — absolute, behind content (decor, not a gap) |
| / | `svg.scn-plant` | 325px | inside `.svA-frame`, bottom — still reads empty |
| / | `svg.certs-arc-top` | 80px | certs dome transition (intentional) |

*(Shared furniture — `.aw-glow`/`.aw-carpet`/`.aw-vignette` appear on /about + /infrastructure; the `ph-hero` background layer everywhere — consolidated below.)*

---

### 1.8 — `/contact` · docH 6848 · **no content voids; 0 dead controls (60 elements)**

Key correction: the gap probe tracked only `<label>` elements, so the form bands read as "gaps" but are **FILLED by the inputs between the labels** (verified by screenshot).

| gap | between | owning rule (file) | REAL/FILLED | verdict |
|---|---|---|---|---|
| 92 | ph-hero → welcome eyebrow | `.ph-hero pb:36` + `.ctc-welcome pt:56` (PageHero.css / index.css:5230) + `SectionCurve` | real (+curve) | rhythm |
| 80 | welcome → desk eyebrow | `.ctc-welcome pb:40` + `.ctc-desk-sec pt:40` (index.css:5230-31) | real | rhythm |
| 86 | addr photo → careers title | `.ctc-addr pb:56` + `.ctc-careers pt:≈86` (index.css:4073/5232) | real | rhythm (navy→cream) |
| 113 | careers CTA → form eyebrow | `.ctc-careers pb:≈57` + `.ctc-form-sec pt:56` + `SectionCurve` | real (+curve) | rhythm |
| 73 | form lede → First-name | `.ctc-form pt:36` (index.css:4116) | FILLED (input below) | ok |
| **78/96 ×7** | field label → next field label | **each band holds an `input`/`select`**; `.ctc-field/.ctc-row mb:18` (index.css:4120-23) | **FILLED (input)** | not a void — correct 18px field rhythm |
| **224** | "Message" label → "I agree" label | **`textarea#f-message min-height:130px` (~205px) + `.ctc-consent mt:22`** (index.css:4134) | **FILLED (textarea)** | not a void |
| 147 | form DPA → FAQ eyebrow | `.ctc-form-sec pb:56` + `.ctc-faq pt:56` + `SectionCurve` | real (+curve) | rhythm |

**Controls (0 dead):** 8-field form focus ✓, empty-submit → 7 validation errors ✓, consent toggle enables submit ✓, FAQ accordion (`aria-expanded`) ✓, careers `mailto`/`#enquiry` ✓, desk `tel:`/`mailto:`/`wa.me` ✓, address→Google-Maps links ✓ (static `img.ctc-addr-bg`, no live map by design), lang FR ✓, drawer ✓, footer ✓, FloatingWhatsApp ✓. **overtall: none.**

### 1.9 — `/newsroom` (docH 3055) + both articles (docH 3242 / 3123) · **no content voids; 0 dead**

| route | gap | between | owning rule | verdict |
|---|---|---|---|---|
| /newsroom | 93 | ph-hero sub → first card | `.ph-hero pb:36` + `.nr-index pt:≈57` | rhythm |
| article | 106 | `h1.nra-title` → hero img | `.nra-head pb:≈57` + `.nra-hero pt:≈48` (NewsroomArticle.css:13,48) | rhythm (navy→cream) |
| article | **188** | figure caption → "Related news" | `.nra-figure mb:≈43` + `.nra-foot pt:≈86` + **gold `hr.nra-rule` + margin ≈57** (NewsroomArticle.css:70,88,91) | intentional editorial divider (hairline mid-band) — could shrink ~40px |
| article | 67 | related grid → back link | `.nra-rel-grid mb:≈67` (NewsroomArticle.css:106) | rhythm |

**Controls (0 dead):** news card → article nav ✓, article back-link → /newsroom ✓, 3 related links ✓, lang/drawer/footer/WhatsApp ✓. **overtall:** `.nra-head`/`.ph-hero` ratio 0.63/0.65 — shared masthead chrome.

### 1.10 — `/legal/{privacy,cookies,terms,accessibility}` · **no content voids; 0 dead**

Shared `LegalPage`: navy `PageHero` → cream reading column. One >64 gap each, same pattern; body prose has **no inline links** (all nav via chrome).

| page | gap | between | owning rule | verdict |
|---|---|---|---|---|
| all 4 | 112/113 | `aw-word` (in `ph-title`) → `p.legal-lead` | `.ph-hero pb:36` + `.legal pt:clamp(56,8vh,104)≈76` (PageHero.css:100 / LegalPage.css:8) | rhythm |

Intra-body gaps are all `.legal-sec mt:≈48` / `.legal-updated mt:≈57` (<64, excluded). **Over-tall:** `.ph-hero` ratio **0.48** (privacy/cookies/terms), 0.57 (accessibility) — mobile hero `min-height:0` with 56/36 padding around a 1-line title; cosmetic (single owner: `PageHero.css:100`). **Controls (0 dead):** no in-body controls; chrome (lang/drawer/footer/cert-icons/WhatsApp) all clean.

### 1.2 — `/about` (OurStory.jsx) · docH 8640 (11569 normal-motion) · **0 dead controls**

⚠️ Probe ran under reduced-motion; under normal motion the `.prun` "Press Run" timeline is a **pinned 100vh sticky scroll-reveal** (empty node circles + dotted world-map that fill on scroll) — a scroll-driven animation, **not** dead space.

| gap | between | owning rule (file) | REAL/FILLED | verdict |
|---|---|---|---|---|
| 92 | hero L2 → "OUR STORY" | `.ph-hero pb:36` + `.ab-lede pt:56` (OurStory.css:512) | real | rhythm (navy→cream) |
| 96 | lede → "OUR JOURNEY" | `.ab-lede pb:48` + `.prun pt:48` (JourneyTimeline.css:267) | real | rhythm (generous) |
| **84 ×5** | timeline year-pill → title | **`.prun-icon` 50px medallion between** (JourneyTimeline.css:145) | **FILLED (medallion)** | intentional |
| 151 | timeline console → MVV | `.prun pb:64` + SectionCurve + `.mvv-inner pt:64` | FILLED/transition | intentional full-bleed |
| **100 ×2** | MVV Mission→Vision→Values | **`.mvv-icon` glyph between** (OurStory.css:163) | **FILLED (icon)** | intentional |
| 117 | MVV → Our Team | navy `.mvv` + SectionCurve + `.tm pt:38` | FILLED/transition | intentional full-bleed |
| 149 | team quote → founder quote | `.tm pb:43` + `.ab-quote pt:56` | real | generous |
| **123** | founder cite → Gallery eyebrow | `.ab-quote pb:56` + `.gal pt:67` (OurStory.css:513/230) | **REAL cream** | **SHRINK — two cream sections each paying full pad** |
| 120 | gallery → Awards | `.gal pb:56` + `.aw-content pt:64` | FILLED/transition (aw-glow cones) | intentional |
| 124/69/81 | Awards→Certs seal / certs sub→card / card→arrows | section seams + `.cert-card min-height:280` slack | real | rhythm |

**Over-tall:** `.ab-quote` **0.53** (166/313px) — founder pull-quote, `pt/pb:56` interstitial (intentional statement, padding-heavy). **Controls (0 dead):** lang FR ✓, drawer ✓, team-card→spotlight ✓, gallery lightbox (1/14→2/14, X, focus-return) ✓, certs next arrow (0→318) ✓, certs card→modal ✓, Awards "See More"→/newsroom ✓, footer ✓.

### 1.3 — `/global-markets` (Tailwind) · docH 2466 · **0 dead controls**

| gap | between | owning rule (file) | REAL/FILLED | verdict |
|---|---|---|---|---|
| 92 | hero → "Africa" | `.ph-hero pb:36` + `section py-14`=56 (GlobalMarkets.jsx:70) | real | rhythm |
| 112 | region → credentials lead-in | region `py-14 pb:56` + credentials `py-14 pt:56` + SectionCurve | real | rhythm |
| **116** | lead-in → "Certified and audited" | **`div.mb-16`(64) + `p.mb-12`(48) STACKED bottom margins** (GlobalMarkets.jsx:97-98) | **REAL navy void** | **SHRINK — drop one margin; ~112px empty navy before first card** |
| **84 ×3** | credential desc → next h3 | **credential icon `mb-5` between** (GlobalMarkets.jsx:110) | **FILLED (icon)** | intentional |
| 112 | credentials → "Our Global Team" | `py-14` seam | real | rhythm |

**Over-tall:** `section.relative` (team) **0.62** — the **"Our Global Team" is a PLACEHOLDER** ("Details coming shortly…", GlobalMarkets.jsx:129-138); sparse because content is **pending**, not a spacing bug → owner decision. **Controls:** lang/drawer/footer ✓; page body is static text (no carousels/forms).

### 1.4 — `/print-on-demand` (PrintOnDemand.jsx) · docH 5128 · **0 dead controls**

| gap | between | owning rule (file) | REAL/FILLED | verdict |
|---|---|---|---|---|
| **458** | build lede → preview caption | **`.pod-preview` min-height:420 holds the CSS-3D book preview** `.pod-stage`/`.pod-book` (PrintOnDemand.css:948/106-343) | **FILLED — NOT a void** | the live configurator book (cream cover, navy title band, QFP mark, gold rules, navy spine, on a beige radial card + spec caption). Intentional. |
| 141 | "Request This Book" → "Explore Categories" | `.pod-summary pb:29` + `.pod-build pb:56` + `.pod-explore pt:56` + SectionCurve | real/transition | rhythm |

**Over-tall:** only `.ph-hero` (0.69, hero). No non-hero over-tall — the 468px `.pod-preview` is filled by the 3D book. **Controls (0 dead):** format/quantity chips (`aria-checked`, caption+summary update) ✓, "Request This Book"→form reveal + Cancel ✓, Explore link ✓, hero "Start building"→#build ✓, lang/drawer/footer ✓.

### 1.5 — `/infrastructure` (InfrastructurePage) · docH 6761 · **0 dead controls**

**The alarming numbers are FALSE POSITIVES** — the scanner excluded `aria-hidden` background-image photos + hidden photo-placeholder text sitting *behind* loaded images. All shipped photos render.

| gap | between | owning rule (file) | REAL/FILLED | verdict |
|---|---|---|---|---|
| **390** | facility stat → "Inside the facilities" | **`.inf-tri-frame` (16/9) bg `facility-01.webp`** + `margin-top:clamp(44,6.5vh,80)` (InfrastructurePage.css:173) | **FILLED — real press-hall photo** (~216px); ~68px navy margin above | intentional |
| **126 / 110×3 / 111** | photo-note ↔ caption | **`.inf-photo-img` gallery photos `gallery-0{1-4}.webp` cover the z1 placeholder note** (css:307) | **FILLED — real photos** | intentional (detector fooled by hidden note) |
| **151** | deck ← → "Premium Finishing" | `.ib-stage pb:36` + `.inf-finish-sec` 3px gold-rule + `padding:56px 0` (css:438) | REAL cream | **shrink ~−30px** |
| **112** | finish note → "YouTube" | `.inf-finish-sec pb:56` + `.inf-av pt:56` (two cream) (css:438-9) | REAL cream | **shrink ~−40px** |
| 120/149/87/86/81/78/77/72/69/68 | Awards/certs/tri/hero seams | section paddings + curves + gold hairlines | real/rhythm | intentional |

**Over-tall:** `.inf-tri` 0.67 (**filled by the facility photo**, not really over-tall); `.inf-cta` 0.62 (CTA pad, ok); **`.tb-band` 0.57 (shared w/ homepage)**; `.ph-hero` 0.57 (hero). **Controls (0 dead):** facility deck chips/arrows/swipe/dots/counter ✓ (Sheet Fed→counter 01/09, reset to page 1), certs arrows (0→318) ✓, cert→modal ✓, Awards swipe (arrows retired by design) ✓, YouTube 4 cards→dialog+iframe ✓, lang/drawer/footer/WhatsApp ✓. **Desktop 1536:** flip-book (5 spines, PAGE 01/07→02/07) ✓.

### 1.6 — `/fulfilment` (Fulfilment) · docH 8257 · **0 dead controls**

| gap | between | owning rule (file) | REAL/FILLED | verdict |
|---|---|---|---|---|
| **406 ×3** | quote/card-text → next card index | **`.ff-card-media` bg photos `card-0{1,2,3}.webp`; text pinned by `.ff-card-body margin-top:320px`** (index.css:4386/4569) | **FILLED — 3 real navy-duotone photo cards** ("Kitting & Assembly"…) | intentional |
| **291 ×4** | feature index → shared eyebrow | **`.ff-feat-media` (4/3) bg photos `feature-0{1-4}.webp`** ~300px (index.css:4460) | **FILLED — 4 real feature photos** | intentional |
| **150 / 113** | trust marquee → "Our conviction" / hero CTA → "They trust us" | **`.ff-trust { padding: clamp(56,8vh,92) 0 clamp(60,8vh,96) }` ≈76px each** (index.css:4335) — **NOT in the ≤900 56px override** | REAL beige void | **SHRINK — genuine over-padding (see §2)** |
| **125** | value canvas → features | `.ff-value pb:56` + `.ff-features pt:48` + `.ff-feat pt:57` (index.css:4451) | REAL cream | shrink |
| 112/87/67 | journey/value/journey-title seams | section paddings + curves | real | intentional |

**Over-tall:** **`.ff-trust` 0.54 (370/200px)** — the ONE genuine trim target: `padding ≈76px each` around a 200px marquee, and it's *missing from the ≤900 56px override block*; **add `.ff-trust { padding: 56px 0 }` at ≤900px** (fixes both g1=113 and g3=150). `.ff-cta` 0.70 (borderline). **Controls (0 dead):** 4 "Learn more" accordions all open (height 0→107/131px, `aria-expanded`) ✓ — the probe's "ff-panel h:0" was merely the collapsed state; CTAs→/contact, profile PDF ✓, chrome ✓.

---

## 5. CROSS-ROUTE REPETITION MAP

Fix by component, not by page. (H=homepage)

| shared block | routes | issue | owning file |
|---|---|---|---|
| **`.ph-hero` / `PageHero`** | /about, /global-markets, /print-on-demand, /infrastructure, /newsroom, /contact, **all 4 legal** | over-tall 0.48–0.69 — mobile `min-height:0` + fixed `56/36` pad around a 1–2 line title (cosmetic) | `PageHero.css:99-101` |
| **Credentials block** ("Certified and audited / Editorial and prepress / Scalable Capacity / Dedicated Account Mgmt") | **H** (`.proj-creds`, Projects) + **/global-markets** | ~72px inter-item gaps + a stacked `mb-16`+`mb-12` (GM) → owner mark #3; generous on both | `index.css` (`.proj-creds*`) + `GlobalMarkets.jsx:97-111` |
| **`.tb-band` (TrustBelt)** | **H** + /infrastructure | over-tall 0.57 — 6-item list, generous `pt/pb:38` + row-gap | `index.css:807-835` |
| **`.certs` + `.cert-card`** | **H** + /about + /infrastructure | `.cert-card min-height:280` leaves ~81px slack → arrows; arrows **WORK** (owner mark #1 not reproduced) | `index.css:2886,2972,3097` |
| **`.aw` Awards + `.aw-glow/carpet/vignette`** | **H** + /about + /infrastructure | 773px decorative beams (behind content, not a gap); `aw-content pt/pb:64`; arrows retired (swipe) | `index.css:3363+,5202/5302` |
| **`SectionCurve`** | contact, POD, GM, about, infra, fulfilment | fills most cream↔navy seams (why some "gaps" are transitions, not voids) | shared `SectionCurve` component |
| **`FloatingWhatsApp` `.wa-fab`** | every route | fixed bottom-right ~64px; never steals a tap (all EFP=self) | `FloatingWhatsApp` |
| **Footer (`CTAFooter`)** | every route | 22 links incl. 5 icon-only cert badges → `/#certifications` (functional; a11y name via `img alt` — verify) | `CTAFooter.jsx` |

---

## 6. LANE PLAN (grouped by file territory; dead controls first — but there are none confirmed)

| lane | files | findings closed | px reclaimed (440) | difficulty | notes |
|---|---|---|---|---|---|
| **L0 — FUNCTIONAL (owner verify)** | — | Owner mark #1 (certs arrows "dead") | 0 | — | **Does not reproduce** on Chromium *or* WebKit/Safari (tap+click, 3 advances). Likely the deployed build lags local HEAD, or an iOS-version quirk. **Owner: retest the live deploy.** No code fix identified. |
| **L1 — index.css (biggest)** | `src/index.css` | **mark #6** `.svA-frame` 420px empty showpiece; **mark #3** `.proj-creds` item gaps; **mark #2** certs `pb:56`→pv; **mark #4** pv `pb:64`→tb; `.tb-band` over-tall; `.ff-trust` over-padding (add ≤900 `56px 0`); ff value→features (125); certs→AV; `.cert-card` 280 slack | **~458 (H) + ~140 (ful) + ~120 (infra) + seams** | **Med–High** | one file, many sections; **hard desktop-1536 gate** (all changes ≤900px). Mark #6 needs an **owner decision**: shorten/kill the `.svA-frame` on mobile *or* give it real imagery. |
| **L2 — Marquee.jsx** | `src/sections/Marquee.jsx` | **mark #5** marquee band (156px for 1 line) | ~40–60 | Low | Tailwind `pt-[18svh]` (already 104 via Lane-1) + `pb-8`; trim toward the 86px curve. |
| **L3 — GlobalMarkets.jsx** | `src/pages/GlobalMarkets.jsx` | GM g4 stacked `mb-16`+`mb-12` navy void (~112) | ~112 | Low | Tailwind; drop one margin. (Shares the credentials block with L1's `.proj-creds`.) |
| **L4 — OurStory.css** | `src/pages/OurStory.css` | /about founder-quote→gallery (123); `.ab-quote` over-tall (0.53) | ~60 | Low | two cream sections doubling pad. |
| **L5 — InfrastructurePage.css** | `src/pages/InfrastructurePage.css` | infra deck→finish (151); finish→AV (112) | ~70 | Low | section-seam trims. |
| **L6 — PageHero.css (cross-route, cosmetic)** | `src/components/PageHero.css` | `.ph-hero` over-tall on 8+ inner pages | small each, ×8 routes | Low | **Owner decision** — is the airy inner-page hero intentional? One rule (`:100`) touches all. |

**Functional bugs vs spacing:** the *only* reported functional bug (certs arrows) **does not reproduce** — there are **no confirmed dead controls anywhere on the site**. Every other finding is spacing/decorative.

**Owner-decision items:** (a) mark #6 `.svA-frame` — shorten vs. real mobile imagery; (b) `.ph-hero` airy heroes — intentional?; (c) `/global-markets` "Our Global Team" is a **"Details coming shortly" placeholder** (pending content, not a bug); (d) certs-arrows live-deploy retest.

---

## 7. UNCERTAIN

- **Owner mark #1 (dead certs arrows) could not be reproduced.** Tested with real `.tap()` on **Chromium AND WebKit (Safari engine)** at 440×956: the arrows advance the carousel (scrollLeft 0→318→636→954). Wiring is a plain React `onClick→scrollBy` with `pointer-events:auto` and no overlay. Possible explanations I could not resolve here: the **deployed production build predates local `HEAD 922556b`**; a specific **iOS Safari version** behaviour Playwright-WebKit 26.5 doesn't match; or a transient. **Needs an owner retest on the live URL / a physical iPhone.**
- **Reduced-motion measurement basis.** The gap probe ran under `prefers-reduced-motion` for stable, flicker-free heights; every gap was then re-screenshotted under **normal** motion to classify. One consequence: on **/about** the `.prun` "Press Run" timeline is a **pinned 160vh scroll-reveal** under normal motion (docH 11569 vs 8640) — its mid-scroll sparseness is animation, **not** dead space. On **homepage** the Reach globe rendered the **map canvas** at 390 but the **dotted fallback** at 440 during the probe run (map IO/tile timing); this doesn't affect the gap findings (the copy→visual gap is identical either way).
- **`.svA-frame` scene rendering.** The 420px showpiece contains `scn-sun/cloud/plant/grass` line-art SVGs (probe furniture: plant 325px, sun 84px), but at 440/390 the panel reads as **pure empty cream** in every screenshot — I could not see the scene render on mobile. Whether the line-art is positioned off-crop, opacity-faded, or desktop-only wasn't determined; either way the **visual result is a full-screen void**. Flagged as owner-decision.
- **Footer cert-badge links.** 5 icon-only `<Link to="/#certifications">` (FSC/ISO/…): functional, but their accessible name depends on the `<img alt>` at `CTAFooter.jsx:169` — not separately verified for emptiness; minor a11y check, not a dead control.
- **Awards carousel affordance.** `.aw-viewport` is swipe-only (arrows retired by design, no dots) on homepage/about/infrastructure — functional but discoverability rests entirely on the card peek; noted, not classified a defect.

---

### git status — END
Identical to START **plus one new untracked file — this report**. No tracked file changed; no source edited; all probe/screenshot helper scripts deleted.
```
?? CONTENT-RECON-2026-08-11.md      ← the only addition
?? .lighthouseci/  ?? _assets-in/ _assets-in2/ _lane1..7/ _recon _recon2 _recon3/  (+ the pre-existing zips/docs from START)
```
