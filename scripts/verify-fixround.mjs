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

// ═══════════════ AWARDS v3 — beams from edges, no card overlap ═══════════════
await to(Math.round((await topOf('awards')) - 20)); await page.waitForTimeout(800)
const geo = await page.evaluate(() => {
  const sec = document.getElementById('awards').getBoundingClientRect()
  const grid = document.querySelector('.aw-grid').getBoundingClientRect()
  const cards = [...document.querySelectorAll('.plq')].map((c) => c.getBoundingClientRect())
  return {
    gridTopFrac: (grid.top - sec.top) / sec.height,
    bgLeftFrac: (cards[0].left - 26 - sec.left) / sec.width,
    bgRightFrac: (cards[cards.length - 1].right + 26 - sec.left) / sec.width,
  }
})
hideNav()
const awEl = await page.$('#awards')
await awEl.screenshot({ path: resolve(out, 'awards-v3.png') })
const buf = await awEl.screenshot()
showNav()
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, CH = info.channels
const warm = (x, y) => { const i = (Math.round(y) * W + Math.round(x)) * CH; return data[i] - data[i + 2] }
const gridTopY = Math.round(geo.gridTopFrac * H)
// (a) beams emerge AT the top edges: warmth elevated at the very top row near the corners
const baseL = warm(W * geo.bgLeftFrac, H * 0.44), baseR = warm(W * geo.bgRightFrac, H * 0.44)
const edgeL = warm(W * 0.015, 3), edgeR = warm(W * 0.985, 3)         // top-left / top-right EDGE pixels
console.log('\nAWARDS v3:')
console.log(`   beam at top-LEFT edge:  warmth=${edgeL} vs base=${baseL} → ${edgeL > baseL + 8 ? 'EMERGES AT EDGE ✓' : 'no edge glow ✗'}`)
console.log(`   beam at top-RIGHT edge: warmth=${edgeR} vs base=${baseR} → ${edgeR > baseR + 8 ? 'EMERGES AT EDGE ✓' : 'no edge glow ✗'}`)
// (b) no card overlap: bg column scan, reach must be above card grid, navy at card top
const scan = (frac, label) => {
  const x = Math.min(W - 2, Math.max(2, Math.round(frac * W)))
  const base = warm(x, H * 0.44)
  let reach = 0
  for (let y = 2; y < gridTopY + 60; y += 3) if (warm(x, y) > base + 8) reach = y
  const atCards = warm(x, gridTopY + 6)
  const ok = reach < gridTopY && atCards <= base + 8
  console.log(`   ${label}: reach=${reach}px vs cardTop=${gridTopY}px, atCardTop=${atCards} (base ${base}) → ${ok ? 'CLEAR ✓' : 'OVERLAP ✗'}`)
  return ok
}
const okL = scan(geo.bgLeftFrac, 'left col '), okR = scan(geo.bgRightFrac, 'right col')
console.log(`   → NO card overlap: ${okL && okR ? 'YES ✓' : 'FAIL ✗'}`)

// ═══════════════ FOOTER — navy outer + beige card ════════════════════════════
await to(Math.round((await topOf('contact')) - 20)); await page.waitForTimeout(600)
const foot = await page.evaluate(() => ({
  sec: getComputedStyle(document.getElementById('contact')).backgroundColor,
  card: getComputedStyle(document.querySelector('#contact footer')).backgroundColor,
  theme: document.getElementById('contact').dataset.theme,
}))
console.log(`\nFOOTER: outer=${foot.sec} (want navy ~15,36,68), card=${foot.card} (want beige/cream), theme=${foot.theme}`)
hideNav()
await (await page.$('#contact')).screenshot({ path: resolve(out, 'footer-v2.png') })
showNav()
const axeC = await new AxeBuilder({ page }).include('#contact').analyze()
console.log(`   axe: ${axeC.violations.length} violations`)

// ═══════════════ CASES — beige header, reduced pad, contrast ═════════════════
await to(Math.round((await topOf('cases')) - 20)); await page.waitForTimeout(600)
const ch = await page.evaluate(() => {
  const hdr = document.querySelector('.cases-header')
  const eb = document.querySelector('.cases-eyebrow'); const h3 = document.querySelector('.cases-header h3')
  const sec = document.querySelector('.section-cases')
  return {
    hdrBg: getComputedStyle(hdr).backgroundColor, ebColor: getComputedStyle(eb).color,
    h3Color: getComputedStyle(h3).color, filmstrip: getComputedStyle(sec).backgroundColor,
    padTop: getComputedStyle(hdr).paddingTop,
  }
})
console.log(`\nCASES header: bg=${ch.hdrBg} (want beige 240,235,224), eyebrow=${ch.ebColor} (want 131,96,19), h3=${ch.h3Color} (want navy), padTop=${ch.padTop}`)
console.log(`   filmstrip stays: ${ch.filmstrip} (want navy)`)
hideNav()
await page.screenshot({ path: resolve(out, 'cases-beige.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } })
showNav()
const axeCases = await new AxeBuilder({ page }).include('#cases').analyze()
const ccCases = axeCases.violations.find((v) => v.id === 'color-contrast')
console.log(`   axe: ${axeCases.violations.length} violations, contrast ${ccCases ? 'FAIL ✗' : 'PASS ✓'}`)

// ═══════════════ FPS on awards ════════════════════════════════════════════════
await to(Math.round((await topOf('awards')) - 20)); await page.waitForTimeout(400)
const fps = await page.evaluate(() => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  setTimeout(() => { cancelAnimationFrame(raf); const a = d.slice(3).sort((x, y) => x - y); const m = a.reduce((x, y) => x + y, 0) / a.length; done({ fps: +(1000 / m).toFixed(1), long: a.filter((x) => x > 18.5).length }) }, 2000)
}))
console.log('\nFPS awards:', JSON.stringify(fps))
console.log('console errors:', errors.length ? errors : 'NONE ✓')

await browser.close()
console.log('\nDONE.')
