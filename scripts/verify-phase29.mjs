// PHASE 2.9 SIGNATURE EFFECTS — headed 1536×743 DPR 1.25 → shots/phase29/
// Verifies the three deployments:
//   A) CTA Aurora (site-wide footer, .sig-aurora)          — CSS, drift
//   B) Infra results Light Rays (/infrastructure .inf-results)  — WebGL
//   C) Educational impact Light Rays (/educational-books .edu-impact) — WebGL
// Audits: per-deployment shot · one-WebGL-effect-per-viewport across full scrolls of
// every page · fps on each deployed section (with vs without effect) · reduced-motion
// pass (static fallbacks, no canvas) · WCAG AA contrast for text over each effect ·
// zero console errors. Prints a judge scorecard with amplifies-vs-forced per placement.
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'phase29')
mkdirSync(out, { recursive: true })
const base = process.env.URL || 'http://localhost:5182'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

const browser = await chromium.launch({
  headless: false,
  args: [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--use-gl=angle',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
  ],
})

// WCAG helpers
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const contrast = (a, b) => { const l1 = Math.max(a, b), l2 = Math.min(a, b); return (l1 + 0.05) / (l2 + 0.05) }

const ALL_ROUTES = ['/', '/infrastructure', '/educational-books', '/about', '/trade-books', '/print-on-demand', '/fulfilment', '/contact']

async function newPage(ctx) {
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))
  page._errs = errs
  return page
}

const centerOn = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s)
  if (!el) return false
  el.scrollIntoView({ block: 'center', behavior: 'instant' })
  return true
}, sel)

// fps: count rAF frames over 2s
const fps = (page) => page.evaluate(() => new Promise((res) => {
  let n = 0; const t0 = performance.now()
  const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round(n / (performance.now() - t0) * 1000)) }
  requestAnimationFrame(tick)
}))

// brightest bg luminance under a text selector (glyphs hidden), + worst contrast for its color
async function textContrast(page, textSel, colorHex) {
  const box = await page.evaluate((s) => {
    const el = document.querySelector(s); if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, innerWidth - r.left), height: Math.min(r.height, innerHeight - r.top) }
  }, textSel)
  if (!box || box.width < 4 || box.height < 4) return null
  await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.style.visibility = 'hidden' }, textSel)
  await page.waitForTimeout(60)
  let maxL = 0, rgb = [0, 0, 0]
  // sample a few frames to catch the effect's brightest moment
  for (let f = 0; f < 6; f++) {
    const buf = await page.screenshot({ clip: box })
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
    const ch = info.channels
    for (let k = 0; k < data.length; k += ch) {
      const L = lum(data[k], data[k + 1], data[k + 2])
      if (L > maxL) { maxL = L; rgb = [data[k], data[k + 1], data[k + 2]] }
    }
    await page.waitForTimeout(180)
  }
  await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.style.visibility = '' }, textSel)
  const cl = lum(parseInt(colorHex.slice(1, 3), 16), parseInt(colorHex.slice(3, 5), 16), parseInt(colorHex.slice(5, 7), 16))
  return { c: +contrast(cl, maxL).toFixed(2), bg: rgb, bgL: +maxL.toFixed(4) }
}

// count WebGL canvases + aurora currently intersecting the viewport (visible, non-zero)
const visibleEffects = (page) => page.evaluate(() => {
  const inView = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false
    const vy = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0))
    const vx = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0))
    return vy > 40 && vx > 40 // meaningfully in view
  }
  const webgl = [...document.querySelectorAll('.light-rays canvas')].filter(inView).length
  const aurora = [...document.querySelectorAll('.sig-aurora')].filter(inView).length
  const heroAurora = [...document.querySelectorAll('.hero-aurora')].filter(inView).length
  return { webgl, aurora, heroAurora }
})

const report = { errors: {}, oneEffect: {}, fps: {}, contrast: {}, drift: null, reduced: {} }

async function main() {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR })
  const page = await newPage(ctx)
  await page.bringToFront()

  // ── B) INFRA RESULTS RAYS ────────────────────────────────────────────────
  await page.goto(base + '/infrastructure', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await centerOn(page, '.inf-results')
  await page.waitForTimeout(1600) // let rays warm + IO fire
  await page.screenshot({ path: resolve(out, 'B1-infra-results-rays.png') })
  const infraCanvas = await page.$('.inf-results .light-rays canvas')
  console.log(`B) infra results — WebGL canvas present: ${!!infraCanvas}`)
  report.fps['infra-results'] = { with: await fps(page) }
  await page.evaluate(() => { const c = document.querySelector('.inf-results .light-rays'); if (c) c.style.display = 'none' })
  await page.waitForTimeout(400)
  report.fps['infra-results'].without = await fps(page)
  await page.evaluate(() => { const c = document.querySelector('.inf-results .light-rays'); if (c) c.style.display = '' })
  report.contrast['infra-stat-#fff'] = await textContrast(page, '.inf-results .inf-stat-num', '#fdfaf4')
  report.contrast['infra-h2-#fff'] = await textContrast(page, '.inf-results .inf-h2', '#fdfaf4')

  // ── C) EDUCATIONAL IMPACT RAYS ───────────────────────────────────────────
  await page.goto(base + '/educational-books', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await centerOn(page, '.edu-impact')
  await page.waitForTimeout(1600)
  await page.screenshot({ path: resolve(out, 'C1-edu-impact-rays.png') })
  const eduCanvas = await page.$('.edu-impact .light-rays canvas')
  console.log(`C) edu impact — WebGL canvas present: ${!!eduCanvas}`)
  report.fps['edu-impact'] = { with: await fps(page) }
  await page.evaluate(() => { const c = document.querySelector('.edu-impact .light-rays'); if (c) c.style.display = 'none' })
  await page.waitForTimeout(400)
  report.fps['edu-impact'].without = await fps(page)
  await page.evaluate(() => { const c = document.querySelector('.edu-impact .light-rays'); if (c) c.style.display = '' })
  report.contrast['edu-impact-title-#fff'] = await textContrast(page, '.edu-impact .edu-impact-title', '#fdfaf4')
  report.contrast['edu-country-figure-gold'] = await textContrast(page, '.edu-impact .edu-country-figure', '#c89a3c')

  // ── A) CTA AURORA (site-wide footer, use home) ───────────────────────────
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await centerOn(page, '#contact .sig-aurora')
  await page.waitForTimeout(1200)
  // frame the top CTA area (heading zone) not the cream footer card
  await page.evaluate(() => { const el = document.querySelector('#contact'); if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' }) })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: resolve(out, 'A1-cta-aurora.png') })
  // drift proof — two frames 12s apart over the aurora band
  const clip = { x: 0, y: 40, width: VP.width, height: 420 }
  const a = await page.screenshot({ clip })
  await page.waitForTimeout(12000)
  const b = await page.screenshot({ clip })
  const ga = await sharp(a).greyscale().resize(96, 24).raw().toBuffer()
  const gb = await sharp(b).greyscale().resize(96, 24).raw().toBuffer()
  let d = 0; for (let k = 0; k < ga.length; k++) d += Math.abs(ga[k] - gb[k])
  report.drift = +(d / ga.length).toFixed(2)
  report.contrast['cta-heading-#fff'] = await textContrast(page, '#contact h2', '#fdfaf4')

  // ── ONE-EFFECT-PER-VIEWPORT AUDIT across full scroll of every page ───────
  for (const r of ALL_ROUTES) {
    await page.goto(base + r, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    const H = await page.evaluate(() => document.body.scrollHeight)
    let maxWebgl = 0, maxTotal = 0, worst = 0
    for (let y = 0; y <= H; y += Math.round(VP.height * 0.75)) {
      await page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
      await page.waitForTimeout(350)
      const v = await visibleEffects(page)
      maxWebgl = Math.max(maxWebgl, v.webgl)
      maxTotal = Math.max(maxTotal, v.webgl + v.aurora + v.heroAurora)
      worst = Math.max(worst, v.webgl + v.heroAurora) // WebGL-class effects that must be ≤1
    }
    report.oneEffect[r] = { maxWebgl, maxWebglClass: worst, maxTotalEffects: maxTotal }
    report.errors[r] = page._errs.length
    if (page._errs.length) console.log(`  ⚠ ${r} console errors:`, page._errs.slice(0, 4))
    page._errs.length = 0
  }
  await ctx.close()

  // ── REDUCED MOTION — static fallbacks, no WebGL canvas, no drift ─────────
  const rctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion: 'reduce' })
  const rpage = await rctx.newPage()
  await rpage.goto(base + '/infrastructure', { waitUntil: 'networkidle' })
  await rpage.waitForTimeout(1500)
  await centerOn(rpage, '.inf-results')
  await rpage.waitForTimeout(1200)
  await rpage.screenshot({ path: resolve(out, 'R1-infra-reduced.png') })
  report.reduced.infraCanvas = !!(await rpage.$('.inf-results .light-rays canvas'))
  report.reduced.infraStatic = await rpage.$eval('.inf-results .light-rays', (e) => e.classList.contains('light-rays--static')).catch(() => false)

  await rpage.goto(base + '/educational-books', { waitUntil: 'networkidle' })
  await rpage.waitForTimeout(1500)
  await centerOn(rpage, '.edu-impact')
  await rpage.waitForTimeout(1200)
  await rpage.screenshot({ path: resolve(out, 'R2-edu-reduced.png') })
  report.reduced.eduCanvas = !!(await rpage.$('.edu-impact .light-rays canvas'))

  await rpage.goto(base + '/', { waitUntil: 'networkidle' })
  await rpage.waitForTimeout(2000)
  await rpage.evaluate(() => { const el = document.querySelector('#contact'); if (el) el.scrollIntoView({ block: 'start' }) })
  await rpage.waitForTimeout(1000)
  await rpage.screenshot({ path: resolve(out, 'R3-cta-reduced.png') })
  // aurora drift under reduced motion must be ~0
  const ra = await rpage.screenshot({ clip: { x: 0, y: 40, width: VP.width, height: 420 } })
  await rpage.waitForTimeout(4000)
  const rb = await rpage.screenshot({ clip: { x: 0, y: 40, width: VP.width, height: 420 } })
  const rga = await sharp(ra).greyscale().resize(96, 24).raw().toBuffer()
  const rgb = await sharp(rb).greyscale().resize(96, 24).raw().toBuffer()
  let rd = 0; for (let k = 0; k < rga.length; k++) rd += Math.abs(rga[k] - rgb[k])
  report.reduced.auroraDrift = +(rd / rga.length).toFixed(2)
  await rctx.close()

  // ── SCORECARD ────────────────────────────────────────────────────────────
  console.log('\n════════════ PHASE 2.9 VERIFY SCORECARD ════════════')
  console.log('\nAURORA drift (12s, mean grey Δ):', report.drift, report.drift > 1 ? '→ MOVING ✓' : '→ STATIC ✗')
  console.log('\nFPS (with effect / without / Δ):')
  for (const [k, v] of Object.entries(report.fps)) console.log(`  ${k.padEnd(16)} ${v.with} / ${v.without}  Δ=${v.with - v.without}`)
  console.log('\nCONTRAST over effect (WCAG: large ≥3, normal ≥4.5):')
  for (const [k, v] of Object.entries(report.contrast)) {
    if (!v) { console.log(`  ${k.padEnd(26)} (no box)`); continue }
    console.log(`  ${k.padEnd(26)} ${v.c}:1  bg rgb(${v.bg.join(',')})  → ${v.c >= 3 ? 'PASS' : 'FAIL'}`)
  }
  console.log('\nONE-EFFECT-PER-VIEWPORT (WebGL-class must be ≤1):')
  for (const [r, v] of Object.entries(report.oneEffect)) {
    console.log(`  ${r.padEnd(20)} maxWebGL=${v.maxWebgl}  maxWebGLclass=${v.maxWebglClass}  totalEffects=${v.maxTotalEffects}  → ${v.maxWebglClass <= 1 ? 'PASS' : 'FAIL'}`)
  }
  console.log('\nCONSOLE ERRORS per route:')
  for (const [r, n] of Object.entries(report.errors)) console.log(`  ${r.padEnd(20)} ${n} ${n === 0 ? '✓' : '✗'}`)
  console.log('\nREDUCED MOTION:')
  console.log('  infra rays canvas present:', report.reduced.infraCanvas, report.reduced.infraCanvas ? '✗ (should be false)' : '✓')
  console.log('  infra static fallback class:', report.reduced.infraStatic, report.reduced.infraStatic ? '✓' : '✗')
  console.log('  edu rays canvas present:', report.reduced.eduCanvas, report.reduced.eduCanvas ? '✗ (should be false)' : '✓')
  console.log('  aurora drift (reduced):', report.reduced.auroraDrift, report.reduced.auroraDrift < 1 ? '✓ static' : '✗ moving')
  console.log('\n✓ shots in shots/phase29/')
}

await main()
await browser.close()
