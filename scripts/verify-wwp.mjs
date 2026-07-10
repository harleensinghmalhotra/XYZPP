// Verify What We Print: headed 1536×743 DPR 1.25.
// - scrub screenshots across the exact pin range (0/25/50/75/100%)
// - entry (strips→section junction) + release (into next section)
// - 60fps audit on the pinned scrub + CLS on pin/unpin
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'http://localhost:5175'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({
  viewport: { width: 1536, height: 743 },
  deviceScaleFactor: 1.25,
})

// CLS observer installed before any layout settles
await page.addInitScript(() => {
  window.__cls = 0
  window.__clsEntries = []
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (!e.hadRecentInput) {
        window.__cls += e.value
        window.__clsEntries.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime) })
      }
    }
  }).observe({ type: 'layout-shift', buffered: true })
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(1400)

const scrollTo = (y) =>
  page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)

// Geometry of the pin range
const geo = await page.evaluate(() => {
  const el = document.getElementById('services')
  const r = el.getBoundingClientRect()
  const top = r.top + window.scrollY
  const travel = el.offsetHeight - window.innerHeight
  return { top, travel, height: el.offsetHeight, innerH: window.innerHeight }
})
console.log('pin geometry:', geo)

// Entry: just before the pin engages (strips→section junction visible)
await scrollTo(Math.max(0, geo.top - Math.round(geo.innerH * 0.5)))
await page.waitForTimeout(700)
await page.screenshot({ path: resolve(out, 'wwp-scrub-entry.png') })

// Scrub across the pin
for (const p of [0, 0.25, 0.5, 0.75, 1]) {
  await scrollTo(Math.round(geo.top + geo.travel * p))
  await page.waitForTimeout(850) // let the 0.32s quickTo settle
  const pct = String(Math.round(p * 100)).padStart(3, '0')
  await page.screenshot({ path: resolve(out, `wwp-scrub-${pct}.png`) })
  console.log('  ✓ scrub', pct)
}

// Per-card closeup — the cutouts must visibly break out of the card tops
await scrollTo(Math.round(geo.top + geo.travel * 0.06))
await page.waitForTimeout(700)
await page.locator('#services .wwp-viewport').screenshot({ path: resolve(out, 'wwp-cards.png') })
console.log('  ✓ wwp-cards closeup')

// Release: just past the pin, into the next section
await scrollTo(Math.round(geo.top + geo.travel + geo.innerH * 0.6))
await page.waitForTimeout(700)
await page.screenshot({ path: resolve(out, 'wwp-scrub-release.png') })

// ---- 60fps audit: animate Lenis through the whole pin, sample rAF deltas ----
await scrollTo(geo.top)
await page.waitForTimeout(500)
const fps = await page.evaluate(
  ({ top, travel }) =>
    new Promise((done) => {
      const deltas = []
      let last = performance.now()
      let raf
      const sample = (t) => {
        deltas.push(t - last)
        last = t
        raf = requestAnimationFrame(sample)
      }
      raf = requestAnimationFrame(sample)
      const dur = 2600
      if (window.__lenis) window.__lenis.scrollTo(top + travel, { duration: dur / 1000 })
      else window.scrollTo(0, top + travel)
      setTimeout(() => {
        cancelAnimationFrame(raf)
        const d = deltas.slice(3).sort((a, b) => a - b)
        const pct = (q) => d[Math.min(d.length - 1, Math.floor(d.length * q))]
        const mean = d.reduce((a, b) => a + b, 0) / d.length
        const long = d.filter((x) => x > 18.5).length
        done({
          frames: d.length,
          fpsMean: +(1000 / mean).toFixed(1),
          msP50: +pct(0.5).toFixed(2),
          msP95: +pct(0.95).toFixed(2),
          msMax: +d[d.length - 1].toFixed(2),
          longFrames: long,
          longPct: +((long / d.length) * 100).toFixed(1),
        })
      }, dur + 300)
    }),
  geo,
)
console.log('FPS audit:', fps)

const cls = await page.evaluate(() => ({ cls: +window.__cls.toFixed(5), entries: window.__clsEntries }))
console.log('CLS total:', cls.cls, 'entries:', cls.entries.length)
if (cls.entries.length) console.log('  shifts:', JSON.stringify(cls.entries.slice(0, 8)))

await browser.close()
console.log('done')
