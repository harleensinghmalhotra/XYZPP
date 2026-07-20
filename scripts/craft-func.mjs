import { chromium } from 'playwright'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// timeline era swap
const t0 = await page.locator('.tl-title').textContent()
await page.locator('.tl-year', { hasText: '2021' }).first().click()
await page.waitForTimeout(600)
const t1 = await page.locator('.tl-title').textContent()
const y1 = await page.locator('.tl-year-big').textContent()
console.log('era swap:', JSON.stringify({ from: t0, to: t1, year: y1 }))

// next arrow
await page.locator('.tl-arrow--next').click()
await page.waitForTimeout(600)
console.log('after next:', JSON.stringify(await page.locator('.tl-title').textContent()))

// marquee word + separator count
const mq = await page.evaluate(() => ({
  words: document.querySelectorAll('.ab-marquee-word').length,
  word: document.querySelector('.ab-marquee-word')?.textContent,
  seps: document.querySelectorAll('.ab-marquee-sep').length,
  spine: !!document.querySelector('.ab-spine'),
  ghosts: document.querySelectorAll('.mvv-ghost').length,
  indices: document.querySelectorAll('.mvv-index').length,
  ticks: document.querySelectorAll('.mvv-tick').length,
}))
console.log('audit:', JSON.stringify(mq))

// hover a team card → capture warmed ticks
await page.evaluate(() => document.querySelector('.tm')?.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(500)
await page.locator('.tm-card').first().hover()
await page.waitForTimeout(400)
await page.screenshot({ path: './scripts/craft/func-team-hover.png' })

console.log('CONSOLE ERRORS:', errors.length ? errors : 'none')
await browser.close()
