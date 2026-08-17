import { chromium } from 'playwright'
const PORT = process.env.PORT || '5186'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1536,height:743}, reducedMotion:'reduce' })
const p = await ctx.newPage()
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(e.message))
await p.addInitScript(()=>{localStorage.setItem('qfp.consent','accepted');localStorage.setItem('qfp.lang','en')})
await p.goto(`http://localhost:${PORT}/`, {waitUntil:'networkidle'})
await p.waitForTimeout(600)
// find a link/button that points at #process
const link = p.locator('a[href="#process"], a[href$="#process"]').first()
const n = await link.count()
console.log('links to #process found:', n)
if (n) {
  await link.scrollIntoViewIfNeeded(); await link.click(); await p.waitForTimeout(900)
  const r = await p.evaluate(()=>{ const el=document.getElementById('process'); if(!el) return {exists:false}; const rect=el.getBoundingClientRect(); return {exists:true, top: Math.round(rect.top), inView: rect.top < 400 && rect.bottom > 0}; })
  console.log('after click ->', JSON.stringify(r))
}
console.log(errs.length?`[${errs.length} errs] ${errs.slice(0,2)}`:'[clean console]')
await b.close()
