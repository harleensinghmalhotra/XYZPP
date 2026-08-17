import { chromium } from 'playwright'
const PORT = process.env.PORT || '5185'
const routes = ['/legal/privacy','/legal/cookies','/legal/terms','/legal/accessibility']
const langs = ['en','fr','es']
// known valid route patterns from App.jsx
const valid = [/^\/$/,/^\/about$/,/^\/founder$/,/^\/global-markets$/,/^\/educational-books$/,/^\/trade-books$/,/^\/print-on-demand$/,/^\/infrastructure$/,/^\/newsroom$/,/^\/newsroom\/[^/]+$/,/^\/fulfilment$/,/^\/contact$/,/^\/legal\/(privacy|cookies|terms|accessibility)$/]
const isValid = h => valid.some(r=>r.test(h.split('#')[0].split('?')[0]))
const engWords = /\b(the|and|your|our|with|what|how|we|you|from|when|only|site|browser|data|cookie|rights|changes)\b/gi
const b = await chromium.launch()
const allLinks = new Set()
for (const lang of langs) {
  for (const route of routes) {
    const ctx = await b.newContext({ viewport:{width:1536,height:743} })
    const p = await ctx.newPage()
    const errs = []
    p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()) })
    p.on('pageerror', e=>errs.push(e.message))
    await p.addInitScript((l)=>{localStorage.setItem('qfp.consent','accepted');localStorage.setItem('qfp.lang',l)}, lang)
    await p.goto(`http://localhost:${PORT}${route}`, { waitUntil:'networkidle' })
    await p.waitForTimeout(300)
    const h1s = await p.$$eval('h1', els=>els.map(e=>e.textContent.trim()))
    const links = await p.$$eval('a[href^="/"]', els=>[...new Set(els.map(e=>e.getAttribute('href')))])
    links.forEach(l=>allLinks.add(l))
    let leak = 0
    if (lang!=='en') {
      const prose = await p.$eval('.legal-inner', el=>el.innerText).catch(()=>'')
      const m = prose.match(engWords)||[]
      leak = m.length
    }
    console.log(`${lang} ${route}  h1=${h1s.length} "${h1s[0]||'—'}"  errs=${errs.length}  ${lang!=='en'?`englishWordHits=${leak}`:''}`)
    if (errs.length) console.log('   ERRORS:', errs.slice(0,2).join(' | '))
    await ctx.close()
  }
}
console.log('\n=== all internal links found on legal pages ===')
for (const l of [...allLinks].sort()) console.log(`${isValid(l)?'OK ':'??? '} ${l}`)
await b.close()
