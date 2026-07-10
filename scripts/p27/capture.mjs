import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const OUT = 'shots/phase27'
mkdirSync(OUT, { recursive: true })
const ROUTES = [
  ['home','/'], ['about','/about'], ['edu','/educational-books'],
  ['trade','/trade-books'], ['pod','/print-on-demand'],
  ['infra','/infrastructure'], ['fulfil','/fulfilment'], ['contact','/contact'],
]
const VP = { width: 1536, height: 743 }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
let totalErr = 0
for (const [name, route] of ROUTES) {
  const p = await ctx.newPage()
  const errs = []
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
  p.on('pageerror', e => errs.push('PE:'+e.message))
  try {
    await p.goto('http://localhost:5173'+route, { waitUntil:'domcontentloaded', timeout:60000 })
    await p.waitForTimeout(1100)
    for (const [tag,frac] of [['a-top',0],['b-mid',0.5],['c-bot',0.94]]) {
      try {
        await p.evaluate((f) => {
          const max = document.documentElement.scrollHeight - window.innerHeight
          const y = Math.round(max*f)
          if (window.__lenis) window.__lenis.scrollTo(y,{immediate:true}); else window.scrollTo(0,y)
        }, frac)
        await p.waitForTimeout(750)
        await p.screenshot({ path: `${OUT}/${name}-${tag}.png` })
      } catch (e) { console.log(`  ${name}/${tag} skip: ${String(e.message).slice(0,50)}`) }
    }
  } catch (e) { console.log(`  ${name} goto fail: ${String(e.message).slice(0,50)}`) }
  console.log(`${name.padEnd(8)} errs=${errs.length}`, errs.slice(0,2).map(e=>e.slice(0,90)).join(' | '))
  totalErr += errs.length
  await p.close()
}
await ctx.close(); await b.close()
console.log(totalErr? 'ERRORS='+totalErr : 'CLEAN')
