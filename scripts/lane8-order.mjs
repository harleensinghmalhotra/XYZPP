import { chromium } from 'playwright'
import fs from 'node:fs'

const PORT = process.argv[2] || '4173'
const OUT = 'shots/lane8'
fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ headless: false })

for (const lng of ['en', 'fr']) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {} }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('#infrastructure', { timeout: 30000 })
  await page.evaluate(() => document.querySelector('#infrastructure')?.scrollIntoView())
  await page.waitForTimeout(1800) // let reveals finish

  // DOM order of the section's direct content blocks
  const order = await page.evaluate(() => {
    const inner = document.querySelector('#infrastructure .infra-inner')
    return [...inner.children].map((el) => el.className.split(' ')[0] || el.tagName.toLowerCase())
  })
  console.log(`[${lng}] block order:`, order.join(' → '))

  const sec = await page.$('#infrastructure')
  await sec.screenshot({ path: `${OUT}/infra-order-${lng}.png` })
  await ctx.close()
}
await browser.close()
