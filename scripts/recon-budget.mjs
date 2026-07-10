import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.evaluate(() => document.getElementById('services').scrollIntoView())
await p.waitForTimeout(400)
const m = await p.evaluate(() => {
  const q = (s) => document.querySelector(s)
  const h = (s) => Math.round(q(s).getBoundingClientRect().height)
  const vp = q('#services .wwp-viewport'), track = q('#services .wwp-track')
  const cs = getComputedStyle(vp)
  return {
    sticky: h('#services .wwp-sticky'),
    inner: h('#services .wwp-inner'),
    header: h('#services .wwp-head'),
    viewportClient: vp.clientHeight,
    viewportPadTop: cs.paddingTop,
    trackH: Math.round(track.getBoundingClientRect().height),
    cardH: Math.round(q('#services .wwp-card').getBoundingClientRect().height),
    // does track (padTop + card) exceed viewport client?
    needed: parseFloat(cs.paddingTop) + Math.round(q('#services .wwp-card').getBoundingClientRect().height),
  }
})
console.log(m)
console.log('OVERFLOW (needed - viewportClient):', Math.round(m.needed - m.viewportClient))
await b.close()
