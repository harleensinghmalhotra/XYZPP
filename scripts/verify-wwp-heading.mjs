// WHAT WE PRINT — heading-vs-nav acceptance harness.
// Proves: at NO scroll position is any part of the heading (or the right-side
// intro copy) painted under the sticky nav; font-size and the heading↔cards
// padding are byte-for-byte unchanged; EN + FR; reduced motion; no console errors.
//
// Paint-aware rule: the pinned panel's top edge sits on the nav's bottom line and
// clips with overflow:hidden, so the "occluded" test is whether any heading pixel
// is actually PAINTED in the nav band [0, navBottom] — i.e. visible-top (rect top
// clamped to the panel's clip edge) lands above the nav bottom while the element
// still has area there. A heading that has slid up is clipped AT the nav line, not
// under it, and must read as fully faded before it gets there.
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'http://localhost:5200'
const out = resolve(root, 'shots', 'wwp-heading-fix')
const BREATHING = 24 // px required below the nav for the resting heading

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const pass = (m) => console.log('  ✓ ' + m)

async function measureFrame(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s)
    const panel = q('.wwp-sticky').getBoundingClientRect()
    const nav = (document.querySelector('header.sticky') || document.querySelector('header')).getBoundingClientRect()
    const clipTop = panel.top // overflow:hidden clips here
    // opacity of the header (faded heading paints nothing even inside the band)
    const headOpacity = parseFloat(getComputedStyle(q('.wwp-head')).opacity)
    const check = (sel) => {
      const r = q(sel).getBoundingClientRect()
      const visTop = Math.max(r.top, clipTop)          // first painted row
      const hasAreaInBand = r.bottom > 0 && visTop < nav.bottom - 0.5
      // painted under nav = visible area sits in the nav band AND it's actually inked
      const paintedUnderNav = hasAreaInBand && headOpacity > 0.02 && visTop < nav.bottom - 0.5 && clipTop < nav.bottom - 0.5
      return { visTop: Math.round(visTop), rectTop: Math.round(r.top), paintedUnderNav }
    }
    return {
      navBottom: Math.round(nav.bottom),
      panelTop: Math.round(panel.top),
      panelClipsAtNav: Math.abs(panel.top - nav.bottom) < 1.5,
      headOpacity: Math.round(headOpacity * 100) / 100,
      title: check('.wwp-title'),
      eyebrow: check('.wwp-eyebrow'),
      lede: check('.wwp-lede'),
      revealY: (() => { const m = new DOMMatrix(getComputedStyle(q('.wwp-inner')).transform); return Math.round(m.m42) })(),
      trackX: (() => { const m = new DOMMatrix(getComputedStyle(q('.wwp-track')).transform); return Math.round(m.m41) })(),
    }
  })
}

async function runLang(lang) {
  console.log(`\n── ${lang.toUpperCase()} ──────────────────────────────────────────`)
  const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript((lng) => localStorage.setItem('qfp.lang', lng), lang)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)

  // ── font-size + padding proofs (must be UNCHANGED) ──
  const proof = await page.evaluate(() => {
    const cs = (s) => getComputedStyle(document.querySelector(s))
    return {
      titleFont: cs('.wwp-title').fontSize,
      nameFont: cs('.wwp-name').fontSize,
      lineFont: cs('.wwp-line').fontSize,
      eyebrowFont: cs('.wwp-eyebrow').fontSize,
      vpMarginTop: cs('.wwp-viewport').marginTop,
      vpPaddingTop: cs('.wwp-viewport').paddingTop,
      nameMarginTop: cs('.wwp-name').marginTop,
    }
  })
  console.log('  computed:', JSON.stringify(proof))
  if (proof.titleFont === '68px') pass(`heading font-size ${proof.titleFont} (clamp max @1536, unchanged)`)
  else fail(`heading font-size ${proof.titleFont} — expected 68px`)
  if (proof.vpMarginTop === '56px') pass('heading↔cards margin-top 56px (unchanged)')
  else fail(`heading↔cards margin-top ${proof.vpMarginTop} — expected 56px`)
  if (proof.vpPaddingTop === '120px') pass('image-pop padding-top 120px (unchanged)')
  else fail(`image-pop padding-top ${proof.vpPaddingTop} — expected 120px`)

  // ── geometry ──
  const g = await page.evaluate(() => {
    const s = document.getElementById('services')
    return { top: s.getBoundingClientRect().top + window.scrollY, h: s.offsetHeight, winH: innerHeight }
  })

  // ── 14-frame sweep through the whole pinned range ──
  const start = g.top - Math.round(g.winH * 0.2)
  const end = g.top + g.h - g.winH + 40
  const N = 14
  let worstResting = Infinity
  let sawClearHeading = false
  for (let i = 0; i <= N; i++) {
    const y = Math.round(start + ((end - start) * i) / N)
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(110)
    const m = await measureFrame(page)
    const bad = m.title.paintedUnderNav || m.eyebrow.paintedUnderNav || m.lede.paintedUnderNav
    if (bad) fail(`frame ${i} (y=${y}): heading/copy PAINTED under nav — title ${JSON.stringify(m.title)} eyebrow ${JSON.stringify(m.eyebrow)} lede ${JSON.stringify(m.lede)}`)
    // While the panel is PINNED (top edge on the nav line, ±1.5px) it must clip at
    // the nav so nothing paints under it. Once the section releases and scrolls
    // away (panelTop drifts above the nav line), the cards leaving under the nav is
    // normal section-exit behaviour — the heading is already gone, so we don't gate
    // on the panel there; the heading-paint check above stays authoritative.
    const pinned = Math.abs(m.panelTop - m.navBottom) < 6
    if (pinned && !m.panelClipsAtNav) {
      fail(`frame ${i}: pinned panel not clipping at nav (panelTop ${m.panelTop}, navBottom ${m.navBottom})`)
    }
    // resting-heading breathing: when the heading is fully opaque & below the nav
    if (m.headOpacity > 0.98 && m.title.rectTop >= m.navBottom) {
      sawClearHeading = true
      worstResting = Math.min(worstResting, m.title.rectTop - m.navBottom)
    }
  }
  if (!failures) pass(`${N + 1}-frame sweep: no heading/copy pixel painted under the nav`)
  if (sawClearHeading) {
    if (worstResting >= BREATHING) pass(`resting heading clears nav by ${worstResting}px (≥ ${BREATHING}px breathing)`)
    else fail(`resting heading breathing ${worstResting}px < ${BREATHING}px`)
  } else fail('never saw a fully-opaque resting heading below the nav')

  // ── before/after style shot at Harry's clip position (section top + 200) ──
  await page.evaluate((y) => window.scrollTo(0, y + 200), g.top)
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, `after-${lang}-hold.png`) })

  console.log(`  console errors: ${errors.length}`)
  errors.slice(0, 5).forEach((e) => console.log('    ! ' + e))
  if (errors.length) fail(`${errors.length} console error(s)`)
  await page.close()
}

await runLang('en')
await runLang('fr')

// ── reduced motion: no pin, heading in normal flow, never frozen-clipped ──
console.log('\n── REDUCED MOTION ───────────────────────────────────────')
{
  const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  const info = await page.evaluate(() => {
    const el = document.getElementById('services')
    el.scrollIntoView({ block: 'center' })
    return {
      stickyPosition: getComputedStyle(el.querySelector('.wwp-sticky')).position,
      titleFont: getComputedStyle(el.querySelector('.wwp-title')).fontSize,
      vpMarginTop: getComputedStyle(el.querySelector('.wwp-viewport')).marginTop,
    }
  })
  console.log('  reduced state:', JSON.stringify(info))
  if (info.stickyPosition === 'static') pass('reduced motion → no pin (static)')
  else fail(`reduced motion sticky position ${info.stickyPosition} — expected static`)
  await page.evaluate(() => document.getElementById('services').scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, 'after-reduced.png') })
  if (errors.length) fail(`${errors.length} console error(s) in reduced motion`)
  else pass('reduced motion: 0 console errors')
  await page.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : `❌ ${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
