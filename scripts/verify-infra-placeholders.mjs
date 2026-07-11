// Verify — Infrastructure facility PLACEHOLDER panels (photos removed).
// Shots → shots/infra-placeholders/. Checks: section EN+FR, hover states,
// placeholder detail crop, 11px floor audit, contrast AA (caption gold on navy,
// computed manually since the panel is aria-hidden), axe, zero console errors.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots/infra-placeholders')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

// WCAG relative-luminance contrast ratio between two hex colours
const lum = (hex) => {
  const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

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
}
const clipOf = async (page, sel, pad = 44) => {
  const b = await (await page.$(sel)).boundingBox()
  return { x: Math.max(0, Math.round(b.x - pad)), y: Math.max(0, Math.round(b.y - pad)), width: Math.min(1536, Math.round(b.width + pad * 2)), height: Math.round(b.height + pad * 2) }
}

// ── EN — rest, per-card hover, detail crop ────────────────────────────────────
const en = await newPage(await browser.newContext(VP))
await gotoCards(en.page)
await en.page.screenshot({ path: resolve(out, '01-en-rest.png'), clip: await clipOf(en.page, '.infra-cards') })

const cards = await en.page.$$('.infra-card')
for (let i = 0; i < cards.length; i++) {
  const b = await cards[i].boundingBox()
  await en.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await en.page.waitForTimeout(650)
  await en.page.screenshot({ path: resolve(out, `02-en-hover-card${i + 1}.png`), clip: await clipOf(en.page, '.infra-cards') })
}
await en.page.mouse.move(8, 8)
await en.page.waitForTimeout(300)
// placeholder detail crop (single panel)
await en.page.screenshot({ path: resolve(out, '03-en-placeholder-detail.png'), clip: await clipOf(en.page, '.infra-ph', 8) })
// single full card
await en.page.screenshot({ path: resolve(out, '04-en-card-closeup.png'), clip: await clipOf(en.page, '.infra-card', 22) })

// confirm no <img>/background-image photo remains in the facility cards
const photoGone = await en.page.evaluate(() => {
  const cards = [...document.querySelectorAll('.infra-card')]
  return cards.every((c) => {
    const img = c.querySelector('.infra-card-inner > .infra-ph .infra-photo-img')
    return !img && !c.querySelector('img')
  })
})

// 11px floor audit — every text node inside the cards
const fontAudit = await en.page.evaluate(() => {
  const els = [...document.querySelectorAll('.infra-cards *')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
  const sizes = els.map((e) => ({ cls: e.className.toString().split(' ')[0], px: +parseFloat(getComputedStyle(e).fontSize).toFixed(2), txt: e.textContent.trim().slice(0, 24) }))
  return { min: Math.min(...sizes.map((s) => s.px)), under11: sizes.filter((s) => s.px < 10.99) }
})
// caption computed colour
const capColor = await en.page.evaluate(() => getComputedStyle(document.querySelector('.infra-ph-cap')).color)

// axe (excludes aria-hidden placeholder, so it audits the visible card copy)
let axeCount = 'n/a', ccFail = 'n/a'
try {
  const a = await new AxeBuilder({ page: en.page }).include('#infrastructure').analyze()
  axeCount = a.violations.length
  const cc = a.violations.find((v) => v.id === 'color-contrast')
  ccFail = cc ? `FAIL ✗ (${cc.nodes.length})` : 'PASS ✓'
  for (const v of a.violations) console.log(` axe [${v.impact}] ${v.id} ×${v.nodes.length}`)
} catch (e) { console.log('axe error', e.message) }

// ── FR ────────────────────────────────────────────────────────────────────────
const fr = await newPage(await browser.newContext(VP))
await fr.page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'fr') } catch {} })
await gotoCards(fr.page)
await fr.page.screenshot({ path: resolve(out, '05-fr-rest.png'), clip: await clipOf(fr.page, '.infra-cards') })
const frCaps = await fr.page.evaluate(() => [...document.querySelectorAll('.infra-ph-cap')].map((e) => e.textContent.trim()))

// ── report ────────────────────────────────────────────────────────────────────
const capVsNavy = ratio('#e6bd6a', '#0f2444')
console.log('\n── INFRA PLACEHOLDERS VERIFY ─────────────────────')
console.log('facility photos removed:', photoGone ? 'YES ✓' : 'NO ✗ (image still present)')
console.log('11px floor: min =', fontAudit.min + 'px', fontAudit.min >= 10.99 ? '✓' : '✗', '| under-11:', JSON.stringify(fontAudit.under11))
console.log('caption colour:', capColor, '→ contrast vs #0f2444 =', capVsNavy.toFixed(2) + ':1', capVsNavy >= 4.5 ? 'AA ✓' : '✗')
console.log('axe #infrastructure violations:', axeCount, '| color-contrast:', ccFail)
console.log('FR placeholder captions:', JSON.stringify(frCaps))
console.log('console errors EN:', en.errors.length, en.errors.slice(0, 5))
console.log('console errors FR:', fr.errors.length, fr.errors.slice(0, 5))
console.log('CLS EN:', await en.page.evaluate(() => +window.__cls.toFixed(5)))
console.log('shots →', out)

await browser.close()
console.log('DONE.')
