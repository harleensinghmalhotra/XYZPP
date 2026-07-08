import { chromium } from 'playwright'
import sharp from 'sharp'
const b = await chromium.launch({ headless: true })
const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
const p = await c.newPage()
await p.goto('http://localhost:5173', { waitUntil: 'load', timeout: 60000 })
try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
await p.waitForTimeout(4200)
await p.mouse.move(960, 470)
for (const y of [1450, 1520]) {
  let cur = 0; while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate((d) => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(60) }
  await p.waitForTimeout(650)
  const buf = await p.screenshot()
  await sharp(buf).resize(1100).toFile(`recon/final-2/loc-peak-${y}.png`)
}
console.log('done')
await b.close()
