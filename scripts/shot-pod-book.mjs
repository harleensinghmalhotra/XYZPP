// POD live preview — 3D brand book. Screenshots across builder states.
// Usage: node scripts/shot-pod-book.mjs [tag]   (tag suffixes the filenames)
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tag = process.argv[2] || 'v'
const out = resolve(root, 'shots/pod-book')
mkdirSync(out, { recursive: true })
const PORT = process.env.PORT || 5188

const idx = { paperback: 0, hardcover: 1, landscape: 2, '5x8': 0, '6x9': 1, '8x10': 2, a4: 3, cream: 0, white: 1, art: 2, perfect: 0, sewn: 1, wiro: 2, matte: 0, gloss: 1, layflat: 2 }

async function run(reduced) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1536, height: 860 }, deviceScaleFactor: 2, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  await p.goto(`http://localhost:${PORT}/print-on-demand`, { waitUntil: 'networkidle' })
  await p.locator('#build').scrollIntoViewIfNeeded()
  await p.waitForTimeout(400)
  const pick = async (label, val) => {
    await p.locator(`[aria-labelledby="${label}"]`).getByRole('radio').nth(val).click()
    await p.waitForTimeout(220)
  }
  const set = async ({ fmt, size, paper, binding, finish }) => {
    await pick('step-format', idx[fmt])
    await pick('step-size', idx[size])
    await pick('step-paper', idx[paper])
    await pick('step-binding', idx[binding])
    await pick('step-finish', idx[finish])
    await p.waitForTimeout(650)
  }
  const shot = async (name) => {
    await p.locator('.pod-preview').screenshot({ path: resolve(out, `${name}-${tag}${reduced ? '-rm' : ''}.png`) })
    console.log('shot', name, reduced ? '(reduced)' : '')
  }
  const states = [
    { name: 'paperback-6x9', s: { fmt: 'paperback', size: '6x9', paper: 'cream', binding: 'perfect', finish: 'matte' } },
    { name: 'hardcover-a4', s: { fmt: 'hardcover', size: 'a4', paper: 'white', binding: 'sewn', finish: 'gloss' } },
    { name: 'landscape', s: { fmt: 'landscape', size: '8x10', paper: 'art', binding: 'wiro', finish: 'layflat' } },
  ]
  for (const st of states) { await set(st.s); await shot(st.name) }
  await b.close()
}
await run(false)
await run(true)
console.log('done')
