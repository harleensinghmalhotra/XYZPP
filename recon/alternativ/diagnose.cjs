// Diagnose preloader duration + real hero structure
const { chromium } = require('playwright');
const URL = 'https://www.alternativinc.com';
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b = await chromium.launch({headless:true});
  const ctx = await b.newContext({viewport:{width:1440,height:900}});
  const page = await ctx.newPage();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000}).catch(e=>console.log('nav',e.message.split('\n')[0]));

  // Poll preloader state every 500ms
  console.log('--- PRELOADER TIMELINE ---');
  for(let t=0;t<=12000;t+=500){
    const s = await page.evaluate(()=>{
      const lf = document.querySelector('.load-frame');
      const cs = lf?getComputedStyle(lf):null;
      const bodyOF = getComputedStyle(document.body).overflow;
      return {
        y: Math.round(window.scrollY),
        docH: document.documentElement.scrollHeight,
        bodyOverflow: bodyOF,
        loadFrame: lf?{display:cs.display,opacity:cs.opacity,visibility:cs.visibility,z:cs.zIndex,pos:cs.position}:null
      };
    });
    console.log(t+'ms', JSON.stringify(s));
    await sleep(500);
  }

  // Now the real body structure (top-level sections)
  console.log('\n--- BODY TOP-LEVEL STRUCTURE ---');
  const struct = await page.evaluate(()=>{
    function desc(el,depth){
      const cs=getComputedStyle(el);
      const r=el.getBoundingClientRect();
      return {
        tag:el.tagName.toLowerCase(),
        cls:(typeof el.className==='string'?el.className:'').slice(0,60),
        pos:cs.position, z:cs.zIndex, ov:cs.overflow, h:Math.round(r.height), top:Math.round(r.top),
        display:cs.display
      };
    }
    const out=[];
    const walk=(el,depth)=>{
      if(depth>2) return;
      for(const c of el.children){
        if(['script','style','link'].includes(c.tagName.toLowerCase())) continue;
        out.push({depth, ...desc(c)});
        walk(c,depth+1);
      }
    };
    walk(document.body,0);
    return out;
  });
  struct.forEach(s=>console.log('  '.repeat(s.depth)+`[${s.depth}] ${s.tag}.${s.cls} | pos=${s.pos} z=${s.z} ov=${s.ov} h=${s.h} top=${s.top} disp=${s.display}`));

  // Identify the actual hero (first section) and whether scroll works now
  console.log('\n--- SCROLL TEST ---');
  await page.evaluate(()=>window.scrollTo(0,600));
  await sleep(600);
  const y1 = await page.evaluate(()=>window.scrollY);
  console.log('after scrollTo(600): scrollY=',y1);
  await page.screenshot({path:__dirname+'/_diag-after-preloader.png'});
  await page.evaluate(()=>window.scrollTo(0,0));
  await sleep(600);
  await page.screenshot({path:__dirname+'/_diag-hero-top.png'});

  await b.close();
})();
