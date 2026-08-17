import { chromium } from 'playwright'
const PORT = process.env.PORT || '5184'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const p = await ctx.newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push(e.message))
await p.addInitScript(() => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', 'en') })
await p.goto(`http://localhost:${PORT}/print-on-demand`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts?.ready)
await p.waitForTimeout(400)
await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed') el.style.visibility = 'hidden' })
// scroll so the band's top sits 180px below the viewport top => cream BUILD visible above the curve
await p.evaluate(() => { const el = document.querySelector('.pod-band'); const y = el.getBoundingClientRect().top + window.scrollY - 180; window.scrollTo(0, y) })
await p.waitForTimeout(400)
await p.mouse.move(1, 1)
await p.screenshot({ path: '_lane4/a8-seam.png' })
console.log('saved _lane4/a8-seam.png', errs.length ? `[${errs.length} errs]` : '[clean console]')
await b.close()
