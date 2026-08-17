# SEO Architecture Recon — Pick the Prerender Approach and Prove It
**Date:** 2026-08-15 · **Branch under test:** phase2-routing (untouched — see git status/log at both ends, bottom of report) · **Method:** four parallel engineering spikes run in isolated git worktrees (Options B, C, D actually built; code-splitting actually built), plus a real, temporarily-installed Apache HTTP Server (Apache Lounge httpd 2.4.68, via winget) used to test the `.htaccess` live rather than by simulation. Reference: `SEO-RECON-2026-08-15.md` §1, §8.

---

## Git status/log — start
```
Branch: phase2-routing
HEAD: ad22c47e3bc5c8f5fe91770903b07c8180cd14d2 "Fix facility deck spec-list row alignment on mobile"

 M src/pages/Contact.jsx
 M src/pages/OurStory.css
 M src/pages/PrintOnDemand.jsx
?? .lighthouseci/  ?? CONTENT-RECON-2026-08-11.md  ?? "FINAL ASSETS ARE HERE.zip"  ?? FINAL-FIX-PLAN-2026-08-10.md
?? MOBILE-RECON-2026-08-09.md  ?? MOBILE-UX-RECON-2026-08-09.md  ?? "NEW QFP AV.mp4"  ?? PA11Y-AUDIT-2026-08-10.md
?? RECON-2026-08-09.md  ?? SEO-RECON-2026-08-15.md  ?? "THE FINAL DESKTOP WEBSITE CHANGE/"
?? UNLIGHTHOUSE-AUDIT-2026-08-10.md  ?? "WhatsApp Image 2026-07-29 at 1.12.52 PM.jpeg"
?? _assets-in/ _assets-in2/ _lane1/…_lane7/ _recon/ _recon2/ _recon3/
?? drive-download-20260728T032950Z-1-001.zip  ?? site.zip
```

---

## 1. Constraints established

**React Router version: v6.30.4** (confirmed via installed `node_modules/react-router-dom/package.json`). React Router v7's built-in prerender (Option A) is **not applicable** — it doesn't exist in v6, and upgrading the router major version to unlock it is a separate, much larger migration than this recon is scoped to spike. Option A is dropped from consideration below without a build attempt, per the task's own instruction ("if v6, it isn't [an option]").

**Browser-only APIs at module scope / during initial render** — a first-pass static audit (grep across `src/`) found the pattern is, encouragingly, mostly disciplined: the large majority of `window`/`document`/`localStorage`/`IntersectionObserver` usage across ~22 files is either inside `useEffect`/event handlers (never runs during SSR) or explicitly guarded (`typeof window !== 'undefined'`). Three things stood out as candidate risk points going in, and the spikes below give the empirical answer for each:
- **`src/lib/smooth-scroll.jsx:30-34`** — `SmoothScrollProvider` (wraps the homepage) runs `if (!prepared.current) { ...; if (typeof window !== 'undefined' && window.scrollY > 0) window.scrollTo(0, 0); ScrollTrigger.getAll().forEach(t => t.kill()) }` **during render**, not inside an effect. `ScrollTrigger.getAll()` itself is unguarded. **Empirically resolved by Spike B: this does not crash SSR.** GSAP's ScrollTrigger detects the absence of a DOM and treats `getAll()` as a no-op, returning an empty array. Established fact now, not a hypothesis.
- **`gsap.registerPlugin(ScrollTrigger)` at module scope in 8 files** (`smooth-scroll.jsx` and 7 section/page files) — runs unconditionally on import in any environment. **Also confirmed harmless** by the same evidence: all three prerender spikes (B, C, D) built successfully with this pattern present, unmodified.
- **`src/components/Globe3D.jsx`** (`const Globe = lazy(() => import('react-globe.gl'))`, gated behind a client-only `IntersectionObserver` in `useEffect`) and **`src/components/GlobeFlyTo.jsx`** (dynamic `await import('maplibre-gl')` inside an effect) — confirmed never executed during any of the three server/build-time render passes. Already correctly isolated from the initial render path.

The one browser-API-adjacent finding that *does* matter turned out not to be a crash risk but a **content-completeness** risk instead (see next point).

**Sanity newsroom fetch timing: 100% runtime, client-side.** `src/pages/Newsroom.jsx` and `src/pages/NewsroomArticle.jsx` fetch from Sanity via `@sanity/client` inside `useEffect(() => { load() }, [load])` (see `src/lib/sanity.js`) — never at build time. This is the single fact that most determines which prerender approach is viable: **any renderer based on React's `renderToString` (Options A and B) never executes `useEffect`, so it can never see this content, full stop** — no timing tweak or wait strategy fixes it, because the fetch is never even initiated. A renderer that drives a real browser (Options C and D) *can* see it, because a real browser genuinely executes the effect — but only if the browser's environment can actually complete the fetch (see the CORS/Sanity-token finding under Spike D below, which turned out to be the actual determining factor in practice, not the rendering technology).

**Article route enumeration for prerendering:** there is no static list of newsroom slugs anywhere in the app — they only exist in the live Sanity dataset. The two viable approaches, both spiked successfully: (a) **crawl `/newsroom` for its own article links** after that page's fetch resolves (this is what Spike C's script does — zero coupling to Sanity's query API, automatically stays current), or (b) **query Sanity directly at build time** via `client.fetch('*[_type=="post"...].slug.current')` to get a slug list before rendering (needed for Option B/vite-react-ssg's `getStaticPaths` mechanism, which wants the route list before rendering starts). (a) is simpler and was proven in practice; (b) is unavoidable if Option B is ever taken further.

**i18n toggle and what a prerender should bake in:** confirmed EN is the correct, and only sensible, default to prerender — `src/i18n.js` already defaults to `'en'` when no `localStorage` value is present (exactly the state any prerender pass starts in), so no special-casing is needed. All three successful spikes (B, C, D) independently confirmed the client-side language toggle continues to work correctly after prerendering: `document.documentElement.lang` and the on-page copy both flip correctly to French on toggle, verified via Playwright on the actual generated output in every spike that got that far.

---

## 2. The four spikes — built, not reasoned about

### Option A — React Router v7 built-in prerender
**Not spiked.** Inapplicable per the constraint above (v6.30.4 installed). Not worth a version-upgrade detour inside this recon's scope.

### Option B — `vite-react-ssg`
**Built successfully. Verdict: viable infrastructure, but solves less than half the actual problem on its own.**

- Package note: latest `vite-react-ssg@0.9.2` requires Vite `^6/^7/^8`; this repo runs Vite `5.4.21`. Used `vite-react-ssg@0.8.9`, whose peers (`vite ^2‖3‖4‖5‖6‖7`) match cleanly.
- **No crashes.** Contrary to the pre-spike hypothesis, `ScrollTrigger.getAll().forEach(t=>t.kill())` running during render did not break the SSR pass (see §1).
- **Real body text is present and correct** for all 8 static + 4 legal pages — quoted directly from the generated files, e.g. `dist/about.html` carries the full ~1,795-word real page, not a shell.
- **Every `<title>`, meta description, canonical, and JSON-LD block is missing on every single route** — still the generic static `index.html` values everywhere. This is because `src/components/Seo.jsx` sets all of it inside a `useEffect`, and `renderToString` never runs effects. This is universal — it affects the homepage's `Organization`/`WebSite` schema and the Contact page's `FAQPage` schema exactly as much as every other page's basic meta tags.
- **Newsroom confirmed empty**, exactly as the constraints analysis predicted: `/newsroom` renders only its 6 skeleton-loader placeholders; the one article route attempted renders only a `"Loading"` state — zero real content, because the data fetch never fires under `renderToString`.
- **Hydration verified working correctly**: no hydration-mismatch warnings across 9 routes tested; Lenis, GSAP scroll-reveal, and the EN→FR language toggle all confirmed functioning post-hydration via Playwright.
- **Build time:** 71s vs. the plain-Vite baseline's ~53-59s (20-35% slower). Bundle size is not improved (slightly larger, in fact, from added router/head-management runtime) — **this option does nothing for the separately-spiked code-splitting/LCP problem; the two are unrelated fixes.**
- **Invasiveness:** genuinely low at the mechanical level — only `src/main.jsx` (bootstrap swap) and `src/App.jsx` (routes converted from JSX `<Routes>` to a data-router route array, which `vite-react-ssg` requires) needed changing. Zero component-level changes. But because these are the app's single entry points, the conversion is all-or-nothing — there's no way to run the old CSR bootstrap and the new SSG one side-by-side from one entry file, so `pnpm build`'s meaning would permanently change under this option.
- **What closing the real gap would require:** `vite-react-ssg` already ships a render-time-safe `<Head>` component (a react-helmet-async wrapper) specifically for this — so the path to fixing the metadata gap is known and not exotic, but it means rewriting every page's `<Seo ... />` call, not flipping a config flag. Newsroom needs a genuine data-loader rewrite (`Newsroom.jsx`/`NewsroomArticle.jsx` moved off `useEffect` onto react-router `loader`s) plus a build-time Sanity slug query for `getStaticPaths`. Both are real, scoped engineering tasks — not follow-up polish.

### Option C — Manual Playwright post-build prerender
**Built successfully. Verdict: the strongest option, and it closes both gaps Option B leaves open.**

- Script (`scripts/prerender.mjs`): drives real Chromium against the built `vite preview` output, discovers newsroom article slugs live by crawling `/newsroom` itself (no hardcoded slug list, no coupling to Sanity's query API), waits for network-idle plus a settle beat, and writes `page.content()` per route to `dist-prerendered/<route>/index.html`, mirroring the directory-per-route convention Apache/Vercel expect.
- **18/18 routes succeeded in 29.08s** of prerender-loop wall time (~1.6s/route).
- **Because this drives a real browser, `useEffect` genuinely fires** — and with a working Sanity read token present (see below), the newsroom article's `NewsArticle` JSON-LD, title, canonical, and full body were all captured correctly from the live CMS fetch, not a loading state. This is the concrete, evidenced advantage over Option B: it closes *both* of Option B's open gaps (metadata + newsroom) with the same one mechanism, because it isn't relying on `renderToString` at all.
- **Proof, quoted directly:** homepage, the site's thinnest real page (`/global-markets`), and the newsroom article all independently verified via plain `curl` (no JS) against the generated files, each carrying its own distinct, correct `<title>`, canonical, and JSON-LD. 18 generated files, 18 distinct MD5 hashes (the original recon found 1 identical hash across all 16 routes it tested).
- **A design catch worth keeping regardless of which option ships:** a naive version of this approach maps `/` → the homepage's own prerendered `index.html` and reuses that same file as the SPA-fallback target for unmatched paths — which would mean every typo'd URL serves the *homepage's* specific title/canonical/JSON-LD to a non-JS crawler, a subtler variant of the exact soft-404 problem this whole exercise exists to fix. The spike catches this and generates a separate, generic `app-shell.html` (the pristine pre-prerender shell — no canonical, no JSON-LD, generic title) as the dedicated fallback target instead. This distinction is carried through to the `.htaccess` in §3.
- **Hydration:** no React hydration in the strict sense is happening here (`src/main.jsx` uses `ReactDOM.createRoot`, not `hydrateRoot`) — the client does a full fresh mount on top of the prerendered HTML rather than reconciling against it. Functionally fine (confirmed zero console errors, GSAP/Lenis/language-toggle all working across 9 routes) but worth knowing: unlike Option B, this delivers zero savings in client-side render cost — it's purely a crawler-facing win, not a first-paint-speed win. (See §4 for the fix that *does* address paint speed.)
- **Files touched:** one new script (`scripts/prerender.mjs`) plus a new `public/.htaccess` (§3) and a `vercel.json` edit — no application code changed at all.

### Option D — Packaged prerender plugin (`@prerenderer/rollup-plugin`)
**Built successfully, but with two real bugs surfaced in the package itself. Verdict: do not use — Option C gives strictly more control for less risk.**

- Compatibility was fine (contrary to the pre-spike worry): `@prerenderer/rollup-plugin@0.3.12`'s peer dep `rollup: "^3||^4"` matches this repo's Rollup `4.62.2` exactly. The package's own README self-describes as "experimental"; last published 2024-05-21 (~2 years stale).
- **A real bug crashed the entire build on the first configuration tried.** Using the plugin's documented "smart wait" option (`renderAfterElementExists: 'link[rel="canonical"]'`) threw `Protocol error (Target.closeTarget): No target with given id found` and **wiped out the entire `dist/` output — zero HTML for any route**, not just the one that failed. Traced into the package's own compiled source: `renderer-puppeteer/dist/Renderer.js` has a literal typo (`waituntil` instead of `waitUntil`, silently defeating Puppeteer's network-idle wait) at line 115, and a double `page.close()` bug at lines 120-135 (closes once on the `waitForSelector` timeout path, then again in a `finally`, producing an unrelated protocol error instead of a useful one). Because the plugin's Rollup integration treats any render failure as a fatal build error, **one bad route takes down every route's output.**
- Had to fall back to a blunt, fixed 3-second delay (`renderAfterTime: 3000`) to get a build to complete at all — losing the entire point of a "wait until actually ready" strategy.
- **13/13 routes eventually built**, in **1m24s** (vite build phase) vs. the plain baseline's 55.3s (~52% slower) — the slowest of the three successful options.
- Static pages (`/about`, `/print-on-demand`): correct, real content/metadata, matching Option C's quality.
- `/newsroom` index: metadata present (its `<Seo>` call is unconditional regardless of fetch state) but body frozen at the 6-skeleton loading state.
- **`/newsroom/<slug>` (article): strictly worse than the unmodified shell.** Generic fallback `<title>`, canonical **missing entirely**, zero JSON-LD, zero H1 — because the component's loading-state branch doesn't render a `<Seo>` call at all. A crawler would see less here than it does today.
- **Root cause, verified, and reconciled against Spike C:** the Sanity fetch failed with a CORS error (`No 'Access-Control-Allow-Origin' header...`) from the prerender server's origin. This spike's worktree had **no Sanity read token configured** (`VITE_SANITY_READ_TOKEN` absent from its environment). Spike C's worktree, run separately, proactively sourced a working token before its run and succeeded at the exact same fetch. **This is not a real capability difference between Options C and D** — both drive a real browser and both could equally capture real newsroom content. It is a genuine, separate, load-bearing operational finding that applies regardless of which prerender option ships: **the build environment must have a valid `VITE_SANITY_READ_TOKEN` at prerender time, or newsroom content silently fails to prerender** (or, in Option D's case, fails *worse than doing nothing*, per the point above). This needs to be a hard requirement in whatever CI/build pipeline runs the chosen prerender step, not an assumption.
- **Hydration/client behavior:** same `createRoot`-not-`hydrateRoot` situation as Option C (mechanically the same category of tool); zero console errors on static pages; the newsroom CORS error reproduces identically on a normal, non-prerendered page load too (a live, pre-existing bug independent of this spike).
- **Tooling cost:** required its own dedicated Puppeteer-managed Chrome download (~170-300MB, ~1m40s) since this package family is hard-wired to Puppeteer, unable to reuse the Playwright browser cache already on this machine from every other spike.
- **Verdict, stated plainly:** the packaging bought nothing a self-owned ~100-line Playwright script doesn't already give with strictly more control (Option C: per-route wait logic, per-route failure isolation, reused browser cache, code you can actually read when it breaks) and none of the risk (a 2-year-stale "experimental" package with two confirmed real bugs found in a few hours of spiking, one of which silently defeats its own core safety feature and the other of which turns any single route's hiccup into a total build wipeout).

---

## 3. The serving problem — `.htaccess`, tested against real Apache, not simulated

Production is Hostinger/Apache static hosting. Generating `dist-prerendered/about/index.html` is worthless if `/about` still serves the old shell — Apache needs to be told to serve the real per-route files while still falling back to a working SPA (or a real 404) for anything else.

**This was tested against a real, temporarily-installed Apache 2.4.68** (Apache Lounge httpd, installed via `winget`, configured with `mod_rewrite`/`mod_dir` enabled and `AllowOverride All`, run against Spike C's actual generated `dist-prerendered/` output — not a synthetic fixture, not a logic-only simulation) — the user's explicit choice over a documentation-only verification, and it was the right call: **live Apache surfaced a real behavior that a hand-rolled Node re-implementation of the rewrite logic would have missed entirely** — see below.

### The deployed `.htaccess`
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  Options -MultiViews
  DirectoryIndex index.html

  # 1. Anything that already resolves to a real file OR directory is left
  #    completely alone — every static asset, and every prerendered route
  #    (each is a real directory containing its own index.html).
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 2. Everything else: hand off to the generic SPA shell (NOT the
  #    homepage's own prerendered file — see the design note in §2/Option C
  #    on why that distinction matters).
  RewriteRule ^ /app-shell.html [L]
</IfModule>
```

**Confirmed live, on real Apache, against the real generated output:**
- `GET /about` (no trailing slash) → **real HTTP 301** to `/about/`, then `/about/` → **200**, correct real content (`<title>Our Story | Quarterfold Printabilities, Since 2014</title>`). This 301 is Apache's own native `DirectorySlash` behavior (default `On`) — it fires because `/about` genuinely is a directory on disk. **A logic-only simulation checking `-f`/`-d` in plain Node code would have reported `/about → 200 direct` and missed this redirect hop entirely** — it doesn't know about `mod_dir`'s automatic canonicalization, because that's a real Apache module behavior, not filesystem logic. This is exactly the class of gap the user's choice to install real Apache was meant to catch, and it did.
- `GET /newsroom/printweek-power-100-2026` (nested route, no trailing slash) → 301 → 200, correct article title.
- `GET /this-is-fake` (unknown path) → **200**, generic `<title>Quarterfold Printabilities</title>` — the app-shell fallback, not the homepage's own metadata. Confirms the design catch from §2 holds on real Apache.
- `GET /` (homepage) → 200, its own specific title.
- Static asset (`/assets/*.js`) → 200, untouched, correct content-type.

**Practical implication for the canonical tag convention:** every canonical tag on this site currently uses the no-trailing-slash form (`https://quarterfoldltd.com/about`). Under this `.htaccess`, that exact URL now 301-redirects to the trailing-slash form before resolving. This is not broken — 301s pass full ranking signal and this is a completely standard pattern — but it does mean the canonical URL itself now points at a URL that immediately redirects rather than the final resolved one. Recommend deciding, as part of implementation (not as part of this recon), whether to update the canonical tags to the trailing-slash form to remove that one extra hop, or to accept it as-is; both are defensible, but it should be a decision, not an accident.

### Soft-404 feasibility — direct answer: **achievable, not structurally impossible**, confirmed live
A stricter variant, changing only the final fallback line:
```apache
RewriteRule ^ - [R=404,L]
```
with `ErrorDocument 404 /app-shell.html` set. **Verified live, against the same real Apache instance and the same real generated output:** unknown paths now return a genuine **HTTP 404** status (not a redirect — `[R=404]` with a `-` substitution drops the `Location` header entirely and routes through Apache's normal error-response path, confirmed against Apache's own `mod_rewrite` flag documentation and directly observed via `curl -D -` showing `HTTP/1.1 404 Not Found`), while still serving the on-brand app-shell body (which then boots the JS bundle, so a stale bookmark to a since-removed route still gets a working, client-rendered NotFound page — just now with a correct status code instead of 200). Real routes and real assets continue to return 200 exactly as before.

**The one condition this depends on, stated plainly (both spikes that reached this question converged on the identical answer independently):** this is only correct as long as `dist-prerendered/` is a complete, current mirror of every route the app actually serves. Apache has no way to distinguish "invalid path" from "valid React Router path that just hasn't been prerendered yet" — that distinction only exists in `App.jsx`'s route table. Once every real route is prerendered, anything left over genuinely is invalid, and the strict variant is correct. If a route is ever added to the app without the prerender step re-running before that deploy ships, that one new route will incorrectly 404 until the next prerender run — the mirror image of today's problem, not an elimination of every edge case. The only way to close this is process discipline: **make prerendering an unconditional, unskippable part of the build** (`"build": "vite build && node scripts/prerender.mjs"`), the same "keep the file list authoritative" discipline the original SEO recon already flagged as missing for `sitemap.xml`.

### What could not be verified even with real local Apache
- Hostinger's actual vhost-level `AllowOverride` setting (must permit `.htaccess` overrides at all — can't be inspected from this repo or this machine).
- Hostinger's specific Apache build/version and whether `DirectorySlash`/`mod_negotiation` defaults match the generic Apache 2.4 behavior tested here.
- **Recommendation, unchanged from before this deeper testing:** deploy to a Hostinger staging subdomain and re-run the same `curl` checks (documented above) before cutting production over — real local Apache closes most of the gap but a specific hosting provider's configuration is the one thing that genuinely can't be verified from here.

### `vercel.json` (only relevant if Vercel stays in play as a preview/staging target)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/app-shell.html" }
  ]
}
```
Verified against Vercel's own documentation (not assumed): Vercel's rewrites config explicitly gives "precedence... to the filesystem prior to rewrites being applied" — meaning, unlike Apache, no ordered per-asset rule list is needed; a real file in `dist-prerendered/` is always served directly regardless of rule order, and a single catch-all fallback is correct and sufficient. Also confirmed: with `trailingSlash` left unset, Vercel serves `/about` and `/about/` identically with **no forced redirect** — a genuine behavioral difference from Apache's automatic 301, worth knowing if Vercel and Hostinger both stay in the picture (they will not behave identically on this specific point without extra Vercel config).

---

## 4. Route-based code splitting — spiked, with a genuinely important verification catch

**Built successfully.** `src/App.jsx`'s 10 inner page imports converted to `React.lazy(() => import('@/pages/PageName'))` (catch-all `NotFound` left as a static import — no network round-trip needed for a route that's already the fallback), wrapped in a `<Suspense>` boundary placed around `<Outlet/>` + `CTAFooter` inside `SiteLayout.jsx` (keeping `SiteNav` always mounted).

**Bundle results (measured, not estimated):**
- Entry chunk: **1,165,111 B → 575,947 B** (−51%), gzip **367.56 KB → 187.64 KB**.
- Per-route initial JS+CSS: `/` 1,451 KB → 1,114 KB, `/contact` 1,451 → 854 KB, `/legal/privacy` 1,451 → 721 KB, `/fulfilment` 1,451 → 845 KB, `/infrastructure` 1,451 → 955 KB.

**A real, non-obvious bundling gotcha found and fixed along the way:** `SiteNav.jsx` had a static import of a scroll-helper function from `Home.jsx` — which forced Rollup to fold the *entire* homepage (the single largest page in the app) back into the shared entry chunk regardless of the `lazy()` conversion, silently defeating most of the intended benefit. Fixed by extracting the helper into its own module (`src/lib/wwp-scroll.js`); Home then split cleanly into its own 69.7 KB chunk. **This is exactly the kind of regression that would ship silently** if someone did the obvious `React.lazy()` conversion without checking actual post-build chunk composition — worth flagging for whoever implements this for real: verify the *chunk graph*, not just that the code compiles.

**Lighthouse, before → after (3-run medians, all 4 baseline routes):** performance scores 0.56→0.59, 0.66→0.70, 0.59→0.61, 0.62→0.62 — real, positive, but modest, consistent with code-splitting being a partial fix (LCP is still gated by render-blocking Google Fonts and the remaining shared bundle, both untouched by this change).

**GSAP/Suspense interaction:** a scripted 5-transition click-through (home→contact→infrastructure→about→fulfilment→home) with full console/error capture came back completely clean — 0 errors, 0 warnings, `window.__lenis` lifecycle (set on homepage mount, deleted on leaving it) behaving exactly as before. A separate bug in the reveal-animation re-arm logic (querying the DOM for `[data-reveal]` elements before lazy content had actually mounted on a fresh load) was found and fixed alongside this — not caused by lazy-loading itself, but only surfaced because lazy-loading changed the timing enough to expose it.

**CLS — this is the most important single finding in this whole section.** Lighthouse's own default (throttled mobile) run reported CLS holding at a clean 0 across all 4 routes, both before and after — which would normally be the end of the check. **It wasn't.** A raw, unthrottled `PerformanceObserver` check (not part of Lighthouse's own trace) found a real **~0.90 layout shift on every route's fresh load** — the nav painting before the lazy page chunk resolved, then the footer visibly popping in and shifting the page once it did. This was invisible to Lighthouse's specific throttling profile but very real. Root-caused via DOM-mutation and resource-timing tracing, and fixed by moving only `CTAFooter` (the actual in-document-flow element causing the shift) inside the Suspense boundary, while deliberately keeping the `position:fixed` `FloatingWhatsApp` and `CookieBanner` outside it (tested against three implementation variants to find this specific split). Raw CLS is now back to baseline-equivalent (~0.003-0.012) everywhere.

**The lesson this bakes into the recommendation below:** verifying a code-splitting change with a single default Lighthouse run is not sufficient — it can pass cleanly while shipping a real, user-visible CLS regression. Any real implementation of this needs the same raw-PerformanceObserver check this spike used, not just a Lighthouse score.

**Interaction with prerendering:** none identified as friction — `React.lazy()` still resolves to plain components that any of the prerender approaches above can render normally. Worth noting the other direction, though: this spike's own CLS finding is itself the textbook argument *for* prerendering — a prerendered page has its content already in the initial HTML, so there's no client-side chunk-resolution pop-in to cause this class of shift in the first place. The two fixes are complementary, and prerendering specifically would have prevented needing to hunt down this particular regression at all.

---

## 5. Soft 404s — answered above, restated directly

**Achievable**, once every valid route is prerendered as a real file — confirmed on real Apache, both the mechanism (`[R=404]`) and the exact HTTP status returned (`curl -D -` showing `HTTP/1.1 404 Not Found`). Not structurally impossible on static Apache hosting, contrary to the reasonable-sounding assumption that a pure static host "can't tell the difference." It can, but only because prerendering every route first is what gives Apache a complete, authoritative file list to check against — the fix for soft 404s and the fix for JS-only rendering are the same underlying change, not two separate projects. See §3 for the exact rule and its one operational precondition (prerendering must be unconditional in the build, or new routes will incorrectly 404 until the next prerender run).

---

## 6. Recommendation

**Adopt Option C (manual Playwright post-build prerender) as the serving mechanism, paired with the code-splitting change from §4, both gated on a hard build-time requirement for `VITE_SANITY_READ_TOKEN`.** Ordered by risk, against the alternatives actually built:

1. **Option D is eliminated on evidence, not preference.** Two real bugs were found in a few hours of spiking a 2-year-stale, self-described-"experimental" package, one of which silently defeats its own safety mechanism and the other of which turns any single route's failure into a total build wipeout. It offers strictly less control than Option C for more risk and slower builds. Discard.

2. **Option B (vite-react-ssg) is real, viable infrastructure — but adopting it alone would be a false fix.** It correctly resolves the "empty shell" problem for static/legal pages with the least code disruption of any option, and its build-time behavior is well-understood and low-risk (true `renderToString`, real `hydrateRoot` hydration, no crashes). But because `Seo.jsx` is entirely `useEffect`-driven, it leaves **every single page's title, description, canonical, and JSON-LD** — the SEO recon's other headline finding — completely unaddressed, and it leaves the newsroom entirely empty. Recommending this alone would report progress that isn't real progress on the metadata front. If the org later wants true SSR/hydration for its own sake (not just for crawlers), it remains on the table, but only bundled with the required `Seo.jsx` rewrite and a Newsroom loader rewrite as non-optional companion work — not as a smaller/cheaper substitute for Option C.

3. **Option C is the one that actually closes the loop, with the least new surface area.** Because it drives a real browser end-to-end, it is the only option that captured *everything* in one mechanism: real body text, real per-page metadata (title/description/canonical/JSON-LD), and real Sanity-fetched newsroom content — the last of these only once a valid read token was present, which is now a documented, checkable build requirement rather than a mystery failure. It required zero application code changes — only a new build-time script and hosting config. It produced the cleanest, most defensible `.htaccess`/soft-404 design (the `app-shell.html`-vs-homepage-file distinction), independently verified live on real Apache.

4. **Code-splitting (§4) is adopted regardless of which prerender option is chosen** — it's an orthogonal fix (bundle size / hydration cost vs. crawlability), it measurably helps LCP without regressing CLS *once the found regression is fixed*, and prerendering doesn't substitute for it (a prerendered page still ships and executes the same JS on the client). The one hard condition: whoever implements this must re-run the raw-PerformanceObserver CLS check from this spike, not just a single Lighthouse pass — that's the only thing standing between "measured win" and "silently shipped a 0.90 CLS regression."

### Lane plan
- **Lane 1 — Prerender pipeline (highest priority, unblocks everything else in the SEO recon's §1/§2/§3/§7 findings):** productionize `scripts/prerender.mjs` from the Spike C worktree, make it an unconditional step in `package.json`'s `build` script (not a separate/skippable command), and require `VITE_SANITY_READ_TOKEN` as a documented, checked build-time environment variable (fail the build loudly if it's absent, rather than silently shipping empty newsroom pages). Verification: re-run the original SEO recon's `curl`+MD5 check — every route should now return distinct, real content and metadata.
- **Lane 2 — Apache serving:** ship the `.htaccess` from §3 (the safe, app-shell-fallback variant first). Verification: the exact `curl` sequence run against real Apache in this report, repeated against a Hostinger staging subdomain before production cutover (the one gap even real local Apache couldn't close). Decide, as part of this lane, whether to keep or resolve the trailing-slash 301 behavior against the existing no-slash canonical convention.
- **Lane 3 — Soft-404 upgrade (can ship after Lane 1/2 are stable):** switch to the strict `[R=404]` variant only once Lane 1's "prerendering is unconditional in every build" guarantee is actually true and trusted — shipping this before that guarantee is solid would turn today's "everything is soft-200" problem into "new routes accidentally 404" instead.
- **Lane 4 — Code splitting:** ship the `App.jsx`/`SiteLayout.jsx`/`wwp-scroll.js` changes from Spike E's worktree, including its `AliveArmer` fix and the CTAFooter-only Suspense placement (not a naive whole-`<Routes>` wrap, which was the originally-suggested approach and would have kept the CLS regression). Verification: both a standard Lighthouse run *and* the raw-PerformanceObserver CLS check across all 4 baseline routes.
- **Needs an owner decision, not a further spike:** whether to pursue Option B's full metadata-rewrite path later for true SSR/hydration benefits (separate from crawlability, which Lane 1 already solves), and whether to keep the no-trailing-slash canonical convention or move to trailing-slash to match Apache's native behavior from Lane 2.

---

## Git status/log — end
```
Branch: phase2-routing
HEAD: ad22c47e3bc5c8f5fe91770903b07c8180cd14d2 "Fix facility deck spec-list row alignment on mobile"   ← IDENTICAL to start

 M src/pages/Contact.jsx
 M src/pages/OurStory.css
 M src/pages/PrintOnDemand.jsx
?? .lighthouseci/  ?? CONTENT-RECON-2026-08-11.md  ?? "FINAL ASSETS ARE HERE.zip"  ?? FINAL-FIX-PLAN-2026-08-10.md
?? MOBILE-RECON-2026-08-09.md  ?? MOBILE-UX-RECON-2026-08-09.md  ?? "NEW QFP AV.mp4"  ?? PA11Y-AUDIT-2026-08-10.md
?? RECON-2026-08-09.md  ?? SEO-RECON-2026-08-15.md  ?? SEO-ARCH-RECON-2026-08-15.md   ← this report, new, uncommitted
?? "THE FINAL DESKTOP WEBSITE CHANGE/"  ?? UNLIGHTHOUSE-AUDIT-2026-08-10.md
?? "WhatsApp Image 2026-07-29 at 1.12.52 PM.jpeg"
?? _assets-in/ _assets-in2/ _lane1/…_lane7/ _recon/ _recon2/ _recon3/
?? drive-download-20260728T032950Z-1-001.zip  ?? site.zip
```
**Confirmed identical to the start state** except for this one new, uncommitted report file. All four spike work happened in isolated git worktrees (`worktree-agent-*` branches, each forked from and fast-forwarded to `phase2-routing`'s own tip so the spikes exercised the real, current architecture) — all four worktrees and branches have been removed; `git worktree list` and `git branch -a` now show only the original branches. No commits were made on `phase2-routing` or anywhere else. Zero pushes.

**Machine state:** Apache Lounge httpd 2.4.68, installed via `winget` specifically for the live `.htaccess` verification in §3, has been uninstalled — package directory deleted, `PATH` entry removed, no processes running, test ports free. One cosmetic residual: `winget list` still shows the package as installed, because `winget uninstall` refuses to run against a user-scope package from this session's elevated context (a winget quirk, not a leftover file/process/service — verified there is none). Running `winget uninstall --id ApacheLounge.httpd` from a normal, non-administrator PowerShell window will clear that stale tracking entry if it matters; functionally nothing of the install remains.

---

## UNCERTAIN
- **Hostinger's actual server-level Apache config** (`AllowOverride` scope, exact Apache version/build, `mod_negotiation`/`DirectorySlash` defaults) — real local Apache testing closes most of the verification gap the original task asked about, but a specific hosting provider's vhost configuration is the one thing that cannot be checked from this machine. Staging-subdomain verification before production cutover remains the recommended final gate.
- **Whether to keep the no-trailing-slash canonical convention or switch to trailing-slash** to match Apache's native `DirectorySlash` redirect behavior discovered in §3 — a real, now-quantified trade-off, but a content/SEO-policy decision for the owner, not something further spiking resolves.
- **The four spike worktrees were all provisioned 473 commits behind `phase2-routing`'s actual tip** (missing Newsroom, GlobalMarkets, Globe3D/GlobeFlyTo, and the Sanity integration entirely) — each agent independently detected this and fast-forwarded its own isolated worktree branch to match, confirmed harmless to `phase2-routing` itself (verified above), but worth knowing this recon's evidence is against the current architecture only because each spike caught and corrected a stale starting point, not because the environment handed them the right one.
- **Whether `App.jsx`'s conversion to a data-router route array (needed for Option B) would conflict with anything else in a real, non-spike implementation** — the spike converted it cleanly, but this wasn't tested alongside the code-splitting change from §4 in the same build; the two were spiked in separate, independent worktrees. If Option B is ever pursued instead of/alongside Option C, re-verify the two changes compose correctly together.
- **Real-world CWV impact of Option C specifically** (as opposed to code-splitting, which was measured directly) was not independently re-measured with Lighthouse in this recon — Option C's benefit is crawler-facing (real HTML/metadata for non-JS clients), and Spike C's own testing focused on correctness of content/hydration rather than a before/after Lighthouse comparison. Recommend a follow-up Lighthouse pass once Lane 1 ships, if performance-score attribution between "prerendering" and "code-splitting" specifically matters to the owner.
- **Whether `www.quarterfoldltd.com` redirects to the apex domain** — flagged as unverified in the original SEO recon, still unverified here (unrelated to this task's scope, noted for completeness since it touches the same `.htaccess`/hosting layer).
