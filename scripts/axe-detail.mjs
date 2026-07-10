import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const p = await ctx.newPage()
await p.goto('http://localhost:5175/print-on-demand', { waitUntil: 'networkidle' })
const axe = await new AxeBuilder({ page: p }).include('.pod').analyze()
for (const v of axe.violations)
  if (v.id === 'color-contrast')
    for (const n of v.nodes)
      console.log(String(n.target), '::', n.any[0]?.data?.fgColor, 'on', n.any[0]?.data?.bgColor, 'ratio', n.any[0]?.data?.contrastRatio, 'fs', n.any[0]?.data?.fontSize)
await b.close()
