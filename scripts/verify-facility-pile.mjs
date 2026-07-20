import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const VP = { width: 1536, height: 743 }

async function shoot(context, url, name, { open = false, reduced = false } = {}) {
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const stage = page.locator('.ib-stage').first()
  await stage.scrollIntoViewIfNeeded()
  await page.waitForTimeout(700)

  if (open) {
    // open the FIRST facility book (a real .ib-spine button, not a filler)
    await page.locator('.ib-spine').first().click()
    await page.waitForTimeout(900)
  }

  // report counts so the verdict is grounded in the actual DOM
  const counts = await page.evaluate(() => ({
    spines: document.querySelectorAll('.ib-stack .ib-spine').length,
    fillers: document.querySelectorAll('.ib-stack .ib-filler').length,
    labels: [...document.querySelectorAll('.ib-stack .ib-spine .ib-spine-text')].map((n) => n.textContent.trim()),
  }))
  console.log(`${name}:`, JSON.stringify(counts))

  const shot = await stage.screenshot()
  writeFileSync(resolve(`./scripts/${name}.png`), shot)
  console.log(`  ✓ ${name}.png`)
  await page.close()
}

const browser = await chromium.launch()

// normal-motion context
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2 })
await shoot(ctx, 'http://localhost:5173/', 'verify-facility-pile-home-closed', {})
await shoot(ctx, 'http://localhost:5173/', 'verify-facility-pile-home-open', { open: true })
await shoot(ctx, 'http://localhost:5173/infrastructure', 'verify-facility-pile-infra-closed', {})
await shoot(ctx, 'http://localhost:5173/infrastructure', 'verify-facility-pile-infra-open', { open: true })
await ctx.close()

// reduced-motion context
const rctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2, reducedMotion: 'reduce' })
await shoot(rctx, 'http://localhost:5173/', 'verify-facility-pile-reduced', { open: true, reduced: true })
await rctx.close()

await browser.close()
console.log('done')
