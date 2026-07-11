import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const URL = process.env.URL || 'http://localhost:5233'
const OUT = 'shots/promise-lightfall-full'
mkdirSync(OUT, { recursive: true })

const errors = []
const warns = []
const b = await chromium.launch({ headless: false })
const GL_INIT = `window.__GL={webglCreated:0};const _gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t){const c=_gc.apply(this,arguments);if(c&&/webgl/i.test(String(t)))window.__GL.webglCreated++;return c};`

async function fresh({ reduced = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await ctx.addInitScript(GL_INIT)
  const p = await ctx.newPage()
  p.on('console', (m) => { const tx = m.text(); if (m.type() === 'error') errors.push(`error: ${tx}`); if (m.type() === 'warning' && /webgl|context/i.test(tx)) warns.push(tx) })
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return { ctx, p }
}
async function gotoPromise(p, lang) {
  await p.goto(URL, { waitUntil: 'networkidle' })
  if (lang === 'fr') { await p.evaluate(() => window.localStorage.setItem('qfp.lang', 'fr')); await p.reload({ waitUntil: 'networkidle' }) }
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(1000)
}

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
const contrast = (fg, bg) => (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05)
const over = (fg, a, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)))
const FG = {
  eyebrow: { color: [168, 128, 42], alpha: 1 },
  quote:   { color: [253, 250, 244], alpha: 1 },
  support: { color: [253, 250, 244], alpha: 0.66 },
  attr:    { color: [168, 128, 42], alpha: 1 },
}
async function textPoints(p) {
  // Sample only where the INK is: a Range gives the tight glyph rect, so short
  // CENTRED text (eyebrow/attr/support) isn't measured over the text-free rain at
  // its full-width container's edges — only under the actual letters.
  return await p.evaluate(() => {
    const sec = document.getElementById('promise').getBoundingClientRect()
    const inkRow = (sel, n = 7) => { const e = document.querySelector(sel); const rng = document.createRange(); rng.selectNodeContents(e); const r = rng.getBoundingClientRect(); const cy = r.top + r.height / 2 - sec.top; const l = r.left - sec.left + 2, w = r.width - 4; return Array.from({ length: n }, (_, i) => ({ x: l + w * (i / (n - 1)), y: cy })) }
    return { eyebrow: inkRow('.promise-eyebrow'), quote: inkRow('.promise-quote', 9), support: inkRow('.promise-support'), attr: inkRow('.promise-attr') }
  })
}
async function sampleBgOnce(p, pts) {
  await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = 'hidden' })
  const buf = await p.locator('#promise').screenshot()
  await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = '' })
  const url = 'data:image/png;base64,' + buf.toString('base64')
  return await p.evaluate(async ({ url, pts, dpr }) => {
    const img = new Image(); img.src = url; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const read = (arr) => arr.map((pt) => { const x = Math.min(c.width - 1, Math.max(0, Math.round(pt.x * dpr))); const y = Math.min(c.height - 1, Math.max(0, Math.round(pt.y * dpr))); const d = g.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]] })
    const out = {}; for (const k of Object.keys(pts)) out[k] = read(pts[k]); return out
  }, { url, pts, dpr: 1.25 })
}
// Worst-case (brightest background → lowest contrast) across N rain frames, cursor
// swept across the whole text zone to catch the brightest mouse-bend state too.
async function worstContrast(p, frames = 16, gap = 100) {
  const pts = await textPoints(p)
  const worstBg = {}
  for (let f = 0; f < frames; f++) {
    await p.mouse.move(240 + (f * 130) % 1060, 150 + (f * 61) % 440) // agitate across text zone
    const bg = await sampleBgOnce(p, pts)
    for (const k of Object.keys(bg)) for (const c of bg[k]) if (!worstBg[k] || lum(c) > lum(worstBg[k])) worstBg[k] = c
    await p.waitForTimeout(gap)
  }
  const out = {}
  for (const k of Object.keys(FG)) {
    const bg = worstBg[k]
    const fg = FG[k].alpha < 1 ? over(FG[k].color, FG[k].alpha, bg) : FG[k].color
    out[k] = { ratio: +contrast(fg, bg).toFixed(2), bg }
  }
  return out
}
async function patchLum(p, x, y, w, h) {
  const buf = await p.screenshot({ clip: { x, y, width: w, height: h } })
  const url = 'data:image/png;base64,' + buf.toString('base64')
  return await p.evaluate(async ({ url }) => {
    const img = new Image(); img.src = url; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data
    let s = 0, n = 0
    for (let i = 0; i < d.length; i += 4) { s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++ }
    return s / n
  }, { url })
}

const report = {}

// ── 1. FPS — full-page scroll + steady-state at promise (rain live) ──────────
{
  const { ctx, p } = await fresh()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(4500)
  report.fpsFullScroll = await p.evaluate(() => new Promise((res) => {
    const h = Math.max(1, document.body.scrollHeight - window.innerHeight)
    let n = 0; const start = performance.now(); const dur = 2600
    const tick = (t) => { n++; const prog = Math.min(1, (t - start) / dur); window.scrollTo(0, prog * h); if (prog < 1) requestAnimationFrame(tick); else res(Math.round(n / ((performance.now() - start) / 1000))) }
    requestAnimationFrame(tick)
  }))
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(800)
  report.promiseSteadyFps = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 >= 1500) res(Math.round(n / ((performance.now() - t0) / 1000))); else requestAnimationFrame(tick) }; requestAnimationFrame(tick) }))
  await ctx.close()
}

// ── 2. EN — full section, 4 fall frames, mouse-bend, contrast, pause proof ───
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  await p.mouse.move(1460, 120); await p.waitForTimeout(300)
  await p.locator('#promise').screenshot({ path: `${OUT}/01-full-en.png` })
  for (let i = 0; i < 4; i++) { await p.locator('#promise').screenshot({ path: `${OUT}/fall-${i}.png` }); await p.waitForTimeout(400) }

  // mouse-bend (dual-region diff): top-right streak zone vs top-left control
  const R = { x: 1360, y: 70, w: 150, h: 120, cx: 1435, cy: 130 }, C = { x: 25, y: 70, w: 150, h: 120 }
  const bothLum = async (n) => { let r = 0, c = 0; for (let i = 0; i < n; i++) { r += await patchLum(p, R.x, R.y, R.w, R.h); c += await patchLum(p, C.x, C.y, C.w, C.h); await p.waitForTimeout(60) } return { r: r / n, c: c / n } }
  await p.mouse.move(760, 720); await p.waitForTimeout(550)
  const off = await bothLum(16)
  await p.mouse.move(R.cx, R.cy); await p.waitForTimeout(600)
  const on = await bothLum(16)
  await p.locator('#promise').screenshot({ path: `${OUT}/02-mouse-bend.png` })
  report.mouseBend = { cursorSideBend: +(on.r - off.r).toFixed(2), controlSideBend: +(on.c - off.c).toFixed(2), cursorSideBrighterBy: +((on.r - off.r) - (on.c - off.c)).toFixed(2), brighter: ((on.r - off.r) - (on.c - off.c)) > 1.0 }

  report.mounted = await p.evaluate(() => { const c = document.querySelector('.promise-lightfall canvas'); return { canvasCount: window.__PROMISE_LIGHTFALL__?.canvasCount?.() ?? -1, buffer: c ? { w: c.width, cssW: Math.round(c.getBoundingClientRect().width) } : null } })

  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  report.contrastEN = await worstContrast(p, 16, 95)

  // off-viewport pause/unmount
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(900)
  report.pauseOffViewport = await p.evaluate(() => ({ active: window.__PROMISE_LIGHTFALL__?.active?.() ?? null, canvasCount: window.__PROMISE_LIGHTFALL__?.canvasCount?.() ?? -1 }))
  await ctx.close()
}

// ── 3. FR full section ───────────────────────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  await p.mouse.move(1460, 120); await p.waitForTimeout(300)
  await p.locator('#promise').screenshot({ path: `${OUT}/03-full-fr.png` })
  report.contrastFR = await worstContrast(p, 14, 95)
  await ctx.close()
}

// ── 4. Reduced motion — Lightfall NOT mounted, glow only, confetti gone ──────
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/04-reduced-motion.png` })
  report.reducedMotion = await p.evaluate(() => ({
    lightfallCanvas: document.querySelectorAll('.promise-lightfall canvas').length,
    confettiPresent: !!document.querySelector('.promise-confetti'),
    glow: document.querySelectorAll('.promise-glow').length,
  }))
  await ctx.close()
}

await b.close()

// ── 5. confetti-removal grep proof (source, code lines only) ─────────────────
function grep(re, paths) { try { const out = execSync(`git grep -nE "${re}" -- ${paths}`, { cwd: process.cwd() }).toString(); return out.trim() ? out.trim().split('\n') : [] } catch { return [] } }
const codeOnly = (lines) => lines.filter((l) => { const src = l.replace(/^[^:]*:\d+:/, '').trim(); return !src.startsWith('//') && !src.startsWith('*') && !src.startsWith('/*') })
report.grep = {
  confettiAnywhereInSrc: grep('[Cc]onfetti', 'src/'),
  fullPowerProps: (() => { try { return execSync('git grep -nE "opacity=\\{1\\}|backgroundGlow=\\{0.5\\}|speed=\\{0.5\\}|twinkle=\\{1\\}|mouseStrength=\\{0.5\\}|density=\\{0.6\\}" -- src/sections/promise/PromiseLightfall.jsx', { cwd: process.cwd() }).toString().trim().split('\n').length } catch { return 0 } })(),
}
report.consoleErrors = errors
report.glWarnings = warns

const greenEN = Object.values(report.contrastEN).every((v) => v.ratio >= 4.5)
const greenFR = Object.values(report.contrastFR).every((v) => v.ratio >= 4.5)
report.PASS = {
  confettiGone: report.grep.confettiAnywhereInSrc.length === 0,
  fullPowerProps: report.grep.fullPowerProps === 6,
  contrastAllGreen: greenEN && greenFR,
  mouseBend: report.mouseBend.brighter,
  dprCappedAt1: report.mounted.buffer && report.mounted.buffer.w === report.mounted.buffer.cssW,
  pausesOffViewport: report.pauseOffViewport.canvasCount === 0 && report.pauseOffViewport.active === false,
  reducedMotion_noCanvas: report.reducedMotion.lightfallCanvas === 0 && report.reducedMotion.glow === 1 && report.reducedMotion.confettiPresent === false,
  promiseSteadyFps: report.promiseSteadyFps,
  fpsPass: report.promiseSteadyFps >= 55,
  fpsFullScroll_conveyorBound: report.fpsFullScroll,
  noConsoleErrors: errors.length === 0,
}
console.log(JSON.stringify(report, null, 2))
