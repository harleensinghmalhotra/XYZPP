import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
mkdirSync('shots/page-about/grb-ref', { recursive: true })

const b = await chromium.launch({ headless: false })
const p = await (await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })).newPage()
await p.goto('https://www.grb.uk.com/about-us/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
await p.waitForTimeout(2500)
// dismiss cookie banners if present
for (const t of ['Accept', 'Accept all', 'I agree', 'Got it', 'Allow all']) {
  const btn = p.getByRole('button', { name: t })
  if (await btn.count()) { await btn.first().click().catch(() => {}); break }
}
await p.waitForTimeout(800)

// full page
await p.screenshot({ path: 'shots/page-about/grb-ref/full.png', fullPage: true })

// step down the page in viewport slices so section rhythm is legible
const total = await p.evaluate(() => document.body.scrollHeight)
const vh = 743
let i = 0
for (let y = 0; y < total; y += vh) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y)
  await p.waitForTimeout(500)
  await p.screenshot({ path: `shots/page-about/grb-ref/slice-${String(i).padStart(2, '0')}.png` })
  i++
}
console.log('GRB total height:', total, 'slices:', i)
await b.close()
