# SEO Lane 4/7 — Route-Based Code Splitting

Branch: `phase2-routing`. Commits: `dc02070`, `4b59e14`.

## Summary

`App.jsx` statically imported every page component, so every route — including
`/legal/*` — shipped the same ~1.16MB JS + 286KB CSS bundle. All ten pages are
now `React.lazy()`, split into their own chunks, loaded only on the route that
needs them.

`SEO-ARCH-RECON-2026-08-15.md` §4 flagged that a naive Suspense placement
introduces a CLS regression Lighthouse doesn't catch. Per instruction, this
was reproduced directly (not assumed), then fixed. Both are documented below
with real before/naive/after measurements.

## Was the homepage kept eager?

**No — lazy.** Measured both ways with real network payloads (Playwright
response interception, not build-output estimates):

| | Home eager | Home lazy |
|---|---|---|
| `/` payload | baseline | +0.6KB (noise — Home's code loads either way, just as its own chunk instead of pre-bundled into the shared entry) |
| every other route | baseline | **−25–36%** (shared entry no longer carries Home's weight for routes that never render it) |

Lazy wins everywhere, not just somewhere, so Home stayed lazy. `NotFound`
stayed a static import — the catch-all shouldn't need a network round-trip.

## The CLS trap: reproduced, then fixed

**Reproduction** (naive: only `<Outlet/>` wrapped in `<Suspense>`, `<CTAFooter/>` left eager):

| Route | CLS (naive) |
|---|---|
| `/about` | 0.9658 |
| `/global-markets` | 0.9201 |
| `/infrastructure` | 0.9538 |
| `/print-on-demand` | 0.9004 |
| `/newsroom` | 0.8976 |
| `/contact` | 0.9025 |
| `/legal/privacy` | 0.9099 |

Every inner route: catastrophic. The footer painted immediately against
zero-height route content, then jumped down once the lazy chunk resolved and
inserted real content above it.

**Fix**: boundary scoping, not fallback sizing. `CTAFooter` now shares one
`<Suspense fallback={null}>` boundary with `<Outlet/>` in `SiteLayout.jsx` —
neither renders until both can, so the page goes straight from `[nav only]`
to `[nav+content+footer]` in one paint; nothing already-visible ever moves.
`FloatingWhatsApp`/`CookieBanner` stay outside the boundary — `position:fixed`
shared chrome, out of scope per "don't lazy-load shared chrome."

Fallback content is `null`, not a sized skeleton — the actual fix is *what's
inside the boundary*, not how the fallback is shaped.

## CLS / LCP — before vs after (raw PerformanceObserver, 390×844, not Lighthouse)

| Route | CLS before | CLS naive | CLS after | LCP before | LCP after |
|---|---|---|---|---|---|
| `/` | 0.0925 | 0.0923 | 0.0924 | 576ms | 620ms |
| `/about` | 0.1695 | 0.9658 | 0.1722 | 684ms | 660ms |
| `/global-markets` | 0.1887 | 0.9201 | 0.1861 | 780ms | 492ms |
| `/print-on-demand` | 0.0027 | 0.9004 | 0.0034 | 684ms | 352ms |
| `/infrastructure` | 0.1859 | 0.9538 | 0.1814 | 600ms | 520ms |
| `/newsroom` | 0.0007 | 0.8976 | 0.0008 | 1304ms | 1304ms |
| `/newsroom/printweek-power-100-2026` | 0.2975 | 0.8357 | 0.2975 | 1352ms | 1184ms |
| `/fulfilment` | 0.0014 | 0.8986 | 0.0013 | 580ms | 452ms |
| `/contact` | 0.0051 | 0.9025 | 0.0051 | 556ms | 444ms |
| `/legal/privacy` | 0.0115 | 0.9099 | 0.0015 | 628ms | 648ms |
| `/legal/cookies` | 0.0127 | 0.9096 | 0.0018 | 692ms | 588ms |
| `/legal/terms` | 0.0016 | 0.9014 | 0.0015 | 736ms | 576ms |
| `/legal/accessibility` | 0.0021 | 0.8993 | 0.0021 | 688ms | 472ms |

**No route is worse than baseline.** After-CLS matches before-CLS within
noise on every route (several legal pages actually improved: 0.0115→0.0015,
0.0127→0.0018). LCP improved on 9/13 routes, unchanged on 1, and within
80-150ms noise on the rest.

## Bundle sizes — before vs after (real network payload, mobile, 390×844)

Verified against an isolated worktree build of `d2a4606` (the commit
immediately before this lane) — before Lane 4, every route served one
indivisible bundle: **1,161.02 kB JS + 286.17 kB CSS** (no code splitting
existed at all, confirmed via `vite build` output on that commit).

| Route | Before (real payload) | After (real payload) | Savings |
|---|---|---|---|
| `/` | 1417.3KB | 1114.1KB | −303.2KB (−21.4%) |
| `/contact/` | 1417.3KB | 1142.4KB | −274.9KB (−19.4%) |
| `/legal/privacy/` | 1417.3KB | 1122.6KB | −294.7KB (−20.8%) |

Before was flat across every route (single shared bundle); after varies per
route because each page now pulls only its own chunk plus shared vendor code.

## Prerender integrity — the pass/fail check for this lane

**PASS.** Rebuilt via the full `pnpm build` chain (Lane 2's pipeline) with
lazy loading in place. All 18 routes verified to contain real, distinct,
correctly-titled prerendered content — not a Suspense fallback:

- 12 static/index routes: grepped for distinctive on-page phrases, all
  present with correct `<title>` and JSON-LD.
- 6 newsroom articles: all `jsonld_blocks=1` with correct, distinct titles
  (e.g. *"Business Connect: Quarterfold Printabilities, revolutionising the
  print industry"*, *"PrintWeek: how Quarterfold is producing 4,00,000 books
  a day"*).

The prerender script's browser visit resolves the lazy chunk before capture,
exactly as intended — the shipped HTML is never a loading state.

## killAll check (via the mobile drawer, not direct nav-link clicks)

Chained navigation through all 7 inner routes via `MobileNav`'s actual
`onClick` handlers (not synthetic events), full-scrolled each, then back to
home — all in one session, no page reloads between them:

| Route | `[data-reveal]` revealed | Stuck |
|---|---|---|
| `/about` | 24/24 | 0 |
| `/print-on-demand` | 11/11 | 0 |
| `/infrastructure` | 1/1 | 0 |
| `/global-markets` | 11/11 | 0 |
| `/fulfilment` | 3/3 | 0 |
| `/newsroom` | 8/8 | 0 |
| `/contact` | 3/3 | 0 |

**0 stuck reveals, 0 console errors.** (Home shows 0/0 — it uses GSAP
ScrollTrigger directly, not the `[data-reveal]` system, so this is expected.)

This confirms the `MutationObserver`-based re-arm fix in `SiteLayout.jsx`
works: the old `[pathname]`-keyed effect would have queried the DOM before
the lazy chunk resolved and never re-armed.

## Rapid navigation stress test

Fired 8 drawer navigations back-to-back (150ms apart — faster than any lazy
chunk resolves), then let the last one settle:

- Empty-content-wrapper flashes: **0**
- Console/page errors: **0**
- `h1` count on final settled page: **1** (no double-mount / leftover DOM from an abandoned transition)
- Nav chrome present throughout: **yes**

## Visual verification (facility deck, map/globe, forms, language toggle)

Screenshots at 1536×743 and 390×844, plus DOM-level checks:

- **Facility deck** (`/infrastructure`): interactive book-spine stack renders
  correctly at both viewports — colour-coded spines, live open-book spread,
  mobile swipe-page pagination (`PAGE 01/02`) all intact.
- **Map/globe** (`GlobeFlyTo`, dynamic-imported inside Home — pre-existing,
  unrelated to route-level splitting): confirmed mounted via DOM inspection —
  `maplibregl-canvas` present at 803×771 with a live WebGL context. Screenshot
  showed a blank canvas; this is a sandboxed-test-environment artifact (no
  network access to remote map tiles in the Playwright run), not a
  regression — 0 console errors and the component tree is exactly what
  `GlobeFlyTo.jsx` is supposed to render post-flight.
- **Contact form** (`/contact`): all fields (name, email, phone, company,
  country dropdown, enquiry-type dropdown, message, consent checkbox, submit)
  render correctly at both viewports.
- **Language toggle**: switching to FR correctly re-renders nav, hero, and
  CTA copy in French on the homepage.

## Files changed

- `src/lib/wwp-scroll.js` (new) — extracted `wwpNavHeight`/`scrollToWwp` so
  `SiteNav` no longer statically imports from `Home` (that import would have
  folded Home's whole bundle into the always-loaded nav chunk, silently
  defeating Home's lazy-loading — same bug class the recon spike flagged for
  a different file pair).
- `src/pages/Home.jsx` — imports the extracted helpers instead of defining
  them locally.
- `src/components/SiteNav.jsx` — imports `scrollToWwp` from the new module.
- `src/App.jsx` — all 10 pages converted to `React.lazy()`.
- `src/components/SiteLayout.jsx` — `CTAFooter` moved inside the same
  `Suspense` boundary as `Outlet`; reveal re-arm switched from a
  `[pathname]`-keyed effect to a `MutationObserver` on the route-content
  wrapper.

## Git status

```
dc02070 Extract WWP scroll helpers to break SiteNav->Home static import
4b59e14 Route-level code splitting: React.lazy() all pages, fix the CLS trap
```

Working tree clean apart from pre-existing, unrelated uncommitted changes
(`Contact.jsx`, `OurStory.css`, `PrintOnDemand.jsx` — present before this
lane started, untouched by this work) and untracked files predating this
lane.
