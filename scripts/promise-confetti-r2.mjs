import { chromium } from 'playwright'
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'

const URL = 'http://localhost:5233'
const OUT = 'shots/promise-confetti-r2'
mkdirSync(OUT, { recursive: true })

const errors = []
const b = await chromium.launch({ headless: false })
async function fresh({ reduced = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${m.type()}: ${m.text()}`) })
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return { ctx, p }
}
async function gotoPromise(p, lang) {
  await p.goto(URL, { waitUntil: 'networkidle' })
  if (lang === 'fr') { await p.evaluate(() => window.localStorage.setItem('qfp.lang', 'fr')); await p.reload({ waitUntil: 'networkidle' }) }
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(600)
}
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
const contrast = (fg, bg) => (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05)
const over = (fg, a, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)))
const FG = { eyebrow: { color: [168, 128, 42], alpha: 1 }, quote: { color: [253, 250, 244], alpha: 1 }, support: { color: [253, 250, 244], alpha: 0.66 }, attr: { color: [168, 128, 42], alpha: 1 } }
async function sampleBg(p, points) {
  await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = 'hidden' })
  const buf = await p.locator('#promise').screenshot()
  await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = '' })
  const url = 'data:image/png;base64,' + buf.toString('base64')
  return await p.evaluate(async ({ url, pts, dpr }) => {
    const img = new Image(); img.src = url; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    return pts.map((pt) => { const x = Math.min(c.width - 1, Math.max(0, Math.round(pt.x * dpr))); const y = Math.min(c.height - 1, Math.max(0, Math.round(pt.y * dpr))); const d = g.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]] })
  }, { url, pts: points, dpr: 1.25 })
}
async function textPoints(p) {
  return await p.evaluate(() => {
    const sec = document.getElementById('promise').getBoundingClientRect()
    const row = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); const cy = r.top + r.height / 2 - sec.top; return [0.15, 0.3, 0.5, 0.7, 0.85].map((fx) => ({ x: r.left + r.width * fx - sec.left, y: cy })) }
    return { eyebrow: row('.promise-eyebrow'), quote: row('.promise-quote'), support: row('.promise-support'), attr: row('.promise-attr') }
  })
}
function worst(bgByEl, n) {
  const out = {}
  for (const k of Object.keys(FG)) { let m = Infinity; for (const bg of bgByEl[k]) { const fg = FG[k].alpha < 1 ? over(FG[k].color, FG[k].alpha, bg) : FG[k].color; m = Math.min(m, contrast(fg, bg)) } out[k] = +m.toFixed(2) }
  return out
}

// ── FPS FIRST (cold, warmed) — ether + confetti + conveyor all live ──────────
let fps, fpsParked
{
  const b2 = await chromium.launch({ headless: false })
  const c2 = await b2.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await c2.newPage()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(5000)
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(700)
  await p.evaluate(async () => { const base = window.scrollY; const t0 = performance.now(); await new Promise((r) => { const t = () => { const k = (performance.now() - t0) / 1500; window.scrollTo(0, base - 400 + 800 * Math.abs(Math.sin(k * Math.PI))); performance.now() - t0 < 1800 ? requestAnimationFrame(t) : r() }; requestAnimationFrame(t) }); window.scrollTo(0, base) })
  await p.waitForTimeout(300)
  fpsParked = await p.evaluate(async () => { let n = 0; const t0 = performance.now(); return await new Promise((res) => { const t = () => { n++; performance.now() - t0 < 1800 ? requestAnimationFrame(t) : res(Math.round(n / (performance.now() - t0) * 1000)) }; requestAnimationFrame(t) }) })
  fps = await p.evaluate(async () => { const base = window.scrollY; let n = 0; const t0 = performance.now(); return await new Promise((res) => { const tick = () => { n++; const k = (performance.now() - t0) / 2600; window.scrollTo(0, base - 500 + 1000 * Math.abs(Math.sin(k * Math.PI))); performance.now() - t0 < 2600 ? requestAnimationFrame(tick) : res(Math.round(n / (performance.now() - t0) * 1000)) }; requestAnimationFrame(tick) }) })
  await b2.close()
}

// ── EN + FR sections; after = the R2 look; before = the R1 committed shot ─────
{
  const { ctx, p } = await fresh(); await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/after-en-section.png` })
  // close-up crop (top-left corner band) → shows the 3 shape variants + size range
  await p.locator('#promise').screenshot({ path: `${OUT}/closeup-crop.png`, clip: { x: 24, y: 70, width: 420, height: 300 } })
  await ctx.close()
}
if (existsSync('shots/promise-confetti/en-section.png')) copyFileSync('shots/promise-confetti/en-section.png', `${OUT}/before-en-section.png`)
{
  const { ctx, p } = await fresh(); await gotoPromise(p, 'fr')
  await p.locator('#promise').screenshot({ path: `${OUT}/after-fr-section.png` })
  await ctx.close()
}

// ── Burst 3 frames + densest-frame contrast + count + shape mix + safe zone ──
let densestContrast, counts, shapeMix, safeZone
{
  const { ctx, p } = await fresh(); await gotoPromise(p, 'en')
  const pts = await textPoints(p); const all = [...pts.eyebrow, ...pts.quote, ...pts.support, ...pts.attr]
  await p.evaluate(() => window.__PROMISE_CONFETTI__.refireBurst())
  await p.waitForTimeout(70); await p.locator('#promise').screenshot({ path: `${OUT}/burst-1.png` })
  const bg1 = await sampleBg(p, all) // densest — all pieces near the text ring
  await p.waitForTimeout(450); await p.locator('#promise').screenshot({ path: `${OUT}/burst-2.png` })
  const bg2 = await sampleBg(p, all)
  await p.waitForTimeout(1500); await p.locator('#promise').screenshot({ path: `${OUT}/burst-3.png` })
  const merge = (a) => ({ eyebrow: a.slice(0, 5), quote: a.slice(5, 10), support: a.slice(10, 15), attr: a.slice(15, 20) })
  const cs = [bg1, bg2].map((x) => worst(merge(x)))
  densestContrast = {}
  for (const k of Object.keys(FG)) densestContrast[k] = Math.min(...cs.map((c) => c[k]))
  // counts + shape mix + safe zone (from the dev hook)
  const s = await p.evaluate(() => window.__PROMISE_CONFETTI__.sample())
  const dims = await p.evaluate(() => window.__PROMISE_CONFETTI__.dims())
  const sr = await p.evaluate(() => window.__PROMISE_CONFETTI__.safeRect())
  const active = s.filter((x) => x.active)
  const ambient = s.filter((x) => x.ambient && x.active)
  counts = { ambientActive: ambient.length, totalActive: active.length }
  const shp = [0, 0, 0]; for (const x of active) shp[x.shape]++
  const tot = active.length
  shapeMix = { chip: +(shp[0] / tot).toFixed(2), sliver: +(shp[1] / tot).toFixed(2), streak: +(shp[2] / tot).toFixed(2) }
  const insideSafe = ambient.filter((x) => x.x > sr.l && x.x < sr.r && x.y > sr.t && x.y < sr.b).length
  safeZone = { rect: { l: Math.round(sr.l), t: Math.round(sr.t), r: Math.round(sr.r), b: Math.round(sr.b) }, w: Math.round(sr.r - sr.l), h: Math.round(sr.b - sr.t), sectionW: dims.W, ambientInsideSafeFraction: +(insideSafe / ambient.length).toFixed(3) }
  await ctx.close()
}

// ── Off-viewport + hidden-tab rAF pause proof ────────────────────────────────
let pauseProof
{
  const { ctx, p } = await fresh(); await gotoPromise(p, 'en')
  const ticks = () => p.evaluate(() => window.__PROMISE_CONFETTI_TICKS__ || 0)
  const a0 = await ticks(); await p.waitForTimeout(450); const a1 = await ticks()
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600)
  const b0 = await ticks(); await p.waitForTimeout(450); const b1 = await ticks()
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(500)
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  await p.waitForTimeout(300)
  const c0 = await ticks(); await p.waitForTimeout(450); const c1 = await ticks()
  pauseProof = { onDelta: a1 - a0, offDelta: b1 - b0, hiddenDelta: c1 - c0, pausesOffViewport: (b1 - b0) <= 2, pausesHiddenTab: (c1 - c0) <= 2 }
  await ctx.close()
}

// ── Palette audit ────────────────────────────────────────────────────────────
let palette
{
  const { ctx, p } = await fresh(); await gotoPromise(p, 'en')
  const colors = await p.evaluate(() => window.__PROMISE_CONFETTI__.colors())
  const pal = await p.evaluate(() => window.__PROMISE_CONFETTI__.palette())
  const palSet = new Set(pal.map((c) => c.toLowerCase()))
  const outside = colors.filter((c) => !palSet.has(String(c).toLowerCase()))
  const sec = await p.evaluate(() => { const r = document.getElementById('promise').getBoundingClientRect(); return { w: r.width, h: r.height } })
  const grid = []; for (let gx = 0; gx <= 30; gx++) for (let gy = 0; gy <= 16; gy++) grid.push({ x: sec.w * (gx / 30), y: sec.h * (gy / 16) })
  const px = await sampleBg(p, grid)
  const forbidden = px.filter(([r, g, bl]) => { const violet = bl === Math.max(r, g, bl) && r > 60 && r > g + 22 && bl > g + 22; const pink = r > 120 && bl > 110 && g < r - 45 && g < bl - 30; const coral = r > 180 && g > 80 && g < 150 && bl < 90 && (r - g) > 70; return violet || pink || coral })
  palette = { pieces: colors.length, outsidePalette: outside, forbiddenHuePixels: forbidden.length, paletteOk: outside.length === 0 && forbidden.length === 0 }
  await ctx.close()
}

// ── Reduced motion: static scatter, no rAF, no burst ─────────────────────────
let reduced
{
  const { ctx, p } = await fresh({ reduced: true }); await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/reduced.png` })
  const t0 = await p.evaluate(() => window.__PROMISE_CONFETTI_TICKS__ || 0); await p.waitForTimeout(800); const t1 = await p.evaluate(() => window.__PROMISE_CONFETTI_TICKS__ || 0)
  const info = await p.evaluate(() => ({ active: window.__PROMISE_CONFETTI__.activeCount(), burst: window.__PROMISE_CONFETTI__.burstFired() }))
  reduced = { ticksDelta: t1 - t0, staticNoRaf: (t1 - t0) === 0, activePieces: info.active, burstFired: info.burst }
  await ctx.close()
}

await b.close()
const aa = densestContrast && Object.values(densestContrast).every((v) => v >= 4.5)
console.log(JSON.stringify({
  densestContrast, aa_all_pass: aa,
  counts, shapeMix, safeZone, pauseProof, palette,
  fps, fpsParked, fps_ok: fps >= 55,
  reduced, consoleErrors: errors,
}, null, 2))
