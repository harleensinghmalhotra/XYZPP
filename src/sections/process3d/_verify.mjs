// Dev-only verification harness for the /dev/conveyor ROUND-2 scene. Not in the
// app bundle. Headed Playwright 1536×743 DPR 1.25 → shots/conveyor-r2/.
//   • 13 frames across the full scrub (every station + mid-transition)
//   • full-scrub fps report (before/after handled by two passes)
//   • reduced-motion beauty frame
//   • mobile poster candidate (→ poster-candidate.jpg for hand-off)
//   • console/page error capture
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.CONV_URL || 'http://localhost:5189'
const URL = `${BASE}/dev/conveyor`
const OUT = 'shots/conveyor-r2'
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// drei ScrollControls scroll container = tallest scrollable div in .conv-root.
async function scrubTo(page, frac) {
  await page.evaluate((f) => {
    const els = [...document.querySelectorAll('.conv-root *')]
    const sc = els.find((e) => e.scrollHeight - e.clientHeight > 40 && getComputedStyle(e).overflowY !== 'visible')
    if (sc) sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * f
  }, frac)
}

async function measureFps(page, durMs) {
  return page.evaluate(async (dur) => {
    const els = [...document.querySelectorAll('.conv-root *')]
    const sc = els.find((e) => e.scrollHeight - e.clientHeight > 40 && getComputedStyle(e).overflowY !== 'visible')
    let frames = 0, stop = false
    const count = () => { frames++; if (!stop) requestAnimationFrame(count) }
    requestAnimationFrame(count)
    const t0 = performance.now()
    while (performance.now() - t0 < dur) {
      const p = (performance.now() - t0) / dur
      if (sc) sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * p
      await new Promise((r) => setTimeout(r, 16))
    }
    stop = true
    return Math.round((frames / (performance.now() - t0)) * 1000)
  }, durMs)
}

async function run() {
  const errors = []
  const browser = await chromium.launch({ headless: false })

  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  await page.goto(URL, { waitUntil: 'networkidle' })
  await sleep(1600)

  // 16 frames — activeF steps of 0.333 land ON each station AND each mid-morph
  // (incl. the scan sweep at activeF≈1.0), for full transition coverage.
  const FR = 16
  for (let i = 0; i < FR; i++) {
    const f = i / (FR - 1)
    await scrubTo(page, f)
    await sleep(750) // camera ease + morph settle
    await page.screenshot({ path: `${OUT}/frame-${String(i).padStart(2, '0')}-${f.toFixed(3)}.png` })
  }

  // fps: settle first (idle), then full-scrub pass
  await scrubTo(page, 0)
  await sleep(600)
  const fpsScrub = await measureFps(page, 3500)
  const fpsIdle = await measureFps(page, 1500)
  await ctx.close()

  // reduced-motion beauty frame
  const rmCtx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  const rmPage = await rmCtx.newPage()
  rmPage.on('console', (m) => { if (m.type() === 'error') errors.push(`[rm] ${m.text()}`) })
  rmPage.on('pageerror', (e) => errors.push(`[rm] pageerror: ${e.message}`))
  await rmPage.goto(URL, { waitUntil: 'networkidle' })
  await sleep(1600)
  await rmPage.screenshot({ path: `${OUT}/reduced-motion.png` })
  await rmCtx.close()

  // poster candidate — capture the covered beauty shot at desktop, tight crop of
  // the canvas, saved as jpg for a hand-off into poster.jpg.
  const pCtx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.5 })
  const pPage = await pCtx.newPage()
  await pPage.goto(URL, { waitUntil: 'networkidle' })
  await sleep(1500)
  await scrubTo(pPage, 1)
  await sleep(1200)
  // hide the scroll hint + clip to the canvas → a clean poster
  await pPage.evaluate(() => { const h = document.querySelector('.conv-hint'); if (h) h.style.display = 'none' })
  await sleep(120)
  await pPage.locator('.conv-root canvas').screenshot({ path: `${OUT}/poster-candidate.jpg`, type: 'jpeg', quality: 92 })
  await pCtx.close()

  // mobile poster fallback (renders <img>, verifies the poster path)
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 })
  const mPage = await mCtx.newPage()
  mPage.on('console', (m) => { if (m.type() === 'error') errors.push(`[mobile] ${m.text()}`) })
  await mPage.goto(URL, { waitUntil: 'networkidle' })
  await sleep(900)
  await mPage.screenshot({ path: `${OUT}/mobile-poster.png` })
  await mCtx.close()

  await browser.close()

  console.log('FPS full-scrub:', fpsScrub)
  console.log('FPS idle:', fpsIdle)
  console.log('CONSOLE ERRORS:', errors.length)
  errors.forEach((e) => console.log('  -', e))
}

run().catch((e) => { console.error(e); process.exit(1) })
