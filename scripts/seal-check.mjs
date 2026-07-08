import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
mkdirSync('recon/final-2/seal', { recursive: true })
const b = await chromium.launch({ headless: true })
async function shot(site, url, W, H) {
  const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 60000 })
  try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
  await p.waitForTimeout(4000)
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: Math.round(W * 0.62), height: Math.round(H * 0.92) } })
  await c.close()
  return sharp(buf).resize(760).png().toBuffer()
}
for (const [W, H, tag] of [[1920, 940, '1920'], [1536, 743, '1536']]) {
  const a = await shot('loc', 'http://localhost:5173', W, H)
  const r = await shot('ref', 'https://www.alternativinc.com', W, H)
  const hh = Math.max((await sharp(a).metadata()).height, (await sharp(r).metadata()).height)
  await sharp({ create: { width: 1530, height: hh, channels: 4, background: { r: 20, g: 30, b: 48, alpha: 1 } } })
    .composite([{ input: a, left: 0, top: 0 }, { input: r, left: 770, top: 0 }]).png().toFile(`recon/final-2/seal/cmp-${tag}.png`)
  console.log('done', tag)
}
await b.close()
