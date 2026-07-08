// STEP 3: capture our hero at the same 40px increments to compare per-unit
// motion. Uses Lenis immediate scroll for deterministic positions, waits for
// the scrub to settle so we see the intended mapping.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const prefix = process.argv[2] || 'ours'
const settle = Number(process.argv[3] || 1000)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const dump = () =>
  Array.from(document.querySelectorAll('#hero .will-float, #hero [data-hero-copy], #hero video'))
    .slice(0, 12)
    .map((el) => {
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return { cls: (el.className || '').toString().slice(0, 22), t: s.transform.slice(0, 34), op: s.opacity, top: Math.round(r.top) }
    })

for (let i = 0; i < 16; i++) {
  const y = i * 40
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)
  await page.waitForTimeout(settle)
  await page.screenshot({ path: resolve(out, `${prefix}-scroll-${String(i).padStart(3, '0')}.png`) })
  if ([0, 3, 5, 10].includes(i)) {
    const d = await page.evaluate(dump)
    console.log(`-- y${y} --`)
    for (const e of d) console.log('  ', e.op, e.top, e.t, e.cls)
  }
}
console.log('done', prefix)
await browser.close()
