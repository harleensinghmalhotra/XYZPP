// STEP 4 proof: capture the hero at scroll progress 0/15/40/70/95% (desktop +
// mobile) and scan the book-canvas region for frame changes (no dead zones).
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const url = 'http://localhost:5173'
const stops = [0, 0.15, 0.4, 0.7, 0.95]

const browser = await chromium.launch()

async function run(device, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000) // frames stream in + intro plays
  const maxY = await page.evaluate(() => document.querySelector('#hero').offsetHeight - window.innerHeight)
  for (const p of stops) {
    await page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), Math.round(p * maxY))
    await page.waitForTimeout(1000)
    await page.screenshot({ path: resolve(out, `HERO-${device}-p${String(Math.round(p * 100)).padStart(2, '0')}.png`) })
  }
  await ctx.close()
  console.log(`✓ ${device} phase stills`)
}

await run('desktop', 1440, 900)
await run('mobile', 375, 812)

// ---- scrub smoothness: step through the bloom, diff the centre region ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)
  const maxY = await page.evaluate(() => document.querySelector('#hero').offsetHeight - window.innerHeight)
  const region = { x: 480, y: 430, width: 480, height: 360 } // book area
  let prev = null
  const diffs = []
  for (let i = 0; i <= 20; i++) {
    const p = 0.22 + (i / 20) * 0.66 // sweep the bloom range
    await page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), Math.round(p * maxY))
    await page.waitForTimeout(500)
    const buf = await page.screenshot({ clip: region })
    const { data } = await sharp(buf).resize(64, 60).greyscale().raw().toBuffer({ resolveWithObject: true })
    if (prev) {
      let d = 0
      for (let k = 0; k < data.length; k++) d += Math.abs(data[k] - prev[k])
      diffs.push(+(d / data.length).toFixed(2))
    }
    prev = data
  }
  const dead = diffs.filter((d) => d < 1.0).length
  console.log('scrub adjacent-frame diffs:', diffs.join(','))
  console.log('dead zones (<1.0):', dead, '/', diffs.length, '| max', Math.max(...diffs), '| min', Math.min(...diffs))
  await ctx.close()
}

await browser.close()
