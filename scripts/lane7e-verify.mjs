import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

const PORT = process.argv[2] || '5200'
const OUT = 'shots/lane7e'
fs.mkdirSync(OUT, { recursive: true })

const PHRASE = { en: 'Printed in India', fr: 'Imprimé en Inde' }
// 7e order — ts-stats is NO LONGER a top-level section (it lives inside #trust).
const WANT = ['hero', 'trust', 'reach', 'services', 'promise', 'process', 'projects', 'infrastructure', 'certifications', 'marquee', 'sustainability', 'awards', 'cases']

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

async function scrollSettle(page, id, offset) {
  await page.evaluate(([i, o]) => window.scrollTo(0, document.querySelector(i).offsetTop - o), [id, offset])
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    let prev = -1, same = 0
    for (let i = 0; i < 40 && same < 4; i++) { await sleep(80); const y = Math.round(window.scrollY); if (y === prev) same++; else { same = 0; prev = y } }
  })
  await page.waitForTimeout(200)
}

for (const lng of ['en', 'fr']) {
  console.log(`\n=== ${lng.toUpperCase()} (1536×743) ===`)
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))
  await page.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {} }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.conv-scroll', { timeout: 30000 })
  await page.waitForTimeout(1500)

  // ── Section order ───────────────────────────────────────────────────────────
  const order = await page.evaluate(() => {
    const main = document.querySelector('main#main')
    return [...main.children].map((el) => {
      if (el.tagName !== 'SECTION') { const s = el.querySelector('section'); if (s) el = s; else return null }
      return el.id || el.className.split(' ')[0] || el.tagName.toLowerCase()
    }).filter(Boolean)
  })
  console.log('  order:', order.join(' → '))
  const norm = order.map((x) => /conv|process/i.test(x) ? 'process' : x)
  if (JSON.stringify(norm) === JSON.stringify(WANT)) ok('section order matches the 7e list (no standalone stats section)')
  else fail('order mismatch\n     got : ' + norm.join(' → ') + '\n     want: ' + WANT.join(' → '))
  const iProc = norm.indexOf('process'), iProj = norm.indexOf('projects')
  if (iProc >= 0 && iProj === iProc + 1) ok('Process3D immediately before Projects'); else fail(`Process ${iProc}, Projects ${iProj}`)

  // ── Stats are the THIRD STRIP inside TrustStrips, not orphaned after Promise ──
  const stats = await page.evaluate(() => {
    const trust = document.querySelector('#trust')
    const inTrust = !!trust?.querySelector('.ts-stats')
    const all = document.querySelectorAll('.ts-stats')
    const statItems = document.querySelectorAll('.ts-stat').length
    const promise = document.querySelector('.promise')
    const st = document.querySelector('.ts-stats')
    const afterPromise = st && promise && !!(promise.compareDocumentPosition(st) & Node.DOCUMENT_POSITION_FOLLOWING)
    // order of the three strips inside the band
    const rows = [...(trust?.querySelectorAll('.ts-row, .ts-stats') || [])].map((el) => el.className.split(' ')[1] || el.className.split(' ')[0])
    return { inTrust, count: all.length, statItems, afterPromise, rows }
  })
  console.log('  trust band strips:', stats.rows.join(' → '))
  if (stats.inTrust) ok('stats bar (.ts-stats) lives INSIDE TrustStrips'); else fail('stats not inside TrustStrips')
  if (stats.count === 1) ok('exactly one .ts-stats in the DOM (no duplicate/standalone)'); else fail(`${stats.count} .ts-stats found`)
  if (stats.statItems === 4) ok('four stat items (75M / 25+ / 800+ / 98%)'); else fail(`${stats.statItems} stat items`)
  if (!stats.afterPromise) ok('stats NO LONGER after the mission band (orphan gone)'); else fail('stats still after Promise')

  // ── Hero → TrustStrips weld (book lands on gold border) ──────────────────────
  await scrollSettle(page, '#trust', 8)
  const weld = await page.evaluate(() => {
    const book = [...document.querySelectorAll('#hero img')].find((i) => i.className.includes('z-[1]'))
    const clip = book ? (parseFloat((getComputedStyle(book).clipPath.match(/(\d+(?:\.\d+)?)%/) || [])[1]) || 0) : 0
    const br = book?.getBoundingClientRect()
    const visBottom = br ? br.top + br.height * (1 - clip / 100) : null
    return { visBottom: Math.round(visBottom), bandTop: Math.round(document.querySelector('#trust').getBoundingClientRect().top) }
  })
  if (weld.visBottom > weld.bandTop) ok(`hero book lands on the strips (book bottom ${weld.visBottom} > band top ${weld.bandTop})`); else fail('weld broken')

  // ── WWP scroller intact, no pin ─────────────────────────────────────────────
  const wwp = await page.evaluate(() => { const sec = document.querySelector('#services'); const vp = sec.querySelector('.wwp-viewport'); return { hasTrack: !!sec.querySelector('.wwp-track'), overflowX: vp ? getComputedStyle(vp).overflowX : null, scrollable: vp ? vp.scrollWidth - vp.clientWidth : 0, secH: Math.round(sec.getBoundingClientRect().height), vh: window.innerHeight } })
  if (wwp.hasTrack && (wwp.overflowX === 'auto' || wwp.overflowX === 'scroll') && wwp.scrollable > 0 && wwp.secH < wwp.vh * 2) ok(`WWP row native scroller, no pin (${wwp.scrollable}px scroll, secH ${wwp.secH}px)`); else fail('WWP scroller/pin regressed')

  // ── Lane wins ───────────────────────────────────────────────────────────────
  const dedupe = await page.evaluate((phrase) => ({ reachHas: (document.querySelector('#reach .gr-title')?.textContent || '').includes(phrase), projHas: (document.querySelector('#projects .proj-title')?.textContent || '').includes(phrase) }), PHRASE[lng])
  if (dedupe.reachHas && !dedupe.projHas) ok(`"${PHRASE[lng]}…" once, in GlobeReach only`); else fail(`dedupe reach=${dedupe.reachHas} proj=${dedupe.projHas}`)
  if (await page.evaluate(() => (document.body.textContent || '').includes('HDFC'))) ok('HDFC present'); else fail('HDFC missing')
  const home = await page.evaluate(() => { const a = document.querySelector('header nav a'); return { t: a?.textContent.trim(), h: a?.getAttribute('href'), c: a?.getAttribute('aria-current') } })
  if (home.h === '/' && (home.t === 'Home' || home.t === 'Accueil')) ok(`Home leads the nav (${JSON.stringify(home.t)}, aria-current=${home.c})`); else fail('Home link wrong: ' + JSON.stringify(home))

  // ── Screenshots ─────────────────────────────────────────────────────────────
  // Full trust band (three strips as one unit) — element screenshot of #trust.
  await scrollSettle(page, '#trust', 40)
  await (await page.$('#trust')).screenshot({ path: `${OUT}/trust-band-${lng}.png` })
  // Weld viewport (book landing on gold border + strips)
  await scrollSettle(page, '#trust', 170)
  await page.screenshot({ path: `${OUT}/weld-${lng}.png` })
  if (lng === 'en') {
    // Promise → Process3D boundary (no orphan gap where the stats were)
    const procTop = await page.evaluate(() => {
      const p = document.querySelector('.promise')
      return Math.round(p.offsetTop + p.offsetHeight)
    })
    await page.evaluate((y) => window.scrollTo(0, y - 380), procTop)
    await page.evaluate(async () => { const s = (ms) => new Promise(r => setTimeout(r, ms)); let p = -1, n = 0; for (let i = 0; i < 40 && n < 4; i++) { await s(80); const y = Math.round(window.scrollY); if (y === p) n++; else { n = 0; p = y } } })
    await page.waitForTimeout(200)
    await page.screenshot({ path: `${OUT}/boundary-promise-process.png` })
  }

  if (!consoleErrors.length) ok('zero console errors'); else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 6).forEach((e) => console.log('      · ' + e)) }
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const viol = axe.violations.filter((v) => !(v.id === 'aria-hidden-focus' || v.nodes.some((n) => /maplibre|mapboxgl|canvas/i.test(n.html))))
  if (!viol.length) ok(`axe: zero new violations (${axe.violations.length} total incl. known globe)`)
  else { fail(`axe: ${viol.length} NEW`); for (const v of viol) console.log(`      [${v.impact}] ${v.id}: ${v.help}`) }

  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
