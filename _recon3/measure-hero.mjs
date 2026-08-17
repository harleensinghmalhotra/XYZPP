// Measure hero CTA geometry at 1536x743 DPR 1.25 against the running preview build.
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForTimeout(1500)
const m = await page.evaluate(() => {
  const pair = document.querySelector('.hero-cta-pair')
  const btns = pair ? Array.from(pair.querySelectorAll('a.hero-btn')) : []
  if (btns.length < 2) return { err: 'buttons not found', n: btns.length }
  const L = btns[0].getBoundingClientRect(), R = btns[1].getBoundingClientRect()
  const img = document.querySelector('#hero img')
  const ir = img.getBoundingClientRect()
  return {
    viewportW: window.innerWidth,
    imgLeft: Math.round(ir.left), imgRight: Math.round(ir.right), imgW: Math.round(ir.width), imgCentre: Math.round(ir.left + ir.width / 2),
    leftBtn: { left: Math.round(L.left), right: Math.round(L.right), w: Math.round(L.width) },
    rightBtn: { left: Math.round(R.left), right: Math.round(R.right), w: Math.round(R.width) },
    pairMidpoint: Math.round((L.left + R.right) / 2),
    gapCentre: Math.round((L.right + R.left) / 2),
    gap: Math.round(R.left - L.right),
  }
})
console.log(JSON.stringify(m, null, 2))
if (!m.err) {
  const delta = m.pairMidpoint - m.gapCentre // shift needed so gap centre lands on spine (=pair midpoint)
  console.log(`DELTA to move gap centre onto spine (pairMidpoint): ${delta}px  (leftW-rightW=${m.leftBtn.w - m.rightBtn.w})`)
  console.log(`0.7vw at ${m.viewportW}px = ${(0.7 * m.viewportW / 100).toFixed(2)}px  -> new translateX px = ${(0.7 * m.viewportW / 100 + delta).toFixed(2)}`)
}
await browser.close()
