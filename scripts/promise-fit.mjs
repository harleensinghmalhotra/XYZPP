import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
const m = await p.evaluate(() => {
  const s = document.getElementById('promise'), inner = document.querySelector('.promise-inner')
  return { sectionH: s.offsetHeight, innerH: Math.round(inner.getBoundingClientRect().height), quoteFont: getComputedStyle(document.querySelector('.promise-quote')).fontSize, fits: inner.getBoundingClientRect().height < (s.offsetHeight - 120) }
})
console.log(m)
await b.close()
