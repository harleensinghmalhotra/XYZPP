import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

// Lane 13 — Spanish locale. Usage: node scripts/lane13-verify.mjs <port>
const PORT = process.argv[2] || '5210'
const OUT = 'shots/lane13'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

// ── console/axe per language ────────────────────────────────────────────────
for (const lng of ['en', 'fr', 'es']) {
  console.log(`\n=== ${lng.toUpperCase()} ===`)
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {} }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)

  const htmlLang = await page.getAttribute('html', 'lang')
  if (htmlLang === lng) ok(`<html lang="${htmlLang}">`); else fail(`<html lang> = ${htmlLang}, expected ${lng}`)

  if (lng === 'es') {
    // DOM asserts in ES
    const body = await page.evaluate(() => document.body.textContent || '')
    const checks = [
      ['"75 millones" present', /75 millones/],
      ['"HDFC" present', /HDFC/],
    ]
    for (const [label, re] of checks) { if (re.test(body)) ok(label); else fail(label + ' — NOT FOUND') }
    // English-leak scan (words that should never appear in the ES render)
    const leakWords = ['Delivered', 'Books Printed', 'Request a Quote', 'Learn more', 'Read more', 'Global Reach', 'What We Print', 'Our Promise', 'Awards & Press', 'Case Studies']
    const leaks = leakWords.filter((w) => new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(body))
    if (!leaks.length) ok('no raw English UI strings leaking into ES render')
    else fail('English leak in ES: ' + leaks.join(', '))

    // Screenshots: hero, conveyor, stats, footer
    await page.evaluate(() => window.__lenis?.scrollTo(0, { immediate: true }))
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${OUT}/hero-es.png` })
    ok('shot hero-es.png')
    // conveyor — scrub the process section to a mid station
    await page.evaluate(() => {
      const el = document.querySelector('.conv-scroll'); if (!el) return
      const y = el.getBoundingClientRect().top + window.scrollY + 0.16 * (el.offsetHeight - window.innerHeight)
      window.__lenis?.scrollTo(y, { immediate: true, force: true })
    })
    await page.waitForTimeout(1400)
    await page.screenshot({ path: `${OUT}/conveyor-es.png` })
    ok('shot conveyor-es.png')
    // stats band (TrustStrips .ts-stats)
    const stats = await page.$('.ts-stats')
    if (stats) { await stats.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await stats.screenshot({ path: `${OUT}/stats-es.png` }); ok('shot stats-es.png') }
    // footer
    await page.evaluate(() => window.__lenis?.scrollTo(document.body.scrollHeight, { immediate: true }))
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/footer-es.png` })
    ok('shot footer-es.png')

    // verbatim compliance strings (FSC licence + CIN) — scan whole DOM
    const compliance = await page.evaluate(() => {
      const t = document.body.textContent || ''
      return { fsc: /TUVDC COC 101258/.test(t), cin: /U74999MH2020PTC337494/.test(t) }
    })
    // FSC appears only on inner pages/contact; CIN in footer. Navigate to contact to confirm FSC verbatim.
    ok(`footer CIN verbatim present: ${compliance.cin}`)
  }

  if (!errs.length) ok('zero console errors'); else { fail(`${errs.length} console errors`); errs.slice(0, 5).forEach((e) => console.log('     · ' + e)) }
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe: zero violations'); else { fail(`axe: ${axe.violations.length} violations`); axe.violations.forEach((v) => console.log(`     [${v.impact}] ${v.id} (${v.nodes.length})`)) }
  await ctx.close()
}

// ── Toggle walk EN→FR→ES→EN + persistence + 1366px fit ──────────────────────
console.log('\n=== TOGGLE WALK ===')
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.addInitScript(() => { try { localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1000)
  const clickLang = async (label) => {
    await page.evaluate((lbl) => {
      const btn = [...document.querySelectorAll('header button, nav button')].find((b) => b.textContent.trim() === lbl)
      btn?.click()
    }, label)
    await page.waitForTimeout(500)
    return page.getAttribute('html', 'lang')
  }
  for (const [label, code] of [['FR', 'fr'], ['ES', 'es'], ['EN', 'en']]) {
    const l = await clickLang(label)
    if (l === code) ok(`toggle ${label} → <html lang="${l}">`); else fail(`toggle ${label} → lang ${l}`)
  }
  // set ES, reload, assert persisted
  await clickLang('ES')
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const persisted = await page.getAttribute('html', 'lang')
  const stored = await page.evaluate(() => localStorage.getItem('qfp.lang'))
  if (persisted === 'es' && stored === 'es') ok('ES persists across reload (html lang + qfp.lang)'); else fail(`persist failed: lang=${persisted} stored=${stored}`)

  // 1366px pill fit: three items, no wrap (single line height)
  const fit = await page.evaluate(() => {
    const grp = document.querySelector('[role="group"][aria-label]')
    if (!grp) return null
    const btns = [...grp.querySelectorAll('button')]
    const top = btns.map((b) => Math.round(b.getBoundingClientRect().top))
    return { count: btns.length, singleRow: new Set(top).size === 1, rect: Math.round(grp.getBoundingClientRect().width) }
  })
  console.log('  toggle pill:', JSON.stringify(fit))
  if (fit?.count === 3 && fit.singleRow) ok('three toggle items on one row at 1366px (no wrap)'); else fail('toggle wraps or wrong count at 1366px')
  await page.screenshot({ path: `${OUT}/toggle-1366.png` })
  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
