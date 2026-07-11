import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
const BASE='http://localhost:5197'
const P=parseFloat(process.env.P||'0.5')
const OUT=process.env.OUT||'shots/conveyor-r8b/idle-diff'
mkdirSync(OUT,{recursive:true})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const b=await chromium.launch({headless:false})
const page=await(await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
const errs=[];page.on('pageerror',e=>errs.push(String(e)))
await page.goto(BASE+'/',{waitUntil:'networkidle'});await sleep(2000)
// park at P (idle — no scroll input after this)
await page.evaluate(p=>{const s=document.querySelector('.conv-scroll');const t=s.getBoundingClientRect().top+scrollY;const y=t+p*(s.offsetHeight-innerHeight);window.__lenis?window.__lenis.scrollTo(y,{immediate:true,force:true}):scrollTo(0,y)},P)
await sleep(1200)
// capture N consecutive frames ~110ms apart (idle)
const N=10, bufs=[]
for(let i=0;i<N;i++){ bufs.push(await page.screenshot()); await sleep(110) }
await b.close()
// diff consecutive frames (grayscale abs diff), report mean/max
let maxTotal=0
const diffs=[]
for(let i=1;i<N;i++){
  const a=sharp(bufs[i-1]).greyscale().raw(), c=sharp(bufs[i]).greyscale().raw()
  const [da,dc]=await Promise.all([a.toBuffer(),c.toBuffer()])
  let sum=0,mx=0
  for(let k=0;k<da.length;k++){const d=Math.abs(da[k]-dc[k]);sum+=d;if(d>mx)mx=d}
  const mean=(sum/da.length).toFixed(3)
  diffs.push({pair:`${i-1}-${i}`,meanDiff:+mean,maxDiff:mx})
  if(sum/da.length>maxTotal)maxTotal=sum/da.length
}
// write a heatmap of the worst pair (amplified)
console.log('IDLE @ p='+P, 'errors:', errs.length)
diffs.forEach(d=>console.log(`  frames ${d.pair}: meanΔ=${d.meanDiff} maxΔ=${d.maxDiff}`))
console.log('worst meanΔ:', maxTotal.toFixed(3), '(0-255 scale; <1 = still, >3 = visible change)')
