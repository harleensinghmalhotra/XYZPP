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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 80)) })
page.on('pageerror', (e) => errors.push('PAGEERR:' + e.message.slice(0, 80)))
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(700)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const topOf = (id) => page.evaluate((i) => document.getElementById(i).getBoundingClientRect().top + window.scrollY, id)
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = 'hidden' })
const showNav = () => page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = '' })

// ═══════════ AWARDS — 4-corner lights, no card intersection (top & bottom) ════
await to(Math.round((await topOf('awards')) - 20)); await page.waitForTimeout(800)
const geo = await page.evaluate(() => {
  const sec = document.getElementById('awards').getBoundingClientRect()
  const grid = document.querySelector('.aw-grid').getBoundingClientRect()
  const cards = [...document.querySelectorAll('.plq')].map((c) => c.getBoundingClientRect())
  return {
    gridTopFrac: (grid.top - sec.top) / sec.height,
    gridBotFrac: (grid.bottom - sec.top) / sec.height,
    bgLeftFrac: (cards[0].left - 26 - sec.left) / sec.width,
    bgRightFrac: (cards[cards.length - 1].right + 26 - sec.left) / sec.width,
  }
})
hideNav()
const awEl = await page.$('#awards')
await awEl.screenshot({ path: resolve(out, 'awards-4corner.png') })
const buf = await awEl.screenshot()
showNav()
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, CH = info.channels
const warm = (x, y) => { const i = (Math.round(Math.min(H - 1, Math.max(0, y))) * W + Math.round(Math.min(W - 1, Math.max(0, x)))) * CH; return data[i] - data[i + 2] }
const gridTopY = Math.round(geo.gridTopFrac * H), gridBotY = Math.round(geo.gridBotFrac * H)
// four edge samples — beams emerge at all four corners
const edges = {
  TL: warm(W * 0.015, 3), TR: warm(W * 0.985, 3),
  BL: warm(W * 0.015, H - 4), BR: warm(W * 0.985, H - 4),
}
console.log('\nAWARDS 4-corner:')
for (const [k, v] of Object.entries(edges)) console.log(`   ${k} edge warmth=${v} → ${v > -44 ? 'lit ✓' : 'dark'}`)
// bg columns: top beam fades above card grid, bottom beam fades below it
const scan = (frac, label) => {
  const x = Math.min(W - 2, Math.max(2, Math.round(frac * W)))
  const base = warm(x, H * 0.5)
  let topReach = 0
  for (let y = 2; y < gridTopY + 50; y += 3) if (warm(x, y) > base + 8) topReach = y
  let botReach = H
  for (let y = H - 2; y > gridBotY - 50; y -= 3) if (warm(x, y) > base + 8) botReach = y
  const okTop = topReach < gridTopY, okBot = botReach > gridBotY
  console.log(`   ${label}: topBeam reach=${topReach} < cardTop=${gridTopY} ${okTop ? '✓' : '✗'} | botBeam reach=${botReach} > cardBot=${gridBotY} ${okBot ? '✓' : '✗'}`)
  return okTop && okBot
}
const okL = scan(geo.bgLeftFrac, 'left '), okR = scan(geo.bgRightFrac, 'right')
console.log(`   → 4 corners lit + NO card intersection: ${okL && okR && Object.values(edges).every((v) => v > -44) ? 'YES ✓' : 'CHECK ✗'}`)

// ═══════════ PROMISE black ════════════════════════════════════════════════════
await to(Math.round((await topOf('promise')) - 20)); await page.waitForTimeout(1400)
const prom = await page.evaluate(() => ({
  bg: getComputedStyle(document.querySelector('.promise')).backgroundColor,
  quote: getComputedStyle(document.querySelector('.pq-w')).color,
}))
hideNav(); await page.screenshot({ path: resolve(out, 'promise-black.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } }); showNav()
const axeP = await new AxeBuilder({ page }).include('#promise').analyze()
console.log(`\nPROMISE: bg=${prom.bg} (want ~10,14,20 near-black), axe ${axeP.violations.length} violations, contrast ${axeP.violations.find((v) => v.id === 'color-contrast') ? 'FAIL ✗' : 'PASS ✓'}`)

// ═══════════ CASES button band beige + navy/gold button ══════════════════════
await to(Math.round((await topOf('cases'))))
await page.evaluate(() => document.querySelector('.cases-footer').scrollIntoView({ block: 'center' }))
await page.waitForTimeout(500)
const btn = await page.evaluate(() => ({
  band: getComputedStyle(document.querySelector('.cases-footer')).backgroundColor,
  btnBg: getComputedStyle(document.querySelector('.view-all-cases')).backgroundColor,
  btnColor: getComputedStyle(document.querySelector('.view-all-cases')).color,
}))
hideNav(); await page.screenshot({ path: resolve(out, 'cases-btn.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } }); showNav()
console.log(`\nCASES button: band=${btn.band} (want beige 240,235,224), btnBg=${btn.btnBg} (want navy), btnText=${btn.btnColor} (want gold 200,154,60)`)

// ═══════════ LOGO on both nav states ══════════════════════════════════════════
// dark nav → over a dark section (awards); light nav → over a light section (process)
await to(Math.round((await topOf('awards')) + 200)); await page.waitForTimeout(500)
const darkLogo = await page.evaluate(() => {
  const chip = document.querySelector('header a[aria-label*="home"] span')
  return { chip: !!chip, chipBg: chip ? getComputedStyle(chip).backgroundColor : null }
})
await page.screenshot({ path: resolve(out, 'logo-dark.png'), clip: { x: 0, y: 0, width: 560, height: 120 } })
await to(Math.round((await topOf('process')) + 200)); await page.waitForTimeout(500)
const lightLogo = await page.evaluate(() => {
  const chip = document.querySelector('header a[aria-label*="home"] span')
  const img = document.querySelector('header a[aria-label*="home"] img')
  return { hasChip: !!chip, imgSrc: img?.getAttribute('src') }
})
await page.screenshot({ path: resolve(out, 'logo-light.png'), clip: { x: 0, y: 0, width: 560, height: 120 } })
console.log(`\nLOGO: dark-nav chip=${darkLogo.chip} (bg ${darkLogo.chipBg}) | light-nav chip=${lightLogo.hasChip} (want false, bare logo)`)

// ═══════════ WWP eyebrow dash gone ═══════════════════════════════════════════
const dash = await page.evaluate(() => getComputedStyle(document.querySelector('.wwp-eyebrow'), '::after').content)
console.log(`\nWWP eyebrow ::after = ${dash} → dash ${dash === 'none' || dash === 'normal' || dash === '""' ? 'GONE ✓' : 'PRESENT ✗'}`)

console.log('\nconsole errors:', errors.length ? errors : 'NONE ✓')
await browser.close()
console.log('\nDONE.')
