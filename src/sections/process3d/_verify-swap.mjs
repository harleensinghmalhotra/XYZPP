// Dev-only verification for the homepage conveyor SWAP-IN. Headed Playwright
// 1536×743 → shots/conveyor-swap/. Confirms the conveyor now lives at #process on
// the homepage, coexists with Lenis + the hero pin, survives EN/FR + reduced +
// mobile, and that /infrastructure's "See our process" link lands on it.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.CONV_URL || 'http://localhost:5189'
const OUT = 'shots/conveyor-swap'
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Drive the page scroll through Lenis (falls back to native) so ScrollTrigger —
// and thus the conveyor progress ref — updates exactly as a real user scroll.
async function scrollToY(page, y) {
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)
}

async function convRange(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#process .conv-scroll')
    if (!el) return null
    const r = el.getBoundingClientRect()
    const absTop = r.top + window.scrollY
    return { start: absTop, end: absTop + el.offsetHeight - window.innerHeight }
  })
}

function attachErrors(page, tag, errors) {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`${tag} pageerror: ${e.message}`))
}

async function run() {
  const errors = []
  const browser = await chromium.launch({ headless: false })
  const viewport = { width: 1536, height: 743 }

  // ── EN: full scroll-through + 4 conveyor frames + full-page fps ──────────────
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1.25 })
  await ctx.addInitScript(() => localStorage.setItem('qfp.lang', 'en'))
  const page = await ctx.newPage()
  attachErrors(page, '[en]', errors)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1400)

  // heading present + in the right namespace
  const enHead = await page.evaluate(() => {
    const h = document.querySelector('#process .u-h2')
    return h ? h.textContent.trim() : null
  })

  // full-page scroll-through: capture a few page frames, watch for errors/jank
  const pageH = await page.evaluate(() => document.body.scrollHeight)
  const marks = [0, 0.18, 0.36, 0.54, 0.72, 0.9]
  for (let i = 0; i < marks.length; i++) {
    await scrollToY(page, marks[i] * (pageH - viewport.height))
    await sleep(500)
    await page.screenshot({ path: `${OUT}/en-page-${i}-${marks[i].toFixed(2)}.png` })
  }

  // conveyor scrub: 4 frames evenly through the pinned #process range
  const range = await convRange(page)
  const convFracs = [0.06, 0.37, 0.63, 0.94]
  for (let i = 0; i < convFracs.length; i++) {
    const y = range.start + (range.end - range.start) * convFracs[i]
    await scrollToY(page, y)
    await sleep(650)
    await page.screenshot({ path: `${OUT}/en-conveyor-${i + 1}-${convFracs[i].toFixed(2)}.png` })
  }

  // full-page fps: scroll top→bottom over ~4s counting rAF (catches any jank)
  const fps = await page.evaluate(async () => {
    const H = document.body.scrollHeight - window.innerHeight
    let frames = 0, stop = false
    const count = () => { frames++; if (!stop) requestAnimationFrame(count) }
    requestAnimationFrame(count)
    const t0 = performance.now(), dur = 4000
    while (performance.now() - t0 < dur) {
      const p = (performance.now() - t0) / dur
      const y = H * p
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
      else window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 16))
    }
    stop = true
    return Math.round((frames / (performance.now() - t0)) * 1000)
  })
  await ctx.close()

  // ── FR: header localises + conveyor renders ─────────────────────────────────
  const frCtx = await browser.newContext({ viewport, deviceScaleFactor: 1.25 })
  await frCtx.addInitScript(() => localStorage.setItem('qfp.lang', 'fr'))
  const frPage = await frCtx.newPage()
  attachErrors(frPage, '[fr]', errors)
  await frPage.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1400)
  const frHead = await frPage.evaluate(() => {
    const h = document.querySelector('#process .u-h2')
    return h ? h.textContent.trim() : null
  })
  const frRange = await convRange(frPage)
  await scrollToY(frPage, frRange.start) // header/first station
  await sleep(600)
  await frPage.screenshot({ path: `${OUT}/fr-conveyor-start.png` })
  await scrollToY(frPage, frRange.start + (frRange.end - frRange.start) * 0.6)
  await sleep(650)
  await frPage.screenshot({ path: `${OUT}/fr-conveyor-mid.png` })
  await frCtx.close()

  // ── Anchor nav: /infrastructure "See our process" → /#process lands on it ────
  const aCtx = await browser.newContext({ viewport, deviceScaleFactor: 1.25 })
  await aCtx.addInitScript(() => localStorage.setItem('qfp.lang', 'en'))
  const aPage = await aCtx.newPage()
  attachErrors(aPage, '[anchor]', errors)
  await aPage.goto(`${BASE}/infrastructure`, { waitUntil: 'networkidle' })
  await sleep(900)
  await aPage.click('a[href="/#process"]')
  await sleep(1600) // route change + scroll settle
  const anchor = await aPage.evaluate(() => {
    const el = document.getElementById('process')
    if (!el) return { found: false }
    const r = el.getBoundingClientRect()
    return { found: true, hash: location.hash, path: location.pathname, top: Math.round(r.top), inView: r.top < window.innerHeight && r.bottom > 0 }
  })
  await aPage.screenshot({ path: `${OUT}/anchor-landing.png` })
  await aCtx.close()

  // ── Reduced-motion: static beauty shot at #process ──────────────────────────
  const rmCtx = await browser.newContext({ viewport, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  await rmCtx.addInitScript(() => localStorage.setItem('qfp.lang', 'en'))
  const rmPage = await rmCtx.newPage()
  attachErrors(rmPage, '[rm]', errors)
  await rmPage.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1200)
  await rmPage.evaluate(() => { const el = document.getElementById('process'); el && el.scrollIntoView() })
  await sleep(1200)
  await rmPage.screenshot({ path: `${OUT}/reduced-motion.png` })
  await rmCtx.close()

  // ── Mobile: poster fallback ─────────────────────────────────────────────────
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 })
  await mCtx.addInitScript(() => localStorage.setItem('qfp.lang', 'en'))
  const mPage = await mCtx.newPage()
  attachErrors(mPage, '[mobile]', errors)
  await mPage.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1000)
  await mPage.evaluate(() => { const el = document.getElementById('process'); el && el.scrollIntoView() })
  await sleep(700)
  await mPage.screenshot({ path: `${OUT}/mobile.png` })
  await mCtx.close()

  await browser.close()

  console.log('EN heading  :', JSON.stringify(enHead))
  console.log('FR heading  :', JSON.stringify(frHead))
  console.log('Anchor test :', JSON.stringify(anchor))
  console.log('Full-page FPS:', fps)
  console.log('CONSOLE ERRORS:', errors.length)
  errors.forEach((e) => console.log('  -', e))
}

run().catch((e) => { console.error(e); process.exit(1) })
