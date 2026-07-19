// POD preview — static brand book image + spec-panel change feedback.
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/pod-image')
mkdirSync(out, { recursive: true })
const PORT = process.env.PORT || 5188
const URL = `http://localhost:${PORT}/print-on-demand`

const clickOpt = async (p, label, nth) =>
  p.locator(`[aria-labelledby="${label}"]`).getByRole('radio').nth(nth).click()

async function desktop() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.locator('#build').scrollIntoViewIfNeeded()
  await p.waitForTimeout(500)
  const preview = p.locator('.pod-preview')
  const summary = p.locator('.pod-summary')

  await preview.screenshot({ path: resolve(out, 'preview-rest.png') })

  // click Hardcover → grab mid-feedback (row still pulsing)
  await clickOpt(p, 'step-format', 1)
  await p.waitForTimeout(170)
  await summary.screenshot({ path: resolve(out, 'feedback-hardcover.png') })
  console.log('shot feedback-hardcover')

  // click through 4 different option groups, capturing each row mid-pulse
  const seq = [
    { label: 'step-size', nth: 3, name: 'size' },      // A4
    { label: 'step-paper', nth: 1, name: 'paper' },    // white
    { label: 'step-binding', nth: 2, name: 'binding' },// wiro
    { label: 'step-finish', nth: 1, name: 'finish' },  // gloss
  ]
  for (const s of seq) {
    await p.waitForTimeout(700)
    await clickOpt(p, s.label, s.nth)
    await p.waitForTimeout(160)
    await summary.screenshot({ path: resolve(out, `feedback-${s.name}.png`) })
    console.log('shot feedback-' + s.name)
  }
  await b.close()
}

async function reduced() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.locator('#build').scrollIntoViewIfNeeded()
  await p.waitForTimeout(500)
  await p.locator('.pod-preview').screenshot({ path: resolve(out, 'preview-rest-rm.png') })
  await clickOpt(p, 'step-format', 1)
  await p.waitForTimeout(150)
  await p.locator('.pod-summary').screenshot({ path: resolve(out, 'feedback-rm.png') })
  console.log('shot reduced-motion')
  await b.close()
}

async function mobile() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 375, height: 720 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.locator('#build').scrollIntoViewIfNeeded()
  await p.waitForTimeout(500)
  await p.locator('.pod-preview').screenshot({ path: resolve(out, 'preview-375.png') })
  console.log('shot 375')
  await b.close()
}

await desktop()
await reduced()
await mobile()
console.log('done')
