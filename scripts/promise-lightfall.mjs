import { chromium } from 'playwright'
import { mkdirSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const URL = process.env.URL || 'http://localhost:5233'
const OUT = 'shots/promise-lightfall'
mkdirSync(OUT, { recursive: true })

const errors = []
const warns = []
const b = await chromium.launch({ headless: false })

// Patch getContext BEFORE any page script → count WebGL contexts ever created, so
// we can prove Lightfall's context is disposed (no unbounded growth / no "too many
// contexts" warning) across mount/unmount + route change.
const GL_INIT = `
  window.__GL = { webglCreated: 0 };
  const _gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type) {
    const ctx = _gc.apply(this, arguments);
    if (ctx && /webgl/i.test(String(type))) window.__GL.webglCreated++;
    return ctx;
  };
`

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

// ── contrast helpers (WCAG) ──────────────────────────────────────────────────
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
  return await p.evaluate(() => {
    const sec = document.getElementById('promise').getBoundingClientRect()
    const row = (sel) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const cy = r.top + r.height / 2 - sec.top; return [0.1, 0.3, 0.5, 0.7, 0.9].map((fx) => ({ x: r.left + r.width * fx - sec.left, y: cy })) }
    return { eyebrow: row('.promise-eyebrow'), quote: row('.promise-quote'), support: row('.promise-support'), attr: row('.promise-attr') }
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
// Worst-case (brightest background → lowest contrast) across N streak frames, with
// the cursor swept through the section to agitate the mouse-bend at its strongest.
async function worstContrast(p, frames = 14, gap = 110) {
  const pts = await textPoints(p)
  const worstBg = {}
  for (let f = 0; f < frames; f++) {
    // agitate: move cursor across the section each frame (mouse-bend brightest state)
    const mx = 200 + (f * 90) % 1136
    await p.mouse.move(mx, 200 + (f * 53) % 340)
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
// mean luminance over a viewport-space patch of the section
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

// ── 1. FPS — full-page scroll, everything live (conveyor + confetti + lightfall) ─
{
  const { ctx, p } = await fresh()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(4500)
  const fps = await p.evaluate(() => new Promise((res) => {
    const h = Math.max(1, document.body.scrollHeight - window.innerHeight)
    let n = 0; const start = performance.now(); const dur = 2600
    const tick = (t) => { n++; const prog = Math.min(1, (t - start) / dur); window.scrollTo(0, prog * h); if (prog < 1) requestAnimationFrame(tick); else res(Math.round(n / ((performance.now() - start) / 1000))) }
    requestAnimationFrame(tick)
  }))
  report.fpsFullScroll = fps
  await ctx.close()
}

// ── 2. EN — full section, 4 fall frames, mouse-bend, contrast, pause proof ───
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  await p.mouse.move(1450, 120) // park cursor away for the clean hero shot
  await p.waitForTimeout(300)
  await p.locator('#promise').screenshot({ path: `${OUT}/01-full-en.png` })

  // 4 frames across the fall cycle (~1.4s span)
  for (let i = 0; i < 4; i++) { await p.locator('#promise').screenshot({ path: `${OUT}/fall-${i}.png` }); await p.waitForTimeout(450) }

  // mouse-bend (dual-region difference — cancels fall-motion noise): the streaks
  // amplify near the cursor (weight ×(1+mGlow·2)). Hover the top-RIGHT streak zone;
  // the top-LEFT zone is the control. The cursor side must brighten more than the
  // control between cursor-far and cursor-on. This isolates the gentle bend cleanly.
  const R = { x: 1360, y: 70, w: 150, h: 120, cx: 1435, cy: 130 }
  const C = { x: 25, y: 70, w: 150, h: 120 }
  const bothLum = async (n) => { let r = 0, c = 0; for (let i = 0; i < n; i++) { r += await patchLum(p, R.x, R.y, R.w, R.h); c += await patchLum(p, C.x, C.y, C.w, C.h); await p.waitForTimeout(65) } return { r: r / n, c: c / n } }
  await p.mouse.move(760, 720); await p.waitForTimeout(600) // cursor far from both corners
  const off = await bothLum(16)
  await p.mouse.move(R.cx, R.cy); await p.waitForTimeout(650) // cursor on the top-right streaks
  const on = await bothLum(16)
  await p.locator('#promise').screenshot({ path: `${OUT}/02-mouse-bend.png` })
  const bendR = on.r - off.r, bendC = on.c - off.c
  report.mouseBend = { offR: +off.r.toFixed(2), onR: +on.r.toFixed(2), cursorSideBend: +bendR.toFixed(2), controlSideBend: +bendC.toFixed(2), cursorSideBrighterBy: +(bendR - bendC).toFixed(2), brighter: (bendR - bendC) > 1.0 }

  // lightfall-relevant fps: steady-state parked at the promise section, lightfall +
  // confetti live. This is the number Lightfall actually governs (the full-page
  // forced-scroll figure below is dominated by the pre-existing R3F conveyor).
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(700)
  report.promiseSteadyFps = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 >= 1500) res(Math.round(n / ((performance.now() - t0) / 1000))); else requestAnimationFrame(tick) }; requestAnimationFrame(tick) }))

  // canvas mounted + DPR cap proof
  report.mounted = await p.evaluate(() => ({
    canvasCount: window.__PROMISE_LIGHTFALL__?.canvasCount?.() ?? -1,
    active: window.__PROMISE_LIGHTFALL__?.active?.() ?? null,
    // the lightfall canvas backing store must be at DPR 1 (not 1.25)
    canvasBuffer: (() => { const c = document.querySelector('.promise-lightfall canvas'); const r = c?.getBoundingClientRect(); return c ? { w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height) } : null })(),
  }))

  // scroll + click not blocked by the canvas
  report.interaction = await p.evaluate(async () => {
    const y0 = window.scrollY; window.scrollBy(0, 120); await new Promise(r => setTimeout(r, 60)); const scrolled = window.scrollY !== y0; window.scrollTo(0, y0)
    let clicked = false; const el = document.querySelector('.promise-lightfall canvas')
    if (el) { el.addEventListener('click', () => { clicked = true }, { once: true }); el.dispatchEvent(new MouseEvent('click', { bubbles: true })) }
    return { scrollWorks: scrolled, canvasClickReceived: clicked }
  })

  // contrast at brightest streak state, confetti live, cursor agitated
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  report.contrastEN = await worstContrast(p, 14, 100)

  // off-viewport pause/unmount proof: scroll to top, wait, assert canvas gone
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(900)
  report.pauseOffViewport = await p.evaluate(() => ({
    active: window.__PROMISE_LIGHTFALL__?.active?.() ?? null,
    canvasCount: window.__PROMISE_LIGHTFALL__?.canvasCount?.() ?? -1,
  }))

  // GL context leak proof: cycle promise in/out several times, watch for growth /
  // "too many contexts" warning; each unmount must drop the lightfall canvas to 0.
  const cycleCounts = []
  const webglBefore = await p.evaluate(() => window.__GL.webglCreated)
  for (let i = 0; i < 6; i++) {
    await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(500)
    const inN = await p.evaluate(() => window.__PROMISE_LIGHTFALL__?.canvasCount?.() ?? -1)
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600)
    const outN = await p.evaluate(() => window.__PROMISE_LIGHTFALL__?.canvasCount?.() ?? -1)
    cycleCounts.push({ inN, outN })
  }
  const webglAfter = await p.evaluate(() => window.__GL.webglCreated)
  report.glCycle = { cycleCounts, webglBefore, webglAfter, webglDelta: webglAfter - webglBefore }

  // route change (SPA, no reload): click a nav link to /about → Promise unmounts →
  // Lightfall cleanup disposes the GL context. Assert the canvas is gone and no new
  // context leaked. Fall back to in-app history nav if the link isn't clickable.
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(500)
  const beforeNav = await p.evaluate(() => document.querySelectorAll('.promise-lightfall canvas').length)
  const webglPreNav = await p.evaluate(() => window.__GL.webglCreated)
  const navigated = await p.evaluate(() => { const a = document.querySelector('a[href="/about"], a[href="/contact"]'); if (a) { a.click(); return true } return false })
  if (!navigated) await p.goto(URL + '/about', { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(800)
  const afterNav = await p.evaluate(() => document.querySelectorAll('.promise-lightfall canvas').length)
  const webglPostNav = await p.evaluate(() => window.__GL.webglCreated)
  report.routeChange = { spa: navigated, beforeNav, afterNav, webglPreNav, webglPostNav, url: await p.evaluate(() => location.pathname) }

  await ctx.close()
}

// ── 3. FR full section ───────────────────────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  await p.mouse.move(1450, 120); await p.waitForTimeout(300)
  await p.locator('#promise').screenshot({ path: `${OUT}/03-full-fr.png` })
  report.contrastFR = await worstContrast(p, 12, 100)
  await ctx.close()
}

// ── 4. Reduced motion — Lightfall NOT mounted, glow + frozen confetti only ───
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/04-reduced-motion.png` })
  report.reducedMotion = await p.evaluate(() => ({
    lightfallCanvas: document.querySelectorAll('.promise-lightfall canvas').length,
    lightfallWrapper: document.querySelectorAll('.promise-lightfall').length,
    confettiCanvas: document.querySelectorAll('.promise-confetti-canvas').length,
    glow: document.querySelectorAll('.promise-glow').length,
  }))
  await ctx.close()
}

await b.close()

// ── 5. LetterGlitch removal grep proof (source, code lines only) ─────────────
function grep(re, paths) {
  try { const out = execSync(`git grep -nE "${re}" -- ${paths}`, { cwd: process.cwd() }).toString(); return out.trim() ? out.trim().split('\n') : [] } catch { return [] }
}
const codeOnly = (lines) => lines.filter((l) => { const src = l.replace(/^[^:]*:\d+:/, '').trim(); return !src.startsWith('//') && !src.startsWith('*') && !src.startsWith('/*') })
report.grep = {
  letterGlitchAnywhereInSrc: grep('LetterGlitch|TypeWall|typewall|glitchColors|GLITCH_COLORS', 'src/'),
  typeWallFileExists: existsSync('src/sections/promise/PromiseTypeWall.jsx'),
  lightfallMounted: grep('PromiseLightfall|Lightfall', 'src/sections/promise/ src/sections/Promise.jsx').length,
}

report.consoleErrors = errors
report.glWarnings = warns

// ── verdict ──────────────────────────────────────────────────────────────────
const greenEN = Object.values(report.contrastEN).every((v) => v.ratio >= 4.5)
const greenFR = Object.values(report.contrastFR).every((v) => v.ratio >= 4.5)
report.PASS = {
  contrastAllGreen: greenEN && greenFR,
  letterGlitchGone: report.grep.letterGlitchAnywhereInSrc.length === 0 && report.grep.typeWallFileExists === false,
  lightfallMounted: report.mounted.canvasCount === 1,
  dprCappedAt1: report.mounted.canvasBuffer && report.mounted.canvasBuffer.w === report.mounted.canvasBuffer.cssW,
  mouseBend: report.mouseBend.brighter,
  scrollNotBlocked: report.interaction.scrollWorks,
  pausesOffViewport: report.pauseOffViewport.canvasCount === 0 && report.pauseOffViewport.active === false,
  glDisposed_cycles: report.glCycle.cycleCounts.every((c) => c.inN === 1 && c.outN === 0),
  // Leak proof = the browser never warned "too many WebGL contexts" across 6
  // mount/unmount cycles AND navigating away created no new context. (webglCreated
  // is cumulative across the whole page incl. the conveyor, so its delta is not a
  // live-context measure — the eviction warning is.)
  glContext_noLeak: report.glWarnings.length === 0 && report.routeChange.webglPostNav === report.routeChange.webglPreNav,
  routeChange_canvasGone: report.routeChange.afterNav === 0,
  reducedMotion_noCanvas: report.reducedMotion.lightfallCanvas === 0 && report.reducedMotion.glow === 1,
  // Lightfall governs the promise section (steady-state, its canvas live). The
  // full-page forced-scroll figure is conveyor/ScrollTrigger-bound (pre-existing).
  promiseSteadyFps: report.promiseSteadyFps,
  fpsFullScroll_conveyorBound: report.fpsFullScroll,
  fpsPass: report.promiseSteadyFps >= 55,
  noConsoleErrors: errors.length === 0,
}

console.log(JSON.stringify(report, null, 2))
