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
  let cur = 0; while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate((d) => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(70) }
  await p.waitForTimeout(700)
  const buf = await p.screenshot()
  await c.close(); return buf
}
const a = await shot('http://localhost:5173', 1450, true)
const r = await shot('https://www.alternativinc.com', 1450, false)
// stack vertically at full width
const wa = 960
const la = await sharp(a).resize(wa).png().toBuffer(); const lr = await sharp(r).resize(wa).png().toBuffer()
const ha = (await sharp(la).metadata()).height, hr = (await sharp(lr).metadata()).height
await sharp({ create: { width: wa, height: ha + hr + 8, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
  .composite([{ input: la, top: 0, left: 0 }, { input: lr, top: ha + 8, left: 0 }]).png().toFile('recon/final-2/v2/peak-stack.png')
console.log('done')
await b.close()
