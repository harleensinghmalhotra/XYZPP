import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// Scroll to infrastructure/book section
const bookElement = await page.locator('.ib-stage')
if (bookElement) {
  await bookElement.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
}

const screenshot = await page.screenshot({ fullPage: false })
writeFileSync(resolve('./scripts/verify-home-book.png'), screenshot)
console.log('✓ Homepage book screenshot saved')

await browser.close()
