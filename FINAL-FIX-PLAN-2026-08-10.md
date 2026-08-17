# FINAL FIX PLAN — 2026-08-10

Consolidation of all five audits into one deduped, DONE-pruned, laned plan. **Read-only — no source changed, no commit.**

**Inputs read in full:** `MOBILE-RECON-2026-08-09.md`, `MOBILE-UX-RECON-2026-08-09.md`, `UNLIGHTHOUSE-AUDIT-2026-08-10.md`, `PA11Y-AUDIT-2026-08-10.md`, `LHCI-BASELINE-2026-08-10.md`.

**Method & the key insight:** the two **recons (08-09/08-10) were the *input* to the 16 mobile lanes**; the three **tool audits ran on the current, post-lane build.** So most recon findings are already fixed — cross-checked against the **40 commits since `5a664e8`**. One class of finding no tool can measure — **horizontal overflow** — was verified with a **live build + preview + Playwright** pass at 390 px. Everything the audits surface on the current build is either (a) confirmed-fixed, (b) global/desktop-altering → owner decision, or (c) a small residue of genuinely-new, mobile-actionable items.

---

## 1. DONE — fixed by the lanes, excluded from the plan

Every recon finding mapped to the commit that fixed it. ✔ = independently confirmed this session (live check / grep / a tool audit corroborating).

| Finding (source) | Fixed by | Confirmed |
|---|---|---|
| **Certs 351 px horizontal overflow** on `/`, `/about`, `/infrastructure` (MOBILE-RECON §1) | `a78f1ef` restore h-scroller <900px | ✔ **live check: 351px → 4px** (hiding `#certifications` drops scrollWidth 394→390). *Residual +4px → Lane 2.* |
| **No mobile nav menu** (MOBILE-RECON §4a) | `8f044c0` mobile drawer <1024px | ✔ Pa11y opened `.mnav-toggle`→`#mobile-nav-drawer` |
| **Footer missing About/POD/Newsroom/Global-Markets/Fulfilment** (MOBILE-RECON §4b) | `dbd3dc2` add 5 routes to Quick Links | ✔ grep `CTAFooter.jsx` |
| **Language toggle 32×22 tap target** (§4c/§4e) | `0c7a70d` 44×44 on mobile | commit |
| **WhatsApp FAB under the cookie banner** (§4d) | `36fcef7` lift clear on mobile | commit |
| **Footer link/social tap targets <44px** (§4e) | `16b1f70` ≥44px | commit |
| **Contact inputs 15px → iOS focus-zoom** (§5) | `d90507c` 16px <900px | ✔ grep `.ctc-field … 16px` (index.css:4142) |
| **POD inputs 14px → iOS focus-zoom; consent/targets** (§5) | `da08a26` + `b186303` | commit |
| **Facility-book 9–10.5px text; 32px overview pill** (§2) | `db38726`, `734ef86`, `bcfb1d7` | commit |
| **Facility-book inverted reading order + dead tap** (UX §4) | `0fee19e` + `2e0731a` | commit |
| **`how-we-work.mp4` 6 MB eager cold-load** (§6) | `cfcafc4` drop autoPlay, IO-driven | ✔ Unlighthouse: `/` cold load 1,807 KiB, **0 mp4 requests** |
| **Globe 1.9 MB chunk not lazy enough** (§6) | `483b4e5` widen lazy-mount to ~1.5vh | ✔ Unlighthouse: **0 globe/maplibre/earth requests** on cold `/` |
| **Section spacing stuck at 96px on mobile** (UX §1: home/fulfilment/contact/about/infra/POD/newsroom/global) | Lanes 1–8: `84eacd3,41140ad,a226796,8410f5b,3df2fa8,de7e930,397f657,04e4bfc,0ab33e7` | commits |
| **About timeline 822px empty tail** (UX §1) | `7250e36` close the void <900px | commit |
| **Inner-page heroes 24–39% filled** (UX §2/§7) | `8410f5b` heroes fill the band | commit |
| **Three button systems / desktop-narrow CTAs** (UX §3) | `100e608` button system (index.css parts) | commit (partial — see UNCERTAIN) |
| **No sticky nav after scroll** (UX §6) | `b7c581a` hide-on-scroll-down / reveal-on-scroll-up | commit |

**Where a report and our code disagreed:** MOBILE-RECON §1 said the certs overflow was **351px and broken**. It *was* — and the lane fixed it. The recon was right about the bug; the lane was right that it shipped a fix. The live check settled it: **351px gone, 4px residual remains** (Lane 2). No other report claims a lane-fixed item is still broken.

---

## 2. NOT ACTIONABLE / needs owner decision — merged & deduped

The site is **design-locked**; the only freely-permitted change class is **mobile-only media queries** (plus zero-pixel a11y attributes). Anything whose only real fix alters desktop is here, flagged **[OWNER]**.

1. **Contrast failures — [OWNER]** *(the Lighthouse + Pa11y dedup item)*: POD "The Configurator" / "Step 01–06" **3.93:1** (Unlighthouse `color-contrast` **and** Pa11y `G18.Fail`), `/fulfilment` card-index "01/02/03" **3.42:1** (Pa11y), `/contact` required-`*` **3.93:1** (Pa11y), drawer "Request a Quote" CTA **3.93:1** (Pa11y). The fix is a **brand-colour change that alters desktop**. Several offenders are `aria-hidden` decorative (low SR impact); only the drawer CTA is a mobile-only element. → global brand-contrast decision.
2. **Render-blocking CSS + web-font, 78–94% unused CSS, 34–41% unused JS — [OWNER]** (Unlighthouse, all routes): fixing means code-splitting the 278 KB `index.css`, self-hosting/preloading Google Fonts, and chunking the 356 KB bundle — a **global build/architecture change**, not a mobile media query. Biggest perf lever, but out of the permitted class.
3. **Site-wide image over-delivery — [OWNER/partial]** (Unlighthouse `image-delivery`): hero webp, the `qfp-mark.png` 17 KB PNG on every route, what-we-print webps served larger than displayed. Responsive `srcset`/asset re-encoding is broad and mostly viewport-shared. *(The newsroom slice is actionable — Lane 1.)*
4. **`valid-source-maps` (all routes)** — source maps deliberately not deployed (source protection); Best-Practices weight 0. Won't act.
5. **Sanity CDN response headers** (cache/encoding) — not ours to set.
6. **Absolute throttled LCP/FCP (4–11 s) as a pass/fail verdict** — simulated Slow-4G worst case; the relative route ranking is the signal, not a per-item fix.
7. **TBT/TTI optimism** — Unlighthouse ran `cpuSlowdownMultiplier:1`; those numbers are a floor, not a defect. (LHCI uses the correct 4×.)
8. **Google Fonts as a third-party origin** — self-hosting is a build/brand decision. [OWNER]
9. **Third-party YouTube** — click-to-load; nothing loaded, nothing to fix.
10. **htmlcs "contrast indeterminate" warnings** (`G18.Alpha` 1,118×, `F24` 682×, `G18.Abs`, `G18.BgImage`) — "cannot compute", a manual-check worklist, not confirmed defects.
11. **htmlcs `H48` (nav-as-list), `1.4.10` (position:fixed reflow), `H67.2` (aria-hidden imgs)** — false-positives / intentional decorative markup.
12. **Globe renders WebGL on mobile (on scroll) — [OWNER]** — now lazy (done); *disabling* it on mobile removes the visual — a product decision.
13. **Any spacing/typography/colour change not scoped to a mobile `@media`** — design lock.

---

## 3. Remaining actionable items (ranked by user impact)

Severity = user-facing impact, not tool score.

| # | Item | Tool(s) | Routes | Severity | File territory |
|---|---|---|---|---|---|
| A | **Newsroom-article CLS ≈ 0.294** — unsized Sanity hero/related covers reflow the whole article (and shove the footer CTA) as they load | Unlighthouse (`cumulative-layout-shift` 0.294, `unsized-images`, `layout-shifts`) | all 6 articles | **HIGH** — visible content jump on every article open; worst CWV defect on the site | `src/pages/NewsroomArticle.jsx` (`.width(2000)` hero @197, related @92), `src/pages/NewsroomArticle.css` |
| B | **Certs residual +4px horizontal overflow** — hairline sideways scroll | This merge's **live check** (no tool measures overflow) | `/`, `/about`, `/infrastructure` | **LOW** — barely-perceptible rubber-band | `src/index.css` (`.certs-*` mobile block) |
| C | **Heading-order skip** — `h3` used where `h2` belongs | Unlighthouse (`heading-order`) **+** Pa11y (`G141`) | `/infrastructure` (`ib-intro-title` "Infrastructure"), `/newsroom` (`nr-card-title`), facility-open state (`ib-facpage-title`) | **LOW** — SR navigation only | `src/components/FacilityBook.jsx` (@580,@383), `src/pages/Newsroom.jsx` |
| D | **Certs cards: accessible name ≠ visible label** | Unlighthouse (`label-content-name-mismatch`) | `/`, `/about`, `/infrastructure` | **LOW** — SR confusion on the cert cards | `src/sections/Certifications.jsx` (@213 aria-label) |

*(Everything else the audits raise is in §2 or DEFERRED.)*

---

## 4. The plan — 3 lanes (+ DEFERRED)

Rules honoured: **anything touching `index.css` runs alone**; parallel lanes share zero files. All three are **mobile-scoped media queries or zero-pixel a11y edits** — none alters desktop design.

### Lane 1 — Newsroom-article CWV (CLS + slice of image-delivery)  ·  **HIGH** · difficulty **S–M**
- **Files:** `src/pages/NewsroomArticle.jsx`, `src/pages/NewsroomArticle.css` (isolated — no other lane touches these).
- **Fixes:** item **A**. Give the hero cover and related-card images an explicit `aspect-ratio` (16:9 / their intrinsic ratio) so space is reserved before load → CLS → ~0. While there, drop the hero `.width(2000)` over-request to a sane mobile width (trims the article's `image-delivery` waste too). End-state render is identical → desktop-safe.
- **Verify:** **NOT** `pnpm audit:lhci` — newsroom articles are excluded from the gate. Verify with a one-off Lighthouse/Playwright CLS measurement on an article URL (e.g. `/newsroom/printweek-power-100-2026`), confirming median CLS ≤ 0.02 and that the footer-CTA shift is gone. (Optionally add one article URL to `lighthouserc.json` temporarily for a spot check, then revert.)

### Lane 2 — Certs residual mobile overflow  ·  **LOW** · difficulty **S** · **RUNS ALONE (index.css)**
- **Files:** `src/index.css` only (the `.certs-viewport` / `.certs-track` / card mobile rules added by `a78f1ef`).
- **Fixes:** item **B** — trace the 4px poke (card box / negative-margin / scroller padding) and clip it under the existing ≤900px band so `scrollWidth == clientWidth`.
- **Verify:** Playwright at 390 px on `/`, `/about`, `/infrastructure` → `documentElement.scrollWidth === clientWidth`. `pnpm audit:lhci` will **not** catch this (Lighthouse has no horizontal-overflow audit) — live measurement is the only check; the gate's `/` byte-weight/CLS assertions still confirm nothing else regressed.

### Lane 3 — A11y semantics (zero visual change)  ·  **LOW** · difficulty **S** · JSX only
- **Files:** `src/components/FacilityBook.jsx`, `src/pages/Newsroom.jsx`, `src/sections/Certifications.jsx` (three separate components; no CSS, no `index.css`).
- **Fixes:** items **C** + **D** — correct the heading levels (styled by class, so no visual change) and make each cert-card's `aria-label` **contain** its visible title text (WCAG 2.5.3).
- **Care:** `FacilityBook` renders on **both** the homepage and `/infrastructure` — confirm the resulting heading hierarchy is valid on *both* before/after.
- **Verify:** re-run Lighthouse a11y on `/infrastructure` + `/newsroom` and confirm `heading-order` and `label-content-name-mismatch` pass. `pnpm audit:lhci` shows the `/infrastructure` a11y assertion (gate 0.93) rising toward 1.0; the other targets aren't gated URLs, so the gate alone is insufficient — pair it with a targeted a11y re-run.

**Lane parallelism:** 1 (page CSS/JSX) ∥ 3 (component JSX) share zero files; **2 runs alone** (index.css). Suggested order: **Lane 2 solo first** (owns the collision file), then **Lanes 1 + 3 in parallel**.

### DEFERRED — below the user-impact cut line (one line each)
- **Footer cert-logo `alt`** (Pa11y `H30.2`, 95×) — **axe passes these** (the link has `aria-label`); htmlcs is over-strict. Borderline; add descriptive `alt` in `CTAFooter.jsx` only if pursuing htmlcs-zero. `[CTAFooter.jsx]`
- **Contact native-`<select>` semantics** (Pa11y `H91` no-value, `H85` optgroup) — minor SR nicety; `optgroup` mildly alters the native picker. `[Contact.jsx]`
- **`/legal/cookies` table missing `<caption>`** (Pa11y `H39`) — add a Tailwind `sr-only` caption. `[LegalPage]`
- **Homepage/site image over-delivery** (Unlighthouse `image-delivery`, non-newsroom) — `qfp-mark.png`→optimized, responsive `srcset` on hero/what-we-print; broad, viewport-shared, low design risk but not critical. `[multiple]`

---

## UNCERTAIN

- **What causes the certs +4 px** exactly (card border/shadow vs. scroller negative-margin vs. sub-pixel padding) — confirmed it's inside `#certifications` (`.certs-track` right-edge 1592 is correctly clipped by the scroller, so the 4px is a *different* element); the precise culprit needs a per-element right-edge walk during Lane 2.
- **Whether sizing the newsroom hero image fully kills the 0.294 CLS**, or whether the "Let's Print Something That Matters" footer-CTA shift has an independent cause (font-swap reflow). Lane 1's verify step must confirm the footer shift resolves once the images reserve space; if not, a second (shared-footer) cause exists — and a footer fix would touch `CTAFooter` on **every** page (re-scope before touching it).
- **Button-system unification completeness** (UX §3): `100e608` unified the index.css-owned button parts, but the recon named three families (`hero-btn` 54px, `btn-nebula` 42px, `u-btn` 48px) partly in component files. Not re-audited this session — may be fully done or partially; a quick pass would confirm. Left out of the plan as presumed-DONE.
- **Heading-order fix safety on the homepage:** changing `FacilityBook`'s `h3`→`h2` is correct for `/infrastructure`, but the homepage embeds the same component in a different heading context — the resulting homepage hierarchy must be checked (it could introduce a *new* skip on `/`).
- **Contrast as owner-decision vs. mobile-scopable:** I placed all contrast in §2 because the elements render identically on desktop and a colour change is design-locked. A mobile-`@media` darkening *is* technically possible and would satisfy the permitted class, but it would leave desktop visibly inconsistent — flagged for the owner rather than silently split.
