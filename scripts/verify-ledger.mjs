import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })

// ── helper: clip screenshot of a selector (with padding) ──────────────────────
const clipOf = async (page, sel, pad = 24) => {
  const b = await (await page.$(sel)).boundingBox()
  return {
    x: Math.max(0, Math.round(b.x - pad)),
    y: Math.max(0, Math.round(b.y - pad)),
    width: Math.min(1536, Math.round(b.width + pad * 2)),
    height: Math.round(b.height + pad * 2),
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN CONTEXT — mid-roll proof + final + a11y/perf
// ════════════════════════════════════════════════════════════════════════════
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(600)

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)

// position the ledger so its top crosses the 78% trigger and the hero is visible
const ledgerY = await page.evaluate(() => document.querySelector('.proj-ledger').getBoundingClientRect().top + window.scrollY)
await to(Math.round(ledgerY - 120)) // hero near top of viewport, trigger fires

// ── MID-ROLL CAPTURE — poll the hero reel until it is genuinely mid-travel ────
let midShot = false
let midInfo = null
for (let i = 0; i < 40; i++) {
  const state = await page.evaluate(() => {
    const reel = document.querySelector('.ledger-hero .odo-reel')
    if (!reel) return null
    const m = new DOMMatrixReadOnly(getComputedStyle(reel).transform)
    const strip = reel.getBoundingClientRect().height // 20 cells
    const target = (10 + Number(reel.dataset.d)) / 20 // fraction of strip
    const prog = strip ? (-m.m42) / (strip * target) : 0 // 0 → rest, 1 → locked
    return { prog: +prog.toFixed(3), ty: +m.m42.toFixed(1) }
  })
  if (state && state.prog > 0.18 && state.prog < 0.82) {
    midInfo = state
    await page.screenshot({ path: resolve(out, 'ledger-roll.png'), clip: await clipOf(page, '.ledger-hero', 30) })
    midShot = true
    break
  }
  await page.waitForTimeout(45)
}
console.log(`\nMID-ROLL: ${midShot ? `captured @ progress ${midInfo.prog} (0=rest,1=locked) → ledger-roll.png ✓` : 'MISSED ✗'}`)

// ── settle → FINAL locked values ──────────────────────────────────────────────
await page.waitForTimeout(2600)
const locked = await page.evaluate(() => {
  const heroReels = [...document.querySelectorAll('.ledger-hero .odo-reel')].map((r) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(r).transform)
    const target = (10 + Number(r.dataset.d)) / 20 * r.getBoundingClientRect().height
    return { d: r.dataset.d, lockedOn: Math.abs(-m.m42 - target) < 2 }
  })
  return {
    heroLabel: document.querySelector('.ledger-hero-num').getAttribute('aria-label') || '',
    reelsLocked: heroReels.every((r) => r.lockedOn),
    rowCount: document.querySelectorAll('.ledger-row').length,
    rowVals: [...document.querySelectorAll('.ledger-num .odo')].map((o) => o.getAttribute('aria-label')),
  }
})
// the block is taller than 743 — grow the viewport so the whole ledger fits one
// frame (animation already ran once), place its top clear of the fixed nav.
await page.setViewportSize({ width: 1536, height: 1120 })
await page.waitForTimeout(200)
const lbY = await page.evaluate(() => document.querySelector('.proj-ledger').getBoundingClientRect().top + window.scrollY)
await to(Math.round(lbY - 110))
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(out, 'ledger-final.png'), clip: await clipOf(page, '.proj-ledger', 22) })
await page.setViewportSize(VP.viewport)
console.log(`\nFINAL: hero reels locked=${locked.reelsLocked}, rows=${locked.rowCount} → ledger-final.png ✓`)
console.log('  row numbers:', JSON.stringify(locked.rowVals))

// ── FPS scrub through the band + CLS ──────────────────────────────────────────
await to(Math.round(ledgerY - 743))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2200
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: ledgerY + 400 })
console.log('\nFPS:', JSON.stringify(fps))
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe (incl. colour-contrast) ───────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#projects').analyze()
console.log('axe #projects violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}: ${v.help}`); for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' ')) }
const contrast = axe.passes.find((p) => p.id === 'color-contrast')
console.log('color-contrast: ', axe.violations.some((v) => v.id === 'color-contrast') ? 'FAIL ✗' : `PASS ✓ (${contrast ? contrast.nodes.length : 0} nodes checked)`)

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE — ?hideRestricted → HDFC + ZEE rows gone, clean reflow
// ════════════════════════════════════════════════════════════════════════════
const tp = await ctx.newPage()
await tp.goto(url + '?hideRestricted', { waitUntil: 'networkidle', timeout: 60000 })
await tp.evaluate(() => document.fonts && document.fonts.ready)
await tp.evaluate(() => window.__lenis && window.__lenis.scrollTo(document.querySelector('.proj-ledger').getBoundingClientRect().top + window.scrollY - 120, { immediate: true }))
await tp.waitForTimeout(2600)
const toggled = await tp.evaluate(() => {
  const names = [...document.querySelectorAll('.ledger-name')].map((n) => n.textContent)
  return { count: names.length, hasHDFC: names.includes('HDFC Bank'), hasZEE: names.includes('ZEE Learn'), names }
})
await tp.setViewportSize({ width: 1536, height: 1120 })
await tp.waitForTimeout(200)
const tlbY = await tp.evaluate(() => document.querySelector('.proj-ledger').getBoundingClientRect().top + window.scrollY)
await tp.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), Math.round(tlbY - 110))
await tp.waitForTimeout(400)
await tp.screenshot({ path: resolve(out, 'ledger-toggled.png'), clip: await clipOf(tp, '.proj-ledger', 22) })
console.log(`\nTOGGLE: rows=${toggled.count} (want 5), HDFC:${toggled.hasHDFC} ZEE:${toggled.hasZEE} (want false/false) → ledger-toggled.png ✓`)
await tp.close()

// ════════════════════════════════════════════════════════════════════════════
// REDUCED MOTION — final values instantly, no reel, no sweep
// ════════════════════════════════════════════════════════════════════════════
const rc = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.fonts && document.fonts.ready)
await rp.evaluate(() => document.querySelector('.proj-ledger').scrollIntoView({ block: 'center' }))
await rp.waitForTimeout(700)
const rm = await rp.evaluate(() => ({
  reels: document.querySelectorAll('.odo-reel').length,
  heroText: document.querySelector('.ledger-hero-num').textContent.trim(),
  flashOpacity: getComputedStyle(document.querySelector('.proj-ledger-flash')).opacity,
  rowsVisible: getComputedStyle(document.querySelector('.ledger-row')).opacity,
}))
console.log(`\nREDUCED-MOTION: reels=${rm.reels} (want 0), hero="${rm.heroText}" (want 10M+), flash opacity=${rm.flashOpacity} (want 0), rows opacity=${rm.rowsVisible} (want 1)`)
await rc.close()

await browser.close()
console.log('\nDONE.')
