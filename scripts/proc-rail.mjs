import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
const g = await p.evaluate(() => { const e=document.getElementById('process'); return { top: e.getBoundingClientRect().top+scrollY } })
await p.evaluate(y => window.__lenis.scrollTo(y,{immediate:true}), Math.round(g.top))
await p.waitForTimeout(900)
// crop the left rail column (x 380-560 in the 3072px render ≈ node area)
const el = p.locator('#process .proc-steps')
const box = await el.boundingBox()
await p.screenshot({ path: resolve(root,'shots/process-rail.png'), clip: { x: box.x, y: box.y, width: 260, height: Math.min(box.height, 620) } })
console.log('✓ process-rail.png  railHeight', await p.evaluate(()=>document.querySelector('#process .proc-line-fill').style.height), 'fill scaleY', await p.evaluate(()=>getComputedStyle(document.querySelector('#process .proc-line-fill')).transform))
await b.close()
