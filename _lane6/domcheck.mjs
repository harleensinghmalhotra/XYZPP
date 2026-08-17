import { chromium } from 'playwright'
const PORT = process.env.PORT || '5186'
const b = await chromium.launch()
for (const lang of ['en','fr','es']) {
  const ctx = await b.newContext({ viewport:{width:1536,height:743}, reducedMotion:'reduce' })
  const p = await ctx.newPage()
  await p.addInitScript((l)=>{localStorage.setItem('qfp.lang',l);localStorage.setItem('qfp.consent','accepted')}, lang)
  await p.goto(`http://localhost:${PORT}/`, {waitUntil:'networkidle'})
  await p.waitForTimeout(400)
  const txt = await p.$eval('#process', el=>el.innerText).catch(()=>'(no #process)')
  const hasPaperSel = /paper selection/i.test(txt)
  console.log(`${lang}: #process DOM text contains "paper selection"? ${hasPaperSel}`)
  console.log(`   text: ${JSON.stringify(txt.replace(/\n/g,' | '))}`)
  await ctx.close()
}
await b.close()
