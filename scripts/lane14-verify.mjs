import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import fs from 'node:fs'

// Lane 14 — white sky + ink label + Quality Check + flat book.
// Usage: node scripts/lane14-verify.mjs <port>
const PORT = process.argv[2] || '5210'
const OUT = 'shots/lane14'
fs.mkdirSync(OUT, { recursive: true })
const DSF = 1.25

const chan = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
const contrast = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05) }
// composite fg(with alpha) over bg
const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a))

const NAVY = [15, 36, 68]      // .conv-cap-name #0F2444
const INK = [28, 32, 25]       // .conv-cap-desc ink @ 0.75
const pForStation = (i) => (i * 0.77) / 5

async function patch(file, cssX, cssY, w = 24, h = 10) {
  const { data, info } = await sharp(file)
    .extract({ left: Math.round(cssX * DSF), top: Math.round(cssY * DSF), width: Math.round(w * DSF), height: Math.round(h * DSF) })
    .raw().toBuffer({ resolveWithObject: true })
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += info.channels) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++ }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

async function scrubTo(page, p) {
  await page.evaluate((prog) => {
    const el = document.querySelector('.conv-scroll')
    const y = el.getBoundingClientRect().top + window.scrollY + prog * (el.offsetHeight - window.innerHeight)
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  }, p)
  await page.waitForTimeout(1300)
}

// ── EN: six stations + sky/floor/contrast ───────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: DSF })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  await page.waitForSelector('.conv-scroll')

  console.log('\n=== EN — six stations ===')
  console.log('STATION            skyTop RGB       floorRGB        name→sky   desc→sky   capName')
  const STAGES = ['print', 'quality', 'fulfillment', 'warehouse', 'ship', 'covered']
  for (let i = 0; i < 6; i++) {
    await scrubTo(page, Math.min(pForStation(i), 0.75))
    const f = `${OUT}/station-${i}-${STAGES[i]}-en.png`
    await page.screenshot({ path: f })
    const capName = await page.evaluate(() => document.querySelector('.conv-cap.is-active .conv-cap-name')?.textContent || '')
    // sky at caption name band (~y118) and desc band (~y215) sampled from clear sky column x~980
    const skyName = await patch(f, 980, 112, 40, 12)
    const skyDesc = await patch(f, 980, 210, 40, 12)
    const skyTop = await patch(f, 700, 96, 60, 14)
    const floor = await patch(f, 300, 705, 80, 20)
    const cName = contrast(lum(...NAVY), lum(...skyName))
    const cDesc = contrast(lum(...over(INK, skyDesc, 0.75)), lum(...skyDesc))
    if (cName < 4.5) fail(`${STAGES[i]}: name contrast ${cName.toFixed(2)} < 4.5`)
    if (cDesc < 4.5) fail(`${STAGES[i]}: desc contrast ${cDesc.toFixed(2)} < 4.5`)
    console.log(`  ${STAGES[i].padEnd(16)} [${skyTop.join(',')}]  [${floor.join(',')}]   ${cName.toFixed(1)}:1     ${cDesc.toFixed(1)}:1    "${capName}"`)
  }

  // sky white? (skyTop each channel ≥ 235) · floor dark? (floor luminance low)
  const skyTop = await patch(`${OUT}/station-0-print-en.png`, 700, 96, 80, 16)
  const floor = await patch(`${OUT}/station-0-print-en.png`, 300, 705, 100, 20)
  if (skyTop.every((c) => c >= 235)) ok(`sky top reads white/cream [${skyTop.join(',')}]`); else fail(`sky top not white: [${skyTop.join(',')}]`)
  if (lum(...floor) < 0.06) ok(`floor still dark [${floor.join(',')}], lum ${lum(...floor).toFixed(3)}`); else fail(`floor not dark: [${floor.join(',')}]`)

  // Quality grid name (Layer 2 doc) + caption in EN
  const gridQ = await page.evaluate(() => {
    const cols = [...document.querySelectorAll('#process .proc-col-name')].map((n) => n.textContent.trim())
    return cols
  })
  if (gridQ.includes('Quality Check')) ok('detail grid shows "Quality Check" (EN)'); else fail('grid missing Quality Check: ' + JSON.stringify(gridQ))

  // exit melt into Projects + nav→sky boundary
  await scrubTo(page, 0.985)
  await page.screenshot({ path: `${OUT}/exit-melt-en.png` }); ok('shot exit-melt-en.png')
  await scrubTo(page, 0.05)
  await page.screenshot({ path: `${OUT}/nav-sky-boundary-en.png` }); ok('shot nav-sky-boundary-en.png')

  if (!errs.length) ok('zero console errors'); else { fail(`${errs.length} console errors`); errs.slice(0, 5).forEach((e) => console.log('     · ' + e)) }
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  if (!axe.violations.length) ok('axe: zero violations'); else { fail(`axe: ${axe.violations.length}`); axe.violations.forEach((v) => console.log(`     [${v.impact}] ${v.id}`)) }
  await ctx.close()
}

// ── FR + ES: Quality station ────────────────────────────────────────────────
for (const [lng, expected] of [['fr', 'Contrôle Qualité'], ['es', 'Control de Calidad']]) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: DSF })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l); localStorage.setItem('qfp.consent', 'accepted') } catch {} }, lng)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  await page.waitForSelector('.conv-scroll')
  await scrubTo(page, pForStation(1))
  await page.screenshot({ path: `${OUT}/quality-${lng}.png` })
  const capName = await page.evaluate(() => document.querySelector('.conv-cap.is-active .conv-cap-name')?.textContent || '')
  const grid = await page.evaluate(() => [...document.querySelectorAll('#process .proc-col-name')].map((n) => n.textContent.trim()))
  console.log(`\n=== ${lng.toUpperCase()} quality ===  caption="${capName}"`)
  if (capName === expected) ok(`caption = "${expected}"`); else fail(`caption "${capName}" ≠ "${expected}"`)
  if (grid.includes(expected)) ok(`grid = "${expected}"`); else fail(`grid missing "${expected}": ${JSON.stringify(grid)}`)
  if (!errs.length) ok('zero console errors'); else fail(`${errs.length} console errors`)
  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
