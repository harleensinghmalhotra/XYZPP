import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(500)

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const cardsY = await page.evaluate(() => document.querySelector('.infra-cards').getBoundingClientRect().top + window.scrollY)
// bring the section header into view first so the entrance timeline fires
await to(Math.round(cardsY - 620))
await page.waitForTimeout(2400)
// centre the card row
await to(Math.round(cardsY - 140))
await page.waitForTimeout(1600)

// ── ASSERT equal heights + equal title top-Y ──────────────────────────────────
const m = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.infra-card')]
  return cards.map((c) => {
    const cr = c.getBoundingClientRect()
    const t = c.querySelector('.infra-card-title').getBoundingClientRect()
    const cap = c.querySelector('.infra-card-cap').getBoundingClientRect()
    const ph = c.querySelector('.infra-card-photo').getBoundingClientRect()
    const title = c.querySelector('.infra-card-title')
    return {
      title: title.textContent.slice(0, 22),
      cardTop: +cr.top.toFixed(2),
      cardH: +cr.height.toFixed(2),
      photoH: +ph.height.toFixed(2),
      titleTop: +t.top.toFixed(2),
      capBottom: +cap.bottom.toFixed(2),
      overhangTop: +(cr.top - ph.top).toFixed(2), // photo lifted above card top (want > 0)
      overhangSide: +(cr.left - ph.left).toFixed(2), // photo wider than card at left (want > 0)
    }
  })
})
console.log('\nCARD METRICS @1536:')
m.forEach((c) => console.log(`   cardTop=${c.cardTop.toString().padStart(7)}  H=${c.cardH.toString().padStart(7)}  photoH=${c.photoH.toString().padStart(7)}  titleTop=${c.titleTop.toString().padStart(7)}  capBottom=${c.capBottom.toString().padStart(7)}  "${c.title}"`))
const spread = (arr) => +(Math.max(...arr) - Math.min(...arr)).toFixed(2)
const hSpread = spread(m.map((c) => c.cardH))
const tSpread = spread(m.map((c) => c.titleTop))
const cSpread = spread(m.map((c) => c.capBottom))
console.log(`   height spread   = ${hSpread}px → ${hSpread < 0.75 ? 'EQUAL ✓' : 'UNEQUAL ✗'}`)
console.log(`   titleTop spread = ${tSpread}px → ${tSpread < 0.75 ? 'EQUAL ✓' : 'MISALIGNED ✗'}`)
console.log(`   capBottom spread= ${cSpread}px → ${cSpread < 0.75 ? 'EQUAL ✓' : 'MISALIGNED ✗'}`)
const oTop = m[0].overhangTop, oSide = m[0].overhangSide
console.log(`   photo overhang: top=${oTop}px, side=${oSide}px → ${oTop > 0 && oSide > 0 ? 'BREAKS OUT ✓' : 'NO OVERLAP ✗'}`)

// ── SHOTS: rest + hover ───────────────────────────────────────────────────────
const clipOf = async (sel, pad = 30) => {
  const b = await (await page.$(sel)).boundingBox()
  return { x: Math.max(0, Math.round(b.x - pad)), y: Math.max(0, Math.round(b.y - pad)), width: Math.min(1536, Math.round(b.width + pad * 2)), height: Math.round(b.height + pad * 2) }
}
await page.screenshot({ path: resolve(out, 'infra-v2.png'), clip: await clipOf('.infra-cards') })
console.log('\n  ✓ infra-v2.png')

const card2 = await page.$$('.infra-card')
const cb = await card2[1].boundingBox()
await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2)
await page.waitForTimeout(650)
await page.screenshot({ path: resolve(out, 'infra-v2-hover.png'), clip: await clipOf('.infra-cards') })
console.log('  ✓ infra-v2-hover.png')
await page.mouse.move(10, 10)
await page.waitForTimeout(300)

// ── FPS scrub + CLS ───────────────────────────────────────────────────────────
await to(Math.round(cardsY - 743))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2000
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: cardsY + 500 })
console.log('\nFPS:', JSON.stringify(fps), 'CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe / contrast ────────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#infrastructure').analyze()
console.log('axe #infrastructure violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}`); for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' ')) }
const ccV = axe.violations.find((v) => v.id === 'color-contrast')
console.log(`color-contrast: violations=${ccV ? ccV.nodes.length : 0} → ${ccV ? 'FAIL ✗' : 'PASS ✓'}`)

await browser.close()
console.log('\nDONE.')
