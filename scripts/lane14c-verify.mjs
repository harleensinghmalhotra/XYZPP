import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import fs from 'node:fs'

const PORT = process.argv[2] || '5231'
const OUT = 'shots/lane14c'
fs.mkdirSync(OUT, { recursive: true })
const DSF = 1.25
const STAGES = ['print', 'quality', 'fulfillment', 'warehouse', 'shipping', 'covered']
const pForStation = (i) => Math.min((i * 0.77) / 5, 0.75)

async function scrubTo(page, p) {
  await page.evaluate((prog) => {
    const el = document.querySelector('.conv-scroll')
    const y = el.getBoundingClientRect().top + window.scrollY + prog * (el.offsetHeight - window.innerHeight)
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  }, p)
  await page.waitForTimeout(1300)
}

// Detect the plaque nearest a target screen-x: find the cream plate (bright, warm)
// cluster, return its bbox {left,top,right,bottom,cx} in RAW pixels.
async function findPlaque(file, targetFracX) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  const isCream = (r, g, b) => r > 232 && g > 220 && b > 195 && r >= g && g >= b && (r - b) > 14 && (r - b) < 90
  // column histogram of cream pixels in the sky/horizon band (top 60% of frame)
  const colCount = new Array(W).fill(0)
  const H60 = Math.floor(H * 0.62)
  for (let y = 0; y < H60; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C
    if (isCream(data[i], data[i + 1], data[i + 2])) colCount[x]++
  }
  // group contiguous cream columns into runs
  const runs = []
  let s = -1
  for (let x = 0; x < W; x++) {
    if (colCount[x] > 8) { if (s < 0) s = x } else { if (s >= 0) { runs.push([s, x - 1]); s = -1 } }
  }
  if (s >= 0) runs.push([s, W - 1])
  if (!runs.length) return null
  const target = targetFracX * W
  // pick run whose center is nearest target and width plausible for a plaque
  let best = null, bestD = Infinity
  for (const [a, b] of runs) {
    const w = b - a; if (w < 30) continue
    const cx = (a + b) / 2; const d = Math.abs(cx - target)
    if (d < bestD) { bestD = d; best = [a, b] }
  }
  if (!best) return null
  const [left, right] = best
  // find top: first row (from top) within [left,right] with >=6 cream px
  let top = H60
  for (let y = 0; y < H60; y++) {
    let c = 0; for (let x = left; x <= right; x++) { const i = (y * W + x) * C; if (isCream(data[i], data[i + 1], data[i + 2])) c++ }
    if (c >= 6) { top = y; break }
  }
  return { left, right, top, cx: Math.round((left + right) / 2), W, H, C, data }
}

// Is the sky directly above the plaque as bright as clean sky at the SAME height?
// A baked drop-shadow makes the plaque-centre column darker than the surrounding sky.
// Two traps a naive band-average falls into (both bit Lane 14b/14c-interim):
//   • the gold frame's own top border is darker than sky — never sample rows that
//     include it; measure a horizontal SLICE at a fixed height ABOVE the frame.
//   • the *neighbouring* plaque's bright gold edge contaminates a side-sky sample —
//     so we hunt for a genuinely clean sky window (no cream/gold, near-neutral) at the
//     same y, scanning left then right, instead of blindly sampling beside the frame.
async function profileAbove(p) {
  const { data, W, H, C, cx, top } = p
  const lum = (x, y, w, h) => {
    let s = 0, n = 0
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const i = (yy * W + xx) * C; s += (data[i] + data[i + 1] + data[i + 2]) / 3; n++ }
    return n ? s / n : NaN
  }
  const y = Math.max(0, top - 24) // 24px above the cream top → clear of the gold frame
  const isSky = (x0, w) => { for (let xx = x0; xx < x0 + w; xx++) { const i = (y * W + xx) * C; if (data[i] < 205 || Math.abs(data[i] - data[i + 2]) > 18) return false } return true }
  let sky = null
  for (let x = p.left - 40; x >= 40; x -= 10) { if (isSky(x - 40, 40)) { sky = lum(x - 40, y, 40, 10); break } }
  if (sky == null) for (let x = p.right + 20; x < W - 40; x += 10) { if (isSky(x, 40)) { sky = lum(x, y, 40, 10); break } }
  const center = lum(cx - 20, y, 40, 10)
  const dLum = sky == null ? NaN : Math.round((center - sky) * 10) / 10 // + = centre darker than clean sky
  return { center: Math.round(center), sky: sky == null ? null : Math.round(sky), dLum }
}

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: DSF })
const page = await ctx.newPage()
const errs = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1200)
await page.waitForSelector('.conv-scroll'); await page.waitForSelector('canvas')
ok('EN home + conveyor canvas loaded')

console.log('\n=== Lane 14c — plaque-top smudge audit (all six) ===')
console.log('STATION        centerLum  cleanSky  Δ(+=centre darker)')
const THRESH = 2.5 // luminance levels; the baked smudge was ~13 → this catches any regression
for (let i = 0; i < 6; i++) {
  await scrubTo(page, pForStation(i))
  const full = `${OUT}/_full-${STAGES[i]}.png`
  await page.screenshot({ path: full })
  // the active/focused plaque sits near center; earlier stations show it left-of-center
  const p = await findPlaque(full, 0.5) || await findPlaque(full, 0.42)
  if (!p) { fail(`${STAGES[i]}: could not locate plaque`); continue }
  const prof = await profileAbove(p)
  // crop 2x region around plaque top
  const cropW = Math.round((p.right - p.left) * 1.5), cropH = 150
  const cl = Math.max(0, p.cx - cropW / 2), ct = Math.max(0, p.top - 90)
  await sharp(full).extract({ left: Math.round(cl), top: Math.round(ct), width: Math.round(Math.min(cropW, p.W - cl)), height: Math.round(Math.min(cropH, p.H - ct)) })
    .resize(Math.round(cropW) * 2, cropH * 2, { kernel: 'nearest' }).toFile(`${OUT}/plaque-${STAGES[i]}.png`)
  const bad = !Number.isFinite(prof.dLum) || Math.abs(prof.dLum) >= THRESH
  console.log(`  ${STAGES[i].padEnd(13)} ${String(prof.center).padEnd(9)} ${String(prof.sky).padEnd(8)} ${prof.dLum > 0 ? '+' : ''}${prof.dLum}${bad ? '   ← SMUDGE' : ''}`)
  if (bad) fail(`${STAGES[i]}: smudge above frame (Δ ${prof.dLum} vs clean sky)`)
  else ok(`${STAGES[i]}: clean above frame (Δ ${prof.dLum} vs clean sky)`)
}

// wide establishing shot
await scrubTo(page, 0.03)
await page.screenshot({ path: `${OUT}/wide.png` }); ok('shot wide.png')

if (!errs.length) ok('zero console errors'); else { fail(`${errs.length} console errors`); errs.slice(0, 6).forEach((e) => console.log('     · ' + e)) }
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
if (!axe.violations.length) ok('axe: zero violations'); else { fail(`axe: ${axe.violations.length}`); axe.violations.forEach((v) => console.log(`     [${v.impact}] ${v.id}`)) }

await ctx.close()
await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
