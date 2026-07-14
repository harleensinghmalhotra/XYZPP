import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

// Lane 9 — section order (WWP before GlobeReach) + left-edge alignment.
// Usage: node scripts/lane9-verify.mjs <port> <tag> [full]
//   tag  = label printed with the measurements (e.g. "before" / "after")
//   full = run order-assert + screenshots + axe (the BUILT-preview gate)
const PORT = process.argv[2] || '5199'
const TAG = process.argv[3] || 'run'
const FULL = process.argv[4] === 'full'
const OUT = 'shots/lane9'
fs.mkdirSync(OUT, { recursive: true })

// The law (Lane 9, final):
const LAW = ['hero', 'traderstrip', 'services', 'reach', 'promise', 'process', 'projects', 'infrastructure']
// ^ tolerant match; we assert the KEY adjacencies below rather than exact class slugs.

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

for (const lng of ['en', 'fr']) {
  console.log(`\n=== ${lng.toUpperCase()} (${TAG}) ===`)
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

  await page.addInitScript((l) => {
    try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {}
  }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)

  // ── DOM order of top-level sections ─────────────────────────────────────────
  const order = await page.evaluate(() => {
    const main = document.querySelector('main#main')
    const ids = []
    for (const el of main.querySelectorAll(':scope > section, :scope > div')) {
      const sec = el.tagName === 'SECTION' ? el : el.querySelector('section') || el
      const key = sec.id || (sec.className || '').split(' ')[0] || sec.tagName.toLowerCase()
      if (key) ids.push(key)
    }
    return ids
  })
  console.log('  order:', order.join(' → '))

  // Key adjacency asserts for the law (by id where stable)
  const idx = (re) => order.findIndex((x) => re.test(x))
  const iWWP = idx(/services|wwp/i)
  const iReach = idx(/reach|globe|gr-/i)
  const iProc = idx(/conv|process/i)
  const iProj = idx(/projects/i)
  if (iWWP >= 0 && iReach >= 0 && iWWP < iReach) ok(`WhatWePrint before GlobeReach (idx ${iWWP} < ${iReach})`)
  else fail(`order wrong: WWP idx ${iWWP}, GlobeReach idx ${iReach}`)
  if (iProc >= 0 && iProj === iProc + 1) ok(`Process3D immediately before Projects (${iProc} → ${iProj})`)
  else fail(`Process3D idx ${iProc}, Projects idx ${iProj}`)

  // ── Left-edge measurements ──────────────────────────────────────────────────
  const measure = await page.evaluate(() => {
    const L = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      return Math.round(el.getBoundingClientRect().left * 100) / 100
    }
    return {
      wwpEyebrow: L('#services .wwp-eyebrow'),
      wwpTitle: L('#services .wwp-title'),
      grEyebrow: L('#reach .gr-eyebrow'),
      grTitle: L('#reach .gr-title'),
      promiseEyebrow: L('.promise-eyebrow'),
      projEyebrow: L('#projects .proj-eyebrow'),
      projTitle: L('#projects .proj-title'),
      infraEyebrow: L('.infra-eyebrow'),
      infraTitle: L('.infra-title'),
    }
  })
  console.log('  LEFT-EDGE X (CSS px @ 1536):')
  for (const [k, v] of Object.entries(measure)) console.log(`    ${k.padEnd(16)} ${v === null ? '—' : v + 'px'}`)

  // WWP vs GR heading equal within ±2px, both at the site standard (~184 @ 1536)
  if (measure.wwpEyebrow != null && measure.grEyebrow != null) {
    const d = Math.abs(measure.wwpEyebrow - measure.grEyebrow)
    if (d <= 2) ok(`WWP & GlobeReach eyebrow left edges equal (Δ ${d.toFixed(2)}px ≤ 2)`)
    else fail(`WWP ${measure.wwpEyebrow} vs GlobeReach ${measure.grEyebrow} eyebrow (Δ ${d.toFixed(2)}px > 2)`)
  }
  // Standard = WWP left edge (which equals Projects/Infra by construction)
  if (measure.wwpEyebrow != null && measure.projEyebrow != null) {
    const d = Math.abs(measure.wwpEyebrow - measure.projEyebrow)
    console.log(`    (WWP vs Projects standard Δ ${d.toFixed(2)}px)`)
  }

  if (FULL) {
    // ── Boundary screenshots: TS→WWP, WWP→GR, GR→Promise ──────────────────────
    const shot = async (sel, name) => {
      const el = await page.$(sel)
      if (!el) { fail(`screenshot target missing: ${sel}`); return }
      await el.scrollIntoViewIfNeeded()
      await page.waitForTimeout(350)
      await el.screenshot({ path: `${OUT}/${name}-${lng}.png` })
      ok(`shot ${name}-${lng}.png`)
    }
    await shot('#services', 'wwp')
    await shot('#reach', 'reach')
    await shot('.promise', 'promise')

    // ── console ───────────────────────────────────────────────────────────────
    if (!consoleErrors.length) ok('zero console errors')
    else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 6).forEach((e) => console.log('      · ' + e)) }

    // ── axe ───────────────────────────────────────────────────────────────────
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    if (!axe.violations.length) ok('axe: zero violations')
    else { fail(`axe: ${axe.violations.length} violations`); for (const v of axe.violations) { console.log(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`); for (const n of v.nodes.slice(0, 3)) console.log('        ', n.target.join(' ')) } }
  }

  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
