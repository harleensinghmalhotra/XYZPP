import { chromium } from 'playwright'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } })

async function testClick(fromUrl) {
  const page = await ctx.newPage()
  await page.goto(fromUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  for (const label of ['Accept all', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
  await page.waitForTimeout(300)
  // click the WWP trigger label
  await page.getByRole('button', { name: /what we print/i }).first().click()
  await page.waitForTimeout(3000)
  const r = await page.evaluate(() => {
    const el = document.getElementById('what-we-print')
    const rect = el?.getBoundingClientRect()
    return {
      path: location.pathname,
      hash: location.hash,
      wwpExists: !!el,
      wwpTop: rect ? Math.round(rect.top) : null,
      wwpInView: rect ? (rect.top < window.innerHeight && rect.bottom > 0) : false,
    }
  })
  console.log(`click from ${fromUrl}:`, JSON.stringify(r))
  await page.close()
}

// keyboard model test from /about: focus trigger, ArrowDown opens+focuses item, Enter on item navigates to card
async function testKeyboard() {
  const page = await ctx.newPage()
  await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  for (const label of ['Accept all', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
  await page.waitForTimeout(300)
  const trigger = page.getByRole('button', { name: /what we print/i }).first()
  await trigger.focus()
  // ArrowDown → menu opens, first item focused
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(300)
  const afterDown = await page.evaluate(() => ({
    menuOpen: !!document.getElementById('wwp-dropdown'),
    focused: document.activeElement?.textContent?.trim()?.slice(0, 30),
    focusedIsMenuItem: document.activeElement?.getAttribute('role') === 'menuitem',
  }))
  console.log('after ArrowDown:', JSON.stringify(afterDown))
  // ArrowDown again → second item
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)
  const afterDown2 = await page.evaluate(() => ({ focused: document.activeElement?.textContent?.trim()?.slice(0, 30) }))
  console.log('after ArrowDown x2:', JSON.stringify(afterDown2))
  // Enter on focused item → navigates to card hash
  await page.keyboard.press('Enter')
  await page.waitForTimeout(900)
  const afterEnter = await page.evaluate(() => ({ path: location.pathname, hash: location.hash }))
  console.log('after Enter on item:', JSON.stringify(afterEnter))
  await page.close()

  // Enter directly on trigger (menu closed) → navigate to section
  const page2 = await ctx.newPage()
  await page2.goto('http://localhost:5173/infrastructure', { waitUntil: 'networkidle' })
  await page2.waitForTimeout(1000)
  for (const label of ['Accept all', 'Reject all']) {
    const b = page2.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
  await page2.waitForTimeout(300)
  await page2.getByRole('button', { name: /what we print/i }).first().focus()
  await page2.keyboard.press('Enter')
  await page2.waitForTimeout(900)
  const r = await page2.evaluate(() => ({ path: location.pathname, hash: location.hash }))
  console.log('Enter on trigger from /infrastructure:', JSON.stringify(r))
  await page2.close()
}

await testClick('http://localhost:5173/about')
await testClick('http://localhost:5173/infrastructure')
await testKeyboard()
await browser.close()
console.log('done')
