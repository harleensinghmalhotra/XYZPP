import { chromium } from 'playwright'
const PORT = process.env.PORT || '5186'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1536,height:743}, deviceScaleFactor:1.25, reducedMotion:'reduce' })
const p = await ctx.newPage()
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(e.message))
await p.addInitScript(()=>{localStorage.setItem('qfp.consent','accepted');localStorage.setItem('qfp.lang','en')})
await p.goto(`http://localhost:${PORT}/about`, {waitUntil:'networkidle'})
await p.waitForTimeout(500)
await p.evaluate(()=>{for(const el of document.querySelectorAll('body *'))if(getComputedStyle(el).position==='fixed')el.style.visibility='hidden'})
for (const name of ['Nilesh Dhankani','Charani Khekho Dhankani','Priyanka Rajpal']) {
  const card = p.locator('.tm-card', { hasText: name }).first()
  await card.scrollIntoViewIfNeeded(); await card.click(); await p.waitForTimeout(400)
  const panel = await p.locator('.tm-person.is-active').first().innerText().catch(()=>'(none active)')
  console.log(`clicked "${name}" -> panel shows: ${panel.split('\n').slice(0,2).join(' / ')}`)
  await p.mouse.move(1,1)
  await p.locator('.tm-panel').first().screenshot({ path:`_lane6/a4-panel-${name.split(' ')[0]}.png` })
}
console.log(errs.length?`[${errs.length} errs]`:'[clean]')
await b.close()
