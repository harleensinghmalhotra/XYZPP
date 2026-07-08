// FINAL 2% RECON — canonical rig capture of our hero.
// Playwright HEADED Chromium, viewport 1536x743, deviceScaleFactor 1.25.
// Real wheel events, 150px steps, 150ms settle. Recon only — no code touched.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'recon/final-2/ours')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({
  viewport: { width: 1536, height: 743 },
  deviceScaleFactor: 1.25,
})
const page = await ctx.newPage()
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

// Wait for frame preload + intro to settle.
await page.waitForTimeout(5000)

const readScroll = () =>
  page.evaluate(() => ({
    lenis: !!window.__lenis,
    y: window.__lenis ? window.__lenis.scroll : window.scrollY,
    heroH: document.querySelector('#hero') ? document.querySelector('#hero').offsetHeight : null,
    winH: window.innerHeight,
    docH: document.documentElement.scrollHeight,
  }))

let info = await readScroll()
console.log('INITIAL', JSON.stringify(info))

// (a) rest state
await page.screenshot({ path: resolve(out, 'step-00-rest.png') })

// (b) wheel-scroll in 150px steps through the whole hero pin to the landing.
await page.mouse.move(768, 371)
const STEP = 150
const MAX_STEPS = 24 // 24*150 = 3600px — covers hero pin + into landing section
for (let i = 1; i <= MAX_STEPS; i++) {
  await page.mouse.wheel(0, STEP)
  await page.waitForTimeout(150)
  info = await readScroll()
  const label = String(i).padStart(2, '0')
  await page.screenshot({ path: resolve(out, `step-${label}-y${Math.round(info.y)}.png`) })
  console.log(`step ${label}  y=${Math.round(info.y)}  docH=${info.docH}`)
  // Stop once we're well past the hero into the next section.
  if (info.heroH && info.y > info.heroH + info.winH * 0.5) {
    console.log('reached past hero pin, stopping')
    break
  }
}

console.log('done')
await browser.close()
