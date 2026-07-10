import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.evaluate(() => document.getElementById('services').scrollIntoView())
await p.waitForTimeout(500)
const r = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('#services .wwp-card')]
  const heights = cards.map(c => +c.getBoundingClientRect().height.toFixed(2))
  // heading top-Y relative to each card top (so scroll-x offset doesn't matter)
  const nameYrel = cards.map(c => +(c.querySelector('.wwp-name').getBoundingClientRect().top - c.getBoundingClientRect().top).toFixed(2))
  const gap = cards.map(c => { const pop=c.querySelector('.wwp-img').getBoundingClientRect(); const nm=c.querySelector('.wwp-name').getBoundingClientRect(); return +(nm.top - pop.bottom).toFixed(1) })
  const lineLines = cards.map(c => { const el=c.querySelector('.wwp-line'); return Math.round(el.getBoundingClientRect().height/ (13*1.5)) })
  return { heights, nameYrel, gap, lineLines }
})
const eq = a => Math.max(...a) - Math.min(...a)
console.log('card heights   :', r.heights, ' | spread', +eq(r.heights).toFixed(2))
console.log('name top-Y(rel):', r.nameYrel, ' | spread', +eq(r.nameYrel).toFixed(2))
console.log('img->name gap  :', r.gap)
console.log('sentence lines :', r.lineLines)
console.log(eq(r.heights) < 0.5 && eq(r.nameYrel) < 0.5 ? 'ASSERT PASS: heights + baselines identical' : 'ASSERT FAIL')
await b.close()
