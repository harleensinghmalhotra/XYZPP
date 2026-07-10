# QFP Phase 2 — State of the World (Inner Pages)

**Mission:** Deep read-only recon before building inner pages. No code was changed, nothing committed.
**Date:** 2026-07-10 · **Repo:** `d:\WEBSITES\Website University` · **Branch:** `main`
**Homepage status:** Healthy (see §8). **Routing status:** None yet — single-page scroll site.

> This is a state-of-the-world, not a design. No page designs are proposed here. The final section lists the proposed page set, reuse map, routing proposal, risks, and open questions for Harry.

---

## 1. REPO MAP + App.jsx STACK

### 1.1 Top-level (node_modules omitted)
```
Website University/
├── index.html                     # single mount point (#root)
├── src/
│   ├── main.jsx                   # ReactDOM.createRoot(#root) → <App/> (StrictMode). No router.
│   ├── App.jsx                    # THE stack (see 1.2)
│   ├── index.css                  # 2508 lines — global tokens + ALL section CSS (except Cases)
│   ├── components/
│   │   ├── SiteNav.jsx            # fixed nav, theme-flipping (see §2.2)
│   │   ├── CountUp.jsx            # IO-triggered counter
│   │   ├── VideoBackdrop.jsx      # ambient on-screen video
│   │   ├── WavyBackground.jsx     # simplex-noise canvas (Promise bg)
│   │   └── craft.jsx              # print primitives (RegistrationMark, Label, CalibrationBar)
│   ├── lib/
│   │   ├── smooth-scroll.jsx      # SmoothScrollProvider (Lenis + GSAP ticker + ScrollTrigger)
│   │   ├── useReducedMotion.js    # useReducedMotion() / prefersReduced()
│   │   ├── useImageSequence.js    # canvas frame scrubber (currently unused)
│   │   └── assets.js              # legacy asset registry (Alternativ/@assets media)
│   └── sections/                  # 13 live + 2 unused (Quote, PrintingServices)
│       ├── Hero.jsx  TrustStrips.jsx  WhatWePrint.jsx  Promise.jsx  Process.jsx
│       ├── Projects.jsx  Infrastructure.jsx  Certifications.jsx  Marquee.jsx
│       ├── Sustainability.jsx  Awards.jsx  Cases.jsx  CTAFooter.jsx
│       ├── Cases.css              # only section with its own CSS file
│       └── Quote.jsx  PrintingServices.jsx   (UNUSED — not imported by App)
├── public/
│   ├── qfp/                       # production assets (see §7)
│   ├── alternativ/                # reference-site icons (nav lang/menu SVGs)
│   └── fonts/                     # Metrisch-Book/Medium/Bold.otf (self-hosted)
├── recon/                         # this recon + prior section specs (see §5)
├── scripts/                       # ~70 one-off .mjs recon/verify/asset scripts (git-untracked)
├── shots/recon-phase2/            # health-check screenshots (this mission, §8)
├── tailwind.config.js  vite.config.js  postcss.config.js
├── EKTA DOCS live at → D:\WEBSITES\QFP\EKTA DOCS\   (client source, outside repo)
└── dist/  (last build)  ·  loook.html / Claude Design/ / design/ (scratch)
```

### 1.2 App.jsx render order (the homepage stack)
`App.jsx` wraps everything in `<SmoothScrollProvider>` → skip-link → `<SiteNav/>` → `<main id="main" style={--video-tone:#2d2926}>` containing, in order:

| # | Component | File | `id` | `data-theme` | Scroll-jacked | Props / toggles |
|---|-----------|------|------|-------------|---------------|-----------------|
| 1 | Hero | `sections/Hero.jsx` | `#hero` | dark | **YES — 250vh GSAP pin + scrub** | none (module `CUTOUTS`) |
| 2 | TrustStrips | `sections/TrustStrips.jsx` | `#trust` | **none** ⚠ | no (WAAPI marquee + CountUp) | none (hardcodes COUNTRIES/INSTITUTIONS/STATS) |
| 3 | WhatWePrint | `sections/WhatWePrint.jsx` | `#services` | light | **YES — sticky horizontal scroll-jack (≥901px)** | none (hardcodes 8 CARDS) |
| 4 | Promise | `sections/Promise.jsx` | `#promise` | dark | scrubbed reveal (no pin) | none (SEGMENTS) |
| 5 | Process | `sections/Process.jsx` | `#process` | light | scrubbed reveal (no pin) | none (6 STAGES) |
| 6 | Projects | `sections/Projects.jsx` | `#projects` | dark | reveal `once` + cobe globe | **`SHOW_RESTRICTED_CLIENTS`, `?hideRestricted`, row `restricted`** |
| 7 | Infrastructure | `sections/Infrastructure.jsx` | `#infrastructure` | light | reveal `once` + video dialog | **`VIDEO_READY=false`, `VIDEO_SRC`** |
| 8 | Certifications | `sections/Certifications.jsx` | `#certifications` | light | reveal + JS carousel | FSC `code:'TUVDC-COC-101258'` (compliance) |
| 9 | Marquee | `sections/Marquee.jsx` | `#marquee` | dark | CSS keyframe marquee | none (TERMS); top curve catches Hero book landing |
| 10 | Sustainability | `sections/Sustainability.jsx` | `#sustainability` | light | reveal `once` | none (BULLETS/CHIPS) |
| 11 | Awards | `sections/Awards.jsx` | `#awards` | dark | reveal `once` stagger | none (4 CARDS) |
| 12 | Cases | `sections/Cases.jsx` | `#cases` | dark (inner hdr light) | **no GSAP** — useState accordion | none (3 CASES) |
| 13 | CTAFooter | `sections/CTAFooter.jsx` | `#contact` | dark | static | none (inline contact data) |

**Only two components are welded to the scroll engine: Hero (250vh pin) and WhatWePrint (sticky horizontal pin).** Everything else uses entrance-only reveals or no JS, so it lifts onto inner pages freely.

---

## 2. ROUTING AUDIT

### 2.1 Does any routing exist? — **NO.**
- `grep` for `react-router | createBrowserRouter | useNavigate | Routes | Route` across `src/` → **zero matches.**
- No router in `package.json` dependencies (`cobe, gsap, lenis, motion, react, react-dom` only).
- `main.jsx` renders `<App/>` directly. There is exactly one page. Navigation today is **in-page hash anchors only.**

### 2.2 Current nav links (SiteNav.jsx) and where they point
```
Logo        → #top        (exists — <span id="top"/> in App)
Our expertise → #expertise (⚠ NO such element — dead anchor)
Our approach  → #approach  (⚠ NO such element — dead anchor)
About us      → #about     (⚠ NO such element — dead anchor)
Ask for a quote → #quote   (⚠ NO such element — dead anchor)
Language (En) → #lang      (⚠ placeholder)
Menu          → #menu      (⚠ placeholder)
```
**Finding:** the nav labels are Alternativ-reference placeholders. The real section IDs are `#hero #trust #services #promise #process #projects #infrastructure #certifications #marquee #sustainability #awards #cases #contact`. The nav does **not** currently link to any of them — it is decorative. This is good news for Phase 2: rewiring the nav for real routes touches nothing load-bearing.

### 2.3 Recommended routing approach (does NOT touch the homepage scroll engine)
The hard constraint: `SmoothScrollProvider` boots one Lenis instance + one GSAP ticker + ScrollTrigger, and Hero/WhatWePrint register **pins** against document scroll. A naive router that keeps `SmoothScrollProvider` mounted across all routes would leave stale pins/ScrollTriggers on inner pages and fight native scroll.

**Recommendation — `react-router-dom` v6, scroll engine scoped to the homepage route only:**

1. `main.jsx`: wrap `<App/>` in `<BrowserRouter>`. `App.jsx` becomes a `<Routes>` host, **not** the scroll stack.
2. Introduce a shared **`<SiteLayout>`** = `<SiteNav/>` + `<Outlet/>` + `<CTAFooter/>` (footer is already the site-wide footer). SiteNav stays fixed and keeps its `data-theme` IntersectionObserver — it works on any page.
3. Route `/` (index) → a `<Home>` component that contains **exactly today's stack** (`SmoothScrollProvider` + the 13 sections). The pin engine lives **inside this route only** and unmounts on navigation away — Lenis `destroy()` + ScrollTrigger cleanup already run in the provider's `useEffect` return, so leaving the route tears the engine down cleanly.
4. Inner routes render **without** `SmoothScrollProvider` → native scroll. If we want smooth scroll on inner pages later, mount a *separate, pin-free* Lenis in the inner layout; do not share the homepage instance.
5. Add `<ScrollRestoration>` (or a `useEffect` scroll-to-top on `pathname` change) so inner-page navigation starts at the top.
6. Rewrite SiteNav's dead anchors into `<Link>`s (About, Our Story, etc.). On the homepage, keep hash links to sections; on inner pages they become route links. A small `useLocation` check lets a link be `/#services` (jump home + scroll) vs `/global-markets` (route).

**Net effect:** the homepage scroll engine is byte-for-byte unchanged and simply becomes the index route. Pins never see an inner page. Adding a page = adding a `<Route>` under `<SiteLayout>`. This is the lowest-risk path and needs only one new dependency.

*(Alternative considered: file-based routing via a meta-framework (Next/Remix) — rejected. It would require porting the Vite/Lenis/GSAP setup and offers no benefit for a ~10-page marketing site. Stay on Vite + react-router.)*

---

## 3. DESIGN SYSTEM EXTRACT (from code)

> **Headline finding: the codebase runs TWO parallel design systems.** Inner pages must be built on the *brand* system, not the experimental one.

### 3.1 System A — Experimental "print-craft" (Tailwind config + `:root`)
Used by the **Hero** and legacy/unused sections. This is the Alternativ-reference layer.
- Colors: CMYK process — `--cyan #00AEEF`, `--magenta #EC008C`, `--yellow #FFC800`; warm ink ramp `#16130F→#7A7061`; warm paper ramp `#F3EDE1 / #EDE6D7 / #E7DFCD / #DED4BE`; `--video-tone #2D2926`. `::selection` = magenta. `color-scheme: dark`.
- Fonts: `display` Bricolage Grotesque · `serif` Libre Bodoni · `mono` Space Mono · `metrisch` Metrisch (self-hosted otf, hero nav typeface).
- Type scale: `display-xl/l/m` clamp() headings; `letter-spacing.label 0.28em`; `maxWidth.page 1600px`.
- **This palette/fonts do NOT match the brand brief and should NOT seed inner pages.**

### 3.2 System B — Official QFP brand (used by TrustStrips → CTAFooter)
Everything from section 2 down is already built to the brand brief and to compliance. **This is the inner-page system.**

| Token | Hex | Role |
|-------|-----|------|
| Navy | `#0F2444` | primary brand, headlines, dark sections, nav solid `#0f2444/70` |
| Navy-2 | `#1B3A6B` / `#12294C` | gradient/placeholder stops |
| Gold | `#9B7420` | accent, borders, foil stop |
| Gold-2 | `#C89A3C` | brighter gold accent, numbers, pulses |
| Gold-text | `#836013` | AA-safe gold for small text/eyebrows on cream |
| Deep gold | `#5E4610` | foil bottom stop |
| Olive | `#6B7A2A` (+ `#5C6B1E/#4F5C17/#3A4413`) | sustainability, WhatsApp |
| Cream | `#FDFAF4` | primary background, text on dark |
| Cream-2 | `#F0EBE0` | section backgrounds (WhatWePrint, Infra) |
| Strip greys | `#EFEDE8 / #E5E2DA` | trust-strip rows |
| Ink | `#1C2019` | body text on light |
| Tone | `#2D2926` | sampled hero-video tone |

**Fonts (brand):** Inter Tight (600–800 headings/names), Inter (400 body, lh 1.6), DM Mono (400–500 eyebrows/labels/codes). **Accent-only:** `Great Vibes` cursive — sanctioned for the single "Global Reach" eyebrow (`.proj-eyebrow-script`, gold-2, ~24px) and *nowhere else*.

**Foil gradients (exact):**
- Hero ledger number (cream→gold): `linear-gradient(180deg, #fdfaf4 0%, #f0cd82 58%, #c89a3c 100%)` + drop-shadow bloom `drop-shadow(0 2px 3px rgba(0,0,0,.5)) drop-shadow(0 0 26px rgba(200,154,60,.28)) drop-shadow(0 0 64px rgba(200,154,60,.14))`.
- Infra "600+" foil: `linear-gradient(180deg, #9b7420 0%, #836013 56%, #5e4610 100%)`.
- Awards name foil: `linear-gradient(175deg, #f1d397 0%, #e8c275 30%, #be8f36 68%, #9b7420 100%)`.
- CTAFooter pill: `linear-gradient(90deg, #9b7420, #c89a3c 55%, #e6bd6a)`.
- **Rule (from code comment):** foil is reserved for the hero stat + those two clip-text foils only — foil makes digits transparent and axe can't contrast-check them, so row/body numbers keep solid gold `#C89A3C` (5.3:1 on navy).

### 3.3 Compliance already baked into System B
- **11px DM Mono floor** enforced on real-info labels (ts-stat-lbl 11px, eyebrows 12px). Gold-on-cream handled via `#836013` and the "large-text ≥18.66px" carve-out (`.ts-stat-accent`), ledger-desc ≈4.7:1 on navy.
- **Sub-11px violations found (both `aria-hidden` decoration, still flag):** `.aw-clip-date` = **9px** (index.css:2461, the faux Forbes clipping date) and `CalibrationBar` labels = **9px** (`craft.jsx:53`, CMYK strip, only when `withLabels`). Legacy `.label` = 0.72rem ≈ 11.5px (Space Mono, used by craft/Quote).

### 3.4 Shared/reusable components (page seeds)
| Component | Purpose | Reusable? |
|-----------|---------|-----------|
| `CountUp.jsx` | IO 0→value counter, CLS-safe, reduced-motion aware | ✅ generic |
| `VideoBackdrop.jsx` | on-screen-only ambient video | ✅ generic |
| `WavyBackground.jsx` | simplex-noise canvas (brand navy/gold) | ✅ portable |
| `craft.jsx` | RegistrationMark / Label / SectionTag / CalibrationBar | ✅ but Label/CalibrationBar use legacy `.label`/9px — refresh before reuse |
| `useReducedMotion.js` | motion source of truth | ✅ every section depends on it |
| `useImageSequence.js` | canvas frame scrubber | ✅ but currently unused |
| `assets.js` | legacy Alternativ/@assets registry | ⚠ homepage/Hero only; inner pages use `/qfp/*` public paths |

**Homepage-locked (do NOT reuse as-is):** `Hero.jsx` (250vh pin + Alternativ book assets), `PrintingServices.jsx` (Alternativ content, superseded, delete-candidate), `Quote.jsx` (legacy motion/Space Mono/off-palette).

---

## 4. CLIENT DOCS — Compliance + Content Law

Source: `D:\WEBSITES\QFP\EKTA DOCS\QFP Compliance Checklist.docx` + `QFP Brand Content SEO Brief.docx` (both read in full). The homepage HTML (`qfp-homepage-v17.html`) is the single visual source of truth; legal drafts need counsel review before launch.

### 4.1 Compliance rules (must carry into every inner page)
- **Accessibility:** build to **WCAG 2.1 AA** (2.2 where possible) for all markets (US ADA, UK Equality Act, India RPD/GIGW, Africa tenders). B2B is not exempt.
  - Contrast: gold `#9B7420` on cream must hit **4.5:1** for body text (darken or enlarge where it fails).
  - **DM Mono ≥ 11px** for any label carrying real information (≈9.5px was flagged as the original violation).
  - Every interactive element: visible focus + logical tab order. Every image: meaningful alt (incl. cert logos, product photos). Baked-in-image text must exist as real HTML/aria. Video needs **captions + transcript**. One H1/page, logical headings, labelled form inputs, announced errors.
  - Test: axe/WAVE + one keyboard pass + one screen-reader (NVDA) pass before launch.
- **Privacy/Data:** one privacy policy written to the strictest regime (UK GDPR + PIPEDA + CCPA, aligned to India DPDP 2023) covers all five markets.
  - Cookie banner **only if** non-essential cookies (GA counts); Accept/Reject **equal prominence**; per-cookie list. Cleanest option: launch cookieless and drop the banner. Decide before build.
  - Contact form: **unticked** consent checkbox referencing the Privacy Policy + clear data-use statement + a `privacy@`/`info@` contact.
- **Marketing claims:** every public number (400M+ books, 98% on-time, 1B+ lives, 700+ containers) needs an internal substantiation note or gets softened. No unqualified "eco/sustainable" absolutes — list specific practices. **QFP is never framed as a sustainability company.**
- **FSC trademark:** off-product FSC logo use (website) needs a **promotional licence** + the **licence code shown near the mark**. QFP code: **TUVDC COC 101258** (code already wired into `Certifications.jsx` as `TUVDC-COC-101258` — verify hyphen/format + licence covers web).
- **Client names / testimonials (CRITICAL):** names/logos (**HDFC, ZEE Learn/Kidzee, ministries**) need **confirmed written permission before display**; testimonials must be genuine + attributed + permissioned. If not ready by launch → **hide the section** (do not placeholder). *(Code already gates HDFC/ZEE behind `SHOW_RESTRICTED_CLIENTS` in Projects.jsx and lists them in TrustStrips.)*
- **Footer/trust (every page):** registered entity **Quarterfold Printabilities Private Limited, CIN U74999MH2020PTC337494**, registered office **Office No 1207, Plot No 4 & 6, Sector 30A, Navi Mumbai, Maharashtra 400705**; HTTPS/modern TLS, no mixed content; downloadable company profile PDF; cert copies on request.
- **Four legal pages, footer-linked on every page:** Privacy Policy · Cookie Policy · Accessibility Statement · Terms of Use. Skeletons/verbatim drafts are in the checklist §7 (governing law = India). Accessibility Statement draft copy is provided verbatim.

### 4.2 Content / brand law
- **Palette closed set:** navy `#0F2444`, gold `#9B7420`, olive `#6B7A2A`, cream `#FDFAF4`, ink `#1C2019`. No colours outside it. **No yellow. No dashes in copy — use commas.**
- **Fonts closed set:** Inter Tight (400,500,600,700,800), Inter (400,500,600,700), DM Mono (400,500). Same Google import on every page.
- **Tone:** confident + specific, never boastful; real numbers over superlatives; positive framing only; plain international English; figures in M/B.
- **SEO per page:** unique title (<60 chars) + meta description (<155 chars); one real-markup H1/page; clean URLs (`/global-markets`); WebP images w/ alt; schema (Organization home, Article newsroom, BreadcrumbList inner); LCP <2.5s, home <3s; sitemap.xml + robots.txt; responsive on **all** pages. Full per-page title/meta/H1/keyword table lives in the brief §6 (Home, Our Story, Founder, Global Markets, Case Studies, Newsroom, Careers, Contact).

### 4.3 ⚠ Structure conflict to resolve with Ekta
The **brief's site map is company-centric** — Our Story, The Founder, Global Markets, Case Studies, Newsroom, Careers, Contact + 4 legal. It does **not** define standalone product pages (educational-books, trade-books, print-on-demand, fulfilment, infrastructure) — those appear as *content themes* (the 8 product categories, 5 pillars). **The live site (§6) IS organised as product/portfolio pages.** These two IA models must be reconciled before building (see Open Questions).

---

## 5. EKTA + RECON FOLDER — provided content & gaps

### 5.1 EKTA DOCS (`D:\WEBSITES\QFP\EKTA DOCS\`)
Only 3 files: the two `.docx` (§4) + **`qfp-homepage-v17.html`** (~5MB). The HTML is Ekta's **full single-file HOMEPAGE design reference** (all CSS inlined, 21 base64 images, Organization JSON-LD, canonical brand tokens). **It is homepage-only — it contains no inner-page bodies**, only section teasers that touch inner-page topics.

### 5.2 recon/ folder (repo)
- **QFP section SPECs (substantive inner-page-relevant content):**
  - `what-we-print/SPEC.md` + `CARD-RECON.md` — verbatim copy for all **8 product categories** (subtitle + 4 bullets each) + asset-extraction table. Diagnoses Harry's 8 product photos as **opaque white-bg renders, not alpha cutouts** (cards 03/04/08 damaged); **true PNG-alpha exports needed from Harry**.
  - `next-three/SPEC.md` — Global Projects (copy final, asset-ready), Infrastructure (**mostly placeholder**, needs facility/people photos + video), Certifications. Flags FSC-code + client-permission blockers.
  - `process-pressline/SPEC.md` — press-line animation design concept.
  - `quote/SPEC.md` — "Your mission is education" mission band copy + CSS.
  - `qfp-assets/` — 17 extracted homepage source images.
- **Reference-study recon (NOT inner-page):** `alternativ/`, `co-review/`, `final-2/`, `walkthrough/` — Alternativ hero teardown at 1536×743 (blueprints, frames, forensic compares).
- **`qfp-live-pages/`** — populated by THIS mission (§6).

### 5.3 Inner-page content: EXISTS vs MISSING
**Exists (as homepage-derived seed copy):** educational/trade/POD category names + bullets; global-reach copy + world-map asset; partial infrastructure card copy.
**GAPS (must be sourced):**
1. **About / Our Story** — no body, no history/timeline, no team/leadership copy (brief §5.1/5.2 give the narrative outline; needs finalising).
2. **Educational Books / Trade Books / Print-on-Demand inner pages** — only card-level bullets, no long-form page copy.
3. **Infrastructure inner page** — thin copy + **needs 3 facility photos, 4 "Our People" photos, 1 walkthrough video (captioned) from Harry**.
4. **Fulfilment inner page** — essentially missing (only homepage fragments + live-site copy from §6).
5. **Legal pages** — no drafts anywhere except the checklist skeletons; need counsel-reviewed copy.
6. **Carried compliance blockers:** FSC licence-code confirmation; HDFC/ZEE/Kidzee/ministry name permissions.

---

## 6. LIVE SITE SCRAPE (quarterfoldltd.com)

Saved raw to `recon/qfp-live-pages/`: `about-us.md`, `educational-books.md`, `infrastructure.md`, `trade-books.md`, `print-on-demand.md`, `fulfilment.md`, `homepage.md`, `footer-contact.md`. All 7 pages loaded (no 404s).

### 6.1 Footer contact — THIS IS THE CONTACT PAGE SOURCE (no contact page / newsroom exists live)
- **Emails:** info@quarterfoldltd.com · enquiry@quarterfoldltd.com
- **Phone:** (+91) 829 199 9922 (aka 082919 99922)
- **Head Office:** 1207, Cyber One IT Park, Sector 30 A, Vashi, Navi Mumbai 400703, INDIA
- **Main Factory:** Plot No. B-8, Taloja MIDC, Navi Mumbai 410208, INDIA
- **Social:** Facebook, Twitter, YouTube, Envato · © 2025-2026 Quarterfold Printabilities
- ⚠ **Address mismatch to reconcile:** the compliance-brief registered office (Sector 30A, Plot 4&6, **400705**) differs from the live footer Head Office (Cyber One, **400703**). Registered office (CIN filing) vs operating office — footer must show the **registered** entity/address per compliance, and may additionally show the operating office.

### 6.2 Homepage "Highlights" (for reuse)
- **Stats:** 150+ clients · 5 facilities / 2,50,000 sq ft · 25M+ books/yr · 800+ containers/yr to 25+ countries.
- **Awards (8):** Dun & Bradstreet, Print Week (multiple), Govt. of India / CAPEXIL (highest book exporter, consecutive), ASSOCHAM, Federation of Indian Publishers, FORBES D-GEMS, Education Export Company of the Year 2024. *(Reconcile with brief's award list §5.5.)*
- **Milestones (8):** Tanzania 10M+, Nigeria UBEC 8M, Ghana USAID, DR Congo (5M live vs 3.5M About page), HDFC (3M live vs 1.3M/mo About), Ivory Coast, Maharashtra Bal Bharti, etc.
- **Vision:** "one of India's largest Print and Publishing Solutions Company" positioning; taglines Quality-Obsessed / Service-Driven / Always-Curious.

### 6.3 Per-portfolio-page content (seeds for inner pages)
- **About Us:** "India's largest Print and Publishing Solutions Company", 3 Taloja presses + 2 warehouses, 250,000 sq ft, notable-projects list w/ volumes.
- **Educational Books:** 250+ publishers, World Bank / USAID partner, 10-country Africa list, 4 consecutive export awards, 800 containers/yr, top-30 Indian publishers.
- **Infrastructure:** 4 print facilities + 2 warehouses; 20-web tower, 5 sheet-fed, 3 Lineomatic machines.
- **Trade Books:** premium notebooks, coffee-table, diaries (hard/soft/leather), calendars, autobiographies, novels.
- **Print on Demand:** self-publishers/indie, samples, short-runs, single-book.
- **Fulfilment:** kitting & assembly, 100,000 sq ft warehouse, storage/logistics/last-mile, in-house corrugated & e-flute cartons, 5-colour printing.

### 6.4 Client/entity names on the live site (permission-gate list)
Govt/institutional: Ministry of Education Tanzania · UBEC Nigeria · Min. Éducation Nationale Ivory Coast · DR Congo · Min. Education & Sports Ghana · Maharashtra State Board (Bal Bharti) · World Bank · USAID.
Corporate: **HDFC Bank** (loan-agreement booklets). Publishers: "top 10/30 Indian publishers" (unnamed).
⚠ **Data-consistency flags** across live pages (reconcile before publishing): facility count (3 vs 5), DR Congo volume (3.5M vs 5M), HDFC volume (1.3M/mo vs 3M).

---

## 7. ASSET INVENTORY — `public/qfp/**`

21 files, 5 folders + 1 root. Raster = `.webp`; logos = `.png`. No SVG. Naming: lowercase, hyphen, zero-padded 2-digit sequences.

| Folder | Count | Files | Status |
|--------|-------|-------|--------|
| `brand/` | 3 | `qflo.png`, `qfp-logo.png`, `qfp-logo-light.png` (`-light`=dark-bg) | ✅ real |
| `products/` | 8 | `product-01.webp` … `product-08.webp` (1:1 w/ WhatWePrint cards) | ⚠ **placeholder-quality** — opaque white-bg renders; 03/04/08 damaged. **Harry: true PNG-alpha cutouts.** 01/02/05/06/07 usable. |
| `cases/` | 3 | `case-01…03.webp` | ✅ present; content is teaser-level |
| `certs/` | 3 | `fsc.webp`, `iso.webp`, `sedex.webp` | ✅ real; FSC needs licence-code render (compliance, not asset) |
| `regions/` | 3 | `region-africa/asia/europe.webp` | ⚠ **no Americas region asset** (gap if Americas is featured) |
| *(root)* | 1 | `worldmap-dots.webp` | ✅ real (Global Projects bg) |

**No inner-page asset folders exist** for about, infrastructure (facility/people/video), trade-books, fulfilment, or legal — these are the Phase-2 asset gaps. Infrastructure media is an explicit **Harry drop** (3 facility photos + 4 people photos + 1 captioned walkthrough video). `vite.config.js` note: assets live at stable public paths so files can be swapped in place with zero code changes.

**Awaiting Harry (summary):** (1) clean alpha product cutouts ×8; (2) infra facility photos ×3 + people ×4 + walkthrough video ×1; (3) Americas region photo (if used); (4) any real client logos once permissioned.

---

## 8. HOMEPAGE HEALTH CHECK

Headed Chromium, viewport **1536×743, DPR 1.25**, full Lenis-driven scroll-through. Screenshots in `shots/recon-phase2/` (`01-hero.png` … `13-ctafooter.png` + bottom variant).

- **Overall: HEALTHY.** All 13 sections render fully; no blank/broken/overlapping sections. Lenis (`window.__lenis`) + GSAP ScrollTrigger pins all functioned. Total page height 16083px.
- **Console/page errors: 0** page errors. One transient generic `404` on first run (favicon-class, no URL, did not reproduce across two further passes).
- **FPS (pinned):** Hero pin ~158–171 fps · WhatWePrint scroll-jack ~217–236 fps — measured via rAF sampling. Values are inflated because this headed Chromium renders **uncapped (no vsync)**; the real takeaway is **both pins are comfortably clear of the frame budget — no jank.**
- **Env note:** `pnpm dev` fails here (`ERR_PNPM_IGNORED_BUILDS` on esbuild/sharp/ffmpeg build scripts); working path is `npx vite` or the already-running vite server on :5173. Not a homepage bug.

**Conclusion: the homepage is a stable base to build inner pages on top of.**

---

## 9. SPEC SUMMARY (proposed pages · reuse map · routing · risks · open questions)

> No designs proposed. This is the build-scaffold plan only.

### 9.1 Proposed page list
Reconciling the live-site IA (product/portfolio) with the brief IA (company) + the 4 mandated legal pages:

**Primary (from brief + live):**
1. `/` Home *(built)*
2. `/about` — Our Story (history/timeline/mission/vision) — *live "About Us" + brief §5.1*
3. `/founder` — The Founder (Nilesh Dhankani + leadership) — *brief §5.2*
4. `/global-markets` — Printed in India, Read by the World — *brief §5.3*
5. `/case-studies` — *brief §5.4 + live milestones*
6. `/contact` — *sourced from footer §6.1 (no live contact page exists)*
7. `/careers` — *brief §5.6* (optional/phase-2b)
8. `/newsroom` — *brief §5.5* (optional — no live newsroom; awards can live on Home/About)

**Product/portfolio (from live site — pending IA decision, see Q1):**
9. `/print/educational-books` · 10. `/print/trade-books` · 11. `/print/print-on-demand` · 12. `/infrastructure` · 13. `/fulfilment`

**Legal (mandatory, footer-linked every page):**
14. `/legal/privacy` · 15. `/legal/cookies` · 16. `/legal/accessibility` · 17. `/legal/terms`

### 9.2 Reuse map — which homepage sections seed which pages
| Inner page | Seeded by (reusable homepage sections/components) |
|------------|--------------------------------------------------|
| About / Our Story | **TrustStrips** (stats/countries band) · **CountUp** · **Awards** (recognition grid) · **Sustainability** (values) |
| The Founder | **Promise** (pull-quote pattern) · **CountUp** |
| Global Markets | **Projects** (globe + region cards + ledger) — carries `SHOW_RESTRICTED_CLIENTS` gate |
| Case Studies | **Cases** (accordion, no-GSAP, most portable) · **Projects** ledger rows |
| Educational / Trade / POD | **WhatWePrint** card system (decouple the sticky pin → static grid) · **Process** (press line) |
| Infrastructure | **Infrastructure** section (already placeholder-safe; `VIDEO_READY` gate) · **CountUp** |
| Fulfilment | **Process** (press-line pattern) · **WhatWePrint** cards · **Infrastructure** facility cards |
| Certifications block (any page) | **Certifications** (FSC code compliant) · **Marquee** (decouple Hero-catch curve) |
| Contact | **CTAFooter** contact block + footer contact data (§6.1) |
| Every page (chrome) | **SiteNav** + **CTAFooter** as `<SiteLayout>` |

### 9.3 Routing proposal (see §2.3 for detail)
`react-router-dom` v6 · `<SiteLayout>` (SiteNav + Outlet + CTAFooter) · **`/` index route owns the entire scroll engine** (`SmoothScrollProvider` + 13 sections) and unmounts it on navigation · inner routes use native scroll · `<ScrollRestoration>` · rewire SiteNav's dead anchors (`#expertise/#approach/#about/#quote`) into real `<Link>`s (hash-jump on Home, route elsewhere). **Homepage scroll engine is untouched.**

### 9.4 Risks
1. **IA mismatch (High):** brief (company pages) vs live site (product pages) define different page sets — building the wrong IA wastes the phase. Blocked on Q1.
2. **Two design systems (Medium):** must build inner pages on brand System B (navy/gold/Inter/DM Mono), not the CMYK/Metrisch Hero layer. Risk of accidental token bleed.
3. **Scroll-engine coupling (Medium):** if routing keeps `SmoothScrollProvider` global, stale pins break inner pages — §2.3 scoping mitigates.
4. **Compliance debt shipping to more pages (Medium):** 9px labels (`.aw-clip-date`, CalibrationBar), FSC licence-code confirmation, client-name permissions, gold-on-cream 4.5:1 — each multiplies across new pages.
5. **Asset gaps (Medium):** product cutouts damaged; infra photos/video, Americas region, and all inner-page imagery are Harry drops — pages will launch on placeholders.
6. **Content gaps (High):** About/Fulfilment/Legal have no finalised copy anywhere; case-study numbers/quotes are unverified placeholders.
7. **Data inconsistencies (Low/Medium):** facility count 3 vs 5, DR Congo 3.5M vs 5M, HDFC 1.3M/mo vs 3M, two office addresses — must reconcile before publishing numbers (also a substantiation requirement).
8. **Env/build (Low):** `pnpm dev` broken locally (`ERR_PNPM_IGNORED_BUILDS`); use `npx vite`.

### 9.5 Open questions for Harry
1. **IA decision:** company-page model (brief) or product/portfolio model (live site), or a hybrid (both under one nav)? This gates the whole page list (§9.1).
2. **Client-name permissions:** written sign-off for **HDFC, ZEE Learn/Kidzee**, and the named ministries (Tanzania, Nigeria/UBEC, Ghana, Ivory Coast, DR Congo, Maharashtra)? Until confirmed, keep `SHOW_RESTRICTED_CLIENTS=false` / hide.
3. **FSC promotional licence:** confirmed to cover **website** use, and is `TUVDC COC 101258` the exact display string/format?
4. **Cookies/analytics:** launch cookieless (drop the banner) or with GA (banner required)?
5. **Registered vs operating address:** footer must carry the **registered** office (Sector 30A, 400705) + CIN — show operating office (Cyber One, 400703) too, or only one?
6. **Legal copy:** who supplies counsel-reviewed Privacy/Cookie/Terms text? Accessibility Statement draft is in the checklist — approve as-is?
7. **Asset drops:** timeline for (a) clean alpha product cutouts ×8, (b) infra facility ×3 + people ×4 + captioned walkthrough video, (c) Americas region photo, (d) permissioned client logos?
8. **Numbers to publish:** which figures are canonical and substantiated (400M vs 25M/yr, facility count, per-project volumes) — need the substantiation note per public number.
9. **Careers & Newsroom:** in Phase 2 scope, or defer? (No live newsroom exists; awards could live on Home/About instead.)

---
*End of state-of-the-world. Screenshots: `shots/recon-phase2/`. Live scrape: `recon/qfp-live-pages/`. Prior section specs: `recon/what-we-print/`, `recon/next-three/`, `recon/quote/`, `recon/process-pressline/`.*
