import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = 'http://localhost:5175'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(1200)

const geo = await page.evaluate(() => {
  const el = document.getElementById('process')
  return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
})
console.log('SECTION HEIGHT:', geo.h, 'px =', (geo.h / geo.innerH).toFixed(2), 'viewports')

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const startY = Math.round(geo.top - 0.76 * geo.innerH)
const endY = Math.round(geo.top - 0.12 * geo.innerH)

// junction from the quote above → into process
await to(Math.round(geo.top - 0.7 * geo.innerH))
await page.waitForTimeout(800)
await page.screenshot({ path: resolve(out, 'process-junction.png') })
console.log('  ✓ process-junction.png')

for (const p of [0, 0.33, 0.66, 1]) {
  await to(p < 1 ? Math.round(startY + p * (endY - startY)) : Math.round(geo.top))
  await page.waitForTimeout(780)
  await page.screenshot({ path: resolve(out, `process-${String(Math.round(p * 100)).padStart(3, '0')}.png`) })
  console.log('  ✓ process', Math.round(p * 100))
}

// fps across the draw
await to(startY - 40); await page.waitForTimeout(250)
const fps = await page.evaluate(({ endY }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2000
  if (window.__lenis) window.__lenis.scrollTo(endY + 40, { duration: dur / 1000 }); else window.scrollTo(0, endY)
  setTimeout(() => { cancelAnimationFrame(raf); const a = d.slice(3).sort((x, y) => x - y); const pct = (q) => a[Math.min(a.length - 1, Math.floor(a.length * q))]; const mean = a.reduce((x, y) => x + y, 0) / a.length; done({ fpsMean: +(1000 / mean).toFixed(1), msP95: +pct(0.95).toFixed(2), msMax: +a[a.length - 1].toFixed(2), longFrames: a.filter((x) => x > 18.5).length }) }, dur + 250)
}), { endY })
console.log('FPS:', fps)
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

const axe = await new AxeBuilder({ page }).include('#process').analyze()
console.log('axe #process violations:', axe.violations.length)
for (const v of axe.violations) console.log(` [${v.impact}] ${v.id}: ${v.help}`)
await browser.close()
console.log('done')
