import { chromium } from 'playwright'
const PORT = process.env.PORT || '5185'
const routes = ['/contact','/legal/privacy','/legal/cookies','/legal/terms','/legal/accessibility']
const b = await chromium.launch()
let bad = 0
for (const lang of ['en','fr','es']) {
  for (const route of routes) {
    const ctx = await b.newContext({ viewport:{width:1536,height:743}, deviceScaleFactor:1.25 })
    const p = await ctx.newPage()
    await p.addInitScript((l)=>{localStorage.setItem('qfp.lang',l);localStorage.setItem('qfp.consent','accepted')}, lang)
    await p.goto(`http://localhost:${PORT}${route}`, { waitUntil:'networkidle' })
    await p.waitForTimeout(300)
    const r = await p.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}))
    const overflow = r.sw > r.cw
    if (overflow) bad++
    console.log(`${lang} ${route.padEnd(24)} scrollW=${r.sw} clientW=${r.cw} ${overflow?'*** H-OVERFLOW':'ok'}`)
    await ctx.close()
  }
}
console.log(bad? `\n${bad} pages with horizontal overflow` : '\nNo horizontal overflow on any page/language')
await b.close()
