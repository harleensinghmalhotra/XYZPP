// HERO AURORA verification — headed 1536×743 DPR 1.25 → shots/hero-aurora/
//   • landed-state frame
//   • 3 frames across the pin scrub
//   • two frames 30s apart → drift proof (pixel-diff of the aurora region)
//   • fps on the pin WITH vs WITHOUT the aurora (must be unchanged)
//   • headline contrast vs the aurora's BRIGHTEST state (WCAG AA)
//   • reduced-motion frame (static gradient, no drift)
//   • junction close-up (hero↔TrustStrips boundary — no bleed)
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'hero-aurora')
mkdirSync(out, { recursive: true })
const url = process.env.AURORA_URL || 'http://localhost:5179'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

// Anti-throttle flags: a headed window that loses OS focus otherwise throttles
// requestAnimationFrame to ~1fps, which would wreck the fps measurement. These
// keep the renderer running at full rate even when unfocused.
const browser = await chromium.launch({
  headless: false,
  args: [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ],
})

const scrollTo = (page, y) =>
  page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)

// relative luminance + WCAG contrast helpers
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const contrast = (a, b) => { const l1 = Math.max(a, b), l2 = Math.min(a, b); return (l1 + 0.05) / (l2 + 0.05) }

async function main() {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR })
  const page = await ctx.newPage()
  await page.bringToFront()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('#hero', { timeout: 20000 })
  await page.waitForTimeout(3500)

  const maxY = await page.evaluate(() => document.querySelector('#hero').offsetHeight - window.innerHeight)

  // ── 1. landed state ──
  await scrollTo(page, 0)
  await page.waitForTimeout(900)
  await page.screenshot({ path: resolve(out, '01-landed.png') })

  // ── 2. three frames across the pin scrub ──
  const stops = [0.25, 0.5, 0.8]
  for (let i = 0; i < stops.length; i++) {
    await scrollTo(page, Math.round(stops[i] * maxY))
    await page.waitForTimeout(700)
    await page.screenshot({ path: resolve(out, `02-scrub-${Math.round(stops[i] * 100)}.png`) })
  }

  // ── 3. drift proof: two frames 30s apart at the landed state, diff aurora band ──
  await scrollTo(page, 0)
  await page.waitForTimeout(600)
  const clipTop = { x: 0, y: 0, width: VP.width, height: 360 } // upper hero, where the wash lives
  const a = await page.screenshot({ clip: clipTop, path: resolve(out, '03-drift-t0.png') })
  await page.waitForTimeout(30000)
  const b = await page.screenshot({ clip: clipTop, path: resolve(out, '03-drift-t30.png') })
  const ga = await sharp(a).greyscale().resize(96, 24).raw().toBuffer()
  const gb = await sharp(b).greyscale().resize(96, 24).raw().toBuffer()
  let drift = 0
  for (let k = 0; k < ga.length; k++) drift += Math.abs(ga[k] - gb[k])
  drift = +(drift / ga.length).toFixed(2)
  console.log(`DRIFT (30s apart, mean grey delta): ${drift}  → ${drift > 1 ? 'MOVING ✓' : 'STATIC ✗'}`)

  // ── 4. fps on the pin, WITH vs WITHOUT aurora ──
  const measureFps = async () => {
    return page.evaluate(() => new Promise((res) => {
      let n = 0
      const t0 = performance.now()
      const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round((n / (performance.now() - t0)) * 1000)) }
      requestAnimationFrame(tick)
    }))
  }
  await scrollTo(page, 0)
  await page.waitForTimeout(500)
  const fpsWith = await measureFps()
  await page.evaluate(() => { document.querySelector('.hero-aurora').style.display = 'none' })
  await page.waitForTimeout(300)
  const fpsWithout = await measureFps()
  await page.evaluate(() => { document.querySelector('.hero-aurora').style.display = '' })
  console.log(`FPS on pin — with aurora: ${fpsWith}   without: ${fpsWithout}   Δ=${fpsWith - fpsWithout}`)

  // ── 5. headline contrast vs the aurora's BRIGHTEST state ──
  // Deterministically sweep the ::after background-position across its full
  // keyframe range, hide the headline glyphs, sample the MAX background
  // luminance in the headline box, then compute worst-case contrast for the
  // gold (#C89A3C) and cream (#FDFAF4) headline inks.
  const box = await page.evaluate(() => {
    const el = document.querySelector('#hero [class*="leading-"]') // the titleGhost line stack
    const r = (el || document.querySelector('#hero')).getBoundingClientRect()
    return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: r.width, height: r.height }
  })
  // hide glyphs so we only sample the background the headline sits on
  await page.addStyleTag({ content: '#hero [class*="leading-"]{visibility:hidden !important}' })
  let maxL = 0, maxRGB = [0, 0, 0]
  // 2D sweep: step ::before across its 480px period × ::after across its 420px
  // period, so we catch the brightest overlap of the two sheets, not just a
  // co-phased slice.
  const NB = 12, NA = 4
  for (let i = 0; i < NB; i++) {
    const xa = -(480 * i) / NB
    for (let j = 0; j < NA; j++) {
      const xb = -(420 * j) / NA
      await page.evaluate(({ xa, xb }) => {
        let s = document.getElementById('__aurora_probe')
        if (!s) { s = document.createElement('style'); s.id = '__aurora_probe'; document.head.appendChild(s) }
        s.textContent =
          `.hero-aurora__ribbons::before{animation:none !important;transform:rotate(-9deg) translateX(${xa}px) !important}` +
          `.hero-aurora__ribbons::after{animation:none !important;transform:rotate(6deg) translateX(${xb}px) !important}`
      }, { xa, xb })
      await page.waitForTimeout(60)
      const buf = await page.screenshot({ clip: box })
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
      const ch = info.channels
      for (let k = 0; k < data.length; k += ch) {
        const L = lum(data[k], data[k + 1], data[k + 2])
        if (L > maxL) { maxL = L; maxRGB = [data[k], data[k + 1], data[k + 2]] }
      }
    }
  }
  await page.evaluate(() => { const s = document.getElementById('__aurora_probe'); if (s) s.remove() })
  const goldL = lum(0xC8, 0x9A, 0x3C)
  const creamL = lum(0xFD, 0xFA, 0xF4)
  const cGold = contrast(goldL, maxL).toFixed(2)
  const cCream = contrast(creamL, maxL).toFixed(2)
  console.log(`BRIGHTEST headline-zone bg: rgb(${maxRGB.join(',')})  L=${maxL.toFixed(4)}`)
  console.log(`  Gold  #C89A3C contrast: ${cGold}:1  (AA large ≥3, normal ≥4.5)  → ${cGold >= 3 ? 'PASS' : 'FAIL'}`)
  console.log(`  Cream #FDFAF4 contrast: ${cCream}:1                             → ${cCream >= 4.5 ? 'PASS' : 'FAIL'}`)
  // restore glyphs (re-add page with a fresh nav for the remaining shots below)

  // ── 6. junction close-up: hero↔TrustStrips boundary (no bleed) ──
  await page.reload({ waitUntil: 'networkidle' })
  await page.bringToFront()
  await page.waitForSelector('#hero', { timeout: 20000 })
  await page.waitForTimeout(3000)
  const maxY2 = await page.evaluate(() => document.querySelector('#hero').offsetHeight - window.innerHeight)
  await scrollTo(page, maxY2 - 40) // pin released, TrustStrips rising into view
  await page.waitForTimeout(900)
  await page.screenshot({ path: resolve(out, '06-junction.png'), clip: { x: 0, y: VP.height - 300, width: VP.width, height: 300 } })
  await ctx.close()

  // ── 7. reduced-motion frame (static gradient) ──
  const rctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion: 'reduce' })
  const rpage = await rctx.newPage()
  await rpage.goto(url, { waitUntil: 'networkidle' })
  await rpage.waitForTimeout(1500)
  await rpage.screenshot({ path: resolve(out, '07-reduced-motion.png') })
  await rctx.close()

  console.log('\n✓ shots written to shots/hero-aurora/')
}

await main()
await browser.close()
