// Forensic recon of https://www.alternativinc.com hero
// Usage: node recon/alternativ/recon.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.alternativinc.com';
const OUT = __dirname;
const sleep = (ms) => new Promise(r => setTimeout(r, Math.max(0, ms)));
const log = (m)=>console.log('['+new Date().toISOString().slice(11,19)+'] '+m);

// Navigate resiliently: this site never fires 'load' (long-poll analytics),
// so wait for DOM + a manual settle instead.
async function goto(page, settle=3500){
  try { await page.goto(URL, {waitUntil:'domcontentloaded', timeout:45000}); }
  catch(e){ log('  goto note: '+e.message.split('\n')[0]); }
  await sleep(settle);
}

const PROBE_FN = `(function(){
  function pickHero(){
    const cands = Array.from(document.querySelectorAll('[class*="hero" i], section, .section, main > *, body > *'));
    const vh = window.innerHeight;
    for (const el of cands){
      const r = el.getBoundingClientRect();
      if (r.height >= vh*0.7 && r.width >= window.innerWidth*0.6 && r.top < vh) return el;
    }
    return document.querySelector('section') || document.querySelector('main') || document.body.firstElementChild || document.body;
  }
  const hero = pickHero();
  function heroSelector(el){
    const parts=[]; let n=el;
    for(let i=0;i<4&&n&&n.nodeType===1;i++){
      let s=n.tagName.toLowerCase();
      if(n.id) s+='#'+n.id;
      if(n.className && typeof n.className==='string') s+='.'+n.className.trim().split(/\\s+/).slice(0,3).join('.');
      parts.unshift(s); n=n.parentElement;
    }
    return parts.join(' > ');
  }
  const all = hero.querySelectorAll('*');
  const els=[];
  const push=(el, isRoot)=>{
    const cs=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    let pPersp=null, pn=el.parentElement, d=0;
    while(pn && d<8){ const pcs=getComputedStyle(pn); if(pcs.perspective && pcs.perspective!=='none'){pPersp={el:pn.tagName.toLowerCase()+'.'+(typeof pn.className==='string'?pn.className.trim().split(/\\s+/).slice(0,2).join('.'):''), perspective:pcs.perspective}; break;} pn=pn.parentElement; d++; }
    els.push({
      root: !!isRoot,
      tag: el.tagName.toLowerCase(),
      id: el.id||null,
      classes: (typeof el.className==='string'?el.className:'')||null,
      text: (el.children.length===0 && el.textContent) ? el.textContent.trim().slice(0,40) : null,
      transform: cs.transform,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      position: cs.position,
      top: cs.top, left: cs.left, right: cs.right, bottom: cs.bottom,
      willChange: cs.willChange,
      transition: (cs.transition && cs.transition.length>140) ? cs.transition.slice(0,140)+'…' : cs.transition,
      perspective: cs.perspective,
      transformOrigin: cs.transformOrigin,
      overflow: cs.overflow+' ('+cs.overflowX+'/'+cs.overflowY+')',
      display: cs.display,
      parentPerspective: pPersp,
      rect: {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}
    });
  };
  push(hero,true);
  all.forEach(el=>push(el,false));
  return {
    heroSelector: heroSelector(hero),
    scrollY: Math.round(window.scrollY),
    viewport: {w:window.innerWidth,h:window.innerHeight},
    docHeight: document.documentElement.scrollHeight,
    count: els.length,
    elements: els
  };
})()`;

async function fast3g(client){
  await client.send('Network.emulateNetworkConditions', {
    offline:false, latency:150,
    downloadThroughput: Math.floor(1.6*1000*1000/8),
    uploadThroughput: Math.floor(0.75*1000*1000/8)
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ============ SET A — Loading sequence (Fast 3G, 1440x900) ============
  try {
    log('SET A: loading sequence @ Fast 3G (+ video)');
    const ctx = await browser.newContext({
      viewport:{width:1440,height:900}, deviceScaleFactor:1,
      recordVideo:{ dir: OUT, size:{width:1440,height:900} }
    });
    const page = await ctx.newPage();
    const client = await ctx.newCDPSession(page);
    await client.send('Network.enable');
    await fast3g(client);
    const marks = [100,300,600,1000,2000,3000];
    const names = ['loading-01','loading-02','loading-03','loading-04','loading-05','loading-06'];
    const t0 = Date.now();
    // commit resolves as soon as the main response arrives — don't block on load.
    page.goto(URL, {waitUntil:'commit', timeout:45000}).catch(e=>log('  nav note: '+e.message.split('\n')[0]));
    for (let i=0;i<marks.length;i++){
      await sleep(t0+marks[i]-Date.now());
      const el = Date.now()-t0;
      try {
        const shot = await client.send('Page.captureScreenshot', {format:'png', fromSurface:true, captureBeyondViewport:false});
        fs.writeFileSync(path.join(OUT,names[i]+'.png'), Buffer.from(shot.data,'base64'));
        log('  '+names[i]+' target='+marks[i]+'ms actual='+el+'ms');
      } catch(e){ log('  '+names[i]+' capture fail: '+e.message.split('\n')[0]); }
    }
    await sleep(2000);
    await ctx.close();
    try {
      const vids = fs.readdirSync(OUT).filter(f=>f.endsWith('.webm'));
      if (vids.length){
        const newest = vids.map(f=>({f,t:fs.statSync(path.join(OUT,f)).mtimeMs})).sort((a,b)=>b.t-a.t)[0].f;
        if (newest!=='loading-sequence.webm'){
          if (fs.existsSync(path.join(OUT,'loading-sequence.webm'))) fs.unlinkSync(path.join(OUT,'loading-sequence.webm'));
          fs.renameSync(path.join(OUT,newest), path.join(OUT,'loading-sequence.webm'));
        }
        log('  loading-sequence.webm');
      }
    } catch(e){ log('  video rename note: '+e.message); }
  } catch(e){ log('SET A ERROR: '+e.message); }

  // ============ SET B — Resting state (no throttle) + SET E resources ============
  const resources = [];
  try {
    log('SET B/E: resting desktop + tech inventory');
    const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
    const page = await ctx.newPage();
    page.on('response', (resp) => {
      try{
        const req = resp.request();
        const h = resp.headers();
        resources.push({
          url: resp.url(),
          type: req.resourceType(),
          status: resp.status(),
          mime: (h['content-type']||'').split(';')[0],
          size: h['content-length'] ? parseInt(h['content-length']) : null
        });
      }catch(_){}
    });
    await goto(page, 4000);
    await page.screenshot({path:path.join(OUT,'rest-desktop.png')});
    log('  rest-desktop.png');

    const tech = await page.evaluate(() => {
      const g = window;
      const scripts = Array.from(document.scripts).map(s=>s.src||'[inline '+(s.textContent||'').length+'ch]');
      const canvases = Array.from(document.querySelectorAll('canvas')).map(c=>({w:c.width,h:c.height, rect:c.getBoundingClientRect()}));
      const videos = Array.from(document.querySelectorAll('video')).map(v=>({src:v.currentSrc||v.src||((v.querySelector('source')||{}).src),w:v.videoWidth,h:v.videoHeight,autoplay:v.autoplay,loop:v.loop,muted:v.muted,poster:v.poster||null}));
      const imgs = Array.from(document.querySelectorAll('img')).map(i=>({src:i.currentSrc||i.src,nw:i.naturalWidth,nh:i.naturalHeight,dw:Math.round(i.getBoundingClientRect().width),dh:Math.round(i.getBoundingClientRect().height),loading:i.loading,alt:i.alt||''}));
      return {
        gsap: g.gsap ? (g.gsap.version||'present') : false,
        ScrollTrigger: !!(g.ScrollTrigger || (g.gsap&&g.gsap.core&&g.gsap.core.globals&&g.gsap.core.globals().ScrollTrigger)),
        lottie: g.lottie ? 'present' : false,
        bodymovin: g.bodymovin ? 'present' : false,
        THREE: g.THREE ? (g.THREE.REVISION?('r'+g.THREE.REVISION):'present') : false,
        Webflow: g.Webflow ? 'present' : false,
        jQuery: g.jQuery ? (g.jQuery.fn && g.jQuery.fn.jquery) : false,
        Lenis: (g.Lenis||g.lenis) ? 'present' : false,
        IntersectionObserver: typeof IntersectionObserver!=='undefined',
        scripts, canvases, videos, imgs,
        svgCount: document.querySelectorAll('svg').length,
        title: document.title,
        htmlDataAttrs: Array.from(document.documentElement.attributes).map(a=>a.name+'='+a.value)
      };
    });
    fs.writeFileSync(path.join(OUT,'_tech-globals.json'), JSON.stringify(tech,null,2));
    await ctx.close();
  } catch(e){ log('SET B/E ERROR: '+e.message); }

  // ============ SET B — mobile ============
  try {
    const ctx = await browser.newContext({ viewport:{width:375,height:812}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
    const page = await ctx.newPage();
    await goto(page, 4000);
    await page.screenshot({path:path.join(OUT,'rest-mobile.png')});
    log('  rest-mobile.png');
    await ctx.close();
  } catch(e){ log('SET B mobile ERROR: '+e.message); }

  // ============ SET C — Scroll micrography ============
  try {
    log('SET C: scroll micrography 40 steps @ 60px');
    const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
    const page = await ctx.newPage();
    await goto(page, 3000);
    await page.evaluate(()=>window.scrollTo(0,0));
    await sleep(400);
    for (let i=0;i<40;i++){
      await page.evaluate((yy)=>window.scrollTo(0,yy), i*60);
      await sleep(150);
      const name = 'scroll-'+String(i).padStart(3,'0');
      await page.screenshot({path:path.join(OUT,name+'.png')});
      if(i%10===0) log('  '+name+' (scrollY='+(i*60)+')');
    }
    await ctx.close();
  } catch(e){ log('SET C ERROR: '+e.message); }

  // ============ SET D — DOM forensics ============
  try {
    log('SET D: DOM probes @ 0,400,900,1500,2200');
    const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
    const page = await ctx.newPage();
    await goto(page, 3000);
    for (const y of [0,400,900,1500,2200]){
      await page.evaluate((yy)=>window.scrollTo(0,yy), y);
      await sleep(500);
      const data = await page.evaluate(PROBE_FN);
      fs.writeFileSync(path.join(OUT,'dom-probe-'+y+'.json'), JSON.stringify(data,null,2));
      log('  dom-probe-'+y+'.json ('+data.count+' els, hero='+data.heroSelector+')');
    }
    await ctx.close();
  } catch(e){ log('SET D ERROR: '+e.message); }

  try {
    fs.writeFileSync(path.join(OUT,'_resources.json'), JSON.stringify(resources,null,2));
    log('  _resources.json ('+resources.length+' responses)');
  } catch(e){ log('resources write ERROR: '+e.message); }

  await browser.close();
  log('DONE');
})();
