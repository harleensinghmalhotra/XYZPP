import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const SC = 'C:\\Users\\Harleen\\AppData\\Local\\Temp\\claude\\d--WEBSITES-Website-University\\8ebd6733-c21d-48c6-86fc-1050687fe924\\scratchpad'
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })

// ---- /founder -> 404 ----
{
  const page = await ctx.newPage()
  const errs = []
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
  const resp = await page.goto(BASE + '/founder', { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  const info = await page.evaluate(() => {
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim())
    const backToHome = !!document.querySelector('main#main a[href="/"], main#main a[href=""]')
    return { title: document.title, path: location.pathname, h1s, backToHome, bodyLen: document.body.innerText.length }
  })
  await page.screenshot({ path: `${SC}\\founder-404.png`, fullPage: false })
  console.log('FOUNDER path=' + info.path + ' h1=' + JSON.stringify(info.h1s) + ' backLink=' + info.backToHome + ' title=' + JSON.stringify(info.title))
  console.log('FOUNDER console errors: ' + (errs.length ? JSON.stringify(errs) : 'none'))
  await page.close()
}

// ---- /infrastructure YouTube ----
{
  const page = await ctx.newPage()
  const errs = []
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  await page.goto(BASE + '/infrastructure', { waitUntil: 'load' })
  await page.waitForTimeout(1000)
  for (const b of ['Decline', 'Accept']) { const x = page.locator(`button:has-text("${b}")`).first(); if (await x.count()) { try { await x.click({ timeout: 800 }) } catch {} break } }
  await page.locator('.yt-channel').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  const cards = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.yt-thumb-img'))
    return { count: document.querySelectorAll('.yt-card').length,
      thumbs: imgs.map(i => ({ w: i.naturalWidth, h: i.naturalHeight, src: i.currentSrc.split('/vi/')[1] || i.currentSrc })) }
  })
  await page.locator('.yt-channel').screenshot({ path: `${SC}\\yt-section.png` })
  console.log('YT cards=' + cards.count)
  cards.thumbs.forEach((t, i) => console.log('  thumb ' + (i + 1) + ': ' + t.w + 'x' + t.h + ' ' + t.src))
  // open the 3rd card and screenshot the player after it loads
  await page.locator('.yt-card').nth(2).click()
  await page.waitForTimeout(5000)
  await page.locator('.yt-lb-panel').screenshot({ path: `${SC}\\yt-3rd-player.png` })
  console.log('YT 3rd lightbox captured')
  console.log('YT console errors: ' + (errs.length ? JSON.stringify(errs.slice(0, 6)) : 'none'))
  await page.close()
}
await browser.close()
