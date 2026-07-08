// Screenshot harness for iterative visual critique.
// Usage: node scripts/screenshots.mjs <label> [url]
//   captures desktop (1440) + mobile (375) full-page PNGs into shots/
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const label = process.argv[2] || 'shot'
const url = process.argv[3] || 'http://localhost:5173'
const selector = process.argv[4] || null // optional: capture just this element
const outDir = resolve(root, 'shots')
mkdirSync(outDir, { recursive: true })

const targets = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
]

const browser = await chromium.launch()
for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: t.width, height: t.height },
    deviceScaleFactor: 1,
  })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  // let fonts + first paint settle, nudge scroll to trigger reveals then return
  await page.waitForTimeout(1200)
  await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 200))
  })
  const file = resolve(outDir, `${label}-${t.name}.png`)
  if (selector && selector.startsWith('#')) {
    const el = page.locator(selector)
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(2200) // let count-ups + springs settle
    await el.screenshot({ path: file })
  } else if (selector && /^[0-9.]+$/.test(selector)) {
    // scroll to a fraction of the full document, capture viewport
    const frac = parseFloat(selector)
    await page.evaluate((f) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const y = Math.round(max * f)
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
      else window.scrollTo(0, y)
    }, frac)
    await page.waitForTimeout(900)
    await page.screenshot({ path: file })
  } else {
    await page.screenshot({ path: file, fullPage: true })
  }
  console.log('✓', file)
  await page.close()
}
await browser.close()
