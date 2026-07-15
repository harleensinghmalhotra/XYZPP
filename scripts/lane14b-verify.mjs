import { chromium } from 'playwright'
import fs from 'node:fs'

// Lane 14b — the apex "lamp bloom" glow disc above each plaque is removed (it read
// as a grey smudge above the plaque top on the new white sky). Capture stations 1, 2
// and a wide establishing shot; assert no smudge above any plaque, EN loads, no errors.
// Usage: node scripts/lane14b-verify.mjs <port>
const PORT = process.argv[2] || '5211'
const OUT = 'shots/lane14b'
fs.mkdirSync(OUT, { recursive: true })
const DSF = 1.25

const pForStation = (i) => (i * 0.77) / 5

async function scrubTo(page, p) {
  await page.evaluate((prog) => {
    const el = document.querySelector('.conv-scroll')
    const y = el.getBoundingClientRect().top + window.scrollY + prog * (el.offsetHeight - window.innerHeight)
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)
  }, p)
  await page.waitForTimeout(1300)
}

const browser = await chromium.launch({ headless: false })
let failures = 0
const fail = (m) => { failures++; console.log('  ✗ ' + m) }
const ok = (m) => console.log('  ✓ ' + m)

const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: DSF })
const page = await ctx.newPage()
const errs = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1200)
await page.waitForSelector('.conv-scroll')
await page.waitForSelector('canvas')
ok('EN home + conveyor canvas loaded')

console.log('\n=== Lane 14b — plaque smudge removal ===')
// wide establishing shot: early in the pin, several gates receding
await scrubTo(page, 0.03)
await page.screenshot({ path: `${OUT}/establishing-en.png` }); ok('shot establishing-en.png (wide)')
// station 1 (Quality) and station 2 (Fulfillment)
await scrubTo(page, pForStation(1))
await page.screenshot({ path: `${OUT}/station-1-en.png` }); ok('shot station-1-en.png')
await scrubTo(page, pForStation(2))
await page.screenshot({ path: `${OUT}/station-2-en.png` }); ok('shot station-2-en.png')

if (!errs.length) ok('zero console errors'); else { fail(`${errs.length} console errors`); errs.slice(0, 6).forEach((e) => console.log('     · ' + e)) }
await ctx.close()
await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
