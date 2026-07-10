import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const p = await ctx.newPage()
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
await p.evaluate(() => document.getElementById('process').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500)
const st = await p.evaluate(() => {
  const fill = document.querySelector('#process .proc-line-fill')
  const node = document.querySelector('#process .proc-node')
  const txt = document.querySelector('#process .proc-text')
  return { fillH: fill.style.height, fillTransform: getComputedStyle(fill).transform, nodeOpacity: getComputedStyle(node).opacity, textOpacity: getComputedStyle(txt).opacity }
})
console.log('reduced-motion:', st)
await p.screenshot({ path: resolve(root, 'shots/process-reduced.png') })
console.log('✓ process-reduced.png')
await b.close()
