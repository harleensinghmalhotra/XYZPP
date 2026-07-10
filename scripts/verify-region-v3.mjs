import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(1000)

const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const geo = await page.evaluate(() => {
  const el = document.getElementById('projects')
  return { top: el.getBoundingClientRect().top + window.scrollY, innerH: window.innerHeight }
})
// first bring the section top into view so its entrance timeline fires...
await to(Math.round(geo.top))
await page.waitForTimeout(2600)
// ...then scroll the region cards to sit centred in the viewport for the shots
const regionsY = await page.evaluate(() => document.querySelector('.proj-regions').getBoundingClientRect().top + window.scrollY)
await to(Math.round(regionsY - (geo.innerH - 500) / 2))
await page.waitForTimeout(1100) // let entrance clearProps + scroll fully settle before measuring

// ── 1. NO micro-tags remain ──────────────────────────────────────────────────
const tagCount = await page.evaluate(() => document.querySelectorAll('.proj-region-tag').length)
console.log(`\nMICRO-TAGS present: ${tagCount} (want 0) → ${tagCount === 0 ? 'REMOVED ✓' : 'STILL PRESENT ✗'}`)

// ── 2. TITLE BASELINE ALIGNMENT — assert 3 title tops equal ──────────────────
const diag = await page.evaluate(() =>
  [...document.querySelectorAll('.proj-region')].map((card) => {
    const name = card.querySelector('.proj-region-name')
    const content = card.querySelector('.proj-region-content')
    const cn = getComputedStyle(name)
    return {
      cardTop: +card.getBoundingClientRect().top.toFixed(2),
      cardH: +card.getBoundingClientRect().height.toFixed(2),
      contentTop: +content.getBoundingClientRect().top.toFixed(2),
      nameTop: +name.getBoundingClientRect().top.toFixed(2),
      nameH: +name.getBoundingClientRect().height.toFixed(2),
      lh: cn.lineHeight, minH: cn.minHeight, mt: getComputedStyle(content).paddingTop,
      text: name.textContent.slice(0, 14),
    }
  })
)
console.log('DIAG:', JSON.stringify(diag, null, 1))
const tops = await page.evaluate(() =>
  [...document.querySelectorAll('.proj-region-name')].map((n) => {
    const r = n.getBoundingClientRect()
    return { text: n.textContent.slice(0, 22), top: +r.top.toFixed(2), viewportW: window.innerWidth }
  })
)
console.log('\nTITLE TOP-Y @1536:')
tops.forEach((t) => console.log(`   ${t.top.toString().padStart(8)}  "${t.text}"`))
const ys = tops.map((t) => t.top)
const spread = Math.max(...ys) - Math.min(...ys)
const equal = spread < 0.75 // sub-pixel tolerance (DPR 1.25 rounding)
console.log(`   spread = ${spread.toFixed(2)}px → ${equal ? 'ALL EQUAL ✓' : 'MISALIGNED ✗'}`)

// ── region cards rest shot ────────────────────────────────────────────────────
const regionsBox = await (await page.$('.proj-regions')).boundingBox()
const pad = 60
const clip = {
  x: Math.max(0, Math.round(regionsBox.x - pad)),
  y: Math.max(0, Math.round(regionsBox.y - pad)),
  width: Math.min(1536, Math.round(regionsBox.width + pad * 2)),
  height: Math.round(regionsBox.height + pad * 2),
}
await page.screenshot({ path: resolve(out, 'region-v3.png'), clip })
console.log('\n  ✓ region-v3.png')

// ── hover shot (middle card) ──────────────────────────────────────────────────
const cards = await page.$$('.proj-region')
const cb = await cards[1].boundingBox()
await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2)
await page.waitForTimeout(650)
await page.screenshot({ path: resolve(out, 'region-v3-hover.png'), clip })
console.log('  ✓ region-v3-hover.png')
await page.mouse.move(10, 10)
await page.waitForTimeout(400)

// ── 3. EYEBROW cursive closeup — scroll the header back into view first ───────
const ebY = await page.evaluate(() => document.querySelector('.proj-eyebrow-script').getBoundingClientRect().top + window.scrollY)
await to(Math.round(ebY - 120))
await page.waitForTimeout(500)
const eb = await page.$('.proj-eyebrow-script')
const ebInfo = await page.evaluate(() => {
  const el = document.querySelector('.proj-eyebrow-script')
  const cs = getComputedStyle(el)
  return { font: cs.fontFamily, size: cs.fontSize, transform: cs.textTransform, color: cs.color, text: el.textContent }
})
console.log('\nEYEBROW:', JSON.stringify(ebInfo))
const ebBox = await eb.boundingBox()
await page.screenshot({
  path: resolve(out, 'eyebrow-cursive.png'),
  clip: {
    x: Math.max(0, Math.round(ebBox.x - 30)),
    y: Math.max(0, Math.round(ebBox.y - 30)),
    width: Math.round(ebBox.width + 300),
    height: Math.round(ebBox.height + 60),
  },
})
console.log('  ✓ eyebrow-cursive.png')

// ── contrast sample: gold eyebrow + title over navy ──────────────────────────
// (navy section bg #0F2444; gold2 #C89A3C ≈ 6.0:1 on navy — decorative accent AA)

// ── 4. shadow present on cards ────────────────────────────────────────────────
const shadow = await page.evaluate(() => getComputedStyle(document.querySelector('.proj-region')).boxShadow)
console.log('\nCARD box-shadow layers:', shadow.split('),').length)

// ── FPS scrub through the band ────────────────────────────────────────────────
await to(Math.round(geo.top - geo.innerH))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 2200
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: geo.top + geo.innerH * 1.4 })
console.log('\nFPS:', JSON.stringify(fps))
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))

// ── axe on the section ────────────────────────────────────────────────────────
const axe = await new AxeBuilder({ page }).include('#projects').analyze()
console.log('axe #projects violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}: ${v.help}`); for (const n of v.nodes.slice(0, 3)) console.log('     ', n.target.join(' ')) }

await browser.close()
console.log('\nDONE.')
