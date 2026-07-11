import { chromium } from 'playwright'
import sharp from 'sharp'
const BASE='http://localhost:5204', OUT=process.env.OUT||'x'
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const b=await chromium.launch({headless:false})
const page=await(await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
await page.goto(BASE+'/',{waitUntil:'networkidle'});await sleep(2200)
const sec=async(p,dur)=>page.evaluate(a=>{const s=document.querySelector('.conv-scroll');const t=s.getBoundingClientRect().top+scrollY;const y=t+a.p*(s.offsetHeight-innerHeight);window.__lenis.scrollTo(y,{duration:a.dur})},{p,dur})
// real smooth Lenis scroll (fixed duration → comparable speed). Capture during it.
await sec(0.36,0.001); await sleep(1200)
sec(0.60,2.6) // launch smooth scroll (don't await)
const N=24, frames=[]
for(let i=0;i<N;i++){ frames.push(await page.screenshot()) } // ~back-to-back during scroll
await b.close()
const raws=await Promise.all(frames.map(f=>sharp(f).greyscale().raw().toBuffer({resolveWithObject:true})))
const W=raws[0].info.width,H=raws[0].info.height, series=raws.map(r=>r.data)
const bT=Math.round(H*0.09),bB=Math.round(H*0.62), TH=25
let strobePix=0, revTotal=0
for(let y=bT;y<bB;y++){const row=y*W
  for(let x=0;x<W;x++){const idx=row+x
    let dir=0, anchor=series[0][idx], rev=0
    for(let k=1;k<N;k++){const v=series[k][idx], dv=v-anchor
      if(Math.abs(dv)>=TH){const nd=Math.sign(dv); if(dir!==0&&nd!==dir)rev++; dir=nd; anchor=v}
    }
    revTotal+=rev; if(rev>=3)strobePix++
  }
}
console.log(`${OUT}: STROBING pixels(>=3 rev)=${strobePix}  totalReversals=${revTotal}  (${N} frames)`)
