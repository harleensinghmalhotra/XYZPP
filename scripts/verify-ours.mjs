import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const OUT='recon/final-2/ours-v2'; mkdirSync(OUT,{recursive:true})
const b=await chromium.launch({headless:false})
const c=await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})
const p=await c.newPage()
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message))
await p.goto('http://localhost:5173',{waitUntil:'networkidle'})
await p.waitForTimeout(2500)
for(const y of [0,420,840,980,1120,1260,1820]){
  await p.evaluate((d)=>{ if(window.__lenis) window.__lenis.scrollTo(d,{immediate:true}); else window.scrollTo(0,d) }, y)
  await p.waitForTimeout(650)
  await p.screenshot({path:`${OUT}/y${y}.png`})
}
console.log('ERRORS:', errs.length?errs.join(' | '):'none')
await b.close()
