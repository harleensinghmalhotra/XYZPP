import { chromium } from 'playwright'
import sharp from 'sharp'
const b = await chromium.launch({ headless: true })
async function shot(url, y, useLenis) {
  const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 60000 })
  try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
  await p.waitForTimeout(4200); await p.mouse.move(960, 470)
  let cur = 0; while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate(d => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(55) } await p.waitForTimeout(650)
  const buf = await p.screenshot(); await c.close(); return buf
}
// find transition where book overhangs + curve shows
const la = await shot('http://localhost:5173', 1750, true)
const ra = await shot('https://www.alternativinc.com', 1720, false)
const lc = await sharp(la).resize(960).png().toBuffer(), rc = await sharp(ra).resize(960).png().toBuffer()
const hh = (await sharp(lc).metadata()).height
await sharp({ create: { width: 960, height: hh * 2 + 6, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
  .composite([{ input: lc, top: 0, left: 0 }, { input: rc, top: hh + 6, left: 0 }]).png().toFile('recon/final-2/curve-cmp.png')
console.log('done')
await b.close()
