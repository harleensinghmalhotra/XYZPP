# QFP Website — Read-Only Reconnaissance Report

- **Repo:** `harleensinghmalhotra/XYZPP` (working dir `d:\WEBSITES\Website University`, package name `xyz-printabilities`)
- **Branch:** `phase2-routing` · **HEAD:** `85769b348aeb82026ed761823afa27425bd23996` (`85769b3`)
- **Date of recon:** 2026-07-27 · **Viewport:** 1536×743, DPR 1.25, headed Chromium (Playwright 1.61.1)
- **Method:** All checks read-only. Screenshots + this report written only to `./_recon/`. No repo file edited/staged/committed. `pnpm build` and a `vite preview` server were run; no install mutated the lockfile; no deploy command was run.

> Headline: the finished, current build (HEAD `85769b3`) is live on **Vercel** and matches local `dist` byte-for-byte. The **real domain `quarterfoldltd.com` is serving an older, pre-"brand-gold" build** (orange accents, different stats/sections). Details below.

---

## SECTION A — GIT & REPO GROUND TRUTH

**A1 — Branch / HEAD / status**
- Branch: `phase2-routing`; HEAD `85769b3`.
- `git status --porcelain`: **empty (clean tree)** — no untracked or modified *tracked* files.
- Root files that exist but are correctly **gitignored** (so absent from porcelain): `.env.local` (385 B, at root), `dist/`, `scripts/`, `node_modules/`, and the new `_recon/`. No stray `.zip`, no committed `dist`, no tracked `.env`.

**A2 — Last 30 commits (verbatim subjects)**
```
85769b3 chore: sanitize comments and typography
949297c chore: remove stale sources and scratch files
92f499f fix: charani photo from final source, purge stale originals
bfb207d feat: team spotlight empty state with click-away
7376ec1 feat: team spotlight layout
1653beb feat: split team cards with full text reveal
84f64f1 fix: align team grid to page content edges
d14de1e feat: hover-reveal team grid
8460978 fix: full-bleed photo team cards
5ef5005 fix: compact uniform team cards with uncropped photos
3e649e6 fix: FR hero CTA overflow, new Charani photo
3ee1b95 feat: scroll-driven journey timeline, hero refinements
0d28ce6 copy: final Environment section from client
d91f1f3 feat: complete team section with client bios and titles
ba705e0 fix: trade books cutout size — trim baked transparent padding
7860a40 About Our Team: expand to six leadership cards with real photos
f936096 fix: about divider shade and infra dead gap
556bb2b Packaging cutout: tighter trim removes faint die-cut template, match neighbour size
941cf74 Enlarge category cutouts: trim transparent margins, fill card width in WWP and Explore
91bc277 Task 3: add Print Something That Matters closing band to Contact (all locales)
09203ca Task 1: new category cutouts (WebP) wired into What We Print and Explore Categories
a3c0b61 Footer: point Global Reach to the Worldwide Deliveries section (#projects), not the map
9568771 Task 11: soften Sustainability intro copy in all three locales
f9a55dd Task 10: wire footer Quick Links and Certified links, fix SPA hash-scroll crash
c22b31a Task 9: confirmed five featured certifications, remove ISO 14001, verbatim FSC/Star copy
19e5e32 Task 8: WhatsApp float button to brand olive #6B7A2A
4bb4e27 Task 7: globe atmosphere, arcs and market dots to brand gold #B06F15 (no orange)
386865d Task 6: map water to site navy #030C31, marker dots to brand gold
d9c88f6 Task 5: Explore Categories grid 5 per row on desktop (5 + 4), responsive down to 2
04ec097 Task 4: remove dead cream band between Infrastructure stats strip and book explorer
```

**A3 — Counts / divergence**
- Total commits on branch: **415**.
- `origin/phase2-routing` vs local: **0 / 0** — fully in sync (nothing to push/pull).
- vs `main`: `git rev-list --left-right --count main...HEAD` = **0 behind / 287 ahead**.

**A4 — Commit `a42d7c7`**
- Exists. `a42d7c7 2026-07-23 16:28:11 +0530 feat: localise hero artwork for French and Spanish`.
- **60 commits** sit between it and HEAD. Note: the "brand gold" rebrand commits (Task 7 `4bb4e27` etc.) come *after* `a42d7c7`, so `a42d7c7` predates the orange→gold change — consistent with the orange styling still visible on the live real domain (Section C).

**A5 — LFS (load-bearing)**
- `.gitattributes` routes `*.png/webp/jpg/jpeg/gif/mp4/mov/webm/pdf/zip/psd` to LFS, **but** trailing override rules negate LFS for `public/**`, `assets/**`, and `src/**/*.{png,jpg,jpeg,webp,gif,mp4,mov,webm}` (`!filter !diff !merge -text`).
- **Verified: 0 LFS pointer files** among **282** tracked media files under `public/`; `git lfs ls-files` returns **0**. Every media file is committed as real bytes. ✅ Vercel/Hostinger can resolve all assets — no pointer breakage.

**A6 — Sizes / largest tracked files**
- `.git` on disk: **2.5 GB** (history churn of large binaries; not current LFS). Working tree excl. `node_modules/.git/dist`: **238 MB**.
- Largest tracked files: `homepage/video/facilities.mp4` 13.8 MB · `about/gallery/facility-tour.mp4` 8.6 MB · `homepage/video/how-we-work.mp4` 6.1 MB · `about/gallery/web-press.mp4` 6.1 MB · `about/gallery/binding-line.mp4` 4.0 MB · `homepage/globe/earth-blue-marble.jpg` 1.4 MB (+ a byte-identical copy under `public/qfp/earth/`) · `qfp/hero/sfx/keyboard-typing.wav` 1.1 MB.

**A7 — .gitignore encoding**
- CRLF line endings, **no BOM**, starts with `#` — rules are valid, no encoding weirdness. Ignores: `node_modules/`, `dist/`, `studio/.env*`, `.env.local`, `.env.*.local`, `*API Key*.txt`, `.claude/`, `.agents/`, `_archive/`, **`scripts/`**, and `*.png` (with `!src/assets/**` and `!public/site-assets/**` un-ignore rules).

---

## SECTION B — BUILD HEALTH

**B1 — Env / Sanity target**
- `.env.local` present. **Key names only:** `VITE_SANITY_READ_TOKEN` (single key). (Value not printed.)
- Sanity **projectId `z8o5rxfi`**, **dataset `production`**, apiVersion `2026-07-19` — from `studio/projectConfig.js`, imported by `src/lib/sanity.js:5`.

**B2 — `pnpm build`**
- **Exit 0.** Build time **15.66 s** (~18 s wall incl. pnpm). 7267 modules transformed. No errors.
- Chunks **> 500 kB** (the only warning is the standard vite chunk-size notice):

| Chunk | Size | Gzip |
|---|---:|---:|
| `assets/react-globe.gl-*.js` | 1,912.68 kB | 542.68 kB |
| `assets/index-*.js` | 1,195.39 kB | 377.74 kB |
| `assets/maplibre-gl-*.js` | 1,053.93 kB | 284.93 kB |
| `assets/index-*.css` | 272.06 kB | 52.04 kB |
| `assets/maplibre-gl-*.css` | 69.96 kB | 10.06 kB |

**B3 — dist size/count:** **84 MB**, **342 files**.

**B4 — Required files in dist**
- `index.html` ✅ · `robots.txt` ✅ · `sitemap.xml` ✅ · **`.htaccess` ❌ NOT produced** (does not exist anywhere in repo/public/dist).
  → On Apache/Hostinger the SPA deep-link rewrite must be provided by a **manually-maintained `.htaccess`** on the server; the build won't emit one. Vercel is covered by `vercel.json` (`/(.*) → /index.html`).

**B5 — robots.txt / sitemap.xml (verbatim)**
```
# dist/robots.txt
User-agent: *
Allow: /

Sitemap: https://quarterfoldltd.com/sitemap.xml
```
`dist/sitemap.xml` lists **13 URLs, all on the real domain** (`https://quarterfoldltd.com/…`): `/`, `/about`, `/global-markets`, `/print-on-demand`, `/contact`, `/founder`, `/infrastructure`, `/fulfilment`, `/newsroom`, `/legal/privacy`, `/legal/cookies`, `/legal/terms`, `/legal/accessibility`. (No preview-domain URLs. Omits the two hash-redirect routes and per-article newsroom URLs.)

**B6 — Leftover strings in dist**
- `vercel.app`: **none**.
- `TODO`: only false positives — Spanish word "todo/todos" in ES copy — plus **one real `// todo - FIX`** inside the bundled **react-globe.gl/three** dashed-line shader (third-party, not our source).
- `localhost`: only inside Sanity client's internal hostname list `["localhost","127.0.0.1","0.0.0.0"]` (library code).
- `PLACEHOLDER/placeholder`: legitimate form input `placeholder` attrs + CSS `::placeholder`; plus a real fallback asset `"/site-assets/about/team/placeholder-portrait.svg"` and an **intentional team empty-state** string ("The details will arrive soon" / "Los detalles llegarán pronto") from the team-spotlight feature. `FIXME`/`COMING SOON`: none literal.

---

## SECTION C — LIVE vs LOCAL

**C1 — Load status**
- `https://quarterfoldltd.com` — HTTP 200 (Hostinger, IP `217.21.91.96`), title **"Quarterfold Printabilities"**, 0 console errors. (WebFetch's proxy timed out on it, but the site is reachable via curl and Playwright — not a dead site.)
- `https://xyzpp.vercel.app` — HTTP 200, title **"Quarterfold Printabilities"**, 0 console errors.
- Full-page screenshots saved (`_recon/live-real-en-*.png`, `_recon/live-vercel-en-*.png`).

**C2 — Asset-hash comparison (decisive)**

| Source | JS | CSS |
|---|---|---|
| Local `dist` (HEAD 85769b3) | `index-Bfqye-Oy.js` | `index-BumNzZDX.css` |
| **xyzpp.vercel.app** | `index-Bfqye-Oy.js` | `index-BumNzZDX.css` |
| **quarterfoldltd.com** | `index-DivhGlHt.js` | `index-l2ZIvrP1.css` |

→ **Vercel === local === current build (HEAD 85769b3).** **The real domain serves DIFFERENT hashes → it is running an older, STALE build** (confirmed).

**C3 — ≥8 concrete user-visible differences (real `quarterfoldltd.com` vs current `xyzpp.vercel.app`)** — screenshot proof in `_recon/`:
1. **Brand accent color:** real = **bright orange** on headings-accents, buttons, stats, config checkmarks, trust belt; current = **muted brand gold `#B06F15`**. Pervasive on every page. *(live-real-en-print-on-demand.png / live-vercel-en-print-on-demand.png)*
2. **Print-on-Demand structure:** real ends with a **"Not sure yet? Order a sample first."** section and has **no Explore-Categories cutout grid** (3 imgs); current has the **9-cutout "Explore Categories"** grid and no sample section (12 imgs).
3. **PoD "same presses" stat:** real reads **"8M+"** books/year; current reads **"75M"**.
4. **About → Team:** real = text cards, bios always visible, different order, **no "Select a member to know more" spotlight**; current = B&W photo cards with hover-reveal **+ spotlight panel** (the team-spotlight feature).
5. **About → team/gallery/founder imagery:** real shows **grey placeholder boxes** for team photos, the "Inside Quarterfold" gallery, and the Nilesh portrait; current shows **real photographs**.
6. **About → Journey Timeline:** real = static alternating vertical timeline with visible entries (*The First Order → Learning the Continent → Our First Facility → Scale With Systems → A Global Operation*); current = **scroll-driven pinned timeline** (redesigned).
7. **Contact → FAQ:** real = **tabbed audience FAQ** ("For Publishers / For Institutions & Programmes / For Self-Publishers", ~12 Qs); current = **flat single-list FAQ** (~16 Qs, no tabs).
8. **Footer "Certified" list:** real = abbreviated **FSC / ISO / Sedex**; current = **FSC / ISO 9001:2015 / ISO/IEC 27001:2022 / Sedex / Star Export House** (5, detailed).
9. **Home "Worldwide Deliveries":** real region cards render darker/text-forward; current shows region photo cards + brighter globe. *(secondary)*
10. **Build identity:** different JS/CSS hashes (C2).

**C4 — Preview indexability**
```
# https://xyzpp.vercel.app/robots.txt
User-agent: *
Allow: /

Sitemap: https://quarterfoldltd.com/sitemap.xml
```
→ The **preview domain is fully indexable** and its sitemap points at the real domain. **Duplicate-content risk** — the preview should be `noindex`/`Disallow: /`.

---

## SECTION D — PAGE-BY-PAGE VISUAL AUDIT (local build @ 1536×743, DPR 1.25)

**Routes enumerated from `src/App.jsx`** (single router file): `/` (Home), `/about`, `/founder`, `/global-markets`, `/print-on-demand`, `/infrastructure`, `/newsroom`, `/newsroom/:slug`, `/fulfilment`, `/contact`, `/legal/privacy`, `/legal/cookies`, `/legal/terms`, `/legal/accessibility`, `*` (NotFound). Plus redirects `/educational-books → /#wwp-educational` and `/trade-books → /#wwp-trade`.

**Automated metrics (every route):** all returned **HTTP 200**, **exactly one `<h1>`**, **0 broken images**, **no horizontal scroll** (scrollWidth ≤ 1536), and **0 console errors** — *except* FR `/about` (191 maplibre glyph warnings, see below). Both redirects resolved to the correct home-hash URLs.

Per route (screenshots opened and viewed — `_recon/local-en-*.png`):

- **`/` Home** — Navy hero (localized kids + open-book art) "INTEGRATED GLOBAL BOOK MANUFACTURING & FULFILMENT PARTNER"; "Formats and Categories" (4 cutout cards); "Printed in India. Read by the World." world-map band; mission statement; "Worldwide Deliveries" globe + Africa/Asia/USA region cards + stat strip; "Built for Scale" infrastructure block; "Certified for Quality" (5 cert cards); "One Continuous Process" (01 Paper Selection); gold trust belt; "Responsible by Practice" sustainability; "Awards & Press"; CTA + footer. Cohesive, no overlaps/clipping. (13,266 px tall.)
- **`/about`** — Hero + Our Story; **"JOURNEY TIMELINE" renders as a large near-empty band in the static capture** (pinned scroll-scrubbed section — a full-page-screenshot artifact, not a true gap; content animates on live scroll). Then MISSION/VISION/VALUES, Nilesh founder callout (real photo), "Our Team" 6 B&W cards + "Select a member to know more" spotlight, "Inside Quarterfold" 6-image gallery, Awards & Press, Certified (with Certifications/Environment/Social-responsibility tabs), CTA/footer.
- **`/founder`** — Navy hero + bio; **portrait section is an intentional placeholder box "PORTRAIT — Awaiting founder photo"** (`Founder.jsx:62-79`) even though a real Nilesh photo exists on `/about`; pull-quote; "Ready to collaborate?" CTA. Sparse page.
- **`/global-markets`** — "PRINTED IN INDIA. READ BY THE WORLD."; regions (Africa incl. Nigeria/Kenya/Ghana… / US-UK-Mexico-Spain-Germany); "For publishers evaluating an offshore partner" 4-column block — **its "Certified and audited" line reads "FSC…, ISO 14001:2015, ISO/IEC 27001:2022, Sedex membership"** (ISO 14001 visible); **"Our Global Team — Details coming shortly" is a placeholder/empty section**; CTA/footer.
- **`/print-on-demand`** — "YOUR BOOK. EXACTLY AS YOU IMAGINED."; full interactive **book configurator** (Format/Size/Paper/Binding/Finish/Quantity + live preview + spec sheet + "Request This Book"); "Included with every order"; "Three steps to finished copies"; 1/75M/Days band; **"Explore Categories" 9-cutout grid (5+4)**; CTA/footer. Strong page.
- **`/infrastructure`** — "BUILT FOR SCALE. ENGINEERED FOR TRUST."; "As of July 2025" capability checklist; "Value Added Finishing Under One Roof"; 5-cert block; "Three capabilities, one line" (98%); "The machines behind the volume" (22 web-offset / 6 sheetfed / binding); "Measured, not estimated" (300,000 sq ft / 75M / 600+); "A look across the floor" gallery; CTA/footer. Complete, no dead gaps.
- **`/newsroom`** — Navy hero; **6 real Sanity article cards** (after fetch resolves; first capture caught the skeleton state). 3 cards have cover images, 3 do not. CTA/footer.
- **`/newsroom/printweek-power-100-2026`** (first article) — loads 200, single h1 = the article title, proper `<title>`. OK.
- **`/fulfilment`** — "ONE SYSTEM, START TO FINISH." (100,000 sq ft); institutional trust marquee; three delivery cards; stats band (JNPT/800+/98%); four feature rows with real facility photos; "One continuous journey"; CTA/footer. Polished.
- **`/contact`** — "LET'S TALK. WE REPLY IN ONE BUSINESS DAY."; ways-to-reach cards (`info@`/`enquiry@quarterfoldltd.com`); "Two sites in Navi Mumbai"; careers block; full Web3Forms project form; **16-question flat FAQ**; CTA/footer.
- **`/legal/privacy`** (representative of the 4 legal routes) — hero + full policy (DPDP Act 2023 + GDPR Art. 6, rights, retention, children's data, security, "LAST UPDATED: JULY 2026") + CTA/footer. Clean. `/legal/cookies`, `/legal/terms`, `/legal/accessibility` share the same `LegalPage` component (each h1=1, 0 errors).
- **`*` NotFound** — branded "ERROR 404 · OUT OF STOCK / This page is out of print." + "Back to the catalogue →" + CTA/footer.

**D3 (layout issues):** No horizontal scrollbars, no broken images, no overlaps or clipped text observed at 1536 px on any route. The only "dead gap" is the About Journey Timeline (pinned-section capture artifact — verify on live scroll). **D4 (console):** clean everywhere except the FR-`/about` maplibre warnings.

**FR-/about 191 warnings:** all are maplibre-gl `Unable to load glyph range … Rendering codepoint U+XXXX locally instead. TypeError: Failed to fetch` — the home-page globe (`GlobeFlyTo.jsx`, style `https://tiles.openfreemap.org/styles/positron`) failing to fetch remote label glyphs, with a coded worldmap-dots fallback. **Warnings, not errors; no visual breakage** (FR `/about` renders perfectly). Likely a network/endpoint hiccup in the audit environment; should be confirmed on the live network.

---

## SECTION E — i18n COVERAGE

**E1 — Files/counts:** `src/locales/{en,fr,es}/*.json` — **27 namespaces per language, 81 files, no parse errors.** Leaf-key totals: **EN 1444 · FR 1445 · ES 1444**.

**E2 — Coverage vs EN**
- **Missing namespace files: 0** (all 27 present in FR and ES).
- **Missing keys: 0** for both FR and ES — structurally complete mirrors.
- **Untranslated passthrough** (value byte-identical to EN): FR **130 flagged** (18 excluded), ES **118 flagged** (19 excluded) — but the overwhelming majority are **legitimately identical**: proper nouns (person/country/institution names, cert lockups like `ISO 9001:2015`, `Star Export House`) and FR/EN cognates (`Infrastructure`, `Contact`, `Message`, `Format`, `Mission`, `Vision`…). **Only 1 clear real defect:** FR `infrastructurePage:dialog.captionsLabel = "English"` (should be **"Anglais"**; ES correctly has "Inglés").
- **Orphan (in target, not EN): 1** — FR `home:hero.book.rightPara.6` (FR hero sentence wraps to a 7th array line vs EN's 6). Cosmetic/structural.

**E3 — FR/ES visual (home, about, infrastructure, contact via in-app toggle)** — screenshots `_recon/verify-fr-*.png` / `verify-es-*.png`, viewed:
- All pages **fully translated** (headings, body, nav, cards, the entire Contact **form** incl. placeholders + consent/privacy link, and the full **FAQ accordion**). **No leftover visible English, no text overflowing pills/buttons/cards, no broken wrapping, no horizontal scroll.** FR home = "PARTENAIRE MONDIAL", ES home hero art localized, "Certifié pour la qualité" / "Certificados en calidad", etc.

**E4 — Hero speech bubbles (opened the webp files directly)**
- **EN** (`hero-main.webp`): "Oh yes! Education has no borders." / "WOW! Quarterfold Prints 75+ Million Books Every Year." / "What? Quarterfold also export to 25+ Countries every year?" / "Yes!! Trusted by publishers across Continents For its Quality and on time Delivery!"
- **FR** (`hero-main-fr.webp`): "Absolument ! L'éducation n'a pas de frontières." / "Quarterfold imprime plus de 75 millions de livres chaque année." / **"Vraiment ! Quarterfold exporte également vers plus de 25 pays chaque année !"** / "Oui ! Approuvé par des éditeurs du monde entier pour sa qualité et le respect de ses délais de livraison."
- **ES** (`hero-main-es.webp`): "¡Oh sí! La educación no tiene fronteras." / "¡Guau! Quarterfold imprime más de 75 millones de libros al año." / "¿Qué? Quarterfold exporta también a más de 25 países cada año." / "¡Sí! Editoriales de todo el mundo confían en Quarterfold por su calidad y cumplimiento puntual en las entregas."
- **Suspected Spanish `¿` in the FR third bubble: DENIED.** The FR third bubble reads a clean "Vraiment !" with correct French spaced punctuation — **no `¿` present.** The art appears to have been corrected since the earlier note. ES uses correct inverted punctuation throughout. (Minor baked-in EN copy nits only: "also export"→"exports"; FR bubble 2 dropped the "WOW!/Ouah!" eyebrow.)

---

## SECTION F — CONTENT & COMPLIANCE

**F1 — Certifications**
- Homepage carousel (`src/sections/Certifications.jsx`, content `homeCerts.json`) renders **exactly FIVE**, in order: **FSC Chain of Custody (Licence TUVDC-COC-101258), ISO 9001:2015, ISO/IEC 27001:2022, Sedex Member, Star Export House.** No sixth. ✅
- **ISO 14001 is NOT "nowhere".** It appears in **4 user-facing content areas × all 3 languages** (12 string keys):
  - `globalMarkets.json:35` — "Certified and audited" line (**visible by default** on Global Markets — screenshot-confirmed).
  - `homeProjects.json:19` — Global Reach credentials line.
  - `homeSustain.json:13` — Sustainability EMS reference `"ISO 14001:2015"`.
  - `infrastructurePage.json:34` — a dedicated `iso14001` card under the Infrastructure **"Environment"** cert tab.
  - (It was removed only from the 5-cert carousel per commit `c22b31a`.) **Needs client decision** — see RED/AMBER.

**F2 — Team** (`src/pages/OurStory.jsx` → `Team()`; content `ourStory.json:team.members`)
Exactly the **six** expected, in order, all photos present on disk (`public/site-assets/about/team/*.webp`):

| # | Name | Role | Photo | Bio | Quote |
|---|---|---|:--:|:--:|:--:|
| 1 | Sameer Kazi | Director, Sales | ✅ | ✅ | ✅ |
| 2 | Charani Dhankani | Director | ✅ | ✅ | ❌ none |
| 3 | Dhiresh Verlekar | Head, Procurement | ✅ | ✅ | ✅ |
| 4 | Dilip Ramrakhyani | CFO, Finance Leader | ✅ | ✅ | ✅ |
| 5 | Patrick Carrapiett | President | ✅ | ✅ | ✅ |
| 6 | Priyanka Rajpal | Head, Human Resources & Administration | ✅ | ❌ none | ✅ |

(Intentional gaps: Charani no quote, Priyanka no bio. Verify Priyanka's role renders "&" and not the literal `&amp;` entity — stored as `&amp;` in JSON.)

**F3 — Dashes:** **User-facing em-dash = 0, en-dash = 0.** Locale JSONs are completely clean. The 420 em-dash + 5 en-dash occurrences in `src/**/*.{jsx,js}` are **all inside code comments**, none in rendered copy. ✅

**F4 — Company Profile PDF:** Footer button (`CTAFooter.jsx:100-107`, label `footer.json:6` "Download Company Profile") → `/site-assets/documents/company-profile.pdf`. File exists: **~60 KB, PDF 1.4, 1 page** → reads as a **placeholder/stand-in, not a real multi-page profile.**

**F5 — Web3Forms:** Access key **`4f37deec-ff06-4475-ba51-8fe9df9b46b4`** (public-by-design in the client bundle). Used by **Contact** (`Contact.jsx:36`, subject "Website Enquiry, Contact Form") and **Print-on-Demand** (`PrintOnDemand.jsx:138`, subject "Print on Demand Request"), both `POST https://api.web3forms.com/submit` with a `botcheck` honeypot, `from_name: 'QFP Website'`. No hardcoded recipient (routes to the inbox registered against the key) and no redirect (in-page React status). Nothing changed.

**F6 — `SHOW_RESTRICTED_CLIENTS`:** `export const SHOW_RESTRICTED_CLIENTS = true` (`src/lib/compliance.js:23`). While `true` it **renders**: HDFC Bank Ltd, ZEE Learn / Kidzee, Reliance Industries (homepage marquee, `TrustStrips.jsx`); HDFC (Projects ledger, `Projects.jsx`); HDFC + ZEE (Fulfilment marquee, `Fulfilment.jsx`). ⚠️ Several **stale comments** (`TrustStrips.jsx:29`, `Projects.jsx:59`, `Fulfilment.jsx:24,105`) still claim the flag is false / permission-pending / "kept OUT of DOM" — these contradict the authoritative `compliance.js` (permission confirmed). **Confirm written permission is on file** for these names.

**F7 — Alt text:** Rendered images per page vs images without a non-empty `alt`:
- Home: 33 imgs, **14 without alt** — the QFP logo mark (×2, likely intentionally decorative with a labelled link), `book-stack.webp`, and the **11 award/press logos** `award-01…11.webp`.
- About: 31 imgs, **20 without alt** — logo (×2), **`founder-portrait.webp`**, **`gallery-01…06.webp`** (6), and the 11 award logos.
- The **award logos, gallery photos, and founder portrait are meaningful content** and should carry descriptive alt text (accessibility gap). (Note: the tooling couldn't fully separate `alt=""` decorative-intentional from missing-`alt`; the named content images above warrant alt regardless.)

**F8 — One `<h1>` per route:** **✅ Exactly one `<h1>` on every route** measured (home, about, founder, global-markets, print-on-demand, infrastructure, newsroom, article, fulfilment, contact, all 4 legal, 404, both redirects). No route with zero or multiple.

---

## SECTION G — ASSET INTEGRITY

**G1 — Inventory**
- `public/site-assets/` — **66 MB.** Subfolders: `about/` (21 MB, 32 files), `homepage/` (35 MB, 108), `infrastructure/` (3.2 MB, 42), `newsroom/` (2.7 MB, 18), `fulfilment/` (1.9 MB, 9), `what-we-print/` (2.0 MB, 10), `contact/` (417 KB, 3), `print-on-demand/` (132 KB, 4), `documents/` (65 KB, 2). **37 `README.md` files** present throughout the tree.
- **Parallel older tree `public/qfp/` — 13 MB** (brand/earth/hero/icons3d/infra/newsroom/sounds/trade + loose `worldmap-dots.webp`), referenced by TradeBooks/EducationalBooks/globe/sfx. **0 READMEs** there. Contains **byte-identical duplicates** of some site-assets media (e.g. `earth-blue-marble.jpg` 1.4 MB ×2, `press-run.mp4` 576 KB ×2) → redundant weight.

**G2 — Broken / oversized**
- **Broken static references: 0.** All 63 static `"/site-assets/…"` / `"/qfp/…"` string refs in `src/**` (and the 14 gallery manifest entries) resolve to files on disk. **Runtime confirmed: 0 broken `<img>`** across all audited routes.
- **7 dynamic path patterns** (template literals like `/site-assets/homepage/facility-book/${name}.webp`, team photos, awards/cases/certs/stat-icons) — correctly **not** flagged (paths built at runtime).
- **Images > 500 kB under `public/`: 10** — five `.mp4` dominate (facilities 13.8 MB, facility-tour 8.6 MB, how-we-work 6.1 MB, web-press 6.1 MB, binding-line 4.0 MB), plus `earth-blue-marble.jpg` (×2), `keyboard-typing.wav` 1.1 MB, `press-run.mp4` (×2). No single image > 1.5 MB; the videos are the real page-weight cost.

**G3 — Sanity newsroom:** Loads live (Viewer token baked at build). **6 real articles fetched:**
1. `printweek-power-100-2026` (Awards, Jun 15 2026) — "Quarterfold's Nilesh Dhankani named to PrintWeek's Power 100 for 2026"
2. `business-connect-print-industry` (Press, Jul 01 2024)
3. `printweek-book-education-company-of-the-year` (Awards, Jan 15 2024)
4. `printweek-investment-2022` (Press, Sep 15 2022)
5. `printweek-400000-books-a-day` (Press, Jan 15 2022)
6. `assocham-excellence-in-education` (Awards, Nov 15 2017)
- Article detail page renders correct h1 + `<title>`.
- **FR/ES translations RESOLVE (not EN fallback):** e.g. FR "Nilesh Dhankani, de Quarterfold, entre au Power 100 de PrintWeek pour 2026" / ES "…entra en el Power 100…". UI chrome also localizes (Quick Links → Liens rapides → Enlaces rápidos). ✅ (Minor: 3 of 6 cards have no cover image.)

---

## VERDICTS

### 🔴 RED — blocks client approval
1. **The real domain `quarterfoldltd.com` is serving a STALE build.** The finished, current build (HEAD `85769b3`) is live on Vercel and matches local `dist` exactly, but the public domain shows the older pre-gold-rebrand site (orange accents, "8M+" instead of "75M", no team spotlight, grey-placeholder team/gallery/founder photos on About, different PoD and FAQ). **What the client and public currently see is not the approved work** — the current build must be deployed to Hostinger. (C2, C3)
2. **ISO 14001 still appears in 4 user-facing areas (×3 languages)** — Global Markets, home Global Reach, Sustainability, and the Infrastructure "Environment" cert tab — despite the "remove ISO 14001 / appears nowhere" requirement. If QFP does **not** currently hold ISO 14001, this is a false certification claim and must be removed everywhere; if they **do**, confirm and keep. Needs a client decision before sign-off. (F1)

### 🟠 AMBER — visible but survivable
- **Founder page** ships an "Awaiting founder photo" placeholder portrait, while a real Nilesh photo exists on `/about`. (D, `Founder.jsx:62-79`)
- **Global Markets → "Our Global Team — Details coming shortly"** placeholder/empty section. (D)
- **Company Profile PDF** is a 60 KB / 1-page stand-in, not a real profile brochure. (F4)
- **Accessibility — missing alt text** on the 11 award logos, 6 About gallery photos, and the founder portrait. (F7)
- **FR translation defect:** `infrastructurePage:dialog.captionsLabel` still "English" (should be "Anglais"). (E2)
- **Preview domain is indexable** (`Allow: /`) → duplicate-content risk; set it `noindex`. (C4)
- **No `.htaccess`** is produced by the build or stored in-repo — Hostinger deep-link refreshes (e.g. reloading `/about`) will 404 unless a SPA-rewrite `.htaccess` is maintained on the server. (B4)
- **`SHOW_RESTRICTED_CLIENTS = true`** renders HDFC / ZEE-Kidzee / Reliance while stale code comments claim the opposite — confirm written client permission is on file and reconcile the comments. (F6)
- **maplibre glyph fetch failed (191 warnings)** during audit — globe labels fall back to local rendering; verify OpenFreeMap glyphs load on the live network. (D)
- **Newsroom:** 3 of 6 article cards lack cover images. (G3)
- **Repo/asset weight:** duplicate `public/qfp/` tree (~13 MB, byte-identical dupes) and ~38 MB of unoptimised `.mp4`; `.git` is 2.5 GB. (A6, G1, G2)
- Minor baked-in EN hero copy nits ("also export"→"exports"). (E4)

### 🟢 GREEN — verified good
- Clean working tree; in sync with `origin`; **no LFS pointers** — all 282 tracked media are real bytes. (A1, A5)
- **Build passes** (exit 0); every route HTTP 200; **exactly one `<h1>` per route**; **0 broken images**; **no horizontal scroll** at 1536; **0 console errors** (except the non-fatal maplibre warnings). (B2, D, F8)
- **i18n structurally complete**: 27 namespaces × EN/FR/ES, 0 missing files, 0 missing keys; FR/ES render fully translated with no overflow. (E1–E3)
- **Hero art localized** EN/FR/ES; the suspected Spanish `¿` in the FR hero is **NOT present**. (E4)
- **Exactly 5 certifications** in the homepage carousel; **team is exactly the 6 expected** with photos; **0 user-facing dashes**. (F1, F2, F3)
- **Sanity newsroom works** — 6 real articles, FR/ES titles genuinely translate. (G3)
- Web3Forms wired with honeypot on Contact + PoD; robots/sitemap present with the real domain; branded 404. (F5, B4, B5, D)
- Vercel deployment is current and correct. (C2)

### ⚪ COULD NOT VERIFY (honest gaps)
- Whether OpenFreeMap globe glyphs/tiles load on the **live production network** (only observed "Failed to fetch" in this environment).
- The **exact commit SHA** the real domain is built from — the JS hash `DivhGlHt` doesn't map to a commit; "pre-gold ≈ `a42d7c7` era" is inferred from branding, not proven.
- Whether **QFP actually holds ISO 14001** (a compliance fact, not determinable from the repo).
- Whether the **Web3Forms registered recipient inbox** is correct/monitored (didn't submit a live form / send mail).
- The **Hostinger server's `.htaccess` / deep-link refresh** behaviour (couldn't inspect server config; client-side SPA nav worked in captures).
- **Globe water `#A7C6DE`** — the literal token isn't in `src` (applied via a library prop or other form); treated as the pre-declared **confirmed exception**, not independently confirmed in code.
- **Company Profile PDF content** (confirmed 1 page/60 KB; didn't render/read its contents).
- **Cookie-consent gating of analytics** (banner renders with Accept/Reject; didn't test consent persistence).

---
*No repo files were modified, staged, committed, or deployed. All outputs live under `./_recon/`.*
