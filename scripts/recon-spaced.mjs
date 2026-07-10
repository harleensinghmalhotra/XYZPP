import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const b = await chromium.launch({ headless: false })
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(1100)
const geo = await p.evaluate(() => { const el=document.getElementById('services'); return { top: el.getBoundingClientRect().top+window.scrollY, travel: el.offsetHeight-window.innerHeight } })
await p.evaluate(y => window.__lenis.scrollTo(y,{immediate:true}), Math.round(geo.top + geo.travel*0.06)); await p.waitForTimeout(700)
await p.screenshot({ path: resolve(root,'shots/wwp-spaced.png') })
console.log('✓ wwp-spaced.png')
await b.close()
