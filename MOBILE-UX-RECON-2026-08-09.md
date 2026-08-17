# MOBILE UX / DESIGN RECON — 390×844

**Read-only design & feel audit. No source files were modified; only this report was written.**

- **Date:** 2026-08-10
- **Build:** `vite build` (exit 0, 7202 modules, dist hash `index-DvfokVOu.js`) → served by `vite preview` on `http://localhost:4173` (confirmed serving the fresh dist by hash). Dev server never used.
- **Device:** Playwright Chromium, viewport **390×844, DPR 3, `isMobile:true`, `hasTouch:true`**. Consent pre-accepted (`qfp.consent`), language via `qfp.lang` (`en`/`fr`) — no `/fr` `/es` routes.
- **Evidence:** every screenshot lives in the session scratchpad `…/scratchpad/mob/shots/`; every number is `getComputedStyle` / `getBoundingClientRect` captured live. Raw metrics: `…/scratchpad/mob/json/all.{en,fr}.json`.
- **Method note — line counts:** heading text on this site is animated with a per-letter "text-reveal" that splits every word into positioned `<span>`s. This makes `range.getClientRects()` line-counts and `element.lineHeight` **unreliable** (they over-count). Every wrap / line-count claim below therefore comes from a screenshot I opened, not from the computed count. Font *sizes* are trustworthy (measured as the max font-size across the heading's text subtree).

### git status at START (`git status --porcelain`)
```
?? "FINAL ASSETS ARE HERE.zip"
?? MOBILE-RECON-2026-08-09.md
?? "NEW QFP AV.mp4"
?? RECON-2026-08-09.md
?? "THE FINAL DESKTOP WEBSITE CHANGE/"
?? "WhatsApp Image 2026-07-29 at 1.12.52 PM.jpeg"
?? _assets-in/  _assets-in2/  _lane1/ … _lane7/  _recon/ _recon2/ _recon3/
?? drive-download-20260728T032950Z-1-001.zip
```
Branch `phase2-routing`. (git status at END is in §10 — identical apart from this report file.)

---

## 1. Section-by-section spacing audit

**How to read the tables.** `H` = section height. **`top pad` / `bot pad`** = *content-based* whitespace, i.e. the gap between the section's box edge and the nearest painted content (text/media) — this is what the eye actually reads as padding, and is more honest than the section's `padding` property because several sections carry their padding on inner wrappers (section `padding` shown as `secPad`). **`sideL/R`** = inset from the 390px viewport edge to the nearest content (negative = full-bleed horizontal scroller, content deliberately runs past the edge). **`fill`** = painted-content height ÷ section height. **`gap→`** = combined empty screen before the next section (`bot pad` of this + `top pad` of next). Mobile convention target: **vertical section padding 48–64px; horizontal gutter ≤24px/side.** Desktop here runs 96–160px.

Reference computed values at 390×844: `--section-pad-y` = **96px** (clamp floor), `--page-gutter` = **20px**, vh units → 4vh=34, 6vh=51, 8vh=68, 9vh=76, 10vh=84, 11vh=93, 12vh=101, 13vh=110, 14vh=118, 15vh=127.

### `/` Home — docH 16328 (19.3 screens)  · shots `home.en.s00…s12.png`, `home.en.first.png`
| # | Section | H | secPad t/b | top/bot pad | sideL/R | fill | gap→ | Verdict |
|--|--|--|--|--|--|--|--|--|
|0|`#hero`|844|0/0|185/0|0/0|.78|16|Hero art; airy top OK for a hero (see §7)|
|1|`#trust` band|97|0/0|16/13|scroller|.69|69|OK (auto-scroll logo band)|
|2|`#what-we-print`|1263|0/0|56/**72**|20 / scroller|.90|**148**|**Too much** — big empty cream band between intro and card carousel (`home.en.s02`)|
|3|`#reach` (globe)|1074|0/0|**76**/0|**56**/0|.93|84|**L-inset 56px** breaks the 20/24 rhythm; top pad 76|
|4|`#promise`|447|84/84|**84/84**|22/22|.62|84|**Too much** both sides; 447px section, 279 content|
|5|`#projects`|3274|72/72|0/0|0/0|1.00|72|OK internally (full-bleed globe+cards)|
|6|`#infrastructure`|2188|72/80|**72/80**|24/24|.93|1|**Too much** t/b (facility-book section, see §4)|
|7|`#certifications`|790|36/88|-79/**101**|0 / scroller|.97|**139**|**bot 101 + gap 139** empty before process|
|8|`#process`|588|38/96|38/**96**|0/0|.77|**142**|**bot 96 + gap 142**|
|9|`.tb-band` (trade)|399|34/34|46/43|**29/101**|.78|43|**Off-centre**: content starts 29px in, stops 101px short of right|
|10|`#marquee`|202|**152**/32|0/33|scroller|.84|**145**|**secPad-top 152px** hardcoded — worst single number on the page|
|11|`#sustainability`|1401|72/72|**112**/72|24 / scroller|.87|72|**top 112**|
|12|`#awards`|856|0/0|0/0|0 / scroller|1.00|—|OK (full-bleed carousel)|

Left-edge insets present on this page: **0, 20, 22, 24, 29, 56** — six different left edges as you scroll (inconsistent).

### `/about` — docH 12604 (14.9 screens) · shots `about.en.s00…s09.png`
| # | Section | H | secPad t/b | top/bot pad | sideL/R | fill | gap→ | Verdict |
|--|--|--|--|--|--|--|--|--|
|1|`.ph-hero`|506|**127/84**|**198/152**|20/20|**.31**|**152**|**Whitespace hero** — 156px content in a 506px navy band (`about.en.first`)|
|2|`.ab-lede`|363|68/42|0/0|0/0|1.00|0|OK|
|3|`.prun-scroll` (timeline)|2110|0/0|0/**822**|0/0|.61|**821**|**822px of empty** at the pinned-scroll timeline's tail (`about.en.s03`) — a full phone screen of nothing|
|4|`.mvv`|961|0/0|0/0|0/0|1.00|0|OK|
|5|`.tm` (team)|1910|34/38|0/0|0/0|1.00|0|OK (grid, see §5)|
|6|`.ab-quote`|376|76/76|0/0|0/0|1.00|0|Pull-quote, borderline|
|7|`.gal`|1809|60/96|0/0|0/0|1.00|1|bot 96|
|8|`#awards`|856|0/0|0/0|scroller|1.00|20|OK|
|9|`#certifications`|806|36/104|20/0|0/scroller|.98|—|**bot 104**|

### `/global-markets` — docH 5914 (7.0 screens) · shots `global.en.s00…s03.png`
| # | Section | H | secPad t/b | top/bot | sideL/R | fill | gap→ | Verdict |
|--|--|--|--|--|--|--|--|--|
|0|`.ph-hero`|525|127/84|**130/84**|20/20|.59|84|Airy hero (`global.en.first`)|
|1|region card 1|854|**96/96**|0/0|0/0|1.00|-1|**96/96** (Tailwind `py-24` in JSX)|
|2|region card 2|1251|**96/96**|-1/**96**|0/0|.92|96|**96/96**|
|3|region card 3|377|**96/96**|0/0|0/0|1.00|—|**96/96**|

### `/print-on-demand` — docH 8220 (9.7 screens) · shots `pod.en.s00…s02.png`
| # | Section | H | secPad t/b | top/bot | sideL/R | fill | gap→ | Verdict |
|--|--|--|--|--|--|--|--|--|
|0|`.ph-hero`|523|127/84|**183/137**|20/20|**.39**|**155**|**Whitespace hero** — headline+CTA float in navy (`pod.en.first`)|
|1|`#build` (configurator)|3626|59/76|18/**101**|20/20|.97|100|bot 101|
|2|`.pod-explore`|1164|68/68|0/0|0/0|1.00|—|68/68, borderline|

### `/infrastructure` — docH 11418 (13.5 screens) · shots `infra.en.s00…s09.png`
| # | Section | H | secPad t/b | top/bot | sideL/R | fill | gap→ | Verdict |
|--|--|--|--|--|--|--|--|--|
|0|`.ph-hero`|506|127/84|**216/170**|20/20|**.24**|**210**|**Worst hero** — 24% filled, 210px empty into next (`infra.en.first`)|
|1|`.tb-band` (stats)|277|34/34|40/36|**28/122**|.73|36|**Off-centre**, R-inset 122|
|2|`.inf-facilitybook`|1692|0/38|0/38|24/24|.98|41|Facility book (see §4)|
|3|`.inf-finish-sec`|1059|**93/93**|3/0|0/0|1.00|0|**93/93**|
|4|`.inf-av` (video)|955|76/76|0/-235|0/0|1.25|—|76/76|
|5|`.inf-tri`|1253|**101/101**|-1/-1|0/0|1.00|-1|**101/101**|
|6|`.inf-gallery`|700|**93/93**|0/0|0/0|1.00|27|**93/93**|
|7|`#certifications`|806|36/104|27/0|0/scroller|.97|0|bot 104|
|8|`#awards`|856|0/0|0/0|scroller|1.00|-1|OK|
|9|`.inf-cta`|408|**101/101**|-1/0|0/0|1.00|—|**101/101**|

### `/newsroom` — docH 5982 (7.1 screens) · shots `newsroom.en.s00…s01.png`
| # | Section | H | secPad t/b | top/bot | sideL/R | fill | gap→ | Verdict |
|--|--|--|--|--|--|--|--|--|
|0|`.ph-hero`|439|127/84|**156/111**|20/20|**.39**|111|**Whitespace hero** (`newsroom.en.first`)|
|1|`.nr-index`|2636|51/68|0/0|0/0|1.00|—|OK (card grid, see §5)|

### `/newsroom/printweek-power-100-2026` (article) — docH 6135 (7.3 screens) · shots `article.en.s00.png`
| # | Section | H | secPad t/b | top/bot | sideL/R | fill | Verdict |
|--|--|--|--|--|--|--|--|
|0|`article.nra`|3228|0/0|**127**/0|0/0|.96|Article body; **top pad 127** (below the ph-hero). Single-column, reads fine.|

### `/fulfilment` — docH 11560 (13.7 screens) · shots `fulfilment.en.s00…s06.png`
| # | Section | H | secPad t/b | top/bot | sideL/R | fill | Verdict |
|--|--|--|--|--|--|--|--|
|0|`.ph-hero`|663|127/84|130/84|20/20|.68|**Best hero** — eyebrow+headline+sub+stat+CTA all in view (`fulfilment.en.first`)|
|1|`.ff-trust`|348|68/68|0/0|scroller|1.00|OK|
|2|`.ff-conv`|1917|**101/84**|0/0|0/0|1.00|**101 top**|
|3|`.ff-value`|1674|**101/101**|0/0|0/0|1.00|**101/101**|
|4|`.ff-features`|2585|59/84|0/0|0/0|1.00|bot 84|
|5|`.ff-journey`|924|**110/110**|0/0|0/0|1.00|**110/110**|
|6|`.ff-cta`|542|**118/127**|0/0|0/0|1.00|**118/127** — highest padding pair on the site|

### `/contact` — docH 10396 (12.3 screens) · shots `contact.en.s00…s06.png`
| # | Section | H | secPad t/b | top/bot | sideL/R | fill | Verdict |
|--|--|--|--|--|--|--|--|
|0|`.ph-hero`|615|127/84|130/84|20/20|.65|Airy hero, ~470px empty navy above eyebrow (`contact.en.first`)|
|1|`.ctc-welcome`|452|**96**/40|0/0|0/0|1.00|top 96|
|2|`.ctc-desk-sec`|1192|40/**104**|0/0|0/0|1.00|bot 104|
|3|`.ctc-addr`|1107|**116/108**|0/0|0/0|1.00|**116/108**|
|4|`#careers`|626|76/51|0/0|0/0|1.00|top 76|
|5|`#enquiry` (form)|1797|**116/120**|0/0|0/0|1.00|**116/120**|
|6|`.ctc-faq`|1699|80/84|0/0|0/0|1.00|80/84|

### Where the padding comes from (CSS side)

There **is** a shared token — but it is not wired for mobile, and only ~half the sections use it:

- `src/index.css:105` `:root { --section-pad-y: clamp(96px, 11vh, 128px); }` and `:111` `--page-gutter: clamp(20px, 5vw, 56px);`. **Neither is overridden in any `@media (max-width…)`** — every mobile `max-width` block in index.css touches component classes, none redefine these tokens. So on a phone the "one vertical rhythm" is stuck at its **96px floor**.
- `src/index.css:1352` references **`var(--section-pad-y-mobile, 56px)`** inside `@media (max-width:900px)` — but `--section-pad-y-mobile` **is never defined anywhere**, so it silently falls back to the literal `56px`. Exactly one section (Process) opted into a mobile reduction, and it did so through an undefined-variable fallback. The intent to have a mobile token exists; the token doesn't.
- **Token users** (`var(--section-pad-y)` / `.u-section`): `index.css:367,1105,1384,1490,2331,3110` + ProcessVideo. A one-line mobile override of the token would fix all of these at once.
- **Hardcoded, non-responsive** paddings (won't react to the token): the vh-clamp family — `.ph-hero` `clamp(112px,15vh,168px)/clamp(72px,10vh,112px)` (`src/components/PageHero.css:15`); OurStory, InfrastructurePage, PrintOnDemand, Newsroom section files; the `ff-*` and `ctc-*` blocks in index.css; the `#marquee` `152px` top in index.css; and Global-Markets' `py-24` (96px) written as **Tailwind utilities in `src/pages/GlobalMarkets.jsx`** (not CSS at all).

**Bottom line for lane planning:** the codebase is *partially* tokenised. A mobile override of `--section-pad-y`/`--page-gutter` (+ defining `--section-pad-y-mobile`) in index.css is the single highest-leverage move, but it only reaches token-users; the vh-hardcoded heroes and per-page sections each need their own edit. This is not "all hardcoded" (cheap fixes exist) nor "all tokens" (one change won't do it) — it's a hybrid, and the lane plan in §9 reflects that.

---

## 2. Typography scale on mobile

Sizes are trustworthy (max font-size over the text subtree). Visual line-counts are from screenshots (see method note).

### Heading sizes actually rendered at 390 (EN)
| Element | Route/section | px | Notes |
|--|--|--|--|
|Inner-page H1 `.ph-title`|about/global/pod/infra/newsroom/fulfilment/contact|**36**|Renders large & legible in every hero screenshot (§7). Steps down from desktop `--h1` fine. FR wraps 1 line more but holds.|
|Homepage hero H1|`#hero`|art (webp)|Visible headline is baked/─image art; the live `<h1>` is the sr-only text-reveal layer (measured size is noise). Reads big — no issue.|
|Article H1|article|32|fw 800; ~4 lines, fine|
|Section H2|homepage|**27 → 48**|**Inconsistent:** `what-we-print` 27, `certs` 32, `reach` 40, `proj`/`infra`/`process`/`sustain` 38, **`awards` 48**. Peer section titles vary ~1.8×.|
|Section H2|inner pages|24–34|infra section H2s all 30; fulfilment 24–34; contact 24–30 — more consistent than home|
|H3 card titles|wwp 20 · projects 26 · awards 17 · newsroom 16 · team roles 12|—|generally fine|

### Body / small text — the real problem
| Where | px | Verdict |
|--|--|--|
|Facility-book **facility pages** (`.ib-facpage-intro`, `.ib-fpoint-desc`)|**11** (lh 14.3)|**Too small.** Verified no transform (`rendered_h`=71 = 5×14.3). `home-fb-3opened-centered`.|
|Homepage `#infrastructure` overview body / spec list|**11**|**Too small** for body copy.|
|`what-we-print` card body / projects cards / cert card body|**13**|Below the 15–16px mobile convention|
|Awards card body|13.5| Small|
|`--body` token|**15** (`clamp(15px,1.2vw,18px)` floors at 15)|OK where used — but the small text above does **not** use it (hardcoded).|
|Footer H3 labels|11 (lh 16.5, **lr 1.5**)|Small + loose line-height|

**Findings:**
- **Systematically small body copy.** The token is a fine 15px, but the facility book (11px), homepage infrastructure block (11px), and every card body (13px) hardcode sizes below it. On a 390 screen the facility pages and infra spec list are squint-small.
- **Section-title scale is unsystematic on the homepage** (27→48px for peers). `Awards & Press` (48px) is the largest thing on the page yet introduces a single card — reads louder than `Formats and Categories` (27px), which introduces the whole product taxonomy. This is a hierarchy wobble, not an inversion.
- **No true hierarchy inversions or mid-word overflow found.** `overflow-wrap` never triggered; no heading overflowed its box in EN or FR. "Manufacturing"/French strings wrap cleanly.
- **Line-height on big headings is fine visually** — the tight computed `lr` (0.47/0.67) is a text-reveal artifact; screenshots show comfortable spacing between the cream and gold heading lines on every hero.
- **FR (≈20% longer):** no breakage. Longest cases add one line and hold: infra `Façonnage à valeur ajoutée sous un même toit`, global `Amérique du Nord, Royaume-Uni et Europe`, contact welcome statement. `home.fr.*` shots. **One content gap (not layout):** the Awards H3 titles stay in English under FR (only the eyebrow/title translate) — cosmetic, out of the spacing scope but worth flagging.

---

## 3. Buttons and CTAs — feel

Every CTA measured (EN). Tap targets already meet 44px; this is about width, stacking and consistency.

| Button | Route | W×H | padX | fs | full-ratio | Notes |
|--|--|--|--|--|--|--|
|`Infrastructure` (hero)|home|220×**54**|22/46|15|.56|Fixed 220, centred, **stacked** with the next|
|`Our global reach` (hero)|home|220×**54**|24/24|15|.56|Second hero CTA, stacked under first|
|`See More →`|home/about/infra awards|127×**42**|22/22|13|.33|Narrow, left-aligned|
|`Start building ↓`|pod hero|155×42|22/22|13|.40|Centred|
|`Request This Book →`|pod build|299×42|—|13|.77|Near-full|
|`Watch more on YouTube`|infra|316×42|18/18|13.5|.81|Near-full|
|`Request a Quote →`|infra/fulfil|173×42|22/22|13|.44|Narrow, centred|
|`Start a conversation →`|fulfil cta|196×42|22/22|13|.50|Half-width|
|`Email your CV` (outline)|contact careers|145×**48**|26/26|13|.37|**`u-btn`** family — different height/pad|
|`Send an Inquiry` (gold)|contact careers|156×**48**|26/26|13|.40|Side-by-side with the outline one|
|`Send enquiry`|contact form|156×42|22/22|13|.40|Narrow|
|FAQ rows `q-q0…15`|contact|342×59–81|2/2|15|.88|Full-width accordion (correct)|

**Findings:**
- **Three inconsistent button systems.** Heights **42 / 48 / 54** and font-sizes **13 / 15** coexist: `hero-btn` (54/15), `btn-nebula` (42/13, the workhorse), `u-btn` (48/13, only on contact careers). Same intent ("Request a Quote"), different metrics across pages.
- **Primary CTAs stay desktop-narrow.** Most sit at **0.33–0.56 of viewport width**, centred, floating with wide side margins instead of going full-width — the mobile convention for a primary action. The hero pair (220px each) and every `See More`/`Request a Quote` read as small desktop pills dropped onto a phone.
- **The hero CTA pair:** the brief names "Request a Quote" + "Download Company Profile"; the *current* homepage hero pair is **`Infrastructure` + `Our global reach`** (220×54 each). At 390 they **stack vertically** (2×220 can't fit 390) and both sit **below the fold** — only the top of the first peeks at 844 (`home.en.first`). So the primary hero actions aren't visible on load.
- **Contact careers pair** `Email your CV` + `Send an Inquiry` sit **side-by-side** at 145+156px — they fit but are the only squashed pair; they'd read better stacked and use a *different* button family than the rest of the site.
- **Consistent bit:** the accordion FAQ rows and the drawer CTA are correctly full-width.

---

## 4. The facility book on mobile — full walkthrough

Same component on the homepage (`#infrastructure`) and `/infrastructure` (`.inf-facilitybook`); **geometry is identical** on both. At ≤900px the component sets `narrow=true` → `canFlip=false`, so **there is no page-turn/leaf animation on mobile — it's a silent crossfade**; swipe (>44px) and the `.ib-nav` arrow buttons drive it; the "Turn →" cursor hint never appears. Shots: `home-fb-1overview / -2opened / -3opened-centered / -4turn / -5back`, `infra-fb-*`.

**Measured layout (section scrolled to top):**
- Stage height **1654px** (≈2 phone screens). Layout is a single column: the **open book/spread sits at the TOP** (`bookWrap` top 124, **height 1007 — the overview spread alone is 923px, taller than the 844 screen**), and the **tappable spine stack is BELOW it** — `Click a book…` hint at ~1030px, the 5 spines at **1278–1700px** down.
- Spine tap targets: **220×57** each (good size).
- Book/spread width **302px**, height **923px** (overview) / **680px** (opened). The "two-page spread" is rendered as a **tall vertical column**, not a spread.

**Walkthrough as a first-time phone user (tap count):**
1. Scroll to the section → you land on the **overview "book"**: a cream card reading *Infrastructure / Built to deliver quality at scale / 2 paragraphs / 4 pillars / "As of July 2026…" spec list* (`home-fb-1overview`). Readable, but it's ~923px tall — you scroll a **full screen+** just past the intro.
2. Keep scrolling ~1000px to reach the hint **"Click a book to explore each facility"** and the coloured spine stack (WEB OFFSET / SHEET FED / BINDING & FINISHING / WAREHOUSE / CORPORATE HQ) (`home-fb-2opened` lower half). **The instruction and the thing it points at are a full screen below the content they modify.**
3. **Tap a spine (tap 1).** Measured: the book spread updates at **`top = -490`, i.e. ~490px ABOVE the current viewport, off-screen.** On screen you only see the `PAGE 01/07` bar and a spine highlight appear — **the facility you "opened" is invisible; the tap feels dead.** You must now scroll **up** to see it (`home-fb-2opened` is exactly what you see right after the tap: still the stack).
4. Scroll up ~490px → the opened facility (`home-fb-3opened-centered`): two facility photos stacked, then a cream card — icon, **`WEB OFFSET` title 18px**, gold rule, **body copy 11px**, four feature points (also 11px). Photos are `object-fit:contain` letterboxed (302×150), never cropped.
5. **Turn:** tap the gold `→` arrow (tap 2) or swipe → crossfades to `PAGE 02/07`. Arrows are large gold/─brown discs at the book's base (`home-fb-4turn`).
6. **Return:** tap the `⌂ INFRASTRUCTURE` overview pill (tap 3) → crossfades back to overview (`home-fb-5back`).

**Honest verdict (with measurements):**
- **The horizontal-book metaphor does not hold at 390.** The spread is 302px wide and 680–923px tall — a portrait column, not a book. The format fights the screen.
- **Two structural UX faults:**
  1. **Reading order is inverted** — the giant overview spread (923px) is above the spines, so you meet the payload before the control. You scroll ~1030px to reach "Click a book."
  2. **The core interaction gives no visible feedback** — tapping a spine updates content ~490px off-screen above you. First-time users will read the tap as broken.
- **Body text is 11px** on facility pages (verified, un-transformed) — squint-small.
- **What works:** spine tap targets (220×57) are generous, the stack art is attractive, photos never crop, arrows/`PAGE 0X/07` counter are clear once you're at the book, and the overview content itself is readable (~15px there). The bones are good; the mobile *arrangement and feedback* are wrong.

---

## 5. Grids, cards and images

Columns/gaps/card sizes measured; representative cards opened as screenshots.

| Grid | Route | cols | gap | n | card | Verdict |
|--|--|--|--|--|--|--|
|`.wwp-card` track|home|1 (h-scroll)|—|10|300×140|Horizontal carousel w/ ‹›; large empty band above it (`home.en.s02`)|
|`.gr-grid` region cards|home reach|1|—|2|334×551|OK stacked|
|`.proj-dests-grid`|home|1|16|3|342×501|OK|
|`.certs-track`|home/about/infra|1 (h-scroll)|18|5|300×280|Carousel ‹›, next card peeks (`home.en.s07`) — good affordance|
|`#awards` cards|home/about/infra|1 (h-scroll)|—|11|~300|Carousel, **`See More` pill** instead of ‹› (`home.en.s12`)|
|`.tm-grid` **team**|about|**2**|12|**9**|169×225|**Good** — b&w portraits clear, faces intact, consistent framing (`about.en.s05`)|
|`.gal-grid`|about|1|14|6|350×233|OK|
|`.pod-cat-grid`|pod|**2**|14|9|164×178|**Good** — product shots clear, labels readable (`pod.en.s02`)|
|`.pod-opts.chips`|pod|2–3|12|—|109–169|OK config chips|
|`.inf-gallery-strip`|infra|**2**|14|4|160×229|OK|
|`.yt-grid` videos|infra|1|14|4|312×221|OK stacked|
|`.ff-value-grid`|fulfil|1|1|6|340×220|OK|
|`.nr-grid` news|newsroom|1|22|6|350×398|OK (`newsroom.en.first`)|
|`.ctc-addr-row`|contact|1|30/20|4|272×107|OK|

**Findings:**
- **No cramped 2-up grids.** The three 2-column grids (team 169px, pod categories 164px, infra gallery 160px) all render with clear imagery and readable labels — leave them 2-up. No 1-up stack is needlessly tall except the facility book (§4).
- **Team grid (9 cards)** specifically: 2-column, ~5 rows, moderate scroll (~1900px). Photos are **consistent** (uniform b&w, similar crop) and faces read well at 169px. Good, not monotonous.
- **Images:** facility photos and card imagery use `contain`/well-chosen crops — no lost subjects, no focal-point clipping found. The only letterboxing is the facility book's `contain` frames (intentional, 302×150) and it's benign.
- **Carousel-control inconsistency** (also §8): `wwp` and `certs` use circular ‹ › buttons; `awards` uses a `See More` pill; the trust band auto-scrolls. Three different scroll affordances for the same "horizontal card row" pattern.
- **Whitespace inside `what-we-print`:** a large empty cream band separates the intro from the card carousel (`home.en.s02`) — the section reads half-empty on the way down.

---

## 6. Navigation & orientation feel

Shots: `nav-drawer-about.png`; measurements from the interaction pass.

- **No sticky/persistent nav on mobile.** The header is **`position: relative`** (`<header class="relative z-[200] …">`), height **87px** — at scroll 2500 its top is **-2500 (scrolled off-screen)**. A body-wide sweep at scroll 3000 found **exactly one** fixed element: the WhatsApp FAB (`.wa-fab`). So once you scroll down any page, **the menu is gone and unreachable without scrolling back to the top.** This is the biggest orientation issue — bigger than a too-tall sticky bar would be. (It also means the header "eats" 87px only at the very top, then returns the space.)
- **Drawer is actually pleasant.** Full-screen navy overlay 390×844, entrance animation `mnav-in` **0.28s** (crisp, not sluggish). **8 links, 56px rows, 22px text**, separated by full-width hairline dividers (measured margin gap 0, but the dividers give visual separation) — airy enough, not cramped. Close `✕` in a rounded square top-right; hamburger toggle **44×44**.
- **Active state exists** ✓ — on `/about` the drawer's **"About Us" is gold/`is-active`** (`nav-drawer-about`). Good orientation cue. (Footer active-state: none — footer links are plain.)
- **Minor drawer nit:** the 8 links occupy the top ~half; then a large empty navy gap; then `Request a Quote` (gold, 350×52) pinned near the bottom — a lot of dead space between the last link and the CTA.
- **Route change starts at top.** A `ScrollToTop` component is mounted; navigating lands you at the top of the new page (no preserved-scroll weirdness).
- **Scroll feel:** the homepage runs Lenis smooth-scroll; inner pages don't mount it. I did not observe scroll-jacking, but two spots *feel* long/heavy on the homepage because of pinned content: the **`#projects` globe** (3274px section) and the **about `.prun` timeline** (2110px with an 822px empty tail, §1) — these are the places where momentum and the pinned animation compete. No rubber-banding or lag elsewhere.
- **WhatsApp FAB overlaps content** on essentially every screen (it sits bottom-right over team photos, the awards card, the contact email chip). Persistent but mildly intrusive.

---

## 7. First screen of every route (no scroll, 390×844)

| Route | What's in view | Content vs empty | Invites scroll? | One-line verdict |
|--|--|--|--|--|
|`/` `home.en.first`|Cream header; navy hero: gold "AN" + "INTEGRATED GLOBAL BOOK" + gold subline + grey sub-paragraph; illustration + "Infrastructure" CTA only *peeking* at the very bottom|~55% content, big navy gap mid-hero|Weakly (art peeks)|Legible big headline, but **primary CTAs are below the fold** and there's a dead navy band under the sub-text|
|`/about` `about.en.first`|Header; navy hero: "ABOUT" + "POWERING GLOBAL EDUCATION / THROUGH PRINT EXCELLENCE" floating in navy; cream "OUR STORY" just appearing|~35%|Yes (cream edge shows)|**Airy to a fault** — one headline in a 500px navy band (fill .31)|
|`/global-markets` `global.en.first`|Header; ~470px empty navy; "GLOBAL MARKETS" + "PRINTED IN INDIA. / READ BY THE WORLD." + 6-line sub|~55%|Neutral|Headline strong; wasteful empty top navy|
|`/print-on-demand` `pod.en.first`|Header; **huge empty navy (~630px)**; "PRINT ON DEMAND" + "YOUR BOOK. / EXACTLY AS YOU IMAGINED." + "Start building ↓"|~35%|CTA present|**Most wasted top space**; CTA does invite|
|`/infrastructure` `infra.en.first`|Header; "INFRASTRUCTURE" + "BUILT FOR SCALE. / ENGINEERED FOR PRECISION." floating; nothing else|~25% (fill .24)|Weak|**Emptiest first screen** on the site|
|`/newsroom` `newsroom.en.first`|Header; "QUARTERFOLD PRINTABILITIES" + "NEWSROOM" + sub; first news card (Dhankani) appearing at bottom|~40%|Yes (card peeks)|OK; card peek saves it|
|`/newsroom/…` `article.en.first`|(ph-hero) article eyebrow/title over navy|~55%|Yes|Standard article head, fine|
|`/fulfilment` `fulfilment.en.first`|Header; "WAREHOUSING & FULFILLMENT" + "ONE SYSTEM, / START TO FINISH." + sub + **100,000 sq ft stat + "Request a Quote" CTA**|~68% — **best**|Yes|**The model hero** — everything the others should do|
|`/contact` `contact.en.first`|Header; ~470px empty navy; "CONTACT" + "LET'S TALK. / WE REPLY IN ONE BUSINESS DAY." + email link|~55%|Neutral|Good info, wasteful empty top navy|

**Homepage hero at 390 specifically:** in view = the gold/cream baked headline art + a 3-line grey sub-paragraph; **out of view** = both hero CTAs (`Infrastructure`, `Our global reach`) and the "600 hands" kids illustration, which only begin to peek at y≈820. The first impression is headline-over-navy with a visible empty gap — no clear next action on screen.

---

## 8. Cross-page consistency

Same element, different treatment (reads as sloppiness on mobile):

1. **Inner-page hero padding is uniform (127/84) but its *fill* is wildly different** — infra .24, pod .39, newsroom .39, about .31 vs fulfilment .68. Same shell, very different emptiness, because content volume varies but padding doesn't flex.
2. **Section-title H2 sizes** — homepage 27/32/38/40/48 for peer sections; inner pages settle around 24–30. No shared step. `Awards & Press` is 48 everywhere it appears, dwarfing neighbours.
3. **Button families — three of them:** `hero-btn` (54px/15), `btn-nebula` (42px/13), `u-btn` (48px/13, contact careers only). Heights 42/48/54 and font 13/15 across pages.
4. **Horizontal-carousel controls — three patterns:** circular ‹ › (wwp, certs), `See More` pill (awards), auto-scroll (trust band).
5. **Left-edge gutter** — 20 (page-gutter/heroes), 22 (`promise`), 24 (`projects`,`infra`), and full-bleed 0, with `reach` at **56** and the trade/stat bands off-centre (R-inset 101–122). Adjacent homepage sections don't share a left edge.
6. **Eyebrows are the consistent element** — 12px, 3px letter-spacing, uppercase, gold, across every page. Keep them as the reference for the rest.
7. **Vertical section rhythm differs per page** even though the values are close cousins: home ~72, global 96, fulfilment 101–127, contact 96–120, infra 76–101. Same "big" feel, five different numbers.
8. **WhatsApp FAB + no sticky nav** are consistent across pages (consistently present / consistently absent) — noted for completeness.

---

## 9. Lane plan

Rules: a lane = non-overlapping file territory, lanes run in parallel; **anything touching `index.css` runs alone**. Ordered by user impact. `[OBJ]` = measurable/spec-driven, `[TASTE]` = needs the owner's eye. ⚑ = needs a design decision before writing.

> **Highest-leverage first move (inside Lane 1):** define the missing mobile tokens in `index.css` — `@media (max-width:640px){ :root{ --section-pad-y: clamp(48px,8vh,64px); --page-gutter:20px; --section-pad-y-mobile:56px } }`. This instantly fixes every token-using section. The vh-hardcoded heroes and per-page files (Lanes 2–7) still need their own edits.

| # | Lane | Files | Fixes | Diff | Notes |
|--|--|--|--|--|--|
|**1**|**index.css spacing (RUNS ALONE)**|`src/index.css`|§1 mobile token override; reduce homepage `promise/what-we-print/reach/infra/certs/sustain` t-b pads to 48–64; kill `#marquee` 152px top; fix `reach` L56 & trade/stat off-centre; reduce **fulfilment** `ff-*` (101–127→~56) and **contact** `ctc-*` (96–120→~56); reduce `certs`/`process` bottom+gaps|**L**|`[OBJ]`. Biggest single win. Touches homepage + fulfilment + contact + global's `gr-section` + tokens, so it must run solo.|
|**2**|**Inner-page heroes**|`src/components/PageHero.css`|§1/§7 — cut `.ph-hero` mobile padding (127/84 → ~72/48) and tighten so heroes fill; one edit fixes about/global/pod/infra/newsroom/fulfilment/contact|**S**|`[OBJ]` values, `[TASTE]` on target fill. Very high leverage (7 routes, 1 file).|
|**3**|**Facility book mobile**|`src/components/FacilityBook.css`, `src/components/FacilityBook.jsx`|§4 — reorder so spines/hint sit **above** the spread on mobile; on spine-select `scrollIntoView` the book (fix the dead tap); bump facility body 11→15px; reconsider the spread-as-column|**M/L**|⚑`[TASTE]`. Needs owner call on the mobile metaphor (stacked cards vs. shrunk book). Highest UX pain after heroes.|
|**4**|**/about sections**|`src/pages/OurStory.css`, `src/sections/JourneyTimeline.css`|§1 — `ab-lede/tm/ab-quote/gal` pads → mobile; **close the 822px empty tail** on the pinned timeline|**M**|`[OBJ]`. JourneyTimeline is a separate file → parallel-safe.|
|**5**|**/infrastructure sections**|`src/pages/InfrastructurePage.css`|§1 — `inf-finish/inf-av/inf-tri/inf-gallery/inf-cta` 76–101 → ~56; `tb-band` off-centre|**M**|`[OBJ]`|
|**6**|**/print-on-demand**|`src/pages/PrintOnDemand.css`|§1 — `pod-build` bot 101, `pod-explore` 68→~56|**S**|`[OBJ]`|
|**7**|**Newsroom + article**|`src/pages/Newsroom.css`, `src/pages/NewsroomArticle.css`|§1 — `nr-index` pads; article top 127|**S**|`[OBJ]`|
|**8**|**Homepage section components**|`src/sections/ProcessVideo.css`, `src/sections/Cases.css`|§1 — `process` bottom 96, `projects` internal rhythm (if owned here, not index.css)|**S**|`[OBJ]`. Separate files from index.css → parallel-safe.|
|**9**|**Global-Markets spacing (JSX/Tailwind)**|`src/pages/GlobalMarkets.jsx`|§1 — `py-24` (96px) sections → add `max-md:py-12`|**S**|`[OBJ]`. JSX territory, not CSS.|
|**10**|**Button system unification**|`src/index.css` (btn classes) — **merge into Lane 1 or run after it**|§3 — one CTA scale (height/pad/fs); make primary CTAs full/near-full width on mobile; stack contact-careers pair|**M**|⚑`[TASTE]`. Button classes live in index.css → **cannot run parallel to Lane 1**; fold in or sequence.|
|**11**|**Sticky nav / orientation**|`src/components/SiteNav.*`|§6 — make the header sticky on mobile (or add an on-scroll mini-bar / back-to-top) so nav is reachable after scrolling|**S/M**|⚑`[TASTE]`. Design decision: sticky vs. hide-on-scroll-down reveal.|
|**12**|**Drawer polish**|`src/components/MobileNav.css`|§6 — tighten the dead space between links and CTA; optional divider styling|**S**|`[TASTE]`. Low priority — drawer already good.|
|**13**|**Small-body-copy sweep**|per-file (facility, index infra block, cards)|§2 — raise 11–13px bodies toward 15px|**M**|`[OBJ]`. Overlaps Lanes 1/3/5 files → **do inside those lanes**, not as a separate parallel lane.|

**Design decisions needed before writing:** Lane 3 (facility-book mobile metaphor), Lane 10 (canonical button width/scale), Lane 11 (sticky-nav behaviour). Everything else is objective and specable from the tables above.

**Suggested wave order:** Wave 1 = Lanes 1(+10,13-in-file) **solo**, with 2,3,4,5,6,7,8,9 in parallel around it (all separate files); Wave 2 = 11,12 polish.

---

## 10. Report metadata

- Every claim above cites a screenshot filename (`…/scratchpad/mob/shots/…`) and/or a computed number from `…/scratchpad/mob/json/all.{en,fr}.json`. All capture code and images live in the session scratchpad, **outside the repo** — no source file was touched.

### git status at END (`git status --porcelain`)
```
?? "FINAL ASSETS ARE HERE.zip"
?? MOBILE-RECON-2026-08-09.md
?? MOBILE-UX-RECON-2026-08-09.md   ← this report (the only addition)
?? "NEW QFP AV.mp4"
?? RECON-2026-08-09.md
?? "THE FINAL DESKTOP WEBSITE CHANGE/"
?? "WhatsApp Image 2026-07-29 at 1.12.52 PM.jpeg"
?? _assets-in/ _assets-in2/ _lane1/ … _lane7/ _recon/ _recon2/ _recon3/
?? drive-download-20260728T032950Z-1-001.zip
```
Identical to START apart from `MOBILE-UX-RECON-2026-08-09.md`. No commits made.

UNCERTAIN
