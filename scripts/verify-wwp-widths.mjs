// Judge evidence: section at tablet 768 + mobile 375 (both fall back to native
// horizontal scroll per the ≤900px rule).
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'http://localhost:5175'
const out = resolve(root, 'shots')
const b = await chromium.launch()
for (const [name, w, h] of [['tablet', 768, 1024], ['mobile', 375, 812]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1000)
  await p.evaluate(() => document.getElementById('services').scrollIntoView())
  await p.waitForTimeout(500)
  await p.screenshot({ path: resolve(out, `wwp-${name}.png`) })
  const st = await p.evaluate(() => {
    const el = document.getElementById('services')
    const vp = el.querySelector('.wwp-viewport')
    return { position: getComputedStyle(el.querySelector('.wwp-sticky')).position, overflowX: getComputedStyle(vp).overflowX, height: el.offsetHeight }
  })
  console.log(name, st)
  await p.close()
}
await b.close()
