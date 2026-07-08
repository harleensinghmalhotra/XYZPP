// Recon pass 2 — corrected: wait out the ~12s preloader before capturing hero.
// Redoes Sets B (rest), C (scroll), D (DOM probe) + a preloader->hero reveal sequence.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = 'https://www.alternativinc.com';
const OUT = __dirname;
const sleep = (ms)=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
const log = (m)=>console.log('['+new Date().toISOString().slice(11,19)+'] '+m);

async function goto(page){
  try { await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000}); }
  catch(e){ log('  goto note: '+e.message.split('\n')[0]); }
}
// Poll until the preloader is gone (display:none or opacity 0). Returns ms waited.
async function waitPreloader(page, maxMs=30000){
  const t0=Date.now();
  while(Date.now()-t0<maxMs){
    const gone = await page.evaluate(()=>{
      const lf=document.querySelector('.load-frame');
      if(!lf) return true;
      const cs=getComputedStyle(lf);
      return cs.display==='none' || parseFloat(cs.opacity)===0 || cs.visibility==='hidden';
    });
    if(gone) return Date.now()-t0;
    await sleep(250);
  }
  return -1;
}

// Probe targets the REAL hero (.hero-section) and its scroll wrapper.
const PROBE_FN = `(function(){
  const hero = document.querySelector('.hero-section') || document.querySelector('section') || document.body;
  const wrap = document.querySelector('.hero-section-scroll-wrapper');
  function sel(el){const p=[];let n=el;for(let i=0;i<4&&n&&n.nodeType===1;i++){let s=n.tagName.toLowerCase();if(n.id)s+='#'+n.id;if(typeof n.className==='string'&&n.className.trim())s+='.'+n.className.trim().split(/\\s+/).slice(0,3).join('.');p.unshift(s);n=n.parentElement;}return p.join(' > ');}
  const els=[];
  const push=(el,isRoot)=>{
    const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
    let pPersp=null,pn=el.parentElement,d=0;
    while(pn&&d<8){const pcs=getComputedStyle(pn);if(pcs.perspective&&pcs.perspective!=='none'){pPersp={el:pn.tagName.toLowerCase()+'.'+(typeof pn.className==='string'?pn.className.trim().split(/\\s+/).slice(0,2).join('.'):''),perspective:pcs.perspective};break;}pn=pn.parentElement;d++;}
    els.push({
      root:!!isRoot, tag:el.tagName.toLowerCase(), id:el.id||null,
      classes:(typeof el.className==='string'?el.className:'')||null,
      text:(el.children.length===0&&el.textContent)?el.textContent.trim().slice(0,50):null,
      transform:cs.transform, opacity:cs.opacity, zIndex:cs.zIndex, position:cs.position,
      top:cs.top,left:cs.left,right:cs.right,bottom:cs.bottom,
      willChange:cs.willChange, transition:(cs.transition&&cs.transition.length>140)?cs.transition.slice(0,140)+'…':cs.transition,
      perspective:cs.perspective, transformOrigin:cs.transformOrigin,
      overflow:cs.overflow+' ('+cs.overflowX+'/'+cs.overflowY+')', display:cs.display,
      parentPerspective:pPersp,
      rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}
    });
  };
  push(hero,true);
  hero.querySelectorAll('*').forEach(el=>push(el,false));
  const wcs=wrap?getComputedStyle(wrap):null; const wr=wrap?wrap.getBoundingClientRect():null;
  return {
    heroSelector: sel(hero),
    scrollWrapper: wrap?{selector:sel(wrap),position:wcs.position,height:Math.round(wr.height),top:Math.round(wr.top),overflow:wcs.overflow}:null,
    heroSticky: {position:getComputedStyle(hero).position, top:getComputedStyle(hero).top, rectTop:Math.round(hero.getBoundingClientRect().top)},
    scrollY:Math.round(window.scrollY), viewport:{w:innerWidth,h:innerHeight},
    docHeight:document.documentElement.scrollHeight, count:els.length, elements:els
  };
})()`;

(async()=>{
  const browser = await chromium.launch({headless:true});

  // ===== Preloader -> hero REVEAL sequence (full speed) =====
  try {
    log('REVEAL: capturing preloader handoff');
    const ctx = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const page = await ctx.newPage();
    await goto(page);
    // capture every 750ms from 8s..15.5s to catch the ~12s handoff, plus log exact reveal
    let revealMs=null;
    const t0=Date.now();
    let idx=0;
    // background poll for exact reveal time
    (async()=>{ const w=await waitPreloader(page,20000); revealMs=w; })();
    for(let t=8000;t<=15500;t+=750){
      await sleep(t0+t-Date.now());
      await page.screenshot({path:path.join(OUT,'reveal-'+String(idx).padStart(2,'0')+'.png')});
      idx++;
    }
    await sleep(1000);
    log('  reveal frames: reveal-00..'+String(idx-1).padStart(2,'0')+' | preloader gone at ~'+revealMs+'ms');
    await ctx.close();
  } catch(e){ log('REVEAL ERROR: '+e.message); }

  // ===== SET B — resting (after preloader) =====
  try {
    log('SET B: resting desktop + mobile (post-preloader)');
    const ctx = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const page = await ctx.newPage();
    await goto(page);
    const w = await waitPreloader(page);
    log('  preloader gone at '+w+'ms');
    await sleep(1500); // let hero intro settle
    await page.evaluate(()=>window.scrollTo(0,0));
    await sleep(300);
    await page.screenshot({path:path.join(OUT,'rest-desktop.png')});
    log('  rest-desktop.png');
    await ctx.close();

    const mctx = await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const mpage = await mctx.newPage();
    await goto(mpage);
    await waitPreloader(mpage);
    await sleep(1500);
    await mpage.evaluate(()=>window.scrollTo(0,0));
    await sleep(300);
    await mpage.screenshot({path:path.join(OUT,'rest-mobile.png')});
    log('  rest-mobile.png');
    await mctx.close();
  } catch(e){ log('SET B ERROR: '+e.message); }

  // ===== SET C — scroll micrography (after preloader) =====
  try {
    log('SET C: scroll micrography 40x60px (post-preloader)');
    const ctx = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const page = await ctx.newPage();
    await goto(page);
    const w = await waitPreloader(page);
    log('  preloader gone at '+w+'ms');
    await sleep(1500);
    await page.evaluate(()=>window.scrollTo(0,0));
    await sleep(400);
    for(let i=0;i<40;i++){
      await page.evaluate((yy)=>window.scrollTo(0,yy), i*60);
      await sleep(150);
      await page.screenshot({path:path.join(OUT,'scroll-'+String(i).padStart(3,'0')+'.png')});
      if(i%10===0) log('  scroll-'+String(i).padStart(3,'0')+' (y='+(i*60)+')');
    }
    await ctx.close();
  } catch(e){ log('SET C ERROR: '+e.message); }

  // ===== SET D — DOM probes (after preloader) =====
  try {
    log('SET D: DOM probes @ 0,400,900,1500,2200 (post-preloader)');
    const ctx = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const page = await ctx.newPage();
    await goto(page);
    const w = await waitPreloader(page);
    log('  preloader gone at '+w+'ms');
    await sleep(1500);
    for(const y of [0,400,900,1500,2200]){
      await page.evaluate((yy)=>window.scrollTo(0,yy), y);
      await sleep(500);
      const data = await page.evaluate(PROBE_FN);
      fs.writeFileSync(path.join(OUT,'dom-probe-'+y+'.json'), JSON.stringify(data,null,2));
      log('  dom-probe-'+y+'.json ('+data.count+' els, hero='+data.heroSelector+', heroTop='+data.heroSticky.rectTop+')');
    }
    await ctx.close();
  } catch(e){ log('SET D ERROR: '+e.message); }

  await browser.close();
  log('DONE');
})();
