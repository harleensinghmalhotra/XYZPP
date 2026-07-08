import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
const FRAMES=[0,420,840,980,1120,1260,1820]
const REF='recon/final-2/loop/ref', LOC='recon/final-2/loop/loc', CMP='recon/final-2/loop/cmp'
;[REF,LOC,CMP].forEach(d=>mkdirSync(d,{recursive:true}))
const b=await chromium.launch({headless:false})

async function cap(url,dir,useLenis){
  const c=await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})
  const p=await c.newPage()
  await p.goto(url,{waitUntil:'load',timeout:60000})
  try{await p.waitForLoadState('networkidle',{timeout:15000})}catch{}
  await p.waitForTimeout(4200)
  await p.mouse.move(768,371)
  for(const y of FRAMES){
    await p.evaluate((d)=>{ if(window.__lenis) window.__lenis.scrollTo(d,{immediate:true}); else window.scrollTo(0,d) }, y)
    await p.waitForTimeout(650)
    await p.screenshot({path:`${dir}/y${y}.png`})
  }
  await c.close()
}

const only=process.argv[2] // 'loc' to skip ref re-capture
if(only!=='loc') await cap('https://www.alternativinc.com','recon/final-2/loop/ref',false)
await cap('http://localhost:5173','recon/final-2/loop/loc',true)
await b.close()

// composites: local left, ref right
for(const y of FRAMES){
  const W=900,g=10
  const la=await sharp(`${LOC}/y${y}.png`).resize(W).png().toBuffer()
  const lb=await sharp(`${REF}/y${y}.png`).resize(W).png().toBuffer()
  const h=(await sharp(la).metadata()).height
  await sharp({create:{width:W*2+g,height:h,channels:4,background:{r:15,g:23,b:38,alpha:1}}})
    .composite([{input:la,left:0,top:0},{input:lb,left:W+g,top:0}]).png().toFile(`${CMP}/cmp-y${y}.png`)
}
console.log('LOOP DONE')
