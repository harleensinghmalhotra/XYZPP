// R7 conveyor verification harness. Drives the homepage process scrub via the
// exposed Lenis instance (window.__lenis), deterministic frame-by-frame.
// Usage: CONV_URL=http://localhost:5194 MODE=smoke node scripts/_r7-conveyor.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.CONV_URL || 'http://localhost:5194'
const MODE = process.env.MODE || 'smoke'
const LANG = process.env.LANG_ || 'en'
const OUT = process.env.OUT || `shots/conveyor-r7/${MODE}-${LANG}`
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Map conveyor progress 0..1 → window scrollY over the pinned .conv-scroll section,
// then jump there via Lenis (immediate). Returns the actual progress the scene saw.
async function scrubTo(page, p) {
  await page.evaluate(async (p) => {
    const sec = document.querySelector('.conv-scroll')
    if (!sec) return
    const top = sec.getBoundingClientRect().top + window.scrollY
    const y = top + p * (sec.offsetHeight - window.innerHeight)
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true })
    else window.scrollTo(0, y)
  }, p)
  await sleep(60)
}

async function setLang(page, lang) {
  if (lang === 'en') return
  const label = lang.toUpperCase()
  try { await page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 2000 }) }
  catch { try { await page.getByText(label, { exact: true }).last().click({ timeout: 2000 }) } catch {} }
  await sleep(600)
}

async function measureFps(page, durMs) {
  return page.evaluate((dur) => new Promise((resolve) => {
    let frames = 0, stop = false
    const count = () => { frames++; if (!stop) requestAnimationFrame(count) }
    requestAnimationFrame(count)
    const sec = document.querySelector('.conv-scroll')
    if (!sec) { resolve(0); return }
    const top = sec.getBoundingClientRect().top + window.scrollY
    const range = sec.offsetHeight - window.innerHeight
    const t0 = performance.now()
    const step = () => {
      const el = performance.now() - t0
      const p = 0.6 + 0.4 * Math.sin(el / 500) // sweep around the ending
      if (window.__lenis) window.__lenis.scrollTo(top + p * range, { immediate: true, force: true })
      if (el < dur) requestAnimationFrame(step); else { stop = true; resolve(Math.round(frames / (el / 1000))) }
    }
    requestAnimationFrame(step)
  }), durMs)
}

const FRAMES = {
  smoke: [0, 0.15, 0.35, 0.55, 0.72, 0.79, 0.83, 0.87, 0.90, 0.94, 0.97, 1.0],
  forward: Array.from({ length: 30 }, (_, i) => +(i / 29).toFixed(4)),
  reverse: Array.from({ length: 20 }, (_, i) => +(1 - i / 19).toFixed(4)),
  crossfade: Array.from({ length: 13 }, (_, i) => +(0.80 + (i / 12) * 0.10).toFixed(4)), // GLB→pick
  crossrev: Array.from({ length: 13 }, (_, i) => +(0.90 - (i / 12) * 0.10).toFixed(4)), // reverse
  standing: [0.68, 0.72, 0.755, 0.78, 0.805, 0.825], // GLB standing beat as the box approaches
  leap: [0.820, 0.835, 0.845, 0.852, 0.858, 0.865, 0.875, 0.885, 0.900, 0.915, 0.930, 0.945, 0.965, 1.0],
  leaprev: [1.0, 0.965, 0.945, 0.930, 0.915, 0.900, 0.885, 0.875, 0.865, 0.858, 0.852, 0.845, 0.835, 0.820],
  ending: [0.80, 0.82, 0.83, 0.84, 0.855, 0.87, 0.885, 0.90, 0.915, 0.93, 0.945, 0.96, 0.98, 1.0],
  paper: Array.from({ length: 12 }, (_, i) => +(0.10 + (i / 11) * 0.14).toFixed(4)), // activeF ~0.65..1.55
}

async function run() {
  const errors = []
  const browser = await chromium.launch({ headless: false })

  if (MODE === 'reduced') {
    const rc = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
    const rp = await rc.newPage()
    rp.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    rp.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    await rp.goto(BASE + '/', { waitUntil: 'networkidle' }); await sleep(1800)
    await setLang(rp, LANG)
    await rp.evaluate(() => document.querySelector('#process')?.scrollIntoView())
    await sleep(1200)
    await rp.screenshot({ path: `${OUT}/reduced-motion.png` })
    await rc.close(); await browser.close()
    console.log('reduced-motion →', OUT, 'errors:', errors.length)
    errors.slice(0, 10).forEach((e) => console.log('  -', e))
    return
  }

  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await sleep(1800)
  await setLang(page, LANG)

  const frames = FRAMES[MODE] || FRAMES.smoke
  for (let i = 0; i < frames.length; i++) {
    const p = frames[i]
    await scrubTo(page, p)
    await sleep(420) // camera ease + morph settle
    await page.screenshot({ path: `${OUT}/f${String(i).padStart(2, '0')}-p${p.toFixed(3)}.png` })
  }

  let fps = null
  if (MODE === 'smoke' || MODE === 'forward') {
    await scrubTo(page, 0.9); await sleep(400)
    fps = await measureFps(page, 3000)
  }

  await ctx.close(); await browser.close()
  console.log(`MODE=${MODE} LANG=${LANG} frames=${frames.length} → ${OUT}`)
  if (fps != null) console.log('FPS (ending sweep):', fps)
  console.log('CONSOLE ERRORS:', errors.length)
  errors.slice(0, 20).forEach((e) => console.log('  -', e))
}
run().catch((e) => { console.error(e); process.exit(1) })
