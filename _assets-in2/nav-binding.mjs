import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const OUT = process.env.OUT
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForTimeout(1200)
for (const label of ['Decline', 'Accept']) { const b = page.locator(`button:has-text("${label}")`).first(); if (await b.count()) { try { await b.click({ timeout: 1200 }); break } catch {} } }
// bring the facility book into view
await page.locator('.ib-stage').scrollIntoViewIfNeeded()
await page.waitForTimeout(600)
// open the Binding & Finishing book (3rd spine label, index 2)
const labels = page.locator('.ib-imglabel')
console.log('spine labels:', await labels.count())
await labels.nth(2).click()
await page.waitForTimeout(900)
// advance two spreads: intro0 -> double(binding-03) -> solo(binding-04) [page 03/10]
for (let i = 0; i < 2; i++) { await page.locator('.ib-nav--next').click(); await page.waitForTimeout(900) }
const pc = await page.locator('.ib-pagecount').first().innerText().catch(() => '?')
console.log('pagecount:', pc.replace(/\s+/g, ' ').trim())
await page.locator('.ib-book').first().screenshot({ path: OUT })
console.log('WROTE ' + OUT)
await browser.close()
