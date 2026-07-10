# What We Print — Reconnaissance Spec

**Recon only. No mounted code was changed.** Source of truth for the client's section:
`D:\WEBSITES\QFP\EKTA DOCS\qfp-homepage-v17.html`. Our component:
`src/sections/PrintingServices.jsx`. Extracted assets: `recon/qfp-assets/`.
Extraction script: `recon/what-we-print/extract-assets.mjs`.

The QFP "What We Print" we build (4 big + 4 small cards) mounts **after** `TrustStrips`.

---

## TOP 5 FINDINGS (read this first)

1. **Her cards are NOT our overhang cards — they're the opposite pattern.** Hers = flat photo on top (fixed 190px, `object-fit:cover`) + a **solid colored body** carrying name + subtitle + **4 bullets**. Ours = a transparent product cutout **breaking out of the card top** (negative margin + rotate) with only a label + "+" and **no room for bullets**. These are two different card archetypes; the QFP build has to pick/merge deliberately.

2. **All 8 product photos are opaque scene photography, not transparent cutouts.** Books arranged on wood tables / fabric with plant & vase props and a plain wall. Our overhang effect needs a clean subject on transparency — **none of the 8 work as-is**. Each needs background removal (croppable, varying difficulty) or regeneration. The overhang effect and her photos are incompatible without asset work.

3. **Her content is richer than our card can display.** Every category has a **subtitle + 4 concrete bullets** (real, specific: "Government & Ministry curriculum tenders", "Annual reports, Reliance, HDFC Bank & more"). Our current card shows only a 30px label. A faithful QFP build must carry the bullets → the card needs a body, which fights the overhang's vertical budget.

4. **"4 big + 4 small" is a new layout neither side has.** Hers = 8 equal 300px cards in a horizontal scroll row. Ours = 4 equal overhang cards, flex-wrap. The QFP hierarchy (4 big + 4 small) must be designed fresh — it's not a copy of either.

5. **Photo resolution/aspect is inconsistent.** 7 of 8 are 700×560 (5:4); **Print on Demand is 1402×1122** and **Learning Kits is the heaviest at 134KB**. Educational/Children's/POD are the visually busiest (many small books); Coffee Table and Corporate are the cleanest, most croppable subjects.

---

# PART 1 — Asset extraction

**21 base64 data-URIs** in the source (20 `<img>` + 1 CSS `background-image`), **17 unique files** written to `recon/qfp-assets/` (4 are exact dupes — cert logos reused in the hidden footer). Dimensions parsed from PNG IHDR / JPEG SOF headers; footer logo via browser (progressive JPEG).

| # | file | dims | fmt | KB | section | alt | notes |
|---|---|---|---|---|---|---|---|
| 01 | `01_nav-qf.png` | 160×160 | png | 12.2 | NAV | "Qf" | nav logo mark |
| 02 | `02_hero-powering-global-education…png` | 1486×1059 | png | 2047 | HERO | "Powering Global Education Through Print Excellence" | hero art (huge) |
| 03 | `03_product-01-educational-books.jpg` | 700×560 | jpg | 99.8 | PRODUCTS | "Educational Books" | **BIG slot** |
| 04 | `04_product-02-trade-books.jpg` | 700×560 | jpg | 84.8 | PRODUCTS | "Trade Books" | **BIG slot** |
| 05 | `05_product-03-coffee-table-and-hardcase-books.jpg` | 700×560 | jpg | 74.5 | PRODUCTS | "Coffee Table & Hardcase Books" | **BIG slot** |
| 06 | `06_product-04-general-books.jpg` | 700×560 | jpg | 90.2 | PRODUCTS | "General Books" | small slot |
| 07 | `07_product-05-children-s-books.jpg` | 700×560 | jpg | 102.3 | PRODUCTS | "Children's Books" | **BIG slot** |
| 08 | `08_product-06-learning-activity-kits.jpg` | 700×560 | jpg | 134.1 | PRODUCTS | "Learning Activity Kits" | small slot |
| 09 | `09_product-07-corporate-banks-and-mncs.jpg` | 700×560 | jpg | 75.1 | PRODUCTS | "Corporate, Banks & MNCs" | small slot |
| 10 | `10_product-08-print-on-demand.jpg` | 1402×1122 | jpg | 227.9 | PRODUCTS | "Print on Demand" | small slot; odd size |
| 11 | `11_process-one-continuous-process….jpg` | 1774×887 | jpg | 241.2 | HOW WE WORK | "One Continuous Process: Print, Quality, Fulfillment, Warehouse, Ship…" | process diagram |
| 12 | `12_worldmap-dots.jpg` | 1600×1066 | jpg | 271.9 | GLOBAL PROJECTS | "" | world-map dots bg |
| 13 | `13_cert-fsc-9d1f9260.png` | 244×291 | png | 23.3 | CERTIFICATIONS | "FSC" | badge |
| 14 | `14_cert-iso-a5d7538a.png` | 346×346 | png | 28.2 | CERTIFICATIONS | "ISO" | badge (used for BOTH ISO 9001 + ISO 14001) |
| 15 | (dupe of 14) | 346×346 | png | 28.2 | CERTIFICATIONS | "ISO" | same bytes as #14 |
| 16 | `16_cert-sedex-c8924626.png` | 338×55 | png | 9.3 | CERTIFICATIONS | "Sedex" | wordmark |
| 17 | `17_…quarterfold-printabilities.jpg` | 266×320 | jpg | 72.7 | FOOTER | "Quarterfold Printabilities" | footer logo (progressive jpg) |
| 18 | (dupe of 13) | 244×291 | png | 23.3 | FOOTER | "FSC" | footer cert |
| 19 | (dupe of 14) | 346×346 | png | 28.2 | FOOTER | "ISO" | footer cert |
| 20 | (dupe of 16) | 338×55 | png | 9.3 | FOOTER | "Sedex" | footer cert |
| 21 | `21_mission-band-bg-6999a1ec.jpg` | 1515×1038 | jpg | 130.7 | MISSION BAND | (CSS background) | behind gradient on `.mission-alt` |

Attribution caveat: files 17–20 sit after a hidden `display:none` testimonials block, so the script's auto-name picked the "TESTIMONIALS…" comment; they are footer assets (correct `class=footer-*`), renamed above by hand. Infrastructure "photos" in the source are text placeholders, not images — nothing to extract there.

**Only images 03–10 are relevant to What We Print** (the 8 product photos). Everything else is inventory for later sections.

---

# PART 2 — Her section anatomy (`<!-- PRODUCTS -->`, v17 lines 507–646)

### Section header
- **Eyebrow** (`.sec-ey`): `What We Print`
- **Title** (`.sec-title`): `Built on Precision.` `<br>` `Backed by Experience.`
- **Sub** (`.sec-sub`): `Across educational books, trade titles, coffee table editions and more, we bring the same care and consistency to every project we take on.`

### The 8 cards — exact content, in order
Each card = `.prod-photo` (img + `.prod-num` badge `01`–`08`) then `.prod-body` (name, sub, 4-item `.prod-list`).

1. **Educational Book Printing** — *The books that open minds*
   - School textbooks, Primary to Secondary
   - Government & Ministry curriculum tenders
   - Workbooks and reference materials
   - Multilingual editions for Africa & Asia
2. **Trade Books** — *Notebooks, pads, counterbooks & stationery*
   - Spiral, hardcover & softcover notebooks
   - Counter books and register books
   - Writing pads, memo pads, scribble pads
   - Custom branded printable stationery
3. **Coffee Table & Hardcase Books** — *When a book is also a statement*
   - Premium photography & art books
   - Heritage and commemorative editions
   - Hardcase, foil and specialty finishes
   - Gift and collector's editions
4. **General Books** — *Manga, comics, puzzles & leisure reading*
   - Manga and graphic novel series
   - Sudoku, crossword & word search puzzles
   - Quiz, trivia and brain-teaser titles
   - General leisure and lifestyle reading
5. **Children's Books** — *The first books they will ever love*
   - Picture books and illustrated stories
   - Colouring books, all age groups
   - Board books for toddlers
   - Fancy, pop-up and novelty formats
6. **Learning Activity Kits** — *Hands-on learning beyond the page*
   - Numbers, shapes & letters activity kits
   - Brain boost & logic puzzle card sets
   - Writing practice and DIY learning kits
   - Match, sort & story card sets
7. **Corporate, Banks & MNCs** — *Where precision meets prestige*
   - Annual reports, Reliance, HDFC Bank & more
   - DFC and institutional programme reports
   - Loan agreements & welcome kits
   - Corporate brochures & financial documentation
8. **Print on Demand** — *No minimums, no waiting on a warehouse*
   - Single copy to short run photo books
   - Travel, memory & custom photo books
   - Personalised gifting & keepsake editions
   - Order today, print on demand, ship fast

### CSS (exact values)
```
.section-products { background: var(--cream2 #F0EBE0); padding: 100px 56px; }   /* mobile: 60px 20px */
.si               { max-width: 1280px; margin: 0 auto; }
.sec-ey           { Inter Tight 12px; letter-spacing:3px; UPPERCASE; color: var(--gold-text #836013);
                    margin-bottom:12px; flex; gap:12px; ::after = 52px gold hairline }
.sec-title        { Inter Tight; clamp(38px,5vw,68px); letter-spacing:-0.5px; color: navy #0F2444;
                    line-height:1.08; weight:500; text-transform:none }
.sec-sub          { Inter 15px/400; color: ink2 #444; line-height:1.6; margin-bottom:48px; max-width:560px }

.products-row     { display:flex; gap:20px; overflow-x:auto; padding-bottom:24px;  /* HORIZONTAL SCROLL */
                    thin scrollbar (3px, navy@15%) }
.prod-card        { flex-shrink:0; width:300px; overflow:hidden; flex column;
                    box-shadow:0 4px 20px rgba(15,36,68,.1); transition: all .3s }
.prod-card:hover  { translateY(-6px); box-shadow:0 22px 56px rgba(15,36,68,.18) }   /* lift + deepen */

.prod-photo       { width:100%; height:190px; overflow:hidden; position:relative }
.prod-photo img   { width:100%; height:100%; object-fit:cover; transition:transform .4s }
.prod-card:hover .prod-photo img { transform: scale(1.05) }                          /* photo zoom */
.prod-num         { absolute top:12px left:12px; bg: cream@92%; color:navy;
                    Inter Tight 13px/600; padding:5px 10px }

.prod-body        { padding:22px 22px 26px; color: cream #FDFAF4; flex:1 }
   /* rotating solid body colors by position: */
   nth-child 1,5 → navy  #0F2444
   nth-child 2,6 → gold  #9B7420
   nth-child 3,7 → olive #6B7A2A
   nth-child 4,8 → navy2 #1B3A6B
.prod-name        { Inter Tight 21px; letter-spacing:-0.3px; color:cream; weight:500; line-height:1.18 }
.prod-sub         { Inter 13px; color: cream@70%; margin-bottom:14px; weight:500 }
.prod-list li     { Inter 13px; color: cream@85%; gap:8px; line-height:1.4;
                    ::before = 12px×1px cream@50% dash }
```
**Fonts:** Inter Tight (eyebrow, title, names, badges), Inter (sub, bullets). **Palette used:** navy `#0F2444`, navy2 `#1B3A6B`, gold `#9B7420`, gold-text `#836013`, olive `#6B7A2A`, cream `#FDFAF4`, cream2 `#F0EBE0`, ink2 `#444`. All within the QFP palette law (no yellow) — **note her card bodies deliberately use gold and olive as solid fills**, which our current TrustStrips only uses as thin accents.

---

# PART 3 — Our component anatomy (`src/sections/PrintingServices.jsx`)

### Current top state (post-strips)
- Section `#services`, `bg-[#fffffc]`, `font-metrisch`. **Its navy→white top curve was removed** and relocated to the TrustStrips landing zone; it now has a **flat top** with `pt-[150px] pb-[120px]` and sits after the stats bar. Comment in file documents this.
- Header row: `<h2>` "Printing / Services" (52→74px, navy `#0c2f4a`, uppercase, Metrisch) on the left; a 430px copy column on the right ("A turnkey service, from printing to delivery…") + a "Learn more about our process" underline link. A faint SVG bg watermark (`BG`, 300px, top-left).
- 4 product cards, `flex flex-wrap` (mobile) → `flex-nowrap justify-start pl-[8vw]` (md).

### The overhang "pop" — how it works
```
<a class="w-[300px] rounded-[48px] bg-[#f3fafd] pb-[45px] hover:opacity-[0.72]">
  <div class="relative h-[250px] flex items-end justify-center overflow-visible">   ← KEY: overflow-visible + items-end
     <img class="object-contain z-[5]"
          style="max-width:{92–95%}; margin-top:{-40..-70}px; transform:rotate({±6..18}deg)" />  ← negative top margin lifts the
  </div>                                                                                             transparent cutout UP & OUT of the card top
  <div class="flex justify-between px-[45px]">
     <h3 class="text-[30px] text-[#0c2f4a]">{label}</h3>  <img PLUS 20px/>
  </div>
</a>
```
- **Mechanism:** the image lives in an `overflow-visible` box pinned to `items-end`; a **negative `marginTop`** (−40…−70px) pushes the transparent product cutout above the card's rounded top edge, and a small **`rotate`** gives each a playful tilt. Requires **transparent PNG/WEBP subjects** (current assets `books.webp`, `bags.webp`, `pack.webp`, `toys.webp` are pre-cut on transparency).
- **Hover:** whole card `transition-opacity → 0.72` (no lift, no photo zoom — simpler than hers).
- **Card body content:** label (30px Metrisch) + "+" icon only. **No subtitle, no bullets.**
- Links go to `#portfolio`; current categories are the Alternativ placeholders **Book / Bag / Packaging / Toys** (wrong for QFP).

### Reusable as-is vs needs adaptation
| Element | Verdict |
|---|---|
| Overhang mechanism (`overflow-visible` + negative `marginTop` + `rotate`) | **Reusable** — but only for cards fed **transparent cutouts** (see Part 4 asset work) |
| Card container (rounded, bg, hover, `w-[300px]`/`w-[24vw]`) | **Reusable/adapt** — restyle to QFP palette; add a body region |
| Header pattern (heading left + copy right, watermark) | **Adapt** — good structure; swap copy + fonts to Inter Tight |
| `max-w-page`, spacing/flex utilities | **Reusable** |
| Font (`font-metrisch`) | **Replace** with Inter Tight / Inter (QFP brand); Metrisch is the hero typeface |
| Palette (`#0c2f4a`, `#f3fafd`) | **Replace** with QFP navy `#0F2444`, gold, olive, cream |
| Card **content model** (label only) | **Insufficient** — must add name + subtitle + 4 bullets (from her data) |
| 4-equal grid | **Replace** with 4-big + 4-small hierarchy |
| Categories (Book/Bag/Packaging/Toys) | **Remove** — replace with her 8 real categories |

---

# PART 4 — Gap analysis + build plan

### Slot mapping (per brief)
| Slot | Category | Her img | Subtitle + 4 bullets |
|---|---|---|---|
| **BIG 1** | Educational Book Printing | `03` 700×560 | ready (Part 2) |
| **BIG 2** | Trade Books | `04` 700×560 | ready |
| **BIG 3** | Coffee Table & Hardcase | `05` 700×560 | ready |
| **BIG 4** | Children's Books | `07` 700×560 | ready |
| small 1 | General Books | `06` 700×560 | ready |
| small 2 | Learning Activity Kits | `08` 700×560 | ready |
| small 3 | Corporate, Banks & MNCs | `09` 700×560 | ready |
| small 4 | Print on Demand | `10` 1402×1122 | ready |

### Per-photo overhang judgment (does the subject break out of frame / is it transparent-croppable?)
**All 8 are opaque scene photos — none are ready cutouts.** Rated on how cleanly the book-subject can be background-removed for our overhang, and whether the arrangement suits a "pop out the top":

| Category | Photo verdict | Overhang fit | Recommendation |
|---|---|---|---|
| Coffee Table (`05`) | Clean elegant stack + standing books on plain beige, minimal props | **Best** — plain bg, tall standing subject | Cut out → overhang works well |
| Corporate (`09`) | Annual reports standing/arranged, plain wall, one plant | **Good** — fairly clean | Cut out → overhang viable |
| Educational (`03`) | Wide sprawl of textbooks + kits on wood, plant | Moderate — wide, low, busy | Cut out the standing back row, or use flat |
| General (`06`) | Manga/puzzle books standing + stacked, one plant | Moderate | Cut out or flat |
| Children's (`07`) | Many small colourful board books clustered | Moderate–hard — many pieces/shadows | Likely **flat** or regenerate |
| Print on Demand (`10`) | Tall travel-book arrangement on fabric, vase | Moderate–hard — complex, fabric bg | Flat or regenerate (biggest asset) |
| Trade (`04`) | Notebooks + pens + stapler + sticky notes (many tiny items) | **Poor** — too many small objects/shadows | **Regenerate** as a cleaner cutout, or flat |
| Learning Kits (`08`) | Grid of activity-kit boxes + loose cards | **Poor** — busy, boxy, loose cards | **Regenerate** or flat |

**Conclusion:** the overhang effect is only "free" for 2 clean subjects (Coffee Table, Corporate). Forcing all 8 through overhang means a background-removal pass (Educational/General doable, Children's/POD/Trade/Kits hard → regenerate). This is the central build decision.

### The design fork (decide before building)
- **Option A — Her card model, elevated (lowest risk, keeps all content).** Flat photo-top + solid colored body + number badge + name/sub/4-bullets, re-skinned to QFP fonts/palette, arranged 4-big + 4-small. Uses photos as-is (just optimise). No cutout work. Loses our signature overhang.
- **Option B — Our overhang model, extended (on-brand signature, high asset cost).** Add a body with bullets to the overhang card; feed transparent cutouts. Requires background removal / regeneration of most photos and solving the overhang-vs-bullets vertical budget. Highest polish, most work.
- **Option C — Hybrid (recommended).** 4 **big** cards use the overhang pop with cut-out subjects (start with the 2 clean ones + cut Educational/Children's) + full name/sub/4-bullets in a body beneath; 4 **small** cards use the flat photo-top + condensed body (name/sub + fewer bullets). Best hierarchy, contains the asset cost to 4 cutouts.

### Proposed build order
1. **Lock content** — hardcode the 8 categories (names, subtitles, 4 bullets each) from Part 2 into a `WHAT_WE_PRINT` data array. (Content is final and client-real; treat as law.)
2. **Pick the fork** (A / B / C) with the client — this gates all asset work. *Recommend C.*
3. **Asset prep** — copy the 8 product JPEGs into `public/qfp/products/`; optimise (POD 1402×1122 → downscale, all → webp). For the chosen big cards, produce transparent-cutout PNGs (background removal); flag any needing regeneration (Trade, Learning Kits, and likely Children's/POD).
4. **Palette/type tokens** — reuse the TrustStrips brand tokens (Inter Tight / Inter / DM Mono already imported; navy/gold/olive/cream). No Metrisch, no `#0c2f4a`.
5. **Card components** — `BigCard` (photo/overhang + name + sub + 4 bullets + number badge) and `SmallCard` (compact photo-top + condensed body). Hover = her lift+zoom or our opacity — pick one, keep consistent.
6. **Section shell** — header (eyebrow "What We Print" + title + sub), then a **4-big row** and a **4-small row** (or 4-big grid + 4-small grid), QFP palette, `max-w-page`, responsive (mobile stacks; consider her horizontal-scroll only if grid gets cramped).
7. **Mount after `TrustStrips`** (decision deferred — recon only). Likely **replaces** the current Alternativ `PrintingServices` placeholder content; confirm before wiring.
8. **Verify** — Playwright at 1536×743, full scrub from the trust-strips junction into What We Print; a11y (alt text per category, real headings); no palette violations.

### Open decisions to raise
- Fork A/B/C (drives everything).
- Does What We Print **replace** `PrintingServices`, or sit as a new section alongside it?
- Overhang subjects: background-remove vs regenerate the 4–6 hard photos.
- Keep her number badges (01–08) and rotating navy/gold/olive body fills, or a flatter QFP treatment?
- Card CTA target (hers has none; ours links `#portfolio`) — where should a QFP card click go?
