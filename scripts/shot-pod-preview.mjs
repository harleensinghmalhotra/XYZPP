// Close-up of the live book preview across binding/finish/format states.
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/page-pod')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' })
const p = await ctx.newPage()
await p.goto('http://localhost:5175/print-on-demand', { waitUntil: 'networkidle' })
await p.locator('#build').scrollIntoViewIfNeeded()
await p.waitForTimeout(400)
const states = [
  { b: 'perfect', f: 'matte', fmt: 'paperback', name: 'p-perfect' },
  { b: 'sewn', f: 'gloss', fmt: 'hardcover', name: 'p-sewn' },
  { b: 'wiro', f: 'layflat', fmt: 'landscape', name: 'p-wiro' },
]
const pick = async (label, val) => {
  const g = p.locator(`[aria-labelledby="${label}"]`)
  await g.getByRole('radio').nth(val).click()
  await p.waitForTimeout(250)
}
const idx = { paperback: 0, hardcover: 1, landscape: 2, matte: 0, gloss: 1, layflat: 2, perfect: 0, sewn: 1, wiro: 2 }
for (const s of states) {
  await pick('step-format', idx[s.fmt])
  await pick('step-binding', idx[s.b])
  await pick('step-finish', idx[s.f])
  await p.waitForTimeout(300)
  await p.locator('.pod-preview').screenshot({ path: resolve(out, `preview-${s.name}.png`) })
  console.log('shot', s.name)
}
await b.close()
