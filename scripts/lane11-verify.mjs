import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

// Lane 11 — conveyor props. Usage: node scripts/lane11-verify.mjs <port>
// Scrubs the homepage conveyor (ScrollTrigger on .conv-scroll) by scrolling the
// window to a target progress p, screenshots the Print (paper) + Quality (books)
// stations, walks the early scrub for collisions, reads draw-call/triangle counts.
const PORT = process.argv[2] || '5210'
const OUT = 'shots/lane11'
fs.mkdirSync(OUT, { recursive: true })

// progress p → activeF = p/0.77*5 ; station i at p = i*0.77/5
const pForStation = (i) => (i * 0.77) / 5

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

async function scrubTo(page, p) {
  await page.evaluate((prog) => {
    const el = document.querySelector('.conv-scroll')
    const top = el.getBoundingClientRect().top + window.scrollY
    const y = top + prog * (el.offsetHeight - window.innerHeight)
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true })
    else window.scrollTo(0, y)
  }, p)
  await page.waitForTimeout(300)
  // settle: Lenis + ScrollTrigger scrub + camera ease + morph
  await page.waitForTimeout(1100)
}

async function drawInfo(page) {
  return page.evaluate(() => {
    const c = document.querySelector('.conv-stage canvas') || document.querySelector('.conv-root canvas')
    try {
      const gl = c.__r3f.store.getState().gl
      return { calls: gl.info.render.calls, tris: gl.info.render.triangles }
    } catch { return null }
  })
}

for (const lng of ['en', 'fr']) {
  console.log(`\n=== ${lng.toUpperCase()} ===`)
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

  await page.addInitScript((l) => {
    try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {}
  }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  await page.waitForSelector('.conv-scroll', { timeout: 30000 })

  if (lng === 'en') {
    // Establishing (paper entering), Print/paper, and the early morph
    await scrubTo(page, 0.01)
    await page.screenshot({ path: `${OUT}/establishing-en.png` })
    ok('shot establishing-en.png')

    await scrubTo(page, pForStation(0) + 0.008) // Print — the white press-sheet stack
    const di0 = await drawInfo(page)
    await page.screenshot({ path: `${OUT}/station1-paper-en.png` })
    ok(`shot station1-paper-en.png  draws=${di0?.calls} tris=${di0?.tris}`)

    await scrubTo(page, pForStation(1)) // Quality — three textbooks
    const di1 = await drawInfo(page)
    await page.screenshot({ path: `${OUT}/station2-books-en.png` })
    ok(`shot station2-books-en.png  draws=${di1?.calls} tris=${di1?.tris}`)

    // Walk the full early scrub (print→quality→wrap) for collisions with arch legs /
    // plaque posts / belt edge — a frame every ~0.02 progress through the risky band.
    const walk = [0.0, 0.03, 0.06, 0.09, 0.12, 0.155, 0.19, 0.23, 0.28]
    for (let i = 0; i < walk.length; i++) {
      await scrubTo(page, walk[i])
      await page.screenshot({ path: `${OUT}/walk-${String(i).padStart(2, '0')}-p${walk[i].toFixed(3)}.png` })
    }
    ok(`walked ${walk.length} collision frames → walk-*.png`)
  } else {
    // FR — just confirm it loads + scrubs to the books with no console error
    await scrubTo(page, pForStation(1))
    await page.screenshot({ path: `${OUT}/station2-books-fr.png` })
    ok('shot station2-books-fr.png')
  }

  if (!consoleErrors.length) ok('zero console errors')
  else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 8).forEach((e) => console.log('      · ' + e)) }

  // axe on the process section (props are aria-hidden canvas; the doc layer is the a11y surface)
  const axe = await new AxeBuilder({ page }).include('#process').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe (#process): zero violations')
  else { fail(`axe: ${axe.violations.length} violations`); for (const v of axe.violations) console.log(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`) }

  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
