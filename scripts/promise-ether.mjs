import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const URL = 'http://localhost:5233'
const OUT = 'shots/promise-ether'
mkdirSync(OUT, { recursive: true })

// instrument WebGL context create/lose BEFORE any app code runs (leak proof)
const INIT = `
  window.__glCreated = 0; window.__glLost = 0;
  const _getCtx = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') window.__glCreated++;
    const ctx = _getCtx.call(this, type, ...rest);
    if (ctx && typeof ctx.getExtension === 'function' && !ctx.__wrapped) {
      ctx.__wrapped = true;
      const _getExt = ctx.getExtension.bind(ctx);
      ctx.getExtension = function (name) {
        const ext = _getExt(name);
        if (name === 'WEBGL_lose_context' && ext && !ext.__wrapped) {
          ext.__wrapped = true;
          const _lose = ext.loseContext.bind(ext);
          ext.loseContext = function () { window.__glLost++; return _lose(); };
        }
        return ext;
      };
    }
    return ctx;
  };
`

const errors = []
const b = await chromium.launch({ headless: false })
async function fresh({ reduced = false } = {}) {
  const ctx = await b.newContext({
    viewport: { width: 1536, height: 743 },
    deviceScaleFactor: 1.25,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  await ctx.addInitScript(INIT)
  const p = await ctx.newPage()
  p.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /webgl/i.test(m.text()))) errors.push(`${m.type()}: ${m.text()}`) })
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return { ctx, p }
}
async function gotoPromise(p, lang) {
  await p.goto(URL, { waitUntil: 'networkidle' })
  if (lang === 'fr') {
    await p.evaluate(() => window.localStorage.setItem('qfp.lang', 'fr'))
    await p.reload({ waitUntil: 'networkidle' })
  }
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(700)
}

// WCAG helpers
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
const contrast = (fg, bg) => (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05)
const over = (fg, a, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)))

// Sample the composited background under given section-relative points by hiding
// the text, screenshotting the section, and decoding the PNG inside the browser.
async function sampleBg(p, points) {
  await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = 'hidden' })
  const buf = await p.locator('#promise').screenshot()
  await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = '' })
  const url = 'data:image/png;base64,' + buf.toString('base64')
  return await p.evaluate(async ({ url, pts, dpr }) => {
    const img = new Image(); img.src = url; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    return pts.map((pt) => {
      const x = Math.min(c.width - 1, Math.max(0, Math.round(pt.x * dpr)))
      const y = Math.min(c.height - 1, Math.max(0, Math.round(pt.y * dpr)))
      const d = g.getImageData(x, y, 1, 1).data
      return [d[0], d[1], d[2]]
    })
  }, { url, pts: points, dpr: 1.25 })
}

// section-relative sample points (center + inner-edges) for each text element
async function textPoints(p) {
  return await p.evaluate(() => {
    const sec = document.getElementById('promise').getBoundingClientRect()
    const rowPts = (sel) => {
      const el = document.querySelector(sel)
      const r = el.getBoundingClientRect()
      const cy = r.top + r.height / 2 - sec.top
      return [0.3, 0.5, 0.7].map((fx) => ({ x: r.left + r.width * fx - sec.left, y: cy, sel }))
    }
    return {
      eyebrow: rowPts('.promise-eyebrow'),
      quote: rowPts('.promise-quote'),
      support: rowPts('.promise-support'),
      attr: rowPts('.promise-attr'),
    }
  })
}

const FG = {
  eyebrow: { color: [168, 128, 42], alpha: 1 }, // #a8802a
  quote: { color: [253, 250, 244], alpha: 1 },
  support: { color: [253, 250, 244], alpha: 0.66 },
  attr: { color: [168, 128, 42], alpha: 1 },
}
function worstContrast(bgByEl) {
  const out = {}
  for (const key of Object.keys(FG)) {
    let min = Infinity
    for (const bg of bgByEl[key]) {
      const fg = FG[key].alpha < 1 ? over(FG[key].color, FG[key].alpha, bg) : FG[key].color
      min = Math.min(min, contrast(fg, bg))
    }
    out[key] = +min.toFixed(2)
  }
  return out
}

// ── FPS FIRST (cold) — conveyor band scrolling WITH promise (ether) mounted ──
// Measured before any other work so the GPU is cold; the sim + conveyor + globe
// are all live. A contaminated/thermally-loaded machine reads artificially low.
let fps, fpsParked
{
  const b2 = await chromium.launch({ headless: false })
  const c2 = await b2.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await c2.newPage()
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.waitForTimeout(5000)
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(700)
  // warm-up: a throwaway scroll+idle burst so the GPU ramps to its working clocks
  // (a cold start measures mid-rampup and reads artificially low).
  await p.evaluate(async () => {
    const base = window.scrollY; const t0 = performance.now()
    await new Promise((res) => { const t = () => { const k = (performance.now() - t0) / 1500; window.scrollTo(0, base - 400 + 800 * Math.abs(Math.sin(k * Math.PI))); performance.now() - t0 < 1800 ? requestAnimationFrame(t) : res() }; requestAnimationFrame(t) })
    window.scrollTo(0, base)
  })
  await p.waitForTimeout(300)
  fpsParked = await p.evaluate(async () => {
    let n = 0; const t0 = performance.now()
    return await new Promise((res) => { const t = () => { n++; performance.now() - t0 < 1800 ? requestAnimationFrame(t) : res(Math.round(n / (performance.now() - t0) * 1000)) }; requestAnimationFrame(t) })
  })
  fps = await p.evaluate(async () => {
    const base = window.scrollY
    let n = 0; const t0 = performance.now()
    return await new Promise((res) => {
      const tick = () => {
        n++
        const k = (performance.now() - t0) / 2600
        window.scrollTo(0, base - 500 + 1000 * Math.abs(Math.sin(k * Math.PI))) // sweep conveyor↔promise
        if (performance.now() - t0 < 2600) requestAnimationFrame(tick)
        else res(Math.round((n / (performance.now() - t0)) * 1000))
      }
      requestAnimationFrame(tick)
    })
  })
  await b2.close()
}

// ── EN + FR section frames + 4 autoDemo drift frames ─────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/en-section.png` })
  for (let i = 0; i < 4; i++) { await p.locator('#promise').screenshot({ path: `${OUT}/en-drift-${i}.png` }); await p.waitForTimeout(900) }
  await ctx.close()
}
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  await p.locator('#promise').screenshot({ path: `${OUT}/fr-section.png` })
  await ctx.close()
}

// ── Cursor-agitation contrast: drag across the text zone, sample worst frame ──
let agitation
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  const pts = await textPoints(p)
  const allPts = [...pts.eyebrow, ...pts.quote, ...pts.support, ...pts.attr]
  const sec = await p.evaluate(() => { const r = document.getElementById('promise').getBoundingClientRect(); return { top: r.top, left: r.left, w: r.width, h: r.height } })
  let worst = null
  // agitate: sweep the cursor hard back and forth across the text band
  for (let pass = 0; pass < 5; pass++) {
    const y = sec.top + sec.h * (0.35 + 0.3 * (pass % 2))
    for (let s = 0; s <= 12; s++) {
      const x = sec.left + sec.w * (s / 12)
      await p.mouse.move(x, y, { steps: 2 })
    }
    const bg = await sampleBg(p, allPts)
    const byEl = {
      eyebrow: bg.slice(0, 3), quote: bg.slice(3, 6), support: bg.slice(6, 9), attr: bg.slice(9, 12),
    }
    const c = worstContrast(byEl)
    if (!worst) worst = c
    else for (const k of Object.keys(c)) worst[k] = Math.min(worst[k], c[k])
  }
  agitation = worst
  // overlay the numbers and capture the proof frame
  await p.evaluate(({ c }) => {
    const o = document.createElement('div')
    o.style.cssText = 'position:absolute;left:16px;top:16px;z-index:99;font:12px monospace;background:rgba(0,0,0,.72);padding:10px 12px;border:1px solid #2a3a2a;border-radius:6px;line-height:1.7'
    o.innerHTML = 'CONTRAST @ fluid agitation (AA≥4.5)<br>' + Object.entries(c).map(([k, v]) =>
      `<span style="color:${v >= 4.5 ? '#7CFC7C' : '#ff6b6b'}">${k.padEnd(8)} ${v.toFixed(2)}:1 ${v >= 4.5 ? 'PASS' : 'FAIL'}</span>`).join('<br>')
    document.getElementById('promise').appendChild(o)
  }, { c: agitation })
  await p.locator('#promise').screenshot({ path: `${OUT}/agitation-contrast.png` })
  await ctx.close()
}

// ── Palette audit — no violets in the fluid ──────────────────────────────────
let palette
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  const sec = await p.evaluate(() => { const r = document.getElementById('promise').getBoundingClientRect(); return { top: r.top, left: r.left, w: r.width, h: r.height } })
  // agitate to light up the fluid, then sample the peripheral band (outside the scrim)
  for (let s = 0; s <= 16; s++) await p.mouse.move(sec.left + sec.w * (s / 16), sec.top + sec.h * 0.2, { steps: 2 })
  const band = []
  for (let gx = 0; gx <= 20; gx++) for (const fy of [0.06, 0.12, 0.9, 0.95]) band.push({ x: sec.w * (gx / 20), y: sec.h * fy })
  for (const fx of [0.03, 0.06, 0.94, 0.97]) for (let gy = 0; gy <= 16; gy++) band.push({ x: sec.w * fx, y: sec.h * (gy / 16) })
  const px = await sampleBg(p, band)
  const colored = px.filter((c) => Math.max(...c) - Math.min(...c) > 8) // has hue (fluid present)
  const violets = colored.filter(([r, g, bl]) => g === Math.min(r, g, bl) && r > 55 && bl > 55 && r > g + 22 && bl > g + 22)
  palette = { sampled: px.length, colored: colored.length, violets: violets.length, sampleViolet: violets.slice(0, 3) }
  await ctx.close()
}

// ── Off-viewport + hidden-tab pause proof (RAF idles) ────────────────────────
let pauseProof
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  const ticks = () => p.evaluate(() => window.__PROMISE_ETHER_TICKS__ || 0)
  const t0 = await ticks(); await p.waitForTimeout(450); const t1 = await ticks()
  const onDelta = t1 - t0
  // scroll fully away → IO should pause
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600)
  const t2 = await ticks(); await p.waitForTimeout(450); const t3 = await ticks()
  const offDelta = t3 - t2
  // hidden tab → visibilitychange should pause (bring section back first)
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(500)
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  await p.waitForTimeout(300)
  const t4 = await ticks(); await p.waitForTimeout(450); const t5 = await ticks()
  const hiddenDelta = t5 - t4
  pauseProof = { onDelta, offDelta, hiddenDelta, pausesOffViewport: offDelta <= 2, pausesHiddenTab: hiddenDelta <= 2 }
  await ctx.close()
}

// ── WebGL context leak: mount → unmount (nav away) → remount ─────────────────
let leak
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  const created0 = await p.evaluate(() => window.__glCreated)
  const lost0 = await p.evaluate(() => window.__glLost)
  // navigate away in-SPA (leave home) then back
  let navigated = false
  try {
    const link = p.locator('header a, nav a').filter({ hasText: /contact/i }).first()
    if (await link.count()) { await link.click(); await p.waitForTimeout(1200); navigated = true }
  } catch { /* ignore */ }
  if (!navigated) { await p.goto(URL + '/contact', { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(1000) }
  const lostAfter = await p.evaluate(() => window.__glLost)
  // back home → ether should re-create and tick again
  await p.evaluate(() => window.__PROMISE_ETHER_TICKS__ = 0)
  await p.goBack({ waitUntil: 'networkidle' }).catch(() => p.goto(URL, { waitUntil: 'networkidle' }))
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(800)
  const createdAfter = await p.evaluate(() => window.__glCreated)
  const ticksAfter = await p.evaluate(() => window.__PROMISE_ETHER_TICKS__ || 0)
  leak = { created0, lost0, lostAfter, createdAfter, disposedOnUnmount: lostAfter - lost0 >= 1, aliveAfterRemount: ticksAfter > 2 }
  await ctx.close()
}

// ── Reduced motion — sim NOT mounted ─────────────────────────────────────────
let reduced
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/reduced.png` })
  reduced = await p.evaluate(() => ({
    etherMounted: !!document.querySelector('.promise-ether'),
    hasGlow: !!document.querySelector('.promise-glow'),
    hasScrim: !!document.querySelector('.promise-scrim'),
  }))
  await ctx.close()
}

await b.close()

const aa = agitation && Object.values(agitation).every((v) => v >= 4.5)
console.log(JSON.stringify({
  agitationContrast: agitation,
  aa_all_pass: aa,
  palette,
  pauseProof,
  fps,
  fpsParked,
  fps_ok: fps >= 55,
  leak,
  reduced,
  consoleErrors: errors,
}, null, 2))
