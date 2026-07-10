import { chromium } from 'playwright'
const routes = ['/', '/about', '/educational-books', '/trade-books', '/print-on-demand', '/infrastructure', '/fulfilment', '/contact']
const b = await chromium.launch()
let anyErr = false
for (const r of routes) {
  const p = await b.newPage({ viewport:{width:1536,height:743}, deviceScaleFactor:1.25 })
  const errs = []
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
  p.on('pageerror', e => errs.push('PAGEERROR: '+e.message))
  await p.goto('http://localhost:5173'+r, { waitUntil:'networkidle', timeout:60000 })
  await p.waitForTimeout(600)
  const revealCount = await p.evaluate(() => document.querySelectorAll('[data-reveal],[data-textreveal]').length)
  const aliveReady = await p.evaluate(() => document.documentElement.classList.contains('alive-ready'))
  console.log(`${r.padEnd(22)} alive-ready=${aliveReady} reveals=${revealCount} errs=${errs.length}`)
  if (errs.length) { anyErr=true; errs.slice(0,3).forEach(e=>console.log('   !',e.slice(0,140))) }
  await p.close()
}
await b.close()
console.log(anyErr ? 'HAS ERRORS' : 'CLEAN')
