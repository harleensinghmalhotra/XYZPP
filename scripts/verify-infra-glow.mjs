// Verify — Infrastructure facility-card GLOW BORDER revamp.
// Shots → shots/infra-glow/. Checks: section EN+FR, both gradient variants
// (navy vs olive) side-by-side on cream, hover forced per card, clean de-sepia'd
// photos, WCAG contrast (axe), reduced-motion (glow static), console errors, fps, CLS.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots/infra-glow')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })

async function newPage(ctx) {
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
      .observe({ type: 'layout-shift', buffered: true })
  })
  return { page, errors }
}

const gotoCards = async (page) => {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(400)
  const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
  const cardsY = await page.evaluate(() => document.querySelector('.infra-cards').getBoundingClientRect().top + window.scrollY)
  await to(Math.round(cardsY - 620))
  await page.waitForTimeout(2200)
  await to(Math.round(cardsY - 120))
  await page.waitForTimeout(1400)
  return { to, cardsY }
}
const setGlow = (page, v) => page.evaluate((vv) => document.querySelector('.infra-cards').setAttribute('data-glow', vv), v)
const clipOf = async (page, sel, pad = 44) => {
  const b = await (await page.$(sel)).boundingBox()
  return { x: Math.max(0, Math.round(b.x - pad)), y: Math.max(0, Math.round(b.y - pad)), width: Math.min(1536, Math.round(b.width + pad * 2)), height: Math.round(b.height + pad * 2) }
}

// ── EN — both variants + per-card hover ───────────────────────────────────────
const en = await newPage(await browser.newContext(VP))
await gotoCards(en.page)

await setGlow(en.page, 'navy')
await en.page.waitForTimeout(500)
await en.page.screenshot({ path: resolve(out, '01-en-navy-rest.png'), clip: await clipOf(en.page, '.infra-cards') })

await setGlow(en.page, 'olive')
await en.page.waitForTimeout(500)
await en.page.screenshot({ path: resolve(out, '02-en-olive-rest.png'), clip: await clipOf(en.page, '.infra-cards') })

// hover each card (navy variant)
await setGlow(en.page, 'navy')
const cards = await en.page.$$('.infra-card')
for (let i = 0; i < cards.length; i++) {
  const b = await cards[i].boundingBox()
  await en.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await en.page.waitForTimeout(680)
  await en.page.screenshot({ path: resolve(out, `03-en-navy-hover-card${i + 1}.png`), clip: await clipOf(en.page, '.infra-cards') })
}
// hover card 2 on olive too for the A/B
await setGlow(en.page, 'olive')
{ const b = await (await en.page.$$('.infra-card'))[1].boundingBox()
  await en.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await en.page.waitForTimeout(680)
  await en.page.screenshot({ path: resolve(out, '04-en-olive-hover-card2.png'), clip: await clipOf(en.page, '.infra-cards') }) }
await en.page.mouse.move(8, 8)
await en.page.waitForTimeout(300)

// clean-photo close-up: single card, no hover — both variants for the A/B
await setGlow(en.page, 'navy')
await en.page.waitForTimeout(400)
await en.page.screenshot({ path: resolve(out, '05-en-navy-card-closeup.png'), clip: await clipOf(en.page, '.infra-card', 26) })
await setGlow(en.page, 'olive')
await en.page.waitForTimeout(400)
await en.page.screenshot({ path: resolve(out, '05b-en-olive-card-closeup.png'), clip: await clipOf(en.page, '.infra-card', 26) })
await setGlow(en.page, 'navy')

// ── contrast + a11y (axe) ─────────────────────────────────────────────────────
let ccFail = 'n/a', axeCount = 'n/a'
try {
  const a = await new AxeBuilder({ page: en.page }).include('#infrastructure').analyze()
  axeCount = a.violations.length
  const cc = a.violations.find((v) => v.id === 'color-contrast')
  ccFail = cc ? `FAIL ✗ (${cc.nodes.length})` : 'PASS ✓'
  for (const v of a.violations) console.log(` axe [${v.impact}] ${v.id} ×${v.nodes.length}`)
} catch (e) { console.log('axe error', e.message) }

// ── fps scrub through the cards ───────────────────────────────────────────────
const to = (y) => en.page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const cardsY = await en.page.evaluate(() => document.querySelector('.infra-cards').getBoundingClientRect().top + window.scrollY)
await to(Math.round(cardsY - 743))
await en.page.waitForTimeout(250)
const fps = await en.page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2000
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: cardsY + 500 })
const cls = await en.page.evaluate(() => +window.__cls.toFixed(5))

// ── FR ────────────────────────────────────────────────────────────────────────
const fr = await newPage(await browser.newContext(VP))
await fr.page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'fr') } catch {} })
await gotoCards(fr.page)
await setGlow(fr.page, 'navy')
await fr.page.waitForTimeout(500)
await fr.page.screenshot({ path: resolve(out, '06-fr-navy-rest.png'), clip: await clipOf(fr.page, '.infra-cards') })

// ── reduced-motion (glow static) ──────────────────────────────────────────────
const rmCtx = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rm = await newPage(rmCtx)
await gotoCards(rm.page)
await setGlow(rm.page, 'navy')
await rm.page.waitForTimeout(500)
await rm.page.screenshot({ path: resolve(out, '07-reduced-motion.png'), clip: await clipOf(rm.page, '.infra-cards') })

// ── report ────────────────────────────────────────────────────────────────────
console.log('\n── INFRA GLOW VERIFY ─────────────────────────────')
console.log('axe #infrastructure violations:', axeCount, '| color-contrast:', ccFail)
console.log('FPS:', JSON.stringify(fps), '| CLS:', cls, cls < 0.01 ? '✓' : '✗ (layout shift!)')
console.log('console errors EN:', en.errors.length, en.errors.slice(0, 5))
console.log('console errors FR:', fr.errors.length, fr.errors.slice(0, 5))
console.log('console errors RM:', rm.errors.length, rm.errors.slice(0, 5))
console.log('shots →', out)

await browser.close()
console.log('DONE.')
