// WHAT WE PRINT — R2 acceptance harness.
// Proves: one-line heading (EN+FR, bbox height = a single line), sized in the
// display family; heading + cards pinned TOGETHER and both on screen through the
// whole horizontal scrub; heading never touches the nav at any frame; the section
// got SHORTER than R1; the dead air under the cards is gone; card contents/fonts
// untouched; reduced motion intact; zero console errors.
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'http://localhost:5200'
const out = resolve(root, 'shots', 'wwp-r2')

// R1 committed section height at 1536×743 (from the R1 harness GEOM) — the
// "before" for the shorter-section proof. R2 must come in clearly under it.
const R1_SECTION_HEIGHT = 2566
const BREATHING = 24 // px the resting heading must clear the nav by (R1's bar)

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const pass = (m) => console.log('  ✓ ' + m)

async function runLang(lang) {
  console.log(`\n── ${lang.toUpperCase()} ──────────────────────────────────────────`)
  const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1600)

  // ── heading: ONE line, display family, in the H2 scale ──
  const h = await page.evaluate(() => {
    const t = document.querySelector('.wwp-title')
    const cs = getComputedStyle(t)
    const r = t.getBoundingClientRect()
    const line = parseFloat(cs.fontSize) * 1.5
    return {
      text: t.textContent.trim(),
      hasBr: !!t.querySelector('br'),
      fontSize: parseFloat(cs.fontSize),
      family: cs.fontFamily,
      weight: cs.fontWeight,
      color: cs.color,
      whiteSpace: cs.whiteSpace,
      bboxH: Math.round(r.height),
      oneLine: r.height <= line,
      widthPx: Math.round(r.width),
      availPx: Math.round(t.clientWidth),
    }
  })
  console.log('  heading:', JSON.stringify(h))
  if (h.oneLine && !h.hasBr) pass(`single line — bbox ${h.bboxH}px ≤ 1.5×${h.fontSize}px, no <br>`)
  else fail(`heading is not one line (bbox ${h.bboxH}px, hasBr ${h.hasBr})`)
  if (h.family.includes('Inter Tight') && h.weight === '500' && h.color === 'rgb(15, 36, 68)')
    pass('display family kept — Inter Tight 500, navy #0f2444')
  else fail(`heading style drifted — ${h.family} ${h.weight} ${h.color}`)
  if (h.fontSize >= 20 && h.fontSize <= 66) pass(`H2 scale — ${h.fontSize}px (one-line fit)`)
  else fail(`heading size ${h.fontSize}px out of range`)
  if (h.widthPx <= h.availPx) pass(`fits its column — ${h.widthPx}px ≤ ${h.availPx}px`)
  else fail(`heading overflows — ${h.widthPx}px > ${h.availPx}px`)

  // ── card contents untouched (font sizes) ──
  const card = await page.evaluate(() => {
    const cs = (s) => getComputedStyle(document.querySelector(s))
    return { name: cs('.wwp-name').fontSize, line: cs('.wwp-line').fontSize, eyebrow: cs('.wwp-eyebrow').fontSize }
  })
  if (card.name === '20px' && card.line === '13px' && card.eyebrow === '12px') pass('card + eyebrow fonts untouched (20/13/12)')
  else fail(`card/eyebrow fonts changed — ${JSON.stringify(card)}`)
  if (parseFloat(card.eyebrow) >= 11) pass('11px floor respected')
  else fail(`below 11px floor — ${card.eyebrow}`)

  // ── geometry / section height ──
  const g = await page.evaluate(() => {
    const s = document.getElementById('services')
    return { top: s.getBoundingClientRect().top + window.scrollY, h: s.offsetHeight, winH: innerHeight }
  })
  if (lang === 'en') {
    if (g.h < R1_SECTION_HEIGHT) pass(`section SHORTER than R1 — ${g.h}px < ${R1_SECTION_HEIGHT}px (−${R1_SECTION_HEIGHT - g.h}px)`)
    else fail(`section not shorter — ${g.h}px ≥ ${R1_SECTION_HEIGHT}px`)
  }

  // ── 13-frame sweep: heading + cards together, heading never under nav ──
  const start = g.top - Math.round(g.winH * 0.15)
  const end = g.top + g.h - g.winH + 30
  const N = 13
  let worst = Infinity
  let bottomPadWorst = -Infinity
  let heldTogether = 0
  for (let i = 0; i <= N; i++) {
    const y = Math.round(start + ((end - start) * i) / N)
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(110)
    const m = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const nav = (document.querySelector('header.sticky') || document.querySelector('header')).getBoundingClientRect()
      const title = q('.wwp-title').getBoundingClientRect()
      const eyebrow = q('.wwp-eyebrow').getBoundingClientRect()
      const lede = q('.wwp-lede').getBoundingClientRect()
      const panel = q('.wwp-sticky').getBoundingClientRect()
      const card = q('.wwp-card').getBoundingClientRect()
      const winH = window.innerHeight
      const pinned = Math.abs(panel.top - nav.bottom) < 6
      // heading + cards both visible in the panel at the same time
      const headingVisible = title.bottom > nav.bottom && title.top < winH
      const cardsVisible = q('.wwp-track').getBoundingClientRect().right > panel.left && card.left < panel.right
      return {
        navBottom: Math.round(nav.bottom),
        pinned,
        titleTop: Math.round(title.top),
        eyebrowTop: Math.round(eyebrow.top),
        ledeTop: Math.round(lede.top),
        headClear: Math.round(Math.min(title.top, eyebrow.top, lede.top) - nav.bottom),
        together: headingVisible && cardsVisible,
        cardBottom: Math.round(card.bottom),
        panelBottom: Math.round(panel.bottom),
        bottomGap: Math.round(panel.bottom - card.bottom), // dead air under the cards
      }
    })
    if (m.pinned && m.headClear < 0) fail(`frame ${i} (y=${y}): heading/copy under nav (clear ${m.headClear}px)`)
    if (m.pinned) {
      worst = Math.min(worst, m.headClear)
      if (m.together) heldTogether++
      bottomPadWorst = Math.max(bottomPadWorst, m.bottomGap)
    }
    if (i === 6) await page.screenshot({ path: resolve(out, `together-${lang}.png`) }) // mid-scrub full frame
  }
  if (worst >= BREATHING) pass(`heading clears the nav at every pinned frame (worst +${worst}px)`)
  else fail(`heading clearance dipped to ${worst}px (< ${BREATHING}px)`)
  if (heldTogether >= 8) pass(`heading + cards on screen together across the scrub (${heldTogether} pinned frames)`)
  else fail(`heading + cards not held together enough (${heldTogether} frames)`)
  if (bottomPadWorst <= 60) pass(`dead air under cards trimmed — ≤ ${bottomPadWorst}px to panel bottom`)
  else fail(`too much padding under cards — ${bottomPadWorst}px`)

  // full-section representative frame + hold frame
  await page.evaluate((y) => window.scrollTo(0, y + 40), g.top)
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, `enter-${lang}.png`) })

  console.log(`  console errors: ${errors.length}`)
  errors.slice(0, 5).forEach((e) => console.log('    ! ' + e))
  if (errors.length) fail(`${errors.length} console error(s)`)
  await page.close()
  return g.h
}

const enH = await runLang('en')
await runLang('fr')

// ── reduced motion: no pin, heading one line, in normal flow ──
console.log('\n── REDUCED MOTION ───────────────────────────────────────')
{
  const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1300)
  const info = await page.evaluate(() => {
    const el = document.getElementById('services')
    el.scrollIntoView({ block: 'center' })
    const t = el.querySelector('.wwp-title')
    const r = t.getBoundingClientRect()
    return {
      stickyPosition: getComputedStyle(el.querySelector('.wwp-sticky')).position,
      oneLine: r.height <= parseFloat(getComputedStyle(t).fontSize) * 1.5,
    }
  })
  console.log('  reduced:', JSON.stringify(info))
  if (info.stickyPosition === 'static') pass('reduced motion → no pin (static)')
  else fail(`reduced sticky position ${info.stickyPosition}`)
  if (info.oneLine) pass('reduced motion heading still one line')
  else fail('reduced motion heading not one line')
  await page.evaluate(() => document.getElementById('services').scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, 'reduced.png') })
  if (errors.length) fail(`${errors.length} console error(s) in reduced motion`)
  else pass('reduced motion: 0 console errors')
  await page.close()
}

console.log(`\nR2 section height (EN): ${enH}px  vs  R1 ${R1_SECTION_HEIGHT}px`)
await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : `❌ ${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
