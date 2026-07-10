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
console.log(`SECTION HEIGHT: ${geo.h}px = ${vhPct}vh → ${geo.h >= geo.innerH * 0.55 && geo.h <= geo.innerH * 0.66 ? 'IN 55–65vh ✓' : 'OUT OF RANGE ✗'}`)

// no bottom arc — section is a clean tight cream band flowing into Marquee
const lastBulletVisible = await page.evaluate(() => {
  const last = document.querySelector('.sustain-item:last-child').getBoundingClientRect()
  const sec = document.getElementById('sustainability').getBoundingClientRect()
  return { within: last.bottom <= sec.bottom + 1, arc: !!document.querySelector('.sustain-arc-bottom') }
})
console.log(`LAST BULLET within section: ${lastBulletVisible.within ? '✓' : '✗'}; sustain bottom arc present: ${lastBulletVisible.arc} (want false)`)

// ── STAGGER MID-FRAME — catch bullets mid rise/fade ──────────────────────────
await to(Math.round(geo.top - geo.innerH * 0.5))
await page.waitForTimeout(200)
await to(Math.round(geo.top - geo.innerH * 0.1)) // crosses the top-72% trigger
await page.waitForTimeout(360) // ~mid stagger
const midOpac = await page.evaluate(() => [...document.querySelectorAll('.sustain-item')].map((i) => +getComputedStyle(i).opacity.slice(0, 4)))
hideNav()
await page.screenshot({ path: resolve(out, 'sustain-stagger.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } })
showNav()
console.log(`  ✓ sustain-stagger.png — bullet opacities mid-stagger: ${JSON.stringify(midOpac)} (want a gradient, not all 1)`)

// ── settle → FULL SECTION ─────────────────────────────────────────────────────
await page.waitForTimeout(1400)
await page.setViewportSize({ width: 1536, height: 900 })
await page.waitForTimeout(150)
const sTop = await page.evaluate(() => document.getElementById('sustainability').getBoundingClientRect().top + window.scrollY)
await to(Math.round(sTop - 40))
await page.waitForTimeout(350)
hideNav()
await (await page.$('#sustainability')).screenshot({ path: resolve(out, 'sustain.png') })
showNav()
await page.setViewportSize(VP.viewport)
console.log('  ✓ sustain.png')

// ── JUNCTION certs → sustain (must be seamless cream, no dark band) ───────────
const junction = await page.evaluate(() => {
  const certs = document.getElementById('certifications').getBoundingClientRect()
  const sustain = document.getElementById('sustainability').getBoundingClientRect()
  const certsBottom = certs.bottom + window.scrollY
  const sustainTop = sustain.top + window.scrollY
  const hasCertsArcBottom = !!document.querySelector('.certs-arc-bottom')
  return { certsBottom: +certsBottom.toFixed(1), sustainTop: +sustainTop.toFixed(1), gap: +(sustainTop - certsBottom).toFixed(1), hasCertsArcBottom }
})
console.log(`\nJUNCTION certs→sustain: certsBottom=${junction.certsBottom}, sustainTop=${junction.sustainTop}, gap=${junction.gap}px, stray dark arc on certs=${junction.hasCertsArcBottom} (want false) → ${!junction.hasCertsArcBottom && Math.abs(junction.gap) < 2 ? 'SEAMLESS ✓' : 'CHECK ✗'}`)
// capture the boundary
await page.setViewportSize({ width: 1536, height: 900 })
await page.waitForTimeout(120)
await to(Math.round(junction.certsBottom - 380))
await page.waitForTimeout(300)
hideNav()
await page.screenshot({ path: resolve(out, 'junction-certs-sustain.png'), clip: { x: 0, y: 0, width: 1536, height: 760 } })
showNav()
await page.setViewportSize(VP.viewport)
console.log('  ✓ junction-certs-sustain.png')

// ── labels ≥11px ──────────────────────────────────────────────────────────────
const tiny = await page.evaluate(() => {
  const bad = []
  for (const s of ['.sustain-eyebrow', '.sustain-panel-note', '.sustain-item-text']) for (const el of document.querySelectorAll(s)) {
    const px = parseFloat(getComputedStyle(el).fontSize); if (px < 11) bad.push(`${s}=${px}`)
  }
  return bad
})
console.log(`LABELS ≥11px: ${tiny.length ? 'FAIL ' + JSON.stringify(tiny) : 'PASS ✓'}`)

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

// ── reduced motion — bullets static/visible ──────────────────────────────────
const rc = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.querySelector('#sustainability').scrollIntoView({ block: 'center' }))
await rp.waitForTimeout(600)
const rm = await rp.evaluate(() => ({ item: getComputedStyle(document.querySelector('.sustain-item')).opacity, title: getComputedStyle(document.querySelector('.sustain-title')).opacity }))
console.log(`REDUCED-MOTION: bullet opacity ${rm.item}, title ${rm.title} (want 1/1 static)`)
await rc.close()

await browser.close()
console.log('\nDONE.')
