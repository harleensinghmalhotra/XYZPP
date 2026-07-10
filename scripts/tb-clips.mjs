import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/phase25')
const url = 'http://localhost:5177/trade-books'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(800)

// gallery + panel top
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300)
await page.screenshot({ path: resolve(out, 'clip-hero.png') })

// switch a couple categories to confirm each fills
async function clickCat(name) {
  await page.evaluate((n) => {
    const b = [...document.querySelectorAll('.tb-swatch')].find((x) => x.textContent.includes(n))
    b && b.click()
  }, name)
  await page.waitForTimeout(500)
}
await clickCat('Leather Diaries')
await page.screenshot({ path: resolve(out, 'clip-diaries.png') })
await clickCat('Premium Notebooks')
await page.screenshot({ path: resolve(out, 'clip-notebooks.png') })

// lifestyle break
const y = await page.evaluate(() => document.querySelector('.tb-life').getBoundingClientRect().top + window.scrollY - 60)
await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(400)
await page.screenshot({ path: resolve(out, 'clip-life.png') })
await browser.close()
console.log('clips done')
