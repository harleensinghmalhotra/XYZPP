// Dev-only verification harness for the /dev/conveyor scaffold. Not part of the
// app bundle. Headed Playwright, 1536×743 DPR 1.25 → shots/conveyor-scaffold/.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.CONV_URL || 'http://localhost:5189'
const URL = `${BASE}/dev/conveyor`
const OUT = 'shots/conveyor-scaffold'
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// find the drei ScrollControls scroll container (tallest scrollable div) and set
// its scroll to a 0..1 fraction, then let the scene ease/settle.
async function scrubTo(page, frac) {
  await page.evaluate((f) => {
    const els = [...document.querySelectorAll('.conv-root *')]
    const sc = els.find((e) => e.scrollHeight - e.clientHeight > 40 && getComputedStyle(e).overflowY !== 'visible')
    if (sc) sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * f
  }, frac)
}

async function run() {
  const errors = []
  const browser = await chromium.launch({ headless: false })

  // ── main scene: 6 station frames + fps ──────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  await page.goto(URL, { waitUntil: 'networkidle' })
  await sleep(1500)

  const N = 6
  for (let i = 0; i < N; i++) {
    const f = N === 1 ? 0 : i / (N - 1)
    await scrubTo(page, f)
    await sleep(900) // let camera ease + book state swap settle
    await page.screenshot({ path: `${OUT}/station-${i + 1}.png` })
  }

  // fps through a full scrub back to start
  const fps = await page.evaluate(async () => {
    const els = [...document.querySelectorAll('.conv-root *')]
    const sc = els.find((e) => e.scrollHeight - e.clientHeight > 40 && getComputedStyle(e).overflowY !== 'visible')
    let frames = 0
    let stop = false
    const count = () => { frames++; if (!stop) requestAnimationFrame(count) }
    requestAnimationFrame(count)
    const t0 = performance.now()
    const dur = 3000
    while (performance.now() - t0 < dur) {
      const p = (performance.now() - t0) / dur
      if (sc) sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * p
      await new Promise((r) => setTimeout(r, 16))
    }
    stop = true
    return Math.round((frames / (performance.now() - t0)) * 1000)
  })
  await ctx.close()

  // ── reduced-motion composed shot ────────────────────────────────────────
  const rmCtx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  const rmPage = await rmCtx.newPage()
  rmPage.on('console', (m) => { if (m.type() === 'error') errors.push(`[rm] ${m.text()}`) })
  rmPage.on('pageerror', (e) => errors.push(`[rm] pageerror: ${e.message}`))
  await rmPage.goto(URL, { waitUntil: 'networkidle' })
  await sleep(1600)
  await rmPage.screenshot({ path: `${OUT}/reduced-motion.png` })
  await rmCtx.close()

  // ── mobile poster fallback ──────────────────────────────────────────────
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 })
  const mPage = await mCtx.newPage()
  mPage.on('console', (m) => { if (m.type() === 'error') errors.push(`[mobile] ${m.text()}`) })
  await mPage.goto(URL, { waitUntil: 'networkidle' })
  await sleep(900)
  await mPage.screenshot({ path: `${OUT}/poster-fallback.png` })
  await mCtx.close()

  await browser.close()

  console.log('FPS:', fps)
  console.log('CONSOLE ERRORS:', errors.length)
  errors.forEach((e) => console.log('  -', e))
}

run().catch((e) => { console.error(e); process.exit(1) })
