import { chromium } from 'playwright'
const PORT = process.env.PORT || '5184'
const b = await chromium.launch()
for (const lang of ['en','fr','es']) {
  const ctx = await b.newContext({ viewport:{width:1536,height:743}, deviceScaleFactor:1.25 })
  const p = await ctx.newPage()
  await p.addInitScript((l)=>{localStorage.setItem('qfp.consent','accepted');localStorage.setItem('qfp.lang',l)}, lang)
  await p.goto(`http://localhost:${PORT}/print-on-demand`, { waitUntil:'networkidle' })
  await p.waitForTimeout(400)
  const r = await p.evaluate(()=>({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bodySW: document.body.scrollWidth }))
  console.log(lang, 'scrollWidth', r.sw, 'clientWidth', r.cw, 'horizontalOverflow:', r.sw > r.cw)
  await ctx.close()
}
await b.close()
