// STEP 0 recon — capture fctry product-page anatomy (READ-ONLY).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const outDir = 'recon/fctry-trade'
mkdirSync(outDir, { recursive: true })

const URL = 'https://fctrylab.com/products/mocc-women-emberglow'
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3500)
  // dismiss any cookie/age gate
  for (const label of ['Accept', 'I agree', 'Close', 'Enter']) {
    const b = page.getByRole('button', { name: label }).first()
    if (await b.count().catch(() => 0)) { await b.click().catch(() => {}) ; await page.waitForTimeout(400) }
  }
  await page.screenshot({ path: `${outDir}/00-top.png` })

  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  const vh = 743
  let i = 1
  for (let y = 0; y < total; y += Math.round(vh * 0.85)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${outDir}/${String(i).padStart(2, '0')}-scroll.png` })
    i++
    if (i > 14) break
  }
  // full page
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${outDir}/full.png`, fullPage: true })
  console.log('recon done, scrollHeight=', total)
} catch (e) {
  console.error('recon error:', e.message)
} finally {
  await browser.close()
}
