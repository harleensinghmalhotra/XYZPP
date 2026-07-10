import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5177'
const OUT = 'shots/page-about'
mkdirSync(OUT, { recursive: true })
const problems = []
const log = (m) => console.log(m)

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await context.newPage()
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message))
page.on('requestfailed', (r) => consoleErrors.push('[requestfailed] ' + r.url()))

await page.goto(BASE + '/about', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ── title + h1 ──
log('title: ' + JSON.stringify(await page.title()))
const h1s = await page.locator('main h1').allTextContents()
log('h1 count: ' + h1s.length + '  → ' + JSON.stringify(h1s))
if (h1s.length !== 1) problems.push(`expected exactly 1 h1, got ${h1s.length}`)

// ── full-page + slices ──
await page.screenshot({ path: `${OUT}/full.png`, fullPage: true })
const total = await page.evaluate(() => document.body.scrollHeight)
let i = 0
for (let y = 0; y < total; y += 743) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await page.waitForTimeout(350)
  await page.screenshot({ path: `${OUT}/slice-${String(i).padStart(2, '0')}.png` })
  i++
}
await page.evaluate(() => window.scrollTo(0, 0))
log('page height: ' + total + '  slices: ' + i)

// ── 11px label floor ──
const tooSmall = await page.evaluate(() => {
  const out = []
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  while (walk.nextNode()) {
    const t = walk.currentNode
    if (!t.textContent.trim()) continue
    const el = t.parentElement
    if (!el || seen.has(el)) continue
    seen.add(el)
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const fs = parseFloat(cs.fontSize)
    if (fs < 10.95) out.push({ fs: Math.round(fs * 100) / 100, text: el.textContent.trim().slice(0, 40) })
  }
  return out
})
log('sub-11px text nodes: ' + tooSmall.length)
tooSmall.forEach((t) => log('  ✗ ' + t.fs + 'px  "' + t.text + '"'))
if (tooSmall.length) problems.push(`${tooSmall.length} text nodes under 11px`)

// ── uniform card heights (What We Do + service cards) ──
async function rowUniform(selector, label) {
  const heights = await page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((el) => {
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top + window.scrollY), h: Math.round(r.height) }
    })
  }, selector)
  if (!heights.length) { log(`${label}: no cards found (sel ${selector})`); return }
  const rows = {}
  heights.forEach(({ top, h }) => { (rows[top] ||= []).push(h) })
  let ok = true
  Object.entries(rows).forEach(([top, hs]) => {
    const max = Math.max(...hs), min = Math.min(...hs)
    if (max - min > 2) { ok = false; log(`  ✗ ${label} row@${top}: heights ${hs.join(',')}`) }
  })
  log(`${label}: ${heights.length} cards, ${Object.keys(rows).length} rows, uniform=${ok}`)
  if (!ok) problems.push(`${label} card heights not uniform per row`)
}
await rowUniform('[data-card="whatwedo"]', 'What We Do')
await rowUniform('[data-card="service"]', 'Services')

// ── tab interaction ──
await page.getByRole('tab', { name: 'For Institutions & Programmes' }).click()
await page.waitForTimeout(400)
const firstService = (await page.locator('[data-card="service"] h3').first().textContent())?.trim()
log('after tab switch, first service card: ' + JSON.stringify(firstService))
if (!/government/i.test(firstService || '')) problems.push('tab switch did not update service cards')
await page.getByRole('tab', { name: 'For Publishers' }).click()
await page.waitForTimeout(300)

// ── axe (WCAG 2a/2aa) ──
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
const serious = axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
log('\naxe violations (serious/critical): ' + serious.length)
serious.forEach((v) => log(`  ✗ [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`))
if (serious.length) problems.push(`${serious.length} axe serious/critical violations`)
const minor = axe.violations.filter((v) => !['serious', 'critical'].includes(v.impact))
if (minor.length) { log('axe minor/moderate: ' + minor.length); minor.forEach((v) => log(`  · [${v.impact}] ${v.id} (${v.nodes.length})`)) }

// ── console ──
log('\nconsole/page/request errors: ' + consoleErrors.length)
consoleErrors.forEach((e) => log('  ✗ ' + e))
if (consoleErrors.length) problems.push(`${consoleErrors.length} console errors`)

log('\n════════ SUMMARY ════════')
log('problems: ' + problems.length)
problems.forEach((p) => log('  ✗ ' + p))
if (!problems.length) log('  ALL CHECKS PASSED ✓')

// ── reduced-motion pass ──
const rmCtx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const rmPage = await rmCtx.newPage()
const rmErr = []
rmPage.on('console', (m) => { if (m.type() === 'error') rmErr.push(m.text()) })
rmPage.on('pageerror', (e) => rmErr.push(e.message))
await rmPage.goto(BASE + '/about', { waitUntil: 'networkidle' })
await rmPage.waitForTimeout(1200)
await rmPage.screenshot({ path: `${OUT}/reduced-motion.png`, fullPage: true })
log('\nreduced-motion console errors: ' + rmErr.length)

await browser.close()
process.exit(problems.length ? 1 : 0)
