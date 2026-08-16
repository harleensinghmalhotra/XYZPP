# Quarterfold Printabilities — Website

Marketing website for Quarterfold Printabilities, a printing and fulfilment
company. Single-page React application with a Sanity-backed Newsroom and
full English / French / Spanish localization.

## Tech stack

- **React 18** + **Vite 5** (build tooling, dev server)
- **React Router** for client-side routing
- **Tailwind CSS** (+ a small amount of hand-written CSS in `src/index.css`)
- **GSAP** and **Motion** for animation; **Three.js** / **React Three Fiber**
  for 3D sections; **Lenis** for smooth scrolling
- **i18next** / **react-i18next** for localization
- **Sanity** (headless CMS) for the Newsroom content

## Requirements

- Node.js 20+
- pnpm (recommended) or npm

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

## Build & preview

```bash
pnpm build        # outputs to dist/
pnpm preview      # serve the production build locally
```

## Deployment

**Production is Hostinger**, served over Apache/LiteSpeed at
`quarterfoldltd.com` — not Vercel (confirmed from the live site's own
response headers: `Server: LiteSpeed`, `platform: hostinger`). **Vercel is a
staging/preview convenience only** — fast git-push-to-preview iteration
during development, kept out of Google's index unconditionally via
`vercel.json`'s `X-Robots-Tag: noindex` header (applies only to Vercel's own
serving — it has no effect on Hostinger, which never reads `vercel.json`).

`pnpm build` outputs a complete, deployable site to `dist/` — including
`dist/.htaccess` (copied automatically from `public/.htaccess` by Vite; see
that file's own header comment for the full routing policy it implements)
and `dist/app-shell.html` (the generic SPA fallback shell, written by
`scripts/prerender.mjs`). Every route is prerendered into its own
`<route>/index.html` with real, route-specific content and SEO metadata —
see `SEO-ARCH-RECON-2026-08-15.md` and the SEO Lane 2/3 reports for the full
background on why and how.

### Hostinger deploy (manual, "Harry's drill")

1. `pnpm build` — produces `dist/`. Confirm it built cleanly and that
   `dist/.htaccess` and `dist/app-shell.html` both exist before proceeding
   (`ls dist/.htaccess dist/app-shell.html`) — if either is missing, do not
   deploy; something is wrong with the build, not just this checklist.
2. **Zip/tar the *contents* of `dist/`, not the `dist/` folder itself** —
   run the archive command *from inside* `dist/` (e.g. `cd dist && zip -r
   ../deploy.zip .` or `cd dist && tar -czf ../deploy.tar.gz .`), so that
   when it's extracted at the destination, files land directly in
   `public_html/` rather than nested inside a `public_html/dist/`
   subfolder. This is the single most common way this kind of deploy
   silently breaks — always verify the archive's top level *is* `index.html`,
   `.htaccess`, `assets/`, etc., not a `dist/` wrapper directory, before
   uploading.
3. In Hostinger hPanel → File Manager (or via FTP/SFTP), open `public_html`
   and **delete everything in it, including any existing `.htaccess`** —
   this is a change from any earlier version of this drill that said to
   *keep* the existing `.htaccess`. That advice predates this build shipping
   its own `.htaccess` with the prerendered-routing logic; keeping an old,
   unrelated `.htaccess` in place now would silently defeat everything this
   deploy is for (the old one most likely just does a blanket SPA rewrite —
   exactly the "every route serves the same shell" problem this build fixes).
   **The `.htaccess` that should win is always the one inside the archive
   you just built** — never a file already sitting on the server.
4. Upload the archive to `public_html`.
5. Extract it in place (hPanel's File Manager has a built-in "Extract"
   action). Confirm the result: `public_html/index.html`,
   `public_html/.htaccess`, `public_html/app-shell.html`,
   `public_html/about/index.html`, `public_html/assets/*.js`, etc. should
   all sit directly under `public_html/` — not under a nested `dist/`.
6. Spot-check a handful of routes live (a plain page load *and* a `curl` with
   no JS, to confirm the served HTML is actually that route's prerendered
   content and not the fallback shell): homepage, one inner page, one
   newsroom article, and one deliberately-invalid URL (should return the
   generic `app-shell.html`, not a homepage-branded 404-that-isn't-a-404).

### Vercel (staging)

Push to the connected branch to trigger a build; Vercel runs `pnpm build`
and serves `dist/` the same way. No manual steps — `vercel.json` handles the
static-first/shell-fallback routing and the staging noindex header
automatically. Do not treat a working Vercel preview as confirmation the
Hostinger deploy will behave identically — the two platforms resolve rewrite
precedence differently (see `SEO-ARCH-RECON-2026-08-15.md` Part 3 for the
specifics); always verify on Hostinger itself before calling a deploy done.

## Environment variables

- `.env.local` — `VITE_SANITY_READ_TOKEN`, a read-only Sanity token used by the
  Newsroom at runtime. Not committed.
- `studio/.env` — the Sanity Studio auth token (used for seeding and studio
  deploys). Not committed.

## Content — Newsroom (Sanity)

Newsroom articles are managed in the Sanity Studio under `studio/`:

```bash
cd studio
pnpm install
npx sanity dev       # run the studio locally
npx sanity deploy    # publish the hosted studio
```

The hosted studio lives at `https://qfp-newsroom.sanity.studio`. Articles carry
per-language fields (English / French / Spanish); the site reads the active
language with an English fallback.

## Localization

Locale strings live in `src/locales/<lang>/<namespace>.json` and are
auto-registered by `src/i18n.js`. To add or extend a page's copy, edit (or add)
the matching JSON file for each of `en`, `fr`, and `es` — no code changes are
needed to register a new namespace.

## Asset-swap system

All imagery and media live under **`public/site-assets/`** — static files served
at `/site-assets/…`, the client-facing deliverable tree of logos, photos, icons,
and video. To replace a placeholder or update a picture, **overwrite the file in
place, keeping the same path and filename** — no code changes required.

Individual asset folders include a short README noting the expected filenames
and dimensions for each slot.

## Project structure

```
public/              Static files served as-is (incl. public/site-assets)
src/
  components/        Shared UI and layout
  sections/          Homepage and page sections
  pages/             Routed pages
  lib/               Helpers (Sanity client, i18n utils)
  locales/           en / fr / es translation JSON
  index.css          Global styles and design tokens
studio/              Sanity Studio (Newsroom CMS)
```
