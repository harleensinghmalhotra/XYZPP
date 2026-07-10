import { chromium } from 'playwright'
const b = await chromium.launch()
const routes = ['/', '/about', '/educational-books', '/contact']
for (const r of routes) {
  const p = await b.newPage({ viewport:{width:1536,height:743}, deviceScaleFactor:1.25 })
  const errs=[]; p.on('pageerror',e=>errs.push(e.message))
  try {
    await p.goto('http://localhost:5173'+r,{waitUntil:'domcontentloaded',timeout:60000})
    await p.waitForTimeout(900)
    const header = await p.evaluate(() => {
      const h = document.querySelector('header')
      if (!h) return null
      const cs = getComputedStyle(h)
      // scroll down 600 and check header's viewport position (should move with page = scroll away)
      return { position: cs.position, top: h.getBoundingClientRect().top }
    })
    await p.evaluate(() => window.scrollTo(0, 600))
    await p.waitForTimeout(200)
    const afterTop = await p.evaluate(() => document.querySelector('header').getBoundingClientRect().top)
    console.log(`${r.padEnd(20)} pos=${header?.position} topBefore=${Math.round(header?.top)} topAfterScroll=${Math.round(afterTop)} errs=${errs.length}`)
  } catch(e){ console.log(r, 'FAIL', e.message.slice(0,50)) }
  await p.close()
}
await b.close()
