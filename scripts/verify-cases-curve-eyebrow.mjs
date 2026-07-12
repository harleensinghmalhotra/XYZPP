import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── CASES — CURVE DIVIDER + GHANA EYEBROW CLIP ───────────────────────────────
// 1) the Cases→CTA boundary now speaks the Certifications dome language (arc at 4
//    scroll positions + a certs-arc shot for language match; no hard seam/banding).
// 2) all three cases' eyebrows render fully inside the page in EN+FR (bbox asserts),
//    and the "Read the full case study" pill clears the page bottom on every case.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots/cases-curve-eyebrow')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const to = (page, y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const hideNav = (page) => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.visibility = 'hidden' } })
const showNav = (page) => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.visibility = '' })

async function openLang(browser, lang) {
  const ctx = await browser.newContext(VP)
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript((lng) => localStorage.setItem('qfp.lang', lng), lang)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(400)
  return { ctx, page, errors }
}

// eyebrow + CTA fit per case (bounding-box asserts inside the page)
async function fitCheck(page) {
  const geo = await page.evaluate(() => { const el = document.getElementById('cases'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
  await to(page, Math.round(geo.top - 40)); await page.waitForTimeout(400)
  const rows = []
  for (let i = 0; i < 3; i++) {
    await page.evaluate((idx) => {
      const spines = [...document.querySelectorAll('.cs-spine')]
      const target = spines.find((s) => s.getAttribute('aria-label')?.includes(String(idx + 1).padStart(2, '0')))
      if (target) target.click()
    }, i)
    await page.waitForTimeout(680)
    const m = await page.evaluate(() => {
      const pageEl = document.querySelector('.cs-page--left')
      const eb = document.querySelector('.cs-page--left .cs-eyebrow')
      const cta = document.querySelector('.cs-page--left .cs-cta')
      const pr = pageEl.getBoundingClientRect(), er = eb.getBoundingClientRect(), cr = cta.getBoundingClientRect()
      return {
        eyebrowText: eb.textContent,
        eyebrowTopInside: +(er.top - pr.top).toFixed(1),      // >0 → below page top ✓
        eyebrowFullyInside: er.top >= pr.top - 0.5 && er.bottom <= pr.bottom + 0.5,
        ctaBottomClear: +(pr.bottom - cr.bottom).toFixed(1),  // >0 → above page bottom ✓
        ctaFullyInside: cr.top >= pr.top - 0.5 && cr.bottom <= pr.bottom + 0.5,
      }
    })
    rows.push({ case: i + 1, ...m })
  }
  return rows
}

const browser = await chromium.launch({ headless: false })
const report = { en: {}, fr: {}, errors: [] }

// ── EN: fit + curve shots + seam sampling ────────────────────────────────────
{
  const { ctx, page, errors } = await openLang(browser, 'en')
  report.en.fit = await fitCheck(page)

  // curve divider at 4 scroll positions (boundary swept through the viewport)
  const geo = await page.evaluate(() => { const el = document.getElementById('cases'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
  const boundary = geo.top + geo.h
  const offsets = [-260, -120, 0, 120] // boundary above / entering / centred / below mid
  hideNav(page)
  for (const [i, off] of offsets.entries()) {
    await to(page, Math.round(boundary - geo.innerH / 2 + off))
    await page.waitForTimeout(300)
    await page.screenshot({ path: resolve(out, `curve-en-${i}.png`) })
  }

  // seam/banding check — sample a vertical line of pixels straight down through the
  // curve at the section's left third (clear of the button); assert the step from
  // stage→footer is gradual (no hard jump) across the arc.
  await to(page, Math.round(boundary - geo.innerH / 2))
  await page.waitForTimeout(300)
  const by = await page.evaluate(() => document.getElementById('cases').getBoundingClientRect().bottom)
  const buf = await page.screenshot()
  const b64 = buf.toString('base64')
  report.en.seam = await page.evaluate(async ({ b64, by }) => {
    const img = new Image(); await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + b64 })
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const dpr = img.width / window.innerWidth
    const px = (xx, yy) => { const d = g.getImageData(Math.round(xx * dpr), Math.round(yy * dpr), 1, 1).data; return [d[0], d[1], d[2]] }
    // A "hard straight edge" would be a FULL-WIDTH horizontal jump at the boundary
    // line (y=0). Sample many columns and measure the colour delta across y=0
    // (−6px → +6px). The dome's own curved edge lands at different y per column, so
    // it never forms a horizontal seam — only a real straight seam would spike here.
    const cols = [0.06, 0.14, 0.30, 0.42, 0.58, 0.70, 0.86, 0.94]
    let boundaryMax = 0
    const boundary = cols.map((cx) => {
      const a = px(cx, by - 6), b = px(cx, by + 6)
      const delta = Math.max(...a.map((v, k) => Math.abs(v - b[k])))
      boundaryMax = Math.max(boundaryMax, delta)
      return { x: cx, above: `rgb(${a.join(',')})`, below: `rgb(${b.join(',')})`, delta }
    })
    // banding: walk the CENTRE column (x=0.5) strictly INSIDE the dome fill — below
    // the peak edge, above the base — so we measure the gradient itself, not the arc's
    // silhouette edge. A posterised gradient shows large per-step JUMPS; a smooth one
    // steps by a couple of units. Record the max single-step per-channel delta.
    let prev = null, maxBand = 0, series = []
    for (let y = by - 40; y <= by - 8; y += 4) {
      const p = px(0.5, y)
      if (prev) maxBand = Math.max(maxBand, Math.max(...p.map((v, k) => Math.abs(v - prev[k]))))
      prev = p; series.push([Math.round(y - by), `rgb(${p.join(',')})`])
    }
    return { boundaryMaxDelta: boundaryMax, boundary, maxBandStep: maxBand, series }
  }, { b64, by })

  showNav(page)
  report.errors.push(...errors)
  await ctx.close()
}

// ── FR: fit + one curve shot ─────────────────────────────────────────────────
{
  const { ctx, page, errors } = await openLang(browser, 'fr')
  report.fr.fit = await fitCheck(page)
  const geo = await page.evaluate(() => { const el = document.getElementById('cases'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
  hideNav(page)
  await to(page, Math.round(geo.top + geo.h - geo.innerH / 2))
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, 'curve-fr.png') })
  // full spread shots of each case for the eyebrow visual (FR — the longer strings)
  await to(page, Math.round(geo.top - 40)); await page.waitForTimeout(300)
  for (let i = 0; i < 3; i++) {
    await page.evaluate((idx) => { const s = [...document.querySelectorAll('.cs-spine')].find((x) => x.getAttribute('aria-label')?.includes(String(idx + 1).padStart(2, '0'))); if (s) s.click() }, i)
    await page.waitForTimeout(680)
    await (await page.$('.cs-book')).screenshot({ path: resolve(out, `spread-fr-case${i + 1}.png`) })
  }
  showNav(page)
  report.errors.push(...errors)
  await ctx.close()
}

// ── certs arc — the language we're matching (side-by-side reference shot) ─────
{
  const { ctx, page, errors } = await openLang(browser, 'en')
  const geo = await page.evaluate(() => { const el = document.getElementById('certifications'); return el ? { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } : null })
  if (geo) {
    hideNav(page)
    await to(page, Math.round(geo.top + geo.h - geo.innerH / 2))
    await page.waitForTimeout(400)
    await page.screenshot({ path: resolve(out, 'certs-arc-reference.png') })
    showNav(page)
  }
  report.errors.push(...errors)
  await ctx.close()
}

await browser.close()

// ── VERDICT ──────────────────────────────────────────────────────────────────
console.log('\n════════ CASES — CURVE + EYEBROW — VERDICT ════════\n')
let ok = true
for (const lang of ['en', 'fr']) {
  console.log(`── ${lang.toUpperCase()} — eyebrow + CTA fit ──`)
  for (const r of report[lang].fit) {
    const eF = r.eyebrowFullyInside && r.eyebrowTopInside > 4
    const cF = r.ctaFullyInside && r.ctaBottomClear > 4
    if (!eF || !cF) ok = false
    console.log(`  case ${r.case}: "${r.eyebrowText}"`)
    console.log(`     eyebrow top inside +${r.eyebrowTopInside}px  fullyInside=${r.eyebrowFullyInside} → ${eF ? 'WHOLE ✓' : 'CLIP ✗'}`)
    console.log(`     CTA bottom clear +${r.ctaBottomClear}px  fullyInside=${r.ctaFullyInside} → ${cF ? 'CLEAR ✓' : 'CLIP ✗'}`)
  }
  console.log()
}
console.log('── CURVE — no hard straight seam / no banding (EN) ──')
const s = report.en.seam
// The residual boundary Δ is the pre-existing navy-stage↔aurora-navy step (the CTA's
// gold bloom lifts its top a few units); the dome turns that former straight line into
// a soft curve. A genuine hard seam (cream strip return / colour mismatch) reads Δ40+.
console.log(`   full-width boundary seam (max Δ across y=0, 8 columns): ${s.boundaryMaxDelta} → ${s.boundaryMaxDelta <= 16 ? 'SOFT (no hard seam) ✓' : 'HARD SEAM ✗'}`)
if (s.boundaryMaxDelta > 16) ok = false
for (const b of s.boundary) console.log(`      x=${b.x}  ${b.above} → ${b.below}  Δ${b.delta}`)
console.log(`   dome gradient banding (max single-step through the arc): ${s.maxBandStep} → ${s.maxBandStep <= 12 ? 'SMOOTH, no banding ✓' : 'BANDING ✗'}`)
console.log('   centre-column interior series (Δy → colour):')
for (const [dy, c] of s.series) console.log(`      ${dy}px  ${c}`)
if (s.maxBandStep > 12) ok = false
console.log(`\n── console errors: ${report.errors.length ? report.errors.length + ' ✗' : '0 ✓'}`)
if (report.errors.length) { ok = false; report.errors.slice(0, 6).forEach((e) => console.log('     ', e.slice(0, 140))) }

console.log(`\n${ok ? 'ALL CHECKS GREEN ✓' : 'SOME CHECKS FAILED ✗'}`)
console.log(`shots → ${out}`)
