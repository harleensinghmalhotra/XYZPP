// Lane 7 full-page / region shot.
// usage: node _lane7/full.mjs <path> <lang> <out> [selector]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
mkdirSync('_lane7/shots', { recursive: true })
const [, , path = '/infrastructure', lang = 'en', out = 'full', selector = ''] = process.argv
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const p = await ctx.newPage()
await p.addInitScript((l) => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', l) }, lang)
await p.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' })
await p.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y <= h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)) } window.scrollTo(0, 0) })
await p.mouse.move(4, 4)
await p.waitForTimeout(800)
if (selector) {
  await p.locator(selector).first().screenshot({ path: `_lane7/shots/${out}.png` })
} else {
  await p.screenshot({ path: `_lane7/shots/${out}.png`, fullPage: true })
}
console.log('saved', out)
await b.close()
