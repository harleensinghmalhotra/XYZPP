import { chromium } from 'playwright'
const b=await chromium.launch({headless:false})

async function measure(url, useLenis, sel){
  const c=await b.newContext({viewport:{width:1536,height:743},deviceScaleFactor:1.25})
  const p=await c.newPage()
  await p.goto(url,{waitUntil:'load',timeout:60000})
  try{await p.waitForLoadState('networkidle',{timeout:15000})}catch{}
  await p.waitForTimeout(4200)
  await p.evaluate((d)=>{ if(window.__lenis) window.__lenis.scrollTo(d,{immediate:true}); else window.scrollTo(0,d) }, 1260)
  await p.waitForTimeout(800)
  const r=await p.evaluate((sel)=>{
    const bookEl=document.querySelector(sel.book)
    const bk=bookEl.getBoundingClientRect()
    const bookCx=bk.left+bk.width/2, bookCy=bk.top+bk.height/2
    const cuts=[...document.querySelectorAll(sel.cut)].map((el,i)=>{
      const r=el.getBoundingClientRect()
      const cx=r.left+r.width/2, cy=r.top+r.height/2
      return {i, w:Math.round(r.width), h:Math.round(r.height),
        // center offset from book center, in px
        dx:Math.round(cx-bookCx), dy:Math.round(cy-bookCy),
        src:(el.getAttribute('src')||el.querySelector('img')?.getAttribute('src')||'').split('/').pop().slice(0,28)}
    })
    return {book:{w:Math.round(bk.width),h:Math.round(bk.height),cx:Math.round(bookCx),cy:Math.round(bookCy)}, cuts}
  }, sel)
  await c.close()
  return r
}

const ref=await measure('https://www.alternativinc.com', false, {book:'.hero-section_graph_book:not(.over)', cut:'[class*="hero-section_graph-details"]:not(.hero-section_graph-details)'})
const loc=await measure('http://localhost:5173', true, {book:'#hero img[alt="Open book"]', cut:'#hero [data-cut] img'})
console.log('REF book',JSON.stringify(ref.book))
console.log('REF cuts:'); ref.cuts.forEach(c=>console.log('  ',c.src.padEnd(30),'w'+c.w,'h'+c.h,'dx'+c.dx,'dy'+c.dy))
console.log('LOC book',JSON.stringify(loc.book))
console.log('LOC cuts:'); loc.cuts.forEach(c=>console.log('  ',c.src.padEnd(30),'w'+c.w,'h'+c.h,'dx'+c.dx,'dy'+c.dy))
await b.close()
