import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })

async function open(url) {
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600)
  for (const label of ['Accept all', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
  await page.waitForTimeout(300)
  return page
}

async function shotSection(page, selector, name) {
  const el = page.locator(selector).first()
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(900)
  writeFileSync(`./scripts/${name}.png`, await el.screenshot())
}

// 1) HOME — team section absent + awards unchanged
const home = await open('http://localhost:5173/')
const homeAudit = await home.evaluate(() => ({
  peopleSection: !!document.querySelector('.infra-people'),
  personCards: document.querySelectorAll('.infra-person').length,
  awBg: getComputedStyle(document.querySelector('.aw')).backgroundColor,
  awHasArrows: !!document.querySelector('.aw .aw-arrows'),
  awHasMore: !!document.querySelector('.aw .aw-more'),
  awCards: document.querySelectorAll('.aw .plq').length,
}))
console.log('HOME', JSON.stringify(homeAudit))
await shotSection(home, '.aw', 'infra-fix-home-awards')
await home.close()

// 2) INFRASTRUCTURE — awards conformed
const infra = await open('http://localhost:5173/infrastructure')
const infraAudit = await infra.evaluate(() => {
  const rec = document.querySelector('.inf-recognition')
  return {
    recBg: getComputedStyle(rec).backgroundColor,
    hasHeadText: !!rec.querySelector('.aw-head-text'),
    hasArrows: !!rec.querySelector('.aw-arrows'),
    hasViewport: !!rec.querySelector('.aw-viewport'),
    hasMore: !!rec.querySelector('.aw-more'),
    cards: rec.querySelectorAll('.plq').length,
    h1Count: document.querySelectorAll('h1').length,
    resultsBg: getComputedStyle(document.querySelector('.inf-results')).backgroundColor,
  }
})
console.log('INFRA', JSON.stringify(infraAudit))
await shotSection(infra, '.inf-recognition', 'infra-fix-infra-awards')
await infra.close()

await browser.close()
console.log('done')
