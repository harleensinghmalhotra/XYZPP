import { chromium } from 'playwright'
import { mkdirSync, existsSync, copyFileSync } from 'node:fs'
import sharp from 'sharp'

const URL = process.env.URL || 'http://localhost:5233'
const OUT = 'shots/promise-lightfall-colors'
mkdirSync(OUT, { recursive: true })

const errors = []
const b = await chromium.launch({ headless: false })
async function fresh({ reduced = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  p.on('console', (m) => { if (m.type() === 'error') errors.push('error: ' + m.text()) })
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return { ctx, p }
}
async function gotoPromise(p, lang) {
  await p.goto(URL, { waitUntil: 'networkidle' })
  if (lang === 'fr') { await p.evaluate(() => window.localStorage.setItem('qfp.lang', 'fr')); await p.reload({ waitUntil: 'networkidle' }) }
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(1100)
}

// ── WCAG contrast, ink-tight sampling (glyphs only) ──────────────────────────
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
const contrast = (fg, bg) => (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05)
const over = (fg, a, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)))
const FG = { eyebrow: { c: [168, 128, 42], a: 1 }, quote: { c: [253, 250, 244], a: 1 }, support: { c: [253, 250, 244], a: 0.66 }, attr: { c: [168, 128, 42], a: 1 } }
async function textPoints(p) {
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
    const rd = (a) => a.map((pt) => { const x = Math.min(c.width - 1, Math.max(0, Math.round(pt.x * dpr))); const y = Math.min(c.height - 1, Math.max(0, Math.round(pt.y * dpr))); const d = g.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]] })
    const o = {}; for (const k in pts) o[k] = rd(pts[k]); return o
  }, { url, pts, dpr: 1.25 })
}
async function worstContrast(p, frames = 16, gap = 95) {
  const pts = await textPoints(p); const worst = {}
  for (let f = 0; f < frames; f++) { await p.mouse.move(240 + (f * 130) % 1060, 150 + (f * 61) % 440); const bg = await sampleBgOnce(p, pts); for (const k in bg) for (const c of bg[k]) if (!worst[k] || lum(c) > lum(worst[k])) worst[k] = c; await p.waitForTimeout(gap) }
  const out = {}; for (const k in FG) { const bg = worst[k]; const fg = FG[k].a < 1 ? over(FG[k].c, FG[k].a, bg) : FG[k].c; out[k] = { ratio: +contrast(fg, bg).toFixed(2), bg } }
  return out
}

// ── hue histogram of the VISIBLE rain (scrim on, text+glow off) ──────────────
async function hueProof(p) {
  await p.evaluate(() => { for (const s of ['.promise-glow', '.promise-inner']) { const e = document.querySelector(s); if (e) e.style.visibility = 'hidden' } })
  await p.mouse.move(1500, 730); await p.waitForTimeout(300)
  await p.locator('#promise').screenshot({ path: `${OUT}/hue-rain-sample.png` })
  const buf = await p.locator('#promise').screenshot()
  await p.evaluate(() => { for (const s of ['.promise-glow', '.promise-inner']) { const e = document.querySelector(s); if (e) e.style.visibility = '' } })
  const url = 'data:image/png;base64,' + buf.toString('base64')
  return await p.evaluate(async ({ url }) => {
    const img = new Image(); img.src = url; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data
    const bins = new Array(12).fill(0); let colored = 0, red = 0, navy = 0, gold = 0, total = 0
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, gg = d[i + 1] / 255, bl = d[i + 2] / 255
      const mx = Math.max(r, gg, bl), mn = Math.min(r, gg, bl), df = mx - mn, V = mx, S = mx === 0 ? 0 : df / mx
      total++; if (V < 0.20 || S < 0.22) continue; colored++
      let h = 0; if (df > 0) { if (mx === r) h = ((gg - bl) / df) % 6; else if (mx === gg) h = (bl - r) / df + 2; else h = (r - gg) / df + 4; h *= 60; if (h < 0) h += 360 }
      bins[Math.floor(h / 30) % 12]++
      if (h >= 330 || h < 25) red++        // red / crimson / pink band
      if (h >= 200 && h <= 260) navy++      // our blue
      if (h >= 30 && h <= 60) gold++        // our gold
    }
    return { total, colored, redFrac: +(red / colored).toFixed(4), navyFrac: +(navy / colored).toFixed(4), goldFrac: +(gold / colored).toFixed(4), redPctOfAllPixels: +(red / total * 100).toFixed(3), hueBins30: bins.map((x) => +(x / colored).toFixed(3)) }
  }, { url })
}

const report = {}

// ── EN: full section + hue proof + contrast ──────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  await p.mouse.move(1460, 120); await p.waitForTimeout(400)
  await p.locator('#promise').screenshot({ path: `${OUT}/01-full-en.png` })
  report.hue = await hueProof(p)
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  report.contrastEN = await worstContrast(p)
  await ctx.close()
}
// ── FR ───────────────────────────────────────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  await p.mouse.move(1460, 120); await p.waitForTimeout(400)
  await p.locator('#promise').screenshot({ path: `${OUT}/02-full-fr.png` })
  report.contrastFR = await worstContrast(p, 14)
  await ctx.close()
}
await b.close()

// ── before/after pair (Harry's marked red version → new navy) ────────────────
const beforeSrc = 'shots/promise-lightfall-full/01-full-en.png' // the committed amber/red full-power face
if (existsSync(beforeSrc)) {
  copyFileSync(beforeSrc, `${OUT}/00-before-red.png`)
  const W = 760
  const L = await sharp(beforeSrc).resize(W).png().toBuffer()
  const R = await sharp(`${OUT}/01-full-en.png`).resize(W).png().toBuffer()
  const lh = (await sharp(L).metadata()).height
  const label = Buffer.from(`<svg width="${W * 2 + 20}" height="26" xmlns="http://www.w3.org/2000/svg"><text x="10" y="19" font-size="16" font-family="sans-serif" font-weight="bold" fill="black">BEFORE — warm/amber (red wash Harry marked)</text><text x="${W + 30}" y="19" font-size="16" font-family="sans-serif" font-weight="bold" fill="black">AFTER — navy-dominant + gold accents</text></svg>`)
  await sharp({ create: { width: W * 2 + 20, height: lh + 30, channels: 4, background: '#ffffff' } })
    .composite([{ input: L, left: 0, top: 30 }, { input: R, left: W + 20, top: 30 }, { input: label, left: 0, top: 0 }])
    .png().toFile(`${OUT}/03-before-after.png`)
}

report.consoleErrors = errors
const greenEN = Object.values(report.contrastEN).every((v) => v.ratio >= 4.5)
const greenFR = Object.values(report.contrastFR).every((v) => v.ratio >= 4.5)
report.PASS = {
  redBand_pctOfAllPixels: report.hue.redPctOfAllPixels,     // ~0.2% (was ~52%)
  redBand_essentiallyZero: report.hue.redPctOfAllPixels < 0.5,
  navyDominant: report.hue.navyFrac > report.hue.goldFrac && report.hue.navyFrac > 0.4,
  goldVisible: report.hue.goldFrac > 0.02,
  contrastAllGreen: greenEN && greenFR,
  noConsoleErrors: errors.length === 0,
}
console.log(JSON.stringify(report, null, 2))
