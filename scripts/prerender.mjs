#!/usr/bin/env node
// ── Post-build prerender step (SEO-ARCH-RECON-2026-08-15.md, Option C) ───────
//
// Runs immediately after `vite build` (see package.json: "build": "vite build
// && node scripts/prerender.mjs" — not a separate, skippable command). Drives
// a real headless Chromium over the freshly built `dist/` so every route Seo.jsx
// and the newsroom's Sanity fetch would otherwise populate client-side lands in
// the actual static HTML: title, description, canonical, OG/Twitter tags, and
// JSON-LD, plus the real rendered body text.
//
// Why a real browser and not React's server renderer (renderToString): every
// page's SEO metadata is written by a `useEffect` in src/components/Seo.jsx,
// and the newsroom's content is fetched at runtime inside a `useEffect` too
// (src/pages/Newsroom.jsx, src/pages/NewsroomArticle.jsx). `renderToString`
// never runs effects — a real browser does, so it's the only approach that
// captures both without an application-code rewrite (see the SSG spike in the
// same recon, which left both gaps open).
//
// Idempotency: this script assumes it is always invoked immediately after a
// fresh `vite build`, which empties and regenerates `dist/` by default (no
// custom `emptyOutDir`/`outDir` override in vite.config.js) — so dist/index.html
// is guaranteed to still be the pristine, un-prerendered shell when this runs.
// Animations are forced off via Playwright's `reducedMotion: 'reduce'` context
// option (the app already guards every GSAP/scroll effect on
// `prefers-reduced-motion`), so every snapshot captures the final settled DOM
// state rather than a mid-animation frame — this is what makes two consecutive
// builds byte-identical, not just "close enough."

import { chromium } from 'playwright'
import { loadEnv, preview } from 'vite'
import { createClient } from '@sanity/client'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { projectId, dataset } from '../studio/projectConfig.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(ROOT, 'dist')

// ── 1. Hard-fail if the Sanity read token is missing ─────────────────────────
// Without it, Newsroom.jsx / NewsroomArticle.jsx's client.fetch() resolves to
// zero posts (Sanity's access model requires an authenticated read on this
// project — see src/lib/sanity.js), and every newsroom page would silently
// prerender empty. That's worse than not prerendering at all, so this fails
// the whole build rather than warning.
const env = loadEnv('production', ROOT, '')
const SANITY_TOKEN = env.VITE_SANITY_READ_TOKEN || process.env.VITE_SANITY_READ_TOKEN
if (!SANITY_TOKEN) {
  console.error('')
  console.error('[prerender] FATAL: VITE_SANITY_READ_TOKEN is not set.')
  console.error('[prerender] Newsroom content requires an authenticated Sanity read; without')
  console.error('[prerender] the token, every newsroom page would silently prerender empty.')
  console.error('[prerender] Set VITE_SANITY_READ_TOKEN in .env.local (or the build environment) and retry.')
  console.error('')
  process.exit(1)
}

if (!existsSync(DIST)) {
  console.error('[prerender] FATAL: dist/ not found. This script runs after `vite build`, not instead of it.')
  process.exit(1)
}

// ── 2. Route list: the 12 static routes + every live newsroom article ────────
const STATIC_ROUTES = [
  '/', '/about', '/global-markets', '/print-on-demand', '/infrastructure',
  '/newsroom', '/fulfilment', '/contact',
  '/legal/privacy', '/legal/cookies', '/legal/terms', '/legal/accessibility',
]

// Mirrors Newsroom.jsx's INDEX_QUERY visibility guard exactly (published flag +
// publishedAt <= now()) so the prerendered set always matches what the live
// index would show — enumerated from Sanity, never hardcoded.
const sanity = createClient({
  projectId, dataset, apiVersion: '2026-07-19', token: SANITY_TOKEN, useCdn: false,
})
const SLUG_QUERY = `*[_type == "post" && published == true && publishedAt <= now()]{"slug": slug.current}`

async function discoverArticleRoutes() {
  const posts = await sanity.fetch(SLUG_QUERY)
  return posts.map((p) => `/newsroom/${p.slug}`).sort()
}

// ── 3. Local path each route serializes to ────────────────────────────────────
// "/" is special-cased: it overwrites dist/index.html directly, but only AFTER
// the pristine pre-prerender shell has been copied out to dist/app-shell.html
// (step 4) — the file the future .htaccess fallback and any not-yet-prerendered
// route depend on.
function outputPathFor(route) {
  if (route === '/') return join(DIST, 'index.html')
  return join(DIST, ...route.split('/').filter(Boolean), 'index.html')
}

// ── 4. Preserve the pristine shell before anything else touches dist/index.html
const shellSrc = join(DIST, 'index.html')
const shellDst = join(DIST, 'app-shell.html')
writeFileSync(shellDst, readFileSync(shellSrc))
console.log('[prerender] preserved pristine app-shell.html')

// ── 5. Boot a preview server against the just-built dist/ via Vite's own JS API
// (not a spawned `vite preview` subprocess — spawning `.cmd` shims from Node's
// child_process is unreliable cross-platform, notably on Windows). Vite's
// `preview()` returns a running server object with the real resolved URL, so
// there's no stdout-parsing or port-guessing involved either.
async function startPreviewServer() {
  const server = await preview({ root: ROOT, preview: { port: 0, strictPort: false } })
  const url = server.resolvedUrls.local[0].replace(/\/$/, '')
  return { server, base: url }
}

async function waitForServer(base, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(base + '/')
      if (res.ok) return
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Preview server at ${base} never became ready`)
}

// ── 6. Per-route render: wait for Seo.jsx's effect, not a fixed timeout ───────
// Every real content route sets a canonical link AND at least one JSON-LD block
// as the LAST two things Seo.jsx's effect does, synchronously, in that order —
// so waiting for both is a precise "the effect has fully run" signal, not a
// guess. For NewsroomArticle specifically, the JSON-LD is only added in the
// component's "ready" branch (see src/pages/NewsroomArticle.jsx) — its loading
// state renders no <Seo> at all — so this same wait also doubles as "the Sanity
// fetch resolved" for articles. The newsroom INDEX page's BreadcrumbList JSON-LD
// is unconditional though (renders even while post cards are still loading), so
// it additionally needs its own explicit wait for the skeleton grid to clear.
async function renderRoute(page, base, route) {
  const url = base + route
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  // state: 'attached', not the default 'visible' — a <link> has no rendering
  // box, so "visible" never resolves and every route timed out on this check
  // until this was caught during the initial verification run.
  await page.waitForSelector('link[rel="canonical"]', { state: 'attached', timeout: 15000 })
  await page.waitForFunction(
    () => document.querySelectorAll('script[type="application/ld+json"]').length >= 1,
    { timeout: 20000 },
  )
  if (route === '/newsroom') {
    await page.waitForFunction(() => !document.querySelector('.nr-skeleton'), { timeout: 20000 })
  }
  // FloatingWhatsApp.jsx (global chrome, every route) reveals itself on its own
  // fixed setTimeout(1500ms), entirely independent of Seo.jsx/reduced-motion —
  // waiting on canonical+JSON-LD alone races it: whichever side of 1.5s the
  // page happened to load on flips its `.wa-fab` between with/without `is-in`,
  // which is exactly what an idempotency diff between two build runs caught.
  await page.waitForFunction(
    () => document.querySelector('.wa-fab')?.classList.contains('is-in') ?? true,
    { timeout: 5000 },
  ).catch(() => {}) // tolerate its absence rather than fail routes that don't render it
  // Let any last layout/paint settle before serializing — cheap insurance on
  // top of the explicit waits above, not a substitute for them.
  await page.waitForTimeout(150)
  const html = await page.content()

  // Assert the captured content is actually FOR this route, not just that
  // *some* canonical/JSON-LD exists. "Presence" alone isn't enough proof: one
  // run captured a page whose canonical/JSON-LD were the homepage's — every
  // wait condition above was technically satisfied, just by the wrong page's
  // tags. Root cause not fully isolated (suspected an in-flight Sanity fetch
  // from an adjacent route bleeding across a `page.goto()` in a way that still
  // left stale-but-present <head> tags), but this assertion catches the
  // symptom directly regardless of cause, which is what actually matters here.
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/)
  const expectedSuffix = route === '/' ? '' : route
  if (!canonicalMatch || !canonicalMatch[1].endsWith(expectedSuffix || '/')) {
    throw new Error(
      `canonical mismatch: expected a URL ending in "${expectedSuffix || '/'}", got "${canonicalMatch?.[1] ?? '(none)'}" — captured the wrong page's content`,
    )
  }
  return html
}

// ── 6b. The 404 page: prerender NotFound to a static file ────────────────────
// Feeds public/.htaccess's strict-404 ErrorDocument (SEO Lane 5) — so a
// crawler that can't run JS still gets real, on-brand 404 content instead of
// an empty shell. Reuses none of renderRoute()'s assertions: NotFound sets no
// JSON-LD (renderRoute would hang waiting for one) and its canonical is
// whatever bogus path triggered it, not a fixed route. Its <title> is unique
// site-wide (src/locales/en/common.json: notFound.seoTitle) and is set by the
// same Seo.jsx effect every other route uses, so waiting for it is an
// equally precise "the route has actually mounted and settled" signal.
const NOT_FOUND_TITLE = 'Page Not Found | Quarterfold Printabilities'

async function renderNotFound(page, base) {
  // Any path with no matching React Router route hits the "*" -> NotFound
  // catch-all. This one is deliberately unrecognizable as a real or
  // soon-to-be-real route.
  await page.goto(`${base}/__prerender-404-probe__`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForFunction(
    (expected) => document.title === expected,
    NOT_FOUND_TITLE,
    { timeout: 15000 },
  )
  await page.waitForTimeout(150)
  const html = await page.content()
  if (!html.includes('noindex')) {
    throw new Error('404 capture is missing its noindex robots tag -- captured the wrong page')
  }
  return html
}

// ── 7. Run ─────────────────────────────────────────────────────────────────
async function main() {
  const articleRoutes = await discoverArticleRoutes()
  console.log(`[prerender] discovered ${articleRoutes.length} live newsroom article(s) from Sanity`)
  const routes = [...STATIC_ROUTES, ...articleRoutes]

  const { server: previewServer, base } = await startPreviewServer()
  console.log(`[prerender] preview server ready at ${base}`)

  const browser = await chromium.launch()
  const results = []

  try {
    await waitForServer(base)
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce', // deterministic, animation-free final DOM — see header comment
    })
    await context.addInitScript(() => {
      localStorage.setItem('qfp.consent', 'accepted')
      localStorage.setItem('qfp.lang', 'en') // bake EN; the client toggle still works post-hydration
    })

    // A fresh page per attempt (not one page reused across all 18 navigations)
    // — deliberate, not just cheap insurance. The idempotency check caught a
    // run where a page's captured <head> tags belonged to a different route
    // entirely despite every wait condition passing; a fresh, never-navigated
    // page per attempt removes any possibility of state carrying across
    // navigations, whatever the exact mechanism was. The canonical-match
    // assertion in renderRoute() stays as a second, independent guard.
    async function attempt(route) {
      const page = await context.newPage()
      try {
        return await renderRoute(page, base, route)
      } finally {
        await page.close()
      }
    }

    // 404.html first, at dist/'s root -- while dist/index.html is still the
    // pristine pre-prerender shell (the "/" entry in the loop below hasn't
    // overwritten it yet), so vite preview's SPA fallback serves the clean
    // shell for the probe path, not a stale prerendered homepage. Hard-fails
    // the build on error: shipping the strict-404 .htaccess (public/.htaccess)
    // with a missing or stale ErrorDocument target is worse than not having
    // it, the same reasoning as the Sanity-token guard above.
    {
      const start = Date.now()
      const page = await context.newPage()
      try {
        const html = await renderNotFound(page, base)
        writeFileSync(join(DIST, '404.html'), html)
        console.log(`[prerender] ok    404.html${' '.repeat(37)} ${Date.now() - start}ms  ${Buffer.byteLength(html)}B`)
      } catch (err) {
        console.error('[prerender] FATAL: could not prerender 404.html:', err.message)
        process.exitCode = 1
        throw err
      } finally {
        await page.close()
      }
    }

    for (const route of routes) {
      const start = Date.now()
      try {
        const html = await attempt(route)
        const outPath = outputPathFor(route)
        mkdirSync(dirname(outPath), { recursive: true })
        writeFileSync(outPath, html)
        const ms = Date.now() - start
        results.push({ route, ok: true, ms, bytes: Buffer.byteLength(html) })
        console.log(`[prerender] ok    ${route.padEnd(45)} ${ms}ms  ${Buffer.byteLength(html)}B`)
      } catch (err) {
        // One retry before giving up on this route — a single flaky Sanity
        // fetch or a slow first paint shouldn't sink an otherwise-good route.
        try {
          const html = await attempt(route)
          const outPath = outputPathFor(route)
          mkdirSync(dirname(outPath), { recursive: true })
          writeFileSync(outPath, html)
          results.push({ route, ok: true, ms: Date.now() - start, bytes: Buffer.byteLength(html), retried: true })
          console.log(`[prerender] ok*   ${route.padEnd(45)} ${Date.now() - start}ms  (succeeded on retry)`)
        } catch (err2) {
          results.push({ route, ok: false, ms: Date.now() - start, error: err2.message })
          console.error(`[prerender] FAIL  ${route.padEnd(45)} ${err2.message}`)
        }
      }
    }

    await context.close()
  } finally {
    await browser.close()
    await previewServer.close()
  }

  const failed = results.filter((r) => !r.ok)
  const ok = results.filter((r) => r.ok)
  console.log('')
  console.log(`[prerender] ${ok.length}/${results.length} routes prerendered successfully`)
  if (failed.length) {
    console.error(`[prerender] ${failed.length} route(s) FAILED:`)
    failed.forEach((r) => console.error(`  - ${r.route}: ${r.error}`))
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('[prerender] FATAL:', err)
  process.exit(1)
})
