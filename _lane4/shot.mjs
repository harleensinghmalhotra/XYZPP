// Lane 4 screenshot harness — /print-on-demand verification.
// Usage: node _lane4/shot.mjs <selector|page|full> <lang> <out> [scrollY]
//   selector  CSS selector -> element.screenshot; "page" -> viewport; "full" -> fullPage
//   lang      en | fr | es  (set via qfp.lang, the in-app toggle's own store)
//   out       output basename -> _lane4/<out>.png
//   scrollY   optional scroll offset for "page" mode
// Hides ONLY fixed site chrome (nav/cookie) so the pod's *sticky* preview +
// summary columns stay visible. 1536x743, DPR 1.25.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.env.PORT || '5184'
const [, , selector = 'page', lang = 'en', out = 'shot', scrollY = '0'] = process.argv
mkdirSync('_lane4', { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1536, height: 743 },
  deviceScaleFactor: 1.25,
})
const page = await context.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('CONSOLE ERROR:', m.text()) } })
page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGE ERROR:', e.message) })
await page.addInitScript((lng) => {
  localStorage.setItem('qfp.consent', 'accepted')
  localStorage.setItem('qfp.lang', lng)
}, lang)

await page.goto(`http://localhost:${PORT}/print-on-demand`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts?.ready)
await page.waitForTimeout(500)

// hide fixed chrome only (NOT sticky) so pod preview/summary survive
await page.evaluate(() => {
  for (const el of document.querySelectorAll('body *')) {
    if (getComputedStyle(el).position === 'fixed') el.style.visibility = 'hidden'
  }
})
await page.mouse.move(1, 1)

if (selector === 'full') {
  await page.evaluate(async () => { const h=document.body.scrollHeight; for(let y=0;y<=h;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))} window.scrollTo(0,0) })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `_lane4/${out}.png`, fullPage: true })
} else if (selector === 'page') {
  await page.evaluate((y) => window.scrollTo(0, Number(y)), scrollY)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `_lane4/${out}.png` })
} else {
  await page.waitForSelector(selector, { timeout: 15000 })
  await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), selector)
  await page.waitForTimeout(400)
  await page.locator(selector).first().screenshot({ path: `_lane4/${out}.png` })
}
console.log('saved _lane4/' + out + '.png' + (errors.length ? `  [${errors.length} console errors]` : '  [clean console]'))
await browser.close()
