// Real Web-Vitals probe under 4x CPU throttle: LCP, CLS, long tasks during a
// full scripted scroll through the page. MEASURED evidence for the perf gate.
import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:5173'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.addInitScript(() => {
  window.__v = { lcp: 0, cls: 0, long: [] }
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__v.lcp = e.startTime
  }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value
  }).observe({ type: 'layout-shift', buffered: true })
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__v.long.push(Math.round(e.duration))
  }).observe({ type: 'longtask', buffered: true })
})

const cdp = await ctx.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(1500)

// scripted scroll through the whole document to exercise every ScrollTrigger
await page.evaluate(async () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const steps = 60
  for (let i = 0; i <= steps; i++) {
    const y = (max * i) / steps
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
    else window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 55))
  }
})
await page.waitForTimeout(600)

const v = await page.evaluate(() => window.__v)
const longOver50 = v.long.filter((d) => d > 50)
console.log('── Perf (4x CPU throttle, scripted full scroll) ──')
console.log('LCP:', Math.round(v.lcp), 'ms   (budget 2500)')
console.log('CLS:', v.cls.toFixed(4), '        (budget 0.05)')
console.log('Long tasks >50ms:', longOver50.length, longOver50.length ? '→ ' + longOver50.join(',') : '')
console.log('Max long task:', v.long.length ? Math.max(...v.long) + 'ms' : '0ms')
await browser.close()
