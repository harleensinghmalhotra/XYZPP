import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const URL = 'http://localhost:5233'
const OUT = 'shots/promise-line'
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
  await p.evaluate(() => document.getElementById('promise')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(700)
}

function overlaps(a, c) {
  return !(a.right <= c.left || c.right <= a.left || a.bottom <= c.top || c.bottom <= a.top)
}

// ── EN: full section + 6 frames across one word journey ──────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  const sec = p.locator('#promise')
  await sec.screenshot({ path: `${OUT}/en-section.png` })
  // 6 frames across ~4s lifecycle: enter, pause, stamp mid-press, stamped, exit, next entering
  for (let i = 0; i < 6; i++) {
    await sec.screenshot({ path: `${OUT}/en-journey-${i}.png` })
    await p.waitForTimeout(650)
  }
  await ctx.close()
}

// ── FR: full section + a couple frames ───────────────────────────────────────
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  const sec = p.locator('#promise')
  await sec.screenshot({ path: `${OUT}/fr-section.png` })
  await p.waitForTimeout(1100)
  await sec.screenshot({ path: `${OUT}/fr-journey.png` })
  await ctx.close()
}

// ── Reduced motion: static composition — no animation machinery at all ───────
// Deterministic structural proof (a transparent-element pixel diff would capture
// whatever composites behind it): the reduced branch renders the static stack
// (5 stamped words, NO .pl-stamp head, NO GSAP tweens on the line).
let reducedStatic = null
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/reduced.png` })
  reducedStatic = await p.evaluate(() => {
    const isStatic = document.querySelector('.promise-line--static')
    const noStamp = !document.querySelector('.pl-stamp')
    const staticWords = document.querySelectorAll('.pl-word--static').length
    const gsapTweens = window.gsap ? window.gsap.getTweensOf('.pl-word').length : 0
    return { staticContainer: !!isStatic, noStampHead: noStamp, staticWords, gsapTweensOnWords: gsapTweens }
  })
  await ctx.close()
}
// motion mode really does mount the stamp head
let motionHasStamp = null
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  motionHasStamp = await p.evaluate(() => !!document.querySelector('.pl-stamp') && !document.querySelector('.promise-line--static'))
  await ctx.close()
}

// ── Overlap assert: line box vs the TIGHT text ink at 1280/1536/1920 ─────────
async function overlapAt(width) {
  const ctx = await b.newContext({ viewport: { width, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await gotoPromise(p, 'en')
  const r = await p.evaluate(() => {
    const g = document.querySelector('.promise-line').getBoundingClientRect()
    const inkRect = (sel) => {
      const el = document.querySelector(sel)
      const rng = document.createRange()
      rng.selectNodeContents(el)
      return rng.getBoundingClientRect()
    }
    const els = ['.promise-eyebrow', '.promise-quote', '.promise-support', '.promise-attr'].map(inkRect)
    const col = {
      left: Math.min(...els.map((e) => e.left)), right: Math.max(...els.map((e) => e.right)),
      top: Math.min(...els.map((e) => e.top)), bottom: Math.max(...els.map((e) => e.bottom)),
    }
    return { g: { left: g.left, right: g.right, top: g.top, bottom: g.bottom }, col }
  })
  await ctx.close()
  return { width, overlap: overlaps(r.g, r.col), gap: Math.round(r.g.left - r.col.right) }
}
const ov = { w1280: await overlapAt(1280), w1536: await overlapAt(1536), w1920: await overlapAt(1920) }

// ── Sub-1280 layout (1120 keeps it, 800 hides it) ────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1120, height: 800 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/sub1280-1120.png` })
  await ctx.close()
}
{
  const ctx = await b.newContext({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/sub1280-800.png` })
  await ctx.close()
}

// ── Geometry + no-wave/globe proof ───────────────────────────────────────────
let geom
{
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await gotoPromise(p, 'en')
  geom = await p.evaluate(() => ({
    sectionH: document.getElementById('promise').offsetHeight,
    hasWaves: !!document.querySelector('.promise-waves, .u-hero-waves'),
    hasGlobe: !!document.querySelector('.promise-globe'),
    hasLine: !!document.querySelector('.promise-line'),
    words: [...document.querySelectorAll('.promise-line .pl-word-t')].map((e) => e.textContent),
    belt: !!document.querySelector('.pl-belt')?.getAttribute('d'),
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
    let n = 0; const t0 = performance.now()
    const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round((n / (performance.now() - t0)) * 1000)) }
    requestAnimationFrame(tick)
  }))
  await ctx.close()
}

await b.close()

console.log(JSON.stringify({
  reducedStatic,
  motionHasStamp,
  overlap: { w1280: ov.w1280.overlap, w1536: ov.w1536.overlap, w1920: ov.w1920.overlap },
  gapPx: { w1280: ov.w1280.gap, w1536: ov.w1536.gap, w1920: ov.w1920.gap },
  geom,
  fps,
  consoleErrors: errors,
}, null, 2))
