import { chromium } from 'playwright'
const PORT = process.env.PORT || '5185'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1536,height:743} })
const thirdParty = new Set(), setCookies = []
ctx.on('request', r => { try { const h = new URL(r.url()).host; if (!h.includes('localhost') && !h.startsWith('127.')) thirdParty.add(h) } catch {} })
ctx.on('response', async r => { const sc = await r.headerValue('set-cookie').catch(()=>null); if (sc) setCookies.push(`${new URL(r.url()).host}: ${sc.slice(0,80)}`) })
const p = await ctx.newPage()
async function snap(label){
  const ls = await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))
  const ss = await p.evaluate(()=>Object.fromEntries(Object.entries(sessionStorage)))
  const dc = await p.evaluate(()=>document.cookie)
  const cookies = await ctx.cookies()
  console.log(`\n===== ${label} =====`)
  console.log('localStorage:', JSON.stringify(ls))
  console.log('sessionStorage:', JSON.stringify(ss))
  console.log('document.cookie:', JSON.stringify(dc))
  console.log('context cookies (incl httpOnly):', JSON.stringify(cookies.map(c=>({name:c.name,domain:c.domain,value:c.value.slice(0,20)}))))
}
await p.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle' })
await p.waitForTimeout(1500)
await snap('(i) FRESH LOAD, no interaction')
// accept the banner
const accept = p.locator('.ck-btn--accept')
const hasBanner = await accept.count()
console.log('\ncookie banner present on fresh load:', hasBanner>0)
if (hasBanner) { await accept.click(); await p.waitForTimeout(600) }
await snap('(ii) AFTER clicking Accept')
console.log('\n===== THIRD-PARTY HOSTS REQUESTED AT RUNTIME =====')
console.log([...thirdParty].sort().join('\n') || '(none)')
console.log('\n===== Set-Cookie RESPONSE HEADERS SEEN =====')
console.log(setCookies.length ? setCookies.join('\n') : '(none)')
await b.close()
