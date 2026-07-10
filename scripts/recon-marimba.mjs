// STEP 0 RECON — study marimba.design's structure/energy.
// Headed Chromium, scroll the full page slowly, screenshot each viewport band
// plus a stitched full-page. Output -> recon/marimba/
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'recon', 'marimba')
mkdirSync(outDir, { recursive: true })

const W = 1536, H = 743
const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1.25 })

await page.goto('https://marimba.design/', { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(2500)

// total scroll height
const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
console.log('scrollHeight max:', maxY)

// walk down in viewport-ish steps, screenshot each band
const step = Math.round(H * 0.82)
let i = 0
for (let y = 0; y <= maxY; y += step) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y)
  await page.waitForTimeout(1100) // let scroll-driven animation settle
  const file = resolve(outDir, `band-${String(i).padStart(2, '0')}-y${y}.png`)
  await page.screenshot({ path: file })
  console.log('✓', file)
  i++
}
// final bottom
await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), maxY)
await page.waitForTimeout(1200)
await page.screenshot({ path: resolve(outDir, `band-${String(i).padStart(2, '0')}-bottom.png`) })

// full-page stitch
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await page.waitForTimeout(1500)
await page.screenshot({ path: resolve(outDir, 'full-page.png'), fullPage: true })
console.log('✓ full-page')

await browser.close()
