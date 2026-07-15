import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

// Lane 15 — Track Record heading + Infrastructure book-stack. Usage:
//   node scripts/lane15-verify.mjs <port>
const PORT = process.argv[2] || '5215'
const OUT = 'shots/lane15'
fs.mkdirSync(OUT, { recursive: true })

let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

// ── 1. LOCALE PARITY (EN/FR/ES) — structural, before touching the browser ─────
console.log('\n=== PARITY ===')
const load = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const keysOf = (o, pre = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? keysOf(v, pre + k + '.') : [pre + k])
for (const ns of ['homeProjects', 'homeInfraSection']) {
  const en = load(`src/locales/en/${ns}.json`)
  const fr = load(`src/locales/fr/${ns}.json`)
  const es = load(`src/locales/es/${ns}.json`)
  const ke = new Set(keysOf(en)), kf = new Set(keysOf(fr)), kEs = new Set(keysOf(es))
  const miss = (a, b) => [...a].filter((k) => !b.has(k))
  const d1 = miss(ke, kf), d2 = miss(kf, ke), d3 = miss(ke, kEs), d4 = miss(kEs, ke)
  if (!d1.length && !d2.length && !d3.length && !d4.length) ok(`${ns}: EN/FR/ES key parity (${ke.size} keys)`)
  else fail(`${ns}: parity gaps → FR missing [${d1}] extra [${d2}]; ES missing [${d3}] extra [${d4}]`)
}
// the new book keys exist
{
  const en = load('src/locales/en/homeInfraSection.json')
  const has = en.books?.ui?.pageWord && en.books['04']?.title && en.books['05']?.cover
  if (has) ok('homeInfraSection.books.{ui,04,05} present'); else fail('books keys missing')
}

const browser = await chromium.launch({ headless: false })

// scroll the Infrastructure section into view and settle its reveal
const showInfra = async (page) => {
  await page.evaluate(() => {
    const el = document.querySelector('#infrastructure')
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 40
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  })
  await page.waitForTimeout(900)
}
const clickSpine = (page, n) => page.evaluate((num) => {
  const b = [...document.querySelectorAll('button.ib-spine')].find(
    (el) => el.querySelector('.ib-spine-num')?.textContent.trim() === num)
  b?.click()
}, n)

// ── 2. PER-LANGUAGE: console, axe, heading assert ─────────────────────────────
const HEAD = {
  en: { want: 'Worldwide Deliveries', bad: "Where We've" },
  fr: { want: 'Livraisons mondiales', bad: 'Là où nous' },
  es: { want: 'Entregas mundiales', bad: 'Donde hemos' },
}
for (const lng of ['en', 'fr', 'es']) {
  console.log(`\n=== ${lng.toUpperCase()} ===`)
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {} }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1000)

  // Track Record heading — scroll #projects into view so its reveal fires first
  await page.evaluate(() => {
    const el = document.querySelector('#projects')
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 40
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  })
  await page.waitForTimeout(900)
  const head = await page.evaluate(() => (document.querySelector('.proj-title')?.innerText || '').replace(/\s+/g, ' ').trim())
  const { want, bad } = HEAD[lng]
  if (head.includes(want)) ok(`heading contains "${want}"`); else fail(`heading = "${head}" — expected "${want}"`)
  if (!head.includes(bad)) ok(`heading no longer contains "${bad}"`); else fail(`stale heading "${bad}" still present`)

  await showInfra(page)

  // book-stack region present with 5 books (open book + spines)
  const region = await page.evaluate(() => {
    const stage = document.querySelector('.ib-stage')
    if (!stage) return null
    const slots = stage.querySelectorAll('.ib-slot').length          // every book is a slot
    const gaps = stage.querySelectorAll('.ib-slot--gap').length      // the open book's gap
    const spines = stage.querySelectorAll('button.ib-spine').length  // the closed books
    const grp = stage.querySelector('[role="group"][aria-label]')
    return { slots, gaps, spines, hasGroup: !!grp, label: grp?.getAttribute('aria-label') }
  })
  if (region && region.slots === 5 && region.gaps === 1 && region.spines === 4 && region.hasGroup)
    ok(`book stack: 5 books (4 spines + 1 open/gap), group "${region.label}"`)
  else fail('book stack region malformed: ' + JSON.stringify(region))

  if (!errs.length) ok('zero console errors'); else { fail(`${errs.length} console errors`); errs.slice(0, 6).forEach((e) => console.log('     · ' + e)) }
  const axe = await new AxeBuilder({ page }).include('#infrastructure').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe (#infrastructure): zero violations'); else { fail(`axe: ${axe.violations.length} violations`); axe.violations.forEach((v) => console.log(`     [${v.impact}] ${v.id} (${v.nodes.length})`)) }
  await ctx.close()
}

// ── 3. INTERACTION SCREENSHOTS (EN) ───────────────────────────────────────────
console.log('\n=== SCREENSHOTS (EN) ===')
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(800)
  await showInfra(page)
  const stage = await page.$('.ib-stage')

  // rest: book 01 open to its cover, spines 02–05 on the shelf (one is the gap)
  await stage.screenshot({ path: `${OUT}/stack-rest.png` }); ok('shot stack-rest.png')

  // book 1, page 1 (cover) is the rest state → alias shot for the report
  await stage.screenshot({ path: `${OUT}/book1-p1.png` }); ok('shot book1-p1.png (cover)')

  // flip to page 2 (overview / body copy) via the next arrow
  await page.click('.ib-arrow--next')
  await page.waitForTimeout(800)
  await stage.screenshot({ path: `${OUT}/book1-p2.png` }); ok('shot book1-p2.png (overview)')

  // flip to page 3 (at a glance) to prove 3 leaves
  await page.click('.ib-arrow--next')
  await page.waitForTimeout(800)
  await stage.screenshot({ path: `${OUT}/book1-p3.png` }); ok('shot book1-p3.png (at a glance)')

  // switch book 1 → book 2 (click its spine); confirm the open book changed
  const before = await page.evaluate(() => document.querySelector('.ib-page--left .ib-title, .ib-page--left .ib-glance')?.textContent || '')
  await clickSpine(page, '02')
  await page.waitForTimeout(800)
  const after = await page.evaluate(() => document.querySelector('.ib-page--left .ib-title')?.textContent || '')
  if (after && after !== before) ok(`click-to-switch works: book 2 cover = "${after}"`); else fail(`switch failed: before="${before}" after="${after}"`)
  await stage.screenshot({ path: `${OUT}/book2-switched.png` }); ok('shot book2-switched.png')

  // open a reserved book (04) → placeholder "coming soon" state, no error
  await clickSpine(page, '04')
  await page.waitForTimeout(700)
  const soon = await page.evaluate(() => document.querySelector('.ib-page--left')?.textContent || '')
  if (/coming soon/i.test(soon)) ok('book 04 opens to placeholder "coming soon"'); else fail('book 04 placeholder missing: ' + soon)
  await stage.screenshot({ path: `${OUT}/book4-empty.png` }); ok('shot book4-empty.png')
  await ctx.close()
}

// ── 4. KEYBOARD WALK (EN) — focus the stack, flip, switch, all via keyboard ───
console.log('\n=== KEYBOARD (EN) ===')
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(800)
  await showInfra(page)
  const stage = await page.$('.ib-stage')

  // focus the interactive group directly, then flip with the arrow keys
  await page.evaluate(() => document.querySelector('.ib-interactive')?.focus())
  await page.waitForTimeout(300)
  await stage.screenshot({ path: `${OUT}/kbd-1-group-focus.png` }); ok('shot kbd-1-group-focus.png (group focus ring)')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(800)
  const p2 = await page.evaluate(() => document.querySelector('.ib-counter')?.textContent || '')
  if (/0?2/.test(p2)) ok(`ArrowRight flipped to page 2 (counter "${p2.replace(/\s+/g, ' ').trim()}")`); else fail('ArrowRight did not flip: ' + p2)
  await stage.screenshot({ path: `${OUT}/kbd-2-flipped.png` }); ok('shot kbd-2-flipped.png')

  // Tab to a spine button, screenshot its focus ring, Enter to switch books
  await page.evaluate(() => document.querySelector('button.ib-spine')?.focus())
  await page.waitForTimeout(300)
  await stage.screenshot({ path: `${OUT}/kbd-3-spine-focus.png` }); ok('shot kbd-3-spine-focus.png (spine focus ring)')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(800)
  const switched = await page.evaluate(() => document.querySelector('.ib-page--left .ib-title')?.textContent || '')
  if (switched) ok(`Enter on a spine switched books → "${switched}"`); else fail('keyboard book switch failed')
  await stage.screenshot({ path: `${OUT}/kbd-4-switched.png` }); ok('shot kbd-4-switched.png')

  // focus an arrow button → focus ring visible
  await page.evaluate(() => document.querySelector('.ib-arrow--next')?.focus())
  await page.waitForTimeout(250)
  await stage.screenshot({ path: `${OUT}/kbd-5-arrow-focus.png` }); ok('shot kbd-5-arrow-focus.png (arrow focus ring)')
  await ctx.close()
}

// ── 5. REDUCED MOTION (EN) — content reachable without the leaf turn ──────────
console.log('\n=== REDUCED MOTION (EN) ===')
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(800)
  await showInfra(page)
  const stage = await page.$('.ib-stage')
  await stage.screenshot({ path: `${OUT}/reduced-rest.png` }); ok('shot reduced-rest.png')
  // flip via arrow — crossfade only, content must land readable
  await page.click('.ib-arrow--next')
  await page.waitForTimeout(500)
  const body = await page.evaluate(() => document.querySelector('.ib-page--left')?.textContent || '')
  if (body.trim().length > 20) ok('reduced-motion: page 2 content readable after crossfade'); else fail('reduced-motion content empty')
  await stage.screenshot({ path: `${OUT}/reduced-p2.png` }); ok('shot reduced-p2.png')
  if (!errs.length) ok('reduced-motion: no page errors'); else fail('reduced-motion errors: ' + errs.join('; '))
  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
