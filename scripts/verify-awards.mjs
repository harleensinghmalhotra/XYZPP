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
const EXPORT = 'file:///D:/WEBSITES/Website University/Claude Design/Awards %26 Press (standalone).html'

const browser = await chromium.launch({ headless: false })

// ── REFERENCE: the approved export ────────────────────────────────────────────
{
  const p = await (await browser.newContext(VP)).newPage()
  await p.goto(EXPORT, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
  await p.evaluate(() => document.fonts && document.fonts.ready)
  await p.waitForTimeout(1000)
  const box = await p.evaluate(() => { const r = document.querySelector('section').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
  await p.screenshot({ path: resolve(out, 'awards-reference.png'), clip: { x: Math.max(0, Math.round(box.x)), y: Math.max(0, Math.round(box.y)), width: Math.round(box.w), height: Math.round(box.h) } })
  const refDash = await p.evaluate(() => {
    const eb = [...document.querySelectorAll('div')].find((d) => d.textContent.trim() === 'RECOGNITION')
    const prev = eb?.previousElementSibling
    return !!(prev && prev.getBoundingClientRect().width <= 40 && prev.getBoundingClientRect().height <= 3)
  })
  console.log(`REFERENCE export: section ${Math.round(box.w)}×${Math.round(box.h)} → awards-reference.png ✓ (has dash before eyebrow: ${refDash})`)
  await p.context().close()
}

// ── OURS ──────────────────────────────────────────────────────────────────────
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
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.display = 'none' } })
const showNav = () => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })

const geo = await page.evaluate(() => { const el = document.getElementById('awards'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
// fire the entrance
await to(Math.round(geo.top - geo.innerH * 0.4)); await page.waitForTimeout(300)
await to(Math.round(geo.top - 20)); await page.waitForTimeout(1600)

// ── THE ONE EDIT: dash gone ──────────────────────────────────────────────────
const dash = await page.evaluate(() => {
  const eb = document.querySelector('.aw-eyebrow')
  const prev = eb?.previousElementSibling
  // any thin hairline element right before the eyebrow?
  const isDash = prev ? (prev.getBoundingClientRect().width <= 40 && prev.getBoundingClientRect().height <= 3) : false
  return { text: eb?.textContent, prevTag: prev ? prev.tagName : null, isDash }
})
console.log(`\nEYEBROW: "${dash.text}", element before it: ${dash.prevTag || 'none'} → dash present: ${dash.isDash ? 'YES ✗' : 'NO ✓ (removed)'}`)

// ── card structure parity ─────────────────────────────────────────────────────
const parity = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.plq')]
  const labels = cards.map((c) => c.querySelector('.aw-label')?.textContent)
  const names = cards.map((c) => c.querySelector('.aw-name')?.textContent)
  const foil = getComputedStyle(document.querySelector('.aw-name')).webkitTextFillColor
  const hasForbes = !!document.querySelector('.aw-clip')
  const placeholders = document.querySelectorAll('.aw-photo-ph').length
  const more = document.querySelector('.aw-more-link')?.textContent
  return { count: cards.length, labels, names, foil, hasForbes, placeholders, more }
})
console.log('CARDS:', parity.count, '| labels', JSON.stringify(parity.labels))
console.log('   names', JSON.stringify(parity.names))
console.log(`   gold-foil fill: ${parity.foil} (transparent = clip) | Forbes clipping: ${parity.hasForbes} | elegant placeholders: ${parity.placeholders} | link: "${parity.more}"`)

// ── screenshot OURS (match the reference framing) ────────────────────────────
await page.setViewportSize({ width: 1536, height: 1000 })
await page.waitForTimeout(150)
const sTop = await page.evaluate(() => document.getElementById('awards').getBoundingClientRect().top + window.scrollY)
const sH = await page.evaluate(() => document.getElementById('awards').offsetHeight)
await to(Math.round(sTop)); await page.waitForTimeout(300)
hideNav()
await page.screenshot({ path: resolve(out, 'awards-port.png'), clip: { x: 0, y: 0, width: 1536, height: Math.min(1000, sH) } })
showNav()
await page.setViewportSize(VP.viewport)
console.log('\n  ✓ awards-port.png')

// ── link hover ────────────────────────────────────────────────────────────────
const linkBefore = await page.evaluate(() => getComputedStyle(document.querySelector('.aw-more-link')).borderBottomColor)
await page.hover('.aw-more-link')
await page.waitForTimeout(400)
const linkAfter = await page.evaluate(() => getComputedStyle(document.querySelector('.aw-more-link')).borderBottomColor)
console.log(`LINK HOVER: border ${linkBefore} → ${linkAfter} (${linkBefore !== linkAfter ? 'underline appears ✓' : 'no change ✗'})`)

// ── card hover (lift + sheen) ─────────────────────────────────────────────────
const card = await page.$('.plq')
const cbY = await page.evaluate(() => document.querySelector('.plq').getBoundingClientRect())
await page.mouse.move(cbY.x + cbY.width / 2, cbY.y + 60)
await page.waitForTimeout(500)
const lift = await page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.plq')).transform).m42)
console.log(`CARD HOVER lift: translateY ${lift.toFixed(1)}px (want ~ -8)`)
await page.mouse.move(4, 4)

// ── FPS + CLS ─────────────────────────────────────────────────────────────────
await to(Math.round(geo.top - geo.innerH)); await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 1800
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: geo.top + geo.h })
console.log('\nFPS:', JSON.stringify(fps), 'CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe ───────────────────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#awards').analyze()
console.log('axe #awards violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}`); for (const n of v.nodes.slice(0, 5)) console.log('     ', n.target.join(' '), '::', (n.failureSummary || '').split('\n').pop()) }
const ccV = axe.violations.find((v) => v.id === 'color-contrast')
const ccI = (axe.incomplete || []).find((v) => v.id === 'color-contrast')
console.log(`color-contrast: violations=${ccV ? ccV.nodes.length : 0}, incomplete=${ccI ? ccI.nodes.length : 0}`)

await browser.close()
console.log('\nDONE.')
