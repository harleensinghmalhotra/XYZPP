import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
mkdirSync('recon/final-2/v2', { recursive: true })
const b = await chromium.launch({ headless: true })
async function cap(url, W, H, scrolls, useLenis) {
  const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 60000 })
  try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
  await p.waitForTimeout(4200)
  await p.mouse.move(W / 2, H / 2)
  const out = {}; let cur = 0
  for (const y of scrolls) {
    while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate((d) => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(70) }
    await p.waitForTimeout(650)
    out[y] = await p.screenshot()
  }
  await c.close(); return out
}
// [W,H,tag,scrolls]
const RIGS = [
  [1920, 940, 'w', [0, 1150, 1250, 1400, 1520]],
  [1536, 743, 'n', [0, 920, 1050, 1150, 1240]],
]
for (const [W, H, tag, scrolls] of RIGS) {
  const loc = await cap('http://localhost:5173', W, H, scrolls, true)
  const ref = await cap('https://www.alternativinc.com', W, H, scrolls, false)
  for (const y of scrolls) {
    const a = await sharp(loc[y]).resize(820).png().toBuffer()
    const r = await sharp(ref[y]).resize(820).png().toBuffer()
    const hh = (await sharp(a).metadata()).height
    await sharp({ create: { width: 1650, height: hh, channels: 4, background: { r: 20, g: 30, b: 48, alpha: 1 } } })
      .composite([{ input: a, left: 0, top: 0 }, { input: r, left: 830, top: 0 }]).png().toFile(`recon/final-2/v2/${tag}${y}.png`)
  }
  console.log(tag, 'done')
}
await b.close()
