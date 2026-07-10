import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const outDir = 'recon/fctry-trade'
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
try {
  await page.goto('https://fctrylab.com/products/mocc-women-emberglow', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(4000)
  // close newsletter modal (it pops after a delay)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(500)
  // click any close X
  for (const sel of ['button[aria-label="Close"]', '.needsclick', 'svg']) {}
  await page.mouse.click(1210, 182).catch(() => {})
  await page.waitForTimeout(800)
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  let i = 20
  for (let y = 700; y < total; y += 640) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(650)
    // keep trying to kill modal
    await page.mouse.click(1210, 182).catch(() => {})
    await page.screenshot({ path: `${outDir}/${i}-lower.png` })
    i++
    if (i > 32) break
  }
  console.log('done2 total=', total)
} catch (e) { console.error(e.message) } finally { await browser.close() }
