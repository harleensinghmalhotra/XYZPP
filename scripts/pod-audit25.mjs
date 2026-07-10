// Phase 2.5 audit/verify for /print-on-demand.
// Usage: node scripts/pod-audit25.mjs <before|after>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/phase25')
mkdirSync(out, { recursive: true })
const phase = process.argv[2] || 'before'
const URL = 'http://localhost:5177/print-on-demand'
const file = phase === 'after' ? 'print-on-demand.png' : 'print-on-demand-before.png'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1000)

// exercise the configurator once
await page.locator('#build').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
const pick = async (label, name) => {
  const g = page.locator(`[aria-labelledby="${label}"]`)
  const r = g.getByRole('radio', { name: new RegExp(name.replace(/[+()]/g, '\\$&'), 'i') }).first()
  await r.scrollIntoViewIfNeeded(); await r.click(); await page.waitForTimeout(300)
}
await pick('step-format', 'Hardcover')
await pick('step-paper', 'Art 150gsm')
await pick('step-binding', 'Wiro')
await pick('step-finish', 'Gloss')
await pick('step-quantity', '500')
await page.waitForTimeout(400)

// find empty image frames / broken imgs / grey placeholder boxes
const audit = await page.evaluate(() => {
  const res = { brokenImgs: [], bgImages: [], emptyMediaFrames: [] }
  document.querySelectorAll('.pod img').forEach((im) => {
    if (!im.complete || im.naturalWidth === 0) res.brokenImgs.push(im.currentSrc || im.src)
  })
  document.querySelectorAll('.pod *').forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage
    if (bg && bg.includes('url(')) res.bgImages.push({ cls: el.className, bg: bg.slice(0, 120) })
  })
  return res
})

// full-page screenshot
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await page.screenshot({ path: resolve(out, file), fullPage: true })

console.log('PHASE:', phase)
console.log('BROKEN IMGS:', audit.brokenImgs.length, JSON.stringify(audit.brokenImgs))
console.log('BG IMAGES (url):', JSON.stringify(audit.bgImages, null, 1))
console.log('CONSOLE ERRORS:', errors.length)
errors.forEach((e) => console.log('  !', e))
await browser.close()
console.log('shot ->', resolve(out, file))
