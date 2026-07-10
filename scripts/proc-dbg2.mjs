import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
console.log(await p.evaluate(() => ({ plCalls: window.__pl, guard: window.__plGuard, fillH: document.querySelector('#process .proc-line-fill').style.height, trackH: document.querySelector('#process .proc-line-track').style.height })))
await b.close()
