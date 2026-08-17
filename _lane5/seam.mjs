import { chromium } from 'playwright'
const PORT = process.env.PORT || '5185'
const [,, sel='.ctc-welcome', out='seam', off='200', lang='en'] = process.argv
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1536,height:743}, deviceScaleFactor:1.25 })
const p = await ctx.newPage()
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(e.message))
await p.addInitScript((l)=>{localStorage.setItem('qfp.consent','accepted');localStorage.setItem('qfp.lang',l)}, lang)
await p.goto(`http://localhost:${PORT}/contact`, {waitUntil:'networkidle'})
await p.evaluate(()=>document.fonts?.ready); await p.waitForTimeout(400)
await p.evaluate(()=>{for(const el of document.querySelectorAll('body *'))if(getComputedStyle(el).position==='fixed')el.style.visibility='hidden'})
await p.evaluate(({s,o})=>{const el=document.querySelector(s);const y=el.getBoundingClientRect().top+window.scrollY-Number(o);window.scrollTo(0,y)}, {s:sel,o:off})
await p.waitForTimeout(400); await p.mouse.move(1,1)
await p.screenshot({path:`_lane5/${out}.png`})
console.log('saved _lane5/'+out+'.png', errs.length?`[${errs.length} errs]`:'[clean]')
await b.close()
