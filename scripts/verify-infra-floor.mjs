import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

// Verify the redesigned Infrastructure "floor" sections:
//   §3 capability TRIPTYCH (navy)  ·  §4 machine LEDGER (cream)
// Captures desktop 1536×743, mobile 375, FR locale, reduced-motion, and the three
// section boundaries (certifications → triptych → ledger → results).

const BASE = 'http://localhost:5173'
const OUT = './screenshots'
const URL = `${BASE}/infrastructure`
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

const wait = (p, ms) => p.waitForTimeout(ms)

// Dismiss the cookie consent so it doesn't overlay the section footer.
async function dismissCookies(page) {
  for (const label of ['Accept all', 'Reject all']) {
    const btn = page.getByRole('button', { name: label })
    if (await btn.count().catch(() => 0)) {
      await btn.first().click().catch(() => {})
      await wait(page, 250)
      return
    }
  }
}

// Hide every fixed/sticky chrome element (nav, cookie banner, scroll spine) so an
// element screenshot shows only the section itself, never overlapping chrome.
async function hideChrome(page) {
  await page.evaluate(() => {
    document.querySelectorAll('body *').forEach((el) => {
      const s = getComputedStyle(el)
      if (s.position === 'fixed' || s.position === 'sticky') el.style.visibility = 'hidden'
    })
  })
}

async function settle(page) {
  // scroll the whole page so every ScrollTrigger / IntersectionObserver reveal fires,
  // then return to top; give transitions time to finish.
  await page.evaluate(async () => {
    const step = Math.max(300, window.innerHeight * 0.6)
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 90))
    }
    window.scrollTo(0, 0)
  })
  await wait(page, 400)
}

async function shootSection(page, sel, file) {
  const el = page.locator(sel).first()
  await el.scrollIntoViewIfNeeded()
  await page.mouse.move(1, 1) // park the cursor so no row shows a stray hover state
  await wait(page, 1500) // let reveal transitions + CountUp finish
  await el.screenshot({ path: path.join(OUT, file) })
  console.log(`  ✓ ${file}`)
}

// Document-absolute box (getBoundingClientRect + scrollY) — needed for boundary
// scroll targets, since locator.boundingBox() is viewport-relative.
async function absBox(page, sel) {
  return await page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { top: r.top + window.scrollY, height: r.height, bottom: r.top + window.scrollY + r.height }
  })
}

async function main() {
  const browser = await chromium.launch()
  const log = {}
  try {
    // ── DESKTOP 1536×743 (EN) ──────────────────────────────────────────────
    const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await page.goto(URL, { waitUntil: 'networkidle' })
    await wait(page, 900)
    await dismissCookies(page)

    log.title = await page.title()
    log.hasTri = await page.locator('.inf-tri').count()
    log.triCols = await page.locator('.inf-tri-col').count()
    log.triLabels = await page.locator('.inf-tri-label').allTextContents()
    log.statNum = await page.locator('.inf-tri-stat-num').first().textContent().catch(() => null)
    log.hasLedger = await page.locator('.inf-ledger').count()
    log.ledgerRows = await page.locator('.inf-ledger-row').count()
    log.ledgerMarks = await page.locator('.inf-ledger-num').allTextContents()
    log.ledgerNames = await page.locator('.inf-ledger-name').allTextContents()
    console.log('CONTEXT:', JSON.stringify(log, null, 2))

    await settle(page)
    await hideChrome(page)
    await shootSection(page, '.inf-tri', 'infra-tri-desktop.png')
    await shootSection(page, '.inf-ledger-sec', 'infra-ledger-desktop.png')

    // hover row 2 (warm gold hairline) — chrome already hidden so the shot is clean
    await page.locator('.inf-ledger-row').nth(1).scrollIntoViewIfNeeded()
    await page.locator('.inf-ledger-row').nth(1).hover()
    await wait(page, 700)
    await page.locator('.inf-ledger-sec').first().screenshot({ path: path.join(OUT, 'infra-ledger-hover.png') })
    console.log('  ✓ infra-ledger-hover.png')

    // ── BOUNDARIES — viewport frames straddling each seam (document-absolute) ─
    const triAbs = await absBox(page, '.inf-tri')
    const ledAbs = await absBox(page, '.inf-ledger-sec')
    await page.mouse.move(1, 1)
    // certifications → triptych (top inward curve)
    await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, triAbs.top - 150))
    await wait(page, 700)
    await page.screenshot({ path: path.join(OUT, 'infra-bound-certs-tri.png') })
    console.log('  ✓ infra-bound-certs-tri.png')
    // triptych → ledger (bottom inward curve)
    await page.evaluate((y) => window.scrollTo(0, y), triAbs.bottom - 320)
    await wait(page, 700)
    await page.screenshot({ path: path.join(OUT, 'infra-bound-tri-ledger.png') })
    console.log('  ✓ infra-bound-tri-ledger.png')
    // ledger → results (results' inward top curve)
    await page.evaluate((y) => window.scrollTo(0, y), ledAbs.bottom - 340)
    await wait(page, 700)
    await page.screenshot({ path: path.join(OUT, 'infra-bound-ledger-results.png') })
    console.log('  ✓ infra-bound-ledger-results.png')
    await ctx.close()

    // ── FR LOCALE (desktop) ─────────────────────────────────────────────────
    const ctxFr = await browser.newContext({ viewport: { width: 1536, height: 743 }, locale: 'fr-FR' })
    const pageFr = await ctxFr.newPage()
    await pageFr.goto(URL, { waitUntil: 'domcontentloaded' })
    await pageFr.evaluate(() => { try { localStorage.setItem('qfp.lang', 'fr') } catch {} })
    await pageFr.goto(URL, { waitUntil: 'networkidle' })
    await wait(pageFr, 900)
    await dismissCookies(pageFr)
    log.frLabels = await pageFr.locator('.inf-tri-label').allTextContents()
    log.frNames = await pageFr.locator('.inf-ledger-name').allTextContents()
    console.log('FR labels:', JSON.stringify(log.frLabels), '| FR names:', JSON.stringify(log.frNames))
    await settle(pageFr)
    await hideChrome(pageFr)
    await shootSection(pageFr, '.inf-tri', 'infra-tri-fr.png')
    await shootSection(pageFr, '.inf-ledger-sec', 'infra-ledger-fr.png')
    await ctxFr.close()

    // ── REDUCED MOTION (desktop) ────────────────────────────────────────────
    const ctxRm = await browser.newContext({ viewport: { width: 1536, height: 743 }, reducedMotion: 'reduce' })
    const pageRm = await ctxRm.newPage()
    await pageRm.goto(URL, { waitUntil: 'networkidle' })
    await wait(pageRm, 900)
    await dismissCookies(pageRm)
    await hideChrome(pageRm)
    await shootSection(pageRm, '.inf-tri', 'infra-tri-reduced.png')
    await shootSection(pageRm, '.inf-ledger-sec', 'infra-ledger-reduced.png')
    await ctxRm.close()

    // ── MOBILE 375 ──────────────────────────────────────────────────────────
    const ctxM = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
    const pageM = await ctxM.newPage()
    await pageM.goto(URL, { waitUntil: 'networkidle' })
    await wait(pageM, 900)
    await dismissCookies(pageM)
    await settle(pageM)
    await hideChrome(pageM)
    await shootSection(pageM, '.inf-tri', 'infra-tri-mobile.png')
    await shootSection(pageM, '.inf-ledger-sec', 'infra-ledger-mobile.png')
    await ctxM.close()

    console.log('\n✅ shots complete')
    process.exit(0)
  } catch (err) {
    console.error('\n❌', err.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
