import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(500)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.display = 'none' } })
const showNav = () => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })

const geo = await page.evaluate(() => {
  const el = document.getElementById('sustainability')
  return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
})
const vhPct = (geo.h / geo.innerH * 100).toFixed(1)
console.log(`SECTION HEIGHT: ${geo.h}px = ${vhPct}vh → ${geo.h >= geo.innerH * 0.74 && geo.h <= geo.innerH * 0.86 ? 'IN ~75–85vh ✓' : 'OUT OF RANGE ✗'}`)

// ── STROKE-DRAW MID-FRAME of the motif ────────────────────────────────────────
await to(Math.round(geo.top - geo.innerH * 0.45))
await page.waitForTimeout(150)
await to(Math.round(geo.top - geo.innerH * 0.05)) // cross the top-72% trigger
let midInfo = null
for (let i = 0; i < 44; i++) {
  const st = await page.evaluate(() => {
    const ps = [...document.querySelectorAll('.sustain-motif .pdraw')]
    if (!ps.length) return null
    // average drawn-fraction across strokes (0 = undrawn, 1 = fully inked)
    let sum = 0, n = 0
    for (const p of ps) {
      const cs = getComputedStyle(p)
      const dash = parseFloat(cs.strokeDasharray) || 0
      const off = parseFloat(cs.strokeDashoffset) || 0
      if (dash > 0) { sum += 1 - off / dash; n++ }
    }
    return n ? +(sum / n).toFixed(3) : null
  })
  if (st != null && st > 0.12 && st < 0.82) {
    midInfo = st
    hideNav()
    const box = await page.evaluate(() => { const r = document.querySelector('.sustain-media').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
    await page.screenshot({ path: resolve(out, 'sustain-motif.png'), clip: { x: Math.max(0, Math.round(box.x - 40)), y: Math.max(0, Math.round(box.y - 40)), width: Math.round(box.w + 80), height: Math.round(Math.min(geo.innerH - box.y + 40, box.h + 80)) } })
    showNav()
    break
  }
  await page.waitForTimeout(40)
}
console.log(`MOTIF STROKE-DRAW: ${midInfo != null ? `captured mid-draw @ ${(midInfo * 100).toFixed(0)}% inked → sustain-motif.png ✓` : 'MISSED ✗'}`)

// ── settle → FULL SECTION ─────────────────────────────────────────────────────
await page.waitForTimeout(1600)
await page.setViewportSize({ width: 1536, height: 1040 })
await page.waitForTimeout(150)
const sTop = await page.evaluate(() => document.getElementById('sustainability').getBoundingClientRect().top + window.scrollY)
const sH = await page.evaluate(() => document.getElementById('sustainability').offsetHeight)
await to(Math.round(sTop - 20))
await page.waitForTimeout(350)
hideNav()
await page.screenshot({ path: resolve(out, 'sustain-v2.png'), clip: { x: 0, y: 0, width: 1536, height: Math.min(1040, sH + 40) } })
showNav()
await page.setViewportSize(VP.viewport)
console.log('  ✓ sustain-v2.png')

// chips present + drawn
const chips = await page.evaluate(() => [...document.querySelectorAll('.sustain-chip')].map((c) => c.textContent))
console.log('  chips:', JSON.stringify(chips))

// ── FPS + CLS ─────────────────────────────────────────────────────────────────
await to(Math.round(geo.top - geo.innerH))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 1800
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: geo.top + geo.h })
console.log('\nFPS:', JSON.stringify(fps), 'CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe ───────────────────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#sustainability').analyze()
console.log('axe #sustainability violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}`); for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' '), '::', (n.failureSummary || '').split('\n').pop()) }
const cc = axe.violations.find((v) => v.id === 'color-contrast')
console.log('color-contrast:', cc ? 'FAIL ✗' : 'PASS ✓')
console.log('pageerrors:', errors.length ? errors : 'none')

// ── reduced motion — motif fully drawn, static ───────────────────────────────
const rc = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.querySelector('#sustainability').scrollIntoView({ block: 'center' }))
await rp.waitForTimeout(600)
const rm = await rp.evaluate(() => {
  const p = document.querySelector('.sustain-motif .pdraw')
  const cs = getComputedStyle(p)
  return { dash: cs.strokeDasharray, title: getComputedStyle(document.querySelector('.sustain-title')).opacity }
})
console.log(`REDUCED-MOTION: motif dash="${rm.dash}" (want none/0 → fully drawn), title opacity ${rm.title}`)
await rc.close()

await browser.close()
console.log('\nDONE.')
