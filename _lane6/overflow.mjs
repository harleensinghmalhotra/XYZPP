import { chromium } from 'playwright'
const PORT = process.env.PORT || '5186'
const routes = ['/', '/about', '/founder']
const b = await chromium.launch()
let bad=0
for (const lang of ['en','fr','es']) {
  for (const route of routes) {
    const ctx = await b.newContext({ viewport:{width:1536,height:743}, deviceScaleFactor:1.25, reducedMotion:'reduce' })
    const p = await ctx.newPage()
    const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(e.message))
    await p.addInitScript((l)=>{localStorage.setItem('qfp.lang',l);localStorage.setItem('qfp.consent','accepted')}, lang)
    await p.goto(`http://localhost:${PORT}${route}`, {waitUntil:'networkidle'})
    await p.waitForTimeout(500)
    const r = await p.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}))
    const ov = r.sw>r.cw; if(ov)bad++
    console.log(`${lang} ${route.padEnd(10)} sw=${r.sw} cw=${r.cw} ${ov?'*** OVERFLOW':'ok'} ${errs.length?('errs='+errs.length):''}`)
    await ctx.close()
  }
}
console.log(bad?`\n${bad} overflow`:'\nNo horizontal overflow anywhere')
await b.close()
