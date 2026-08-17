# MOBILE RECON — 2026-08-09

Read-only mobile audit of the **production build** (`pnpm build` → `vite preview`, port 4319).
Driven by Playwright (Chromium), iPhone-class emulation: **390×844 DPR 3, isMobile, hasTouch** primary;
**360×800** and **430×932** secondary; **844×390** for landscape. Language default EN (in-app toggle, no `/fr` routes).

**Evidence labels:** `[SHOT]` = claim verified from a screenshot I opened and read (filename given, all under the session scratchpad `…/scratchpad/shots/`). `[DOM]` = measured live via `getBoundingClientRect`/computed style/`elementFromPoint` (accurate for geometry). `[GREP]` = source read only, **unverified** at runtime. `[NET]` = network capture.

> Method note that shaped several findings: the **homepage uses Lenis smooth-scroll** (`window.__lenis`, only on `/`; inner routes use native scroll). Lenis offsets *paint* from *layout* in headless Chromium, so `element.screenshot()` and viewport `clip` shots on `/` land ~one section off. **Horizontal geometry (`scrollWidth`, element rects) is unaffected**, and `fullPage` captures are correct. Where a clean homepage visual was needed I used `window.__lenis.scrollTo` or `reducedMotion:'reduce'` (which disables Lenis entirely, per `src/lib/smooth-scroll.jsx:37`). Inner-route element/clip shots are reliable.

---

## Git status — start and end (must match apart from this report file)

**START** (`git status --short`, 18 untracked items):
```
?? "FINAL ASSETS ARE HERE.zip"
?? "NEW QFP AV.mp4"
?? RECON-2026-08-09.md
?? "THE FINAL DESKTOP WEBSITE CHANGE/"
?? "WhatsApp Image 2026-07-29 at 1.12.52 PM.jpeg"
?? _assets-in/
?? _assets-in2/
?? _lane1/
?? _lane2/
?? _lane3/
?? _lane4/
?? _lane5/
?? _lane6/
?? _lane7/
?? _recon/
?? _recon2/
?? _recon3/
?? drive-download-20260728T032950Z-1-001.zip
```
**END:** identical to the above **plus** the single new file `?? MOBILE-RECON-2026-08-09.md` (this report). No tracked files modified. All scratch scripts/screenshots live outside the repo in the session scratchpad. (Exact end-state block appended at the very bottom after the file was written.)

**Routes audited** (from `src/App.jsx`): `/`, `/about`, `/global-markets`, `/print-on-demand`, `/infrastructure`, `/newsroom`, `/newsroom/:slug` (resolved to `/newsroom/printweek-power-100-2026`), `/fulfilment`, `/contact`, `/legal/privacy`, `/legal/cookies`, `/legal/terms`, `/legal/accessibility`, and a 404 (`/this-route-does-not-exist-404`). Redirects `/educational-books`→`/#wwp-educational`, `/trade-books`→`/#wwp-trade` noted but not exercised.

---

## 1. Horizontal overflow — every route, all three widths

`documentElement.scrollWidth` vs `clientWidth`, per route per width `[DOM]`:

| Route | 360 (cw) | 390 (cw) | 430 (cw) |
|---|---|---|---|
| **/** | sw 741 → **+381** | sw 741 → **+351** | sw 741 → **+311** |
| **/about** | sw 741 → **+381** | sw 741 → **+351** | sw 741 → **+311** |
| **/infrastructure** | sw 741 → **+381** | sw 741 → **+351** | sw 741 → **+311** |
| /global-markets | 0 | 0 | 0 |
| /print-on-demand | 0 | 0 | 0 |
| /newsroom | 0 | 0 | 0 |
| /newsroom/:slug | 0 | 0 | 0 |
| /fulfilment | 0 | 0 | 0 |
| /contact | 0 | 0 | 0 |
| /legal/privacy · cookies · terms · accessibility | 0 | 0 | 0 |
| 404 | 0 | 0 | 0 |

**The scroll width is a constant 741 px at every viewport width.** The overflow therefore *shrinks* as the viewport widens (381 → 351 → 311). This is the signature of a fixed **min-content** box that ignores the viewport.

**Culprit — CONFIRMED and root-caused** (prior recon's `ARTICLE.cert-card` is correct, and I found the container that fails to clip): the **Certifications section** `SECTION.certs`.
- `[DOM]` Hiding `section.certs` drops `documentElement.scrollWidth` from **741 → 390 (−351 px)** exactly. Definitive.
- `[DOM]` The widest unclipped element is `ARTICLE.cert-card` (the last card), left 614 → **right 741** (127 px wide). It sits in `DIV.certs-inner` which reports `scrollWidth 717` inside `clientWidth 342` with **`overflow-x: visible`**.
- `[GREP]` Root cause in `src/index.css`: `.certs-viewport { overflow: visible }` (line 2866) wraps `.certs-track { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; width: 100% }` (line 2877). The comment at line 2864 literally reads *"grid layout — all 5 cards visible in one row."* There is **no mobile breakpoint** reducing the columns or turning the viewport into an `overflow-x: auto` scroller, so five `1fr` tracks can't shrink below their combined min-content (~717 px) and the section pushes the page. Same shared component (`src/sections/Certifications.jsx`) renders on `/`, `/about`, `/infrastructure` — hence exactly those three routes overflow, identically, at all three widths.
- **Red herring ruled out:** the widest elements by raw right-edge are `.ts-track` / `.ts-seq` (a country **marquee/ticker**, `transform: matrix(… -312 …)`, up to 6861 px wide). These are **clipped by an overflow ancestor and contribute 0** to document width — ignore them. A naive right-edge walk surfaces them and buries the real culprit.

`[SHOT]` `shots/390/home-full.png` (2223 px wide = 741×3 — the full-page capture itself includes the overflow strip; the Certification card row sits mid-page with a blank ~351 px band to its right). `[SHOT]` `shots/390/about-full.png`, `shots/390/infrastructure-full.png` show the same blank right band. Viewport-clipped, the fifth cert card is cut off at the right edge.

---

## 2. The Facility Book

Driven on **`/infrastructure`** (native scroll → clean interaction + screenshots; identical component to the homepage Infrastructure section). At 390 the component reports `narrowMode: true` `[DOM]`, so per `FacilityBook.jsx` the page-turn is a **crossfade, not the 3-D leaf** (`canFlip = false`), and the desktop "Turn →" cursor / click-to-turn are disabled (`turnable = false`).

**Interactions on touch — ALL WORK** `[DOM]`, `[SHOT]`:
- **Tap a book spine** (`.ib-imglabel`, tapped "Binding and Finishing") → book opens, counter shows **PAGE 01 / 10**, spine marked active. Works. `[SHOT] shots/facility/infra-opened.png`.
- **Tap the next arrow** (`.ib-nav--next`) → **PAGE 01 → 02** (a full double-page factory photo, loads fine). Works. `[SHOT] shots/facility/infra-afterarrow.png`.
- **Swipe left** on the spread (synthetic decisive horizontal touch, per the `onTouchEnd` >44 px rule) → **PAGE 02 → 03**. Works.
- **Tap the ⌂ Overview pill** → returns to the resting overview spread. Works.
- Nothing on this component requires a hover to function on touch.

**Page-turn arrows:** `[DOM]` **46 × 46 px** each (`.ib-nav--prev`, `.ib-nav--next`), at the book's outer edges — **above the 44 px floor**, reachable with a thumb. They appear only when a book is open (hidden on the resting overview). `[SHOT]` large solid-orange circles, clearly tappable.

**Spread fit / cut-off:** `[DOM]`,`[SHOT]` On mobile the layout **stacks vertically** — the open spread (photos above, facility read below) sits *above* the book stack. No horizontal clipping. The whole component is **~1444–1549 px tall (≈1.8 viewports)** but scrolls normally. Facility photos load (`intro0` stacked pair `binding-01/02.webp`, `naturalWidth 1600`, `complete:true`, **zero failed `facility-book` requests** `[NET]`). One capture showed the two top photo frames momentarily blank — that was **lazy-load timing right after the crossfade, not a missing asset** (verified).

**Text below 11 px (compliance floor) — VIOLATIONS** `[DOM]` (computed font-size, all inside the resting **Overview** spread; `[SHOT] shots/facility/infra-rest.png` shows them):
| Element | Size | Text |
|---|---|---|
| `.ib-pillar-label` ×4 | **9.0 px** | Integrated Manufacturing · Advanced Technology · Global Reach · Quality Assurance |
| `.ib-spec-sub` ×3 | **9.5 px** | "including an 8-Colour Perfector", "for hardcover book production", "featuring lamination, Spot UV…" |
| `.ib-intro-closing` | **10.0 px** | "Combined with our strategic…" |
| `.ib-hint` | **10.5 px** | "Click a book to explore each facility" |
| (overview eyebrow) | **10.5 px** | "Infrastructure" |

Once a book is open these disappear from view (only the 10.5 px hint + eyebrow persist). So the sub-11 px cluster is entirely in the overview/spec spread.

**Other:** the **⌂ Overview pill** is `[DOM]` **302 × 32 px** — width fine, **height 32 < 44** (below the touch floor). Spine tap targets are `[DOM]` **220 × 57 px** (well above the floor).

---

## 3. Every route, top to bottom (390×844)

Full-page screenshots opened and read (`shots/390/<route>-full.png`), cross-checked with the reveal test in §7 (every `[data-reveal]` fires on scroll — 0 stranded). One line each:

- **/** — `[SHOT]` OK top-to-bottom (hero → What We Print → Trust strip → markets/globe → Infrastructure/FacilityBook → **Certification (overflows, see §1)** → One Continuous Process → Responsible by Practice → Awards & Press → CTA/footer). Only breakage = the certs strip pushing the page 351 px wide.
- **/about** — `[SHOT]` OK (hero → journey cards → Mission/Vision/Values → **9-headshot leadership grid** → certs → footer). Certs strip overflows (§1). Minor: a large empty navy area sits under the hero title on mobile (hero reads sparse, not broken).
- **/global-markets** — `[SHOT]` OK, no overflow (hero → "Africa 19 countries", "India and the rest of Asia 2 countries" cards → text). Clean.
- **/print-on-demand** — `[SHOT]` OK, no overflow (builder → summary aside with "Request This Book" → Explore Categories tiles). Clean.
- **/infrastructure** — `[SHOT]` OK (hero → 300k sq ft / 3 facilities / 800+ / 75M stats → FacilityBook, works) → certs strip overflows (§1).
- **/newsroom** — `[SHOT]` OK, no overflow. Single-column article cards (image + AWARDS/PRESS badge + date + title + "READ ARTICLE →") → CTA/footer. Reflows cleanly.
- **/newsroom/printweek-power-100-2026** — `[SHOT]` OK, no overflow. Headline → byline → hero image → readable body → "Related news" cards → "← Back to Newsroom" → footer.
- **/fulfilment** — `[SHOT]` OK, no overflow (hero → "delivery is part of printing" → Kitting/Warehousing/Last-mile cards → stats 100k/In-House/5/800+/96% → "The Warehouse"). Long page, coherent.
- **/contact** — `[SHOT]` OK, no overflow. Contact tiles + enquiry form; form stacks cleanly (see §5).
- **/legal/privacy** — `[SHOT]` OK, no overflow. Long-form single-column legal text with section headings; readable.
- **/legal/cookies** — `[SHOT]` OK, no overflow. Same template; contains a 3-column table (Item / What it is for / Provider) whose "Provider" column is **tight at the right edge** ("Provid…", "Quart…" truncated within the cell) — cosmetic, no page overflow.
- **/legal/terms** — `[SHOT]` full-page captured; shares the `LegalPage` template with privacy/cookies, overflow 0. (Read at template level; see UNCERTAIN.)
- **/legal/accessibility** — `[SHOT]` OK, no overflow. Bullet list + Known limitations + Feedback; clean single column.
- **404** — `[SHOT]` OK, no overflow. Branded "ERROR 404 · OUT OF STOCK / This page is out of print." → CTA/footer.

No collapsed-to-zero sections, no stretched/squashed images, no headings clipped, nothing cut at either edge except the §1 certs overflow and the minor cookie-table tightness.

---

## 4. Touch targets and tap-only interactions

### 4a. Mobile navigation — MAJOR: there is no mobile nav menu
`[DOM]`,`[SHOT] shots/touch/header-contact-390.png` The header at 390 contains **exactly four interactive elements**: the QF logo link (48×48, → home) and the **EN / FR / ES** buttons (32×22 each). **No hamburger, no nav links, no CTA.**
- `[GREP]` `SiteNav.jsx`: the center `<nav>` is `hidden lg:flex` (hidden < 1024 px); the "Request a Quote" CTA is `hidden sm:inline-flex` (hidden < 640 px); the logo wordmark is `hidden sm:flex`. There is **no hamburger/menu button anywhere in the component**, and `SiteLayout.jsx` mounts only `<SiteNav/>` — no separate mobile-nav component exists.
- **Consequence:** from the header a mobile user can only go *home* or change language. All primary navigation depends on the footer + in-content links.

### 4b. Footer navigation — gaps
`[DOM]` Footer has **10 links**: Products (`/#what-we-print`), Global Reach/Présence mondiale (`/#projects`), Infrastructure, Contact, + 4 legal, + email/website. **Missing from all global chrome on mobile:** **About, Print-on-Demand, Newsroom, Global-Markets, Fulfilment** — those routes are reachable only via in-content links or a typed URL. (Combined with 4a, this is the site's biggest mobile UX gap.)

### 4c. Language toggle — works
`[DOM]` Tapping **FR** flips `documentElement.lang` en→fr and the hero copy to French ("Partenaire mondial…"), and **persists** across reload (i18n localStorage). `[SHOT] shots/touch/lang-fr-390.png`. Buttons **32×22 px** (below 44×44), font **12 px** (above the 11 px floor); the "/" separators are 11 px.

### 4d. WhatsApp float — occluded by the cookie banner on first load
`[DOM]`,`[SHOT] shots/touch/home-bottom-390.png` `.wa-fab` is **48×48 px** (mobile size, ≥44 ✓), fixed bottom-right at 16/16 px, `z-index 190`. But `elementFromPoint` at the fab's center returns the **cookie banner's reject button** — the cookie banner (`z-index 200`, per `CookieBanner.css`) renders **on top of / overlapping** the fab. The screenshot shows the cookie bar's Accept/Decline buttons covering the fab, with only a green sliver visible. After the cookie banner is dismissed the fab is clear.

### 4e. Interactive elements below 44×44 px `[DOM]`
Home (scoped, deduped):
| Element | Size |
|---|---|
| EN / FR / ES lang buttons | 32×22 |
| Footer text links (Contact, Products, Infrastructure, Global Reach, legal, email/web) | width varies × **17–21 h** |
| Instagram / YouTube social icons | 40×40 |
| What-We-Print carousel arrow (`.wwp-arrow`) | 40×40 |
| "See more / Voir plus" pill | 122×**42** |
| (skip-to-content link 1×1 — sr-only, ignore) | — |

Contact adds: **consent checkbox 20×20**, submit button 201×**42**, address links 51–116 × 21, form `<label>`s 272×21 (clickable). POD adds a **consent checkbox 18×18** (§5). None of these are hard blockers but several sit a few px under the floor (40, 42) and the checkboxes/lang buttons are clearly small.

### 4f. Hover-only interactions
`[GREP]`,`[DOM]` No **content** is locked behind hover on touch:
- The "What We Print" dropdown opens on `onMouseEnter`, but the whole desktop nav is hidden on mobile (moot).
- FacilityBook's turn-cursor / click-to-turn are hover/desktop only, but arrows + swipe are working touch fallbacks (§2).
- `.cert-card:hover` (lift) and various `:hover` states are decorative only.

---

## 5. Forms

### Contact (`/contact`) `[DOM]`, `[SHOT] shots/forms/contact-form.png`
- **10 controls, all stack single-column — no side-by-side, nothing squashed.** Inputs 272×51 px. Labels are properly associated (`label[for]` present for every field).
- Country / enquiry are **native `<select>`** (15 / 7 options) → OS picker on mobile, usable.
- **iOS zoom-on-focus — VIOLATION: all 8 typeable fields are 15 px < 16 px** (`first, last, email, phone, company, country, enquiry, message`). Styled by `.ctc-field input/select/textarea` in **`src/index.css:4089`**. iOS Safari will zoom the page on focus.
- Consent checkbox 20×20 (small).

### Print on Demand — "Request This Book" (`/print-on-demand`) `[DOM]`, `[SHOT] shots/forms/pod-req-form.png`
- Clicking **"Request This Book"** reveals `.pod-req` (7 controls). All **stack single-column**, labels associated.
- **iOS zoom-on-focus — VIOLATION: name / email / phone / notes are 14 px < 16 px.** Styled by `.pod-req-field input/textarea` in **`src/pages/PrintOnDemand.css:746`**. Inputs 299×43.
- **Upload control (Uploadcare):** it is **not** the Uploadcare widget — it's a **native `<input type=file>` hidden (opacity 0)** behind a visible custom dashed dropzone `.pod-upload-drop` (**299×46 px** tap target, ≥44 ✓) labelled "⬆ Choose a file", with help text "PDF, JPG, PNG or ZIP, up to 10 MB each. Three files maximum." Tapping opens the native file picker. Tap target reasonable.
- Consent checkbox 18×18 (small). Minor: in the screenshot the "I agree… these details" consent sentence runs hard to the right edge (slight visual tightness, no clipping of function).

---

## 6. Heavy media on a phone

### Assets > 1 MB in `dist` `[GREP/build]`
| Size | File | Loads on mobile? |
|---|---|---|
| 17.67 MB | `site-assets/homepage/video/facilities.mp4` | Click-to-play only (lightbox), **not** cold |
| 8.57 MB | `site-assets/about/gallery/facility-tour.mp4` | /about gallery (on demand) |
| 6.10 MB | `site-assets/about/gallery/web-press.mp4` | /about gallery (on demand) |
| 5.97 MB | `site-assets/homepage/video/how-we-work.mp4` | **Yes — cold on `/` (autoplays in view)** |
| 4.00 MB | `site-assets/about/gallery/binding-line.mp4` | /about gallery (on demand) |
| 1.82 MB | `assets/react-globe.gl-*.js` | **Yes — loads on `/` at the Projects band** |
| 1.39 MB | `earth-blue-marble.jpg` (×2 paths: homepage/globe + qfp/earth) | **Yes — globe texture on `/`** |
| 1.11 MB | `qfp/hero/sfx/keyboard-typing.wav` | Partially (hero SFX) |
| 1.09 MB | `assets/index-*.js` | Yes (main bundle) |
| 1.01 MB | `assets/maplibre-gl-*.js` | **No — gated off on mobile** |

### Cold homepage load `[NET]`
`~8.1 MB` transferred to `load` + 4 s settle (**floor** — JS/CSS lacked `content-length` in `vite preview` responses, so the real number is higher). Breakdown: **video/mp4 6,113 KB** (`how-we-work.mp4`), image/webp 1,827 KB, audio/wav 124 KB (hero typing SFX, partial), fonts 108 KB. A **full scroll** additionally pulls the globe chunk **1.82 MB + earth texture 1.39 MB + earth-topology.png**, so a complete homepage view on a phone is **≈11–12 MB+**.

### Globe (`react-globe.gl`) — renders on mobile, NOT gated
`[DOM]`,`[NET]`,`[SHOT] shots/media/globe-reduced.png` Scrolling to the "Global Reach / Worldwide Deliveries" (Projects) band mounts a **live WebGL globe**: `canvas 342×342, hasGL:true`, and the network pulls `react-globe.gl-*.js` (1.82 MB) + `earth-blue-marble.jpg` (1.39 MB) + `earth-topology.png` + `worldmap-dots.webp`. The screenshot shows a correctly rendered photoreal Earth with orange delivery arcs from India. `[GREP]` `Globe3D.jsx` gates only on `hasWebGL()` + proximity IO — **no mobile opt-out**, so phones download and run the full globe.

### MapLibre — does NOT load on mobile (correct)
`[DOM]`,`[GREP]` `.maplibregl-map` absent on `/` and `/global-markets`; `GlobeFlyTo.jsx:18,129` renders a static `worldmap-dots` fallback and *never imports maplibre* below 901 px. The 1.01 MB chunk is not fetched on mobile. ✓

### Autoplay AV
`[DOM]` `how-we-work.mp4` (6 MB) is `autoplay muted loop` and **does autoplay when scrolled into view** (`paused:false, currentTime 3.32`). The corporate AV `facilities.mp4` (17 MB) is **click-to-play in a lightbox** ("VIDEO · INSIDE OUR FACILITIES" play button) — it does not autoload.

---

## 7. The ScrollTrigger landmine on mobile — DOES NOT REPRODUCE

Method: fresh homepage load (mounts `SmoothScrollProvider` + Lenis), then **client-side SPA navigation** (`history.pushState` + `popstate` → React Router transitions, homepage unmounts and runs `ScrollTrigger.killAll()`), then measure on the incoming page. A `window.__spaProbe` flag confirmed the nav was client-side (survived, no reload). `[DOM]`

| Route (via SPA from home) | `[data-reveal]:not(.is-in)` | tall hidden (>150px, opacity<0.05) | main text len | crash | vs fresh deep-link control |
|---|---|---|---|---|---|
| /about | 21/24 | 15 | 11216 | no | **identical** 21/24, 15 |
| /global-markets | 8/11 | 6 | 1855 | no | **identical** 8/11, 6 |
| /print-on-demand | 9/11 | 9 | 1593 | no | **identical** 9/11, 9 |
| /infrastructure | 0/1 | 0 | 6867 | no | identical |
| /newsroom | 5/8 | 5 | 1944 | no | identical |
| /fulfilment | 0/3 | 0 | 3794 | no | identical |
| /contact | 0/3 | 0 | 4066 | no | identical |

- **SPA-from-home === fresh deep-link** for every route. No SPA-specific stranding.
- **No crash, no blanking** — `mainTextLen` healthy everywhere (app content present).
- The non-zero "hidden" counts are ordinary **reveal-on-scroll below the fold**: scrolling fully through each route drops them to **0/N reveals hidden and 0 tall-hidden** on about, global-markets, print-on-demand, newsroom `[DOM]`. Reveals fire correctly.

The known `killAll()` regression is not present in this build; the prior smooth-scroll/Option-A fixes are holding.

---

## 8. Landscape (844×390) — quick pass

`[DOM]` **Zero horizontal overflow on every route** (the certs grid's 741 px min-content fits inside 844, so §1 is **portrait-only**). One line each:
- **/** — `[SHOT] shots/landscape/home-hero-vp.png` Hero headline ("AN INTEGRATED GLOBAL BOOK / MANUFACTURING AND…") is **oversized for the 390 px-tall viewport — the last line is cut / hidden behind the cookie banner** (cosmetic; scrolls). At 844 the header now shows "Request a Quote" (≥640 breakpoint) but still **no nav links** (<1024).
- **/infrastructure** — `[SHOT] shots/landscape/infra-facility-vp.png` FacilityBook overview card renders cleanly within margins; cookie banner overlaps the bottom (expected).
- **/about, /global-markets, /print-on-demand, /newsroom, /newsroom/:slug, /fulfilment, /contact, /legal/*, 404** — full-page captured, no overflow, layouts hold.
- Cross-cutting: the **cookie banner occupies a large share of the short landscape viewport**, and any 100vh-ish hero is cramped vertically — content is reachable by scrolling, nothing structurally broken.

---

## 9. Lane estimate (the plan)

Findings grouped into **work lanes by file territory** (non-overlapping file sets → parallel-safe). The one hard collision file is **`src/index.css`**; I verified the Contact form's input styling also lives there (`.ctc-field`, line 4089), so it is folded into the index.css lane rather than a separate one. `home.json` is **not** required by any lane below (all fixes are CSS/component structure, not content) — flag if any lane starts editing content.

| # | Lane | Files it touches | Findings it fixes | Difficulty | Collision |
|---|---|---|---|---|---|
| **1** | **Shared CSS layer** | `src/index.css` (`.certs-*` ~2759–2986; `.ctc-field` ~4089) + `src/sections/Certifications.jsx` | §1 certs overflow on /, /about, /infra at **all widths**; §5 Contact inputs 15px→16px (iOS zoom) | moderate (certs breakpoint) | **⚠️ index.css — MUST run alone; blocks all others** |
| **2** | **FacilityBook mobile** | `src/components/FacilityBook.css` (+ `.jsx`) | §2 sub-11px text (pillar 9, spec-sub 9.5, hint/closing 10–10.5); overview-pill 32px→≥44 | trivial–moderate | isolated |
| **3** | **Mobile navigation** | `src/components/SiteNav.jsx` + new `MobileNav` + `src/components/SiteLayout.jsx` | §4a no mobile menu (add hamburger/drawer) | **risky** (net-new component) | isolated |
| **4** | **Footer completeness + tap targets** | `src/sections/CTAFooter.jsx` (+ its CSS) | §4b missing footer links (About/POD/Newsroom/Global-Markets/Fulfilment); §4e footer link + social (40px) tap sizes | trivial–moderate | isolated |
| **5** | **Floating chrome overlap + small controls** | `src/components/FloatingWhatsApp.css`, `src/components/CookieBanner.css`, `src/components/LanguageToggle.jsx` | §4d WhatsApp↔cookie z-index overlap; §4c/§4e lang-toggle tap size | trivial | isolated |
| **6** | **POD form** | `src/pages/PrintOnDemand.css` (+ `.jsx`) | §5 POD inputs 14px→16px; consent checkbox size; consent-text right-edge tightness | trivial | isolated |
| **7** | **Media weight (discretionary — needs client sign-off)** | `src/components/Globe3D.jsx`; homepage video preload | §6 globe 1.82MB JS + 1.39MB texture on mobile; `how-we-work.mp4` 6 MB cold autoload | moderate–risky (visual/perf trade-off) | isolated |

**Total: 7 lanes.**

**Run order:**
1. **Lane 1 first, alone** (it owns the collision file `index.css` and fixes the single most visible bug — the 351 px overflow).
2. Then **Lanes 2, 3, 4, 5, 6 in parallel** — their file sets are mutually exclusive and none touches `index.css`.
3. **Lane 7 last / on approval** — it changes what renders on mobile (globe, autoplay video) and is a product decision, not a pure bug-fix.

Landscape (§8), the cookie-table tightness (§3), and the /about hero empty-space (§3) are cosmetic and can ride along in Lane 1 (index.css) or Lane 5 as capacity allows; none is a standalone lane.

---

## 10. UNCERTAIN — what I could not fully determine, and why

- **Clean homepage viewport screenshots** — Lenis offsets paint from layout in headless Chromium, so homepage `element.screenshot`/`clip` shots land ~one section off (this is a *test-harness* artifact, **not a site bug**). I worked around it with `window.__lenis.scrollTo` and `reducedMotion` for the globe, and all homepage **geometry** (overflow, sizes) was measured via `getBoundingClientRect`, which is unaffected. But a couple of homepage region shots (e.g. `shots/touch/header-390.png`, `shots/media/home-projects.png`) captured the wrong band; I re-shot the ones that mattered on inner routes or under reduced-motion.
- **Cold-load byte total (§6)** is a **floor (~8.1 MB)** — `vite preview` responses for JS/CSS omitted `content-length`, so those bytes aren't counted. The real transfer is higher; the ranking of offenders (video, then webp, then globe) is reliable.
- **/legal/terms (§3)** — I read privacy, cookies, and accessibility full-page in detail; terms shares the identical `LegalPage` component and shows `overflow 0` at all widths, so I inferred it renders the same. I did not read its screenshot line-by-line.
- **Real iOS Safari behaviour** — the 15/14 px input finding predicts zoom-on-focus by the well-known <16 px rule; I measured font sizes in Chromium mobile emulation, not on a physical iPhone. Same for the WhatsApp/cookie overlap after real-device safe-area insets.
- **Touch-target dedupe (§4e)** — my dedupe is heuristic (tag+label+size); a few footer links may be the same visual control counted once. Sizes are exact; the list is representative, not guaranteed exhaustive.
- **`window.innerHeight` reported 1604** under isMobile emulation despite a 844 viewport — a Chromium mobile-emulation quirk; I relied on the configured 390×844 viewport and element rects, not that value, so it did not affect any measurement.
- **Video/globe on very low-end devices** — I confirmed they *render/autoplay* on emulated iPhone-class hardware; actual fps/thermal behaviour on a low-end Android was not measured.
