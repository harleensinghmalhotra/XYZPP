import { chromium } from 'playwright'
const b=await chromium.launch({headless:true})
const p=await (await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
await p.goto('https://www.alternativinc.com',{waitUntil:'load',timeout:60000})
try{await p.waitForLoadState('networkidle',{timeout:15000})}catch{}
await p.waitForTimeout(4000)
const r=await p.evaluate(()=>{
  const g=document.querySelector('.hero-section_content_title-line_txt.green')
  const s=getComputedStyle(g); const b=g.getBoundingClientRect()
  return {text:g.textContent, w:Math.round(b.width), h:Math.round(b.height), fs:s.fontSize, ls:s.letterSpacing, fw:s.fontWeight, ff:s.fontFamily}
})
console.log('LIVE REF PRINTING:',JSON.stringify(r))
await b.close()
