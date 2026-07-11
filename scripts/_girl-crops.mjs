import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
const BASE='http://localhost:5203'
const OUT=process.env.OUT||'shots/conveyor-r8c/tmp'
mkdirSync(OUT,{recursive:true})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
// state -> [progress, cropbox {left,top,width,height} in 1920x1207 space]
const STATES={
  standing:[0.80,{left:1330,top:170,width:520,height:755}],
  apex:[0.875,{left:900,top:70,width:620,height:720}],
  hold:[1.0,{left:1230,top:180,width:560,height:745}],
}
const scrub=async(page,p)=>page.evaluate(p=>{const s=document.querySelector('.conv-scroll');const t=s.getBoundingClientRect().top+scrollY;const y=t+p*(s.offsetHeight-innerHeight);window.__lenis?window.__lenis.scrollTo(y,{immediate:true,force:true}):scrollTo(0,y)},p)
const b=await chromium.launch({headless:false})
const page=await(await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
const errs=[];page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())})
await page.goto(BASE+'/',{waitUntil:'networkidle'});await sleep(2000)
// warm up: nudge scroll so the camera eases into the ending region before we shoot
await scrub(page,0.86);await sleep(1200);await scrub(page,0.80);await sleep(2600)
for(const [name,[p,crop]] of Object.entries(STATES)){
  await scrub(page,p)
  await sleep(1800) // let the camera fully ease + snap
  const full=await page.screenshot()
  await sharp(full).toFile(`${OUT}/${name}-full.png`)
  await sharp(full).extract(crop).toFile(`${OUT}/${name}-crop.png`)
}
await b.close()
console.log('crops →',OUT,'errors:',errs.length)
errs.slice(0,5).forEach(e=>console.log(' -',e))
