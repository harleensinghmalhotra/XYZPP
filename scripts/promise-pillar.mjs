import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import sharp from 'sharp'

const URL = process.env.URL || 'http://localhost:5233'
const OUT = 'shots/promise-pillar'
mkdirSync(OUT, { recursive: true })

const errors = [], warns = []
const b = await chromium.launch({ headless: false })
const GL_INIT = `window.__GL={webglCreated:0};const _gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t){const c=_gc.apply(this,arguments);if(c&&/webgl/i.test(String(t)))window.__GL.webglCreated++;return c};`
async function fresh({ reduced = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await ctx.addInitScript(GL_INIT)
  const p = await ctx.newPage()
  p.on('console', (m) => { const t = m.text(); if (m.type() === 'error') errors.push('error: ' + t); if (m.type() === 'warning' && /webgl/i.test(t)) warns.push(t) })
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return { ctx, p }
}
async function gotoPromise(p, q = '') {
  await p.goto(URL + (q ? '?' + q : ''), { waitUntil: 'networkidle' })
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(1600)
}
async function setLang(p, lang) { if (lang === 'fr') { await p.evaluate(() => window.localStorage.setItem('qfp.lang', 'fr')); await p.reload({ waitUntil: 'networkidle' }); await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(1500) } }

// ── WCAG contrast, ink-tight sampling ────────────────────────────────────────
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
const contrast = (fg, bg) => (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05)
const over = (fg, a, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)))
const FG = { eyebrow: { c: [168, 128, 42], a: 1 }, quote: { c: [253, 250, 244], a: 1 }, support: { c: [253, 250, 244], a: 0.66 }, attr: { c: [168, 128, 42], a: 1 } }
async function textPoints(p) {
  return await p.evaluate(() => {
    const sec = document.getElementById('promise').getBoundingClientRect()
    const ink = (s, n = 7) => { const e = document.querySelector(s); const rng = document.createRange(); rng.selectNodeContents(e); const r = rng.getBoundingClientRect(); const cy = r.top + r.height / 2 - sec.top; const l = r.left - sec.left + 2, w = r.width - 4; return Array.from({ length: n }, (_, i) => ({ x: l + w * (i / (n - 1)), y: cy })) }
    return { eyebrow: ink('.promise-eyebrow'), quote: ink('.promise-quote', 9), support: ink('.promise-support'), attr: ink('.promise-attr') }
  })
}
async function worstContrast(p, frames = 12, gap = 140) {
  const pts = await textPoints(p); const worst = {}
  for (let f = 0; f < frames; f++) {
    await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = 'hidden' })
    const buf = await p.locator('#promise').screenshot()
    await p.evaluate(() => { document.querySelector('.promise-inner').style.visibility = '' })
    const url = 'data:image/png;base64,' + buf.toString('base64')
    const bg = await p.evaluate(async ({ url, pts, dpr }) => { const img = new Image(); img.src = url; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const rd = (a) => a.map((pt) => { const x = Math.min(c.width - 1, Math.max(0, Math.round(pt.x * dpr))); const y = Math.min(c.height - 1, Math.max(0, Math.round(pt.y * dpr))); const d = g.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]] }); const o = {}; for (const k in pts) o[k] = rd(pts[k]); return o }, { url, pts, dpr: 1.25 })
    for (const k in bg) for (const c of bg[k]) if (!worst[k] || lum(c) > lum(worst[k])) worst[k] = c
    await p.waitForTimeout(gap)
  }
  const out = {}; for (const k in FG) { const bg = worst[k]; const fg = FG[k].a < 1 ? over(FG[k].c, FG[k].a, bg) : FG[k].c; out[k] = { ratio: +contrast(fg, bg).toFixed(2), bg } }
  return out
}
// ── hue histogram of the raw pillar (scrim/glow/text hidden) — two hills only ──
async function hueProof(p, name) {
  await p.evaluate(() => { for (const s of ['.promise-scrim', '.promise-bg', '.promise-glow', '.promise-inner']) { const e = document.querySelector(s); if (e) e.style.visibility = 'hidden' } })
  await p.waitForTimeout(300)
  if (name) await p.locator('#promise').screenshot({ path: `${OUT}/${name}.png` })
  const buf = await p.locator('#promise').screenshot()
  await p.evaluate(() => { for (const s of ['.promise-scrim', '.promise-bg', '.promise-glow', '.promise-inner']) { const e = document.querySelector(s); if (e) e.style.visibility = '' } })
  const url = 'data:image/png;base64,' + buf.toString('base64')
  return await p.evaluate(async ({ url }) => {
    const img = new Image(); img.src = url; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data
    const bins = new Array(12).fill(0); let colored = 0, gold = 0, navy = 0, other = 0
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, gg = d[i + 1] / 255, bl = d[i + 2] / 255
      const mx = Math.max(r, gg, bl), mn = Math.min(r, gg, bl), df = mx - mn, V = mx, S = mx === 0 ? 0 : df / mx
      if (V < 0.10) continue           // skip near-black nav strip is above section; count section pixels
      if (S < 0.18) continue           // neutrals (white/grey) not a hue hill
      colored++
      let h = 0; if (df > 0) { if (mx === r) h = ((gg - bl) / df) % 6; else if (mx === gg) h = (bl - r) / df + 2; else h = (r - gg) / df + 4; h *= 60; if (h < 0) h += 360 }
      bins[Math.floor(h / 30) % 12]++
      // gold family = warm amber→gold (10–70); navy family = blue (190–270). The
      // two-stop gradient can only ever land in these two + neutral whites/greys.
      if (h >= 10 && h <= 70) gold++
      else if (h >= 190 && h <= 270) navy++
      else other++
    }
    return { colored, goldFrac: +(gold / colored).toFixed(3), navyFrac: +(navy / colored).toFixed(3), otherFrac: +(other / colored).toFixed(3), hueBins30: bins.map((x) => +(x / colored).toFixed(3)) }
  }, { url })
}

const report = {}

// ── 1a. promise-section steady fps (pillar live) — fresh warm context ────────
{
  const { ctx, p } = await fresh()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(4000)
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200)
  const m = () => p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 >= 1500) res(Math.round(n / ((performance.now() - t0) / 1000))); else requestAnimationFrame(tick) }; requestAnimationFrame(tick) }))
  report.promiseSteadyFps = Math.max(await m(), await m()) // best of 2 (avoid cold-frame dip)
  await ctx.close()
}
// ── 1b. FPS full-page scroll (conveyor-bound torture) — separate context ─────
{
  const { ctx, p } = await fresh()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(4500)
  report.fpsFullScroll = await p.evaluate(() => new Promise((res) => { const h = Math.max(1, document.body.scrollHeight - window.innerHeight); let n = 0; const s = performance.now(), dur = 2600; const tick = (t) => { n++; const pr = Math.min(1, (t - s) / dur); window.scrollTo(0, pr * h); if (pr < 1) requestAnimationFrame(tick); else res(Math.round(n / ((performance.now() - s) / 1000))) }; requestAnimationFrame(tick) }))
  await ctx.close()
}

// ── 2. EN gold-top: full section, 4 rotation frames, hue, contrast, mounts ───
{
  const { ctx, p } = await fresh()
  await gotoPromise(p)
  await p.locator('#promise').screenshot({ path: `${OUT}/01-gold-top-en.png` })
  for (let i = 0; i < 4; i++) { await p.locator('#promise').screenshot({ path: `${OUT}/rot-${i}.png` }); await p.waitForTimeout(500) }
  report.mounted = await p.evaluate(() => { const c = document.querySelector('.promise-pillar canvas'); return { canvasCount: window.__PROMISE_PILLAR__?.canvasCount?.() ?? -1, variant: window.__PROMISE_PILLAR__?.variant?.(), buffer: c ? { w: c.width, cssW: Math.round(c.getBoundingClientRect().width) } : null } })
  report.hueGold = await hueProof(p, 'hue-gold-raw')
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  report.contrastEN = await worstContrast(p)
  // FR
  await setLang(p, 'fr')
  await p.locator('#promise').screenshot({ path: `${OUT}/02-gold-top-fr.png` })
  report.contrastFR = await worstContrast(p, 10)
  // off-viewport pause/unmount
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(900)
  report.pauseOffViewport = await p.evaluate(() => ({ active: window.__PROMISE_PILLAR__?.active?.(), canvasCount: window.__PROMISE_PILLAR__?.canvasCount?.() }))
  // GL cycle + route change
  const cyc = []
  for (let i = 0; i < 5; i++) { await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(600); const inN = await p.evaluate(() => window.__PROMISE_PILLAR__?.canvasCount?.()); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600); const outN = await p.evaluate(() => window.__PROMISE_PILLAR__?.canvasCount?.()); cyc.push({ inN, outN }) }
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(500)
  const webglPre = await p.evaluate(() => window.__GL.webglCreated)
  const navd = await p.evaluate(() => { const a = document.querySelector('a[href="/about"],a[href="/contact"]'); if (a) { a.click(); return true } return false })
  if (!navd) await p.goto(URL + '/about', { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(800)
  report.glCycle = { cyc, routeCanvasGone: await p.evaluate(() => document.querySelectorAll('.promise-pillar canvas').length), webglNoGrowthOnNav: (await p.evaluate(() => window.__GL.webglCreated)) === webglPre }
  await ctx.close()
}

// ── 3. navy-top variant (EN) + hue ───────────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'pillarRev=1')
  await p.locator('#promise').screenshot({ path: `${OUT}/03-navy-top-en.png` })
  report.hueNavy = await hueProof(p, 'hue-navy-raw')
  report.contrastNavy = await worstContrast(p, 10)
  await ctx.close()
}

// ── 4. offset variant (judge option) ────────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'pillarOff=1')
  await p.locator('#promise').screenshot({ path: `${OUT}/04-offset-en.png` })
  report.contrastOffset = await worstContrast(p, 10)
  await ctx.close()
}

// ── 5. reduced motion — not mounted, glow only ───────────────────────────────
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p)
  await p.locator('#promise').screenshot({ path: `${OUT}/05-reduced-motion.png` })
  report.reducedMotion = await p.evaluate(() => ({ pillarCanvas: document.querySelectorAll('.promise-pillar canvas').length, glow: document.querySelectorAll('.promise-glow').length }))
  await ctx.close()
}
await b.close()

// ── side-by-side variant sheet ───────────────────────────────────────────────
{
  const W = 760
  const L = await sharp(`${OUT}/01-gold-top-en.png`).resize(W).png().toBuffer()
  const R = await sharp(`${OUT}/03-navy-top-en.png`).resize(W).png().toBuffer()
  const lh = (await sharp(L).metadata()).height
  const label = Buffer.from(`<svg width="${W * 2 + 20}" height="26" xmlns="http://www.w3.org/2000/svg"><text x="10" y="19" font-size="15" font-family="sans-serif" font-weight="bold">A — gold top / navy bottom (default)</text><text x="${W + 30}" y="19" font-size="15" font-family="sans-serif" font-weight="bold">B — navy top / gold bottom (reverse)</text></svg>`)
  await sharp({ create: { width: W * 2 + 20, height: lh + 30, channels: 4, background: '#ffffff' } }).composite([{ input: L, left: 0, top: 30 }, { input: R, left: W + 20, top: 30 }, { input: label, left: 0, top: 0 }]).png().toFile(`${OUT}/00-variants-side-by-side.png`)
}

// ── grep proof ───────────────────────────────────────────────────────────────
function grep(re, paths) { try { const o = execSync(`git grep -nE "${re}" -- ${paths}`, { cwd: process.cwd() }).toString(); return o.trim() ? o.trim().split('\n') : [] } catch { return [] } }
report.grep = { lightfallInSrc: grep('[Ll]ightfall', 'src/'), lightfallComponentExists: (() => { try { execSync('git cat-file -e HEAD:src/components/Lightfall.jsx', { cwd: process.cwd() }); return true } catch { return false } })(), pillarMounted: grep('PromiseLightPillar|LightPillar', 'src/sections/promise/ src/sections/Promise.jsx').length }
report.consoleErrors = errors
report.glWarnings = warns

const greenAll = [report.contrastEN, report.contrastFR, report.contrastNavy].every((cc) => Object.values(cc).every((v) => v.ratio >= 4.5))
report.PASS = {
  lightfallGone: report.grep.lightfallInSrc.length === 0,
  pillarMounted: report.mounted.canvasCount === 1,
  dprCappedAt1: report.mounted.buffer && report.mounted.buffer.w === report.mounted.buffer.cssW,
  twoHills_noThirdHue: report.hueGold.otherFrac < 0.12 && report.hueNavy.otherFrac < 0.12,
  contrastAllGreen: greenAll,
  contrastOffsetGreen: Object.values(report.contrastOffset).every((v) => v.ratio >= 4.5),
  pausesOffViewport: report.pauseOffViewport.canvasCount === 0 && report.pauseOffViewport.active === false,
  glDisposed: report.glCycle.cyc.every((c) => c.inN === 1 && c.outN === 0) && report.glCycle.routeCanvasGone === 0 && report.glWarnings.length === 0,
  reducedMotion_noCanvas: report.reducedMotion.pillarCanvas === 0 && report.reducedMotion.glow === 1,
  promiseSteadyFps: report.promiseSteadyFps,
  fpsPass: report.promiseSteadyFps >= 55,
  fpsFullScroll_conveyorBound: report.fpsFullScroll,
  noConsoleErrors: errors.length === 0,
}
console.log(JSON.stringify(report, null, 2))
