# DEEP RECON — The Next Three Sections

**Status:** Recon only. No code written.
**Source:** `D:\WEBSITES\QFP\EKTA DOCS\qfp-homepage-v17.html` (958 lines, 5.2 MB, inline base64).
**Scope:** The three sections that follow *One Continuous Process* in Ekta's document flow.
**Content below is transcribed verbatim from the markup — treat every string as law.**

---

## ▲ TOP 5 FINDINGS (read first)

1. **Order confirmed from the markup — and it matches the brief's guess.** After
   `section-process` the flow is: **① GLOBAL PROJECTS** (`section-projects`, dark
   navy, world-map bg + 3 region cards + 8 milestone count-ups) → **② INFRASTRUCTURE**
   (`section-infra`, cream, 3 capacity cards + video + "Our People" photo grid) →
   **③ CERTIFICATIONS** (`section-cert`, cream, badge grid). (Then sustain → awards
   → cases → CTA → hidden testimonials — out of scope.)

2. **Two hard compliance BLOCKERS live in these three sections.**
   (a) **Client-name permission:** Projects' milestone grid names **HDFC Bank**
   ("India's leading private bank") and **ZEE Learn / Kidzee** — both on the
   permission checklist. (Reliance does not appear here.)
   (b) **FSC licence code missing:** the Cert section shows an **FSC Chain of
   Custody** badge with **no licence code beside the mark** — compliance requires
   the FSC/TUVDC COC licence code (e.g. `TUVDC-COC-101258`) rendered near the FSC
   logo. Cannot ship the mark without it.

3. **Infrastructure is almost entirely un-assetted.** Every "photo" in Infra is a
   grey placeholder `<div>` ("Photo · Head Office, Sanpara", etc.) and the video is
   a **placeholder box**, not a `<video>` — the note literally reads "*send over the
   facility walkthrough footage and it drops in here.*" 3 facility photos + 4 people
   photos + 1 walkthrough video are **needed from Harry** before Infra is real.

4. **Projects is the content-rich, asset-ready, high-elevation one.** Its only image
   (`12_worldmap-dots.jpg`, 1600×1066) is already extracted, all copy is final, and
   the 8 milestones + 3 regions map cleanly onto skeletons we already own
   (`Proof.jsx`'s `CountUp` stat grid, `Promise.jsx`'s dark-navy band). This is the
   natural first build.

5. **Accessibility red-flags cluster on tiny type + low-alpha text on dark.**
   `infra-spec` is **8.5px**, `mc-flag` **8px**, both below any legible floor;
   `mc-desc` is `rgba(245,240,232,0.5)` on a `rgba(15,36,68,0.5)` tile and small
   gold labels (`#9B7420`/`#C89A3C`) on navy will need contrast remediation. None of
   the three sections carry baked-text content images (unlike hero/process) — the
   world map and cert logos are decorative/logo images, which is fine.

---

## Section order (verified against markup)

| Line | Section | id / class | Background | Divider before it? |
|---|---|---|---|---|
| 647 | One Continuous Process | `section-process` | cream | — (already built) |
| 653 | `<div class="divider">` | | | ✓ process→projects |
| 656 | **① Global Projects** | `section-projects` #projects | **navy `#0F2444`** | (divider above) |
| 694 | `<div class="divider">` | | | ✓ projects→infra |
| 697 | **② Infrastructure** | `section-infra` #infra | **cream2 `#F0EBE0`** | (divider above) |
| 755 | **③ Certifications** | `section-cert` | **cream `#FDFAF4`** | none (infra→cert direct) |
| 770+ | Sustainability / Awards / Cases / CTA / (hidden testimonials) | | | out of scope |

Junction rhythm: navy(Promise) → cream(Process) → **navy(Projects)** → cream2(Infra)
→ cream(Cert). Projects is the dark beat between two light bands.

CSS tokens in play: `--navy:#0F2444` · `--navy2:#1B3A6B` · `--gold:#9B7420` ·
`--gold-text:#836013` · `--cream:#FDFAF4` · `--cream2:#F0EBE0` · `--ink:#1C2019` ·
`--ink2:#444`. Fonts: Inter Tight (display/titles), Inter (body), DM Mono (specs/flags).

═══════════════════════════════════════════════════════════════════════════════

# ① GLOBAL PROJECTS  (`section-projects`, #projects)

## 1 — Exact content (verbatim)

- **Eyebrow** (`.sec-ey-l`): `Global Reach`
- **Title** (`.sec-title-l`): `Printed in India.` **[line break]** `Read by the World.`
  — the second line is wrapped in `<em>` (rendered gold `#9B7420`, **not** italic).
- **Intro paragraph:** "Governments, publishers and development organisations across
  25+ countries trust us to get the job done, on spec, on schedule, every time.
  That's not a coincidence, it's the standard we hold ourselves to."

**Region cards (3)** — `.region-name` + `.region-text` (bold spans gold `#9B7420`):
1. **Africa** — "Our largest export market. We partner with Ministries of Education
   across **Nigeria, Kenya, Uganda, Ghana, Cameroon, Rwanda, Tanzania, Zambia, Côte
   d'Ivoire, DR Congo and more** to deliver World Bank, USAID and UN funded education
   projects."
2. **Asia** — "End-to-end solutions, print, kit, pack and deliver direct to schools,
   eliminating operational challenges for publishers and institutions across
   **India, UAE**, and expanding further."
3. **USA, Europe & Latin America** — "Activity books, trade books, colouring books
   and stationery supplied to leading publishers and major retail chains across
   **USA, UK, Mexico, Spain and Germany**."

**Sub-eyebrow** (`.sec-ey-l`): `Milestone Projects`

**Milestone cards (8)** — `.mc-flag` / `.mc-num` / `.mc-desc`, in this order:

| # | Flag | Number | Description (verbatim) |
|---|---|---|---|
| 1 | Tanzania | **10M+** | Books for Tanzania Institute of Education, 4M delivered within 60 days |
| 2 | Nigeria | **8M+** | Books for the Universal Basic Education Commission |
| 3 | Côte d'Ivoire | **4M+** | Books for the Ministry of National Education & Literacy |
| 4 | DR Congo | **3.5M+** | Books for République Démocratique du Congo |
| 5 | USAID Ghana | **2M+** | Books delivered under USAID funded programme |
| 6 | Maharashtra | **1.5M+** | Books for the State Bureau of Textbook Production |
| 7 | **HDFC Bank** ⚑ | **1.3M+** | Books delivered for India's leading private bank |
| 8 | **ZEE Learn** ⚑ | **0.5M+** | Learning kits delivered for Kidzee |

## 2 — Structure (HTML anatomy)

```
section.section-projects#projects
  div.world-map-dots[aria-hidden]  → img (world-map bg)
  div.si
    div.sec-ey-l           "Global Reach"
    h2.sec-title-l         Printed in India. <em>Read by the World.</em>
    p (inline-styled intro)
    div.regions            → 3 × div.region ( .region-name + .region-text )
    div (margin-top:56px)
      div.sec-ey-l         "Milestone Projects"
      div.milestones       → 8 × div.mc ( .mc-flag + .mc-num + .mc-desc )
```
- Regions grid: **3 columns**, 14px gap. Milestones grid: **4 columns × 2 rows**,
  2px gap (hairline-separated tiles on a `rgba(cream,0.08)` bg → thin gold-ish grid lines).
- Ordering is fixed: regions above, milestones below, descending by book count.

## 3 — Assets

- **`12_worldmap-dots.jpg` — 1600×1066 JPEG (~272 KB).** The only image. Used as a
  full-bleed background inside `.world-map-dots` (`opacity:0.55`, `object-fit:cover`,
  `object-position:center 40%`), `aria-hidden`. A dotted world map (halftone dots).
  Quality is fine for a low-opacity bg layer; it is **decorative**, not content.
- No icons, no logos, no video in this section.
- Decorative CSS: a `::before` gold radial blob (top-right, `rgba(gold,0.06)`, 400px)
  and a `::after` left-to-right navy gradient scrim over the map for text legibility.

## 4 — Styling

- **Section:** `background:var(--navy)`; `padding:100px 56px` (mobile `60px 20px`);
  `position:relative; overflow:hidden`.
- **Eyebrow `.sec-ey-l`:** Inter Tight 12px, letter-spacing 3px, uppercase, color
  **`#C89A3C`** (a lighter gold than `--gold`), with a 52px `#9B7420` trailing rule.
- **Title `.sec-title-l`:** Inter Tight `clamp(38px,5vw,68px)`, weight 500, ls −0.5px,
  color `--cream`; `em` → `#9B7420` non-italic.
- **Region card `.region`:** `bg rgba(cream,0.05)`, `1px rgba(cream,0.12)` border, a
  **2px gold top-bar** (`::before`), padding 26/22. `.region-name` Inter Tight 23px/500
  cream; `.region-text` Inter 13.5px `rgba(245,240,232,0.65)` lh1.65, bold spans `#9B7420`.
- **Milestone `.mc`:** `bg rgba(navy,0.5)`, padding 26/20. `.mc-flag` DM Mono **8px** ls2.5
  uppercase gold `#9B7420`; `.mc-num` Inter Tight **32px weight 700** cream; `.mc-desc`
  Inter **11.5px** `rgba(245,240,232,0.5)` lh1.5.
- No marquee/keyframes here in source — **static**. (Elevation is ours to add.)

## 5 — Compliance flags

- ⚑ **HDFC Bank** (milestone 7) and ⚑ **ZEE Learn / Kidzee** (milestone 8) — **named
  clients requiring written permission** before publishing. Until cleared, ship with
  neutral phrasing ("India's leading private bank", "a leading pre-school network")
  or hold those two tiles. **BLOCKER for those tiles, not the section.**
- Government/donor names (World Bank, USAID, UN, Ministries) are generally safe to
  state as delivered-for facts, but confirm none imply endorsement.
- **Contrast:** `mc-desc` `rgba(cream,0.5)` on `rgba(navy,0.5)` tile → likely **below
  4.5:1**; `mc-flag` 8px gold and `sec-ey-l` `#C89A3C` on navy need checking. Bump alpha
  / size on build.
- **Legibility:** `mc-flag` 8px and `mc-desc` 11.5px are small; raise flag to ≥11px.
- No baked-text content images (map is decorative aria-hidden). ✓

## 6 — Our-side mapping

- **`Proof.jsx`** is the strongest skeleton: it already has the **`CountUp`** component
  ([src/components/CountUp](../../src/components/CountUp)) driving a stat grid + a "loud
  case-study number" block. The 8 milestones = a `CountUp` grid; the regions ≈ its
  column layout. **Note:** Proof currently ships *placeholder* stats (12M+, 23 countries,
  99.4%) that overlap this real data — decide whether Projects **absorbs/replaces** Proof
  or sits alongside it.
- **`Promise.jsx`** is the dark-navy-band reference (bg, scrim, scrubbed word-reveal
  title) — reuse its junction + title-reveal patterns for the `sec-title-l`.
- **Net-new:** the world-map treatment, region cards with gold top-bars, the 8-tile
  hairline milestone grid.

## 7 — Elevation opportunities (do not build)

1. **Count-up milestones on scroll** — reuse `CountUp`; numbers roll 0→10M+ as tiles
   enter, staggered. *Risk: low. Effort: low (component exists).*
2. **Live world map** — replace the flat dotted JPG with an interactive/animated dotted
   globe or SVG map where milestone countries pulse/plot as you scroll (arcs from India
   → each country). *Risk: med (perf + the "map of Africa" accuracy). Effort: med–high.*
3. **Region → milestone link** — hovering a region highlights its milestone tiles (e.g.
   Africa lights Tanzania/Nigeria/Côte d'Ivoire/DR Congo/Ghana). *Risk: low. Effort: med.*

═══════════════════════════════════════════════════════════════════════════════

# ② INFRASTRUCTURE  (`section-infra`, #infra)

## 1 — Exact content (verbatim)

- **Eyebrow** (`.sec-ey`): `Infrastructure`
- **Title** (`.sec-title`): `Built for Scale.` **[br]** `Engineered for Trust.`

**Capacity cards (3)** — `.infra-photo` (placeholder) / `.infra-num` / `.infra-title`
/ `.infra-text` / `.infra-spec`:

| # | Photo label | Title | Text | Spec |
|---|---|---|---|---|
| 01 | Photo · Head Office, Sanpara | **3 Print Facilities** | "State-of-the-art production units across Navi Mumbai, totalling 2,00,000 sq. ft., built for efficiency, safety and scale." | Taloja MIDC, Navi Mumbai |
| 02 | Photo · Press Floor | **20 Printing Towers, 5 Sheet Fed** | "High speed presses supported by 17 folders, 10 binding and stitching lines, 6 automatic thread sewing machines and 2 digital presses, for precision at any scale." | 30,000 MT Shipped Annually |
| 03 | Photo · Warehouse & Fulfilment | **2 Warehouse & Fulfilment Centres** | "Automated collating, kitting and shrink-wrapping, up to 10,000 kits processed every single day." | Navi Mumbai · Export-Ready |

**Video block** — `.infra-video`:
- Play button (`.infra-video-play`, CSS triangle).
- Label (`.infra-video-label`): `Video · Inside Our Facilities`
- Note (`.infra-video-note`): "placeholder, send over the facility walkthrough footage
  and it drops in here"

**"Our People" subsection** (`margin-top:64px`):
- Eyebrow (`.sec-ey`): `Our People`
- Heading (inline-styled `h3`): **`600+ Hands Behind Every Shipment.`**
- Paragraph (`.infra-text`, max 640px): "Press operators, quality inspectors, kitting
  teams and logistics specialists, working across shifts, trained to the same standard
  at every facility."
- **People grid (4 photos)** — `.people-photo` placeholders: `Photo · Press Floor Team`
  · `Photo · Quality Check` · `Photo · Kitting & Packing` · `Photo · Leadership Team`

> ⚠ **Source inconsistency to reconcile with client:** card 01 photo says "Head Office,
> **Sanpara**" but its spec says "**Taloja MIDC**, Navi Mumbai" — two different place
> names. Also "2,00,000 sq. ft." uses Indian digit grouping (= 200,000).

## 2 — Structure

```
section.section-infra#infra
  div.si
    div.sec-ey            "Infrastructure"
    h2.sec-title          Built for Scale. / Engineered for Trust.
    div.infra-grid        → 3 × div.infra-card
        div.infra-photo (grey placeholder, 170px tall)
        div.infra-card-body ( .infra-num / .infra-title / .infra-text / .infra-spec )
    div.infra-video       ( .infra-video-play ▷ / .infra-video-label / .infra-video-note )
    div (margin-top:64px)  "Our People"
        div.sec-ey / h3 / p.infra-text
        div.people-grid   → 4 × div.people-photo (1:1 placeholders)
```
- Capacity grid: **3 cols** (mobile 1). People grid: **4 cols** (mobile 2). Video: full-width, 360px tall.

## 3 — Assets

- **Zero real images.** Every `.infra-photo` / `.people-photo` is a **grey gradient
  placeholder div** with an uppercase caption. **7 photos to source from Harry:** 3
  facility (Head Office, Press Floor, Warehouse) + 4 people (Press Floor Team, Quality
  Check, Kitting & Packing, Leadership Team).
- **Video is a placeholder** (`.infra-video`, not a `<video>`). **1 walkthrough video to
  source** ("Inside Our Facilities"). No poster frame exists yet.
- Icon: the play button is a **pure-CSS triangle** (`.infra-video-play::after` borders),
  not an SVG. No logos.

## 4 — Styling

- **Section:** `background:var(--cream2)`; `padding:100px 56px` (mobile `60px 20px`).
- **`.infra-card`:** bg cream, `border-bottom:3px solid transparent` → **gold on hover**
  + `translateY(-4px)` (0.3s). Body padding 28/26.
- **`.infra-photo`:** 100%×**170px**, navy-tint gradient, 1px bottom border, centered
  10px/ls2 uppercase caption.
- **`.infra-num`:** Inter Tight **36px** `rgba(navy,0.08)` (ghost number).
- **`.infra-title`:** Inter Tight 19px/500 navy. **`.infra-text`:** Inter 13px `#444` lh1.6.
- **`.infra-spec`:** DM Mono **8.5px** ls1.8 uppercase **gold `#9B7420`** (⚠ tiny + gold).
- **`.infra-video`:** 360px, navy-tint gradient, 1px border; **`.infra-video-play`** 68px
  navy circle, cream ▷ triangle, `box-shadow 0 14px 34px rgba(navy,0.28)`, `cursor:pointer`.
- **`.people-photo`:** `aspect-ratio 1/1`, navy-tint gradient, centered caption.
- Only motion in source: card hover lift + border. No keyframes.

## 5 — Compliance flags

- **Video → captions/transcript required.** When the walkthrough lands it needs
  captions + a transcript (and a real poster frame); the play button must be a real
  control (keyboard-focusable, labelled), not a decorative div.
- **`infra-spec` 8.5px gold on cream** fails both the **≥11px** legibility floor and
  likely **4.5:1 contrast** (`#9B7420` on `#F0EBE0` ≈ 3.5:1). Remediate size + color.
- **Placeholder photos are grey divs, not baked-text images** → good (no image-to-HTML
  conversion needed), but they are empty until Harry supplies photos.
- Reconcile the **Sanpara vs Taloja** place-name discrepancy before publishing.

## 6 — Our-side mapping

- **`PrintingServices.jsx`** (built, currently **not mounted** in `App.jsx`) is a
  product-card-grid skeleton (cards with overhanging images) — closest match for the
  3-card capacity grid. **`TrustStrips.jsx`** has the stat/figure vocabulary for the
  numbers ("3 Facilities", "20 Towers", "30,000 MT").
- **Net-new:** the accessible video component (poster + captions + real play control),
  the 4-up people grid, the ghost-number card treatment.
- Available but unused sections to cannibalise: **`PrintingServices.jsx`**,
  **`Quote.jsx`** (both in `src/sections/` but absent from `App.jsx`).

## 7 — Elevation opportunities (do not build)

1. **Count-up capacity figures** — "3 / 20 / 5 / 17 / 10 / 6 / 2 / 30,000 MT / 10,000
   kits" roll up as cards enter (same `CountUp`). *Risk: low. Effort: low.*
2. **Real, captioned facility video** with a tasteful poster + scrubbable inline player
   (lazy-loaded, reduced-motion safe). *Risk: low–med (a11y done right). Effort: med;
   blocked on Harry's footage.*
3. **Press-floor parallax / "capacity ticker"** — a subtle scrolling strip of the
   equipment counts, or a layered parallax on the facility photos. *Risk: med (don't
   re-introduce the marquee-jank). Effort: med; blocked on photos.*

═══════════════════════════════════════════════════════════════════════════════

# ③ CERTIFICATIONS  (`section-cert`)

## 1 — Exact content (verbatim)

- **Eyebrow** (`.sec-ey no-line`): `Trust & Responsibility`
- **Title** (`.sec-title`): `Certified for Quality.`

**Certification badges (5)** — `.cert-badge` ( logo img + `.cert-badge-name` +
`.cert-badge-sub` ), in a `.cert-badges-solo` 4-column grid; the 5th spans full width:

| # | Logo (alt) | Name | Sub |
|---|---|---|---|
| 1 | FSC | **FSC Chain of Custody** | Responsible Paper Sourcing |
| 2 | ISO | **ISO 9001:2015** | Quality Management |
| 3 | ISO | **ISO 14001:2015** | Environmental Management |
| 4 | Sedex | **Sedex Member** | Ethical Trade Audit |
| 5 | *(no logo, `grid-column:1/-1`)* | **Star Export House** | Govt. of India |

## 2 — Structure

```
section.section-cert
  div.si
    div.sec-ey.no-line    "Trust & Responsibility"   (no trailing rule)
    h2.sec-title          "Certified for Quality."
    div.cert-badges.cert-badges-solo   (4-col grid, max 1000px, centered)
        4 × div.cert-badge ( img.cert-badge-logo + name + sub )
        1 × div.cert-badge (full-width, text-only: Star Export House)
```

## 3 — Assets

- **`13_cert-fsc-9d1f9260.png` — 244×291 PNG (~23 KB)** → FSC badge (portrait mark).
- **`14_cert-iso-a5d7538a.png` — 346×346 PNG (~28 KB)** → ISO badge (square). **Reused
  for both ISO 9001 and ISO 14001** (both `alt="ISO"`; extraction has **no `#15`** — the
  second ISO logo is the same asset or was de-duped). Confirm whether 9001 and 14001
  should carry distinct marks.
- **`16_cert-sedex-c8924626.png` — 338×55 PNG (~9.5 KB)** → Sedex wordmark (landscape).
- **Star Export House** has **no logo** (text-only tile).
- Logos are rendered `max-height:38px; object-fit:contain`.

## 4 — Styling

- **Section:** `background:var(--cream)`; `padding:100px 56px` (mobile `60px 20px`).
- **`.sec-ey.no-line`:** same eyebrow but the `::after` rule is suppressed.
- **`.cert-badges-solo`:** `grid-template-columns:repeat(4,1fr)`, max-width 1000px,
  centered, 14px gap (mobile → 1 col via `.cert-grid` rule).
- **`.cert-badge`:** `1px rgba(navy,0.12)` border, padding 22/16, `text-align:center`,
  `bg var(--cream2)`.
- **`.cert-badge-logo`:** max-height 38px, max-width 80%, contain.
- `.cert-badge-name` / `.cert-badge-sub`: (name Inter Tight, sub smaller muted — sizes
  inherit section defaults; confirm on build). No motion in source.

## 5 — Compliance flags

- ⚑ **FSC licence code MISSING (blocker for the FSC mark).** The FSC logo appears with
  only "FSC Chain of Custody / Responsible Paper Sourcing" — **no licence code**. FSC
  trademark rules require the **licence code (`FSC® C…` / `TUVDC-COC-101258`) beside the
  mark**. Do not publish the FSC logo until the correct, current code is placed adjacent.
  Also confirm the FSC mark artwork is the approved current version.
- **ISO / Sedex / Star Export House:** confirm certificates are **current & valid**
  (dates), and that logo usage is permitted; ISO marks often shouldn't imply the cert
  body's endorsement — use factual "Certified to ISO 9001:2015" phrasing.
- **Logos are legitimate brand images (acceptable as `<img>`)** — but each needs proper
  `alt` (currently `alt="FSC"` / `alt="ISO"` — make descriptive, e.g. "FSC certified").
- Two identical `alt="ISO"` values are ambiguous for screen readers → differentiate.

## 6 — Our-side mapping

- **No direct skeleton exists.** Closest patterns: **`TrustStrips.jsx`** (badge/figure
  row vocabulary) and the `.proc` node/tile rhythm we just built. A simple bordered
  badge grid is quick net-new.
- **Net-new:** the 4-up badge grid + the full-width Star Export House tile, plus the
  FSC licence-code lockup.

## 7 — Elevation opportunities (do not build)

1. **"Verified" micro-interaction** — each badge draws a subtle check/seal or lifts on
   enter (in our restrained press language), FSC code revealed as a mono kicker. *Risk:
   low. Effort: low.*
2. **Unify with Sustainability** — Cert (`section-cert`) and the following
   `section-sustain` are twin trust bands; consider one combined "Trust & Responsibility"
   band to avoid two thin cream sections back-to-back. *Risk: low (scope creep beyond the
   three). Effort: low–med.*
3. **Monochrome→color logo on hover** — logos sit greyscale at rest, ink to full color on
   hover/enter (reads as "certified/stamped"). *Risk: low (respect logo brand guidelines).
   Effort: low.*

═══════════════════════════════════════════════════════════════════════════════

# RECOMMENDED BUILD ORDER

**① GLOBAL PROJECTS → ② CERTIFICATIONS → ③ INFRASTRUCTURE.**

### Why this order

1. **Projects first — content-complete, asset-ready, highest impact.** All copy is
   final, the only asset (world-map JPG) is already extracted, and it reuses skeletons
   we own (`CountUp` from `Proof.jsx`, dark-band + title-reveal from `Promise.jsx`). It's
   also the dark beat that anchors the post-Process rhythm. Its one blocker (HDFC/ZEE
   permission) affects **only two milestone tiles** — build the section now, gate or
   neutral-phrase those two, swap the names in when cleared.

2. **Certifications second — small, self-contained, mostly asset-ready.** Logos (FSC,
   ISO, Sedex) are extracted; it's a one-evening badge grid. **Do not merge to `main`
   until the FSC licence code is supplied** — build the layout with a `TUVDC-COC-101258`
   placeholder lockup and flag it for client confirmation. Quick, visible trust win.

3. **Infrastructure last — most net-new and most asset-blocked.** Needs **7 real photos
   + 1 captioned walkthrough video** from Harry that don't exist yet; the accessible
   video component is real work. Build the shell (cards, ghost numbers, people grid,
   count-ups) with placeholders in parallel, but it can't be *finished* until the media
   arrives — so it shouldn't gate the other two.

### Asset needs from Harry (consolidated)

| Section | Needed | Status |
|---|---|---|
| Projects | world-map bg | ✅ have (`12_worldmap-dots.jpg`) — or upgrade to live map |
| Cert | FSC / ISO / Sedex logos | ✅ have (`13`,`14`,`16`); confirm ISO 14001 distinct mark |
| **Cert** | **FSC licence code** (`TUVDC-COC-101258`?) | ⚑ **BLOCKER — required beside FSC mark** |
| **Projects** | **HDFC / ZEE-Kidzee written permission** | ⚑ **BLOCKER for 2 tiles** |
| **Infra** | **3 facility + 4 people photos** | ⚑ missing (grey placeholders) |
| **Infra** | **facility walkthrough video** (+ captions/transcript/poster) | ⚑ missing (placeholder box) |
| Infra | reconcile "Sanpara" vs "Taloja MIDC" | ❓ client clarification |

### Compliance gate summary (must clear before `main`)

- **FSC licence code** beside the FSC mark (Cert) — hard blocker on that logo.
- **HDFC & ZEE/Kidzee** permission (Projects) — hard blocker on those two tiles.
- **Video captions + transcript + real play control** (Infra) — required when footage lands.
- **Contrast/size remediation:** `mc-desc`, `mc-flag` (8px), `infra-spec` (8.5px), small
  gold-on-dark/cream labels → raise to ≥11px and ≥4.5:1 on build.
- Verify all cert dates current; make logo `alt` text descriptive & unique.

**No baked-text content images in any of the three** — nothing needs image→HTML conversion
(the world map is decorative; cert marks are legitimate logos). That's a clean win versus
hero/process.
