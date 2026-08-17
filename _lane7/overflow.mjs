import { chromium } from 'playwright'
const b = await chromium.launch()
for (const path of ['/infrastructure', '/']) {
  for (const lang of ['en', 'fr', 'es']) {
    const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const p = await ctx.newPage()
    await p.addInitScript((l) => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', l) }, lang)
    await p.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' })
    await p.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y <= h; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)) } window.scrollTo(0, 0) })
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
    console.log(`${path} ${lang}: scrollWidth=${r.sw} innerWidth=${r.iw} ${r.sw > r.iw + 1 ? 'HORIZONTAL-OVERFLOW' : 'ok'}`)
    await ctx.close()
  }
}
await b.close()
