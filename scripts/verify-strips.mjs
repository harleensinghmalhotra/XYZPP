import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SHOTS = path.join(ROOT, 'shots')
const URL = 'http://localhost:5199/'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const run = async () => {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1536, height: 743 },
    deviceScaleFactor: 1.25,
  })
  const page = await context.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('#trust', { timeout: 15000 })
  await sleep(800) // fonts + WAAPI start

  const scrollTo = async (y) => {
    await page.evaluate((yy) => {
      if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
      else window.scrollTo(0, yy)
    }, y)
    await sleep(650) // let GSAP scrub (0.3) settle
  }

  const trustTop = await page.evaluate(() => {
    const el = document.getElementById('trust')
    const r = el.getBoundingClientRect()
    return Math.round(r.top + window.scrollY)
  })
  const bandBox = async () =>
    page.evaluate(() => {
      const el = document.getElementById('trust')
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    })

  // 1. JUNCTION — book landed rest state: strips top ~380px down the viewport
  await scrollTo(trustTop - 380)
  await sleep(400)
  await page.screenshot({ path: path.join(SHOTS, 'strips-junction.png') })
  console.log('JUNCTION trustTop=' + trustTop + ' -> shots/strips-junction.png')

  // Bring the whole band into view for strip captures
  await scrollTo(trustTop - 120)
  await sleep(1600) // marquees mid-motion
  let bb = await bandBox()
  await page.screenshot({
    path: path.join(SHOTS, 'strips-motion.png'),
    clip: { x: 0, y: Math.max(0, bb.y - 4), width: 1536, height: Math.min(743 - Math.max(0, bb.y), bb.height + 8) },
  })
  console.log('MOTION -> shots/strips-motion.png')

  // Per-strip mid-hover-pause (eased ramp settles in ~300ms)
  bb = await bandBox()
  const countriesY = bb.y + 24
  const instY = bb.y + 64
  await page.mouse.move(760, countriesY)
  await sleep(650)
  await page.screenshot({
    path: path.join(SHOTS, 'strips-hover-countries.png'),
    clip: { x: 0, y: Math.max(0, bb.y - 4), width: 1536, height: 120 },
  })
  console.log('HOVER countries -> shots/strips-hover-countries.png')

  await page.mouse.move(760, instY)
  await sleep(650)
  await page.screenshot({
    path: path.join(SHOTS, 'strips-hover-inst.png'),
    clip: { x: 0, y: Math.max(0, bb.y + 32), width: 1536, height: 120 },
  })
  console.log('HOVER inst -> shots/strips-hover-inst.png')
  await page.mouse.move(20, 20) // release hover

  // Stats bar close-up (count-up landed)
  await sleep(400)
  bb = await bandBox()
  await page.screenshot({
    path: path.join(SHOTS, 'strips-stats.png'),
    clip: { x: 0, y: bb.y + 92, width: 1536, height: Math.min(743 - (bb.y + 92), 150) },
  })

  // 2. FPS — sample rAF while the marquees run in view, idle
  const fpsIdle = await page.evaluate(
    () =>
      new Promise((res) => {
        let frames = 0, long = 0, last = performance.now()
        const t0 = last
        const tick = (now) => {
          const d = now - last
          last = now
          frames++
          if (d > 18) long++
          if (now - t0 < 2500) requestAnimationFrame(tick)
          else res({ fps: +(frames / ((now - t0) / 1000)).toFixed(1), longFrames: long, frames })
        }
        requestAnimationFrame(tick)
      }),
  )
  console.log('FPS idle-in-view:', JSON.stringify(fpsIdle))

  // FPS during a wheel-scroll sweep across the section (stress)
  const fpsScrollPromise = page.evaluate(
    () =>
      new Promise((res) => {
        let frames = 0, long = 0, last = performance.now()
        const t0 = last
        const tick = (now) => {
          const d = now - last
          last = now
          frames++
          if (d > 18) long++
          if (now - t0 < 2200) requestAnimationFrame(tick)
          else res({ fps: +(frames / ((now - t0) / 1000)).toFixed(1), longFrames: long, frames })
        }
        requestAnimationFrame(tick)
      }),
  )
  for (let i = 0; i < 22; i++) {
    await page.mouse.wheel(0, 60)
    await sleep(80)
  }
  const fpsScroll = await fpsScrollPromise
  console.log('FPS during-scroll:', JSON.stringify(fpsScroll))

  // 3. axe accessibility (whole page + scoped to #trust)
  await page.addScriptTag({ path: path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js') })
  const axeAll = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))
  })
  const axeTrust = await page.evaluate(async () => {
    const r = await window.axe.run('#trust', { resultTypes: ['violations'] })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))
  })
  console.log('AXE page violations:', JSON.stringify(axeAll))
  console.log('AXE #trust violations:', JSON.stringify(axeTrust))

  await browser.close()
  console.log('DONE')
}

run().catch((e) => {
  console.error('VERIFY ERROR', e)
  process.exit(1)
})
