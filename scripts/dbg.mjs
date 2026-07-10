import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage()
const errs = []
p.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const ids = await p.evaluate(() => [...document.querySelectorAll('main > section')].map(s=>s.id))
console.log('section ids:', ids)
console.log('errors:', errs.slice(0,5))
await b.close()
