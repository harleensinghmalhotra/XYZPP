import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

// Infrastructure page - capture header only
await page.goto('http://localhost:5173/infrastructure', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

// Take screenshot of hero section
const heroSection = await page.locator('section[aria-labelledby="inf-h1"]')
const box = await heroSection.boundingBox()

const screenshot = await page.screenshot({ fullPage: false })
writeFileSync(resolve('./scripts/verify-header.png'), screenshot)
console.log('✓ Infrastructure header screenshot saved')

// Also take a crop of just the hero
if (box) {
  const heroScreenshot = await page.screenshot({
    clip: { x: 0, y: box.y, width: box.width, height: Math.min(box.height, window.innerHeight) }
  })
  writeFileSync(resolve('./scripts/verify-header-crop.png'), heroScreenshot)
  console.log('✓ Header crop saved')
}

await browser.close()
