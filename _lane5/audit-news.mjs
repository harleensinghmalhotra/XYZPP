import { chromium } from 'playwright'
const PORT = process.env.PORT || '5185'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1536,height:743} })
const hosts = new Set(), setCookies = []
ctx.on('request', r => { try { const h=new URL(r.url()).host; if(!h.includes('localhost')&&!h.startsWith('127.')) hosts.add(h) } catch {} })
ctx.on('response', async r => { const sc=await r.headerValue('set-cookie').catch(()=>null); if(sc) setCookies.push(new URL(r.url()).host) })
const p = await ctx.newPage()
await p.goto(`http://localhost:${PORT}/newsroom`, { waitUntil:'networkidle' })
await p.waitForTimeout(3000)
console.log('NEWSROOM third-party hosts:'); console.log([...hosts].sort().join('\n'))
console.log('\nSet-Cookie seen:', setCookies.length ? [...new Set(setCookies)].join(', ') : '(none)')
console.log('cookies:', JSON.stringify(await ctx.cookies()))
console.log('localStorage:', await p.evaluate(()=>JSON.stringify(Object.keys(localStorage))))
await b.close()
