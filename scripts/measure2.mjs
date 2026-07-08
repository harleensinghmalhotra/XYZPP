import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const URL = { ref: 'https://www.alternativinc.com', loc: 'http://localhost:5173' }

async function measure(site, W, H, useLenis) {
  const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto(URL[site], { waitUntil: 'load', timeout: 60000 })
  try { await p.waitForLoadState('networkidle', { timeout: 15000 }) } catch {}
  await p.waitForTimeout(4200)
  // REST: seal + title
  const rest = await p.evaluate((site) => {
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), top: Math.round(r.top), left: Math.round(r.left) } }
    let seal, printing, stories
    if (site === 'ref') {
      seal = document.querySelector('.hero-section_content_title-line_seal')
      printing = document.querySelector('.hero-section_content_title-line_txt.green')
      stories = document.querySelector('.hero-section_content_title-line._2 .hero-section_content_title-line_txt')
    } else {
      seal = document.querySelector('#hero img[alt="Printing stories seal"]')
      printing = [...document.querySelectorAll('#hero div')].find(e => e.textContent.trim() === 'Printing')
      stories = [...document.querySelectorAll('#hero div')].find(e => e.textContent.trim() === 'Stories' && e.querySelector('img'))
    }
    return { seal: R(seal), printing: R(printing), stories: R(stories) }
  }, site)
  // PEAK: scroll to bloom peak, measure book + cutouts
  await p.mouse.move(W / 2, H / 2)
  const target = 1260
  let cur = 0
  while (cur < target) { cur = Math.min(target, cur + 80); await p.evaluate((d) => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(70) }
  await p.waitForTimeout(700)
  const peak = await p.evaluate((site) => {
    const bookEl = site === 'ref' ? document.querySelector('.hero-section_graph_book:not(.over)') : document.querySelector('#hero img[alt="Open book"]')
    const bk = bookEl.getBoundingClientRect(); const bcx = bk.left + bk.width / 2, bcy = bk.top + bk.height / 2
    const sel = site === 'ref' ? '[class*="hero-section_graph-details"]:not(.hero-section_graph-details)' : '#hero [data-cut] img'
    const cuts = [...document.querySelectorAll(sel)].map(el => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), dx: Math.round(r.left + r.width / 2 - bcx), dy: Math.round(r.top + r.height / 2 - bcy), src: (el.getAttribute('src') || '').split('/').pop().slice(0, 26) } })
    return { book: { w: Math.round(bk.width), h: Math.round(bk.height) }, cuts }
  }, site)
  await c.close()
  return { rest, peak }
}

for (const [site, W, H] of [['ref', 1920, 940], ['loc', 1920, 940], ['ref', 1536, 743], ['loc', 1536, 743]]) {
  const m = await measure(site, W, H, site === 'loc')
  console.log(`\n=== ${site} @ ${W}x${H} ===`)
  console.log('  seal:', JSON.stringify(m.rest.seal), '| printing:', JSON.stringify(m.rest.printing), '| stories:', JSON.stringify(m.rest.stories))
  if (m.rest.seal && m.rest.printing) {
    console.log('  seal vs printing: sealW/printW =', (m.rest.seal.w / m.rest.printing.h).toFixed(3), '| seal.cy - printing.bottom =', m.rest.seal.cy - (m.rest.printing.top + m.rest.printing.h))
  }
  console.log('  book:', JSON.stringify(m.peak.book))
  for (const c of m.peak.cuts) console.log('    ', c.src.padEnd(28), 'w' + c.w, 'dx' + c.dx, 'dy' + c.dy)
}
await b.close()
