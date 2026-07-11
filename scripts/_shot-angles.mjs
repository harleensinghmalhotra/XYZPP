import { chromium } from 'playwright'
const BASE='http://localhost:5197'
const glb=process.env.GLB, out=process.env.OUT, demetal=process.env.DEMETAL||'0'
const angles=(process.env.ANGLES||'0,45,315').split(',').map(Number)
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const b=await chromium.launch({headless:false})
const page=await(await b.newContext({viewport:{width:720,height:920},deviceScaleFactor:1})).newPage()
const errs=[];page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())})
await page.goto(`${BASE}/_mesh-recon.html?glb=${encodeURIComponent(glb)}&demetal=${demetal}`,{waitUntil:'networkidle'})
await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:30000})
console.log('INFO:',JSON.stringify(await page.evaluate(()=>({i:window.__meshInfo,e:window.__error}))))
for(const d of angles){await page.evaluate(x=>window.__setYaw(x),d);await sleep(200);await page.screenshot({path:`${out}/${String(d).padStart(3,'0')}.png`})}
console.log('ERRORS:',errs.length);errs.slice(0,5).forEach(e=>console.log(' -',e))
await b.close()
