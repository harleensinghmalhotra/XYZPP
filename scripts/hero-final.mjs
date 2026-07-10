// HERO ROUND verification harness — headed Playwright @ 1536×743 DPR 1.25.
// Produces every evidence artefact into shots/hero-final/:
//   landed.png            — hero at rest (2-line anatomy + breathing room)
//   swirl.png             — pointer-reactive ether after synthetic mouse swirl
//   reduced.png           — prefers-reduced-motion (static aurora, no ether)
//   junction.png          — book-landing / TrustStrips seam (must be unchanged)
//   compare-spacing.png   — our landed frame beside the Alternativ reference
//   fps.json              — pin-scroll fps with ether ON vs OFF
//   contrast.json         — headline text contrast vs the navy field (AA)
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'hero-final')
mkdirSync(out, { recursive: true })
const URL = process.env.HERO_URL || 'http://localhost:5173'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

// WCAG relative-luminance contrast ratio between two #rrggbb colours.
function contrast(hex1, hex2) {
  const lum = (hex) => {
    const c = hex.replace('#', '')
    const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

const browser = await chromium.launch({ headless: false })

async function newHero({ reducedMotion } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion })
  const page = await ctx.newPage()
  return { ctx, page }
}

async function settle(page) {
  await page.waitForTimeout(1400)
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* noop */ }
  await page.waitForTimeout(400)
}

async function scrollTo(page, y) {
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)
}

// Drive scroll 0→1.2×vh over 3s via rAF, sampling frame deltas → fps.
async function measurePinFps(page) {
  await scrollTo(page, 0)
  await page.waitForTimeout(600)
  return page.evaluate(
    () =>
      new Promise((res) => {
        const start = performance.now()
        let last = start
        const deltas = []
        const maxY = window.innerHeight * 1.2
        function frame(now) {
          deltas.push(now - last)
          last = now
          const t = (now - start) / 3000
          const y = Math.min(1, t) * maxY
          if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
          else window.scrollTo(0, y)
          if (now - start < 3000) requestAnimationFrame(frame)
          else {
            const d = deltas.slice(2).sort((a, b) => a - b) // drop warmup frames
            const med = d[Math.floor(d.length / 2)]
            const avg = d.reduce((s, x) => s + x, 0) / d.length
            const p95 = d[Math.floor(d.length * 0.95)]
            res({
              frames: d.length,
              medianFps: +(1000 / med).toFixed(1),
              avgFps: +(1000 / avg).toFixed(1),
              worstFrameMs: +p95.toFixed(1)
            })
          }
        }
        requestAnimationFrame(frame)
      })
  )
}

// ── 1. Landed frame + contrast + swirl (ether ON) ──
{
  const { ctx, page } = await newHero()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await scrollTo(page, 0)
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(out, 'landed.png') })
  console.log('✓ landed.png')

  // headline contrast — sample the two headline lines' colours + the field
  const probe = await page.evaluate(() => {
    const wrap = document.querySelector('#hero .will-change-transform')
    const lines = wrap ? Array.from(wrap.children) : []
    const rgb = (el) => (el ? getComputedStyle(el).color : null)
    return {
      creamColor: rgb(lines[0]),
      goldLineColor: rgb(lines[1]),
      field: getComputedStyle(document.querySelector('#hero')).backgroundColor
    }
  })
  const toHex = (rgb) => {
    const m = rgb && rgb.match(/\d+/g)
    if (!m) return null
    return '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('')
  }
  const cream = '#fdfaf4' // cream line text
  const goldMid = '#c89a3c' // gold-foil mid stop (worst-case of the gradient)
  const navy = '#0c2f4a' // hero field
  const contrastReport = {
    field: navy,
    creamLine: { hex: cream, ratio: +contrast(cream, navy).toFixed(2), passAA_large: contrast(cream, navy) >= 3, passAA_normal: contrast(cream, navy) >= 4.5 },
    goldLine: { hex: goldMid, ratio: +contrast(goldMid, navy).toFixed(2), passAA_large: contrast(goldMid, navy) >= 3, passAA_normal: contrast(goldMid, navy) >= 4.5 },
    computed: { creamColor: toHex(probe.creamColor), goldLineColor: toHex(probe.goldLineColor) }
  }
  await writeFile(resolve(out, 'contrast.json'), JSON.stringify(contrastReport, null, 2))
  console.log('✓ contrast.json', contrastReport.creamLine.ratio, contrastReport.goldLine.ratio)

  // synthetic mouse swirl across the hero → ether should light up along the path
  const cx = VP.width / 2
  const cy = VP.height * 0.45
  await page.mouse.move(cx - 400, cy)
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 4
    const r = 260 * (1 - i / 240)
    await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, { steps: 1 })
    await page.waitForTimeout(6)
  }
  await page.waitForTimeout(120)
  await page.screenshot({ path: resolve(out, 'swirl.png') })
  console.log('✓ swirl.png')

  // junction — scroll so the hero bottom (book landed) meets the TrustStrips
  const heroBottom = await page.evaluate(() => {
    const h = document.querySelector('#hero')
    return h.offsetTop + h.offsetHeight
  })
  await scrollTo(page, heroBottom - VP.height)
  await page.waitForTimeout(700)
  await page.screenshot({ path: resolve(out, 'junction.png') })
  console.log('✓ junction.png')

  // fps with ether ON
  const fpsOn = await measurePinFps(page)
  console.log('  fps ON', fpsOn)
  await ctx.close()

  // fps with ether OFF (?ether=off A/B)
  const { ctx: ctx2, page: page2 } = await newHero()
  await page2.goto(URL + '?ether=off', { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page2)
  const fpsOff = await measurePinFps(page2)
  console.log('  fps OFF', fpsOff)
  await ctx2.close()

  await writeFile(
    resolve(out, 'fps.json'),
    JSON.stringify(
      {
        viewport: VP,
        dpr: DPR,
        note: 'pin-scroll driven 0→1.2vh over 3s; headed chromium capped at display refresh',
        etherOn: fpsOn,
        etherOff: fpsOff,
        deltaMedianFps: +(fpsOn.medianFps - fpsOff.medianFps).toFixed(1),
        etherOnAbove55: fpsOn.medianFps >= 55
      },
      null,
      2
    )
  )
  console.log('✓ fps.json')
}

// ── 2. Reduced motion frame ──
{
  const { ctx, page } = await newHero({ reducedMotion: 'reduce' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await scrollTo(page, 0)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, 'reduced.png') })
  console.log('✓ reduced.png')
  await ctx.close()
}

await browser.close()

// ── 3. Side-by-side vs Alternativ reference ──
try {
  const ref = resolve(root, 'recon', 'alternativ', '_diag-hero-top.png')
  const H = 760
  const ours = await sharp(resolve(out, 'landed.png')).resize({ height: H }).toBuffer()
  const theirs = await sharp(ref).resize({ height: H }).toBuffer()
  const om = await sharp(ours).metadata()
  const tm = await sharp(theirs).metadata()
  const gap = 24
  const W = om.width + tm.width + gap
  await sharp({ create: { width: W, height: H, channels: 3, background: '#101820' } })
    .composite([
      { input: ours, left: 0, top: 0 },
      { input: theirs, left: om.width + gap, top: 0 }
    ])
    .png()
    .toFile(resolve(out, 'compare-spacing.png'))
  console.log('✓ compare-spacing.png (ours | Alternativ)')
} catch (e) {
  console.log('! compare-spacing skipped:', e.message)
}

console.log('\nAll hero-final artefacts →', out)
