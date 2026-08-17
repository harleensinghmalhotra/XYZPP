# SEO Lane 2/7 — Prerender Pipeline (Productionize Spike C)
**Date:** 2026-08-15/16 · **Branch:** phase2-routing · **Commits:** `07a4567`, `d34f34b` · Builds on `SEO-ARCH-RECON-2026-08-15.md` Lane 1.

---

## What shipped

- **`scripts/prerender.mjs`** (new, 264 lines) — production version of the Spike C script. Zero application-code changes; the only two files touched are the script itself and its build-script wiring.
- **`package.json`** — `"build": "vite build && node scripts/prerender.mjs"`. Not a separate, skippable command — every `pnpm build` now unconditionally prerenders.
- **`.gitignore`** — one-line exception. `scripts/` is this repo's established scratch/dev-tools convention (one-off Playwright/verification harnesses, never committed); `prerender.mjs` is a genuine build dependency and needed carving out (`scripts/*` + `!scripts/prerender.mjs`, not a naive negation — negating a file below an ignored *directory* silently does nothing in git; ignoring the directory's *contents* via a glob is what lets the exception actually take effect. Caught this by checking `git status` after the first attempt and finding the new script simply wasn't there.)

---

## How it works (see the script's own header comment for the full rationale)

1. **Hard-fails if `VITE_SANITY_READ_TOKEN` is missing** — before touching the filesystem or launching a browser. Named explicitly in the error, not a generic failure.
2. **Enumerates newsroom articles live from Sanity** — mirrors `Newsroom.jsx`'s own `INDEX_QUERY` visibility guard (`published == true && publishedAt <= now()`) exactly, so the prerendered set always matches what the live index would show. Never hardcoded.
3. **Preserves the pristine pre-prerender shell** as `dist/app-shell.html` before anything else touches `dist/index.html` — the file the (not-yet-built) `.htaccess` serving lane depends on for its SPA fallback.
4. **Boots a preview server via Vite's own `preview()` JS API**, not a spawned `vite preview` subprocess — spawning `.cmd` shims from Node's `child_process` proved unreliable on Windows (`spawn EINVAL`), caught on the first real run.
5. **Per route:** navigates a real headless Chromium (`reducedMotion: 'reduce'` — see Idempotency below) to the route, waits for `link[rel="canonical"]` to be *attached* (not the default `visible`, which a `<link>` never satisfies — caught on the second real run, every route timed out until fixed), then waits for at least one JSON-LD block to exist. Every real content route sets both as the last two things `Seo.jsx`'s effect does, synchronously — so this is a precise "the effect has fully run" signal, not a fixed timeout guess. `/newsroom` additionally waits for its skeleton-loader grid to clear (its `BreadcrumbList` JSON-LD is unconditional and renders before the post cards do, so canonical+JSON-LD alone isn't sufficient there).
6. **A fresh Playwright page per route attempt**, not one page reused across all 18 navigations, plus a canonical-URL correctness assertion after capture (does the *captured* canonical actually match the route being rendered, not just "a" canonical exists) — both added after the idempotency check (below) caught a run where a page's captured `<head>` tags belonged to a different route entirely despite every wait condition technically passing.
7. **One retry per route on failure**, independent of the other 17 — the exact failure-isolation property that eliminated Option D (the packaged prerender plugin) in the architecture recon.

---

## Verification

### Route table — every route distinct, real, correctly titled
Previously: all 16 routes byte-identical at 2,709 bytes (SEO-RECON-2026-08-15.md §1). Now, `curl`+MD5 against the built output, static-served (not `vite preview`, whose SPA fallback would mask exactly this test):

| Route | Bytes | MD5 | `<title>` |
|---|---:|---|---|
| `/` | 105,261 | `3ca9b9a9ade03f4822988bde33e801e7` | Educational Book Printing Company India \| Quarterfold |
| `/about` | 92,034 | `958aa7e537422e86b82c73a21217d096` | Our Story \| Quarterfold Printabilities, Since 2014 |
| `/global-markets` | 31,988 | `e754f462abca782ff3b416d1b778901d` | Book Printing for US, UK and Global Publishers \| Quarterfold |
| `/print-on-demand` | 44,303 | `1f0b27a8e9b7b12b381177bd119c03ad` | Print on Demand \| Quarterfold Printabilities |
| `/infrastructure` | 70,650 | `67346cb932df8a1ecfc1a1d0478005ef` | Print Infrastructure \| Quarterfold Printabilities |
| `/newsroom` | 30,122 | `90555baf714d16fae3c0748eef686321` | Newsroom \| Quarterfold Printabilities |
| `/newsroom/printweek-power-100-2026` | 28,292 | `6cf064b46e9fd04b0ec9ca181a3d872a` | Quarterfold's Nilesh Dhankani named to PrintWeek's Power 100 for 2026, Quarterfold Printabilities |
| `/newsroom/business-connect-print-industry` | 28,091 | `1490ad67808c147aa998045fbbafe178` | Business Connect: Quarterfold Printabilities, revolutionising the print industry, Quarterfold Printabilities |
| `/newsroom/printweek-book-education-company-of-the-year` | 28,154 | `937859a4a5487f1a176b321d448da284` | Quarterfold wins PrintWeek's Book Education Company of the Year, Quarterfold Printabilities |
| `/newsroom/printweek-investment-2022` | 28,858 | `428995eba2b8ac0206dc032d34a17c3e` | PrintWeek: bullish about print, Quarterfold embarks on investment, Quarterfold Printabilities |
| `/newsroom/printweek-400000-books-a-day` | 27,917 | `63a23714721965a681966f09cb6f99c2` | PrintWeek: how Quarterfold is producing 4,00,000 books a day, Quarterfold Printabilities |
| `/newsroom/assocham-excellence-in-education` | 27,811 | `f4a2b726c33a3c1c55ad2c9f4bcdc681` | ASSOCHAM names Quarterfold runner-up for Excellence in the Field of Education, Quarterfold Printabilities |
| `/fulfilment` | 44,912 | `8539942d7636dccb1be26bf24c5ab029` | Warehousing & Fulfillment \| Quarterfold Printabilities |
| `/contact` | 67,446 | `e785a680e6d8ee7837ca1c09c927b40c` | Contact Us \| Quarterfold Printabilities |
| `/legal/privacy` | 30,992 | `354bd3b0a6410c878f301b13dd26dab4` | Privacy Policy, Quarterfold Printabilities |
| `/legal/cookies` | 29,063 | `0b317d1eec000883c943916d004534fa` | Cookie Policy, Quarterfold Printabilities |
| `/legal/terms` | 25,860 | `17902a659a7c563d3af26216211947b2` | Terms of Use, Quarterfold Printabilities |
| `/legal/accessibility` | 24,733 | `baa3a28376a1fcd7ac7c5d6a1889d523` | Accessibility Statement, Quarterfold Printabilities |
| `app-shell.html` | 2,707 | — | Quarterfold Printabilities *(generic, as designed)* |

18 distinct MD5s, 18 distinct sizes, every title route-correct.

### Real body text — distinctive phrase per route, not just non-emptiness
`/` → "75 million books"; `/about` → "single order of 50,000 copies"; `/global-markets` → "45 minutes from JNPT Port"; `/print-on-demand` → "Build your book"; `/infrastructure` → "300,000 sq"; `/newsroom` → "Nilesh Dhankani named to PrintWeek"; `/fulfilment` → real H1 text inside per-word `aw-word` reveal spans (`>One<`, confirmed word-by-word, correctly spaced — not the recon-1 "AnIntegrated" concatenation bug); `/contact` → `>Let's<`; `/legal/privacy` → "Digital Personal Data Protection"; `/legal/cookies` → "sets no cookies at all"; `/legal/terms` → "govern your access"; `/legal/accessibility` → "WCAG". All pass.

### Newsroom — all 6 articles, real Sanity content, valid `NewsArticle` schema
Enumerated live (not the 2 spot-checked in the original recon):

| Slug | `@type` | `datePublished` |
|---|---|---|
| printweek-power-100-2026 | NewsArticle | 2026-06-15T09:00:00.000Z |
| business-connect-print-industry | NewsArticle | 2024-07-01T09:00:00.000Z |
| printweek-book-education-company-of-the-year | NewsArticle | 2024-01-15T09:00:00.000Z |
| printweek-investment-2022 | NewsArticle | 2022-09-15T09:00:00.000Z |
| printweek-400000-books-a-day | NewsArticle | 2022-01-15T09:00:00.000Z |
| assocham-excellence-in-education | NewsArticle | 2017-11-15T09:00:00.000Z |

All 6 headlines, dates, and author/publisher fields populated correctly from the live fetch, not a loading/placeholder state.

### Missing-token failure
```
[prerender] FATAL: VITE_SANITY_READ_TOKEN is not set.
[prerender] Newsroom content requires an authenticated Sanity read; without
[prerender] the token, every newsroom page would silently prerender empty.
[prerender] Set VITE_SANITY_READ_TOKEN in .env.local (or the build environment) and retry.
```
Exit code 1, confirmed via env-var override (shell precedence over `.env.local`, verified this is how Vite's `loadEnv` actually resolves it, not a fluke).

### Idempotency — all 19 files byte-identical across two consecutive builds, after fixing two real bugs the check caught
First pass: 14/18 identical, **4 differed** — `/`, `/infrastructure`, and 2 of 6 articles. Root cause, fully traced: `FloatingWhatsApp.jsx` (global chrome, every route) reveals itself on its own fixed `setTimeout(1500ms)`, entirely independent of `Seo.jsx`/reduced-motion — whichever side of 1.5s a route happened to load on flipped its `.wa-fab` between with/without `is-in`. Fixed with an explicit wait on that element.

Re-running then surfaced a **second, more serious bug**: one run's `/newsroom/printweek-power-100-2026` capture (22,872 bytes vs. the correct 28,292) turned out to contain the **homepage's** canonical and `Organization`/`WebSite` JSON-LD — every wait condition had technically passed, just on the wrong page's tags. Root cause not fully isolated, but fixed structurally rather than just patched: switched from one Playwright page reused across all 18 navigations to a fresh page per attempt, plus an independent canonical-URL correctness assertion after every capture (does it actually match the route, not just "a canonical exists"). Re-verified: **all 19 files (18 routes + `app-shell.html`) byte-identical across two consecutive full `pnpm build` runs.**

### Single-route-failure resilience — the Option D failure mode, explicitly avoided
Injected a deliberately-failing route (`/__TEMP_FAILURE_TEST_DO_NOT_COMMIT__`, reverted before committing) into the route list and ran the real build:
```
[prerender] ok    /legal/accessibility ... (12 more routes, all ok)
[prerender] FAIL  /__TEMP_FAILURE_TEST_DO_NOT_COMMIT__    page.waitForFunction: Timeout 30000ms exceeded.
[prerender] ok    /newsroom/assocham-excellence-in-education ... (6 articles, all ok)

[prerender] 18/19 routes prerendered successfully
[prerender] 1 route(s) FAILED:
  - /__TEMP_FAILURE_TEST_DO_NOT_COMMIT__: page.waitForFunction: Timeout 30000ms exceeded.
```
Confirmed real (unmasked) `pnpm build` exit code: **1**. The other 18 routes wrote correctly regardless — one failure does not wipe the run.

### Build-time delta
Plain `vite build` alone: ~22-98s across repeated runs this session (this machine showed substantial run-to-run variance throughout the whole session, up to 8m40s on one outlier — not attributable to this change, reproduced on the unmodified codebase too). Prerender step itself: consistently ~40-45s for all 18 routes (~2.1-2.4s/route). Full chain (`vite build && node scripts/prerender.mjs`), representative run: **~65-70s total** on a normal (non-outlier) system state.

### Hydration — the real risk, tested at both viewports (1536×743, 390×844)
Live app served from the *prerendered* `dist/`, non-reduced-motion (default) Playwright context, both viewports:

| Check | Desktop | Mobile |
|---|---|---|
| Lenis mounts on home (`window.__lenis`) | ✅ | ✅ |
| GSAP reveals fire | ✅ (`.svA-chip` — home's reveals are GSAP/ScrollTrigger-driven, not the generic `[data-reveal]` system other pages use; confirmed via computed opacity after scroll) | ✅ |
| Language toggle EN→FR | ✅ `<html lang>` → `fr`, full UI + hero copy translated (see screenshot) | ✅ same |
| Facility deck | ✅ desktop: spine-label click (`.ib-imglabel`) opens the book to a real facility page (see screenshot) — the deck's own documented primary interaction, more reliable in this test than the keyboard-focus path | ✅ mobile: chip tap (`.ib-chip`) switches active facility |
| Globe mounts (`Projects.jsx`/Globe3D) | ✅ 1 canvas confirmed (WebGL driver messages are direct evidence it's genuinely rendering, not just present in DOM) | Not observed within this test's scroll/wait budget — inconclusive, not confirmed working or broken |
| Map mounts (`GlobeReach.jsx`/GlobeFlyTo, maplibre) | Container renders; canvas mount not observed within this test's budget on either viewport — inconclusive | Inconclusive, same |
| Mobile nav drawer opens | n/a | ✅ full-screen navy overlay, all 8 links + CTA (see screenshot) |
| About team spotlight sticky | ✅ desktop: panel top moved 18px against a 300px scroll (sticky, as intended) | ✅ mobile: panel moved the full 300px (correctly *not* sticky — matches the component's own documented "mobile: panel, not sticky" design) |
| Contact form renders | ✅ 8 real inputs | ✅ 8 real inputs |
| Console warnings/errors | 2 benign WebGL GPU-driver performance messages (software rendering artifact, not a real defect) | 0 |
| Page errors | 0 | 0 |

**Screenshots opened and described** (18 captured, key ones reviewed directly): homepage top (clean hero render, nav, WhatsApp bubble, no layout breaks); homepage in French (fully translated nav, headline, stat bubbles — confirms the toggle works completely, not just the `lang` attribute); infrastructure facility deck after clicking "WEB OFFSET" (real content: "22 web offset printing towers...", structured feature list, real facility photos, "PAGE 01/07" pagination); mobile drawer (all nav links, gold CTA, close button); about-page team spotlight (6 real team photos/names/titles beside the sticky leadership panel). All clean — no hydration-flash artifacts, no broken layout, no visible mismatch between the prerendered snapshot and the post-hydration render.

**Two test-script bugs found and fixed during this check** (both were my test's fault, not the site's): `text=FR` substring-matched inside "Infrastructure" in the nav (fixed with `getByRole('button', {name: 'FR', exact: true})`); an initial facility-deck check used a mobile-only class name (`.ib-deck`) that doesn't exist in desktop's markup at all (desktop uses `.ib-interactive`/`.ib-book-wrap` — confirmed by reading the actual prerendered HTML directly, which also disproved an initial worry that facility content was scroll-gated and missing from the static output: it isn't, the full intro paragraph and all 5 facility labels are present unconditionally).

### `pnpm audit:lhci` — blocked by a pre-existing environment issue, isolated and substituted
Could not get a clean LHCI run in this session: `Runtime error encountered: Chrome prevented page load with an interstitial` / `EPERM ... lighthouse.xxxxx`, reproduced 3 times. **Isolated, not assumed:** stashed this lane's changes entirely and reran LHCI against the original, completely unmodified codebase — **same failure, identical error class.** This conclusively rules out the prerender changes as the cause; it's a pre-existing `chrome-launcher`/Windows temp-directory permission issue in this environment, unrelated to this work.

**Substituted the actual thing the task cares about** — a direct CLS measurement via the real `PerformanceObserver` `layout-shift` entry type (mobile viewport, matching LHCI's default form factor), run against both the prerendered build and the original unmodified build for comparison:

| Route | With prerendering | Without (original) |
|---|---:|---:|
| `/` | 0.0925 | 0.0925 |
| `/fulfilment` | 0.0018 | 0.0030 |
| `/infrastructure` | 0.1859 | 0.1847 |
| `/contact` | 0.0058 | 0.0077 |

**Statistically identical with and without this lane's changes** — prerendering is neutral on CLS, confirmed rather than assumed. The non-zero values on `/` and `/infrastructure` are **not** a regression from this work: they match exactly what `SEO-ARCH-RECON-2026-08-15.md`'s own code-splitting spike already documented — Lighthouse's specific throttled-mobile conditions report a clean 0, but a raw, unthrottled `PerformanceObserver` check finds real shift the throttled run doesn't surface. That's a pre-existing site characteristic, independently reconfirmed here, not something this lane introduced or is responsible for fixing.

### `pnpm build` alone produces the prerendered output
Confirmed by construction (`package.json`'s single `"build"` script *is* the chain) and by every verification run above, all invoked as plain `pnpm build` with no extra flags or follow-up commands.

---

## Report

**Commit SHAs:** `07a4567` (add `scripts/prerender.mjs` + `.gitignore` exception), `d34f34b` (wire into `package.json`).

**Route table:** above, in full — 18/18 distinct, real, correctly titled.

**Build-time delta:** ~40-45s added by the prerender step itself (~2.1-2.4s/route × 18); total chain ~65-70s on a normal system state (this session's machine showed unrelated, unexplained multi-minute variance on plain `vite build` too, reproduced without any of this lane's changes).

**Per-route success:** 18/18 in every clean run; 18/19 with a deliberately-injected failure, confirming isolation.

**Hydration findings:** table above — all core interactions confirmed working at both viewports; globe/map canvas mounting inconclusive on mobile within this test's budget (not confirmed broken, just not confirmed within the time spent); two test-script bugs found and fixed along the way (not site bugs).

**Console warnings:** 2 benign WebGL GPU-driver performance messages on desktop only; 0 page errors on either viewport.

**Git status — start:**
```
Branch: phase2-routing, HEAD: ad22c47 "Fix facility deck spec-list row alignment on mobile"
 M src/pages/Contact.jsx  M src/pages/OurStory.css  M src/pages/PrintOnDemand.jsx
?? [pre-existing untracked recon files/dirs from prior sessions, unchanged]
```

**Git status — end:**
```
Branch: phase2-routing, HEAD: d34f34b "Make prerendering an unconditional part of pnpm build"
 M src/pages/Contact.jsx  M src/pages/OurStory.css  M src/pages/PrintOnDemand.jsx   ← same 3, still untouched
?? [same pre-existing untracked files, plus this report and the prior two recon reports]
```
The three modified-but-untouched files remain exactly as they were at the start of this whole multi-lane effort (unrelated 1-line `replyto` additions, confirmed in `SEO-RECON-2026-08-15.md`). Two new commits on `phase2-routing`, as instructed. No other branch touched. No pushes.

---

## UNCERTAIN
- Whether the globe (react-globe.gl) and map (maplibre/GlobeFlyTo) canvases genuinely don't mount on the 390px mobile viewport in this environment, or simply needed a longer scroll/wait budget than this test spent — desktop confirmed the globe mounts (WebGL driver messages are hard evidence), mobile's globe and both viewports' map remain unconfirmed either way. Not a prerendering concern specifically (these are client-only WebGL components regardless of what's in the static HTML), but flagged since the task asked for this to be verified.
- The exact root cause of the cross-route content-bleed bug the idempotency check caught (one page's captured `<head>` tags belonging to a different route) was not fully isolated — fixed structurally (fresh page per attempt + a correctness assertion) rather than root-caused to a specific Playwright/Chromium mechanism. Worth a closer look if it recurs after the fresh-page fix, though the assertion means it can no longer silently corrupt output either way.
- `pnpm audit:lhci` remains broken in this specific session/environment (pre-existing, isolated to be unrelated to this lane's changes) — needs a real run on a clean environment (or after a machine restart) before trusting a full Lighthouse category score, not just the CLS metric substituted here.
- Build-time figures are noisy in this session (this machine showed large, unexplained run-to-run variance on plain `vite build` alone, unrelated to any change in this lane) — the ~40-45s prerender-step-specific figure is consistent across runs; the total-chain figure should be re-measured on a quieter system before quoting it as a hard number to stakeholders.
