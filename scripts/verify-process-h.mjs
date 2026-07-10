import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5176'
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
  const nodes = [...el.querySelectorAll('.hproc-node')].map((n) => Math.round(n.getBoundingClientRect().top))
  return {
    top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight,
    oneRow: new Set(nodes).size === 1, nodeCount: nodes.length,
  }
})
console.log('SECTION HEIGHT:', geo.h, 'px =', (geo.h / geo.innerH * 100).toFixed(1) + 'vh', '(', (geo.h / geo.innerH).toFixed(2), 'viewports )')
console.log('ONE CLEAN ROW @1536:', geo.oneRow, '| nodes:', geo.nodeCount)

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
// matches ScrollTrigger start 'top 78%' → end 'bottom 45%' (sectionH known)
const sectVh = geo.h / geo.innerH
const startY = Math.round(geo.top - 0.78 * geo.innerH)
const endY = Math.round(geo.top + geo.h - 0.45 * geo.innerH) // bottom hits 45% vh

// junction from the quote above → into process
await to(Math.round(geo.top - 0.72 * geo.innerH))
await page.waitForTimeout(800)
await page.screenshot({ path: resolve(out, 'process-h-junction.png') })
console.log('  ✓ process-h-junction.png')

// PROOF-OF-ANIMATION frames: 25 / 50 / 75% of the true trigger range must be
// PARTIALLY drawn with nodes lit only up to the beam.
for (const p of [0.25, 0.5, 0.75]) {
  await to(Math.round(startY + p * (endY - startY)))
  await page.waitForTimeout(760)
  const s = await page.evaluate(() => {
    const f = document.querySelector('.hproc-beam-fill')
    const t = document.querySelector('.hproc-beam-track')
    const lit = [...document.querySelectorAll('.hproc-node')].filter((n) => {
      const c = getComputedStyle(n).borderColor
      return c.includes('155') // rgb(155,116,32) = #9b7420
    }).length
    return { pct: Math.round((f.getBoundingClientRect().width / t.getBoundingClientRect().width) * 100), lit }
  })
  await page.screenshot({ path: resolve(out, `process-anim-${String(Math.round(p * 100)).padStart(2, '0')}.png`) })
  console.log(`  ✓ process-anim-${Math.round(p * 100)} | beam ${s.pct}% drawn | nodes lit: ${s.lit}/6`)
}

// full sweep record 0/33/66/100
for (const p of [0, 0.33, 0.66, 1]) {
  await to(Math.round(startY + p * (endY - startY)))
  await page.waitForTimeout(600)
  const fillW = await page.evaluate(() => +(document.querySelector('.hproc-beam-fill').getBoundingClientRect().width).toFixed(0))
  await page.screenshot({ path: resolve(out, `process-h-${String(Math.round(p * 100)).padStart(3, '0')}.png`) })
  console.log('  ✓ process-h', Math.round(p * 100), '| beam fill width:', fillW, 'px')
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

// reduced-motion → final drawn state
const rc = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.fonts && document.fonts.ready)
await rp.evaluate(() => { const el = document.getElementById('process'); el.scrollIntoView({ block: 'center' }) })
await rp.waitForTimeout(900)
const rm = await rp.evaluate(() => {
  const f = document.querySelector('.hproc-beam-fill')
  const t = document.querySelector('.hproc-beam-track')
  return { fillW: Math.round(f.getBoundingClientRect().width), trackW: Math.round(t.getBoundingClientRect().width) }
})
console.log('REDUCED-MOTION final: fill', rm.fillW, 'vs track', rm.trackW, '→ fully drawn:', Math.abs(rm.fillW - rm.trackW) < 3)
await rp.screenshot({ path: resolve(out, 'process-h-reduced.png') })
console.log('  ✓ process-h-reduced.png')

await browser.close()
