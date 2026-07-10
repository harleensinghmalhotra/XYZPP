// Phase 3.5 — mobile close-up: scroll the globe itself into view so the lazy
// mount fires, then capture. Confirms the Earth renders (live) on mobile too.
import { chromium } from 'playwright'
const BASE = process.env.URL || 'http://localhost:5190'
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.evaluate(() => document.querySelector('.proj-globe')?.scrollIntoView({ block: 'center' }))
let ok = false
try {
  await page.waitForSelector('.proj-globe canvas', { timeout: 12000 })
  await page.waitForFunction(() => document.querySelector('.proj-globe')?.dataset.phase === 'ready', { timeout: 12000 })
  ok = true
} catch {}
await page.waitForTimeout(1800)
await page.locator('.proj-globe').screenshot({ path: 'shots/phase35/05-mobile-globe.png' })
await page.locator('#projects').screenshot({ path: 'shots/phase35/05-mobile-full.png' })
console.log(JSON.stringify({ mobileGlobeReady: ok, errors }))
await browser.close()
