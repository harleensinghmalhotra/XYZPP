import { chromium } from 'playwright'
const b=await chromium.launch({headless:true})
const p=await (await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
await p.goto('https://www.alternativinc.com',{waitUntil:'load',timeout:60000})
try{await p.waitForLoadState('networkidle',{timeout:15000})}catch{}
await p.waitForTimeout(4500)
const r=await p.evaluate(()=>{
  const metr=[...document.fonts].filter(f=>/metrisch/i.test(f.family)).map(f=>f.family+' w'+f.weight+' '+f.status)
  const checkM=document.fonts.check('700 153.6px Metrisch')
  // canvas widths in different fonts
  const c=document.createElement('canvas').getContext('2d')
  const widths={}
  for(const ff of ['700 153.6px Metrisch','700 153.6px Arial','700 153.6px sans-serif']){ c.font=ff; widths[ff]=Math.round(c.measureText('PRINTING').width) }
  return {metrisch:metr, metrischLoaded:checkM, canvasWidths:widths}
})
console.log(JSON.stringify(r,null,2))
await b.close()
