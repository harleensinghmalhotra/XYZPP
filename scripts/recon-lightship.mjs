// RECON (read-only): screenshot the Lightship AE.1 "Build your AE.1" configurator
// flow so we can replicate the configurator EXPERIENCE (not the content) in QFP.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'recon/lightship-ae1')
mkdirSync(out, { recursive: true })

const url = 'https://lightshiprv.com/customization/ae-1'
const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({ viewport: { width: 1536, height: 860 }, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(4000)

// dismiss any cookie/consent
for (const t of ['Accept', 'Accept all', 'I agree', 'Got it', 'Close']) {
  try { const b = page.getByRole('button', { name: t }); if (await b.count()) { await b.first().click({ timeout: 1500 }); break } } catch {}
}
await page.waitForTimeout(1000)

const H = await page.evaluate(() => document.body.scrollHeight)
console.log('page height', H)

// full-page in slices as we scroll
const step = 820
let i = 0
for (let y = 0; y < H; y += step) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await page.waitForTimeout(700)
  await page.screenshot({ path: resolve(out, `flow-${String(i).padStart(2, '0')}.png`) })
  i++
}

// dump text content of headings / labels for copy reference
const text = await page.evaluate(() => {
  const grab = (sel) => Array.from(document.querySelectorAll(sel)).map((e) => e.textContent.trim()).filter(Boolean)
  return {
    h: grab('h1,h2,h3,h4'),
    buttons: grab('button'),
    labels: grab('[class*=label],[class*=option],[class*=swatch],[class*=summary]').slice(0, 80),
  }
})
console.log(JSON.stringify(text, null, 2))

await browser.close()
console.log('done ->', out)
