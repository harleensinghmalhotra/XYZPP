// POD preview — original implementation restored. Click-through + 3 states.
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/pod-restore')
mkdirSync(out, { recursive: true })
const PORT = process.env.PORT || 5188
const URL = `http://localhost:${PORT}/print-on-demand`
const idx = { paperback: 0, hardcover: 1, landscape: 2, '5x8': 0, '6x9': 1, '8x10': 2, a4: 3, cream: 0, white: 1, art: 2, perfect: 0, sewn: 1, wiro: 2, matte: 0, gloss: 1, layflat: 2 }

async function run(width) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.locator('#build').scrollIntoViewIfNeeded()
  await p.waitForTimeout(400)
  const pick = async (label, id) => { await p.locator(`[aria-labelledby="${label}"]`).getByRole('radio').nth(idx[id]).click(); await p.waitForTimeout(250) }

  // full click-through of every group to confirm no glitches
  for (const f of ['paperback', 'hardcover', 'landscape']) await pick('step-format', f)
  for (const sz of ['5x8', '6x9', '8x10', 'a4']) await pick('step-size', sz)
  for (const pa of ['cream', 'white', 'art']) await pick('step-paper', pa)
  for (const bn of ['perfect', 'sewn', 'wiro']) await pick('step-binding', bn)
  for (const fi of ['matte', 'gloss', 'layflat']) await pick('step-finish', fi)

  // 3 representative states
  const states = [
    { name: `paperback-6x9-w${width}`, s: { fmt: 'paperback', size: '6x9', paper: 'cream', binding: 'perfect', finish: 'matte' } },
    { name: `hardcover-a4-w${width}`, s: { fmt: 'hardcover', size: 'a4', paper: 'white', binding: 'sewn', finish: 'gloss' } },
    { name: `landscape-w${width}`, s: { fmt: 'landscape', size: '8x10', paper: 'art', binding: 'wiro', finish: 'layflat' } },
  ]
  for (const st of states) {
    await pick('step-format', st.s.fmt)
    await pick('step-size', st.s.size)
    await pick('step-paper', st.s.paper)
    await pick('step-binding', st.s.binding)
    await pick('step-finish', st.s.finish)
    await p.waitForTimeout(500)
    await p.locator('.pod-preview').screenshot({ path: resolve(out, `${st.name}.png`) })
    console.log('shot', st.name)
  }
  console.log(`w${width} pageerrors:`, errs.length ? errs : 'none')
  await b.close()
}
await run(1536)
await run(1280)
console.log('done')
