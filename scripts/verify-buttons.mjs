import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

async function cap(url, selector, name, { click } = {}) {
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  for (const label of ['Accept all', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
  await page.waitForTimeout(300)
  const el = page.locator(selector).first()
  if (await el.count() === 0) { console.log(`${name}: NOT FOUND (${selector})`); await page.close(); return }
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  // audit computed style of the u-btn
  const info = await el.evaluate((n) => {
    const cs = getComputedStyle(n)
    return { cls: n.className, radius: cs.borderRadius, padding: cs.padding, bg: cs.backgroundColor, color: cs.color, font: cs.fontFamily.split(',')[0], fw: cs.fontWeight, fs: cs.fontSize }
  })
  console.log(`${name}:`, JSON.stringify(info))
  // screenshot a region around the button
  const box = await el.boundingBox()
  const pad = 60
  writeFileSync(`./scripts/${name}.png`, await page.screenshot({ clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1440, box.width + pad * 2), height: box.height + pad * 2 } }))
  await page.close()
}

await cap('http://localhost:5173/founder', '.u-btn--solid', 'btn-founder-closing')
await cap('http://localhost:5173/infrastructure', '.inf-cta .u-btn--solid', 'btn-infra-cta')
await cap('http://localhost:5173/print-on-demand', '.pod-cta .u-btn--solid', 'btn-pod-final')
await cap('http://localhost:5173/print-on-demand', '.pod-summary .u-btn', 'btn-pod-request')
await cap('http://localhost:5173/fulfilment', '.ff-cta .u-btn--solid', 'btn-fulfil-closing')
await cap('http://localhost:5173/contact', 'button.u-btn--solid', 'btn-contact-submit')
await browser.close()
console.log('done')
