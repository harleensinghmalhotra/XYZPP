import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

function saveDataUrl(path, dataUrl) {
  const b64 = dataUrl.split(',')[1]
  writeFileSync(path, Buffer.from(b64, 'base64'))
}

const URL = process.env.URL || 'http://localhost:5233'
const OUT = 'shots/promise-typewall'
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
  await p.waitForTimeout(900)
}

// ── contrast helpers (WCAG) ──────────────────────────────────────────────────
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
const contrast = (fg, bg) => (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05)
const over = (fg, a, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)))
const FG = {
  eyebrow: { color: [168, 128, 42], alpha: 1 },   // #a8802a
  quote:   { color: [253, 250, 244], alpha: 1 },  // cream
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
// Sample the real rendered background behind each text point (type wall + confetti
// + glow, text hidden), one screenshot per frame.
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
// Worst-case (brightest background → lowest contrast) across N glitch frames.
async function worstContrast(p, frames = 10, gap = 130) {
  const pts = await textPoints(p)
  const worstBg = {} // per element, the max-luminance bg seen
  for (let f = 0; f < frames; f++) {
    const bg = await sampleBgOnce(p, pts)
    for (const k of Object.keys(bg)) {
      for (const c of bg[k]) {
        if (!worstBg[k] || lum(c) > lum(worstBg[k])) worstBg[k] = c
      }
    }
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

// ── typewall canvas pixel scan — prove DM Mono ink + a hot-gold letter ───────
async function scanWall(p) {
  return await p.evaluate(() => {
    const cv = document.querySelector('.promise-typewall-canvas')
    if (!cv) return null
    const g = cv.getContext('2d')
    const d = g.getImageData(0, 0, cv.width, cv.height).data
    let ink = 0, hot = 0, hotPt = null, hotBest = 1e9
    const cx = cv.width / 2, cy = cv.height / 2
    // hot gold ≈ (155,116,32); count strongly-gold, bright pixels. Prefer a hot
    // pixel a comfortable distance INSIDE the frame (not clipped at an edge) but
    // still out in the wall's living ring, away from the dead centre.
    for (let y = 0; y < cv.height; y += 2) {
      for (let x = 0; x < cv.width; x += 2) {
        const i = (y * cv.width + x) * 4
        const r = d[i], gg = d[i + 1], bl = d[i + 2], a = d[i + 3]
        if (a > 20 && (r + gg + bl) > 60) ink++
        if (r > 120 && gg > 85 && gg < 150 && bl < 80 && r > gg && gg > bl) {
          hot++
          const edge = Math.min(x, y, cv.width - x, cv.height - y)
          const fromCentre = Math.hypot(x - cx, y - cy)
          // want edge>=70 (room to crop) and far from centre; score picks the best
          if (edge >= 70) { const score = -fromCentre; if (score < hotBest) { hotBest = score; hotPt = { x, y } } }
        }
      }
    }
    return { w: cv.width, h: cv.height, ink, hot, hotPt }
  })
}
// Magnified raw-canvas crop (full opacity, no vignette) — the clearest proof the
// glyphs are DM Mono and the ink is in-family. Returns a PNG data URL.
async function cropCanvasMag(p, x, y, w, h, scale) {
  return await p.evaluate(({ x, y, w, h, scale }) => {
    const cv = document.querySelector('.promise-typewall-canvas')
    if (!cv) return null
    x = Math.max(0, Math.min(cv.width - w, x)); y = Math.max(0, Math.min(cv.height - h, y))
    const out = document.createElement('canvas'); out.width = w * scale; out.height = h * scale
    const g = out.getContext('2d'); g.imageSmoothingEnabled = false
    g.fillStyle = '#0a0e14'; g.fillRect(0, 0, out.width, out.height)
    g.drawImage(cv, x, y, w, h, 0, 0, out.width, out.height)
    return out.toDataURL('image/png')
  }, { x, y, w, h, scale })
}

const report = {}

// ── 1. FPS (full page, warmed — wall + confetti + everything live) ───────────
{
  const { ctx, p } = await fresh()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(4000)
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(800)
  const fps = await p.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now()
    const tick = () => { n++; if (performance.now() - t0 >= 1500) res(Math.round(n / ((performance.now() - t0) / 1000))); else requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }))
  report.fps = fps
  await ctx.close()
}

// ── 2. EN full section + close-ups + hot gold + 3-frame pace ─────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/01-full-en.png` })

  // 3 frames across ~1s — slow pace. Canvas-only magnified crops (NO element
  // screenshot between them: that fires a viewport resize → debounced re-seed,
  // which would falsely re-randomise the whole wall). Same region each frame, so
  // the eye can track individual letters swapping. Also quantify the pace: the
  // share of the grid whose glyph changes between two ~330ms samples.
  const paceChars = []
  for (let i = 0; i < 3; i++) {
    const crop = await cropCanvasMag(p, 8, 8, 240, 150, 3)
    if (crop) saveDataUrl(`${OUT}/pace-${i}-wall.png`, crop)
    paceChars.push(await p.evaluate(() => window.__PROMISE_TYPEWALL__ && window.__PROMISE_TYPEWALL__.chars()))
    await p.waitForTimeout(330)
  }
  const changedRatio = (a, b) => { if (!a || !b || a.length !== b.length) return null; let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return +(d / a.length).toFixed(3) }
  report.paceChangePerFrame = [changedRatio(paceChars[0], paceChars[1]), changedRatio(paceChars[1], paceChars[2])]
  // one full-section shot for the record (taken last, resize is now harmless)
  await p.locator('#promise').screenshot({ path: `${OUT}/pace-full.png` })

  // in-situ edge close-up (bottom-left viewport corner where the wall lives)
  await p.screenshot({ path: `${OUT}/02-edge-closeup.png`, clip: { x: 0, y: 470, width: 380, height: 260 } })
  // magnified raw-canvas edge crop — DM Mono glyphs mid-glitch, unmistakable
  const edgeMag = await cropCanvasMag(p, 8, 8, 260, 160, 3)
  if (edgeMag) saveDataUrl(`${OUT}/02b-edge-mag.png`, edgeMag)

  // hunt a hot-gold letter across frames, magnified crop around it when caught
  let wall = null
  for (let i = 0; i < 30; i++) { wall = await scanWall(p); if (wall && wall.hotPt) break; await p.waitForTimeout(110) }
  report.wallScan = wall && { ink: wall.ink, hot: wall.hot, hotPt: wall.hotPt }
  if (wall && wall.hotPt) {
    const hg = await cropCanvasMag(p, wall.hotPt.x - 55, wall.hotPt.y - 35, 120, 80, 4)
    if (hg) saveDataUrl(`${OUT}/03-hot-gold.png`, hg)
  }

  // contrast at brightest random state, confetti live
  report.contrastEN = await worstContrast(p, 12, 120)

  // ticks are advancing (wall is animating in view)
  const t1 = await p.evaluate(() => window.__PROMISE_TYPEWALL_TICKS__ || 0)
  await p.waitForTimeout(500)
  const t2 = await p.evaluate(() => window.__PROMISE_TYPEWALL_TICKS__ || 0)
  report.animatingInView = t2 > t1

  // off-viewport pause proof: scroll to top, wait, ticks must freeze + running false
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(700)
  const pa = await p.evaluate(() => window.__PROMISE_TYPEWALL_TICKS__ || 0)
  await p.waitForTimeout(700)
  const pb = await p.evaluate(() => window.__PROMISE_TYPEWALL_TICKS__ || 0)
  const runningOff = await p.evaluate(() => window.__PROMISE_TYPEWALL__ && window.__PROMISE_TYPEWALL__.running())
  report.pauseOffViewport = { before: pa, after: pb, frozen: pb === pa, running: runningOff }

  await ctx.close()
}

// ── 3. FR full section ───────────────────────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  await p.locator('#promise').screenshot({ path: `${OUT}/04-full-fr.png` })
  report.contrastFR = await worstContrast(p, 10, 120)
  await ctx.close()
}

// ── 4. Reduced motion — static frame, no rAF ─────────────────────────────────
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/05-reduced-motion.png` })
  const ticks = await p.evaluate(() => window.__PROMISE_TYPEWALL_TICKS__)
  const running = await p.evaluate(() => window.__PROMISE_TYPEWALL__ && window.__PROMISE_TYPEWALL__.running && window.__PROMISE_TYPEWALL__.running())
  const wall = await scanWall(p) // still drew a static frame of ink
  report.reducedMotion = { ticks: ticks ?? 'undefined(no rAF)', running, ink: wall && wall.ink }
  await ctx.close()
}

await b.close()

// ── 5. ether-removal grep proof (source only) ────────────────────────────────
function grepCount(re) {
  try {
    const out = execSync(`git grep -nE "${re}" -- src/sections/Promise.jsx src/sections/promise/ src/index.css`, { cwd: process.cwd() }).toString()
    return out.trim() ? out.trim().split('\n') : []
  } catch { return [] }
}
// Real ether CODE = import statements, JSX mounts, or the .promise-ether class —
// NOT prose in a comment describing what was replaced. Filter comment-only lines.
const codeOnly = (lines) => lines.filter((l) => {
  const src = l.replace(/^[^:]*:\d+:/, '').trim()
  return !src.startsWith('//') && !src.startsWith('*') && !src.startsWith('/*')
})
report.grep = {
  etherCodeInPromise: codeOnly(grepCount('LiquidEther|promise-ether')),
  etherCommentMentions: grepCount('LiquidEther|promise-ether').length,
  promiseLiquidEtherFileExists: existsSync('src/sections/promise/PromiseLiquidEther.jsx'),
  typewallMounted: grepCount('PromiseTypeWall').length,
}

report.consoleErrors = errors

// ── verdict ──────────────────────────────────────────────────────────────────
const cAll = { ...report.contrastEN, ...report.contrastFR }
const green = Object.entries({ ...report.contrastEN }).every(([, v]) => v.ratio >= 4.5)
  && Object.entries({ ...report.contrastFR }).every(([, v]) => v.ratio >= 4.5)
report.PASS = {
  contrastAllGreen: green,
  etherGone: report.grep.etherCodeInPromise.length === 0 && report.grep.promiseLiquidEtherFileExists === false,
  typewallMounted: report.grep.typewallMounted > 0,
  hotGoldCaught: !!(report.wallScan && report.wallScan.hot > 0),
  pausesOffViewport: report.pauseOffViewport.frozen && report.pauseOffViewport.running === false,
  reducedStatic: report.reducedMotion.running !== true && report.reducedMotion.ink > 0,
  noConsoleErrors: errors.length === 0,
  fps: report.fps,
}

console.log(JSON.stringify(report, null, 2))
