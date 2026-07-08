import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
for (const [site, url, sel] of [['ref','https://www.alternativinc.com','.hero-section_content_title-line_seal'],['loc','http://localhost:5173','#hero img[alt="Printing stories seal"]']]) {
  const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
  const p = await c.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 60000 })
  try { await p.waitForLoadState('networkidle', { timeout: 12000 }) } catch {}
  await p.waitForTimeout(4200)
  const info = await p.evaluate((sel) => { const el = document.querySelector(sel); const cs = getComputedStyle(el); return { offsetW: el.offsetWidth, cssWidth: cs.width, attrW: el.getAttribute('width'), marginTop: cs.marginTop, marginLeft: cs.marginLeft } }, sel)
  console.log(site, JSON.stringify(info))
  await c.close()
}
await b.close()
