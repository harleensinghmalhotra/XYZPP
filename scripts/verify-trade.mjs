import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.argv[2] || '5173'
const out = 'shots/page-trade'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

const URL = `http://localhost:${PORT}/trade-books`
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1200)

// title check
console.log('TITLE:', await page.title(), '| len', (await page.title()).length)

// all 6 swatch states
const swatches = page.locator('.tb-swatch')
const n = await swatches.count()
console.log('swatch count:', n)
for (let i = 0; i < n; i++) {
  await swatches.nth(i).click()
  await page.waitForTimeout(650)
  const name = (await page.locator('.tb-active-name').textContent()).trim()
  await page.screenshot({ path: `${out}/swatch-${i + 1}-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png` })
  console.log('swatch', i + 1, '→', name)
}

// back to first, capture top
await swatches.nth(0).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/00-top.png` })

// sticky behaviour — scroll the panel/accordions, gallery should stay pinned
const galleryBoxA = await page.locator('.tb-gallery').boundingBox()
await page.evaluate(() => window.scrollTo(0, 600))
await page.waitForTimeout(500)
const galleryBoxB = await page.locator('.tb-gallery').boundingBox()
await page.screenshot({ path: `${out}/01-scrolled-sticky.png` })
console.log('gallery top A/B (screen y):', galleryBoxA?.y?.toFixed(0), '→ still visible pinned:', galleryBoxB?.y?.toFixed(0))

// open each accordion at first cat
for (const id of ['materials', 'options', 'delivery']) {
  await page.locator(`#tb-btn-${id}`).click()
  await page.waitForTimeout(200)
}
await page.screenshot({ path: `${out}/02-accordions-open.png` })

// lifestyle + range + cta
await page.locator('.tb-life').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/03-lifestyle.png` })
await page.locator('#tb-range').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/04-range.png` })
await page.locator('.tb-close').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/05-cta.png` })

// full page
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await page.screenshot({ path: `${out}/full.png`, fullPage: true })

// axe
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
const serious = axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
console.log('\n=== AXE ===')
console.log('total violations:', axe.violations.length, '| serious/critical:', serious.length)
for (const v of axe.violations) console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`)

console.log('\n=== CONSOLE ERRORS ===', errors.length)
errors.forEach((e) => console.log('  ', e))

await browser.close()
console.log('\ndone')
