import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

// Lane 12 — marquee fonts + awards paging + hidden case studies.
// Usage: node scripts/lane12-verify.mjs <port>
const PORT = process.argv[2] || '5210'
const OUT = 'shots/lane12'
fs.mkdirSync(OUT, { recursive: true })

const BRAND = ['inter tight', 'inter', 'dm mono']
const isBrand = (ff) => {
  const first = ff.split(',')[0].replace(/["']/g, '').trim().toLowerCase()
  return BRAND.includes(first)
}

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

async function toSection(page, sel) {
  await page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY
    if (window.__lenis) window.__lenis.scrollTo(y - 40, { immediate: true, force: true })
    else window.scrollTo(0, y - 40)
  }, sel)
  await page.waitForTimeout(900)
}

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

  // ── 1. MARQUEE FONT AUDIT ───────────────────────────────────────────────────
  const mq = await page.evaluate(() => {
    const sec = document.querySelector('#marquee')
    const nodes = []
    let starGlyph = 0
    sec.querySelectorAll('*').forEach((el) => {
      const txt = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      if (txt) {
        const cs = getComputedStyle(el)
        nodes.push({ ff: cs.fontFamily, first: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() })
        if (el.textContent.includes('✦')) starGlyph++
      }
    })
    return { nodes, starGlyph, svgStars: sec.querySelectorAll('svg.mq-star').length }
  })
  const families = [...new Set(mq.nodes.map((n) => n.first))]
  console.log('  marquee computed first-families:', JSON.stringify(families))
  const offenders = mq.nodes.filter((n) => !isBrand(n.ff))
  if (!offenders.length) ok(`all ${mq.nodes.length} marquee text nodes resolve to the brand stack`)
  else fail(`${offenders.length} non-brand marquee nodes: ${[...new Set(offenders.map((o) => o.first))].join(', ')}`)
  if (mq.starGlyph === 0) ok('no U+2726 (✶) font-glyph text node remains')
  else fail(`${mq.starGlyph} ✶ glyph text nodes still present`)
  if (mq.svgStars > 0) ok(`gold separator is inline SVG (${mq.svgStars} .mq-star)`)

  // ── 3. CASE STUDIES HIDDEN ──────────────────────────────────────────────────
  const cases = await page.evaluate(() => {
    const hasCases = !!document.querySelector('#cases')
    const bodyText = document.body.textContent || ''
    const links = [...document.querySelectorAll('a')].map((a) => a.textContent.trim())
    return { hasCases, hasCaseLink: links.some((t) => /case stud|études de cas/i.test(t)) }
  })
  if (!cases.hasCases) ok('#cases absent from the rendered DOM'); else fail('#cases still present in DOM')
  if (!cases.hasCaseLink) ok('no Case Studies nav/footer link visible'); else fail('a Case Studies link is still rendered')

  // ── 2. AWARDS PAGING ────────────────────────────────────────────────────────
  await toSection(page, '#awards')
  await page.waitForTimeout(600)
  const nat = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#awards .aw-arrows button')]
    const vp = document.querySelector('#awards .aw-viewport')
    return { n: btns.length, disabled: btns.map((b) => b.disabled), overflow: vp.scrollWidth - vp.clientWidth }
  })
  console.log(`  awards arrows: ${nat.n}, disabled=${JSON.stringify(nat.disabled)}, overflow=${nat.overflow}px`)
  if (nat.n === 2) ok('two arrow buttons present'); else fail(`expected 2 arrows, got ${nat.n}`)
  if (nat.disabled[0] && nat.disabled[1]) ok('both arrows disabled with only 4 awards (no overflow)')
  else fail(`arrows not both-disabled at 4 cards: ${JSON.stringify(nat.disabled)}`)
  if (lng === 'en') await page.screenshot({ path: `${OUT}/awards-${lng}.png` })

  // Forced-overflow mechanics test: widen cards so 4 overflow → arrows must page.
  if (lng === 'en') {
    const step = await page.evaluate(async () => {
      const st = document.createElement('style')
      st.id = '_l12'; st.textContent = '#awards .plq{flex-basis:40% !important}'
      document.head.appendChild(st)
      window.dispatchEvent(new Event('resize'))
      await new Promise((r) => setTimeout(r, 200))
      const vp = document.querySelector('#awards .aw-viewport')
      const [prev, next] = [...document.querySelectorAll('#awards .aw-arrows button')]
      const s0 = vp.scrollLeft, prevDis0 = prev.disabled, nextDis0 = next.disabled
      next.click(); await new Promise((r) => setTimeout(r, 500))
      const s1 = vp.scrollLeft
      // jump to end — force instant (the viewport is scroll-behavior:smooth)
      vp.style.scrollBehavior = 'auto'
      vp.scrollLeft = vp.scrollWidth; vp.dispatchEvent(new Event('scroll')); await new Promise((r) => setTimeout(r, 300))
      const prevDisEnd = prev.disabled, nextDisEnd = next.disabled
      return { s0, s1, prevDis0, nextDis0, prevDisEnd, nextDisEnd }
    })
    await page.screenshot({ path: `${OUT}/awards-paging-forced-en.png` })
    await page.evaluate(() => { const s = document.getElementById('_l12'); if (s) s.remove(); const vp = document.querySelector('#awards .aw-viewport'); vp.scrollLeft = 0; vp.dispatchEvent(new Event('scroll')) })
    if (step.prevDis0 && !step.nextDis0) ok('forced overflow: at start → prev disabled, next enabled'); else fail(`start state wrong: ${JSON.stringify(step)}`)
    if (step.s1 > step.s0) ok(`next arrow steps the strip (${Math.round(step.s0)} → ${Math.round(step.s1)}px)`); else fail(`next did not scroll (${step.s0}→${step.s1})`)
    if (step.nextDisEnd && !step.prevDisEnd) ok('at end → next disabled, prev enabled'); else fail(`end state wrong: ${JSON.stringify(step)}`)
  }

  // ── Awards → footer boundary ────────────────────────────────────────────────
  if (lng === 'en') {
    const nextId = await page.evaluate(() => {
      const aw = document.querySelector('#awards')
      let n = aw.nextElementSibling
      while (n && !n.matches('section') && !n.querySelector?.('section')) n = n.nextElementSibling
      const sec = n?.matches?.('section') ? n : n?.querySelector?.('section')
      return sec?.id || null
    })
    console.log('  section after Awards:', nextId)
    await page.evaluate(() => {
      const aw = document.querySelector('#awards')
      const y = aw.getBoundingClientRect().bottom + window.scrollY
      if (window.__lenis) window.__lenis.scrollTo(y - 371, { immediate: true, force: true }); else window.scrollTo(0, y - 371)
    })
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/awards-footer-boundary-en.png` })
    ok('shot awards-footer-boundary-en.png')
  }

  if (!consoleErrors.length) ok('zero console errors')
  else { fail(`${consoleErrors.length} console errors`); consoleErrors.slice(0, 6).forEach((e) => console.log('      · ' + e)) }

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe: zero violations')
  else { fail(`axe: ${axe.violations.length} violations`); for (const v of axe.violations) console.log(`      [${v.impact}] ${v.id} (${v.nodes.length})`) }

  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
