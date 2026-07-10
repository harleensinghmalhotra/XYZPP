import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.evaluate(() => document.getElementById('services').scrollIntoView())
await p.waitForTimeout(500)
const z = await p.evaluate(() => {
  const lh = (el) => { const s = getComputedStyle(el); return Math.round(el.getBoundingClientRect().height / parseFloat(s.lineHeight || s.fontSize)) }
  return [...document.querySelectorAll('#services .wwp-card')].map((c) => {
    const name = c.querySelector('.wwp-name'), sub = c.querySelector('.wwp-sub'), list = c.querySelector('.wwp-list')
    const lis = [...c.querySelectorAll('.wwp-list li')]
    return {
      n: c.querySelector('.wwp-num').textContent,
      nameH: Math.round(name.getBoundingClientRect().height), nameLines: lh(name),
      subH: Math.round(sub.getBoundingClientRect().height), subLines: lh(sub),
      listH: Math.round(list.getBoundingClientRect().height),
      bulletLines: lis.map((li) => lh(li)).join(''),
      bodyH: Math.round(c.querySelector('.wwp-body').getBoundingClientRect().height),
    }
  })
})
console.table(z)
