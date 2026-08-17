// CONTROL — isolate the cause. Soft-nav to /about from different referrers:
//   /            (homepage: mounts SmoothScrollProvider whose unmount calls ScrollTrigger.killAll)
//   /contact     (native-scroll page: NO SmoothScrollProvider, no killAll on leaving)
//   /infrastructure -> /about and /about -> /infrastructure (inner<->inner, no homepage)
// Prediction if the cause is the homepage provider's killAll: only the '/'-referrer nav fails.
import { chromium } from 'playwright'
import fs from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173'
const VIEW = { width: 1536, height: 743 }, DSF = 1.25
const READ = `(async()=>{const pk=s=>{const e=document.querySelector(s);if(!e)return{exists:false};const c=getComputedStyle(e);return{exists:true,opacity:c.opacity,visibility:c.visibility};};
 const tg={awHead:pk('#awards .aw-head'),plq:pk('#awards .plq'),certsTitle:pk('#certifications .certs-title'),certCard:pk('#certifications .cert-card')};
 let st=[];try{const u=performance.getEntriesByType('resource').map(r=>r.name).find(x=>/ScrollTrigger/i.test(x));if(u){const m=await import(u);const ST=m.ScrollTrigger||m.default;if(ST&&ST.getAll)st=ST.getAll().map(t=>{const g=t.trigger;return (g&&g.id?'#'+g.id:'.'+String(g&&g.className||'').trim().split(/\\s+/)[0]);});}}catch(e){}
 return {tg,stCount:st.length,st};})()`
const hid = t => t && t.exists && (parseFloat(t.opacity) < 0.5 || t.visibility === 'hidden')
const vdt = tg => ({ awards: (!tg.awHead.exists||!tg.plq.exists)?'NO-DOM':(hid(tg.awHead)||hid(tg.plq))?'HIDDEN':'VISIBLE',
  certs: (!tg.certsTitle.exists||!tg.certCard.exists)?'NO-DOM':(hid(tg.certsTitle)||hid(tg.certCard))?'HIDDEN':'VISIBLE' })
const sleep = (p,ms)=>p.waitForTimeout(ms)
async function slowTo(page,id){await page.evaluate(async id=>{const t=()=>{const e=document.getElementById(id);return e?e.getBoundingClientRect().top+scrollY-120:document.documentElement.scrollHeight;};const s=m=>new Promise(r=>setTimeout(r,m));let g=0;while(scrollY<t()&&g++<500){scrollBy(0,140);await s(35);}},id);await sleep(page,400)}

async function one(browser, via, target){
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DSF, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled',{cacheDisabled:true})
  await page.goto(BASE + via, { waitUntil: 'load' }); await sleep(page, 1000)
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await sleep(page, 400)
  const links = page.locator(`a[href="${target}"]`); const c = await links.count()
  await (c>1?links.nth(c-1):links.first()).click({force:true,timeout:6000}).catch(()=>links.first().click({force:true}))
  await page.waitForFunction(p=>location.pathname===p, target, {timeout:8000}).catch(()=>{})
  await page.waitForSelector('#awards,#certifications',{timeout:8000}).catch(()=>{})
  await slowTo(page,'awards'); await slowTo(page,'certifications'); await sleep(page,600)
  const d = await page.evaluate(READ); const v = vdt(d.tg)
  await ctx.close()
  return { via, target, verdict: v, stCount: d.stCount, st: d.st }
}
async function main(){
  const browser = await chromium.launch({ headless: false })
  const plan = [
    { via:'/', target:'/about', n:4 },
    { via:'/contact', target:'/about', n:4 },
    { via:'/infrastructure', target:'/about', n:3 },
    { via:'/about', target:'/infrastructure', n:3 },
  ]
  const all=[]
  for(const p of plan){ for(let i=0;i<p.n;i++){ const r=await one(browser,p.via,p.target); all.push(r)
    console.log(`${p.via} -> ${p.target} #${i}  aw=${r.verdict.awards} ce=${r.verdict.certs}  stTriggers=${r.stCount} [${r.st.join(',')}]`) }
    const f=all.filter(r=>r.via===p.via&&r.target===p.target&&(r.verdict.awards!=='VISIBLE'||r.verdict.certs!=='VISIBLE')).length
    console.log(`==== ${p.via} -> ${p.target}: ${f}/${p.n} blank ====`) }
  fs.writeFileSync('D:\\WEBSITES\\Website University\\_recon3\\repro3-control.json', JSON.stringify(all,null,2))
  await browser.close(); console.log('WROTE repro3-control.json')
}
main().catch(e=>{console.error(e);process.exit(1)})
