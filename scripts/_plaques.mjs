import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const BASE='http://localhost:5211'
const OUT=process.env.OUT||'shots/conveyor-plaques/tmp'
const LANG=process.env.LANG_||'en'
mkdirSync(OUT,{recursive:true})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const b=await chromium.launch({headless:false})
const page=await(await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})).newPage()
const errs=[];page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())})
await page.goto(BASE+'/',{waitUntil:'networkidle'});await sleep(2200)
if(LANG!=='en'){try{await page.getByRole('button',{name:'FR',exact:true}).first().click({timeout:2000})}catch{} await sleep(700)}
const setp=(p)=>page.evaluate(p=>{const s=document.querySelector('.conv-scroll');const t=s.getBoundingClientRect().top+scrollY;const y=t+p*(s.offsetHeight-innerHeight);window.__lenis?window.__lenis.scrollTo(y,{immediate:true,force:true}):scrollTo(0,y)},p)
// warm up camera into the section
await setp(0.05); await sleep(1600)
const PS=[0.0,0.154,0.308,0.462,0.616,0.77]
for(const p of PS){ await setp(p); await sleep(900); await page.screenshot({path:`${OUT}/p${p.toFixed(2)}.png`}) }
await b.close()
console.log(`${OUT} (${LANG}) errors:`,errs.length); errs.slice(0,4).forEach(e=>console.log(' -',e))
