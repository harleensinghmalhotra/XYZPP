import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

// Lane 16 — hero rebuild: static book, scroll-revealed bubbles, pill CTAs, sound
// killed. Usage:  node scripts/lane16-verify.mjs <port>   (serve the BUILT preview)
const PORT = process.argv[2] || '5216'
const OUT = 'shots/lane16'
fs.mkdirSync(OUT, { recursive: true })

let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }
const HEADLINE = 'Powering Global Education Through Print Excellence'

// ── 1. LOCALE PARITY (EN/FR/ES) — hero keys ───────────────────────────────────
console.log('\n=== PARITY (home.json hero) ===')
const load = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const keysOf = (o, pre = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? keysOf(v, pre + k + '.') : [pre + k])
{
  const sets = ['en', 'fr', 'es'].map((l) => new Set(keysOf(load(`src/locales/${l}/home.json`).hero)))
  const [ke, kf, kEs] = sets
  const miss = (a, b) => [...a].filter((k) => !b.has(k))
  const gaps = [...miss(ke, kf), ...miss(kf, ke), ...miss(ke, kEs), ...miss(kEs, ke)]
  if (!gaps.length) ok(`hero: EN/FR/ES key parity (${ke.size} keys)`); else fail(`hero parity gaps: ${gaps}`)
  const noSound = ['en', 'fr', 'es'].every((l) => load(`src/locales/${l}/home.json`).hero.bookSound === undefined)
  if (noSound) ok('hero.bookSound key removed in all 3 locales'); else fail('hero.bookSound still present')
}

// scroll helper (Lenis-aware) → set absolute scrollY
const scrollTo = (page, y) => page.evaluate((yy) => {
  if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true, force: true })
  else window.scrollTo(0, yy)
}, y)
// hero scroll distance (start top top → end bottom bottom)
const heroDist = (page) => page.evaluate(() => {
  const el = document.querySelector('#hero')
  return Math.max(1, el.offsetHeight - window.innerHeight)
})
// opacity of each bubble wrapper, in DOM (left→right) order
const bubbleOpacities = (page) => page.evaluate(() =>
  ['mustard', 'red', 'blonde', 'green'].map((tk) => {
    const el = document.querySelector(`[data-bubble="${tk}"]`)
    return el ? Math.round(parseFloat(getComputedStyle(el).opacity) * 100) / 100 : null
  }))

const browser = await chromium.launch({ headless: false })

// ── 2. EN — full behaviour + screenshots ──────────────────────────────────────
console.log('\n=== EN — behaviour & screenshots ===')
{
  const ctx = await browser.newContext(VP)
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)

  // (10) exactly one real <h1>, same text as Lane 5
  const h1 = await page.evaluate(() => {
    const list = [...document.querySelectorAll('h1')]
    return { n: list.length, text: (list[0]?.textContent || '').replace(/\s+/g, ' ').trim() }
  })
  if (h1.n === 1) ok('exactly one <h1> on /'); else fail(`h1 count = ${h1.n}`)
  if (h1.text === HEADLINE) ok(`h1 text unchanged: "${h1.text}"`); else fail(`h1 text = "${h1.text}"`)

  // (5) NO sound toggle anywhere in the DOM
  const soundUi = await page.evaluate(() => {
    const pressed = document.querySelectorAll('#hero [aria-pressed]').length
    const byText = [...document.querySelectorAll('#hero button')].filter((b) => /sound|son|sonido/i.test(b.textContent)).length
    return pressed + byText
  })
  if (soundUi === 0) ok('no sound toggle in the DOM (no [aria-pressed], no Sound button)'); else fail(`sound UI still present (${soundUi})`)

  // (7) all 4 bubble text nodes in the a11y tree regardless of scroll (top of page)
  const atTop = await page.evaluate(() => {
    return ['mustard', 'red', 'blonde', 'green'].map((tk) => {
      const wrap = document.querySelector(`[data-bubble="${tk}"]`)
      const p = wrap?.querySelector('p')
      if (!p) return { tk, ok: false }
      const hidden = p.closest('[aria-hidden="true"]') !== null
      const disp = getComputedStyle(p).display === 'none'
      const vis = getComputedStyle(p).visibility === 'hidden'
      return { tk, text: p.textContent.trim().length, hidden, disp, vis, ok: p.textContent.trim().length > 0 && !hidden && !disp && !vis }
    })
  })
  if (atTop.every((b) => b.ok)) ok('all 4 bubble texts in DOM+a11y tree at scroll=0 (not display:none / aria-hidden / visibility:hidden)')
  else { fail('bubble a11y check failed'); atTop.forEach((b) => !b.ok && console.log('     · ' + JSON.stringify(b))) }

  // (2) hero at rest — bubbles hidden (opacity ~0) before scroll
  await scrollTo(page, 0)
  await page.waitForTimeout(500)
  const rest = await bubbleOpacities(page)
  if (rest.every((o) => o < 0.2)) ok(`bubbles hidden at rest (opacities ${JSON.stringify(rest)})`); else fail(`bubbles not hidden at rest: ${JSON.stringify(rest)}`)
  await page.screenshot({ path: `${OUT}/hero-rest.png` }); ok('shot hero-rest.png')

  // (3) scroll reveal — 4 points, bubbles reveal progressively left→right.
  // Poll: nudge scroll downward until ≥ target bubbles have crossed, then shoot —
  // robust to the small offset between our scrollY estimate and ScrollTrigger's
  // internal progress. Each shot shows one more bubble than the last.
  const dist = await heroDist(page)
  const shownCount = async () => (await bubbleOpacities(page)).filter((o) => o > 0.8).length
  let prevOrderOk = true
  for (let i = 0; i < 4; i++) {
    const target = i + 1
    let frac = 0.12 + i * 0.13
    for (let step = 0; step < 14 && (await shownCount()) < target; step++) {
      await scrollTo(page, Math.round(dist * frac))
      await page.waitForTimeout(450)
      frac += 0.03
    }
    await page.waitForTimeout(300) // settle the fade
    const op = await bubbleOpacities(page)
    await page.screenshot({ path: `${OUT}/reveal-${i + 1}.png` })
    const shown = op.filter((o) => o > 0.8).length
    // order: the shown bubbles must be a left→right prefix (indices 0..shown-1)
    const isPrefix = op.every((o, idx) => (idx < shown ? o > 0.8 : o < 0.5))
    if (!isPrefix) prevOrderOk = false
    if (shown >= target) ok(`reveal-${i + 1}.png: ${shown} bubble(s) shown ${JSON.stringify(op)}`)
    else fail(`reveal-${i + 1}: expected ≥${target} shown, got ${shown} ${JSON.stringify(op)}`)
  }
  if (prevOrderOk) ok('sequence order = left→right (each step reveals the next-rightmost bubble)')
  else fail('reveal order is not a clean left→right prefix')

  // (8) scroll-through — page scrolls continuously past the hero, no stall/pin.
  // Scroll well beyond the section end; assert scrollY is NOT clamped (would signal
  // a pin) and the hero has scrolled up out of the way (its bottom is above the fold).
  await scrollTo(page, dist + 500)
  await page.waitForTimeout(700)
  const past = await page.evaluate(() => {
    const r = document.querySelector('#hero').getBoundingClientRect()
    return { y: Math.round(window.scrollY), heroBottom: Math.round(r.bottom), vh: window.innerHeight }
  })
  if (past.y >= dist + 400 && past.heroBottom < past.vh)
    ok(`scroll-through OK — no pin/clamp (scrollY ${past.y} past section end ${dist}); hero scrolled away (bottom ${past.heroBottom} < ${past.vh})`)
  else fail(`scroll-through failed: ${JSON.stringify({ ...past, dist })}`)

  // (4) CTAs at rest + hover
  await scrollTo(page, Math.round(dist * 0.55)); await page.waitForTimeout(600)
  const ctaBox = await page.evaluate(() => {
    const a = document.querySelector('#hero a[href="#services"]')
    const b = document.querySelector('#hero a[href="#reach"]')
    if (!a || !b) return null
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
    const x = Math.min(ra.left, rb.left) - 30, y = Math.min(ra.top, rb.top) - 24
    return { x: Math.max(0, x), y: Math.max(0, y), width: Math.max(ra.right, rb.right) - x + 30, height: Math.max(ra.bottom, rb.bottom) - y + 24 }
  })
  const targets = await page.evaluate(() => ({
    print: document.querySelector('#hero a[href="#services"]') ? '#services' : null,
    reach: document.querySelector('#hero a[href="#reach"]') ? '#reach' : null,
  }))
  if (targets.print === '#services' && targets.reach === '#reach') ok('CTA targets: "What we print"→#services, "Our global reach"→#reach')
  else fail('CTA targets wrong: ' + JSON.stringify(targets))
  if (ctaBox) { await page.screenshot({ path: `${OUT}/ctas.png`, clip: ctaBox }); ok('shot ctas.png (rest)') }
  await page.hover('#hero a[href="#services"]')
  await page.waitForTimeout(450)
  if (ctaBox) { await page.screenshot({ path: `${OUT}/ctas-hover.png`, clip: ctaBox }); ok('shot ctas-hover.png (hover "What we print")') }

  // (9) axe on / + console errors
  if (!errs.length) ok('zero console errors (EN)'); else { fail(`${errs.length} console errors`); errs.slice(0, 6).forEach((e) => console.log('     · ' + e)) }
  await scrollTo(page, 0); await page.waitForTimeout(400)
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe (/): zero violations'); else { fail(`axe: ${axe.violations.length} violations`); axe.violations.forEach((v) => console.log(`     [${v.impact}] ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)) }
  await ctx.close()
}

// ── 3. REDUCED MOTION (EN) — all 4 bubbles visible immediately ─────────────────
console.log('\n=== REDUCED MOTION ===')
{
  const ctx = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1000)
  const op = await bubbleOpacities(page)
  if (op.every((o) => o > 0.9)) ok(`reduced-motion: all 4 bubbles visible immediately ${JSON.stringify(op)}`); else fail(`reduced bubbles not all visible: ${JSON.stringify(op)}`)
  await page.screenshot({ path: `${OUT}/reduced.png` }); ok('shot reduced.png')
  if (!errs.length) ok('reduced-motion: no page errors'); else fail('reduced errors: ' + errs.join('; '))
  await ctx.close()
}

// ── 4. FR + ES load clean (console + axe + h1) ─────────────────────────────────
for (const lng of ['fr', 'es']) {
  console.log(`\n=== ${lng.toUpperCase()} — loads clean ===`)
  const ctx = await browser.newContext(VP)
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {} }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1000)
  const h1n = await page.evaluate(() => document.querySelectorAll('h1').length)
  if (h1n === 1) ok(`${lng}: exactly one <h1>`); else fail(`${lng}: h1 count ${h1n}`)
  await page.screenshot({ path: `${OUT}/hero-${lng}.png` }); ok(`shot hero-${lng}.png`)
  if (!errs.length) ok(`${lng}: zero console errors`); else { fail(`${lng}: ${errs.length} console errors`); errs.slice(0, 5).forEach((e) => console.log('     · ' + e)) }
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok(`${lng}: axe zero violations`); else { fail(`${lng}: axe ${axe.violations.length}`); axe.violations.forEach((v) => console.log(`     [${v.impact}] ${v.id}`)) }
  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
