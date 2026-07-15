import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { preview } from 'vite'
import fs from 'node:fs'

const OUT = 'shots/lane12b'
fs.mkdirSync(OUT, { recursive: true })

const server = await preview({ preview: { port: 5251 } })
const base = `http://localhost:5251`
const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

await page.addInitScript(() => {
  try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {}
})
await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForSelector('#marquee', { timeout: 30000 })
// make sure the webfont is actually resolved before we measure/screenshot
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

// Bring the marquee into view, freeze its scroll animation for a stable shot
const marquee = await page.$('#marquee')
await marquee.scrollIntoViewIfNeeded()
await page.evaluate(() => {
  document.querySelectorAll('#marquee [class*="animate-"], #marquee .flex').forEach((el) => {
    el.style.animationPlayState = 'paused'
    el.style.animation = 'none'
    el.style.transform = 'translate3d(0,0,0)'
  })
})
await page.waitForTimeout(300)

// ── Computed styles for EVERY term in the strip ──────────────────────────────
const terms = await page.evaluate(() => {
  return [...document.querySelectorAll('#marquee .mq-word')].map((el) => {
    const cs = getComputedStyle(el)
    return {
      text: el.textContent,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      color: cs.color,
      stroke: cs.webkitTextStrokeWidth || cs.getPropertyValue('-webkit-text-stroke-width'),
    }
  })
})
console.log('\n=== Marquee term computed styles ===')
for (const t of terms) {
  console.log(`  "${t.text}"  family=${t.fontFamily}  weight=${t.fontWeight}  color=${t.color}  stroke=${t.stroke}`)
}
const allInterTight = terms.every((t) => /inter tight/i.test(t.fontFamily))
const all800 = terms.every((t) => t.fontWeight === '800')
const noStroke = terms.every((t) => t.stroke === '0px' || t.stroke === '')
const noTransparent = terms.every((t) => !/rgba\(0, 0, 0, 0\)|transparent/.test(t.color))
if (allInterTight) ok('every term computes to Inter Tight'); else fail('a term is NOT Inter Tight')
if (all800) ok('every term is weight 800 (a loaded weight)'); else fail('a term is not weight 800')
if (noStroke) ok('no -webkit-text-stroke on any term'); else fail('a term still has a text stroke')
if (noTransparent) ok('every term has a solid fill (no transparent/outline)'); else fail('a term is transparent (outline-only)')

// Confirm Inter Tight 800 is actually available (not synth-fallback)
const fontLoaded = await page.evaluate(() => document.fonts.check('800 40px "Inter Tight"'))
if (fontLoaded) ok('document.fonts.check: Inter Tight 800 is loaded'); else fail('Inter Tight 800 NOT loaded — would fall back')

// ── Screenshots: full strip + 2x crop of the fourcolour term ─────────────────
await marquee.screenshot({ path: `${OUT}/marquee-full.png` })
const fourEl = await page.evaluateHandle(() =>
  [...document.querySelectorAll('#marquee .mq-word')].find((el) => /4-?colou?r|process/i.test(el.textContent))
)
const fourElem = fourEl.asElement()
await fourElem.scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await fourElem.screenshot({ path: `${OUT}/marquee-crop.png` })
ok('4-colour crop captured')

// ── Side-by-side reference: a real section heading elsewhere on the site ──────
// WhatWePrint (#services) heading renders in the site's standard Inter Tight fill.
const svc = await page.$('#services')
if (svc) {
  await svc.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  const heading = await page.$('#services h2, #services .wwp-title, #services [class*="title"]')
  if (heading) {
    const hStyle = await heading.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { text: el.textContent.trim().slice(0, 40), family: cs.fontFamily, weight: cs.fontWeight, color: cs.color, stroke: cs.webkitTextStrokeWidth }
    })
    console.log(`\n  Reference heading "${hStyle.text}"  family=${hStyle.family}  weight=${hStyle.weight}  stroke=${hStyle.stroke}`)
    const box = await heading.boundingBox()
    if (box) await page.screenshot({ path: `${OUT}/reference-heading.png`, clip: { x: box.x, y: box.y, width: Math.min(box.width, 900), height: box.height } })
    if (/inter tight/i.test(hStyle.family)) ok('reference heading is Inter Tight (same family as marquee now)')
  }
}

// ── console + axe ─────────────────────────────────────────────────────────────
if (!consoleErrors.length) ok('zero console errors'); else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 6).forEach((e) => console.log('      · ' + e)) }

await marquee.scrollIntoViewIfNeeded()
const axe = await new AxeBuilder({ page }).include('#marquee').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
if (!axe.violations.length) ok('axe (#marquee): zero violations')
else { fail(`axe: ${axe.violations.length} violations`); for (const v of axe.violations) console.log(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`) }

await ctx.close()
await browser.close()
await server.httpServer.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
