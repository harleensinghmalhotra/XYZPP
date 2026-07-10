// Phase 3.3 verification shots — headed, 1536×743 @ DPR 1.25.
// Usage: node scripts/shot33.mjs <mode> [lang]
//   mode: "state" (full-page each route) | "heroes" (viewport hero of each route)
//   lang: "en" (default) | "fr"
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.env.PORT || 5187
const BASE = `http://localhost:${PORT}`
const MODE = process.argv[2] || 'state'
const LANG = process.argv[3] || 'en'
const OUT = 'shots/phase33'
mkdirSync(OUT, { recursive: true })

const ROUTES = [
  ['home', '/'],
  ['about', '/about'],
  ['educational-books', '/educational-books'],
  ['trade-books', '/trade-books'],
  ['print-on-demand', '/print-on-demand'],
  ['infrastructure', '/infrastructure'],
  ['fulfilment', '/fulfilment'],
  ['contact', '/contact'],
]

const b = await chromium.launch({ headless: false })
const ctx = await b.newContext({
  viewport: { width: 1536, height: 743 },
  deviceScaleFactor: 1.25,
})
if (LANG === 'fr') {
  await ctx.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'fr') } catch {} })
}
const page = await ctx.newPage()

for (const [name, route] of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(1400)
  // settle lazy canvases / reveals
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  const suffix = LANG === 'fr' ? '-FR' : ''
  if (MODE === 'heroes') {
    await page.screenshot({ path: `${OUT}/hero-${name}${suffix}.png` })
  } else {
    // trigger reveals by scrolling through
    await page.evaluate(async () => {
      await new Promise((res) => {
        let y = 0
        const step = () => {
          window.scrollTo(0, y); y += 700
          if (y < document.body.scrollHeight) setTimeout(step, 120)
          else res()
        }
        step()
      })
    })
    await page.waitForTimeout(600)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${OUT}/${name}-full${suffix}.png`, fullPage: true })
  }
  console.log('shot', name, route, LANG)
}

await b.close()
console.log('done', MODE, LANG)
