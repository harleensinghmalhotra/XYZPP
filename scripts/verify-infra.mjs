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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
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
  const el = document.getElementById('infrastructure')
  return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
})
console.log('SECTION HEIGHT:', geo.h, 'px')

// ── fire every ScrollTrigger by walking down the section, then settle ─────────
for (let y = geo.top; y < geo.top + geo.h; y += Math.round(geo.innerH * 0.6)) {
  await to(Math.round(y))
  await page.waitForTimeout(320)
}
await page.waitForTimeout(1200)

// ── FULL SECTION SHOT — hide the fixed nav so it doesn't overlap the top ──────
await page.evaluate(() => { const n = document.querySelector('header, nav, [class*="nav"]'); if (n) n.dataset._h = '1', (n.style.display = 'none') })
const infra = await page.$('#infrastructure')
await infra.screenshot({ path: resolve(out, 'infra-full.png') })
await page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })
console.log('  ✓ infra-full.png')

// ── labels ≥11px check (the 8.5px sin) ────────────────────────────────────────
const tinyLabels = await page.evaluate(() => {
  const sels = ['.infra-eyebrow', '.infra-num', '.infra-block-cap', '.infra-video-note', '.infra-person-cap']
  const bad = []
  for (const s of sels) for (const el of document.querySelectorAll(s)) {
    const px = parseFloat(getComputedStyle(el).fontSize)
    if (px < 11) bad.push(`${s} = ${px}px`)
  }
  return bad
})
console.log(`LABELS ≥11px: ${tinyLabels.length === 0 ? 'PASS ✓' : 'FAIL ✗ ' + JSON.stringify(tinyLabels)}`)

// ── VIDEO DIALOG open state ───────────────────────────────────────────────────
await to(Math.round(geo.top))
const vY = await page.evaluate(() => document.querySelector('.infra-video').getBoundingClientRect().top + window.scrollY)
await to(Math.round(vY - 150))
await page.waitForTimeout(500)
await page.click('.infra-video-thumb')
await page.waitForTimeout(500)
const dialogOpen = await page.$('.infra-dialog')
await page.screenshot({ path: resolve(out, 'infra-video.png') })
console.log(`  ✓ infra-video.png — dialog ${dialogOpen ? 'OPEN ✓' : 'MISSING ✗'}`)
// Esc closes
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
const closed = !(await page.$('.infra-dialog'))
console.log(`  Esc closes: ${closed ? '✓' : '✗'}`)

// ── FPS scrub + CLS ───────────────────────────────────────────────────────────
await to(Math.round(geo.top - geo.innerH))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2200
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: geo.top + geo.h })
console.log('FPS:', JSON.stringify(fps))
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe / contrast ────────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#infrastructure').analyze()
console.log('axe #infrastructure violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}: ${v.help}`); for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' ')) }
const ccV = axe.violations.find((v) => v.id === 'color-contrast')
const ccI = (axe.incomplete || []).find((v) => v.id === 'color-contrast')
const ccP = axe.passes.find((p) => p.id === 'color-contrast')
console.log(`color-contrast: violations=${ccV ? ccV.nodes.length : 0}, incomplete=${ccI ? ccI.nodes.length : 0}, passed=${ccP ? ccP.nodes.length : 0}`)
console.log('console errors:', errors.length ? errors : 'none')

// ── MISSING ASSETS report ─────────────────────────────────────────────────────
const assets = [
  'qfp/infra/facility-01.webp', 'qfp/infra/facility-02.webp', 'qfp/infra/facility-03.webp',
  'qfp/infra/people-01.webp', 'qfp/infra/people-02.webp', 'qfp/infra/people-03.webp', 'qfp/infra/people-04.webp',
  'qfp/infra/facility-walkthrough.mp4',
]
console.log('\nASSET STATUS (drop-in paths under public/):')
let missing = 0
for (const a of assets) {
  // Vite dev serves index.html (text/html, 200) for missing files — so a real
  // asset is only "present" if the response content-type matches its kind.
  const info = await page.evaluate((u) => fetch(u).then((r) => ({ status: r.status, ct: r.headers.get('content-type') || '' })).catch(() => ({ status: 0, ct: '' })), url + '/' + a)
  const wantImg = a.endsWith('.webp'); const wantVid = a.endsWith('.mp4')
  const ok = info.status >= 200 && info.status < 300 &&
    ((wantImg && /image\//.test(info.ct)) || (wantVid && /video\//.test(info.ct)))
  if (!ok) missing++
  console.log(`  ${ok ? 'present ✓' : 'MISSING ✗'}  /${a}`)
}
console.log(`  → ${missing} missing (expected 8: 3 facility, 4 people, 1 video)`)

// ── reduced motion ────────────────────────────────────────────────────────────
const rc = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.querySelector('#infrastructure').scrollIntoView({ block: 'center' }))
await rp.waitForTimeout(700)
const rmVisible = await rp.evaluate(() => {
  const t = document.querySelector('.infra-title'); const b = document.querySelector('.infra-block')
  return { title: getComputedStyle(t).opacity, block: getComputedStyle(b).opacity }
})
console.log(`\nREDUCED-MOTION: title opacity ${rmVisible.title}, first block opacity ${rmVisible.block} (want 1/1, static)`)
await rc.close()

await browser.close()
console.log('\nDONE.')
