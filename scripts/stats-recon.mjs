// Stats-strip redesign recon: capture Ekta's v17 .stats-bar and our live .ts-stats
// at the same width, EN + FR + reduced-motion, for side-by-side judging.
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mkdirSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'shots', 'stats-recon')
mkdirSync(OUT, { recursive: true })
const PORT = process.env.PORT || 5191
const HER = pathToFileURL(resolve(root, 'Ektas Vibe Coded Latest', 'qfp-homepage-v17.html')).href

const browser = await chromium.launch()

async function shot(sel, url, file, { lang, reduced } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1536, height: 743 },
    deviceScaleFactor: 2,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  if (lang) await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600) // let count-up settle
  const el = await page.$(sel)
  if (!el) { console.log('!! not found', sel, 'in', file); await ctx.close(); return }
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1800)
  await el.screenshot({ path: resolve(OUT, file), animations: 'disabled', timeout: 15000 })
  console.log('✓', file)
  await ctx.close()
}

// Her reference
await shot('.stats-bar', HER, 'HER-stats.png', {})
// Ours current
const ME = `http://localhost:${PORT}/`
await shot('.ts-stats', ME, 'OURS-en.png', { lang: 'en' })
await shot('.ts-stats', ME, 'OURS-fr.png', { lang: 'fr' })
await shot('.ts-stats', ME, 'OURS-reduced.png', { lang: 'en', reduced: true })

await browser.close()
console.log('done →', OUT)
