import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const SC = 'C:\\Users\\Harleen\\AppData\\Local\\Temp\\claude\\d--WEBSITES-Website-University\\8ebd6733-c21d-48c6-86fc-1050687fe924\\scratchpad'
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForTimeout(1200)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(400)
const links = page.locator('a[href="/infrastructure"]'); const n = await links.count()
await (n > 1 ? links.nth(n - 1) : links.first()).click({ force: true })
await page.waitForFunction(() => location.pathname === '/infrastructure', { timeout: 8000 }).catch(() => {})
await page.waitForTimeout(600)
// scroll to the YouTube section
await page.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 200) { window.scrollBy(0, 200); await s(25) } await s(300) })
const info = await page.evaluate(() => ({
  ytCards: document.querySelectorAll('.yt-card').length,
  ytThumbs: Array.from(document.querySelectorAll('.yt-thumb-img')).map(i => i.naturalWidth + 'x' + i.naturalHeight),
  finishCells: document.querySelectorAll('.inf-finish-cell').length,
  galleryItems: document.querySelectorAll('.inf-gallery-item').length,
}))
console.log('INFRA via nav:', JSON.stringify(info))
await page.locator('.inf-av').scrollIntoViewIfNeeded().catch(() => {})
await page.waitForTimeout(400)
await page.locator('.inf-av').screenshot({ path: `${SC}\\l16-infra-yt.png` }).catch(async () => { await page.screenshot({ path: `${SC}\\l16-infra-yt.png` }) })
console.log('shot saved')
await browser.close()
