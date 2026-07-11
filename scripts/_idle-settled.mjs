import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
const BASE='http://localhost:5197', P=parseFloat(process.env.P||'0.5')
const OUT='shots/conveyor-r8b/idle-diff'; mkdirSync(OUT,{recursive:true})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const b=await chromium.launch({headless:false})
const page=await(await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
await page.goto(BASE+'/',{waitUntil:'networkidle'});await sleep(2000)
await page.evaluate(p=>{const s=document.querySelector('.conv-scroll');const t=s.getBoundingClientRect().top+scrollY;const y=t+p*(s.offsetHeight-innerHeight);window.__lenis?window.__lenis.scrollTo(y,{immediate:true,force:true}):scrollTo(0,y)},P)
await sleep(1500) // let camera settle first
// take frames 8&9 of a settled burst
let f1,f2
for(let i=0;i<9;i++){const s=await page.screenshot();if(i===7)f1=s;if(i===8)f2=s;await sleep(110)}
await b.close()
const {data:a,info}=await sharp(f1).greyscale().raw().toBuffer({resolveWithObject:true})
const {data:c}=await sharp(f2).greyscale().raw().toBuffer({resolveWithObject:true})
const heat=Buffer.alloc(a.length);let sum=0,mx=0,hot=0
for(let k=0;k<a.length;k++){const d=Math.abs(a[k]-c[k]);sum+=d;if(d>mx)mx=d;if(d>20)hot++;heat[k]=Math.min(255,d*14)}
await sharp(heat,{raw:{width:info.width,height:info.height,channels:1}}).png().toFile(`${OUT}/settled-heat-p${P}.png`)
console.log(`SETTLED p=${P}: meanΔ=${(sum/a.length).toFixed(3)} maxΔ=${mx} hardPixels(>20)=${hot} (${(100*hot/a.length).toFixed(3)}%)`)
