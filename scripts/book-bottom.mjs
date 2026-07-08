import { chromium } from 'playwright'
import sharp from 'sharp'
const b = await chromium.launch({ headless: true })
async function probe(url, y, useLenis, site) {
  const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 60000 })
  try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
  await p.waitForTimeout(4200)
  await p.mouse.move(960, 470)
  let cur = 0; while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate((d) => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(70) }
  await p.waitForTimeout(700)
  const info = await p.evaluate((site) => {
    const bookEl = site === 'ref' ? document.querySelector('.hero-section_graph_book:not(.over)') : document.querySelector('#hero img[alt="Open book"]')
    const r = bookEl.getBoundingClientRect()
    const pin = site === 'ref' ? null : document.querySelector('#hero > div')
    const pr = pin ? pin.getBoundingClientRect() : null
    const cs = getComputedStyle(bookEl)
    return { book: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }, objectFit: cs.objectFit, pin: pr ? { top: Math.round(pr.top), bottom: Math.round(pr.bottom), overflow: getComputedStyle(pin).overflow } : null, vh: window.innerHeight }
  }, site)
  const buf = await p.screenshot()
  await c.close()
  return { info, buf }
}
const loc = await probe("http://localhost:5173", 1380, true, "loc")
const ref = await probe("https://www.alternativinc.com", 1250, false, "ref")
console.log('LOC', JSON.stringify(loc.info))
console.log('REF', JSON.stringify(ref.info))
// crop bottom 45% for comparison
const la = await sharp(loc.buf).extract({ left: 0, top: 480, width: 1920, height: 460 }).resize(960).png().toBuffer()
const ra = await sharp(ref.buf).extract({ left: 0, top: 480, width: 1920, height: 460 }).resize(960).png().toBuffer()
const hh = (await sharp(la).metadata()).height
await sharp({ create: { width: 960, height: hh * 2 + 8, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
  .composite([{ input: la, top: 0, left: 0 }, { input: ra, top: hh + 8, left: 0 }]).png().toFile('recon/final-2/book-bottom.png')
console.log('done')
await b.close()
