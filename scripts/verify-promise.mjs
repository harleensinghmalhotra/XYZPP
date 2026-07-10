// Verify Our Promise: headed 1536×743 DPR 1.25.
// Scrubbed reveal — capture at scroll positions mapping to 0/33/66/100% of the
// ScrollTrigger range. fps across the scrub, CLS, bold-alone test.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'http://localhost:5175'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(1200)

const geo = await page.evaluate(() => {
  const el = document.getElementById('promise')
  return { top: el.getBoundingClientRect().top + window.scrollY, innerH: window.innerHeight }
})
// trigger range: start 'top 82%' → end 'top 24%'
const startY = Math.round(geo.top - 0.82 * geo.innerH)
const endY = Math.round(geo.top - 0.24 * geo.innerH)

const bold = await page.evaluate(() =>
  [...document.querySelectorAll('#promise .pq-bold')].map((s) => s.textContent).join(' '))
console.log('BOLD-ALONE:', JSON.stringify(bold))

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)

// 0/33/66 map across the reveal range; 100 = reveal complete AND section framed
// full (top ≈ 0) so the whole composition shows.
const marks = [[0, startY], [33, Math.round(startY + 0.33 * (endY - startY))], [66, Math.round(startY + 0.66 * (endY - startY))], [100, Math.round(geo.top)]]
for (const [pct, y] of marks) {
  await to(y)
  await page.waitForTimeout(780) // let scrub:0.6 settle to this state
  await page.screenshot({ path: resolve(out, `promise-${String(pct).padStart(3, '0')}.png`) })
  console.log('  ✓ promise', pct)
}

// fps across the scrub
await to(startY - 40)
await page.waitForTimeout(300)
const fps = await page.evaluate(
  ({ startY, endY }) =>
    new Promise((done) => {
      const d = []; let last = performance.now(); let raf
      const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
      raf = requestAnimationFrame(s)
      const dur = 2200
      if (window.__lenis) window.__lenis.scrollTo(endY + 40, { duration: dur / 1000 })
      else window.scrollTo(0, endY)
      setTimeout(() => {
        cancelAnimationFrame(raf)
        const a = d.slice(3).sort((x, y) => x - y)
        const pct = (q) => a[Math.min(a.length - 1, Math.floor(a.length * q))]
        const mean = a.reduce((x, y) => x + y, 0) / a.length
        done({ frames: a.length, fpsMean: +(1000 / mean).toFixed(1), msP95: +pct(0.95).toFixed(2), msMax: +a[a.length - 1].toFixed(2), longFrames: a.filter((x) => x > 18.5).length })
      }, dur + 250)
    }),
  { startY, endY },
)
console.log('FPS across scrub:', fps)
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))
await browser.close()
console.log('done')
