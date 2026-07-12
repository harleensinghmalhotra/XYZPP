import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── CASES CTA — the button came home to the book ─────────────────────────────
// Verifies: the orphan cream strip is GONE, the View-All CTA lives inside the
// Cases navy stage (cream pill, navy text, nebula ring), reads AA, the section
// boundary below Cases holds (navy→navy, no new seam), EN+FR, reduced-motion,
// and zero console errors.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots/cases-cta')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

// sRGB relative-luminance contrast (WCAG)
function contrast(hexA, hexB) {
  const lum = (h) => {
    const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  const [l1, l2] = [lum(hexA), lum(hexB)].sort((a, b) => b - a)
  return +((l1 + 0.05) / (l2 + 0.05)).toFixed(2)
}

const rgbToHex = (rgb) => {
  const m = rgb.match(/\d+/g)
  if (!m) return null
  return m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('')
}

async function run(lang, reduced) {
  const tag = `${lang}${reduced ? '-rm' : ''}`
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({
    ...VP,
    ...(reduced ? { reducedMotion: 'reduce' } : {}),
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript((lng) => { localStorage.setItem('qfp.lang', lng) }, lang)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(400)

  const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
  const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.visibility = 'hidden' } })
  const showNav = () => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.visibility = '' })

  // ── structural: strip gone, button inside section ──────────────────────────
  const struct = await page.evaluate(() => {
    const sec = document.getElementById('cases')
    const footer = document.querySelector('.cases-footer')       // must NOT exist
    const btn = document.querySelector('.view-all-cases')
    const stage = document.querySelector('.cs-stage')
    return {
      hasStrip: !!footer,
      btnInsideSection: !!(btn && sec && sec.contains(btn)),
      btnInsideStage: !!(btn && stage && stage.contains(btn)),
      btnText: btn ? btn.textContent : null,
      hasNebula: !!(btn && btn.classList.contains('btn-nebula')),
      hasLight: !!(btn && btn.classList.contains('btn-nebula--light')),
    }
  })

  const geo = await page.evaluate(() => { const el = document.getElementById('cases'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })

  // scroll so the CTA is in view (near section bottom)
  await to(Math.round(geo.top + geo.h - geo.innerH + 40))
  await page.waitForTimeout(500)

  // ── button styling + contrast + arrow clearance ────────────────────────────
  const btnInfo = await page.evaluate(() => {
    const btn = document.querySelector('.view-all-cases')
    const cs = getComputedStyle(btn)
    const before = getComputedStyle(btn, '::before')
    const arrows = [...document.querySelectorAll('.cs-arrow')].map((a) => a.getBoundingClientRect())
    const br = btn.getBoundingClientRect()
    const arrowBottom = arrows.length ? Math.max(...arrows.map((a) => a.bottom)) : null
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      radius: cs.borderRadius,
      font: cs.fontFamily,
      ringDisplay: before.display,           // ::before present → ring exists
      ringOpacity: before.opacity,
      gapAboveButton: arrowBottom != null ? +(br.top - arrowBottom).toFixed(1) : null,
    }
  })
  const bgHex = rgbToHex(btnInfo.bg)
  const fgHex = rgbToHex(btnInfo.color)
  const ratio = bgHex && fgHex ? contrast(bgHex, fgHex) : null

  // rest shot of the CTA (full section)
  hideNav()
  await page.evaluate(() => document.querySelector('.view-all-cases').blur())
  await (await page.$('#cases')).screenshot({ path: resolve(out, `after-${tag}.png`) })

  // hover shot — nebula ring should intensify
  const ringRest = btnInfo.ringOpacity
  await page.hover('.view-all-cases')
  await page.waitForTimeout(reduced ? 100 : 500)
  const ringHover = await page.evaluate(() => getComputedStyle(document.querySelector('.view-all-cases'), '::before').opacity)
  await (await page.$('.cs-viewall')).screenshot({ path: resolve(out, `cta-hover-${tag}.png`) })
  showNav()

  // ── section boundary below Cases at 3 scroll positions (navy→navy melt) ─────
  const boundaryY = geo.top + geo.h
  const seamShots = []
  for (const [i, off] of [-120, 0, 120].entries()) {
    await to(Math.round(boundaryY - geo.innerH / 2 + off))
    await page.waitForTimeout(300)
    hideNav()
    await page.screenshot({ path: resolve(out, `boundary-${tag}-${i}.png`) })
    showNav()
    // sample the pixel colour just above and just below the Cases bottom edge
    const sample = await page.evaluate(() => {
      const el = document.getElementById('cases')
      const b = el.getBoundingClientRect()
      const above = document.elementFromPoint(window.innerWidth / 2, Math.max(2, b.bottom - 6))
      const below = document.elementFromPoint(window.innerWidth / 2, Math.min(window.innerHeight - 2, b.bottom + 6))
      const bgOf = (n) => { while (n) { const c = getComputedStyle(n).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)') return c; n = n.parentElement } return null }
      return { above: above ? bgOf(above) : null, below: below ? bgOf(below) : null, bottomInView: b.bottom > 0 && b.bottom < window.innerHeight }
    })
    seamShots.push(sample)
  }

  await browser.close()
  return { tag, struct, btnInfo, bgHex, fgHex, ratio, ringRest, ringHover, seamShots, errors }
}

const results = []
for (const [lang, reduced] of [['en', false], ['fr', false], ['en', true]]) {
  results.push(await run(lang, reduced))
}

console.log('\n════════ CASES CTA — VERDICT ════════\n')
let allGood = true
for (const r of results) {
  console.log(`── ${r.tag} ──`)
  const stripGone = !r.struct.hasStrip
  console.log(`  cream strip removed .......... ${stripGone ? 'GONE ✓' : 'STILL PRESENT ✗'}`)
  console.log(`  button inside #cases ......... ${r.struct.btnInsideSection ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  button inside .cs-stage ...... ${r.struct.btnInsideStage ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  nebula ring classes .......... btn-nebula:${r.struct.hasNebula} --light:${r.struct.hasLight}`)
  console.log(`  label ........................ "${r.struct.btnText}"`)
  console.log(`  fill #${r.bgHex}  text #${r.fgHex}  → contrast ${r.ratio}:1 → ${r.ratio >= 4.5 ? 'AA ✓' : 'FAIL ✗'}`)
  console.log(`  radius ${r.btnInfo.radius}  font ${r.btnInfo.font.split(',')[0]}`)
  console.log(`  nebula ring ::before opacity  rest ${r.ringRest} → hover ${r.ringHover}  (display ${r.btnInfo.ringDisplay})`)
  console.log(`  gap above button (from arrows) ${r.btnInfo.gapAboveButton}px`)
  for (const [i, s] of r.seamShots.entries()) console.log(`  boundary[${i}] above=${s.above} below=${s.below}`)
  console.log(`  console errors ............... ${r.errors.length ? r.errors.length + ' ✗' : '0 ✓'}`)
  if (r.errors.length) r.errors.slice(0, 4).forEach((e) => console.log('      ', e.slice(0, 120)))
  if (!stripGone || !r.struct.btnInsideSection || r.ratio < 4.5 || r.errors.length) allGood = false
  console.log()
}
console.log(allGood ? 'ALL CHECKS GREEN ✓' : 'SOME CHECKS FAILED ✗')
console.log(`shots → ${out}`)
