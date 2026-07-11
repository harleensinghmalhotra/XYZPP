import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const URL = 'http://localhost:5233'
const OUT = 'shots/promise-final'
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
  await p.waitForTimeout(600)
}

// sRGB relative luminance + WCAG contrast ratio
function lum([r, g, bl]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl)
}
function contrast(fg, bg) {
  const L1 = lum(fg), L2 = lum(bg)
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
}
const CREAM = [253, 250, 244]

// Pin the glow to an EXACT keyframe of its 9s cycle (compositor opacity doesn't
// reliably surface via getComputedStyle, so set the designed extreme inline),
// then read the TRUE composited background the heading sits on from real runtime
// values: the section base colour + the glow's first gradient stop, scaled by the
// pinned opacity. The heading is centred on the glow's brightest point, so this
// is the worst-case (lowest) contrast. No screenshot decoding, no extra deps.
// Keyframes: 0%/100% → opacity 0.82 scale 1; 50% → opacity 1 scale 1.035.
async function bgUnderHeading(p, glowOpacity, glowScale) {
  return await p.evaluate(({ op, sc }) => {
    const glow = document.querySelector('.promise-glow')
    glow.style.animation = 'none'
    glow.style.opacity = String(op)
    glow.style.transform = `translate(-50%, -50%) scale(${sc})`
    void glow.offsetWidth
    const gs = getComputedStyle(glow)
    const base = getComputedStyle(document.querySelector('.promise')).backgroundColor
    const mBase = base.match(/[\d.]+/g).map(Number) // [r,g,b(,a)]
    // first rgba() stop of the radial gradient = the glow's centre colour
    const s = gs.backgroundImage.match(/rgba?\(([^)]+)\)/)[1].split(',').map((v) => parseFloat(v))
    const gold = [s[0], s[1], s[2]]
    const alpha = (s[3] ?? 1) * op // effective centre alpha of the lamp
    const comp = [0, 1, 2].map((i) => Math.round(mBase[i] * (1 - alpha) + gold[i] * alpha))
    return { comp, alpha: +alpha.toFixed(4), opacity: op, base: mBase.slice(0, 3), gold }
  }, { op: glowOpacity, sc: glowScale })
}

async function frame(p, glowOpacity, glowScale, label, shot) {
  const r = await bgUnderHeading(p, glowOpacity, glowScale)
  await p.locator('#promise').screenshot({ path: `${OUT}/${shot}` })
  return { label, bg: r.comp, effAlpha: r.alpha, glowOpacity: r.opacity, contrast: +contrast(CREAM, r.comp).toFixed(2) }
}

// ── EN centred composition + glow brightest/dimmest with contrast ────────────
let enBright, enDim
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/en-composition.png` })
  enBright = await frame(p, 1.0, 1.035, 'EN glow brightest (50% keyframe)', 'en-glow-brightest.png')
  enDim = await frame(p, 0.82, 1.0, 'EN glow dimmest (0% keyframe)', 'en-glow-dimmest.png')
  await ctx.close()
}

// ── FR centred composition + brightest contrast ──────────────────────────────
let frBright
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  await p.locator('#promise').screenshot({ path: `${OUT}/fr-composition.png` })
  frBright = await frame(p, 1.0, 1.035, 'FR glow brightest', 'fr-glow-brightest.png')
  await ctx.close()
}

// ── Reduced motion: glow static (animation:none, frozen at mid) ───────────────
let reduced
{
  const { ctx, p } = await fresh({ reduced: true })
  await gotoPromise(p, 'en')
  await p.locator('#promise').screenshot({ path: `${OUT}/reduced.png` })
  reduced = await p.evaluate(() => {
    const g = getComputedStyle(document.querySelector('.promise-glow'))
    return { animationName: g.animationName, opacity: g.opacity, transform: g.transform }
  })
  await ctx.close()
}

// ── Structural / geometry proof ──────────────────────────────────────────────
let geom
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'en')
  geom = await p.evaluate(() => {
    const inner = document.querySelector('.promise-inner')
    const q = document.querySelector('.promise-quote')
    return {
      sectionH: document.getElementById('promise').offsetHeight,
      textAlign: getComputedStyle(inner).textAlign,
      quoteMaxWidth: getComputedStyle(q).maxWidth,
      quoteLines: q.getClientRects().length,
      hasGlow: !!document.querySelector('.promise-glow'),
      hasDotGrid: !!document.querySelector('.promise-bg'),
      assemblyGone: !document.querySelector('.promise-line, .pl-belt, .pl-word, .pl-stamp, .pl-track'),
      globeGone: !document.querySelector('.promise-globe'),
      waveGone: !document.querySelector('.promise-waves'),
    }
  })
  await ctx.close()
}
// FR line count
let frLines
{
  const { ctx, p } = await fresh()
  await gotoPromise(p, 'fr')
  frLines = await p.evaluate(() => document.querySelector('.promise-quote').getClientRects().length)
  await ctx.close()
}

// ── FPS with the full homepage live ──────────────────────────────────────────
let fps
{
  const { ctx, p } = await fresh()
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
  contrast: { enBright, enDim, frBright },
  aa_pass: enBright.contrast >= 4.5 && enDim.contrast >= 4.5 && frBright.contrast >= 4.5,
  reduced,
  geom,
  frQuoteLines: frLines,
  fps,
  consoleErrors: errors,
}, null, 2))
