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
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(500)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.display = 'none' } })
const showNav = () => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })

// fire entrances by walking the page
const infraTop = await page.evaluate(() => document.getElementById('infrastructure').getBoundingClientRect().top + window.scrollY)
const certsGeo = await page.evaluate(() => { const el = document.getElementById('certifications'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
for (let y = infraTop; y < certsGeo.top + certsGeo.h; y += Math.round(certsGeo.innerH * 0.5)) { await to(Math.round(y)); await page.waitForTimeout(260) }
await page.waitForTimeout(1200)

// ── 1 · EYEBROW restored ──────────────────────────────────────────────────────
const eb = await page.evaluate(() => {
  const e = document.querySelector('.infra-eyebrow')
  return e ? { text: e.textContent, size: getComputedStyle(e).fontSize, color: getComputedStyle(e).color, hasDash: !!e.querySelector('::after') } : null
})
console.log('EYEBROW:', JSON.stringify(eb))
await to(Math.round(infraTop - 90))
await page.waitForTimeout(400)
const ebBox = await page.evaluate(() => { const r = document.querySelector('.infra-head').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
await page.screenshot({ path: resolve(out, 'infra-eyebrow.png'), clip: { x: Math.max(0, Math.round(ebBox.x - 20)), y: Math.max(0, Math.round(ebBox.y - 20)), width: Math.round(Math.min(900, ebBox.w + 40)), height: Math.round(ebBox.h + 40) } })
console.log('  ✓ infra-eyebrow.png')

// ── 2 · JUNCTION — people photos + captions fully clear of the certs dome ─────
const junction = await page.evaluate(() => {
  const arc = document.querySelector('.certs-arc-top').getBoundingClientRect()
  const caps = [...document.querySelectorAll('.infra-person-cap')].map((c) => c.getBoundingClientRect().bottom + window.scrollY)
  const photos = [...document.querySelectorAll('.infra-person .infra-photo')].map((p) => p.getBoundingClientRect().bottom + window.scrollY)
  const arcTop = arc.top + window.scrollY
  const lowest = Math.max(...caps, ...photos)
  return { arcTop: +arcTop.toFixed(1), lowestContent: +lowest.toFixed(1), gap: +(arcTop - lowest).toFixed(1) }
})
console.log(`\nJUNCTION: lowest people content @${junction.lowestContent}, certs dome starts @${junction.arcTop}, clearance = ${junction.gap}px → ${junction.gap > 0 ? 'CLEAR ✓' : 'COLLISION ✗'}`)
// capture the exact junction (people grid bottom → dome → pills)
await page.setViewportSize({ width: 1536, height: 1200 })
await page.waitForTimeout(150)
const jClipTop = await page.evaluate(() => {
  const firstCap = document.querySelector('.infra-person-cap')
  return firstCap.getBoundingClientRect().top + window.scrollY - 60
})
await to(Math.round(jClipTop))
await page.waitForTimeout(350)
hideNav()
await page.screenshot({ path: resolve(out, 'junction-people-certs.png'), clip: { x: 0, y: 0, width: 1536, height: 760 } })
showNav()
await page.setViewportSize(VP.viewport)
console.log('  ✓ junction-people-certs.png')

// ── 3 · CERTS RICH — full section rest + hover ───────────────────────────────
await page.setViewportSize({ width: 1536, height: 1360 })
await page.waitForTimeout(150)
const cTop = await page.evaluate(() => document.getElementById('certifications').getBoundingClientRect().top + window.scrollY)
await to(Math.round(cTop - 210))
await page.waitForTimeout(400)
hideNav()
await page.screenshot({ path: resolve(out, 'certs-rich.png'), clip: { x: 0, y: 0, width: 1536, height: Math.min(1360, certsGeo.h + 250) } })
console.log('  ✓ certs-rich.png')
// hover the second card
const cards = await page.$$('.cert-card')
const cb = await cards[1].boundingBox()
await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2)
await page.waitForTimeout(650)
await page.screenshot({ path: resolve(out, 'certs-rich-hover.png'), clip: { x: 0, y: 0, width: 1536, height: Math.min(1360, certsGeo.h + 250) } })
await page.mouse.move(4, 4)
showNav()
await page.setViewportSize(VP.viewport)
console.log('  ✓ certs-rich-hover.png')

// ── licence code still present ────────────────────────────────────────────────
const code = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.cert-card')].find((c) => /FSC Chain/.test(c.textContent))
  return card?.querySelector('.cert-card-code')?.textContent || ''
})
console.log(`\nFSC LICENCE: "${code}" ${/TUVDC-COC-101258/.test(code) ? '✓' : '✗'}`)

// ── FPS + CLS ─────────────────────────────────────────────────────────────────
await to(Math.round(certsGeo.top - certsGeo.innerH))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2000
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: certsGeo.top + certsGeo.h })
console.log('\nFPS:', JSON.stringify(fps), 'CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe on both sections ──────────────────────────────────────────────────────
for (const id of ['infrastructure', 'certifications']) {
  const axe = await new AxeBuilder({ page }).include('#' + id).analyze()
  const cc = axe.violations.find((v) => v.id === 'color-contrast')
  console.log(`axe #${id}: ${axe.violations.length} violations, color-contrast ${cc ? 'FAIL(' + cc.nodes.length + ')' : 'PASS ✓'}`)
  for (const v of axe.violations) console.log(`   [${v.impact}] ${v.id}`)
}

await browser.close()
console.log('\nDONE.')
