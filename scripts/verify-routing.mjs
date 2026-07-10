import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5177'
const OUT = 'shots/routing'
mkdirSync(OUT, { recursive: true })

const lenis = (p) => p.evaluate(() => typeof window.__lenis !== 'undefined')
const scrollTo = (p, y) =>
  p.evaluate((target) => {
    if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true })
    else window.scrollTo(0, target)
  }, y)

const problems = []
const results = []
const log = (m) => { console.log(m); results.push(m) }

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await context.newPage()

const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[console] ${m.text()}`) })
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`))

// ─── (a) HOMEPAGE FULL SCROLL-THROUGH ─────────────────────────────────────────
log('\n── (a) Homepage scroll-through (first pass) ──')
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
log(`  __lenis mounted on "/": ${await lenis(page)}`)
const homeHeight = await page.evaluate(() => document.documentElement.scrollHeight)
log(`  document scrollHeight: ${homeHeight}px`)

const OFFSETS = [
  ['a01-hero-top', 0],
  ['a02-hero-pin-mid', 900],
  ['a03-hero-pin-late', 1700],
  ['a04-book-landing', 2600],
  ['a05-whatweprint-enter', 4200],
  ['a06-whatweprint-jack', 5200],
]
for (const [name, y] of OFFSETS) {
  await scrollTo(page, y)
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}
await scrollTo(page, 0)
await page.waitForTimeout(600)

// ─── (b) NAVIGATION STRESS: / → /about → / (×3), then scroll again ───────────
log('\n── (b) SPA navigation stress ×3 (engine mount/unmount) ──')
for (let i = 1; i <= 3; i++) {
  await page.getByRole('link', { name: 'About', exact: true }).click()
  await page.waitForURL('**/about')
  await page.waitForTimeout(500)
  const onAbout = await lenis(page)
  const navOk = await page.locator('header nav a', { hasText: '' }).count()
  log(`  round ${i}: on /about → __lenis unmounted: ${!onAbout}`)
  if (onAbout) problems.push(`round ${i}: __lenis still defined on /about (engine leaked)`)

  await page.getByRole('link', { name: 'Quarterfold Printabilities home' }).click()
  await page.waitForURL(BASE + '/')
  await page.waitForTimeout(900)
  const onHome = await lenis(page)
  log(`  round ${i}: back on "/" → __lenis remounted: ${onHome}`)
  if (!onHome) problems.push(`round ${i}: __lenis missing after returning to "/"`)
}

log('\n── (b) Post-stress homepage scroll (stale-pin check) ──')
const h2 = await page.evaluate(() => document.documentElement.scrollHeight)
log(`  document scrollHeight after 3 round-trips: ${h2}px (first pass: ${homeHeight}px)`)
if (Math.abs(h2 - homeHeight) > 200) problems.push(`scrollHeight drifted ${homeHeight}→${h2} (possible stale pin)`)
for (const [name, y] of OFFSETS) {
  await scrollTo(page, y)
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/b-${name}.png` })
}
await scrollTo(page, 0)
await page.waitForTimeout(400)

// ─── (c) EVERY SHELL ROUTE renders with nav + footer ─────────────────────────
log('\n── (c) Shell routes (nav + footer present) ──')
const ROUTES = [
  '/about', '/educational-books', '/trade-books', '/print-on-demand',
  '/infrastructure', '/fulfilment', '/contact',
  '/legal/privacy', '/legal/cookies', '/legal/terms', '/legal/accessibility',
]
for (const r of ROUTES) {
  await page.goto(BASE + r, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const navOk = await page.locator('header').first().isVisible()
  const footerOk = await page.locator('footer').first().isVisible()
  const h1 = (await page.locator('main#main h1').first().textContent())?.trim()
  const engineOff = !(await lenis(page))
  const ok = navOk && footerOk && !!h1 && engineOff
  log(`  ${r.padEnd(26)} nav:${navOk ? 'Y' : 'N'} footer:${footerOk ? 'Y' : 'N'} lenis-off:${engineOff ? 'Y' : 'N'} h1:"${h1}"`)
  if (!ok) problems.push(`route ${r}: nav:${navOk} footer:${footerOk} h1:${h1} engineOff:${engineOff}`)
  const slug = r.replace(/\//g, '_').replace(/^_/, '')
  await page.screenshot({ path: `${OUT}/c-${slug}.png`, fullPage: true })
}

// ─── (d) CONSOLE ERRORS ───────────────────────────────────────────────────────
log('\n── (d) Console / page errors ──')
if (consoleErrors.length === 0) log('  ZERO console/page errors ✓')
else consoleErrors.forEach((e) => log('  ✗ ' + e))

log('\n════════ SUMMARY ════════')
log(`  console errors: ${consoleErrors.length}`)
log(`  assertion problems: ${problems.length}`)
problems.forEach((p) => log('  ✗ ' + p))
if (problems.length === 0 && consoleErrors.length === 0) log('  ALL CHECKS PASSED ✓')

await browser.close()
process.exit(problems.length + consoleErrors.length === 0 ? 0 : 1)
