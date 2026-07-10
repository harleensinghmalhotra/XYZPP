import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
const g = await p.evaluate(() => { const e=document.getElementById('process'); const b=e.getBoundingClientRect(); return { bottom: b.bottom+scrollY, h:e.offsetHeight } })
await p.evaluate(y => window.__lenis.scrollTo(y,{immediate:true}), Math.round(g.bottom - 743))
await p.waitForTimeout(900)
await p.screenshot({ path: resolve(root,'shots/process-bottom.png') })
console.log('✓ process-bottom.png')
await b.close()
