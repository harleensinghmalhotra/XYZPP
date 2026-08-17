// Lane 7 book pager — open a facility book and page to a given spread, shoot .ib-stage.
// usage: node _lane7/book.mjs <path> <lang> <bookIdx> <spread> <out> [target]
//   bookIdx: 0..4 spine to open (-1 = leave on intro/overview)
//   spread : number of NEXT clicks after opening
//   target : css selector to screenshot (default .ib-stage)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
mkdirSync('_lane7/shots', { recursive: true })
const [, , path = '/infrastructure', lang = 'en', bookIdx = '-1', spread = '0', out = 'book', target = '.ib-stage'] = process.argv
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const p = await ctx.newPage()
await p.addInitScript((l) => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', l) }, lang)
await p.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' })
await p.waitForSelector('.ib-stage', { timeout: 15000 })
await p.locator('.ib-stage').scrollIntoViewIfNeeded()
await p.mouse.move(4, 4) // park cursor off the book so no Turn-cursor / hover glow
await p.waitForTimeout(500)
const bi = parseInt(bookIdx, 10)
if (bi >= 0) {
  await p.locator('.ib-imglabel').nth(bi).click()
  await p.waitForTimeout(500)
  const n = parseInt(spread, 10)
  for (let i = 0; i < n; i++) {
    await p.locator('.ib-nav--next').click()
    await p.waitForTimeout(450)
  }
}
await p.mouse.move(4, 4)
await p.waitForTimeout(300)
await p.locator(target).screenshot({ path: `_lane7/shots/${out}.png` })
console.log('saved', out, 'book', bookIdx, 'spread', spread)
await b.close()
