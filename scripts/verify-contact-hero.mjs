// VERIFY /contact hero upgrade — headed 1536×743.
// Proves the new /contact hero matches /infrastructure's hero for scale,
// typography and atmosphere; FR strings fit; AA contrast on the hero; zero
// console errors. Writes side-by-side crops + full hero shots to shots/contact-hero/.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'shots', 'contact-hero')
mkdirSync(outDir, { recursive: true })

const BASE = process.argv[2] || 'http://localhost:5181'
const W = 1536, H = 743
const browser = await chromium.launch({ headless: false })

const report = {}

async function shotHero(label, path, lang) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  })
  if (lang) {
    await ctx.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l) } catch {} }, lang)
  }
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500) // let waves + reveals settle

  // hero-band viewport shot (top of page, as the visitor first sees it)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(outDir, `${label}-viewport.png`) })

  // tight crop of just the hero section element
  const hero = page.locator(path.includes('infrastructure') ? '.inf-hero' : '.ctc-hero')
  await hero.screenshot({ path: resolve(outDir, `${label}-hero.png`) })

  // compact location strip (contact only) — the map replacement
  if (!path.includes('infrastructure')) {
    const loc = page.locator('.ctc-loc')
    if (await loc.count()) await loc.screenshot({ path: resolve(outDir, `${label}-locstrip.png`) })
  }

  // measure the two hero anchors so scale can be compared numerically
  const metrics = await page.evaluate((isInfra) => {
    const q = (s) => document.querySelector(s)
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), fs: parseFloat(getComputedStyle(el).fontSize) } }
    const heroEl = q(isInfra ? '.inf-hero' : '.ctc-hero')
    const h1 = q(isInfra ? '.inf-hero-title' : '.ctc-h1')
    const foil = q(isInfra ? '.inf-hero-foil' : '.ctc-hero-foil')
    const eyebrow = q(isInfra ? '.inf-hero-eyebrow' : '.ctc-hero-eyebrow')
    return {
      heroHeight: heroEl ? Math.round(heroEl.getBoundingClientRect().height) : null,
      h1: rect(h1),
      foil: rect(foil),
      eyebrow: eyebrow ? { fs: parseFloat(getComputedStyle(eyebrow).fontSize), color: getComputedStyle(eyebrow).color } : null,
    }
  }, path.includes('infrastructure'))

  let axeContrast = 'skipped'
  if (!path.includes('infrastructure')) {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .include(path.includes('infrastructure') ? '.inf-hero' : '.ctc-hero')
      .analyze()
    axeContrast = results.violations.map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) — ${v.help}`)
    writeFileSync(resolve(outDir, `axe-${label}.json`), JSON.stringify(results.violations, null, 2))
  }

  report[label] = { errors: errors.length ? errors : 'none', metrics, axeContrast }
  await ctx.close()
}

await shotHero('infra-en', '/infrastructure', 'en')
await shotHero('contact-en', '/contact', 'en')
await shotHero('contact-fr', '/contact', 'fr')

await browser.close()
console.log(JSON.stringify(report, null, 2))
