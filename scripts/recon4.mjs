import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
// --- LOCAL: seal rotation + ring diameter + book layers ---
{
  const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto('http://localhost:5173', { waitUntil: 'networkidle' }); await p.waitForTimeout(3500)
  const seal0 = await p.evaluate(() => { const el = document.querySelector('#hero img[alt="Printing stories seal"]'); const cs = getComputedStyle(el); return { animName: cs.animationName, animDur: cs.animationDuration, transform: cs.transform, offsetW: el.offsetWidth } })
  await p.waitForTimeout(2000)
  const seal2 = await p.evaluate(() => { const el = document.querySelector('#hero img[alt="Printing stories seal"]'); return { transform: getComputedStyle(el).transform } })
  console.log('LOC seal @t0:', JSON.stringify(seal0))
  console.log('LOC seal @t2:', JSON.stringify(seal2), '(same transform => NOT rotating)')
  // book layers at exit (y1520)
  await p.mouse.move(960,470); let cur=0; while(cur<1520){cur=Math.min(1520,cur+80); await p.evaluate(d=>{window.__lenis?window.__lenis.scrollTo(d,{immediate:true}):window.scrollTo(0,d)},cur); await p.waitForTimeout(50)} await p.waitForTimeout(600)
  const layers = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter(im => /book_pages|book_cover|graph_book/.test(im.src || im.currentSrc))
    return imgs.map(im => { const r = im.getBoundingClientRect(); return { src: (im.src||'').split('/').pop().slice(0,18), top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), z: getComputedStyle(im).zIndex, sectionId: im.closest('section')?.id, opacity: getComputedStyle(im).opacity } })
  })
  console.log('LOC book imgs @y1520:'); layers.forEach(l=>console.log('   ', JSON.stringify(l)))
  await c.close()
}
// --- REF: seal rotation + curved divider ---
{
  const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto('https://www.alternativinc.com', { waitUntil: 'load', timeout: 60000 }); try{await p.waitForLoadState('networkidle',{timeout:12000})}catch{}; await p.waitForTimeout(4200)
  const seal0 = await p.evaluate(() => { const el = document.querySelector('.hero-section_content_title-line_seal'); const cs = getComputedStyle(el); return { animName: cs.animationName, transform: cs.transform.slice(0,60), offsetW: el.offsetWidth, tag: el.tagName } })
  await p.waitForTimeout(2000)
  const seal2 = await p.evaluate(() => ({ transform: getComputedStyle(document.querySelector('.hero-section_content_title-line_seal')).transform.slice(0,60) }))
  console.log('\nREF seal @t0:', JSON.stringify(seal0))
  console.log('REF seal @t2:', JSON.stringify(seal2))
  // curved divider between hero and services
  const div = await p.evaluate(() => {
    const cands = [...document.querySelectorAll('img, svg, div')].filter(e => /divisor|services.*divisor/i.test(e.className||'') || /divisor/i.test((e.src||'')))
    return cands.slice(0,6).map(e => ({ cls: String(e.className).slice(0,40), src: (e.src||'').split('/').pop(), tag: e.tagName }))
  })
  console.log('REF divider candidates:'); div.forEach(d=>console.log('   ', JSON.stringify(d)))
  await c.close()
}
await b.close()
