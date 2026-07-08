import { chromium } from 'playwright'
import sharp from 'sharp'
const b = await chromium.launch({ headless: true })
async function shot(url, y, useLenis) {
  const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 60000 })
  try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
  await p.waitForTimeout(4200)
  await p.mouse.move(960, 470)
  let cur = 0; while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate((d) => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(60) }
  await p.waitForTimeout(650)
  const buf = await p.screenshot()
  await c.close(); return buf
}
// exit states where book scrolled up ~same amount (book top ~40-70)
const la = await shot('http://localhost:5173', 1560, true)
const ra = await shot('https://www.alternativinc.com', 1500, false)
const crop = (buf) => sharp(buf).extract({ left: 0, top: 470, width: 1920, height: 470 }).resize(960).png().toBuffer()
const lc = await crop(la), rc = await crop(ra)
const hh = (await sharp(lc).metadata()).height
await sharp({ create: { width: 960, height: hh * 2 + 6, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
  .composite([{ input: lc, top: 0, left: 0 }, { input: rc, top: hh + 6, left: 0 }]).png().toFile('recon/final-2/bb-final.png')
console.log('done')
await b.close()
