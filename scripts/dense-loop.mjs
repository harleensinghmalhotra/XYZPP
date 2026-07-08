import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
// dense frames every 60px, 0 -> 2220, + anchors
const STEP=60, MAX=2220
const FRAMES=[]; for(let y=0;y<=MAX;y+=STEP)FRAMES.push(y)
for(const a of [420,840,980,1120,1260,1820]) if(!FRAMES.includes(a))FRAMES.push(a)
FRAMES.sort((a,b)=>a-b)
const REF='recon/final-2/dense/ref', LOC='recon/final-2/dense/loc', CMP='recon/final-2/dense/cmp'
;[REF,LOC,CMP].forEach(d=>mkdirSync(d,{recursive:true}))
const b=await chromium.launch({headless:false})
async function cap(url,dir,useLenis){
  const c=await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})
  const p=await c.newPage()
  await p.goto(url,{waitUntil:'load',timeout:60000})
  try{await p.waitForLoadState('networkidle',{timeout:15000})}catch{}
  await p.waitForTimeout(4200)
  await p.mouse.move(768,371)
  // slow progressive: step through ALL 60px increments so Lenis/IX2 settle naturally
  let cur=0
  for(const y of FRAMES){
    // ease toward target in small hops (progressive, not one jump)
    while(cur<y){ cur=Math.min(y,cur+STEP); await p.evaluate((d)=>{window.__lenis?window.__lenis.scrollTo(d,{immediate:true}):window.scrollTo(0,d)},cur); await p.waitForTimeout(90) }
    await p.waitForTimeout(700)
    await p.screenshot({path:`${dir}/y${String(y).padStart(4,'0')}.png`})
  }
  await c.close()
}
const only=process.argv[2]
if(only!=='loc') await cap('https://www.alternativinc.com',REF,false)
await cap('http://localhost:5173',LOC,true)
await b.close()
// per-frame diff (whole frame + hero region top 0..600 css = 0..750 px)
const diffs=[]
for(const y of FRAMES){
  const f=String(y).padStart(4,'0')
  try{
    const a=await sharp(`${LOC}/y${f}.png`).resize(160,97,{fit:'fill'}).greyscale().raw().toBuffer()
    const r=await sharp(`${REF}/y${f}.png`).resize(160,97,{fit:'fill'}).greyscale().raw().toBuffer()
    let d=0; for(let i=0;i<a.length;i++)d+=Math.abs(a[i]-r[i]); d=+(d/a.length).toFixed(1)
    diffs.push({y,d})
  }catch(e){diffs.push({y,d:-1})}
}
diffs.sort((a,b)=>a.y-b.y)
console.log('per-frame mean pixel diff (0=identical):')
for(const {y,d} of diffs) console.log('  y'+String(y).padStart(4),' '+'#'.repeat(Math.min(60,Math.round(d)))+' '+d)
console.log('WORST hero frames (y<=1300):', diffs.filter(x=>x.y<=1300).sort((a,b)=>b.d-a.d).slice(0,5).map(x=>'y'+x.y+':'+x.d).join(', '))
console.log('DENSE DONE')
