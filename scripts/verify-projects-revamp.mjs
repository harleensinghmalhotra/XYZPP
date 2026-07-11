import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5192'
const out = resolve(root, 'shots', 'projects-revamp')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const VP = { width: 1536, height: 743 }
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(800)

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const geo = await page.evaluate(() => {
  const el = document.getElementById('projects')
  return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
})
console.log('SECTION HEIGHT:', geo.h, 'px =', (geo.h / geo.innerH).toFixed(2), 'viewports')

// bring section to top, let entrance + globe boot
await to(Math.round(geo.top))
await page.waitForTimeout(3000)
await page.screenshot({ path: resolve(out, 'stage.png') })
console.log('  ✓ stage.png — the globe on its new stage')

// ── STAGE assertions: dotted map GONE, star field present, globe canvas mounted
const stage = await page.evaluate(() => ({
  hasDottedMap: !!document.querySelector('.proj-map, .proj-map-img'),
  stars: document.querySelectorAll('.proj-star').length,
  hasCanvas: !!document.querySelector('.proj-globe canvas'),
  dests: document.querySelectorAll('.proj-dest').length,
  destHrefs: [...document.querySelectorAll('.proj-dest')].map((a) => a.getAttribute('href')),
  records: document.querySelectorAll('.proj-rec').length,
  featured: document.querySelectorAll('.proj-rec.is-featured').length,
}))
console.log('  STAGE:', JSON.stringify(stage))
console.log('    dotted map removed:', stage.hasDottedMap === false ? '✓' : '✗ STILL PRESENT')
console.log('    star field:', stage.stars > 30 ? `✓ (${stage.stars} stars)` : `✗ (${stage.stars})`)
console.log('    globe canvas mounted:', stage.hasCanvas ? '✓' : '✗ (WebGL fallback?)')
console.log('    destination panels:', stage.dests, '| hrefs', JSON.stringify(stage.destHrefs))
console.log('    shipment records:', stage.records, '| featured', stage.featured)

// ── GLOBE rotation proof — two frames ~850ms apart ───────────────────────────
async function globeClip(pg) {
  const b = await (await pg.$('.proj-globe')).boundingBox()
  return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) }
}
async function pxDiff(a, b) {
  const [r1, r2] = await Promise.all([sharp(a).raw().toBuffer({ resolveWithObject: true }), sharp(b).raw().toBuffer({ resolveWithObject: true })])
  let diff = 0
  const da = r1.data, db = r2.data
  for (let i = 0; i < da.length; i += 4) { if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) diff++ }
  return { diff, total: da.length / 4, pct: +(diff / (da.length / 4) * 100).toFixed(2) }
}
const gclip = await globeClip(page)
const g1 = await page.screenshot({ clip: gclip })
await page.waitForTimeout(850)
const g2 = await page.screenshot({ clip: gclip })
await sharp(g2).png().toFile(resolve(out, 'globe.png'))
const gd = await pxDiff(g1, g2)
console.log(`  ✓ globe.png — auto-rotate: ${gd.pct}% px changed →`, gd.diff > gd.total * 0.005 ? 'ROTATES ✓' : 'STATIC ✗')

// ── DESTINATION PANELS + hover (globe reacts) ────────────────────────────────
await page.screenshot({ path: resolve(out, 'dests.png') })
console.log('  ✓ dests.png — three destination panels')

// THE CONVERSATION — hover each region panel, globe swings to face it. Scroll so
// the globe stays fully framed while the panels' top sliver is hoverable.
await to(Math.round(geo.top + 140))
await page.waitForTimeout(700)
const gclip2 = await globeClip(page)
const slugs = ['africa', 'asia', 'europe']
const panels = await page.$$('.proj-dest')
for (let i = 0; i < panels.length; i++) {
  await page.mouse.move(10, 10)
  await page.waitForTimeout(900) // let it settle / resume auto-rotate
  const base = await page.screenshot({ clip: gclip2 })
  const pb = await panels[i].boundingBox()
  const hx = pb.x + pb.width / 2
  const hy = Math.min(pb.y + 30, VP.height - 8) // top sliver, within viewport
  await page.mouse.move(hx, hy)
  await page.waitForTimeout(950) // pointOfView transition is ~900ms
  const hov = await page.screenshot({ clip: gclip2 })
  await sharp(hov).png().toFile(resolve(out, `globe-focus-${slugs[i]}.png`))
  const lift = await page.evaluate((idx) => getComputedStyle(document.querySelectorAll('.proj-dest')[idx]).transform, i)
  const react = await pxDiff(base, hov)
  console.log(`  ✓ globe-focus-${slugs[i]}.png — panel lift: ${lift !== 'none' ? '✓' : '✗ none'} | globe swing: ${react.pct}% px`)
}
await page.mouse.move(10, 10)
await page.waitForTimeout(500)
await to(Math.round(geo.top + 140))
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(out, 'dest-hover.png'), fullPage: false })
console.log('  ✓ dest-hover.png')

// ── SHIPMENT RECORDS (EN) + record-hover pulse ───────────────────────────────
const recEl = await page.$('.proj-records')
const rb = await recEl.boundingBox()
await to(Math.round(geo.top + rb.y - VP.height * 0.25))
await page.waitForTimeout(1600)
await page.screenshot({ path: resolve(out, 'records-en.png') })
console.log('  ✓ records-en.png')
const recNames = await page.evaluate(() => [...document.querySelectorAll('.proj-rec-country')].map((n) => n.textContent.trim()))
console.log('    record countries:', JSON.stringify(recNames))

// hover a record → card lifts + pulseCountry() fires on the globe (wired; globe is
// above the records so its swing isn't co-framed here — verified error-free).
const recCards = await page.$$('.proj-rec')
if (recCards[1]) {
  const cb = await recCards[1].boundingBox()
  if (cb) {
    await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2)
    await page.waitForTimeout(500)
    const recLift = await page.evaluate(() => getComputedStyle(document.querySelectorAll('.proj-rec')[1]).transform)
    await page.screenshot({ path: resolve(out, 'record-hover.png') })
    console.log(`  ✓ record-hover.png — card lift: ${recLift !== 'none' ? '✓' : '✗ none'} (pulseCountry wired)`)
    await page.mouse.move(10, 10)
  }
}

// ── FPS scrub through the section ────────────────────────────────────────────
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
console.log('FPS (globe + reveals):', JSON.stringify(fps))
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe / contrast on the dark ground ────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#projects').analyze()
console.log('axe #projects violations:', axe.violations.length)
for (const v of axe.violations) {
  console.log(` [${v.impact}] ${v.id}: ${v.help}`)
  for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' '), '::', (n.failureSummary || '').split('\n').slice(-1)[0])
}

// ── GATE-OFF — ?hideRestricted → HDFC + ZEE absent from records ───────────────
const tp = await ctx.newPage()
await tp.goto(url + '?hideRestricted', { waitUntil: 'networkidle', timeout: 60000 })
await tp.evaluate(() => document.fonts && document.fonts.ready)
await tp.evaluate(() => { const el = document.querySelector('.proj-records'); el && el.scrollIntoView({ block: 'center' }) })
await tp.waitForTimeout(1500)
const gate = await tp.evaluate(() => {
  const names = [...document.querySelectorAll('.proj-rec-country')].map((n) => n.textContent.trim())
  return { count: names.length, hasHDFC: names.some((n) => /HDFC/i.test(n)), hasZEE: names.some((n) => /ZEE/i.test(n)), names }
})
await tp.screenshot({ path: resolve(out, 'records-gateoff.png') })
console.log(`  ✓ records-gateoff.png — records: ${gate.count}, HDFC:${gate.hasHDFC} ZEE:${gate.hasZEE} (want false/false)`, JSON.stringify(gate.names))
await tp.close()

// ── FR pass — records + destinations in French ───────────────────────────────
const fp = await ctx.newPage()
await fp.addInitScript(() => localStorage.setItem('qfp.lang', 'fr'))
await fp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await fp.evaluate(() => document.fonts && document.fonts.ready)
await fp.evaluate(() => { const el = document.getElementById('projects'); el && el.scrollIntoView({ block: 'start' }) })
await fp.waitForTimeout(2400)
await fp.screenshot({ path: resolve(out, 'dests-fr.png') })
await fp.evaluate(() => { const el = document.querySelector('.proj-records'); el && el.scrollIntoView({ block: 'center' }) })
await fp.waitForTimeout(1600)
await fp.screenshot({ path: resolve(out, 'records-fr.png') })
const frCheck = await fp.evaluate(() => ({
  eyebrow: document.querySelector('.proj-records-eyebrow')?.textContent,
  dest0: document.querySelector('.proj-dest-name')?.textContent,
  html: document.documentElement.lang,
}))
console.log('  ✓ dests-fr.png / records-fr.png —', JSON.stringify(frCheck))
await fp.close()

// ── REDUCED MOTION — static globe, words visible ─────────────────────────────
const rc = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.fonts && document.fonts.ready)
await rp.evaluate(() => document.getElementById('projects').scrollIntoView({ block: 'start' }))
await rp.waitForTimeout(1400)
const rgClip = await globeClip(rp)
const rgg1 = await rp.screenshot({ clip: rgClip }); await rp.waitForTimeout(700); const rgg2 = await rp.screenshot({ clip: rgClip })
const rgd = await pxDiff(rgg1, rgg2)
const rmText = await rp.evaluate(() => {
  const pw = document.querySelector('.pw')
  const rec = document.querySelector('.proj-rec-num')
  return { pwOpacity: pw && getComputedStyle(pw).opacity, recText: rec && rec.textContent.trim() }
})
console.log(`REDUCED-MOTION: globe ${rgd.pct}% px changed (want ~0, static) | header word opacity ${rmText.pwOpacity} | record num "${rmText.recText}"`)
await rp.screenshot({ path: resolve(out, 'reduced.png') })
await rc.close()

// ── console errors ───────────────────────────────────────────────────────────
console.log('CONSOLE ERRORS:', consoleErrors.length)
for (const e of consoleErrors.slice(0, 10)) console.log('   ⚠', e)

await browser.close()
console.log('\nDONE → shots/projects-revamp/')
