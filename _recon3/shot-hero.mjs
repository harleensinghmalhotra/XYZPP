import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = process.env.OUT || 'C:\\Users\\Harleen\\AppData\\Local\\Temp\\claude\\d--WEBSITES-Website-University\\8ebd6733-c21d-48c6-86fc-1050687fe924\\scratchpad\\hero-shot.png'
const DPR = Number(process.env.DPR || 1.25)
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: DPR })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const img = document.querySelector('#hero img')
  const cont = img.parentElement
  const r = cont.getBoundingClientRect()
  const pair = document.querySelector('.hero-cta-pair')
  const btns = Array.from(pair.querySelectorAll('a.hero-btn'))
  const L = btns[0].getBoundingClientRect(), R = btns[1].getBoundingClientRect()
  return { contLeft: Math.round(r.left), contTop: Math.round(r.top), contW: Math.round(r.width), contH: Math.round(r.height),
    imgW: Math.round(img.getBoundingClientRect().width), imgCentreCss: Math.round(img.getBoundingClientRect().left + img.getBoundingClientRect().width/2),
    leftBtnRight: Math.round(L.right), rightBtnLeft: Math.round(R.left), gapCentre: Math.round((L.right+R.left)/2) }
})
const cont = await page.$('#hero img >> xpath=..')
await cont.screenshot({ path: OUT })
console.log(JSON.stringify(info))
console.log('WROTE ' + OUT + ' at DPR ' + DPR)
await browser.close()
