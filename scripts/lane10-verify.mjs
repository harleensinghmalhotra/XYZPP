import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

// Lane 10 — Mission Band flat navy. Usage: node scripts/lane10-verify.mjs <port>
const PORT = process.argv[2] || '5210'
const OUT = 'shots/lane10'
fs.mkdirSync(OUT, { recursive: true })

// WCAG relative luminance + contrast
const chan = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
const parseRGB = (s) => { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 } }
// composite fg (with alpha) over opaque bg
const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) })

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

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
  await page.waitForTimeout(1200)

  // ── Section background = GlobeReach navy? ───────────────────────────────────
  const bg = await page.evaluate(() => {
    const p = getComputedStyle(document.querySelector('#promise')).backgroundColor
    const g = getComputedStyle(document.querySelector('#reach')).backgroundColor
    // also confirm no residual bg-effect layers exist
    const layers = ['.promise-pillar', '.promise-scrim', '.promise-bg', '.promise-glow']
      .filter((s) => document.querySelector(`#promise ${s}`))
    return { p, g, layers }
  })
  console.log(`  Promise bg=${bg.p}  GlobeReach bg=${bg.g}`)
  if (bg.p === bg.g) ok('Promise background === GlobeReach background (same navy)')
  else fail(`bg mismatch: Promise ${bg.p} vs GlobeReach ${bg.g}`)
  if (bg.p === 'rgb(15, 36, 68)') ok('navy is #0F2444 (var(--navy))'); else fail(`navy is ${bg.p}, expected rgb(15,36,68)`)
  if (!bg.layers.length) ok('no residual background-effect layers in #promise')
  else fail('leftover bg layers: ' + bg.layers.join(', '))

  // ── Contrast of every text node against the flat navy ───────────────────────
  const nodes = await page.evaluate(() => {
    const sel = ['.promise-eyebrow', '.promise-quote .pq-light', '.promise-quote .pq-bold', '.promise-support', '.promise-attr']
    const bg = getComputedStyle(document.querySelector('#promise')).backgroundColor
    const out = []
    for (const s of sel) {
      const el = document.querySelector(`#promise ${s}`)
      if (!el) continue
      const cs = getComputedStyle(el)
      out.push({ sel: s, color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight, text: el.textContent.trim().slice(0, 28) })
    }
    return { bg, out }
  })
  const bgc = parseRGB(nodes.bg)
  const bgL = lum(bgc.r, bgc.g, bgc.b)
  console.log('  CONTRAST vs flat navy:')
  for (const n of nodes.out) {
    const fg = parseRGB(n.color)
    const eff = over(fg, bgc)
    const cr = contrast(lum(eff.r, eff.g, eff.b), bgL)
    const large = n.size >= 24 || (n.size >= 18.66 && (n.weight === '700' || Number(n.weight) >= 700))
    const floor = large ? 3.0 : 4.5
    const pass = cr >= floor
    if (!pass) failures++
    console.log(`    ${n.sel.padEnd(26)} ${n.color.padEnd(22)} ${String(n.size)+'px'} w${n.weight} → ${cr.toFixed(2)}:1 (floor ${floor}) [${pass ? 'PASS' : 'FAIL'}]  "${n.text}"`)
  }

  // ── Screenshots: full Promise + both boundaries ─────────────────────────────
  const promiseEl = await page.$('#promise')
  await promiseEl.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await promiseEl.screenshot({ path: `${OUT}/promise-${lng}.png` })
  ok(`shot promise-${lng}.png`)

  const boundary = async (topSel, name) => {
    const y = await page.evaluate((s) => {
      const el = document.querySelector(s)
      const r = el.getBoundingClientRect()
      return window.scrollY + r.top
    }, topSel)
    await page.evaluate((ty) => window.scrollTo(0, ty - 371), y) // seam ~viewport centre
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${OUT}/${name}-${lng}.png` })
    ok(`shot ${name}-${lng}.png (seam ~centre)`)
  }
  await boundary('#promise', 'reach-promise')        // GlobeReach → Promise
  // Promise → Process3D: the section right after #promise
  const procSel = await page.evaluate(() => {
    const p = document.querySelector('#promise')
    let n = p.nextElementSibling
    while (n && n.tagName !== 'SECTION' && !n.querySelector?.('section')) n = n.nextElementSibling
    const sec = n?.tagName === 'SECTION' ? n : n?.querySelector('section')
    return sec ? '#' + (sec.id || '') : null
  })
  if (procSel && procSel !== '#') await boundary(procSel, 'promise-process')
  else {
    // fallback: scroll just past promise bottom
    const y = await page.evaluate(() => { const p = document.querySelector('#promise'); return window.scrollY + p.getBoundingClientRect().bottom })
    await page.evaluate((ty) => window.scrollTo(0, ty - 371), y)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${OUT}/promise-process-${lng}.png` })
    ok(`shot promise-process-${lng}.png (fallback)`)
  }

  // ── console + axe ───────────────────────────────────────────────────────────
  if (!consoleErrors.length) ok('zero console errors')
  else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 6).forEach((e) => console.log('      · ' + e)) }

  const axe = await new AxeBuilder({ page }).include('#promise').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe (#promise): zero violations')
  else { fail(`axe: ${axe.violations.length} violations`); for (const v of axe.violations) console.log(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`) }

  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
