// Task 6 verify — homepage AV thumbnail + dialog poster.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
mkdirSync('_lane7/shots', { recursive: true })
const path = process.argv[2] || '/'
const thumbSel = process.argv[3] || '.infra-video-thumb'
const dialogSel = process.argv[4] || '.infra-dialog-panel'
const tag = process.argv[5] || 'home'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const p = await ctx.newPage()
await p.addInitScript(() => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', 'en') })
await p.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' })
await p.locator(thumbSel).first().scrollIntoViewIfNeeded()
await p.mouse.move(4, 4)
await p.waitForTimeout(500)
await p.locator(thumbSel).first().screenshot({ path: `_lane7/shots/t6-${tag}-thumb.png` })
await p.locator(thumbSel).first().click()
await p.waitForTimeout(900)
await p.locator(dialogSel).screenshot({ path: `_lane7/shots/t6-${tag}-poster.png` })
console.log('saved', tag)
await b.close()
