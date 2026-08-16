#!/usr/bin/env node
// ── Build-time sitemap generator (SEO Lane 6) ─────────────────────────────────
//
// Runs after prerender.mjs (see package.json: "build": "vite build && node
// scripts/prerender.mjs && node scripts/generate-sitemap.mjs" -- not a separate,
// skippable command). Replaces the old hand-edited public/sitemap.xml, which had
// no lastmod on any static page and one identical batch date on all six newsroom
// articles regardless of when each was actually published (SEO-RECON-2026-08-15.md
// §6). public/sitemap.xml itself is left in place as a dev-server-only fallback
// (`pnpm dev` serves whatever's in public/ as-is) -- production only ever serves
// dist/sitemap.xml, which this script overwrites on every build.
//
// lastmod is real, not invented, from two different sources of truth:
//   - Static/legal routes: the last real git commit that touched that route's
//     source file(s) (git log, not a hand-typed date).
//   - Newsroom articles: Sanity's own `_updatedAt` system field -- the same
//     field NewsroomArticle.jsx's own dateModified JSON-LD already uses, so the
//     sitemap and the page's own structured data agree.
//
// Sync guarantee for newly-published articles: ARTICLE_QUERY below is the exact
// same visibility guard (published == true && publishedAt <= now()) as
// Newsroom.jsx's own index query and prerender.mjs's discoverArticleRoutes() --
// the same live Sanity fetch, not a cached or hand-maintained list. The next
// `pnpm build` after a post is published queries Sanity fresh and includes it
// automatically; there is no manual step to forget. (Not exercised against a
// disposable test article here: this queries the live production dataset --
// see the memory note on Newsroom Sanity prod state -- so correctness is argued
// from the query being identical to the two other call sites that already prove
// it works, rather than by mutating production data for a one-off test.)

import { execSync } from 'node:child_process'
import { writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'
import { loadEnv } from 'vite'
import { projectId, dataset } from '../studio/projectConfig.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(ROOT, 'dist')
const SITE = 'https://quarterfoldltd.com'

if (!existsSync(DIST)) {
  console.error('[sitemap] FATAL: dist/ not found. This script runs after `vite build`, not instead of it.')
  process.exit(1)
}

const env = loadEnv('production', ROOT, '')
const SANITY_TOKEN = env.VITE_SANITY_READ_TOKEN || process.env.VITE_SANITY_READ_TOKEN
if (!SANITY_TOKEN) {
  console.error('[sitemap] FATAL: VITE_SANITY_READ_TOKEN is not set -- cannot discover live articles.')
  process.exit(1)
}

// Real commit history on a route's own source file(s) -> YYYY-MM-DD, or null if
// git has nothing (defensive; every path here is tracked, so this is a fallback,
// not the expected path). Multiple paths let the four /legal/* routes -- which
// share one template (LegalPage.jsx) and one combined locale file (legal.json)
// keyed by doc -- take whichever of the two was touched more recently, since
// there's no separate per-document file to point at.
function lastmodFromGit(paths) {
  try {
    const cmd = `git log -1 --format=%aI -- ${paths.map((p) => `"${p}"`).join(' ')}`
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
    return out ? out.slice(0, 10) : null
  } catch {
    return null
  }
}

// [path, changefreq, priority, sourceFiles[]] -- changefreq/priority carried over
// unchanged from the hand-edited sitemap.xml this replaces (not part of this
// lane's scope to redesign); lastmod is the new, real signal.
const STATIC_ROUTES = [
  ['/', 'weekly', '1.0', ['src/pages/Home.jsx']],
  ['/about', 'monthly', '0.9', ['src/pages/OurStory.jsx']],
  ['/global-markets', 'monthly', '0.9', ['src/pages/GlobalMarkets.jsx']],
  ['/print-on-demand', 'monthly', '0.9', ['src/pages/PrintOnDemand.jsx']],
  ['/contact', 'monthly', '0.9', ['src/pages/Contact.jsx']],
  ['/infrastructure', 'monthly', '0.8', ['src/pages/InfrastructurePage.jsx']],
  ['/fulfilment', 'monthly', '0.8', ['src/pages/Fulfilment.jsx']],
  ['/newsroom', 'weekly', '0.7', ['src/pages/Newsroom.jsx']],
  ['/legal/privacy', 'yearly', '0.3', ['src/pages/LegalPage.jsx', 'src/locales/en/legal.json']],
  ['/legal/cookies', 'yearly', '0.3', ['src/pages/LegalPage.jsx', 'src/locales/en/legal.json']],
  ['/legal/terms', 'yearly', '0.3', ['src/pages/LegalPage.jsx', 'src/locales/en/legal.json']],
  ['/legal/accessibility', 'yearly', '0.3', ['src/pages/LegalPage.jsx', 'src/locales/en/legal.json']],
]

// Mirrors Newsroom.jsx's INDEX_QUERY visibility guard and prerender.mjs's
// discoverArticleRoutes() exactly -- see header comment.
const sanity = createClient({ projectId, dataset, apiVersion: '2026-07-19', token: SANITY_TOKEN, useCdn: false })
const ARTICLE_QUERY = `*[_type == "post" && published == true && publishedAt <= now()]{"slug": slug.current, "lastmod": _updatedAt}`

function buildXml(urls) {
  const body = urls.map((u) => [
    '  <url>',
    `    <loc>${u.loc}</loc>`,
    u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
    `    <changefreq>${u.changefreq}</changefreq>`,
    `    <priority>${u.priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n'))
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...body,
    '</urlset>',
    '',
  ].join('\n')
}

async function main() {
  const articles = await sanity.fetch(ARTICLE_QUERY)
  console.log(`[sitemap] discovered ${articles.length} live newsroom article(s) from Sanity`)

  const urls = STATIC_ROUTES.map(([path, changefreq, priority, files]) => ({
    loc: `${SITE}${path}`,
    lastmod: lastmodFromGit(files),
    changefreq,
    priority,
  }))

  for (const a of [...articles].sort((x, y) => x.slug.localeCompare(y.slug))) {
    urls.push({
      loc: `${SITE}/newsroom/${a.slug}`,
      lastmod: a.lastmod ? a.lastmod.slice(0, 10) : null,
      changefreq: 'monthly',
      priority: '0.6',
    })
  }

  const xml = buildXml(urls)
  writeFileSync(join(DIST, 'sitemap.xml'), xml)
  console.log(`[sitemap] wrote dist/sitemap.xml (${urls.length} URLs, ${Buffer.byteLength(xml)}B)`)
}

main().catch((err) => {
  console.error('[sitemap] FATAL:', err)
  process.exit(1)
})
