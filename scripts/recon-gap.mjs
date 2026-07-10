import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const b = await chromium.launch({ headless: false })
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(1100)
const geo = await p.evaluate(() => { const el=document.getElementById('services'); return { top: el.getBoundingClientRect().top+window.scrollY, travel: el.offsetHeight-window.innerHeight } })
console.log('travel(px):', geo.travel)
const to = y => p.evaluate(yy => window.__lenis.scrollTo(yy,{immediate:true}), y)
// rest
await to(Math.round(geo.top + geo.travel*0.06)); await p.waitForTimeout(700)
await p.screenshot({ path: resolve(root,'shots/wwp-gap.png') }); console.log('✓ wwp-gap.png')
// find scroll where Learning Kits(06) & Corporate(07) are both on screen -> ~85%
await to(Math.round(geo.top + geo.travel*0.9)); await p.waitForTimeout(700)
await p.screenshot({ path: resolve(root,'shots/wwp-gap-pair.png') }); console.log('✓ wwp-gap-pair.png (06<->07)')
// measure min horizontal gap between adjacent cards' cutout bounding boxes across the row at this pos
const clash = await p.evaluate(() => {
  const cards=[...document.querySelectorAll('#services .wwp-card')]
  const imgs=cards.map(c=>c.querySelector('.wwp-img').getBoundingClientRect())
  const cardRects=cards.map(c=>c.getBoundingClientRect())
  const gaps=[]
  for(let i=0;i<imgs.length-1;i++){ gaps.push(+(cardRects[i+1].left - imgs[i].right).toFixed(1)) } // next card left - this cutout right
  const imgVsNextCard=[]
  for(let i=0;i<imgs.length-1;i++){ imgVsNextCard.push(+(imgs[i].right - cardRects[i+1].left).toFixed(1)) } // >0 means cutout intrudes into next card
  return { imgVsNextCard }
})
console.log('cutout-right minus next-card-left (>0 = intrudes into neighbor):', clash.imgVsNextCard)
await b.close()
