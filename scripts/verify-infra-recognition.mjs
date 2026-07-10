import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = (process.env.URL || 'http://localhost:5173') + '/infrastructure'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(400)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav'); if (n) { n.dataset._h = '1'; n.style.display = 'none' } })
const showNav = () => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })

const geo = await page.evaluate(() => { const el = document.querySelector('.inf-recognition'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
await to(Math.round(geo.top - geo.innerH * 0.4)); await page.waitForTimeout(300)
await to(Math.round(geo.top - 20)); await page.waitForTimeout(1500)

const parity = await page.evaluate(() => {
  const sec = document.querySelector('.inf-recognition')
  const cs = getComputedStyle(sec)
  const cards = [...sec.querySelectorAll('.plq')]
  const labels = cards.map((c) => c.querySelector('.aw-label')?.textContent)
  const names = cards.map((c) => c.querySelector('.aw-name')?.textContent)
  const foil = getComputedStyle(sec.querySelector('.aw-name')).webkitTextFillColor
  const hasClip = !!sec.querySelector('.aw-clip')
  const realPhotos = [...sec.querySelectorAll('.aw-photo-img')].filter((i) => i.complete && i.naturalWidth > 0).length
  const placeholders = sec.querySelectorAll('.aw-photo-ph').length
  const hasGlow = !!sec.querySelector('.aw-glow')
  const title = sec.querySelector('.aw-title')?.textContent
  const eyebrow = sec.querySelector('.aw-eyebrow')?.textContent
  return { bg: cs.backgroundColor, count: cards.length, labels, names, foil, hasClip, realPhotos, placeholders, hasGlow, title, eyebrow }
})
console.log('SECTION bg:', parity.bg, '(want rgb(15, 36, 68) navy) | spotlights:', parity.hasGlow)
console.log('EYEBROW:', JSON.stringify(parity.eyebrow), '| TITLE:', JSON.stringify(parity.title))
console.log('PLAQUES:', parity.count, '| labels', JSON.stringify(parity.labels))
console.log('  names', JSON.stringify(parity.names))
console.log(`  gold-foil fill: ${parity.foil} (transparent = foil clip) | press-clipping: ${parity.hasClip} | real photos loaded: ${parity.realPhotos} | placeholders: ${parity.placeholders}`)

// full-section screenshot
await page.setViewportSize({ width: 1536, height: 1100 })
await page.waitForTimeout(150)
const sTop = await page.evaluate(() => document.querySelector('.inf-recognition').getBoundingClientRect().top + window.scrollY)
const sH = await page.evaluate(() => document.querySelector('.inf-recognition').offsetHeight)
await to(Math.round(sTop)); await page.waitForTimeout(300)
hideNav()
await page.screenshot({ path: resolve(out, 'infra-recognition.png'), clip: { x: 0, y: 0, width: 1536, height: Math.min(1100, sH) } })
showNav()
await page.setViewportSize(VP.viewport)
console.log('\n  ✓ shots/infra-recognition.png')

// card hover lift + sheen
const cbY = await page.evaluate(() => document.querySelector('.inf-recognition .plq').getBoundingClientRect())
await page.mouse.move(cbY.x + cbY.width / 2, cbY.y + 60)
await page.waitForTimeout(500)
const lift = await page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.inf-recognition .plq')).transform).m42)
console.log(`CARD HOVER lift: translateY ${lift.toFixed(1)}px (want ~ -8)`)
await page.mouse.move(4, 4)

console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

const axe = await new AxeBuilder({ page }).include('.inf-recognition').analyze()
console.log('axe .inf-recognition violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}`); for (const n of v.nodes.slice(0, 5)) console.log('     ', n.target.join(' '), '::', (n.failureSummary || '').split('\n').pop()) }

await browser.close()
console.log('\nDONE.')
