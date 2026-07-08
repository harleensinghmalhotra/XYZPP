import { chromium } from 'playwright'
const b=await chromium.launch({headless:true})
const p=await (await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
await p.goto('http://localhost:5173',{waitUntil:'networkidle'})
await p.waitForTimeout(3500)
const r=await p.evaluate(()=>{
  const tw=[...document.querySelectorAll('#hero div')].find(e=>e.className.includes('pt-[29vh]'))
  const printing=[...document.querySelectorAll('#hero div')].find(e=>e.textContent.trim()==='Printing')
  // canvas measure of Metrisch at 153.6px
  const c=document.createElement('canvas').getContext('2d')
  c.font='700 153.6px Metrisch'
  const m=c.measureText('PRINTING')
  return {
    textWrapTransform: tw?getComputedStyle(tw).transform:'NULL',
    textWrapWidth: tw?Math.round(tw.getBoundingClientRect().width):0,
    printingWidth: printing?Math.round(printing.getBoundingClientRect().width):0,
    canvasWidth_noLS: Math.round(m.width),
    canvasWidth_withLS: Math.round(m.width - 7*3.072),
  }
})
console.log(JSON.stringify(r,null,2))
await b.close()
