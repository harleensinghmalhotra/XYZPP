import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots')
const b = await chromium.launch({ headless: false })
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts && document.fonts.ready)
await p.waitForTimeout(1200)
const geo = await p.evaluate(() => { const el=document.getElementById('services'); return { top: el.getBoundingClientRect().top+window.scrollY, travel: el.offsetHeight-window.innerHeight } })
const to = y => p.evaluate(yy => window.__lenis ? window.__lenis.scrollTo(yy,{immediate:true}) : window.scrollTo(0,yy), y)
await to(Math.round(geo.top + geo.travel*0.06)); await p.waitForTimeout(700)
await p.screenshot({ path: resolve(out,'wwp-refined.png') })
console.log('✓ wwp-refined.png (rest)')
// hover the 2nd visible card
await p.hover('#services .wwp-card:nth-child(2)')
await p.waitForTimeout(450)
await p.screenshot({ path: resolve(out,'wwp-hover.png') })
console.log('✓ wwp-hover.png (hover on card 2)')
// tight closeup of the img->name gap
await p.locator('#services .wwp-viewport').screenshot({ path: resolve(out,'wwp-refined-cards.png') })
console.log('✓ wwp-refined-cards.png')
await b.close()
