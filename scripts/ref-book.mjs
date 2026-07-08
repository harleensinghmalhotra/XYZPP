import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
const p = await c.newPage()
await p.goto('https://www.alternativinc.com', { waitUntil: 'load', timeout: 60000 })
try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
await p.waitForTimeout(4500)
await p.mouse.move(960, 470)
for (const y of [850, 950, 1050, 1150, 1250, 1350]) {
  let cur = 0; while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate((d) => window.scrollTo(0, d), cur); await p.waitForTimeout(60) }
  await p.waitForTimeout(600)
  const info = await p.evaluate(() => {
    const book = document.querySelector('.hero-section_graph_book:not(.over)')
    const r = book.getBoundingClientRect(); const cs = getComputedStyle(book)
    const wrap = document.querySelector('.hero-section_graph-wrapper')
    const wcs = wrap ? getComputedStyle(wrap) : {}
    // opaque book bottom: sample where the book's dark spine/cover is (approx via the wrapper)
    const svc = document.querySelector('.services-section') || document.querySelector('.services-section-divisor-wrapper')
    const sr = svc ? svc.getBoundingClientRect() : null
    return { y: window.scrollY, bTop: Math.round(r.top), bBottom: Math.round(r.bottom), bH: Math.round(r.height), bookTf: cs.transform.slice(0, 40), wrapTf: (wcs.transform || '').slice(0, 40), wrapMt: wcs.marginTop, svcTop: sr ? Math.round(sr.top) : null }
  })
  console.log('y' + y, JSON.stringify(info))
}
await b.close()
