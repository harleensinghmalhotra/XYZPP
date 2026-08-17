// Lane 5 screenshot harness — /contact + /legal/*.
// Usage: node _lane5/shot.mjs <path> <selector|page|full> <lang> <out> [scrollY]
//   path      route, e.g. /contact, /legal/cookies
//   selector  CSS selector -> element.screenshot; "page" -> viewport; "full" -> fullPage
// Hides ONLY fixed site chrome so sticky content stays. 1536x743, DPR 1.25.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.env.PORT || '5185'
const [, , path = '/contact', selector = 'full', lang = 'en', out = 'shot', scrollY = '0'] = process.argv
mkdirSync('_lane5', { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const page = await context.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('CONSOLE ERROR:', m.text()) } })
page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGE ERROR:', e.message) })
await page.addInitScript((lng) => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', lng) }, lang)
await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts?.ready)
await page.waitForTimeout(500)
await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed') el.style.visibility = 'hidden' })
await page.mouse.move(1, 1)

if (selector === 'full') {
  await page.evaluate(async () => { const h=document.body.scrollHeight; for(let y=0;y<=h;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))} window.scrollTo(0,0) })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `_lane5/${out}.png`, fullPage: true })
} else if (selector === 'page') {
  await page.evaluate((y) => window.scrollTo(0, Number(y)), scrollY)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `_lane5/${out}.png` })
} else {
  await page.waitForSelector(selector, { timeout: 15000 })
  await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), selector)
  await page.waitForTimeout(400)
  await page.locator(selector).first().screenshot({ path: `_lane5/${out}.png` })
}
console.log('saved _lane5/' + out + '.png' + (errors.length ? `  [${errors.length} console errors]` : '  [clean console]'))
await browser.close()
