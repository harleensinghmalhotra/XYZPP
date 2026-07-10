// RECON (read-only): capture flexis-mobility.com structure section-by-section.
// Headed Chromium, full scroll, full-page + viewport-slice screenshots into
// recon/flexis/. Reference only — no assets are reused, structure/rhythm study.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'recon/flexis')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1.25 })
await page.goto('https://flexis-mobility.com/', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(4500)

// dismiss cookie banners if present
for (const t of ['Accept', 'Accept all', 'Alle akzeptieren', 'OK', 'Agree', 'Got it']) {
  const b = page.getByRole('button', { name: t })
  if (await b.count()) { try { await b.first().click({ timeout: 1500 }); break } catch {} }
}
await page.waitForTimeout(800)

const total = await page.evaluate(() => document.documentElement.scrollHeight)
const vh = 900
console.log('scrollHeight', total)

// full page
await page.screenshot({ path: resolve(outDir, 'full.png'), fullPage: true })

// viewport slices top→bottom
let i = 0
for (let y = 0; y < total; y += Math.round(vh * 0.85)) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await page.waitForTimeout(700)
  await page.screenshot({ path: resolve(outDir, `slice-${String(i).padStart(2, '0')}.png`) })
  console.log('✓ slice', i, '@', y)
  i++
}

// dump section text/structure for content study
const structure = await page.evaluate(() => {
  const pick = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160)
  return {
    h1: [...document.querySelectorAll('h1')].map(pick),
    h2: [...document.querySelectorAll('h2')].map(pick),
    h3: [...document.querySelectorAll('h3')].map(pick).slice(0, 40),
    sections: [...document.querySelectorAll('section')].length,
  }
})
console.log(JSON.stringify(structure, null, 2))

await browser.close()
console.log('done')
