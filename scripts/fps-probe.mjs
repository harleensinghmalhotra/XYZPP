// Fast pin-fps probe (ether ON only) for tuning the LiquidEther resolution.
import { chromium } from 'playwright'
const URL = process.env.HERO_URL || 'http://localhost:5173'
const VP = { width: 1536, height: 743 }
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1600)
const r = await page.evaluate(
  () =>
    new Promise((res) => {
      const start = performance.now()
      let last = start
      const deltas = []
      const maxY = window.innerHeight * 1.2
      function frame(now) {
        deltas.push(now - last)
        last = now
        const t = (now - start) / 3000
        const y = Math.min(1, t) * maxY
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
        else window.scrollTo(0, y)
        if (now - start < 3000) requestAnimationFrame(frame)
        else {
          const d = deltas.slice(2).sort((a, b) => a - b)
          res({ frames: d.length, medianFps: +(1000 / d[Math.floor(d.length / 2)]).toFixed(1), worstFrameMs: +d[Math.floor(d.length * 0.95)].toFixed(1) })
        }
      }
      requestAnimationFrame(frame)
    })
)
console.log(JSON.stringify(r))
await browser.close()
