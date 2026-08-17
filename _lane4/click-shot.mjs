// Click a sequence of option chips (by visible text) and screenshot a target after
// each click. Usage:
//   node _lane4/click-shot.mjs <lang> <outPrefix> <shotSelector> "Text1|Text2|..."
// Each step: click the radio/button whose text contains TextN, wait, shoot selector.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.env.PORT || '5184'
const [, , lang = 'en', prefix = 'clk', shotSel = '.pod-preview', seq = ''] = process.argv
const steps = seq.split('|').filter(Boolean)
mkdirSync('_lane4', { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await context.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('CONSOLE ERROR:', m.text()) } })
page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGE ERROR:', e.message) })
await page.addInitScript((lng) => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', lng) }, lang)
await page.goto(`http://localhost:${PORT}/print-on-demand`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts?.ready)
await page.waitForTimeout(400)
await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed') el.style.visibility = 'hidden' })

let i = 0
for (const txt of steps) {
  const btn = page.locator('button[role="radio"]', { hasText: txt }).first()
  await btn.scrollIntoViewIfNeeded()
  await btn.click()
  await page.waitForTimeout(650) // let the 0.6s book transition settle
  await page.mouse.move(1, 1)
  const safe = txt.replace(/[^a-z0-9]/gi, '').slice(0, 12)
  await page.locator(shotSel).first().screenshot({ path: `_lane4/${prefix}-${i}-${safe}.png` })
  console.log(`shot ${prefix}-${i}-${safe}`)
  i++
}
console.log(errors.length ? `[${errors.length} console errors]` : '[clean console]')
await browser.close()
