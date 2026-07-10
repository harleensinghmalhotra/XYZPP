import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(500)

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const geo = await page.evaluate(() => {
  const el = document.getElementById('certifications')
  return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
})
console.log('SECTION HEIGHT:', geo.h, 'px')
// walk down so the entrance fires, then settle
for (let y = geo.top - geo.innerH * 0.4; y < geo.top + geo.h; y += Math.round(geo.innerH * 0.55)) {
  await to(Math.round(y)); await page.waitForTimeout(280)
}
await page.waitForTimeout(1400)

// ── FULL SECTION SHOT (hide fixed nav) — include ~200px above to show the top
//    dome sweeping over the previous section (the signature curve) ─────────────
await page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.display = 'none' } })
await page.setViewportSize({ width: 1536, height: 1360 })
await page.waitForTimeout(200)
const cTop = await page.evaluate(() => document.getElementById('certifications').getBoundingClientRect().top + window.scrollY)
await to(Math.round(cTop - 210))
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(out, 'certs-full.png'), clip: { x: 0, y: 0, width: 1536, height: Math.min(1360, geo.h + 250) } })
await page.setViewportSize(VP.viewport)
await page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })
console.log('  ✓ certs-full.png')

// ── FILTER CLICK TEST ─────────────────────────────────────────────────────────
await to(Math.round(geo.top - 60))
await page.waitForTimeout(400)
const titlesNow = () => page.evaluate(() => [...document.querySelectorAll('.cert-card .cert-card-title')].map((t) => t.textContent))
const expect = {
  certifications: ['ISO 9001:2015', 'Star Export House'],
  environment: ['FSC Chain of Custody', 'ISO 14001:2015'],
  social: ['Sedex Member'],
}
console.log('\nFILTER TEST:')
console.log('  default (all):', JSON.stringify(await titlesNow()))
for (const key of ['certifications', 'environment', 'social']) {
  await page.click(`.certs-pill[data-filter="${key}"]`)
  await page.waitForTimeout(450)
  const got = await titlesNow()
  const ok = JSON.stringify(got.sort()) === JSON.stringify([...expect[key]].sort())
  console.log(`  ${key} → ${JSON.stringify(got)}  ${ok ? '✓' : '✗ (want ' + JSON.stringify(expect[key]) + ')'}`)
  if (key === 'environment') {
    await (await page.$('#certifications')).screenshot({ path: resolve(out, 'certs-filtered.png') })
    console.log('    ✓ certs-filtered.png (Environment active)')
  }
  // toggle back to all
  await page.click(`.certs-pill[data-filter="${key}"]`)
  await page.waitForTimeout(300)
}

// ── FSC COMPLIANCE CLOSEUP — licence code visible ─────────────────────────────
const fsc = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.cert-card')].find((c) => /FSC Chain/.test(c.textContent))
  const code = card?.querySelector('.cert-card-code')
  return { hasCode: !!code, codeText: code?.textContent || '' }
})
console.log(`\nFSC COMPLIANCE: code present=${fsc.hasCode}, text="${fsc.codeText}" ${/TUVDC-COC-101258/.test(fsc.codeText) ? '✓' : '✗'}`)
const fscBox = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.cert-card')].find((c) => /FSC Chain/.test(c.textContent))
  const r = card.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
})
await page.screenshot({ path: resolve(out, 'certs-fsc.png'), clip: { x: Math.max(0, Math.round(fscBox.x - 16)), y: Math.max(0, Math.round(fscBox.y - 16)), width: Math.round(fscBox.w + 32), height: Math.round(Math.min(geo.innerH - fscBox.y + 16, fscBox.h + 32)) } })
console.log('  ✓ certs-fsc.png')

// ── CAROUSEL ARROWS ───────────────────────────────────────────────────────────
const before = await page.evaluate(() => document.querySelector('.certs-viewport').scrollLeft)
await page.click('.certs-arrow:nth-child(2)') // next
await page.waitForTimeout(600)
const after = await page.evaluate(() => document.querySelector('.certs-viewport').scrollLeft)
const prevEnabled = await page.evaluate(() => !document.querySelector('.certs-arrow:first-child').disabled)
console.log(`\nCAROUSEL: scrollLeft ${before} → ${after} (moved: ${after > before ? '✓' : '✗'}), prev-arrow enabled after next: ${prevEnabled ? '✓' : '✗'}`)

// ── FPS + CLS ─────────────────────────────────────────────────────────────────
await to(Math.round(geo.top - geo.innerH))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2000
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: geo.top + geo.h })
console.log('\nFPS:', JSON.stringify(fps), 'CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe / contrast ────────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#certifications').analyze()
console.log('axe #certifications violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}`); for (const n of v.nodes.slice(0, 5)) console.log('     ', n.target.join(' '), '::', (n.failureSummary || '').split('\n').pop()) }
const ccV = axe.violations.find((v) => v.id === 'color-contrast')
console.log(`color-contrast: ${ccV ? 'FAIL ✗ (' + ccV.nodes.length + ')' : 'PASS ✓'}`)
console.log('pageerrors:', errors.length ? errors : 'none')

// ── reduced motion — seal static ──────────────────────────────────────────────
const rc = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.querySelector('#certifications').scrollIntoView({ block: 'center' }))
await rp.waitForTimeout(700)
const anim = await rp.evaluate(() => getComputedStyle(document.querySelector('.certs-seal-ring')).animationName)
console.log(`REDUCED-MOTION: seal animation-name = ${anim} (want none)`)
await rc.close()

await browser.close()
console.log('\nDONE.')
