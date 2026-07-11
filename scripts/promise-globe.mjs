import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const URL = 'http://localhost:5233'
const OUT = 'shots/promise-globe'
mkdirSync(OUT, { recursive: true })

const errors = []
const b = await chromium.launch({ headless: false })

async function fresh({ reduced = false } = {}) {
  const ctx = await b.newContext({
    viewport: { width: 1536, height: 743 },
    deviceScaleFactor: 1.25,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const p = await ctx.newPage()
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  return { ctx, p }
}

async function gotoPromise(p, lang) {
  await p.goto(URL, { waitUntil: 'networkidle' })
  if (lang === 'fr') {
    await p.evaluate(() => window.localStorage.setItem('qfp.lang', 'fr'))
    await p.reload({ waitUntil: 'networkidle' })
  }
  await p.evaluate(() => {
    document.getElementById('promise')?.scrollIntoView({ block: 'center' })
  })
  await p.waitForTimeout(900)
}

function bboxOverlap(a, b) {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)
}

// ── EN: 4 frames across the rotation + arc-draw cycle ────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  const sec = p.locator('#promise')
  for (let i = 0; i < 4; i++) {
    await sec.screenshot({ path: `${OUT}/en-frame-${i}.png` })
    await p.waitForTimeout(2400) // spread across the ~9.5s arc cycle
  }
  await ctx.close()
}

// ── FR: section + 4 frames ───────────────────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  const sec = p.locator('#promise')
  for (let i = 0; i < 4; i++) {
    await sec.screenshot({ path: `${OUT}/fr-frame-${i}.png` })
    await p.waitForTimeout(2400)
  }
  await ctx.close()
}

// ── Reduced motion: must be a static frame (no rotation) ─────────────────────
let reducedStatic = null
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p, 'en')
  const sec = p.locator('#promise')
  await sec.screenshot({ path: `${OUT}/reduced-a.png` })
  const a = await p.evaluate(() => document.querySelector('.promise-globe').toDataURL())
  await p.waitForTimeout(1600)
  await sec.screenshot({ path: `${OUT}/reduced-b.png` })
  const c = await p.evaluate(() => document.querySelector('.promise-globe').toDataURL())
  reducedStatic = a === c
  await ctx.close()
}

// ── Overlap + contrast + geometry asserts at 1536, plus 1280/1920 overlap ────
async function overlapAt(width) {
  const ctx = await b.newContext({ viewport: { width, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await gotoPromise(p, 'en')
  const r = await p.evaluate(() => {
    const g = document.querySelector('.promise-globe').getBoundingClientRect()
    // measure the TIGHT ink bounds of the text (a Range over each element's
    // contents), not the full-width block boxes — the eyebrow/attr <p> elements
    // span the whole 1180px column but their text is short + left-aligned.
    const inkRect = (el) => {
      const rng = document.createRange()
      rng.selectNodeContents(el)
      return rng.getBoundingClientRect()
    }
    const els = ['.promise-eyebrow', '.promise-quote', '.promise-support', '.promise-attr']
      .map((s) => inkRect(document.querySelector(s)))
    const col = {
      left: Math.min(...els.map((e) => e.left)),
      right: Math.max(...els.map((e) => e.right)),
      top: Math.min(...els.map((e) => e.top)),
      bottom: Math.max(...els.map((e) => e.bottom)),
    }
    return { g: { left: g.left, right: g.right, top: g.top, bottom: g.bottom }, col }
  })
  await ctx.close()
  return { width, overlap: bboxOverlap(r.g, r.col), gap: Math.round(r.col.right - r.g.left) * -1, r }
}

const ov1280 = await overlapAt(1280)
const ov1536 = await overlapAt(1536)
const ov1920 = await overlapAt(1920)

// ── Section height (should be unchanged: min-height 100svh) + no wave canvas ──
let geom
{
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await gotoPromise(p, 'en')
  geom = await p.evaluate(() => ({
    sectionH: document.getElementById('promise').offsetHeight,
    hasWaves: !!document.querySelector('.promise-waves'),
    hasGlobe: !!document.querySelector('.promise-globe'),
    hasDotGrid: !!document.querySelector('.promise-bg'),
  }))
  await ctx.close()
}

// ── FPS with the full homepage live, section on screen ───────────────────────
let fps
{
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await gotoPromise(p, 'en')
  fps = await p.evaluate(() => new Promise((res) => {
    let n = 0
    const t0 = performance.now()
    const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round((n / (performance.now() - t0)) * 1000)) }
    requestAnimationFrame(tick)
  }))
  await ctx.close()
}

await b.close()

console.log(JSON.stringify({
  reducedStatic,
  overlap: { w1280: ov1280.overlap, w1536: ov1536.overlap, w1920: ov1920.overlap },
  gapPx: { w1280: ov1280.gap, w1536: ov1536.gap, w1920: ov1920.gap },
  geom,
  fps,
  consoleErrors: errors,
}, null, 2))
