import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'C:/Users/Harleen/AppData/Local/Temp/claude/d--WEBSITES-Website-University/9a06dad6-c7ad-415f-bd7e-0b8bf9c0e4db/scratchpad'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5210'
const VP = { width: 1536, height: 743 }
const browser = await chromium.launch()

async function dismiss(page) {
  for (const l of ['Accept all', 'Reject all', 'Accept']) {
    const b = page.getByRole('button', { name: new RegExp(`^${l}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
}
const disabledOf = (page, sel) => page.locator(sel).evaluate((el) => el.disabled)

// ── CONTACT form ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await dismiss(page)
  const btn = '.ctc-form button[type="submit"]'
  await page.locator(btn).scrollIntoViewIfNeeded()
  await page.mouse.move(4, 4); await page.waitForTimeout(400)

  console.log('CONTACT disabled @ load =', await disabledOf(page, btn))
  await page.locator('.ctc-form').screenshot({ path: `${OUT}/gate-contact-disabled.png` })

  await page.check('#f-consent')
  await page.waitForTimeout(200)
  console.log('CONTACT disabled after check =', await disabledOf(page, btn))

  await page.uncheck('#f-consent')
  await page.waitForTimeout(200)
  console.log('CONTACT disabled after uncheck =', await disabledOf(page, btn))

  // fill valid EXCEPT phone, then check consent, submit -> phone error blocks
  await page.fill('#f-first', 'Harleen')
  await page.fill('#f-last', 'Test')
  await page.fill('#f-email', 'harleensinghmalhotra@gmail.com')
  await page.selectOption('#f-country', 'India')
  await page.selectOption('#f-enquiry', 'quote')
  await page.fill('#f-message', 'Consent-gate + phone-required verification.')
  await page.check('#f-consent')
  await page.waitForTimeout(200)
  console.log('CONTACT enabled with empty phone =', !(await disabledOf(page, btn)))
  await page.locator('.ctc-form').screenshot({ path: `${OUT}/gate-contact-enabled.png` })
  await page.click(btn)
  await page.waitForTimeout(400)
  const phoneErr = await page.locator('#err-phone').count()
  console.log('CONTACT phone error shown =', phoneErr > 0, '| success reached =', (await page.locator('.ctc-success').count()) > 0)
  await page.locator('#f-phone').scrollIntoViewIfNeeded()
  await page.locator('.ctc-form').screenshot({ path: `${OUT}/gate-contact-phone-error.png` })

  // now valid phone -> error clears
  await page.fill('#f-phone', '+91 82919 99922')
  await page.waitForTimeout(150)
  console.log('CONTACT phone error after valid input =', (await page.locator('#err-phone').count()) > 0)
  await ctx.close()
}

// ── POD request form ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/print-on-demand`, { waitUntil: 'networkidle' })
  await dismiss(page)
  await page.getByRole('button', { name: /Request This Book/i }).first().click()
  await page.waitForSelector('.pod-req')
  const btn = '.pod-req button[type="submit"]'
  await page.mouse.move(4, 4); await page.waitForTimeout(300)

  console.log('POD disabled @ open =', await disabledOf(page, btn))
  await page.locator('.pod-summary').screenshot({ path: `${OUT}/gate-pod-disabled.png` })

  await page.check('#pod-req-consent'); await page.waitForTimeout(150)
  console.log('POD disabled after check =', await disabledOf(page, btn))
  await page.uncheck('#pod-req-consent'); await page.waitForTimeout(150)
  console.log('POD disabled after uncheck =', await disabledOf(page, btn))

  // fill name+email, leave phone empty, check consent, submit -> phone error
  await page.fill('#pod-req-name', 'Harleen Test')
  await page.fill('#pod-req-email', 'harleensinghmalhotra@gmail.com')
  await page.check('#pod-req-consent'); await page.waitForTimeout(150)
  console.log('POD enabled with empty phone =', !(await disabledOf(page, btn)))
  await page.locator('.pod-summary').screenshot({ path: `${OUT}/gate-pod-enabled.png` })
  await page.click(btn); await page.waitForTimeout(300)
  console.log('POD phone error shown =', (await page.locator('#pod-req-phone-e').count()) > 0)
  await page.locator('.pod-summary').screenshot({ path: `${OUT}/gate-pod-phone-error.png` })
  await ctx.close()
}

// ── FR toggle sanity — labels + gate still work ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await dismiss(page)
  await page.getByRole('button', { name: /^FR$/ }).first().click().catch(() => {})
  await page.waitForTimeout(600)
  const btn = '.ctc-form button[type="submit"]'
  await page.locator(btn).scrollIntoViewIfNeeded(); await page.mouse.move(4, 4); await page.waitForTimeout(300)
  console.log('FR disabled @ load =', await disabledOf(page, btn))
  await page.check('#f-consent'); await page.waitForTimeout(150)
  console.log('FR disabled after check =', await disabledOf(page, btn))
  await page.locator('.ctc-form').screenshot({ path: `${OUT}/gate-contact-fr.png` })
  await ctx.close()
}

await browser.close()
console.log('done')
