// Task 1 verification — reproduce the blank-band bug against the PRODUCTION build.
// Land on homepage, scroll to bottom, click the footer link to /about or /infrastructure
// (soft SPA nav), scroll to Awards + Certifications, read computed visibility. 10x each.
// Read-only; writes screenshots only into _recon3/. Uses a headed browser as the brief asks.
import { chromium } from 'playwright'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'D:\\WEBSITES\\Website University\\_recon3'
const VIEW = { width: 1536, height: 743 }
const DSF = 1.25

const READ = `(() => {
  const pick = (sel) => { const el=document.querySelector(sel); if(!el) return {sel,exists:false};
    const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
    return {sel,exists:true,opacity:cs.opacity,visibility:cs.visibility,w:Math.round(r.width),h:Math.round(r.height)}; };
  return { awHead:pick('#awards .aw-head'), plq:pick('#awards .plq'),
    certsTitle:pick('#certifications .certs-title'), certsSeal:pick('#certifications .certs-seal'), certCard:pick('#certifications .cert-card') };
})()`

const hidden = (t) => t && t.exists && (parseFloat(t.opacity) < 0.5 || t.visibility === 'hidden')
const verdict = (tg) => ({
  awards: (!tg.awHead.exists||!tg.plq.exists)?'NO-DOM':(hidden(tg.awHead)||hidden(tg.plq))?'HIDDEN':'VISIBLE',
  certs: (!tg.certsTitle.exists||!tg.certCard.exists)?'NO-DOM':(hidden(tg.certsTitle)||hidden(tg.certCard)||hidden(tg.certsSeal))?'HIDDEN':'VISIBLE',
})
const sleep = (p, ms) => p.waitForTimeout(ms)
async function slowTo(page, id){
  await page.evaluate(async (id)=>{ const tgt=()=>{const el=document.getElementById(id);return el?el.getBoundingClientRect().top+window.scrollY-120:document.documentElement.scrollHeight;};
    const s=ms=>new Promise(r=>setTimeout(r,ms)); let g=0; while(window.scrollY<tgt()&&g++<600){window.scrollBy(0,150);await s(30);} }, id)
  await sleep(page, 400)
}

async function runOne(browser, { pagePath, idx, tag }){
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DSF, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(page, 1200)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(page, 500)
  const links = page.locator(`a[href="${pagePath}"]`)
  const cnt = await links.count()
  const link = cnt > 1 ? links.nth(cnt - 1) : links.first()
  await link.click({ force: true, timeout: 6000 }).catch(async () => { await links.first().click({ force: true, timeout: 6000 }) })
  await page.waitForFunction((p) => location.pathname === p, pagePath, { timeout: 8000 }).catch(() => {})
  await page.waitForSelector('#awards, #certifications', { timeout: 8000 }).catch(() => {})
  await slowTo(page, 'awards'); await slowTo(page, 'certifications')
  await sleep(page, 700)
  const tg = await page.evaluate(READ)
  const v = verdict(tg)
  const fail = v.awards !== 'VISIBLE' || v.certs !== 'VISIBLE'
  if (fail) for (const id of ['awards','certifications']){ const el=await page.$('#'+id); if(el){ try{ await el.screenshot({ path: path.join(OUT, `t1_${tag}_${idx}_${id}_FAIL.png`) }) }catch{} } }
  await context.close()
  return { tag, idx, verdict: v, fail }
}

async function main(){
  const browser = await chromium.launch({ headless: false })
  const matrix = [
    { tag: 'about', pagePath: '/about', n: 10 },
    { tag: 'infrastructure', pagePath: '/infrastructure', n: 10 },
  ]
  const summary = {}
  for (const cell of matrix){
    let f = 0
    for (let i=0;i<cell.n;i++){
      const rec = await runOne(browser, { ...cell, idx: i })
      if (rec.fail) f++
      console.log(`${cell.tag} #${i} aw=${rec.verdict.awards} ce=${rec.verdict.certs}${rec.fail?'  <== FAIL':''}`)
    }
    summary[cell.tag] = `${f}/${cell.n}`
    console.log(`==== ${cell.tag}: ${f}/${cell.n} blank ====`)
  }
  await browser.close()
  console.log('SUMMARY ' + JSON.stringify(summary))
}
main().catch(e=>{console.error(e);process.exit(1)})
