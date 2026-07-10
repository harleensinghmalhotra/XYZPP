// Phase 3.5 verification — photoreal 3D Earth in the Projects section.
// Headed Playwright @1536×743 → shots/phase35/. Captures: landed frame, rotation
// frames, drag interaction, fps, reduced-motion, mobile fallback, console errors.
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.URL || 'http://localhost:5190'
const OUT = 'shots/phase35'
fs.mkdirSync(OUT, { recursive: true })

const VP = { width: 1536, height: 743 }
const log = (...a) => console.log(...a)

async function gotoProjects(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  // scroll the #projects section into view to trigger the lazy globe mount
  await page.evaluate(() => document.querySelector('#projects')?.scrollIntoView({ block: 'center' }))
}

async function waitForGlobe(page, ms = 12000) {
  try {
    await page.waitForSelector('.proj-globe canvas', { timeout: ms })
    // wait until data-phase flips to ready (controls configured)
    await page.waitForFunction(() => document.querySelector('.proj-globe')?.dataset.phase === 'ready', { timeout: ms })
    return true
  } catch {
    return false
  }
}

async function run() {
  const browser = await chromium.launch({ headless: false })
  const results = {}

  // ── Main pass: normal motion ───────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
    const page = await ctx.newPage()
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

    await gotoProjects(page)
    const ok = await waitForGlobe(page)
    log('globe ready:', ok)
    await page.waitForTimeout(1500) // let texture load + settle
    await page.locator('#projects').screenshot({ path: `${OUT}/01-landed.png` })

    // rotation frames — 3 shots ~900ms apart; auto-rotate should visibly turn
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(900)
      await page.locator('.proj-globe').screenshot({ path: `${OUT}/02-rotate-${i}.png` })
    }

    // drag interaction — drag across the globe, capture the moved view
    const box = await page.locator('.proj-globe canvas').boundingBox()
    if (box) {
      const cx = box.x + box.width / 2
      const cy = box.y + box.height / 2
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(cx - i * 12, cy - i * 3)
        await page.waitForTimeout(16)
      }
      await page.mouse.up()
      await page.waitForTimeout(400)
      await page.locator('.proj-globe').screenshot({ path: `${OUT}/03-drag.png` })
    }

    // scroll-not-hijacked check: wheel over the globe should scroll the page
    const yBefore = await page.evaluate(() => window.scrollY)
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(300)
    const yAfter = await page.evaluate(() => window.scrollY)
    results.scrollNotHijacked = yAfter > yBefore + 100

    // fps over 3s while the globe auto-rotates
    results.fps = await page.evaluate(
      () =>
        new Promise((res) => {
          const start = performance.now()
          let last = start
          const d = []
          function frame(now) {
            d.push(now - last)
            last = now
            if (now - start < 3000) requestAnimationFrame(frame)
            else {
              const s = d.slice(2).sort((a, b) => a - b)
              res({
                frames: s.length,
                medianFps: +(1000 / s[Math.floor(s.length / 2)]).toFixed(1),
                p95FrameMs: +s[Math.floor(s.length * 0.95)].toFixed(1),
              })
            }
          }
          requestAnimationFrame(frame)
        }),
    )

    results.consoleErrors = errors
    await ctx.close()
  }

  // ── Reduced motion: static rendered Earth ───────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await gotoProjects(page)
    await waitForGlobe(page)
    await page.waitForTimeout(1600)
    const a = await page.locator('.proj-globe').screenshot({ path: `${OUT}/04-reduced-a.png` })
    await page.waitForTimeout(1600)
    await page.locator('.proj-globe').screenshot({ path: `${OUT}/04-reduced-b.png` })
    // static test: the two frames should be (near) identical — no auto-rotate
    results.reducedShots = ['04-reduced-a.png', '04-reduced-b.png']
    await ctx.close()
  }

  // ── Mobile ──────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await gotoProjects(page)
    await page.waitForTimeout(2500)
    await page.locator('#projects').screenshot({ path: `${OUT}/05-mobile.png` })
    await ctx.close()
  }

  await browser.close()
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2))
  log(JSON.stringify(results, null, 2))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
