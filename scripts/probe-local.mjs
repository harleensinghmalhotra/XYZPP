import { chromium } from 'playwright'
const b=await chromium.launch({headless:true})
const p=await (await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
await p.goto('http://localhost:5173',{waitUntil:'networkidle'})
await p.waitForTimeout(3500)
const r=await p.evaluate(()=>{
  const R=(el)=>{if(!el)return null;const b=el.getBoundingClientRect();const s=getComputedStyle(el);return{w:Math.round(b.width),h:Math.round(b.height),top:Math.round(b.top),left:Math.round(b.left),fs:s.fontSize,lh:s.lineHeight,ls:s.letterSpacing,fw:s.fontWeight}}
  const printing=[...document.querySelectorAll('#hero div')].find(e=>e.textContent.trim()==='Printing')
  const storiesRow=[...document.querySelectorAll('#hero div')].find(e=>e.textContent.trim()==='Stories'&&e.querySelector('img'))
  const seal=document.querySelector('#hero img[alt="Printing stories seal"]')
  const subcopy=document.querySelector('#hero p')
  const btn=document.querySelector('#hero a[href="#expertise"]')
  const link=document.querySelector('#hero a[href="#approach"]')
  return {printing:R(printing),stories:R(storiesRow),seal:R(seal),subcopy:R(subcopy),btn:R(btn),link:R(link)}
})
console.log('REF: PRINTING 743x114 @220,378 | STORIES 605x114 @343,516 | seal 146x148 @313,375 | subcopy @467,332 fs26 | btn 239x62 @541,570 | link @562,839')
console.log('LOC:',JSON.stringify(r))
await b.close()
