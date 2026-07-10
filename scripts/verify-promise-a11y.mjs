import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = 'http://localhost:5175'
const b = await chromium.launch({ headless: false })
// axe
{
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  const r = await new AxeBuilder({ page: p }).include('#promise').analyze()
  console.log('axe #promise violations:', r.violations.length)
  for (const v of r.violations) console.log(` [${v.impact}] ${v.id}: ${v.help}`)
  await ctx.close()
}
// reduced motion -> final state, no anim
{
  const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
  await p.evaluate(() => document.getElementById('promise').scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(500)
  const st = await p.evaluate(() => {
    const b = document.querySelector('#promise .pq-bold')
    const cs = getComputedStyle(b)
    return { clip: cs.clipPath, boldOpacity: cs.opacity, lightOpacity: getComputedStyle(document.querySelector('#promise .pq-light')).opacity }
  })
  console.log('reduced-motion state:', st)
  await p.screenshot({ path: resolve(root, 'shots/promise-reduced.png') })
  console.log('✓ promise-reduced.png')
  await ctx.close()
}
await b.close()
