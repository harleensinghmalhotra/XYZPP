import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

const PORT = process.argv[2] || '4173'
const OUT = 'shots/lane8'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

// Serialised WWP hover targets — the numbers the infra card must now match.
const WWP_HOVER_TRANSFORM = 'matrix(1, 0, 0, 1, 0, -6)'            // translateY(-6px)
const WWP_HOVER_SHADOW = 'rgba(15, 36, 68, 0.16) 0px 20px 44px 0px' // 0 20px 44px rgba(15,36,68,.16)

for (const lng of ['en', 'fr']) {
  console.log(`\n=== ${lng.toUpperCase()} ===`)
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

  await page.addInitScript((l) => {
    try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {}
  }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('#infrastructure', { timeout: 30000 })

  // Reveal both sections (GSAP reveal-on-scroll + clearProps leaves cards clean).
  await page.evaluate(() => document.querySelector('#services')?.scrollIntoView())
  await page.waitForTimeout(600)
  await page.evaluate(() => document.querySelector('#infrastructure')?.scrollIntoView())
  await page.waitForTimeout(900)

  const readCard = async (host, inner) => {
    return page.evaluate(([h, i]) => {
      const hostEl = document.querySelector(h)
      const innerEl = i ? hostEl.querySelector(i) : hostEl
      const hs = getComputedStyle(hostEl)
      const is = getComputedStyle(innerEl)
      return { transform: hs.transform, shadow: is.boxShadow }
    }, [host, inner])
  }

  const flatTy = (t) => t === 'none' || /^matrix\(1, 0, 0, 1, 0, (-?0(\.\d+)?)\)$/.test(t) && Math.abs(parseFloat(t.split(',')[5])) < 0.5

  // ── INFRA card: rest → hover ────────────────────────────────────────────────
  await page.mouse.move(5, 5) // park the pointer off every card before reading rest
  await page.waitForTimeout(300)
  const infraRest = await readCard('#infrastructure .infra-card', '.infra-card-inner')
  await page.hover('#infrastructure .infra-card')
  await page.waitForTimeout(500)
  const infraHover = await readCard('#infrastructure .infra-card', '.infra-card-inner')
  await page.locator('#infrastructure .infra-card').first().screenshot({ path: `${OUT}/infra-hover-${lng}.png` })
  console.log('  INFRA rest  :', JSON.stringify(infraRest))
  console.log('  INFRA hover :', JSON.stringify(infraHover))

  // ── WWP card: rest → hover (reference) ──────────────────────────────────────
  await page.evaluate(() => document.querySelector('#services')?.scrollIntoView())
  await page.mouse.move(5, 5) // park pointer off the cards so 'rest' is truly rest
  await page.waitForTimeout(500)
  const wwpRest = await readCard('#services .wwp-card', null)
  await page.hover('#services .wwp-card')
  await page.waitForTimeout(500)
  const wwpHover = await readCard('#services .wwp-card', null)
  await page.locator('#services .wwp-card').first().screenshot({ path: `${OUT}/wwp-hover-${lng}.png` })
  console.log('  WWP   rest  :', JSON.stringify(wwpRest))
  console.log('  WWP   hover :', JSON.stringify(wwpHover))

  // ── Programmatic MATCH: infra hover === WWP hover numbers ────────────────────
  if (flatTy(infraRest.transform)) ok('infra card sits flat at rest (no lift)')
  else fail('infra rest transform not flat: ' + infraRest.transform)

  if (flatTy(wwpRest.transform)) ok('WWP card sits flat at rest (reference)')
  else fail('WWP rest transform not flat: ' + wwpRest.transform)

  if (infraHover.transform === WWP_HOVER_TRANSFORM) ok(`infra hover lift matches WWP (${WWP_HOVER_TRANSFORM})`)
  else fail(`infra hover transform ${infraHover.transform} ≠ WWP ${WWP_HOVER_TRANSFORM}`)

  if (wwpHover.transform === WWP_HOVER_TRANSFORM) ok('WWP hover lift confirmed as reference')
  else fail(`WWP hover transform unexpected: ${wwpHover.transform}`)

  if (infraHover.shadow === WWP_HOVER_SHADOW) ok(`infra hover shadow matches WWP (${WWP_HOVER_SHADOW})`)
  else fail(`infra hover shadow ${infraHover.shadow} ≠ WWP ${WWP_HOVER_SHADOW}`)

  if (wwpHover.shadow === WWP_HOVER_SHADOW) ok('WWP hover shadow confirmed as reference')
  else fail(`WWP hover shadow unexpected: ${wwpHover.shadow}`)

  // No stray glow pseudo-elements left painting on the infra card.
  const glow = await page.evaluate(() => {
    const el = document.querySelector('#infrastructure .infra-card')
    const before = getComputedStyle(el, '::before')
    const after = getComputedStyle(el, '::after')
    return { before: before.content, after: after.content }
  })
  if (glow.before === 'none' && glow.after === 'none') ok('no ::before/::after glow on infra card')
  else fail(`glow pseudo still present: before=${glow.before} after=${glow.after}`)

  // ── console / axe ───────────────────────────────────────────────────────────
  if (!consoleErrors.length) ok('zero console errors'); else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 6).forEach((e) => console.log('      · ' + e)) }

  const axe = await new AxeBuilder({ page }).include('#infrastructure').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe: zero violations in #infrastructure')
  else { fail(`axe: ${axe.violations.length} violations`); for (const v of axe.violations) { console.log(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`); for (const n of v.nodes) console.log('        target:', n.target.join(' ')) } }

  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
