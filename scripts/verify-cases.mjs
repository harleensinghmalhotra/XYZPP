import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

// ── 1 · TOKEN AUDIT — grep Cases.css for hex, all must be our palette ─────────
const css = readFileSync(resolve(root, 'src/sections/Cases.css'), 'utf8')
const ALLOWED = new Set(['0f2444', 'fdfaf4', 'c89a3c', '0b1c38', '1b3a6b', 'e6bd6a', '9b7420', '836013', 'f0ebe0', '1c2019', '6b7a2a', 'e8c275', '2d2926'])
const hexes = [...css.matchAll(/#([0-9a-fA-F]{6})\b/g)].map((m) => m[1].toLowerCase())
const uniq = [...new Set(hexes)]
const offToken = uniq.filter((h) => !ALLOWED.has(h))
console.log('TOKEN AUDIT — hex in Cases.css:', JSON.stringify(uniq))
console.log(`   off-token: ${offToken.length ? JSON.stringify(offToken) + ' ✗' : 'NONE ✓'}`)
const reds = uniq.filter((h) => { const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return r > 150 && g < 90 && b < 90 })
console.log(`   red-ish colors: ${reds.length ? JSON.stringify(reds) + ' ✗' : 'NONE ✓'}`)
const pur=uniq.filter(h=>h==='000000'||h==='ffffff')
console.log(`   pure black/white: ${pur.length ? JSON.stringify(pur.length)+' ✗':'NONE ✓'}`)

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
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.display = 'none' } })
const showNav = () => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })

const geo = await page.evaluate(() => { const el = document.getElementById('cases'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
await to(Math.round(geo.top - 40)); await page.waitForTimeout(700)

// ── 2 · runtime colours: eyebrow dash gone, key colours are tokens ───────────
const runtime = await page.evaluate(() => {
  const eb = document.querySelector('.cases-eyebrow')
  const afterDash = getComputedStyle(eb, '::after').content
  const secBg = getComputedStyle(document.querySelector('.section-cases')).backgroundColor
  const footBg = getComputedStyle(document.querySelector('.cases-footer')).backgroundColor
  const btn = getComputedStyle(document.querySelector('.view-all-cases')).borderColor
  return {
    ebColor: getComputedStyle(eb).color, dash: afterDash,
    secBg, footBg,
    duotone: !!document.querySelector('.case-duotone'), scrim: !!document.querySelector('.case-scrim'),
  }
})
console.log(`\nEYEBROW: color ${runtime.ebColor}, ::after content=${runtime.dash} → dash ${runtime.dash === 'none' || runtime.dash === '""' || runtime.dash === 'normal' ? 'GONE ✓' : 'PRESENT ✗'}`)
console.log(`SECTION bg ${runtime.secBg} | FOOTER bg ${runtime.footBg} → ${runtime.footBg === 'rgba(0, 0, 0, 0)' || runtime.footBg === runtime.secBg ? 'continuous (no band) ✓' : 'BAND ✗'}`)
console.log(`duotone layer: ${runtime.duotone}, scrim layer: ${runtime.scrim}`)

// ── 3 · button gap under filmstrip ───────────────────────────────────────────
const gap = await page.evaluate(() => {
  const strip = document.querySelector('.cases-list').getBoundingClientRect().bottom
  const btn = document.querySelector('.view-all-cases').getBoundingClientRect().top
  return +(btn - strip).toFixed(1)
})
console.log(`BUTTON GAP under filmstrip: ${gap}px → ${gap >= 40 && gap <= 72 ? 'IN ~48–64 ✓' : '(check)'}`)

// ── 4 · FULL SECTION rest ────────────────────────────────────────────────────
hideNav()
await (await page.$('#cases')).screenshot({ path: resolve(out, 'cases-ours.png') })
showNav()
console.log('\n  ✓ cases-ours.png')

// ── 5 · SLIVER-SWITCH mid-transition (click a collapsed case, catch ~mid 0.8s) ─
await to(Math.round(geo.top - 40)); await page.waitForTimeout(300)
const items = await page.$$('.case-item')
await items[1].click()
await page.waitForTimeout(340) // ~mid of the 0.8s expand/collapse
hideNav()
await (await page.$('#cases')).screenshot({ path: resolve(out, 'cases-switch.png') })
showNav()
console.log('  ✓ cases-switch.png (mid-transition)')
await page.waitForTimeout(700)

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
const axe = await new AxeBuilder({ page }).include('#cases').analyze()
console.log('axe #cases violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}`); for (const n of v.nodes.slice(0, 5)) console.log('     ', n.target.join(' '), '::', (n.failureSummary || '').split('\n').pop()) }
const cc = axe.violations.find((v) => v.id === 'color-contrast')
console.log('color-contrast:', cc ? `FAIL ✗ (${cc.nodes.length})` : 'PASS ✓')

await browser.close()
console.log('\nDONE.')
