import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT
const DPR = Number(process.env.DPR || 1)
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: DPR })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForTimeout(1000)
// dismiss cookie banner if present
for (const label of ['Decline', 'Accept']) {
  const b = page.locator(`button:has-text("${label}")`).first()
  if (await b.count()) { try { await b.click({ timeout: 1500 }); break } catch {} }
}
await page.waitForTimeout(600)
const info = await page.evaluate(() => {
  const img = document.querySelector('#hero img')
  const r = img.getBoundingClientRect()
  const pair = document.querySelector('.hero-cta-pair')
  const btns = Array.from(pair.querySelectorAll('a.hero-btn'))
  const L = btns[0].getBoundingClientRect(), R = btns[1].getBoundingClientRect()
  return { imgLeft: Math.round(r.left), imgW: Math.round(r.width), imgCentre: Math.round(r.left+r.width/2),
    leftBtnRight: Math.round(L.right), rightBtnLeft: Math.round(R.left), gapCentre: Math.round((L.right+R.left)/2), gap: Math.round(R.left-L.right) }
})
const cont = await page.$('#hero img >> xpath=..')
await cont.screenshot({ path: OUT })
console.log(JSON.stringify(info))
await browser.close()
