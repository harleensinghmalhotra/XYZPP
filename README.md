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

The site deploys to **Vercel**. `vercel.json` provides the SPA rewrite so
client-side routes resolve on refresh. Vercel runs `vite build` and serves
`dist/`. Push to the deployment branch to trigger a build.

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

All imagery and media live in two swappable trees. To replace a placeholder or
update a picture, **overwrite the file in place, keeping the same path and
filename** — no code changes required.

- **`assets/`** (import alias `@assets`) — bundler assets imported directly by
  the app: hero art, cover mockups, cut-out elements, and background videos.
- **`public/site-assets/`** — static files served at `/site-assets/…`; the
  client-facing deliverable tree of logos, photos, and icons.

Individual asset folders include a short README noting the expected filenames
and dimensions for each slot.

## Project structure

```
assets/              Swappable bundler media (@assets)
public/              Static files served as-is (incl. public/site-assets)
src/
  components/        Shared UI and layout
  sections/          Homepage and page sections
  pages/             Routed pages
  lib/               Helpers (Sanity client, asset registry, i18n utils)
  locales/           en / fr / es translation JSON
  index.css          Global styles and design tokens
studio/              Sanity Studio (Newsroom CMS)
```
