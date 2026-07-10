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
const clipOf = async (page, sel, pad = 24, idx = 0) => {
  const b = await (await page.$$(sel))[idx].boundingBox()
  return {
    x: Math.max(0, Math.round(b.x - pad)),
    y: Math.max(0, Math.round(b.y - pad)),
    width: Math.min(1536, Math.round(b.width + pad * 2)),
    height: Math.round(b.height + pad * 2),
  }
}

const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(600)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)

const ledgerY = await page.evaluate(() => document.querySelector('.proj-ledger').getBoundingClientRect().top + window.scrollY)
await to(Math.round(ledgerY - 120))

// ── MID-ROLL — confirm the foil styling doesn't break the reel roll ───────────
let midInfo = null
for (let i = 0; i < 40; i++) {
  const state = await page.evaluate(() => {
    const reel = document.querySelector('.ledger-hero .odo-reel')
    if (!reel) return null
    const m = new DOMMatrixReadOnly(getComputedStyle(reel).transform)
    const strip = reel.getBoundingClientRect().height
    const target = (10 + Number(reel.dataset.d)) / 20
    return { prog: strip ? +((-m.m42) / (strip * target)).toFixed(3) : 0 }
  })
  if (state && state.prog > 0.18 && state.prog < 0.82) {
    midInfo = state
    await page.screenshot({ path: resolve(out, 'ledger-units-midroll.png'), clip: await clipOf(page, '.ledger-hero', 30) })
    break
  }
  await page.waitForTimeout(45)
}
console.log(`MID-ROLL (with foil): ${midInfo ? `progress ${midInfo.prog} — rolls clean ✓` : 'MISSED ✗'}`)

await page.waitForTimeout(2600) // settle to locked/foil rest state

// ── HERO FOIL closeup ─────────────────────────────────────────────────────────
await page.setViewportSize({ width: 1536, height: 1120 })
await page.waitForTimeout(150)
const hY = await page.evaluate(() => document.querySelector('.ledger-hero').getBoundingClientRect().top + window.scrollY)
await to(Math.round(hY - 90))
await page.waitForTimeout(350)
await page.screenshot({ path: resolve(out, 'ledger-hero-foil.png'), clip: await clipOf(page, '.ledger-hero-num', 34) })
console.log('  ✓ ledger-hero-foil.png')

// ── ROW unit + shadow closeup (Nigeria "8M+ Books") ───────────────────────────
await page.screenshot({ path: resolve(out, 'ledger-units.png'), clip: await clipOf(page, '.ledger-row', 26, 0) })
const rowInfo = await page.evaluate(() => {
  const row = document.querySelector('.ledger-row')
  const unit = row.querySelector('.ledger-unit')
  const odo = row.querySelector('.ledger-num .odo')
  return {
    num: row.querySelector('.ledger-num .odo').getAttribute('aria-label'),
    unit: unit.textContent,
    unitColor: getComputedStyle(unit).color,
    unitSize: getComputedStyle(unit).fontSize,
    filter: getComputedStyle(odo).filter.slice(0, 60) + '…',
    cellFill: getComputedStyle(document.querySelector('.ledger-num .odo-cell')).webkitTextFillColor,
  }
})
console.log('  ✓ ledger-units.png —', JSON.stringify(rowInfo))
await page.setViewportSize(VP.viewport)

// ── axe / contrast ────────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#projects').analyze()
console.log('\naxe #projects violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}: ${v.help}`); for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' ')) }
const ccV = axe.violations.find((v) => v.id === 'color-contrast')
const ccI = (axe.incomplete || []).find((v) => v.id === 'color-contrast')
const ccP = axe.passes.find((p) => p.id === 'color-contrast')
console.log(`color-contrast: violations=${ccV ? ccV.nodes.length : 0}, incomplete=${ccI ? ccI.nodes.length : 0}, passed nodes=${ccP ? ccP.nodes.length : 0}`)

await browser.close()
console.log('\nDONE.')
