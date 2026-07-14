import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

const PORT = process.argv[2] || '5199'
const OUT = 'shots/lane7b'
fs.mkdirSync(OUT, { recursive: true })

const PHRASE = { en: 'Printed in India', fr: 'Imprimé en Inde' }
const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

// Book-vs-header overlap probe, reused at several viewports.
async function bookOverlap(page) {
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#services').offsetTop - 8))
  await page.waitForTimeout(500)
  return page.evaluate(() => {
    const book = [...document.querySelectorAll('#hero img')].find((i) => i.className.includes('z-[1]'))
    const eyebrow = document.querySelector('#services .wwp-eyebrow')
    const title = document.querySelector('#services .wwp-title')
    const br = book?.getBoundingClientRect()
    const er = eyebrow?.getBoundingClientRect()
    const tr = title?.getBoundingClientRect()
    const clip = book ? (parseFloat((getComputedStyle(book).clipPath.match(/(\d+(?:\.\d+)?)%/) || [])[1]) || 0) : 0
    const visBottom = br ? br.top + br.height * (1 - clip / 100) : null
    return {
      visBottom: Math.round(visBottom),
      eyebrowTop: Math.round(er.top),
      titleTop: Math.round(tr.top),
      overEyebrow: Math.round(visBottom - er.top),
      overTitle: Math.round(visBottom - tr.top),
    }
  })
}

for (const lng of ['en', 'fr']) {
  console.log(`\n=== ${lng.toUpperCase()} (1536×743) ===`)
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

  await page.addInitScript((l) => {
    try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {}
  }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.conv-scroll', { timeout: 30000 })
  await page.waitForTimeout(1500)

  // ── Section order (Lane 7 win) ──────────────────────────────────────────────
  const order = await page.evaluate(() => {
    const main = document.querySelector('main#main')
    return [...main.children].map((el) => {
      if (el.tagName !== 'SECTION') { const s = el.querySelector('section'); if (s) el = s; else return null }
      return el.id || el.className.split(' ')[0] || el.tagName.toLowerCase()
    }).filter(Boolean)
  })
  console.log('  order:', order.join(' → '))
  const iServices = order.indexOf('services')
  const iProc = order.findIndex((x) => /conv|process/i.test(x))
  const iProjects = order.indexOf('projects')
  if (iServices === 1) ok('WhatWePrint (#services) is 2nd section (after Hero)'); else fail(`#services at ${iServices}, expected 1`)
  if (iProc >= 0 && iProjects === iProc + 1) ok('Process3D immediately before Projects'); else fail(`Process idx ${iProc}, Projects ${iProjects}`)

  // ── WhatWePrint: horizontal row restored, native scroller, NO pin ───────────
  const wwp = await page.evaluate(() => {
    const sec = document.querySelector('#services')
    const vp = sec.querySelector('.wwp-viewport')
    const track = sec.querySelector('.wwp-track')
    const cards = sec.querySelectorAll('.wwp-card')
    const cs = vp ? getComputedStyle(vp) : null
    return {
      secHeight: Math.round(sec.getBoundingClientRect().height),
      hasTrack: !!track,
      hasViewport: !!vp,
      cardCount: cards.length,
      overflowX: cs?.overflowX,
      snap: cs?.scrollSnapType,
      scrollable: vp ? vp.scrollWidth - vp.clientWidth : 0,
      role: vp?.getAttribute('role'),
      ariaLabel: vp?.getAttribute('aria-label'),
      tabindex: vp?.getAttribute('tabindex'),
      viewportH: window.innerHeight,
    }
  })
  console.log(`  WWP secH=${wwp.secHeight} cards=${wwp.cardCount} overflowX=${wwp.overflowX} snap=${wwp.snap} scrollable=${wwp.scrollable}px`)
  console.log(`  region role=${wwp.role} aria-label=${JSON.stringify(wwp.ariaLabel)} tabindex=${wwp.tabindex}`)
  if (wwp.hasTrack && wwp.hasViewport) ok('horizontal row restored (.wwp-track in .wwp-viewport)'); else fail('row structure missing')
  if (wwp.cardCount === 10) ok('10 category cards in one row'); else fail(`card count ${wwp.cardCount}`)
  if (wwp.overflowX === 'auto' || wwp.overflowX === 'scroll') ok('row is a native horizontal scroller (overflow-x)'); else fail('overflow-x not scroll: ' + wwp.overflowX)
  if (wwp.scrollable > 0) ok(`row overflows (${wwp.scrollable}px of horizontal scroll — cards peek/scroll)`); else fail('row does not overflow')
  if (wwp.role === 'region' && wwp.ariaLabel) ok(`scroller labelled region ("${wwp.ariaLabel}")`); else fail('missing role/aria-label')
  if (wwp.tabindex === '0') ok('row focusable (tabindex=0 → arrow keys scroll it)'); else fail('row not focusable')
  if (wwp.secHeight < wwp.viewportH * 2) ok(`section height natural (${wwp.secHeight}px < 2×viewport) — NO pin/scroll-jack`); else fail(`section too tall (${wwp.secHeight}px) — pin?`)

  // ── Vertical page scroll never stalls against WWP (no pin) ───────────────────
  const stall = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const top = document.querySelector('#services').offsetTop - 200
    window.scrollTo(0, top); await sleep(120)
    let last = window.scrollY, stalled = false
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, 60); await sleep(60)
      if (window.scrollY <= last + 1) { stalled = true; break }
      last = window.scrollY
    }
    return stalled
  })
  if (!stall) ok('vertical scroll advances through WWP with no stall (no pin trap)'); else fail('vertical scroll stalled at WWP')

  // ── Row scrollLeft can reach scrollWidth (all 10 cards reachable) ────────────
  const rowReach = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const vp = document.querySelector('.wwp-viewport')
    vp.scrollTo({ left: vp.scrollWidth, behavior: 'instant' }); await sleep(400)
    const max = vp.scrollWidth - vp.clientWidth
    const reached = vp.scrollLeft >= max - 2
    const lastCard = vp.querySelectorAll('.wwp-card')[9]
    const lastVisible = lastCard.getBoundingClientRect().right <= vp.getBoundingClientRect().right + 2
    vp.scrollTo({ left: 0, behavior: 'instant' }); await sleep(150)
    return { reached, lastVisible, max: Math.round(max) }
  })
  if (rowReach.reached) ok(`row reaches its end (scrollLeft → ${rowReach.max}px max)`); else fail('row cannot reach end')
  if (rowReach.lastVisible) ok('last card (Packaging) fully in view at row end'); else fail('last card not reachable')

  // ── Arrow buttons move the row ───────────────────────────────────────────────
  const arrows = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const vp = document.querySelector('.wwp-viewport')
    const [prev, next] = document.querySelectorAll('.wwp-arrow')
    vp.scrollLeft = 0; await sleep(120)
    next.click(); await sleep(400)
    const afterNext = vp.scrollLeft
    prev.click(); await sleep(400)
    const afterPrev = vp.scrollLeft
    return { afterNext: Math.round(afterNext), afterPrev: Math.round(afterPrev), moved: afterNext > 200, back: afterPrev < afterNext }
  })
  if (arrows.moved) ok(`→ arrow scrolls the row one card (to ${arrows.afterNext}px)`); else fail('next arrow did not scroll')
  if (arrows.back) ok(`← arrow scrolls back (to ${arrows.afterPrev}px)`); else fail('prev arrow did not scroll back')

  // ── Hero → WWP: no collision ────────────────────────────────────────────────
  const ov = await bookOverlap(page)
  console.log(`  boundary: book visible bottom=${ov.visBottom} eyebrow top=${ov.eyebrowTop} title top=${ov.titleTop}`)
  if (ov.overEyebrow < 0) ok(`hero book clears the eyebrow by ${-ov.overEyebrow}px (no overlap)`); else fail(`book overlaps eyebrow by ${ov.overEyebrow}px`)

  // ── Lane 7 wins re-asserted ─────────────────────────────────────────────────
  const dedupe = await page.evaluate((phrase) => {
    const reach = document.querySelector('#reach .gr-title')?.textContent || ''
    const proj = document.querySelector('#projects .proj-title')?.textContent || ''
    return { reachHas: reach.includes(phrase), projHas: proj.includes(phrase) }
  }, PHRASE[lng])
  if (dedupe.reachHas && !dedupe.projHas) ok(`"${PHRASE[lng]}…" once, in GlobeReach only`); else fail(`dedupe wrong reach=${dedupe.reachHas} proj=${dedupe.projHas}`)

  const hdfc = await page.evaluate(() => (document.body.textContent || '').includes('HDFC'))
  if (hdfc) ok('HDFC present (compliance gate open)'); else fail('HDFC not found')

  const statsAfterPromise = await page.evaluate(() => {
    const stats = document.querySelector('.ts-stats')
    const promise = document.querySelector('.promise')
    return stats && promise && (promise.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  if (statsAfterPromise) ok('stats block sits after the mission band (Promise)'); else fail('stats not after Promise')

  const homeLink = await page.evaluate(() => {
    const first = document.querySelector('header nav a')
    return { text: first?.textContent.trim(), href: first?.getAttribute('href'), aria: first?.getAttribute('aria-current') }
  })
  const homeOk = homeLink.href === '/' && (homeLink.text === 'Home' || homeLink.text === 'Accueil')
  if (homeOk) ok(`Home link leads the nav (${JSON.stringify(homeLink.text)}, aria-current=${homeLink.aria})`); else fail('Home nav link wrong: ' + JSON.stringify(homeLink))

  // ── Screenshots ─────────────────────────────────────────────────────────────
  // (a) hero/WWP boundary — heading clear of the book
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#services').offsetTop - 40))
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/boundary-${lng}.png` })
  // (b) row at rest — last card cut at the right edge
  await page.evaluate(() => { const vp = document.querySelector('.wwp-viewport'); vp.scrollLeft = 0; document.querySelector('#services').scrollIntoView() })
  await page.waitForTimeout(400)
  await (await page.$('#services')).screenshot({ path: `${OUT}/row-rest-${lng}.png` })
  // (c) row scrolled to its end
  await page.evaluate(() => { const vp = document.querySelector('.wwp-viewport'); vp.scrollLeft = vp.scrollWidth })
  await page.waitForTimeout(500)
  await (await page.$('#services')).screenshot({ path: `${OUT}/row-end-${lng}.png` })

  // ── console / axe ────────────────────────────────────────────────────────────
  if (!consoleErrors.length) ok('zero console errors'); else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 6).forEach((e) => console.log('      · ' + e)) }
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  // The pre-existing MapLibre aria-hidden canvas node is known/out of scope.
  const viol = axe.violations.filter((v) => !(v.id === 'aria-hidden-focus' || v.nodes.some((n) => /maplibre|mapboxgl|canvas/i.test(n.html))))
  if (!viol.length) ok(`axe: zero new violations (${axe.violations.length} total incl. known globe)`)
  else { fail(`axe: ${viol.length} NEW violations`); for (const v of viol) { console.log(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`); for (const n of v.nodes) console.log('        ', n.target.join(' '), '·', n.html.slice(0, 120)) } }

  await ctx.close()
}

// ── Boundary at 1366×768 and 1920×1080 (EN) — no overlap either ───────────────
for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  console.log(`\n=== boundary ${w}×${h} (EN) ===`)
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  const ov = await bookOverlap(page)
  console.log(`  book visible bottom=${ov.visBottom} eyebrow top=${ov.eyebrowTop}`)
  if (ov.overEyebrow < 0) ok(`clears eyebrow by ${-ov.overEyebrow}px`); else fail(`overlaps eyebrow by ${ov.overEyebrow}px`)
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#services').offsetTop - 40))
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/boundary-${w}x${h}.png` })
  await ctx.close()
}

// ── Reduced motion: snap/smooth degrade to instant ───────────────────────────
console.log(`\n=== prefers-reduced-motion ===`)
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  const rm = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.wwp-viewport'))
    return { snap: cs.scrollSnapType, behavior: cs.scrollBehavior }
  })
  if (rm.snap === 'none') ok('reduced motion: scroll-snap disabled'); else fail('snap still ' + rm.snap)
  if (rm.behavior === 'auto') ok('reduced motion: smooth-scroll disabled (instant)'); else fail('behavior still ' + rm.behavior)
  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
