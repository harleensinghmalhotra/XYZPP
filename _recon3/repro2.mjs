// v2 — faithful repro against the PRODUCTION build (no StrictMode double-invoke).
// Scenario: land on homepage, scroll to the BOTTOM, then click the FOOTER link to
// /about or /infrastructure (soft SPA nav) — a user who read the homepage then clicked
// About in the footer. Peek the reveal triggers the instant the section mounts, before
// any settle. Read-only; writes only into _recon3/.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'D:\\WEBSITES\\Website University\\_recon3'
const VIEW = { width: 1536, height: 743 }
const DSF = 1.25

const PROBE = `
window.__probe = { samples: [], firstSeen: {}, err: null };
const t0 = performance.now();
function sample(){
  try {
    const de = document.documentElement;
    if (!de) { requestAnimationFrame(sample); return; }
    const t = performance.now() - t0;
    const rec = { t: Math.round(t), dh: de.scrollHeight, sy: Math.round(window.scrollY) };
    for (const id of ['awards','certifications']){
      const el = document.getElementById(id);
      if (el){ const top = Math.round(el.getBoundingClientRect().top + window.scrollY); rec[id]=top;
        if(!window.__probe.firstSeen[id]) window.__probe.firstSeen[id]={t:Math.round(t),offsetTop:top,dh:rec.dh,sy:Math.round(window.scrollY)}; }
    }
    window.__probe.samples.push(rec);
    if (t < 15000) requestAnimationFrame(sample);
  } catch(e){ window.__probe.err=String(e); if((performance.now()-t0)<15000) requestAnimationFrame(sample); }
}
requestAnimationFrame(sample);
`

const READ = `(async () => {
  const pick = (sel) => { const el=document.querySelector(sel); if(!el) return {sel,exists:false};
    const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
    return {sel,exists:true,opacity:cs.opacity,visibility:cs.visibility,transform:cs.transform==='none'?'none':'set',w:Math.round(r.width),h:Math.round(r.height)}; };
  const targets = { awHead:pick('#awards .aw-head'), plq:pick('#awards .plq'),
    certsTitle:pick('#certifications .certs-title'), certsSeal:pick('#certifications .certs-seal'), certCard:pick('#certifications .cert-card') };
  let st={ok:false};
  try { const urls=performance.getEntriesByType('resource').map(r=>r.name); const u=urls.find(x=>/ScrollTrigger/i.test(x));
    if(u){ const m=await import(u); const ST=m.ScrollTrigger||m.default;
      if(ST&&ST.getAll) st={ok:true,triggers:ST.getAll().map(tr=>{const g=tr.trigger;const tag=g?(g.id?'#'+g.id:'.'+String(g.className||'').trim().split(/\\s+/).join('.')):'null';return {trigger:tag,start:Math.round(tr.start),end:Math.round(tr.end),progress:+tr.progress.toFixed(3),isActive:tr.isActive};})}; } } catch(e){ st={ok:false,reason:String(e)}; }
  const sect=(id)=>{const el=document.getElementById(id); if(!el) return null; const r=el.getBoundingClientRect(); return {offsetTop:Math.round(r.top+window.scrollY),h:Math.round(r.height)};};
  return { targets, st, docHeight:document.documentElement.scrollHeight, scrollY:Math.round(window.scrollY),
    awards:sect('awards'), certifications:sect('certifications'), firstSeen:window.__probe?.firstSeen };
})()`

const hidden = (t) => t && t.exists && (parseFloat(t.opacity) < 0.5 || t.visibility === 'hidden')
const verdict = (tg) => ({
  awards: (!tg.awHead.exists||!tg.plq.exists)?'NO-DOM':(hidden(tg.awHead)||hidden(tg.plq))?'HIDDEN':'VISIBLE',
  certs: (!tg.certsTitle.exists||!tg.certCard.exists)?'NO-DOM':(hidden(tg.certsTitle)||hidden(tg.certCard)||hidden(tg.certsSeal))?'HIDDEN':'VISIBLE',
})

const sleep = (p, ms) => p.waitForTimeout(ms)
async function slowTo(page, id){
  await page.evaluate(async (id)=>{ const tgt=()=>{const el=document.getElementById(id);return el?el.getBoundingClientRect().top+window.scrollY-120:document.documentElement.scrollHeight;};
    const s=ms=>new Promise(r=>setTimeout(r,ms)); let g=0; while(window.scrollY<tgt()&&g++<500){window.scrollBy(0,140);await s(40);} }, id)
  await sleep(page, 500)
}

async function runOne(browser, { pagePath, throttle, idx, tag, referrerScroll }){
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DSF, reducedMotion: 'no-preference' })
  await context.addInitScript({ content: PROBE })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })

  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(page, 1200)
  if (referrerScroll === 'bottom') { await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(page, 500) }
  if (throttle === 'slow3g') await cdp.send('Network.emulateNetworkConditions', { offline:false, latency:400, downloadThroughput:(500*1024)/8, uploadThroughput:(500*1024)/8 })

  // click a link to the target path (prefer the LAST = footer one when scrolled to bottom)
  const links = page.locator(`a[href="${pagePath}"]`)
  const cnt = await links.count()
  const link = referrerScroll === 'bottom' && cnt > 1 ? links.nth(cnt - 1) : links.first()
  await link.click({ force: true, timeout: 6000 }).catch(async () => { await links.first().click({ force: true, timeout: 6000 }) })
  await page.waitForFunction((p) => location.pathname === p, pagePath, { timeout: 8000 }).catch(() => {})
  await page.waitForSelector('#awards, #certifications', { timeout: 8000 }).catch(() => {})

  // PEEK immediately (minimal settle) — catch a stale trigger
  const peek = await page.evaluate(READ).catch(() => null)

  await slowTo(page, 'awards'); await slowTo(page, 'certifications')
  await sleep(page, 700)
  const data = await page.evaluate(READ)
  const v = verdict(data.targets)
  const fail = v.awards !== 'VISIBLE' || v.certs !== 'VISIBLE'
  if (fail || idx === 0) for (const id of ['awards','certifications']){ const el=await page.$('#'+id); if(el){ try{ await el.screenshot({ path: path.join(OUT, `v2_${tag}_${idx}_${id}_${id==='awards'?v.awards:v.certs}.png`) }) }catch{} } }
  const rec = { tag, idx, pagePath, throttle, referrerScroll, verdict: v, fail,
    finalTargets: data.targets, finalST: data.st, finalScrollY: data.scrollY, docHeight: data.docHeight,
    awardsOffsetTop: data.awards?.offsetTop, certsOffsetTop: data.certifications?.offsetTop, firstSeen: data.firstSeen,
    peek: peek ? { verdict: verdict(peek.targets), st: peek.st, awardsTop: peek.awards?.offsetTop, certsTop: peek.certifications?.offsetTop, scrollY: peek.scrollY, docHeight: peek.docHeight } : null }
  await context.close()
  return rec
}

async function main(){
  const browser = await chromium.launch({ headless: false })
  const matrix = [
    { tag: 'about-footerBottom-normal', pagePath: '/about', throttle: 'none', referrerScroll: 'bottom', n: 10 },
    { tag: 'infra-footerBottom-normal', pagePath: '/infrastructure', throttle: 'none', referrerScroll: 'bottom', n: 10 },
    { tag: 'about-footerBottom-slow3g', pagePath: '/about', throttle: 'slow3g', referrerScroll: 'bottom', n: 8 },
    { tag: 'infra-footerBottom-slow3g', pagePath: '/infrastructure', throttle: 'slow3g', referrerScroll: 'bottom', n: 8 },
  ]
  const all = []
  for (const cell of matrix){
    for (let i=0;i<cell.n;i++){
      const rec = await runOne(browser, { ...cell, idx: i })
      all.push(rec)
      const pk = rec.peek
      const pst = pk?.st?.triggers?.filter(t=>/awards|certifications/.test(t.trigger)).map(t=>`${t.trigger}@${t.start}/p${t.progress}`).join(',') || '-'
      console.log(`${cell.tag} #${i} aw=${rec.verdict.awards} ce=${rec.verdict.certs}${rec.fail?'  <== FAIL':''}` +
        ` | peek[nav sy=${pk?.scrollY} awTop=${pk?.awardsTop} dh=${pk?.docHeight} v=${pk?.verdict?.awards}/${pk?.verdict?.certs} ${pst}]` +
        ` settledAwTop=${rec.awardsOffsetTop} dh=${rec.docHeight}`)
    }
    const f = all.filter(r=>r.tag===cell.tag&&r.fail).length
    const af = all.filter(r=>r.tag===cell.tag&&r.verdict.awards!=='VISIBLE').length
    const cf = all.filter(r=>r.tag===cell.tag&&r.verdict.certs!=='VISIBLE').length
    console.log(`==== ${cell.tag}: ${f}/${cell.n} blank (awards ${af}/${cell.n}, certs ${cf}/${cell.n}) ====`)
  }
  fs.writeFileSync(path.join(OUT,'repro2-results.json'), JSON.stringify(all,null,2))
  await browser.close(); console.log('WROTE repro2-results.json')
}
main().catch(e=>{console.error(e);process.exit(1)})
