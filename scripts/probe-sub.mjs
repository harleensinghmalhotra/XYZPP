import { chromium } from 'playwright'
const b=await chromium.launch({headless:true})
const p=await (await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
await p.goto('http://localhost:5173',{waitUntil:'networkidle'})
await p.waitForTimeout(3500)
const r=await p.evaluate(()=>{
  const sub=document.querySelector('#hero p')
  const s=getComputedStyle(sub); const b=sub.getBoundingClientRect()
  // measure natural one-line width
  const c=document.createElement('canvas').getContext('2d')
  c.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily.split(',')[0]}`
  const w1=c.measureText(sub.textContent.trim()).width
  return {renderW:Math.round(b.width),renderH:Math.round(b.height),lines:Math.round(b.height/parseFloat(s.lineHeight)),naturalOneLine:Math.round(w1),maxW:s.maxWidth,font:c.font}
})
console.log('local subcopy:',JSON.stringify(r))
console.log('ref subcopy width: 962, 1 line')
await b.close()
