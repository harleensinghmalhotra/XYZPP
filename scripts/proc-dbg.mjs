import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const errs=[]; p.on('pageerror',e=>errs.push(e.message))
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
const g = await p.evaluate(() => { const e=document.getElementById('process'); return { top:e.getBoundingClientRect().top+scrollY } })
await p.evaluate(y=>window.__lenis.scrollTo(y,{immediate:true}), Math.round(g.top)); await p.waitForTimeout(700)
const d = await p.evaluate(() => {
  const fill=document.querySelector('#process .proc-line-fill'), track=document.querySelector('#process .proc-line-track')
  const nodes=document.querySelectorAll('#process .proc-node')
  const steps=document.querySelector('#process .proc-steps')
  const sb=steps.getBoundingClientRect(), a=nodes[0].getBoundingClientRect(), z=nodes[nodes.length-1].getBoundingClientRect()
  return {
    fillInlineTop: fill.style.top, fillInlineH: fill.style.height,
    fillRect: { h: Math.round(fill.getBoundingClientRect().height), w: Math.round(fill.getBoundingClientRect().width) },
    computedH: getComputedStyle(fill).height, transform: getComputedStyle(fill).transform,
    nodeCount: nodes.length, firstNodeY: Math.round(a.top-sb.top), lastNodeY: Math.round(z.top-sb.top),
  }
})
console.log(JSON.stringify(d,null,1)); console.log('errors:', errs)
await b.close()
