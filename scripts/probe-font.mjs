import { chromium } from 'playwright'
const b=await chromium.launch({headless:true})
const p=await (await b.newContext({viewport:{width:1536,height:743}})).newPage()
await p.goto('http://localhost:5173',{waitUntil:'networkidle'})
await p.waitForTimeout(3500)
const r=await p.evaluate(()=>{
  const q=(s)=>{const e=document.querySelector(s);return e?getComputedStyle(e).fontFamily:'NULL'}
  const loaded=[...document.fonts].map(f=>f.family+' w'+f.weight+' '+f.status)
  return {
    hero_p: q('#hero p'),
    nav_a: q('header nav a'),
    metrisch: loaded.filter(x=>/metrisch/i.test(x)),
    totalFonts: document.fonts.size,
    metrischReady: document.fonts.check("700 100px Metrisch"),
  }
})
console.log(JSON.stringify(r,null,2))
await b.close()
