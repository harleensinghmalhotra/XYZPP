import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5176'
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
await page.waitForTimeout(1300)

const geo = await page.evaluate(() => {
  const el = document.getElementById('process')
  const nodes = [...el.querySelectorAll('.press-node')].map((n) => Math.round(n.getBoundingClientRect().top))
  return {
    top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight,
    oneRow: new Set(nodes).size === 1, nodeCount: nodes.length, hasCanvas: !!el.querySelector('canvas'),
  }
})
console.log('SECTION HEIGHT:', geo.h, 'px =', (geo.h / geo.innerH * 100).toFixed(1) + 'vh')
console.log('ONE CLEAN ROW @1536:', geo.oneRow, '| nodes:', geo.nodeCount, '| <canvas>:', geo.hasCanvas)

const textProof = await page.evaluate(() => {
  const el = document.getElementById('process')
  const names = [...el.querySelectorAll('.press-name')].map((n) => n.textContent.trim())
  const r = document.createRange(); r.selectNodeContents(el.querySelector('.press-desc'))
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r)
  const selected = sel.toString().trim(); sel.removeAllRanges()
  return { names, selectableOK: selected.length > 10, selected }
})
console.log('TEXT (real DOM):', JSON.stringify(textProof.names))
console.log('SELECTABLE:', textProof.selectableOK, '| sample:', JSON.stringify(textProof.selected.slice(0, 46)))
console.log('NUMBERS REMOVED (.press-num count):', await page.evaluate(() => document.querySelectorAll('#process .press-num').length))

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const startY = Math.round(geo.top - 0.78 * geo.innerH)
const endY = Math.round(geo.top + geo.h - 0.46 * geo.innerH)

await to(Math.round(geo.top - 0.72 * geo.innerH))
await page.waitForTimeout(700)
await page.screenshot({ path: resolve(out, 'pressline-v2-junction.png') })

// intersection test: does two rects overlap?
const overlapReport = []
let maxOverlap = 0
for (const p of [0, 0.25, 0.5, 0.75, 1]) {
  await to(Math.round(startY + p * (endY - startY)))
  await page.waitForTimeout(720)
  const s = await page.evaluate(() => {
    const el = document.getElementById('process')
    const hb = el.querySelector('.press-headbar')
    const cs = getComputedStyle(hb)
    const visible = parseFloat(cs.opacity) > 0.02
    const hbb = hb.getBoundingClientRect()
    // roller (headbar) vs every icon + label bbox
    const targets = [...el.querySelectorAll('.press-icon, .press-label')]
    let worst = 0, hit = null
    for (const t of targets) {
      const r = t.getBoundingClientRect()
      const ox = Math.max(0, Math.min(hbb.right, r.right) - Math.max(hbb.left, r.left))
      const oy = Math.max(0, Math.min(hbb.bottom, r.bottom) - Math.max(hbb.top, r.top))
      const area = visible ? ox * oy : 0
      if (area > worst) { worst = area; hit = t.className }
    }
    // self-drawn icon count: drawn when paths' offset/dasharray ratio ~0
    const ratio = (p) => { const cs = getComputedStyle(p); const off = parseFloat(cs.strokeDashoffset) || 0; const dash = parseFloat(cs.strokeDasharray) || 0; return dash > 0 ? off / dash : 0 }
    const drawn = [...el.querySelectorAll('.press-icon')].filter((ic) => {
      const paths = [...ic.querySelectorAll('.pdraw')]
      const avg = paths.reduce((a, p) => a + ratio(p), 0) / paths.length
      return avg < 0.08 // essentially fully inked
    }).length
    const headX = visible ? Math.round(hbb.left + hbb.width / 2 - el.querySelector('.press-sheet').getBoundingClientRect().left) : -1
    return { visible, worst: Math.round(worst), hit, drawn, headX }
  })
  maxOverlap = Math.max(maxOverlap, s.worst)
  overlapReport.push({ p: Math.round(p * 100), ...s })
  await page.screenshot({ path: resolve(out, `pressline-v2-${String(Math.round(p * 100)).padStart(3, '0')}.png`) })
  console.log(`  ✓ v2-${String(Math.round(p * 100)).padStart(3, '0')} | head x=${s.headX} vis=${s.visible} | icons drawn: ${s.drawn}/6 | roller∩content: ${s.worst}px²${s.worst ? ' <'+s.hit+'>' : ''}`)
}
console.log('OVERLAP ASSERTION — max roller∩content across 0/25/50/75/100:', maxOverlap, 'px²', maxOverlap === 0 ? '→ ZERO ✓' : '→ FAIL')

// mid-draw closeup: find a scroll where a chosen icon is ~half stroke-drawn
{
  const TARGET = 2 // Fulfillment (box) — nice long strokes
  const setP = async (P) => { await to(Math.round(startY + P * (endY - startY))); await page.waitForTimeout(600) }
  let bestP = 0.5, bestErr = 9
  for (let P = 0.30; P <= 0.58; P += 0.01) {
    await setP(P)
    const frac = await page.evaluate((i) => {
      const r = (p) => { const cs = getComputedStyle(p); const o = parseFloat(cs.strokeDashoffset) || 0; const d = parseFloat(cs.strokeDasharray) || 0; return d > 0 ? o / d : 0 }
      const paths = [...document.querySelectorAll('.press-icon')[i].querySelectorAll('.pdraw')]
      return 1 - paths.reduce((a, p) => a + r(p), 0) / paths.length
    }, TARGET)
    if (Math.abs(frac - 0.5) < bestErr) { bestErr = Math.abs(frac - 0.5); bestP = P }
  }
  await setP(bestP)
  const frac = await page.evaluate((i) => { const r = (p) => { const cs = getComputedStyle(p); const o = parseFloat(cs.strokeDashoffset) || 0; const d = parseFloat(cs.strokeDasharray) || 0; return d > 0 ? o / d : 0 }; const paths = [...document.querySelectorAll('.press-icon')[i].querySelectorAll('.pdraw')]; return +(1 - paths.reduce((a, p) => a + r(p), 0) / paths.length).toFixed(2) }, TARGET)
  const box = await (await page.$('.press-stage:nth-child(3)')).boundingBox()
  await page.screenshot({ path: resolve(out, 'icon-drawing.png'), clip: { x: box.x - 20, y: box.y - 26, width: box.width + 40, height: 130 } })
  console.log(`  ✓ icon-drawing.png — Fulfillment icon ${Math.round(frac * 100)}% stroke-drawn (mid-draw proof)`)
}

// fps across the travel
await to(startY - 40); await page.waitForTimeout(250)
const fps = await page.evaluate(({ endY }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2000
  if (window.__lenis) window.__lenis.scrollTo(endY + 40, { duration: dur / 1000 }); else window.scrollTo(0, endY)
  setTimeout(() => { cancelAnimationFrame(raf); const a = d.slice(3).sort((x, y) => x - y); const pct = (q) => a[Math.min(a.length - 1, Math.floor(a.length * q))]; const mean = a.reduce((x, y) => x + y, 0) / a.length; done({ fpsMean: +(1000 / mean).toFixed(1), msP95: +pct(0.95).toFixed(2), longFrames: a.filter((x) => x > 18.5).length }) }, dur + 250)
}), { endY })
console.log('FPS:', fps)
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

const axe = await new AxeBuilder({ page }).include('#process').analyze()
console.log('axe #process violations:', axe.violations.length)
for (const v of axe.violations) console.log(` [${v.impact}] ${v.id}: ${v.help}`)

// reduced-motion → fully printed + fully drawn, no roller
const rc = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.fonts && document.fonts.ready)
await rp.evaluate(() => document.getElementById('process').scrollIntoView({ block: 'center' }))
await rp.waitForTimeout(900)
const rm = await rp.evaluate(() => {
  const el = document.getElementById('process')
  const inked = [...el.querySelectorAll('.press-node')].filter((n) => getComputedStyle(n).borderColor.includes('155')).length
  const drawn = [...el.querySelectorAll('.press-icon')].filter((ic) => [...ic.querySelectorAll('.pdraw')].every((p) => Math.abs(parseFloat(getComputedStyle(p).strokeDashoffset) || 0) < 0.05)).length
  const rollerVisible = parseFloat(getComputedStyle(el.querySelector('.press-headbar')).opacity) > 0.02
  return { inked, drawn, rollerVisible }
})
console.log('REDUCED-MOTION final:', `inked ${rm.inked}/6, icons drawn ${rm.drawn}/6, roller visible: ${rm.rollerVisible} (want false)`)
await rp.screenshot({ path: resolve(out, 'pressline-v2-reduced.png') })
await browser.close()
