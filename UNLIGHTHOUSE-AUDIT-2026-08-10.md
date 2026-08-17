# UNLIGHTHOUSE FULL-SITE MOBILE AUDIT — 2026-08-10

Read-only Lighthouse audit of the **production build** across all 18 routes, mobile emulation + throttling. **No source file was modified; this report is the only new file. No commits.**

- **Tool:** Unlighthouse `0.18.0` (CLI `unlighthouse-ci`) driving **Lighthouse `13.4.1`**, run via `pnpm dlx` (no repo dependency added — see the git-status proof at the end).
- **Target:** `vite build` → `vite preview` on `http://127.0.0.1:4319` (served the fresh `dist/`: main bundle `index-E8G4jWv9.js`, CSS `index-BogSZisJ.css`, globe chunk `react-globe.gl-DDxIhgPI.js`). **Dev server never used.**
- **Fetch time:** 2026-08-10T16:09Z. **Scan:** 18 routes in **195 s**, `samples: 1` (one run per route), `maxConcurrency: 2`.

## Emulation & throttling config it actually used

Confirmed a **phone + throttling** from each report's `configSettings`:

| Setting | Value | Meaning |
|---|---|---|
| `formFactor` | **mobile** | phone audit |
| `screenEmulation` | **412 × 823, DPR 1.75, mobile:true** | phone viewport |
| `emulatedUserAgent` | `…Android 11; moto g power (2022)… Chrome Mobile` | mid-range Android UA |
| `throttlingMethod` | **`simulate`** (Lighthouse Lantern) | metrics modelled from the trace + a simulated network graph |
| network throttling | **rttMs 150, downlink 1,638 Kbps, uplink 750 Kbps, requestLatency 600 ms** | ≈ Slow/Regular-4G |
| **`cpuSlowdownMultiplier`** | **1** | ⚠️ **CPU is NOT throttled** (default mobile preset is 4×). Host `benchmarkIndex` 1123. |

**Two methodology caveats that shape how to read the numbers:**

1. **CPU multiplier = 1.** TBT, TTI, Max-FID and main-thread-work are therefore **optimistic** — they reflect a fast host CPU, not a real Moto-G-class phone. That is why **TBT is ~0 ms almost everywhere**; on real mid-tier hardware it would be higher. Treat CPU-bound audits as a floor. LCP/FCP/Speed-Index/CLS are network- and layout-driven and are trustworthy relative to each other.
2. **`simulate` throttling** computes metrics from the trace, so the numbers are largely **insensitive to `maxConcurrency: 2` and to the host** for network-bound metrics — running two routes at once did not corrupt LCP/FCP. Absolute seconds are a **Slow-4G worst case**; most real users (wifi/good 4G) will see far less. The **relative ranking of routes** is the signal.

## Coverage — how the route set was guaranteed

The CLI `--urls` flag "disables the link crawler," so for **deterministic, complete** coverage I passed an **explicit 18-URL list** (Unlighthouse log: *"18 paths for scanning. Disabling sitemap, robots, sampling and crawler"*). The 6 real newsroom slugs were pulled live from Sanity (`published == true && publishedAt <= now()`), so **all 6 published articles** are audited — well past the "≥2 articles" ask.

**Crawler-reachability was verified separately by source** (so coverage never depended on a flaky crawl): both the footer ([`CTAFooter.jsx`](src/sections/CTAFooter.jsx) lines 45–53) and the mobile drawer ([`MobileNav.jsx`](src/components/MobileNav.jsx) lines 22–28) link **all seven** main routes — including **`/global-markets` and `/fulfilment`** — plus the four legal pages in the footer. A live crawl would reach every route; the explicit list just removes the risk.

**Expected set vs audited — all present:** `/`, `/about`, `/global-markets`, `/print-on-demand`, `/infrastructure`, `/newsroom`, **6** newsroom articles, `/fulfilment`, `/contact`, and the 4 legal pages = **18/18**. ✅

## git status — START (before this report was written)

`git status --porcelain` — **20 untracked items, nothing tracked modified**, `package.json` + `pnpm-lock.yaml` byte-identical to HEAD (`pkg 48420cc…`, `lock a804b82…`):

```
?? "FINAL ASSETS ARE HERE.zip"
?? MOBILE-RECON-2026-08-09.md
?? MOBILE-UX-RECON-2026-08-09.md
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

Unlighthouse itself was run from `pnpm dlx` with its config + output directory pointed **outside the repo** (session scratchpad); `dist/` is gitignored. END-state proof is at the very bottom.

---

## Headline scores — all 18 routes

Performance / Accessibility / Best-Practices / SEO (0–100), plus the five Core Web Vitals and the total initial (no-scroll) payload Lighthouse loaded. CWV cell = value. **Best-Practices and SEO are 100 on every route.**

| Route | Perf | A11y | BP | SEO | LCP | CLS | TBT | FCP | Speed Idx | Init payload |
|---|:--:|:--:|:--:|:--:|--:|--:|--:|--:|--:|--:|
| `/` Home | **62** | 100 | 100 | 100 | **9.0 s** | 0.005 | 90 ms | 4.7 s | 5.2 s | 1,807 KiB |
| `/about` | **66** | 100 | 100 | 100 | 4.5 s | **0.175** | 0 ms | 4.2 s | 4.2 s | 556 KiB |
| `/global-markets` | **86** | 100 | 100 | 100 | 3.3 s | 0 | 0 ms | 3.2 s | 3.2 s | 555 KiB |
| `/print-on-demand` | **72** | **96** | 100 | 100 | 4.7 s | 0.004 | 0 ms | 4.4 s | 4.4 s | 555 KiB |
| `/infrastructure` | **65** | **99** | 100 | 100 | **7.6 s** | 0 | 0 ms | 4.5 s | 4.5 s | 1,322 KiB |
| `/newsroom` | **76** | **98** | 100 | 100 | 4.8 s | 0.008 | 0 ms | 3.2 s | 3.2 s | 628 KiB |
| `/fulfilment` | **62** | 100 | 100 | 100 | **8.9 s** | 0 | 30 ms | 4.7 s | 5.5 s | **2,403 KiB** |
| `/contact` | **74** | 100 | 100 | 100 | 4.4 s | 0 | 0 ms | 4.3 s | 4.3 s | 555 KiB |
| `/legal/privacy` | **79** | 100 | 100 | 100 | 4.4 s | 0.002 | 0 ms | 3.2 s | 3.2 s | 555 KiB |
| `/legal/cookies` | **77** | 100 | 100 | 100 | 4.7 s | 0.015 | 0 ms | 3.2 s | 3.2 s | 555 KiB |
| `/legal/terms` | **77** | 100 | 100 | 100 | 4.7 s | 0 | 0 ms | 3.2 s | 3.2 s | 555 KiB |
| `/legal/accessibility` | **79** | 100 | 100 | 100 | 4.4 s | 0.002 | 0 ms | 3.2 s | 3.2 s | 555 KiB |
| `/newsroom/printweek-power-100-2026` | **58** | 100 | 100 | 100 | 5.5 s | **0.294** | 10 ms | 3.2 s | 3.2 s | 707 KiB |
| `/newsroom/business-connect-print-industry` | **58** | 100 | 100 | 100 | 5.6 s | **0.294** | 10 ms | 3.2 s | 3.2 s | 694 KiB |
| `/newsroom/printweek-book-education-company-of-the-year` | **58** | 100 | 100 | 100 | 5.6 s | **0.294** | 0 ms | 3.2 s | 3.2 s | 654 KiB |
| `/newsroom/printweek-400000-books-a-day` | **57** | 100 | 100 | 100 | 5.9 s | **0.294** | 30 ms | 3.2 s | 3.3 s | 735 KiB |
| `/newsroom/assocham-excellence-in-education` | **57** | 100 | 100 | 100 | 6.1 s | **0.296** | 0 ms | 3.2 s | 3.2 s | 761 KiB |
| `/newsroom/printweek-investment-2022` | **56** | 100 | 100 | 100 | 6.5 s | **0.294** | 0 ms | 3.2 s | 3.6 s | 965 KiB |

**Range:** Performance **56–86** (median ~66); Accessibility **96–100**; Best-Practices **100**; SEO **100**.
The two structural problems are visible already: **slow LCP/FCP everywhere** (worst on `/`, `/fulfilment`, `/infrastructure`) and **~0.294 CLS on every newsroom article**.

### The five CWV metric audits (Lighthouse's own descriptions)

These are the weighted inputs to the Performance score (LCP w25, TBT w30, CLS w25, FCP w10, Speed Index w10). Each is listed per route in the CWV table; descriptions here to avoid repetition:

- **`largest-contentful-paint`** — _Largest Contentful Paint marks the time at which the largest text or image is painted._
- **`first-contentful-paint`** — _First Contentful Paint marks the time at which the first text or image is painted._
- **`speed-index`** — _Speed Index shows how quickly the contents of a page are visibly populated._
- **`cumulative-layout-shift`** — _Cumulative Layout Shift measures the movement of visible elements within the viewport._
- **`total-blocking-time`** — _Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50 ms._

---

## Per-route detail — scores, CWV, and every failed / warned audit

For each route: the four scores, the CWV numbers (with each metric's Lighthouse 0–1 sub-score in parentheses), the failing metric audits, and the **full list** of every other failed/warned audit with the specific elements/files Lighthouse named. Audit descriptions are collected once in the **Audit glossary** that follows this section.

### `/` — Home

**Scores:** Performance **62** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 9.0 s (0.01) | 0.005 (1) | 90 ms (0.99) | 4.7 s (0.12) | 5.2 s (0.59) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 9.3 s (0.31).)_

**Failing metric audits (in CWV table above):** LCP (0.01), FCP (0.12), Speed Index (0.59), TBT (0.99)

**Other failed / warned audits (13):**

- **Minimize main-thread work** `mainthread-work-breakdown` — 3.2 s
    - 1208ms
    - 1075ms
    - 530ms
    - 375ms
    - 7ms
    - 6ms
    - 3ms
- **Elements with visible text labels do not have matching accessible names.** `label-content-name-mismatch`
    - Forest Stewardship Council FSC Licence TUVDC-COC-101258 Quarterfold Printabili…
    - Quality Management System ISO 9001:2015 Quarterfold Printabilities is ISO 9001…
    - Information Security Management System ISO/IEC 27001:2022 Quarterfold Printabi…
    - Ethical Trade Audit Sedex Quarterfold Printabilities is a member of Sedex (Sup…
    - Govt. of India Two Star Export House Quarterfold Printabilities holds two Star…
- **Improve image delivery** `image-delivery-insight` — Est savings of 698 KiB
    - Four children stand around a giant open book resting on a dotted world map. The… — /site-assets/homepage/hero/hero-main.webp — 214KB waste, 235KB
    - General Books — /site-assets/what-we-print/general-books.webp — 186KB waste, 222KB
    - Children's Books — /site-assets/what-we-print/children-books.webp — 146KB waste, 180KB
    - Educational Book Printing — /site-assets/what-we-print/educational.webp — 137KB waste, 169KB
    - header.site-header > div.mx-auto > a.focus-ring > img.h-12 — /site-assets/homepage/brand/qfp-mark.png — 16KB waste, 17KB
- **Render-blocking requests** `render-blocking-insight` — Est savings of 1,950 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 2KB, 942ms
    - /assets/index-BogSZisJ.css — 53KB, 907ms
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 121 KiB
    - /assets/index-E8G4jWv9.js — 121KB waste, 356KB, 34%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Forced reflow** `forced-reflow-insight`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Time to Interactive** `interactive` — 9.3 s
- **Image elements do not have explicit `width` and `height`** `unsized-images`
    - Four children stand around a giant open book resting on a dotted world map. The… — /site-assets/homepage/hero/hero-main.webp
- **Reduce unused CSS** `unused-css-rules` — Est savings of 40 KiB
    - /assets/index-BogSZisJ.css — 40KB waste, 52KB, 78%
- **Max Potential First Input Delay** `max-potential-fid` — 180 ms

---

### `/about` — About / Our Story

**Scores:** Performance **66** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.5 s (0.36) | 0.175 (0.69) | 0 ms (1) | 4.2 s (0.19) | 4.2 s (0.77) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.5 s (0.82).)_

**Failing metric audits (in CWV table above):** FCP (0.19), LCP (0.36), CLS (0.69), Speed Index (0.77)

**Other failed / warned audits (12):**

- **Elements with visible text labels do not have matching accessible names.** `label-content-name-mismatch`
    - Forest Stewardship Council FSC Licence TUVDC-COC-101258 Quarterfold Printabili…
    - Quality Management System ISO 9001:2015 Quarterfold Printabilities is ISO 9001…
    - Information Security Management System ISO/IEC 27001:2022 Quarterfold Printabi…
    - Ethical Trade Audit Sedex Quarterfold Printabilities is a member of Sedex (Sup…
    - Govt. of India Two Star Export House Quarterfold Printabilities holds two Star…
- **Render-blocking requests** `render-blocking-insight` — Est savings of 1,650 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 2KB, 963ms
    - /assets/index-BogSZisJ.css — 53KB, 754ms
- **Avoid large layout shifts** `layout-shifts` — 1 layout shift found
    - OUR STORY In 2014, Quarterfold Printabilities began with a single order of 50,…
- **Reduce unused CSS** `unused-css-rules` — Est savings of 44 KiB
    - /assets/index-BogSZisJ.css — 44KB waste, 52KB, 84%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 138 KiB
    - /assets/index-E8G4jWv9.js — 138KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Layout shift culprits** `cls-culprits-insight`
- **Forced reflow** `forced-reflow-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Minimize main-thread work** `mainthread-work-breakdown` — 2.8 s
    - 1141ms
    - 981ms
    - 512ms
    - 187ms
    - 9ms
    - 6ms
    - 3ms
- **Improve image delivery** `image-delivery-insight` — Est savings of 16 KiB
    - header.site-header > div.mx-auto > a.focus-ring > img.h-12 — /site-assets/homepage/brand/qfp-mark.png — 16KB waste, 17KB
- **Time to Interactive** `interactive` — 4.5 s

---

### `/global-markets` — Global Markets

**Scores:** Performance **86** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 3.3 s (0.69) | 0 (1) | 0 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 3.3 s (0.93).)_

**Failing metric audits (in CWV table above):** FCP (0.44), LCP (0.69), Speed Index (0.92)

**Other failed / warned audits (7):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 948ms
    - /assets/index-BogSZisJ.css — 53KB, 752ms
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 146 KiB
    - /assets/index-E8G4jWv9.js — 146KB waste, 356KB, 41%
- **Improve image delivery** `image-delivery-insight` — Est savings of 15 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Network dependency tree** `network-dependency-tree-insight`
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 94%
- **Time to Interactive** `interactive` — 3.3 s

---

### `/print-on-demand` — Print on Demand

**Scores:** Performance **72** · Accessibility **96** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.7 s (0.33) | 0.004 (1) | 0 ms (1) | 4.4 s (0.17) | 4.4 s (0.74) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.7 s (0.8).)_

**Failing metric audits (in CWV table above):** FCP (0.17), LCP (0.33), Speed Index (0.74)

**Other failed / warned audits (9):**

- **Background and foreground colors do not have a sufficient contrast ratio.** `color-contrast`
    - THE CONFIGURATOR
    - STEP 01
    - STEP 02
    - STEP 03
    - STEP 04
    - STEP 05
    - STEP 06
- **Render-blocking requests** `render-blocking-insight` — Est savings of 1,800 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 863ms
    - /assets/index-BogSZisJ.css — 53KB, 752ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 47 KiB
    - /assets/index-BogSZisJ.css — 47KB waste, 52KB, 89%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 142 KiB
    - /assets/index-E8G4jWv9.js — 142KB waste, 356KB, 40%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Network dependency tree** `network-dependency-tree-insight`
- **Minimize main-thread work** `mainthread-work-breakdown` — 2.6 s
    - 946ms
    - 867ms
    - 545ms
    - 191ms
    - 8ms
    - 6ms
- **Improve image delivery** `image-delivery-insight` — Est savings of 15 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
- **Time to Interactive** `interactive` — 4.7 s

---

### `/infrastructure` — Infrastructure

**Scores:** Performance **65** · Accessibility **99** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 7.6 s (0.04) | 0 (1) | 0 ms (1) | 4.5 s (0.15) | 4.5 s (0.72) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 7.7 s (0.45).)_

**Failing metric audits (in CWV table above):** LCP (0.04), FCP (0.15), Speed Index (0.72)

**Other failed / warned audits (11):**

- **Elements with visible text labels do not have matching accessible names.** `label-content-name-mismatch`
    - Forest Stewardship Council FSC Licence TUVDC-COC-101258 Quarterfold Printabili…
    - Quality Management System ISO 9001:2015 Quarterfold Printabilities is ISO 9001…
    - Information Security Management System ISO/IEC 27001:2022 Quarterfold Printabi…
    - Ethical Trade Audit Sedex Quarterfold Printabilities is a member of Sedex (Sup…
    - Govt. of India Two Star Export House Quarterfold Printabilities holds two Star…
- **Improve image delivery** `image-delivery-insight` — Est savings of 143 KiB
    - div.ib-interactive > div.ib-stack > div.ib-imgstack > img.ib-imgstack-photo — /site-assets/homepage/facility-book/book-stack.webp — 127KB waste, 153KB
    - header.site-header > div.mx-auto > a.focus-ring > img.h-12 — /site-assets/homepage/brand/qfp-mark.png — 16KB waste, 17KB
- **Render-blocking requests** `render-blocking-insight` — Est savings of 1,950 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 920ms
    - /assets/index-BogSZisJ.css — 53KB, 904ms
- **Heading elements are not in a sequentially-descending order** `heading-order`
    - Infrastructure
- **Reduce unused CSS** `unused-css-rules` — Est savings of 43 KiB
    - /assets/index-BogSZisJ.css — 43KB waste, 52KB, 82%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 138 KiB
    - /assets/index-E8G4jWv9.js — 138KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Time to Interactive** `interactive` — 7.7 s
- **Minimize main-thread work** `mainthread-work-breakdown` — 2.4 s
    - 991ms
    - 642ms
    - 563ms
    - 145ms
    - 7ms
    - 6ms
    - 2ms

---

### `/newsroom` — Newsroom (index)

**Scores:** Performance **76** · Accessibility **98** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.8 s (0.31) | 0.008 (1) | 0 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.8 s (0.79).)_

**Failing metric audits (in CWV table above):** LCP (0.31), FCP (0.44), Speed Index (0.92)

**Other failed / warned audits (9):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 883ms
    - /assets/index-BogSZisJ.css — 53KB, 902ms
- **Heading elements are not in a sequentially-descending order** `heading-order`
    - Quarterfold’s Nilesh Dhankani named to PrintWeek’s Power 100 for 2026
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 93%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 140 KiB
    - /assets/index-E8G4jWv9.js — 140KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Improve image delivery** `image-delivery-insight` — Est savings of 49 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
    - Quarterfold’s Nilesh Dhankani named to PrintWeek’s Power 100 for 2026 — https://cdn.sanity.io/images/z8o5rxfi/production/1c1023db21b59c19aa4345cccd4702bb016d04a6-1600x900.webp?w=800&auto=format — 10KB waste, 21KB
    - PrintWeek: bullish about print, Quarterfold embarks on investment — https://cdn.sanity.io/images/z8o5rxfi/production/8d0a8474a5d56a1c5effe44c73f2dab3b5bf34a2-1600x900.webp?w=800&auto=format — 9KB waste, 19KB
    - Business Connect: Quarterfold Printabilities, revolutionising the print industry — https://cdn.sanity.io/images/z8o5rxfi/production/645eb93aedd3f35efd77998ba7a92d4d037bde36-1600x900.webp?w=800&auto=format — 8KB waste, 16KB
    - Quarterfold wins PrintWeek’s Book Education Company of the Year — https://cdn.sanity.io/images/z8o5rxfi/production/230ee7f1fe097f2d37cca5d00fa125321a648f6f-1600x900.webp?w=800&auto=format — 7KB waste, 14KB
- **Time to Interactive** `interactive` — 4.8 s

---

### `/contact` — Contact

**Scores:** Performance **74** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.4 s (0.4) | 0 (1) | 0 ms (1) | 4.3 s (0.18) | 4.3 s (0.76) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.4 s (0.84).)_

**Failing metric audits (in CWV table above):** FCP (0.18), LCP (0.4), Speed Index (0.76)

**Other failed / warned audits (9):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 1,650 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 882ms
    - /assets/index-BogSZisJ.css — 53KB, 903ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 47 KiB
    - /assets/index-BogSZisJ.css — 47KB waste, 52KB, 89%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 133 KiB
    - /assets/index-E8G4jWv9.js — 133KB waste, 356KB, 37%
- **Improve image delivery** `image-delivery-insight` — Est savings of 15 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Forced reflow** `forced-reflow-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Time to Interactive** `interactive` — 4.4 s
- **Max Potential First Input Delay** `max-potential-fid` — 90 ms

---

### `/fulfilment` — Fulfilment

**Scores:** Performance **62** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 8.9 s (0.01) | 0 (1) | 30 ms (1) | 4.7 s (0.13) | 5.5 s (0.55) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 9.3 s (0.31).)_

**Failing metric audits (in CWV table above):** LCP (0.01), FCP (0.13), Speed Index (0.55)

**Other failed / warned audits (9):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 1,950 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 862ms
    - /assets/index-BogSZisJ.css — 53KB, 756ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 47 KiB
    - /assets/index-BogSZisJ.css — 47KB waste, 52KB, 90%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 137 KiB
    - /assets/index-E8G4jWv9.js — 137KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Forced reflow** `forced-reflow-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Time to Interactive** `interactive` — 9.3 s
- **Improve image delivery** `image-delivery-insight` — Est savings of 124 KiB
    - 04 — /site-assets/fulfilment/feature-04.webp — 108KB waste, 421KB
    - header.site-header > div.mx-auto > a.focus-ring > img.h-12 — /site-assets/homepage/brand/qfp-mark.png — 16KB waste, 17KB
- **Max Potential First Input Delay** `max-potential-fid` — 110 ms

---

### `/legal/accessibility` — Legal — Accessibility

**Scores:** Performance **79** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.4 s (0.4) | 0.002 (1) | 0 ms (1) | 3.2 s (0.45) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.4 s (0.84).)_

**Failing metric audits (in CWV table above):** LCP (0.4), FCP (0.45), Speed Index (0.92)

**Other failed / warned audits (7):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 871ms
    - /assets/index-BogSZisJ.css — 53KB, 902ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 94%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 147 KiB
    - /assets/index-E8G4jWv9.js — 147KB waste, 356KB, 41%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Network dependency tree** `network-dependency-tree-insight`
- **Improve image delivery** `image-delivery-insight` — Est savings of 15 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
- **Time to Interactive** `interactive` — 4.4 s

---

### `/legal/cookies` — Legal — Cookies

**Scores:** Performance **77** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.7 s (0.33) | 0.015 (1) | 0 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.7 s (0.8).)_

**Failing metric audits (in CWV table above):** LCP (0.33), FCP (0.44), Speed Index (0.92)

**Other failed / warned audits (7):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 863ms
    - /assets/index-BogSZisJ.css — 53KB, 903ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 94%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 147 KiB
    - /assets/index-E8G4jWv9.js — 147KB waste, 356KB, 41%
- **Improve image delivery** `image-delivery-insight` — Est savings of 15 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Network dependency tree** `network-dependency-tree-insight`
- **Time to Interactive** `interactive` — 4.7 s

---

### `/legal/privacy` — Legal — Privacy

**Scores:** Performance **79** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.4 s (0.4) | 0.002 (1) | 0 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.4 s (0.84).)_

**Failing metric audits (in CWV table above):** LCP (0.4), FCP (0.44), Speed Index (0.92)

**Other failed / warned audits (7):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 880ms
    - /assets/index-BogSZisJ.css — 53KB, 753ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 94%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 147 KiB
    - /assets/index-E8G4jWv9.js — 147KB waste, 356KB, 41%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Network dependency tree** `network-dependency-tree-insight`
- **Improve image delivery** `image-delivery-insight` — Est savings of 15 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
- **Time to Interactive** `interactive` — 4.4 s

---

### `/legal/terms` — Legal — Terms

**Scores:** Performance **77** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 4.7 s (0.33) | 0 (1) | 0 ms (1) | 3.2 s (0.43) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 4.7 s (0.8).)_

**Failing metric audits (in CWV table above):** LCP (0.33), FCP (0.43), Speed Index (0.92)

**Other failed / warned audits (7):**

- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 899ms
    - /assets/index-BogSZisJ.css — 53KB, 755ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 94%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 147 KiB
    - /assets/index-E8G4jWv9.js — 147KB waste, 356KB, 41%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Network dependency tree** `network-dependency-tree-insight`
- **Improve image delivery** `image-delivery-insight` — Est savings of 15 KiB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
- **Time to Interactive** `interactive` — 4.7 s

---

### `/newsroom/assocham-excellence-in-education` — Newsroom article — assocham-excellence-in-education

**Scores:** Performance **57** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 6.1 s (0.12) | 0.296 (0.4) | 0 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 6.1 s (0.63).)_

**Failing metric audits (in CWV table above):** LCP (0.12), CLS (0.4), FCP (0.44), Speed Index (0.92)

**Other failed / warned audits (11):**

- **Improve image delivery** `image-delivery-insight` — Est savings of 165 KiB
    - ASSOCHAM names Quarterfold runner-up for Excellence in the Field of Education — https://cdn.sanity.io/images/z8o5rxfi/production/a70ebd578bf0f0584e1631fd017c4bc058dff19c-1600x900.webp?w=2000&auto=format — 80KB waste, 90KB
    - ASSOCHAM Indiafrica “Champion in Biz” Awards, 2017 — https://cdn.sanity.io/images/z8o5rxfi/production/6b46309bfad0c85250cf95cd799e67bf5e4160ef-1400x933.webp?w=1600&auto=format — 47KB waste, 56KB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
    - Quarterfold’s Nilesh Dhankani named to PrintWeek’s Power 100 for 2026 — https://cdn.sanity.io/images/z8o5rxfi/production/1c1023db21b59c19aa4345cccd4702bb016d04a6-1600x900.webp?w=800&auto=format — 9KB waste, 21KB
    - ul.flex > li > a.block > img.h-11 — /site-assets/footer-certs/star-export-house.webp — 8KB waste, 9KB
    - Quarterfold wins PrintWeek’s Book Education Company of the Year — https://cdn.sanity.io/images/z8o5rxfi/production/230ee7f1fe097f2d37cca5d00fa125321a648f6f-1600x900.webp?w=800&auto=format — 6KB waste, 14KB
- **Avoid large layout shifts** `layout-shifts` — 3 layout shifts found
    - Let's Print Something That Matters Whether you need millions of textbooks for …
    - Cookie Policy
    - Let's Print Something That Matters
- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 872ms
    - /assets/index-BogSZisJ.css — 53KB, 905ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 93%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 139 KiB
    - /assets/index-E8G4jWv9.js — 139KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Layout shift culprits** `cls-culprits-insight`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Image elements do not have explicit `width` and `height`** `unsized-images`
    - ASSOCHAM Indiafrica “Champion in Biz” Awards, 2017 — https://cdn.sanity.io/images/z8o5rxfi/production/6b46309bfad0c85250cf95cd799e67bf5e4160ef-1400x933.webp?w=1600&auto=format
- **Time to Interactive** `interactive` — 6.1 s

---

### `/newsroom/business-connect-print-industry` — Newsroom article — business-connect-print-industry

**Scores:** Performance **58** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 5.6 s (0.17) | 0.294 (0.41) | 10 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 5.6 s (0.69).)_

**Failing metric audits (in CWV table above):** LCP (0.17), CLS (0.41), FCP (0.44), Speed Index (0.92)

**Other failed / warned audits (12):**

- **Improve image delivery** `image-delivery-insight` — Est savings of 99 KiB
    - Business Connect: Quarterfold Printabilities, revolutionising the print industry — https://cdn.sanity.io/images/z8o5rxfi/production/645eb93aedd3f35efd77998ba7a92d4d037bde36-1600x900.webp?w=2000&auto=format — 37KB waste, 42KB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
    - PrintWeek: how Quarterfold is producing 4,00,000 books a day — https://cdn.sanity.io/images/z8o5rxfi/production/77933c26dabe5e82e1511db60863219500e8e097-1600x900.webp?w=800&auto=format — 15KB waste, 35KB
    - Business Connect India, July 2024 — https://cdn.sanity.io/images/z8o5rxfi/production/926165d710473358322ff83f24d83a677699f3d7-1400x788.webp?w=1600&auto=format — 15KB waste, 18KB
    - PrintWeek: bullish about print, Quarterfold embarks on investment — https://cdn.sanity.io/images/z8o5rxfi/production/8d0a8474a5d56a1c5effe44c73f2dab3b5bf34a2-1600x900.webp?w=800&auto=format — 8KB waste, 19KB
    - ul.flex > li > a.block > img.h-11 — /site-assets/footer-certs/star-export-house.webp — 8KB waste, 9KB
- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 878ms
    - /assets/index-BogSZisJ.css — 53KB, 757ms
- **Avoid large layout shifts** `layout-shifts` — 1 layout shift found
    - Let's Print Something That Matters Whether you need millions of textbooks for …
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 93%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 139 KiB
    - /assets/index-E8G4jWv9.js — 139KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Layout shift culprits** `cls-culprits-insight`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Minimize main-thread work** `mainthread-work-breakdown` — 2.2 s
    - 788ms
    - 767ms
    - 355ms
    - 252ms
    - 7ms
    - 7ms
- **Image elements do not have explicit `width` and `height`** `unsized-images`
    - Business Connect India, July 2024 — https://cdn.sanity.io/images/z8o5rxfi/production/926165d710473358322ff83f24d83a677699f3d7-1400x788.webp?w=1600&auto=format
- **Time to Interactive** `interactive` — 5.6 s

---

### `/newsroom/printweek-400000-books-a-day` — Newsroom article — printweek-400000-books-a-day

**Scores:** Performance **57** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 5.9 s (0.14) | 0.294 (0.41) | 30 ms (1) | 3.2 s (0.44) | 3.3 s (0.91) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 5.9 s (0.66).)_

**Failing metric audits (in CWV table above):** LCP (0.14), CLS (0.41), FCP (0.44), Speed Index (0.91)

**Other failed / warned audits (13):**

- **Minimize main-thread work** `mainthread-work-breakdown` — 2.0 s
    - 768ms
    - 705ms
    - 289ms
    - 251ms
    - 8ms
    - 8ms
    - 2ms
- **Improve image delivery** `image-delivery-insight` — Est savings of 143 KiB
    - PrintWeek: how Quarterfold is producing 4,00,000 books a day — https://cdn.sanity.io/images/z8o5rxfi/production/77933c26dabe5e82e1511db60863219500e8e097-1600x900.webp?w=2000&auto=format — 77KB waste, 86KB
    - PrintWeek India, January 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/24da6f6608f48be0dbbcfc244a45a41d9b0920da-1400x788.webp?w=1600&auto=format — 29KB waste, 35KB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
    - PrintWeek: bullish about print, Quarterfold embarks on investment — https://cdn.sanity.io/images/z8o5rxfi/production/8d0a8474a5d56a1c5effe44c73f2dab3b5bf34a2-1600x900.webp?w=800&auto=format — 8KB waste, 19KB
    - ul.flex > li > a.block > img.h-11 — /site-assets/footer-certs/star-export-house.webp — 8KB waste, 9KB
    - Business Connect: Quarterfold Printabilities, revolutionising the print industry — https://cdn.sanity.io/images/z8o5rxfi/production/645eb93aedd3f35efd77998ba7a92d4d037bde36-1600x900.webp?w=800&auto=format — 7KB waste, 16KB
- **Avoid large layout shifts** `layout-shifts` — 2 layout shifts found
    - Let's Print Something That Matters Whether you need millions of textbooks for …
    - Let's Print Something That Matters
- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 870ms
    - /assets/index-BogSZisJ.css — 53KB, 759ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 93%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 139 KiB
    - /assets/index-E8G4jWv9.js — 139KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Layout shift culprits** `cls-culprits-insight`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Image elements do not have explicit `width` and `height`** `unsized-images`
    - PrintWeek India, January 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/24da6f6608f48be0dbbcfc244a45a41d9b0920da-1400x788.webp?w=1600&auto=format
- **Time to Interactive** `interactive` — 5.9 s
- **Max Potential First Input Delay** `max-potential-fid` — 70 ms

---

### `/newsroom/printweek-book-education-company-of-the-year` — Newsroom article — printweek-book-education-company-of-the-year

**Scores:** Performance **58** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 5.6 s (0.17) | 0.294 (0.41) | 0 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 5.6 s (0.69).)_

**Failing metric audits (in CWV table above):** LCP (0.17), CLS (0.41), FCP (0.44), Speed Index (0.92)

**Other failed / warned audits (12):**

- **Improve image delivery** `image-delivery-insight` — Est savings of 79 KiB
    - Quarterfold wins PrintWeek’s Book Education Company of the Year — https://cdn.sanity.io/images/z8o5rxfi/production/230ee7f1fe097f2d37cca5d00fa125321a648f6f-1600x900.webp?w=2000&auto=format — 33KB waste, 37KB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
    - PrintWeek India Awards, 2024 — https://cdn.sanity.io/images/z8o5rxfi/production/7f00901b00402448733d000b88100a3bc5edf824-1400x788.webp?w=1600&auto=format — 15KB waste, 18KB
    - Quarterfold’s Nilesh Dhankani named to PrintWeek’s Power 100 for 2026 — https://cdn.sanity.io/images/z8o5rxfi/production/1c1023db21b59c19aa4345cccd4702bb016d04a6-1600x900.webp?w=800&auto=format — 9KB waste, 21KB
    - ul.flex > li > a.block > img.h-11 — /site-assets/footer-certs/star-export-house.webp — 8KB waste, 9KB
- **Avoid large layout shifts** `layout-shifts` — 2 layout shifts found
    - Let's Print Something That Matters Whether you need millions of textbooks for …
    - Let's Print Something That Matters
- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 897ms
    - /assets/index-BogSZisJ.css — 53KB, 906ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 93%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 139 KiB
    - /assets/index-E8G4jWv9.js — 139KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Layout shift culprits** `cls-culprits-insight`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Minimize main-thread work** `mainthread-work-breakdown` — 2.1 s
    - 787ms
    - 709ms
    - 373ms
    - 233ms
    - 6ms
    - 6ms
- **Image elements do not have explicit `width` and `height`** `unsized-images`
    - PrintWeek India Awards, 2024 — https://cdn.sanity.io/images/z8o5rxfi/production/7f00901b00402448733d000b88100a3bc5edf824-1400x788.webp?w=1600&auto=format
- **Time to Interactive** `interactive` — 5.6 s

---

### `/newsroom/printweek-investment-2022` — Newsroom article — printweek-investment-2022

**Scores:** Performance **56** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 6.5 s (0.09) | 0.294 (0.41) | 0 ms (1) | 3.2 s (0.44) | 3.6 s (0.87) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 6.5 s (0.58).)_

**Failing metric audits (in CWV table above):** LCP (0.09), CLS (0.41), FCP (0.44), Speed Index (0.87)

**Other failed / warned audits (12):**

- **Improve image delivery** `image-delivery-insight` — Est savings of 341 KiB
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/74e2c476769d8f511e92e6e5014e0782102cf993-1400x788.webp?w=1600&auto=format — 112KB waste, 134KB
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/760cd924973c155ac59f4c26f51a25cdce3ecd64-1400x788.webp?w=1600&auto=format — 76KB waste, 90KB
    - PrintWeek: bullish about print, Quarterfold embarks on investment — https://cdn.sanity.io/images/z8o5rxfi/production/8d0a8474a5d56a1c5effe44c73f2dab3b5bf34a2-1600x900.webp?w=2000&auto=format — 47KB waste, 52KB
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/985d89f27992cae279b6c09832f734781beff522-1400x788.webp?w=1600&auto=format — 44KB waste, 53KB
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/2291427201be9b621697d7a8a5c133e675c38111-1400x788.webp?w=1600&auto=format — 33KB waste, 40KB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
    - ul.flex > li > a.block > img.h-11 — /site-assets/footer-certs/star-export-house.webp — 8KB waste, 9KB
    - Business Connect: Quarterfold Printabilities, revolutionising the print industry — https://cdn.sanity.io/images/z8o5rxfi/production/645eb93aedd3f35efd77998ba7a92d4d037bde36-1600x900.webp?w=800&auto=format — 7KB waste, 16KB
- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 858ms
    - /assets/index-BogSZisJ.css — 53KB, 756ms
- **Avoid large layout shifts** `layout-shifts` — 1 layout shift found
    - Let's Print Something That Matters Whether you need millions of textbooks for …
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 93%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 139 KiB
    - /assets/index-E8G4jWv9.js — 139KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Layout shift culprits** `cls-culprits-insight`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Minimize main-thread work** `mainthread-work-breakdown` — 2.4 s
    - 866ms
    - 823ms
    - 472ms
    - 259ms
    - 7ms
    - 7ms
- **Image elements do not have explicit `width` and `height`** `unsized-images`
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/74e2c476769d8f511e92e6e5014e0782102cf993-1400x788.webp?w=1600&auto=format
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/760cd924973c155ac59f4c26f51a25cdce3ecd64-1400x788.webp?w=1600&auto=format
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/2291427201be9b621697d7a8a5c133e675c38111-1400x788.webp?w=1600&auto=format
    - PrintWeek India, September 2022 — https://cdn.sanity.io/images/z8o5rxfi/production/985d89f27992cae279b6c09832f734781beff522-1400x788.webp?w=1600&auto=format
- **Time to Interactive** `interactive` — 6.5 s

---

### `/newsroom/printweek-power-100-2026` — Newsroom article — printweek-power-100-2026

**Scores:** Performance **58** · Accessibility **100** · Best-Practices **100** · SEO **100**

| LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|
| 5.5 s (0.18) | 0.294 (0.41) | 10 ms (1) | 3.2 s (0.44) | 3.2 s (0.92) |

_(metric cell = value (Lighthouse 0–1 sub-score); TTI 5.5 s (0.7).)_

**Failing metric audits (in CWV table above):** LCP (0.18), CLS (0.41), FCP (0.44), Speed Index (0.92)

**Other failed / warned audits (12):**

- **Improve image delivery** `image-delivery-insight` — Est savings of 127 KiB
    - Quarterfold’s Nilesh Dhankani named to PrintWeek’s Power 100 for 2026 — https://cdn.sanity.io/images/z8o5rxfi/production/1c1023db21b59c19aa4345cccd4702bb016d04a6-1600x900.webp?w=2000&auto=format — 56KB waste, 62KB
    - PrintWeek India, June 2026 — https://cdn.sanity.io/images/z8o5rxfi/production/0a5dd39b5c57b36993b0a96a33d23f43bbfc42da-1400x788.webp?w=1600&auto=format — 43KB waste, 51KB
    - section#contact > div.relative > div.mb-8 > img.h-16 — /site-assets/homepage/brand/qfp-mark.png — 15KB waste, 17KB
    - ul.flex > li > a.block > img.h-11 — /site-assets/footer-certs/star-export-house.webp — 8KB waste, 9KB
    - Quarterfold wins PrintWeek’s Book Education Company of the Year — https://cdn.sanity.io/images/z8o5rxfi/production/230ee7f1fe097f2d37cca5d00fa125321a648f6f-1600x900.webp?w=800&auto=format — 6KB waste, 14KB
- **Avoid large layout shifts** `layout-shifts` — 2 layout shifts found
    - Let's Print Something That Matters Whether you need millions of textbooks for …
    - Let's Print Something That Matters
- **Render-blocking requests** `render-blocking-insight` — Est savings of 600 ms
    - https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap — 1KB, 949ms
    - /assets/index-BogSZisJ.css — 53KB, 756ms
- **Reduce unused CSS** `unused-css-rules` — Est savings of 49 KiB
    - /assets/index-BogSZisJ.css — 49KB waste, 52KB, 93%
- **Reduce unused JavaScript** `unused-javascript` — Est savings of 139 KiB
    - /assets/index-E8G4jWv9.js — 139KB waste, 356KB, 39%
- **Missing source maps for large first-party JavaScript** `valid-source-maps`
- **Layout shift culprits** `cls-culprits-insight`
- **LCP request discovery** `lcp-discovery-insight`
- **Network dependency tree** `network-dependency-tree-insight`
- **Minimize main-thread work** `mainthread-work-breakdown` — 2.2 s
    - 765ms
    - 749ms
    - 400ms
    - 231ms
    - 7ms
    - 6ms
- **Image elements do not have explicit `width` and `height`** `unsized-images`
    - PrintWeek India, June 2026 — https://cdn.sanity.io/images/z8o5rxfi/production/0a5dd39b5c57b36993b0a96a33d23f43bbfc42da-1400x788.webp?w=1600&auto=format
- **Time to Interactive** `interactive` — 5.5 s

---

## Synthesis

### 1. The 10 site-wide findings, ranked by (routes affected × severity)

Every audit below except #10 fails on **all 18 routes**. "Severity" weights by score impact + actionability. Findings #1–#6 are **one causal chain**: a render-blocking, almost-entirely-unused global CSS file + a render-blocking Google-Fonts request delay first paint, which delays LCP, which drags TTI and Speed Index.

| # | Finding (audit id) | Routes | Severity | What Lighthouse names |
|---|---|:--:|---|---|
| **1** | **Slow Largest Contentful Paint** `largest-contentful-paint` | 18/18 | **Critical** — weight **25**, avg sub-score **0.25** | 4.4–**9.0 s**. Worst: `/` 9.0 s, `/fulfilment` 8.9 s, `/infrastructure` 7.6 s. The single biggest score drag. |
| **2** | **Render-blocking requests** `render-blocking-insight` | 18/18 | **Critical (root cause)** — est savings **600–1,950 ms** | Two culprits on every route: the **Google Fonts stylesheet** `fonts.googleapis.com/css2?family=Inter…` (~860–960 ms) **and `/assets/index-BogSZisJ.css`** (53 KB, 750–910 ms). Both sit in the critical path before first paint. |
| **3** | **Reduce unused CSS** `unused-css-rules` | 18/18 | **High** — **78–94 % of the stylesheet unused per route**, est savings 40–49 KB | `/assets/index-BogSZisJ.css` — e.g. `/legal/*` and `/global-markets` load 53 KB of CSS and use ~6 %. One monolithic global stylesheet ships to every route. Directly inflates finding #2. |
| **4** | **Reduce unused JavaScript** `unused-javascript` | 18/18 | **High** — est savings **121–147 KB (34–41 %)** | `/assets/index-E8G4jWv9.js` (356 KB transferred). One large bundle; a third of it is unused on any given route. |
| **5** | **Slow First Contentful Paint** `first-contentful-paint` | 18/18 | **High** — weight **10**, avg sub-score **0.35** | 3.2–4.7 s. Downstream of the render-blocking chain (#2/#3); fixing render-blocking moves this most. |
| **6** | **Improve image delivery** `image-delivery-insight` | 18/18 | **High** — est savings up to **698 KB** (`/`), 341 KB (`/newsroom/…investment-2022`) | Oversized delivery: homepage `hero-main.webp` (214 KB waste), `what-we-print/*.webp`; **Sanity article images requested at `?w=2000`** then displayed small; the `qfp-mark.png` logo (17 KB PNG, un-optimised) on **every** route; `/fulfilment` `feature-04.webp` (108 KB waste). |
| **7** | **Network dependency tree** `network-dependency-tree-insight` | 18/18 | Medium — critical-chain length | Chained critical requests (HTML → CSS/font → LCP image). Same root as #2. |
| **8** | **Time to Interactive** `interactive` | 18/18 | Medium — informative, weight 0 | Tracks LCP (3.3–9.3 s). Not a score input but confirms the paint delay. |
| **9** | **Speed Index** `speed-index` | 18/18 | Medium — weight 10, avg **0.84** (mostly OK) | 3.2–5.5 s. Only `/`, `/fulfilment` dip; elsewhere fine. |
| **10** | **Missing source maps** `valid-source-maps` | 18/18 | Low — **Best-Practices weight 0** (BP stays 100) | No source maps deployed for `index-E8G4jWv9.js`. See NOT ACTIONABLE. |

**Second tier (broad but not universal):** `mainthread-work-breakdown` (9 routes, ~2–3.2 s — Style & Layout dominates), `lcp-discovery-insight` (9), `unsized-images` (7 — newsroom articles + homepage hero), `layout-shifts`/`cls-culprits-insight` (7), `cumulative-layout-shift` (7, avg 0.45), `forced-reflow-insight` (4), `max-potential-fid` (4).

**The one-line takeaway:** the site's Best-Practices/SEO/Accessibility are excellent (100/100/≈100). The entire performance story is **(a) a render-blocking, 78–94 %-unused global CSS bundle + a render-blocking web-font**, and **(b) images delivered larger than displayed** — plus a **CLS problem isolated to newsroom articles** (below). None of it is payload-budget failure: `total-byte-weight` passes on all 18 routes.

### 2. Findings unique to one route (or one route-family)

- **`/print-on-demand` — colour contrast (only a11y < 100 cause here).** `color-contrast` fails on the configurator: **"THE CONFIGURATOR", "STEP 01"–"STEP 06"** labels lack a sufficient contrast ratio (weight 7 → drops a11y to **96**). This is the only route with a colour-contrast failure.
- **`/` Home — the only `total-blocking-time` dip** (90 ms → sub-score 0.99) and the only route with **90 ms TBT**; also the heaviest single script-driven main-thread total (3.2 s). Even so, near-perfect because of the CPU-multiplier-1 caveat.
- **`/fulfilment` — heaviest initial payload on the site: 2,403 KiB** (19 requests), driven by eager webp imagery (`feature-04.webp` 421 KB). Ties `/` for the worst LCP (8.9 s). The worst-performing *inner* page.
- **`/infrastructure` & `/newsroom` — `heading-order`** (weight 3 → a11y **99** / **98**): a heading level is skipped ("Infrastructure" eyebrow on infra; the article headline on the newsroom index). Only these two routes.
- **`/about` — CLS 0.175 from the "OUR STORY" timeline.** `layout-shifts` names the **"OUR STORY / In 2014, Quarterfold…"** block as the largest shift — the only non-article page with a meaningful CLS.
- **Newsroom articles (all 6) — CLS ≈ 0.294 (the site's worst).** `unsized-images` names the **Sanity CDN cover/related images** (`cdn.sanity.io/images/z8o5rxfi/…webp`) with no explicit width/height, and `layout-shifts` names the **"Let's Print Something That Matters"** footer CTA as it reflows in. This is uniform across every article and is the largest single defect Lighthouse surfaces that the recons did not.

### 3. Cross-check against our own recons

**MOBILE-RECON-2026-08-09.md — Lane 7 "media weight" (lazy globe / video): CONFIRMED SHIPPED. ✅**
The recon measured a **~8 MB cold homepage** (6 MB `how-we-work.mp4` + 1.82 MB globe JS + 1.39 MB earth texture). Lighthouse's homepage cold load is now **18 requests / 1,807 KiB**, and the network trace contains **zero `.mp4` requests and zero `globe`/`maplibre`/`earth`/`topology` requests** — `resource-summary` shows **Media: 1 request / 124 KB** (that is `page-turn.wav`, not video) and **Script: 1 request / 357 KB** (the main bundle only; the 1.9 MB globe chunk is absent). So the globe chunk and the 6 MB video are **fully deferred / below-the-fold and do not load on initial paint.** The weight-lane work is holding.
*Honest limit:* Lighthouse does not scroll, so it validates that nothing heavy loads **above the fold / on cold paint** — it cannot observe the on-scroll globe mount or the in-view video autoplay. But their **absence from the initial network** is exactly what "lazy" should produce, and it directly contradicts the pre-fix 8 MB figure.

**MOBILE-RECON §1 (Certifications overflow on `/`, `/about`, `/infrastructure`): component identity CONFIRMED from a different angle.** Horizontal overflow isn't a Lighthouse metric, so it doesn't appear as a score — **but** `label-content-name-mismatch` fails on **exactly those three routes** (`/`, `/about`, `/infrastructure`), naming the **FSC / ISO 9001 / ISO 27001 / Sedex / Two-Star-Export-House** certification cards. That is the same shared `Certifications.jsx` component the recon fingered, cross-confirming it renders on those three routes and nowhere else — and adding a *new* a11y defect (visible label ≠ accessible name) on top of the recon's layout bug.

**MOBILE-UX-RECON — heroes / spacing / nav:** out of Lighthouse's scope (it scores paint/a11y/SEO, not spacing rhythm or hero fill), so no confirm/deny. No overlap expected.

**MOBILE-RECON §5 (iOS zoom — 15 px/14 px form inputs):** **not surfaced** by this run. Lighthouse 13 has no font-size-on-input audit in the mobile config here, so this is neither confirmed nor denied — it remains a recon-only finding.

**New, beyond both recons:** (a) **newsroom-article CLS 0.294** from unsized Sanity images — neither recon flagged CLS; (b) the **render-blocking + 78–94 %-unused global CSS** chain as the dominant perf lever; (c) **`/print-on-demand` configurator colour-contrast**; (d) **`/fulfilment` 2.4 MB** eager imagery.

### 4. NOT ACTIONABLE (or won't-act, with reasoning)

- **`valid-source-maps` (all 18) — won't act, by choice.** Source maps are deliberately not deployed to production (shipping them exposes original source). Best-Practices weight is **0**, so it never lowered the score. Flagged for completeness only.
- **Sanity CDN response headers (caching / compression / encoding).** The *bytes* of article images are reducible on our side (request a smaller `?w=` and set dimensions — that IS actionable, see finding #6 and the newsroom CLS), but the CDN's cache-control/transfer-encoding headers are Sanity's to set, not ours.
- **Absolute LCP/FCP seconds (4–9 s) as a pass/fail verdict.** These are a **simulated Slow-4G worst case** under Lantern; real wifi/good-4G users see materially less. The **relative** ranking (which routes are slower, and why) is the actionable signal — the absolute red numbers are throttling, not a per-route bug to "fix to green."
- **TBT / TTI / Max-FID absolute values.** With `cpuSlowdownMultiplier: 1` the CPU wasn't throttled, so these are optimistic and shouldn't be read as "the site has no main-thread problem on phones." Re-run with a 4× multiplier before trusting TBT. (Methodology, not a site defect.)
- **Google Fonts as a *third-party origin*.** The render-blocking font request (#2) is genuinely actionable on our side (self-host, preconnect, or inline the tiny CSS), but the fact that it's served from `fonts.googleapis.com` — and the FOUT trade-off of deferring a brand font — is a **design decision**, not a code bug to auto-apply.
- **Third-party YouTube embeds:** *did not appear* in any trace — the infra/home YouTube sections are click-to-load, so there is no third-party YouTube cost to flag. (Noting the absence, since it's the canonical "not actionable" example.)

---

## Audit glossary — Lighthouse’s own descriptions

Each failing/warned audit id above, with the description Lighthouse ships for it (deduplicated across routes).

- **`cls-culprits-insight`** — Layout shift culprits  
  _Layout shifts occur when elements move absent any user interaction. Investigate the causes of layout shifts, such as elements being added, removed, or their fonts changing as the page loads._
- **`color-contrast`** — Background and foreground colors do not have a sufficient contrast ratio.  
  _Low-contrast text is difficult or impossible for many users to read. Learn how to provide sufficient color contrast._
- **`forced-reflow-insight`** — Forced reflow  
  _A forced reflow occurs when JavaScript queries geometric properties (such as offsetWidth) after styles have been invalidated by a change to the DOM state. This can result in poor performance. Learn more about forced reflows and possible mitigations._
- **`heading-order`** — Heading elements are not in a sequentially-descending order  
  _Properly ordered headings that do not skip levels convey the semantic structure of the page, making it easier to navigate and understand when using assistive technologies. Learn more about heading order._
- **`image-delivery-insight`** — Improve image delivery  
  _Reducing the download time of images can improve the perceived load time of the page and LCP. Learn more about optimizing image size_
- **`interactive`** — Time to Interactive  
  _Time to Interactive is the amount of time it takes for the page to become fully interactive. Learn more about the Time to Interactive metric._
- **`label-content-name-mismatch`** — Elements with visible text labels do not have matching accessible names.  
  _Visible text labels that do not match the accessible name can result in a confusing experience for screen reader users. Learn more about accessible names._
- **`layout-shifts`** — Avoid large layout shifts  
  _These are the largest layout shifts observed on the page. Each table item represents a single layout shift, and shows the element that shifted the most. Below each item are possible root causes that led to the layout shift. Some of these layout shifts may not be included in the CLS metric value due to windowing. Learn how to improve CLS_
- **`lcp-discovery-insight`** — LCP request discovery  
  _Optimize LCP by making the LCP image discoverable from the HTML immediately, and avoiding lazy-loading_
- **`mainthread-work-breakdown`** — Minimize main-thread work  
  _Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. Learn how to minimize main-thread work_
- **`max-potential-fid`** — Max Potential First Input Delay  
  _The maximum potential First Input Delay that your users could experience is the duration of the longest task. Learn more about the Maximum Potential First Input Delay metric._
- **`network-dependency-tree-insight`** — Network dependency tree  
  _Avoid chaining critical requests by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load._
- **`render-blocking-insight`** — Render-blocking requests  
  _Requests are blocking the page's initial render, which may delay LCP. Deferring or inlining can move these network requests out of the critical path._
- **`unsized-images`** — Image elements do not have explicit `width` and `height`  
  _Set an explicit width and height on image elements to reduce layout shifts and improve CLS. Learn how to set image dimensions_
- **`unused-css-rules`** — Reduce unused CSS  
  _Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. Learn how to reduce unused CSS._
- **`unused-javascript`** — Reduce unused JavaScript  
  _Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. Learn how to reduce unused JavaScript._
- **`valid-source-maps`** — Missing source maps for large first-party JavaScript  
  _Source maps translate minified code to the original source code. This helps developers debug in production. In addition, Lighthouse is able to provide further insights. Consider deploying source maps to take advantage of these benefits. Learn more about source maps._

---

## git status — END (after this report was written)

`git status --porcelain` — **21 items = the 20 START items plus this report and nothing else.** No tracked file was modified; `package.json` + `pnpm-lock.yaml` remain byte-identical to HEAD (`pkg 48420cc…`, `lock a804b82…`). Unlighthouse ran via `pnpm dlx` (temp store) with its config/output outside the repo; `dist/` is gitignored.

```
?? "FINAL ASSETS ARE HERE.zip"
?? MOBILE-RECON-2026-08-09.md
?? MOBILE-UX-RECON-2026-08-09.md
?? "NEW QFP AV.mp4"
?? RECON-2026-08-09.md
?? "THE FINAL DESKTOP WEBSITE CHANGE/"
?? UNLIGHTHOUSE-AUDIT-2026-08-10.md   ← this report (the only addition)
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

**Confirmation:** END is identical to START apart from `UNLIGHTHOUSE-AUDIT-2026-08-10.md`. No commits were made. `package.json` and `pnpm-lock.yaml` are byte-identical to HEAD.

*Read-only audit — findings only, no fixes applied.*
