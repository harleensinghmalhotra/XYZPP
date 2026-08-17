# SEO Lane 3/7 — Apache + Vercel Config for Prerendered Output
**Date:** 2026-08-16 · **Branch:** phase2-routing · **Commits:** `7a1a766`, `aaea6ac`, `d2a4606` · Builds on Lane 2 (`07a4567`, `d34f34b`) and `SEO-ARCH-RECON-2026-08-15.md` Part 3.

---

## What shipped

- **`public/.htaccess`** (new) — the safe (non-strict) routing policy from the architecture-recon spike, promoted into the repo so it ships in every build, plus a new www→apex canonicalization rule.
- **`vercel.json`** — fallback target fixed from `/index.html` (the homepage's own prerendered file) to `/app-shell.html` (the generic shell); added an `X-Robots-Tag: noindex` header across the board since Vercel is staging, not production.
- **`README.md`** — the "Deployment" section rewritten. It previously described Vercel as if it were production; it isn't (see below). Now documents the real Hostinger manual-deploy process explicitly.

Only these three files (plus this report) changed. Nothing in `src/`.

---

## A discrepancy worth stating plainly before anything else

`README.md`, before this lane, said: *"The site deploys to Vercel... Vercel runs `vite build` and serves `dist/`."* That's not what's actually running in production. The live site's own response headers (checked in `SEO-RECON-2026-08-15.md` and confirmed again here) are:
```
Server: LiteSpeed
platform: hostinger
panel: hpanel
```
**Hostinger is production. Vercel is not, and per this task's own framing, treated here as a staging/preview convenience instead** — the README was simply out of date, and this lane's docs update replaces the Vercel-only story with the real one rather than leaving it standing alongside a new, contradictory Hostinger section.

---

## Lane 2 output reality, confirmed before writing anything

`scripts/prerender.mjs` writes directly into `dist/` — `dist/index.html` (homepage), `dist/about/index.html`, `dist/newsroom/<slug>/index.html`, etc., plus `dist/app-shell.html`. **There is no `dist-prerendered/` directory** — that name was specific to the architecture-recon spike's own isolated worktree, not what the shipped pipeline produces. Every doc and comment in this lane's changes says `dist/`, and the README's deploy steps are written against that reality.

**`app-shell.html`, checked directly, is genuinely pristine:**
```
title: <title>Quarterfold Printabilities</title>
canonical present: false
og: tags present: false
twitter: tags present: false
json-ld present: false
```
Lane 2's script already produces this correctly — nothing needed adding to it.

---

## The final `.htaccess`, verbatim

```apache
# ─────────────────────────────────────────────────────────────────────────────
# Quarterfold Printabilities — Apache rewrite rules for the prerendered build.
#
# Ships from public/.htaccess, so it lands in dist/.htaccess on every `pnpm
# build` (scripts/prerender.mjs then prerenders every route into dist/ in
# place — see SEO-RECON-2026-08-15.md §1, SEO-ARCH-RECON-2026-08-15.md Part 3,
# and the SEO Lane 2 report for the full background). Deploy dist/ itself as
# Hostinger's public_html — do NOT look for a separate "dist-prerendered/"
# directory; that name was specific to the architecture-recon spike, not what
# the shipped pipeline actually produces.
#
# Background: every route used to serve one identical, empty
# `<div id="root"></div>` shell (index.html) regardless of the URL requested —
# confirmed byte-for-byte identical across all 16 routes tested in the
# original recon. The build now prerenders every real route into its own
# `<path>/index.html` with real, route-specific title/description/canonical/
# OG/JSON-LD. This file's only job is to make Apache serve those real files
# natively, instead of the previous behavior (effectively `RewriteRule ^
# index.html` for everything, which is functionally what vercel.json's
# unconditional catch-all rewrite still did before this same lane fixed it —
# see vercel.json in this repo for the equivalent policy on that platform).
#
# ── Policy, in priority order ──────────────────────────────────────────────
#   0. Canonicalize the host to the bare apex domain (see block below) —
#      independent of and prior to the routing policy.
#   1. A request that maps to a real FILE or DIRECTORY on disk is served
#      as-is, untouched, via Apache's own static-file + DirectoryIndex
#      handling. This covers every asset (/assets/*.js, /site-assets/*,
#      /qfp/*, /fonts/*, robots.txt, sitemap.xml, llms.txt) AND every
#      prerendered route (/about, /newsroom/<slug>, etc. — each is a real
#      directory containing its own index.html).
#   2. Anything else (no matching file or directory) falls through to
#      app-shell.html — the pristine, pre-prerender, route-agnostic SPA
#      shell (generic <title>, no canonical/OG/JSON-LD, just
#      <div id="root">) — NOT this deploy's homepage index.html. This lets
#      React Router's client-side "*" route (NotFound) or any brand-new,
#      not-yet-prerendered route still boot and render correctly. It
#      deliberately does NOT reuse the homepage's own prerendered
#      index.html as the fallback target: doing so would make every typo'd
#      or unknown URL serve homepage-branded <title>/canonical/JSON-LD to
#      any crawler that doesn't execute JS — a subtler variant of the same
#      soft-404 problem this file exists to reduce.
#
# This is the SAFE (non-strict) variant, verified live against a real local
# Apache install during the architecture-recon spike: every real route and
# every asset resolves correctly; unknown paths get a 200 with the generic
# app-shell.html, not a 404. A STRICTER variant exists (swap the final
# `RewriteRule ^ /app-shell.html [L]` for `RewriteRule ^ - [R=404,L]` plus
# `ErrorDocument 404 /app-shell.html`, also verified live in that spike) that
# turns unknown paths into a real HTTP 404 instead — deliberately NOT enabled
# here. That's a Lane 5 decision: it's only safe once prerendering is trusted
# to run on every deploy without exception (a route added to the app but not
# yet re-prerendered would otherwise 404 instead of falling through to a
# working shell). Do not flip this without re-reading that lane's reasoning.
# ─────────────────────────────────────────────────────────────────────────────

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # ── 0. Canonical host: www.quarterfoldltd.com -> quarterfoldltd.com ───────
  # Confirmed live (SEO-RECON-2026-08-15.md / CLAUDE-SEO-AUDIT-2026-08-15.md):
  # www.quarterfoldltd.com currently returns its own 200 rather than
  # redirecting to the apex — every canonical tag and every sitemap.xml <loc>
  # already uses the bare apex, so this makes the actual serving behavior
  # match what the site already claims as canonical everywhere else.
  # This rule only takes effect for requests that reach THIS vhost/document
  # root in the first place. It fixes the problem if (as is typical for
  # single-hosting-account setups like Hostinger) both quarterfoldltd.com and
  # www.quarterfoldltd.com already resolve in DNS to this same server/account
  # — the common case, and the one this rule assumes. If www is instead
  # pointed at a different server, CDN, or parking target at the DNS layer,
  # this rule is never reached for those requests at all, and the fix has to
  # happen at DNS / the hosting panel instead, not here. Verify which case
  # applies before assuming this alone closes the gap.
  RewriteCond %{HTTP_HOST} ^www\.quarterfoldltd\.com$ [NC]
  RewriteRule ^ https://quarterfoldltd.com%{REQUEST_URI} [L,R=301]

  Options -MultiViews
  DirectoryIndex index.html

  # ── 1. Never rewrite a request that already resolves to something real ────
  # -f = real file (an asset, or a prerendered route's own index.html once
  #      Apache has already resolved the directory case below).
  # -d = real directory (e.g. /about, /newsroom/printweek-power-100-2026).
  #      Matching here does NOT hand-roll a "/about -> /about/index.html"
  #      rewrite — that would fight Apache's own directory handling. Instead
  #      we stop rewriting entirely ([L] with a no-op "-" substitution) and
  #      let Apache's native DirectorySlash + DirectoryIndex machinery do what
  #      it always does for any directory on disk: redirect "/about" (no
  #      trailing slash) -> "/about/" (301, DirectorySlash, "On" by default),
  #      then serve DirectoryIndex's index.html for "/about/". Confirmed
  #      against Apache's own mod_dir docs — DirectoryIndex is only evaluated
  #      for directory requests that already carry the trailing slash, which
  #      is exactly what DirectorySlash's redirect guarantees. Verified live.
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # ── 2. Everything else: hand off to the SPA shell, not a 404 ──────────────
  # No real file/directory matched step 1 — either a not-yet-prerendered but
  # valid React Router path, or a genuinely invalid one. Either way, let the
  # client app decide (React Router's "*" -> NotFound for real 404s, with its
  # own <meta name="robots" content="noindex"> injected client-side).
  RewriteRule ^ /app-shell.html [L]
</IfModule>

# Deliberately NO "ErrorDocument 404" here: under this policy every request
# resolves to either a real file (step 1) or a 200 app-shell.html (step 2) —
# Apache never organically reaches its own 404 handling, by design. See the
# strict-variant note above for the alternative that changes this on purpose.
```

## The final `vercel.json`, verbatim

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/app-shell.html" }
  ]
}
```
No explicit per-asset-path ordering needed — Vercel's rewrites already defer to real files on disk by default (its own documented "filesystem prior to rewrites" precedence, confirmed in the architecture recon, not assumed here).

---

## Verification — real Apache, not `vite preview`

Reinstalled Apache Lounge httpd 2.4.68 (the same tool used in the architecture-recon spike; fully removed again at the end — see Git/machine status below), pointed its document root **directly at `dist/`** (the actual build output, not a copy), and tested against it.

### Route table
Every route requested with `Host: quarterfoldltd.com` (this vhost isn't name-based, so this only mattered for the www-redirect test below):

| Route | Status | `<title>` |
|---|---:|---|
| `/` | 200 | Educational Book Printing Company India \| Quarterfold |
| `/about` | 301 → `/about/` | — |
| `/about/` | 200 | Our Story \| Quarterfold Printabilities, Since 2014 |
| `/global-markets/` | 200 | Book Printing for US, UK and Global Publishers \| Quarterfold |
| `/print-on-demand/` | 200 | Print on Demand \| Quarterfold Printabilities |
| `/infrastructure/` | 200 | Print Infrastructure \| Quarterfold Printabilities |
| `/newsroom/` | 200 | Newsroom \| Quarterfold Printabilities |
| `/newsroom/printweek-power-100-2026/` | 200 | Quarterfold's Nilesh Dhankani named to PrintWeek's Power 100 for 2026, Quarterfold Printabilities |
| `/newsroom/business-connect-print-industry/` | 200 | Business Connect: Quarterfold Printabilities, revolutionising the print industry, Quarterfold Printabilities |
| `/newsroom/printweek-book-education-company-of-the-year/` | 200 | Quarterfold wins PrintWeek's Book Education Company of the Year, Quarterfold Printabilities |
| `/newsroom/printweek-investment-2022/` | 200 | PrintWeek: bullish about print, Quarterfold embarks on investment, Quarterfold Printabilities |
| `/newsroom/printweek-400000-books-a-day/` | 200 | PrintWeek: how Quarterfold is producing 4,00,000 books a day, Quarterfold Printabilities |
| `/newsroom/assocham-excellence-in-education/` | 200 | ASSOCHAM names Quarterfold runner-up for Excellence in the Field of Education, Quarterfold Printabilities |
| `/fulfilment/` | 200 | Warehousing & Fulfillment \| Quarterfold Printabilities |
| `/contact/` | 200 | Contact Us \| Quarterfold Printabilities |
| `/legal/privacy/` | 200 | Privacy Policy, Quarterfold Printabilities |
| `/legal/cookies/` | 200 | Cookie Policy, Quarterfold Printabilities |
| `/legal/terms/` | 200 | Terms of Use, Quarterfold Printabilities |
| `/legal/accessibility/` | 200 | Accessibility Statement, Quarterfold Printabilities |

All 18 correct, real, distinct.

### Assets — correct content-types
`/assets/index-*.js` → `text/javascript`; `/site-assets/homepage/certifications/fsc.webp` → `image/webp`; `/qfp/brand/qfp-mark.png` → `image/png`; `/fonts/Metrisch-Book.otf` → `font/otf`; `/robots.txt` → `text/plain`; `/sitemap.xml` → `application/xml`; `/llms.txt` → `text/plain`. All correct, all 200.

### Unknown URL (`/does-not-exist`) — the head, pasted in full
```
HTTP/1.1 200 OK
Content-Length: 2709
Content-Type: text/html
```
```html
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0F2444" />
    <script>/* LCP-image preload script, unchanged */</script>
    <link rel="icon" type="image/png" href="/qfp/brand/qfp-mark.png" />
    <meta name="description" content="Quarterfold Printabilities — powering global education through print. Book printing, publishing and fulfilment at scale." />
    <title>Quarterfold Printabilities</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:..." rel="stylesheet" />
    <script type="module" crossorigin src="/assets/index-BUt4Ly5s.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DsnnnCtG.css">
  </head>
```
Confirmed programmatically, not just by eye: `canonical present: false`, `json-ld present: false`, `og: tags present: false`. Generic title, no homepage-branded anything — exactly the point of not falling back to `index.html`.

### Trailing-slash and case variants
| Request | Result |
|---|---|
| `/about` | 301 → `/about/` → 200 |
| `/about/` | 200 direct |
| `/newsroom/printweek-power-100-2026` | 301 → `.../` → 200 |
| `/newsroom/printweek-power-100-2026/` | 200 direct |
| `/About`, `/ABOUT/`, `/About/` | All resolved to the real About content on this test box |

**Caveat on the case-variant result, stated honestly:** this Apache instance is running on Windows/NTFS, which is case-*insensitive* by default — `/About/` and `/about/` are the same file to the filesystem here, which is why they all matched. **Hostinger's actual hosting is Linux**, where the filesystem is case-*sensitive* — a case-mismatched URL there would **not** match the `about/` directory and would instead fall through to `app-shell.html` (still a safe 200 with a working, JS-bootable shell — not a broken outcome, just not "the real content" the way this Windows test shows). Every internal link and every `sitemap.xml` entry on this site already uses consistent lowercase paths, so this shouldn't matter in practice — flagging it so the Windows test result isn't mistaken for proof of Linux behavior it can't actually demonstrate.

### Client-side navigation after a deep link — screenshots
Loaded `/contact/` directly (cold load, real Apache, mobile viewport), opened the mobile drawer, clicked "About Us":
- **Total full-page loads for the whole sequence: 1** — only the initial `/contact/` request. The drawer navigation to `/about` was confirmed pure client-side (React Router), no second network navigation.
- Console warnings/errors: 0. Page errors: 0.
- Screenshots reviewed directly: `/contact/` cold-loaded correctly (real "LET'S TALK. WE REPLY IN ONE BUSINESS DAY." content, not a shell); after the drawer click, `/about` rendered its own real content ("POWERING GLOBAL EDUCATION THROUGH PRINT EXCELLENCE", the full origin-story paragraph) with no visual break, no flash, no leftover Contact-page content.

### `www` vs. apex — verdict and test
**Fixed in `.htaccess`, tested live:**
```
www.quarterfoldltd.com/       -> 301 -> https://quarterfoldltd.com/
www.quarterfoldltd.com/about/ -> 301 -> https://quarterfoldltd.com/about/   (path preserved)
quarterfoldltd.com/           -> 200 (unaffected, no redirect loop)
```
**The honest caveat, stated in the file itself and here:** this rule only takes effect for requests that reach this vhost/document root in the first place. It closes the gap **if** (the typical case for a single Hostinger hosting account) both `quarterfoldltd.com` and `www.quarterfoldltd.com` already resolve in DNS to the same server. If `www` is instead pointed at a different server, CDN, or parking target at the DNS layer, this rule never sees those requests at all, and the fix has to happen at DNS/the hosting panel — not something achievable from a file inside the repo. This can't be verified from here; it needs confirming against the actual Hostinger DNS/hosting panel before assuming the gap is fully closed.

### No regression
`pnpm build` re-run clean after all three file changes: 18/18 routes prerendered, `dist/.htaccess` confirmed byte-identical to `public/.htaccess` (Vite's public-dir passthrough), `dist/app-shell.html` present and pristine.

---

## Deploy steps for Harry — exact, as committed to `README.md`

1. `pnpm build` → `dist/`. Confirm `dist/.htaccess` and `dist/app-shell.html` both exist before proceeding — if either is missing, stop; something's wrong with the build itself.
2. **Zip/tar the *contents* of `dist/`, run from inside it** (`cd dist && zip -r ../deploy.zip .`), not the `dist/` folder itself — verify the archive's top level is `index.html`, `.htaccess`, `assets/`, etc., not a wrapping `dist/` directory.
3. In hPanel File Manager, **delete everything in `public_html`, including any existing `.htaccess`.** This is the one real process change from any earlier version of this drill: the old "keep the existing `.htaccess`" advice predates this build shipping its own routing logic. **The `.htaccess` that wins is always the one in the archive just built — never one already sitting on the server.**
4. Upload the archive, extract in place.
5. Confirm the result sits directly under `public_html/` (not nested under a `dist/` subfolder), then spot-check a handful of routes live plus one deliberately-invalid URL (should get the generic shell, not a homepage-branded fake page).

---

## Git status — start and end

**Start:**
```
Branch: phase2-routing, HEAD: d34f34b "Make prerendering an unconditional part of pnpm build"
 M src/pages/Contact.jsx  M src/pages/OurStory.css  M src/pages/PrintOnDemand.jsx
```
**End:**
```
Branch: phase2-routing, HEAD: d2a4606 "Document the real Hostinger deploy process; fix stale Vercel-only docs"
 M src/pages/Contact.jsx  M src/pages/OurStory.css  M src/pages/PrintOnDemand.jsx   ← same 3, still untouched
```
Three new commits (`7a1a766`, `aaea6ac`, `d2a4606`), one per file as instructed. No other branch touched, no pushes.

**Machine state:** Apache reinstalled for this verification and fully removed again afterward — package directory deleted, PATH entry removed, no processes running, test ports free. Same cosmetic `winget list` residue as Lane 1 (its own uninstall command still refuses to run from this session's elevated context; nothing of the actual install remains).

---

## UNCERTAIN
- Whether `www.quarterfoldltd.com` and the apex actually share DNS/hosting-account resolution on the real Hostinger setup — the `.htaccess` rule is correct *if* they do, and inert (never reached) if they don't. Needs confirming against the real DNS/hPanel config, not derivable from this repo.
- The case-sensitivity behavior reported above is a Windows/NTFS test artifact; the real Linux/Hostinger behavior (case-mismatched URLs falling through to `app-shell.html` rather than matching a directory) is reasoned from how Linux filesystems generally work, not independently verified against Hostinger's actual filesystem.
- Whether Hostinger's vhost config permits `.htaccess` overrides at all (`AllowOverride All` or equivalent) — flagged as unverifiable in both prior recons, still true here; the deploy steps' final "spot-check live" step is the actual gate on this, not anything testable from this repo.
- This report assumes "Harry" refers to whoever currently performs the manual Hostinger deploy and that the process described (zip/upload/extract via hPanel) matches their actual workflow — inferred from the task's own phrasing, not confirmed against a documented process that existed anywhere in this repo before this lane.
