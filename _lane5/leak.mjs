import { chromium } from 'playwright'
const PORT = process.env.PORT || '5185'
const routes = ['/legal/privacy','/legal/cookies','/legal/terms','/legal/accessibility']
// unambiguous English words with no FR/ES overlap and not in preserved proper nouns
const eng = /\b(the|and|your|our|with|what|how|from|when|browser|rights|changes|website|though|however|please)\b/gi
const b = await chromium.launch()
for (const lang of ['fr','es']) {
  for (const route of routes) {
    const ctx = await b.newContext({ viewport:{width:1536,height:743} })
    const p = await ctx.newPage()
    await p.addInitScript((l)=>{localStorage.setItem('qfp.lang',l);localStorage.setItem('qfp.consent','accepted')}, lang)
    await p.goto(`http://localhost:${PORT}${route}`, { waitUntil:'networkidle' })
    const prose = await p.$eval('.legal-inner', el=>el.innerText).catch(()=>'')
    const m = prose.match(eng)||[]
    console.log(`${lang} ${route}: ${m.length ? [...new Set(m.map(x=>x.toLowerCase()))].join(', ') : 'no english leakage'}`)
    await ctx.close()
  }
}
await b.close()
