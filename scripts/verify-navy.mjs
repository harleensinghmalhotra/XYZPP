import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

async function dismiss(page) {
  for (const l of ['Accept all', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${l}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
  await page.waitForTimeout(300)
}

// 1) Infrastructure hero → book seam
const p1 = await ctx.newPage()
await p1.goto('http://localhost:5173/infrastructure', { waitUntil: 'networkidle' })
await p1.waitForTimeout(1500); await dismiss(p1)
// measure hero navy vs book-stage navy
const seam = await p1.evaluate(() => {
  const hero = document.querySelector('.ph-hero, [class*="PageHero"], section[data-theme="dark"]')
  const book = document.querySelector('.ib-stage')
  const cs = (el) => el ? getComputedStyle(el).backgroundColor : null
  return { heroBg: cs(hero), bookBg: cs(book), bookBgImg: book ? getComputedStyle(book).backgroundImage.slice(0,60) : null }
})
console.log('INFRA seam:', JSON.stringify(seam))
// screenshot the seam region: bottom of hero + top of book
const book = p1.locator('.ib-stage').first()
await book.scrollIntoViewIfNeeded()
await p1.waitForTimeout(500)
const bb = await book.boundingBox()
writeFileSync('./scripts/navy-infra-seam.png', await p1.screenshot({ clip: { x: 0, y: Math.max(0, bb.y - 260), width: 1440, height: 520 } }))
await p1.close()

// 2) PrintOnDemand dark section spot-check
const p2 = await ctx.newPage()
await p2.goto('http://localhost:5173/print-on-demand', { waitUntil: 'networkidle' })
await p2.waitForTimeout(1500); await dismiss(p2)
const pod = await p2.evaluate(() => {
  const darks = [...document.querySelectorAll('[data-theme="dark"]')].map(el => getComputedStyle(el).backgroundColor)
  const heroBg = getComputedStyle(document.querySelector('section[data-theme="dark"]')).backgroundColor
  return { heroBg, darkCount: darks.length }
})
console.log('POD darks:', JSON.stringify(pod))
writeFileSync('./scripts/navy-pod.png', await p2.screenshot())
await p2.close()

// 3) Fulfilment hero spot-check
const p3 = await ctx.newPage()
await p3.goto('http://localhost:5173/fulfilment', { waitUntil: 'networkidle' })
await p3.waitForTimeout(1500); await dismiss(p3)
const ff = await p3.evaluate(() => {
  const el = document.querySelector('section[data-theme="dark"]')
  return { heroBg: el ? getComputedStyle(el).backgroundColor : null }
})
console.log('FULFIL hero:', JSON.stringify(ff))
writeFileSync('./scripts/navy-fulfil.png', await p3.screenshot())
await p3.close()

await browser.close()
console.log('done — #0e1b46 = rgb(14,27,70); #0f2444 = rgb(15,36,68)')
