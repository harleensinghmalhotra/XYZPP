import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
const browser = await chromium.launch()

async function shoot(name, { url, width, height = 743, reduced = false, openSpine = null }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  for (const l of ['Accept all', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${l}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
  await page.waitForTimeout(300)
  const stack = page.locator('.ib-imgstack').first()
  await stack.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  // audit: label positions vs image, and whether each label centre sits on navy (not cream)
  const audit = await page.evaluate(() => {
    const img = document.querySelector('.ib-imgstack-photo')
    const box = document.querySelector('.ib-imgstack').getBoundingClientRect()
    const labels = [...document.querySelectorAll('.ib-imglabel')].map((el) => {
      const r = el.getBoundingClientRect()
      return { text: el.querySelector('.ib-imglabel-text').textContent, cxPct: +(((r.left + r.width/2) - box.left)/box.width*100).toFixed(1), cyPct: +(((r.top + r.height/2) - box.top)/box.height*100).toFixed(1) }
    })
    return { imgLoaded: img && img.complete && img.naturalWidth > 0, box: { w: Math.round(box.width), h: Math.round(box.height) }, labels }
  })
  console.log(`[${name}]`, JSON.stringify(audit))

  if (openSpine != null) {
    await page.locator('.ib-imglabel').nth(openSpine).click()
    await page.waitForTimeout(900)
    const opened = await page.evaluate(() => {
      const active = document.querySelector('.ib-imglabel.is-active')?.querySelector('.ib-imglabel-text')?.textContent
      const openTitle = document.querySelector('.ib-title--cover')?.textContent
      return { active, openTitle }
    })
    console.log(`  opened spine ${openSpine}:`, JSON.stringify(opened))
  }

  writeFileSync(`./scripts/${name}.png`, await page.screenshot())
  // tight crop of the stack for close inspection
  const sb = await stack.boundingBox()
  writeFileSync(`./scripts/${name}-stack.png`, await page.screenshot({ clip: { x: Math.max(0, sb.x - 20), y: Math.max(0, sb.y - 20), width: sb.width + 40, height: sb.height + 40 } }))
  await ctx.close()
}

await shoot('flow-home-1536', { url: 'http://localhost:5173/', width: 1536 })
await shoot('flow-infra-1536', { url: 'http://localhost:5173/infrastructure', width: 1536, openSpine: 2 })
await shoot('flow-infra-1280', { url: 'http://localhost:5173/infrastructure', width: 1280 })
await shoot('flow-infra-reduced', { url: 'http://localhost:5173/infrastructure', width: 1536, reduced: true, openSpine: 2 })
await shoot('flow-mobile-375', { url: 'http://localhost:5173/infrastructure', width: 375, height: 812 })
await browser.close()
console.log('done')
