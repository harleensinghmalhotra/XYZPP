// Clip a horizontal band around a section boundary. usage:
// node _lane7/seam.mjs <path> <lang> <selector> <top|bottom> <out>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
mkdirSync('_lane7/shots', { recursive: true })
const [, , path = '/infrastructure', lang = 'en', sel = '.aw', edge = 'top', out = 'seam'] = process.argv
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const p = await ctx.newPage()
await p.addInitScript((l) => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', l) }, lang)
await p.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' })
await p.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y <= h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } window.scrollTo(0, 0) })
await p.waitForTimeout(500)
let box = await p.locator(sel).first().boundingBox()
const yEdge = edge === 'top' ? box.y : box.y + box.height
const scrollTo = Math.max(0, yEdge - 200)
await p.evaluate((y) => window.scrollTo(0, y), scrollTo)
await p.waitForTimeout(400)
await p.mouse.move(4, 4)
const vpY = yEdge - scrollTo // edge position within the viewport
await p.screenshot({ path: `_lane7/shots/${out}.png`, clip: { x: 0, y: Math.max(0, vpY - 200), width: 1536, height: 400 } })
console.log('saved', out, 'edge doc-y', Math.round(yEdge))
await b.close()
