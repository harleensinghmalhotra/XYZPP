import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const browser = await chromium.launch({ headless: true })
for (const lang of ['en', 'fr', 'es']) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } })
  await ctx.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l) } catch {} }, lang)
  const page = await ctx.newPage()
  await page.goto(BASE + '/infrastructure', { waitUntil: 'load' })
  await page.waitForTimeout(1000)
  await page.locator('.ib-stage').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  // open the 5th book (Corporate Headquarters) — spine label index 4
  await page.locator('.ib-imglabel').nth(4).click()
  await page.waitForTimeout(800)
  const data = await page.evaluate(() => ({
    title: document.querySelector('.ib-facpage-title')?.textContent?.trim(),
    intro: document.querySelector('.ib-facpage-intro')?.textContent?.trim()?.slice(0, 60),
    points: Array.from(document.querySelectorAll('.ib-fpoint')).map(p => ({
      t: p.querySelector('.ib-fpoint-title')?.textContent?.trim(),
      d: p.querySelector('.ib-fpoint-desc')?.textContent?.trim(),
    })),
  }))
  console.log('=== ' + lang + ' ===')
  console.log('title:', data.title, '| intro:', data.intro + '...')
  data.points.forEach((p, i) => console.log(`  ${i + 1}. ${p.t} :: ${p.d}`))
  await ctx.close()
}
await browser.close()
console.log('DONE')
