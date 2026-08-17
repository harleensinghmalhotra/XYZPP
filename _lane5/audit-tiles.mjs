import { chromium } from 'playwright'
const PORT = process.env.PORT || '5185'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1536,height:743} })
const hosts = new Set(), setCookies = []
ctx.on('request', r => { try { const h=new URL(r.url()).host; if(!h.includes('localhost')&&!h.startsWith('127.')) hosts.add(h) } catch {} })
ctx.on('response', async r => { const sc=await r.headerValue('set-cookie').catch(()=>null); if(sc) setCookies.push(new URL(r.url()).host) })
const p = await ctx.newPage()
await p.goto(`http://localhost:${PORT}/`, { waitUntil:'networkidle' })
// scroll through the whole homepage to trigger the globe + any lazy third-party loads
await p.evaluate(async()=>{const h=document.body.scrollHeight;for(let y=0;y<=h;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}})
await p.waitForTimeout(2500)
console.log('THIRD-PARTY HOSTS (homepage, full scroll):'); console.log([...hosts].sort().join('\n'))
console.log('\nSet-Cookie headers seen:', setCookies.length ? [...new Set(setCookies)].join(', ') : '(none)')
const cookies = await ctx.cookies()
console.log('cookies after full homepage tour:', JSON.stringify(cookies))
await b.close()
