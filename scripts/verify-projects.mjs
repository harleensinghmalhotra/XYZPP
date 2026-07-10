import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5177'
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

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const geo = await page.evaluate(() => {
  const el = document.getElementById('projects')
  return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
})
console.log('SECTION HEIGHT:', geo.h, 'px =', (geo.h / geo.innerH).toFixed(2), 'viewports')

// bring section to top, let entrance + globe run
await to(Math.round(geo.top))
await page.waitForTimeout(2600)
await page.screenshot({ path: resolve(out, 'projects-full.png') })
console.log('  ✓ projects-full.png')

// ── GLOBE rotation proof — two frames ~800ms apart, assert pixel delta ───────
const globeBox = await (await page.$('.proj-globe')).boundingBox()
const clip = { x: Math.round(globeBox.x), y: Math.round(globeBox.y), width: Math.round(globeBox.width), height: Math.round(globeBox.height) }
const g1 = await page.screenshot({ clip })
await page.waitForTimeout(850)
const g2 = await page.screenshot({ clip })
await sharp(g2).png().toFile(resolve(out, 'projects-globe.png'))
const [r1, r2] = await Promise.all([
  sharp(g1).raw().toBuffer({ resolveWithObject: true }),
  sharp(g2).raw().toBuffer({ resolveWithObject: true }),
])
let diff = 0
const a = r1.data, bb = r2.data
for (let i = 0; i < a.length; i += 4) { if (Math.abs(a[i] - bb[i]) + Math.abs(a[i + 1] - bb[i + 1]) + Math.abs(a[i + 2] - bb[i + 2]) > 24) diff++ }
const totalPx = (a.length / 4)
const pct = (diff / totalPx * 100).toFixed(2)
console.log(`  ✓ projects-globe.png — rotating: ${diff}/${totalPx} px changed (${pct}%) →`, diff > totalPx * 0.005 ? 'ROTATES ✓' : 'STATIC ✗')

// ── TICKER mid-count ─────────────────────────────────────────────────────────
const gridTop = await page.evaluate(() => document.querySelector('.proj-mile').getBoundingClientRect().top + window.scrollY)
await to(Math.round(gridTop - geo.innerH * 0.55)) // put grid ~centre → IO(0.5) fires
await page.waitForTimeout(430) // ~1/3 into the 1300ms count
const midVals = await page.evaluate(() => [...document.querySelectorAll('.proj-tile-num')].map((n) => n.textContent.trim()))
await page.screenshot({ path: resolve(out, 'projects-ticker.png') })
console.log('  ✓ projects-ticker.png — mid-count sample:', JSON.stringify(midVals.slice(0, 4)))
await page.waitForTimeout(1400)
const finalVals = await page.evaluate(() => [...document.querySelectorAll('.proj-tile-num')].map((n) => n.textContent.trim()))
console.log('    final values:', JSON.stringify(finalVals))

// ── HOVER — lift one tile, neighbours dim ────────────────────────────────────
const tile = (await page.$$('.proj-tile'))[0]
const tb = await tile.boundingBox()
await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2)
await page.waitForTimeout(360)
const opac = await page.evaluate(() => {
  const t = [...document.querySelectorAll('.proj-tile')]
  return { hovered: getComputedStyle(t[0]).opacity, neighbour: getComputedStyle(t[1]).opacity }
})
await page.screenshot({ path: resolve(out, 'projects-hover.png') })
console.log(`  ✓ projects-hover.png — hovered opacity ${opac.hovered}, neighbour ${opac.neighbour} (want <1)`)
await page.mouse.move(10, 10)

// ── FPS scrub + CLS ──────────────────────────────────────────────────────────
await to(Math.round(geo.top - geo.innerH))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2200
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: geo.top + geo.h })
console.log('FPS:', fps)
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe ──────────────────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#projects').analyze()
console.log('axe #projects violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}: ${v.help}`); for (const n of v.nodes.slice(0, 3)) console.log('     ', n.target.join(' '), '::', (n.failureSummary || '').split('\n').slice(-1)[0]) }

// ── TOGGLE — hideRestricted → HDFC + ZEE absent ──────────────────────────────
const tp = await ctx.newPage()
await tp.goto(url + '?hideRestricted', { waitUntil: 'networkidle', timeout: 60000 })
await tp.evaluate(() => document.fonts && document.fonts.ready)
await tp.evaluate(() => window.__lenis && window.__lenis.scrollTo(document.querySelector('.proj-mile').getBoundingClientRect().top + window.scrollY - 100, { immediate: true }))
await tp.waitForTimeout(1500)
const toggled = await tp.evaluate(() => {
  const names = [...document.querySelectorAll('.proj-tile-name')].map((n) => n.textContent)
  return { count: names.length, hasHDFC: names.includes('HDFC Bank'), hasZEE: names.includes('ZEE Learn'), names }
})
await tp.screenshot({ path: resolve(out, 'projects-toggled.png') })
console.log(`  ✓ projects-toggled.png — tiles: ${toggled.count} (want 6), HDFC:${toggled.hasHDFC} ZEE:${toggled.hasZEE} (want false/false)`)
await tp.close()

// ── reduced-motion — static globe, final text ───────────────────────────────
const rc = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.fonts && document.fonts.ready)
await rp.evaluate(() => document.getElementById('projects').scrollIntoView({ block: 'start' }))
await rp.waitForTimeout(900)
const rgClip = await (await rp.$('.proj-globe')).boundingBox()
const clip2 = { x: Math.round(rgClip.x), y: Math.round(rgClip.y), width: Math.round(rgClip.width), height: Math.round(rgClip.height) }
const rgg1 = await rp.screenshot({ clip: clip2 }); await rp.waitForTimeout(700); const rgg2 = await rp.screenshot({ clip: clip2 })
const [rr1, rr2] = await Promise.all([sharp(rgg1).raw().toBuffer(), sharp(rgg2).raw().toBuffer()])
let rdiff = 0; for (let i = 0; i < rr1.length; i += 4) { if (Math.abs(rr1[i] - rr2[i]) > 24) rdiff++ }
const rmText = await rp.evaluate(() => document.querySelector('.pw') && getComputedStyle(document.querySelector('.pw')).opacity)
console.log(`REDUCED-MOTION: globe static (${rdiff} px changed, want ~0) | header words visible (pw opacity ${rmText})`)
await rp.screenshot({ path: resolve(out, 'projects-reduced.png') })
await browser.close()
