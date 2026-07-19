// POD preview — reactive CSS book restored. 4-state + paper + reduced-motion.
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/pod-reactive')
mkdirSync(out, { recursive: true })
const PORT = process.env.PORT || 5188
const URL = `http://localhost:${PORT}/print-on-demand`
const idx = { paperback: 0, hardcover: 1, landscape: 2, '5x8': 0, '6x9': 1, '8x10': 2, a4: 3, cream: 0, white: 1, art: 2 }

async function open(reduced) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.locator('#build').scrollIntoViewIfNeeded()
  await p.waitForTimeout(400)
  return { b, p }
}
const pick = async (p, label, id) => { await p.locator(`[aria-labelledby="${label}"]`).getByRole('radio').nth(idx[id]).click(); await p.waitForTimeout(200) }
const shot = async (p, name) => { await p.locator('.pod-preview').screenshot({ path: resolve(out, name) }); console.log('shot', name) }

{
  const { b, p } = await open(false)
  const states = [
    { fmt: 'paperback', size: '6x9', name: 'paperback-6x9.png' },
    { fmt: 'hardcover', size: '6x9', name: 'hardcover-6x9.png' },
    { fmt: 'hardcover', size: 'a4', name: 'hardcover-a4.png' },
    { fmt: 'landscape', size: '8x10', name: 'landscape.png' },
  ]
  for (const s of states) {
    await pick(p, 'step-format', s.fmt)
    await pick(p, 'step-size', s.size)
    await p.waitForTimeout(600)
    await shot(p, s.name)
  }
  // paper recolor sweep — reset to hardcover 6x9, cycle papers
  await pick(p, 'step-format', 'hardcover'); await pick(p, 'step-size', '6x9'); await p.waitForTimeout(500)
  for (const paper of ['cream', 'white', 'art']) {
    await pick(p, 'step-paper', paper)
    await p.waitForTimeout(500)
    await shot(p, `paper-${paper}.png`)
  }
  await b.close()
}
{
  const { b, p } = await open(true)
  await pick(p, 'step-format', 'hardcover'); await pick(p, 'step-size', 'a4'); await p.waitForTimeout(300)
  await shot(p, 'reduced-hardcover-a4.png')
  await b.close()
}
console.log('done')
