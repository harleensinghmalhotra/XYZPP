import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

const PORT = process.argv[2] || '5200'
const OUT = 'shots/lane7c'
fs.mkdirSync(OUT, { recursive: true })

const PHRASE = { en: 'Printed in India', fr: 'Imprimé en Inde' }
const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

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

  // ── Section order: Hero → TrustStrips → WhatWePrint → GlobeReach → … ─────────
  const order = await page.evaluate(() => {
    const main = document.querySelector('main#main')
    return [...main.children].map((el) => {
      if (el.tagName !== 'SECTION') { const s = el.querySelector('section'); if (s) el = s; else return null }
      return el.id || el.className.split(' ')[0] || el.tagName.toLowerCase()
    }).filter(Boolean)
  })
  console.log('  order:', order.join(' → '))
  const idx = (id) => order.indexOf(id)
  const wantHead = ['hero', 'trust', 'services', 'reach', 'promise', 'ts-stats']
  const headOk = wantHead.every((id, i) => order[i] === id)
  if (headOk) ok('order head = Hero → TrustStrips → WhatWePrint → GlobeReach → Promise → HomeStats')
  else fail('order head wrong: ' + order.slice(0, 6).join(' → '))
  if (idx('trust') === 1) ok('TrustStrips welded directly under Hero (2nd section)'); else fail(`#trust at ${idx('trust')}`)
  if (idx('services') === 2) ok('WhatWePrint is 3rd section (after TrustStrips)'); else fail(`#services at ${idx('services')}`)
  const iProc = order.findIndex((x) => /conv|process/i.test(x)), iProj = idx('projects')
  if (iProc >= 0 && iProj === iProc + 1) ok('Process3D immediately before Projects'); else fail(`Process ${iProc}, Projects ${iProj}`)

  // ── WWP row still a native scroller, no pin ─────────────────────────────────
  const wwp = await page.evaluate(() => {
    const sec = document.querySelector('#services')
    const vp = sec.querySelector('.wwp-viewport')
    return {
      hasTrack: !!sec.querySelector('.wwp-track'),
      overflowX: vp ? getComputedStyle(vp).overflowX : null,
      scrollable: vp ? vp.scrollWidth - vp.clientWidth : 0,
      tabindex: vp?.getAttribute('tabindex'),
      secH: Math.round(sec.getBoundingClientRect().height),
      vh: window.innerHeight,
      padTop: vp ? getComputedStyle(sec.querySelector('.wwp-inner')).paddingTop : null,
    }
  })
  if (wwp.hasTrack && (wwp.overflowX === 'auto' || wwp.overflowX === 'scroll') && wwp.scrollable > 0)
    ok(`WWP row still native scroller (overflow-x=${wwp.overflowX}, ${wwp.scrollable}px scroll)`)
  else fail('WWP scroller broken')
  if (wwp.secH < wwp.vh * 2) ok(`WWP section natural height ${wwp.secH}px (no pin)`); else fail(`WWP too tall ${wwp.secH}`)
  console.log(`  WWP wwp-inner padding-top = ${wwp.padTop} (no aspect-ratio hack gap)`)

  // ── Hero → TrustStrips weld: book lands ON the strips, not dangling ──────────
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#trust').offsetTop - 8))
  await page.waitForTimeout(500)
  const weld = await page.evaluate(() => {
    const book = [...document.querySelectorAll('#hero img')].find((i) => i.className.includes('z-[1]'))
    const trust = document.querySelector('#trust')
    const wrap = document.querySelector('#trust .ts-wrap') // gold-bordered strips box
    const br = book?.getBoundingClientRect()
    const clip = book ? (parseFloat((getComputedStyle(book).clipPath.match(/(\d+(?:\.\d+)?)%/) || [])[1]) || 0) : 0
    const visBottom = br ? br.top + br.height * (1 - clip / 100) : null
    const wr = wrap?.getBoundingClientRect()
    return { visBottom: Math.round(visBottom), wrapTop: wr ? Math.round(wr.top) : null, bandTop: Math.round(trust.getBoundingClientRect().top) }
  })
  // The book's clipped bottom should reach into the strips zone (land on/near the
  // gold-bordered box top), i.e. below the band top and around the wrap top.
  console.log(`  weld: book visible bottom=${weld.visBottom}  ts-band top=${weld.bandTop}  ts-wrap(gold box) top=${weld.wrapTop}`)
  if (weld.visBottom > weld.bandTop) ok('hero book overhangs into TrustStrips (lands on the strips, as designed)')
  else fail('book does not reach the strips — weld broken')

  // ── Lane 7 wins ─────────────────────────────────────────────────────────────
  const dedupe = await page.evaluate((phrase) => {
    const reach = document.querySelector('#reach .gr-title')?.textContent || ''
    const proj = document.querySelector('#projects .proj-title')?.textContent || ''
    return { reachHas: reach.includes(phrase), projHas: proj.includes(phrase) }
  }, PHRASE[lng])
  if (dedupe.reachHas && !dedupe.projHas) ok(`"${PHRASE[lng]}…" once, in GlobeReach only`); else fail(`dedupe reach=${dedupe.reachHas} proj=${dedupe.projHas}`)
  if (await page.evaluate(() => (document.body.textContent || '').includes('HDFC'))) ok('HDFC present'); else fail('HDFC missing')
  const statsAfter = await page.evaluate(() => {
    const s = document.querySelector('.ts-stats'), p = document.querySelector('.promise')
    return s && p && (p.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  if (statsAfter) ok('stats block after the mission band (Promise)'); else fail('stats not after Promise')
  const home = await page.evaluate(() => { const a = document.querySelector('header nav a'); return { t: a?.textContent.trim(), h: a?.getAttribute('href'), c: a?.getAttribute('aria-current') } })
  if (home.h === '/' && (home.t === 'Home' || home.t === 'Accueil')) ok(`Home leads the nav (${JSON.stringify(home.t)}, aria-current=${home.c})`); else fail('Home link wrong: ' + JSON.stringify(home))

  // ── Boundary screenshots: TrustStrips→WWP and WWP→GlobeReach ────────────────
  if (lng === 'en') {
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#services').offsetTop - 220))
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/boundary-trust-wwp.png` })
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#reach').offsetTop - 260))
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/boundary-wwp-reach.png` })
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
