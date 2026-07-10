import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = (process.env.URL || 'http://localhost:5177') + '/trade-books'
const out = resolve(root, 'shots/phase25')
const shot = process.env.SHOT || 'trade-books-before.png'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
page.on('requestfailed', (r) => { if (/qfp|\.webp|\.png|\.jpg/i.test(r.url())) errors.push('REQFAIL ' + r.url()) })

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(800)

// scroll fully to trigger any lazy/IO
const total = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y <= total; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120) }
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(400)

// enumerate every <img>: natural size 0 => broken/empty
const imgs = await page.evaluate(() =>
  Array.from(document.querySelectorAll('img')).map((im) => ({
    src: im.currentSrc || im.src, nw: im.naturalWidth, nh: im.naturalHeight,
    dw: Math.round(im.getBoundingClientRect().width), dh: Math.round(im.getBoundingClientRect().height),
    cls: im.className,
  })),
)
const broken = imgs.filter((i) => i.nw === 0 || i.nh === 0)

await page.screenshot({ path: resolve(out, shot), fullPage: true })
console.log('IMG COUNT:', imgs.length)
console.log('BROKEN:', broken.length)
broken.forEach((b) => console.log('  ✗', b.src, b.cls))
console.log('CONSOLE ERRORS:', errors.length)
errors.forEach((e) => console.log('  !', e))
console.log('SHOT:', resolve(out, shot))
await browser.close()
