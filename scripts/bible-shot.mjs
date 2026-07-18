// BIBLE-SHOT — generic per-page screenshot helper for the site-wide homogenization.
// Usage: node scripts/bible-shot.mjs <route> <label> [before|after]
// Captures a full-page PNG + sequential band shots at the site's canonical
// 1536×743 DPR-1.25 viewport, into shots/bible/<label>/. CLAUDE.md compliant:
// uses browser.newContext(), real artifacts on disk.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const route = process.argv[2] || '/'
const label = process.argv[3] || 'page'
const phase = process.argv[4] || 'shot'
const base = process.env.BASE || 'http://localhost:5173'
const URL = base + route

const outDir = resolve(root, 'shots', 'bible', label)
mkdirSync(outDir, { recursive: true })

const W = 1536, H = 743
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1.25,
})
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1000)

// full-page
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await page.waitForTimeout(300)
await page.screenshot({ path: resolve(outDir, `${phase}-full.png`), fullPage: true })

// band shots down the page
const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
const step = Math.round(H * 0.85)
let i = 0
for (let y = 0; y <= maxY; y += step) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y)
  await page.waitForTimeout(350)
  await page.screenshot({ path: resolve(outDir, `${phase}-band-${String(i).padStart(2, '0')}.png`) })
  i++
}

console.log(`\n===== ${label} (${phase}) =====`)
console.log('url:', URL)
console.log('bands captured:', i)
console.log('console errors:', errors.length ? errors.slice(0, 6) : 'none')

await ctx.close()
await browser.close()
