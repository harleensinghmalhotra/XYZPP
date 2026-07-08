import { chromium } from 'playwright'
import sharp from 'sharp'
const b = await chromium.launch({ headless: true })
const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
const p = await c.newPage()
await p.goto('http://localhost:5173', { waitUntil: 'load', timeout: 60000 })
try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
await p.waitForTimeout(4200)
await p.mouse.move(960, 470)
for (const y of [1350, 1450, 1520]) {
  let cur = 0; while (cur < y) { cur = Math.min(y, cur + 80); await p.evaluate((d) => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(60) }
  await p.waitForTimeout(650)
  const info = await p.evaluate(() => {
    const book = document.querySelector('#hero img[alt="Open book"]').getBoundingClientRect()
    const svc = document.querySelector('#services')
    const sr = svc ? svc.getBoundingClientRect() : null
    const pts = [850, 900, 940].map(yy => { const el = document.elementFromPoint(960, yy); return yy + ':' + (el ? (el.tagName + '.' + String(el.className).slice(0, 20) + (el.alt ? '[' + el.alt + ']' : '')) : 'null') })
    return { scrollY: window.scrollY, bookTop: Math.round(book.top), bookBottom: Math.round(book.bottom), svcTop: sr ? Math.round(sr.top) : null, at: pts }
  })
  console.log('y' + y, JSON.stringify(info))
  if (y === 1450) { const buf = await p.screenshot(); await sharp(buf).resize(1200).toFile('recon/final-2/loc-peak-full.png') }
}
await b.close()
