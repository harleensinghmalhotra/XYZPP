import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
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
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 90)) })
page.on('pageerror', (e) => errors.push('PAGEERR:' + e.message.slice(0, 90)))
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(700)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const topOf = (id) => page.evaluate((i) => document.getElementById(i).getBoundingClientRect().top + window.scrollY, id)
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = 'hidden' })
const showNav = () => page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = '' })

// ════════════════ 1 · AWARDS — corner glow, NO card overlap ══════════════════
await to(Math.round((await topOf('awards')) - 20)); await page.waitForTimeout(900)
// geometry: sample PURE BACKGROUND columns just left/right of the card grid
// (avoids the cards' own warm content), through the glow zone, top → card grid.
const geo = await page.evaluate(() => {
  const sec = document.getElementById('awards').getBoundingClientRect()
  const grid = document.querySelector('.aw-grid').getBoundingClientRect()
  const cards = [...document.querySelectorAll('.plq')].map((c) => c.getBoundingClientRect())
  const first = cards[0], last = cards[cards.length - 1]
  return {
    gridTopFrac: (grid.top - sec.top) / sec.height,
    bgLeftFrac: (first.left - 26 - sec.left) / sec.width,   // background column left of first card
    bgRightFrac: (last.right + 26 - sec.left) / sec.width,  // background column right of last card
    beamsGone: !document.querySelector('.aw-beams'),
  }
})
hideNav()
const awEl = await page.$('#awards')
await awEl.screenshot({ path: resolve(out, 'awards-corners.png') })
showNav()
const buf = await awEl.screenshot()
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, CH = info.channels
const warmth = (x, y) => { const i = (Math.round(y) * W + Math.round(x)) * CH; return data[i] - data[i + 2] } // R − B (navy≈−53, gold-lit higher)
const gridTopY = Math.round(geo.gridTopFrac * H)
const scan = (frac, label) => {
  const x = Math.min(W - 2, Math.max(2, Math.round(frac * W)))
  const baseline = warmth(x, H * 0.44)                    // pure navy, below glow / above carpet
  const glowTop = warmth(x, H * 0.02)                     // corner glow
  let reachY = 0
  for (let y = 2; y < gridTopY + 40; y += 3) if (warmth(x, y) > baseline + 8) reachY = y
  const atCards = warmth(x, gridTopY + 4)                 // background at the card-grid top line
  const clear = reachY < gridTopY && atCards <= baseline + 8
  console.log(`   ${label}: baseline=${baseline}, corner=${glowTop} (glow ${glowTop > baseline + 10 ? 'present ✓' : 'weak'}), reach=${reachY}px vs cardTop=${gridTopY}px, atCardTop=${atCards} → ${clear ? 'CLEAR of cards ✓' : 'OVERLAP ✗'}`)
  return clear
}
console.log('\nAWARDS corner-glow bounding check:')
console.log(`   beams element removed: ${geo.beamsGone ? 'YES ✓' : 'NO ✗'}`)
console.log(`   card-grid top @ ${(geo.gridTopFrac * 100).toFixed(1)}% (y≈${gridTopY}px of ${H})`)
const okL = scan(geo.bgLeftFrac, 'left column ')
const okR = scan(geo.bgRightFrac, 'right column')
console.log(`   → NO glow/card overlap: ${okL && okR ? 'YES ✓' : 'FAIL ✗'}`)

// ════════════════ 2 · FOOTER beige + contrast ════════════════════════════════
await to(Math.round((await topOf('contact')) - 20)); await page.waitForTimeout(700)
const footer = await page.evaluate(() => {
  const sec = document.getElementById('contact')
  return { bg: getComputedStyle(sec).backgroundColor, theme: sec.dataset.theme }
})
hideNav()
await page.screenshot({ path: resolve(out, 'footer-beige.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } })
showNav()
const axeFooter = await new AxeBuilder({ page }).include('#contact').analyze()
const ccF = axeFooter.violations.find((v) => v.id === 'color-contrast')
console.log(`\nFOOTER: data-theme=${footer.theme}, bg=${footer.bg}`)
console.log(`   axe: ${axeFooter.violations.length} violations, contrast ${ccF ? 'FAIL ✗' : 'PASS ✓'}`)

// ════════════════ 3 · CTA fonts ═══════════════════════════════════════════════
const fonts = await page.evaluate(() => {
  const g = (sel) => getComputedStyle(document.querySelector(sel)).fontFamily
  const h2 = document.querySelector('#contact h2')
  const p = h2.parentElement.querySelector('p')
  const btn = h2.parentElement.querySelector('a')
  return { headline: getComputedStyle(h2).fontFamily, body: getComputedStyle(p).fontFamily, button: getComputedStyle(btn).fontFamily }
})
console.log('\nCTA FONTS (computed):')
console.log(`   headline: ${fonts.headline}  → ${/Inter Tight/i.test(fonts.headline) ? 'Inter Tight ✓' : 'WRONG ✗'}`)
console.log(`   body:     ${fonts.body}  → ${/^\W*Inter\b/i.test(fonts.body) && !/Tight/i.test(fonts.body) && !/Mono|Space/i.test(fonts.body) ? 'Inter ✓' : 'WRONG ✗'}`)
console.log(`   button:   ${fonts.button}  → ${/Inter\b/i.test(fonts.button) && !/Space/i.test(fonts.button) ? 'Inter ✓' : 'WRONG ✗'}`)
await page.evaluate(() => document.querySelector('#contact h2').scrollIntoView({ block: 'center' }))
await page.waitForTimeout(300)
hideNav()
await page.screenshot({ path: resolve(out, 'cta-fonts.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } })
showNav()

// ════════════════ 4 · NAV gold link + no green anywhere ══════════════════════
await to(0); await page.waitForTimeout(400)
const navLink = await page.evaluate(() => {
  const a = [...document.querySelectorAll('header a')].find((x) => /Ask for a quote/i.test(x.textContent))
  return a ? getComputedStyle(a).color : null
})
// scan the whole page for any green-ish computed color/bg
const greens = await page.evaluate(() => {
  const isGreen = (c) => { const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if (!m) return false; const [r, g, b] = [+m[1], +m[2], +m[3]]; return g > 90 && g > r + 30 && g > b + 30 }
  const hits = []
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el)
    if (isGreen(s.color)) hits.push(el.tagName + '.' + (el.className.toString().slice(0, 24)) + ' color ' + s.color)
    if (isGreen(s.backgroundColor)) hits.push(el.tagName + '.' + (el.className.toString().slice(0, 24)) + ' bg ' + s.backgroundColor)
    if (hits.length > 8) break
  }
  return hits
})
console.log(`\nNAV "Ask for a quote" color: ${navLink} → ${navLink === 'rgb(200, 154, 60)' ? 'GOLD #C89A3C ✓' : 'NOT GOLD ✗'}`)
console.log(`GREEN anywhere on page: ${greens.length ? 'FOUND ✗ ' + JSON.stringify(greens) : 'NONE ✓'}`)

console.log('\nconsole errors:', errors.length ? errors : 'NONE ✓')
await browser.close()
console.log('\nDONE.')
