import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'C:/Users/Harleen/AppData/Local/Temp/claude/d--WEBSITES-Website-University/9a06dad6-c7ad-415f-bd7e-0b8bf9c0e4db/scratchpad'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5210'
const VP = { width: 1536, height: 743 }

const browser = await chromium.launch()

async function dismissCookies(page) {
  for (const label of ['Accept all', 'Reject all', 'Accept']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
}

async function shot(page, name, sel, settle = 1000) {
  await page.mouse.move(4, 4)
  if (sel) {
    const el = page.locator(sel).first()
    await el.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(settle)
    await el.screenshot({ path: `${OUT}/${name}.png` }).catch(async () => {
      await page.screenshot({ path: `${OUT}/${name}.png` })
    })
  } else {
    await page.screenshot({ path: `${OUT}/${name}.png` })
  }
  console.log('  shot:', name)
}

async function fillContact(page) {
  await page.fill('#f-first', 'Harleen')
  await page.fill('#f-last', 'Test')
  await page.fill('#f-email', 'harleensinghmalhotra@gmail.com')
  await page.fill('#f-phone', '+91 82919 99922')
  await page.fill('#f-company', 'QFP Website QA')
  await page.selectOption('#f-country', 'India')
  await page.selectOption('#f-enquiry', 'quote')
  await page.fill('#f-message', 'Automated verification submit — please ignore. Contact desk + Web3Forms wiring test.')
  await page.check('#f-consent')
}

// ── 1. DESK panel + idle form (desktop) ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await dismissCookies(page)
  await page.waitForTimeout(400)
  await shot(page, 'desk', '.ctc-desk', 2000)
  await shot(page, 'form-idle', '.ctc-form')
  await ctx.close()
}

// ── 2. SUBMITTING state (mock a slow endpoint so the spinner is on screen) ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.route('**/api.web3forms.com/**', async (route) => {
    await new Promise((r) => setTimeout(r, 2500))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  })
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await dismissCookies(page)
  await page.locator('.ctc-form').scrollIntoViewIfNeeded()
  await fillContact(page)
  await page.click('.ctc-form button[type="submit"]')
  await page.waitForTimeout(500)
  await shot(page, 'form-submitting', '.ctc-form')
  await page.waitForSelector('.ctc-success', { timeout: 6000 })
  await ctx.close()
}

// ── 3. ERROR state (mock a rejected request; data must be preserved) ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.route('**/api.web3forms.com/**', (route) => route.abort())
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await dismissCookies(page)
  await page.locator('.ctc-form').scrollIntoViewIfNeeded()
  await fillContact(page)
  await page.click('.ctc-form button[type="submit"]')
  await page.waitForSelector('.ctc-formerr', { timeout: 6000 })
  const preserved = await page.inputValue('#f-message')
  console.log('  error: data preserved =', preserved.length > 0)
  await shot(page, 'form-error', '.ctc-form')
  await ctx.close()
}

// ── 4a. REAL submit attempt (1 of 250/month). Sandbox Chromium has no outbound
// egress, so this is expected to hit the error path here; live delivery needs a
// real browser test. Node/curl reaches the endpoint (returns 403 for server-side). ──
let realSuccess = false
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await dismissCookies(page)
  await page.locator('.ctc-form').scrollIntoViewIfNeeded()
  await fillContact(page)
  await page.click('.ctc-form button[type="submit"]')
  try {
    await page.waitForSelector('.ctc-success', { timeout: 20000 })
    realSuccess = true
  } catch { realSuccess = false }
  console.log('  REAL contact submit reached success =', realSuccess, '(false expected in sandbox)')
  await ctx.close()
}

// ── 4b. SUCCESS UI — mocked success so the confirmation state is captured ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.route('**/api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }))
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await dismissCookies(page)
  await page.locator('.ctc-form').scrollIntoViewIfNeeded()
  await fillContact(page)
  await page.click('.ctc-form button[type="submit"]')
  await page.waitForSelector('.ctc-success', { timeout: 6000 })
  await shot(page, 'form-success', '.ctc-success')
  await ctx.close()
}

// ── 5. POD request step + success (mock) ──
{
  const ctx = await browser.newContext({ viewport: VP })
  const page = await ctx.newPage()
  await page.route('**/api.web3forms.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }))
  await page.goto(`${BASE}/print-on-demand`, { waitUntil: 'networkidle' })
  await dismissCookies(page)
  await page.getByRole('button', { name: /Request This Book/i }).first().click()
  await page.waitForSelector('.pod-req', { timeout: 4000 })
  await shot(page, 'pod-step', '.pod-summary')
  await page.fill('#pod-req-name', 'Harleen Test')
  await page.fill('#pod-req-email', 'harleensinghmalhotra@gmail.com')
  await page.fill('#pod-req-notes', 'Verification only.')
  await page.click('.pod-req button[type="submit"]')
  await page.waitForSelector('.pod-req-done', { timeout: 6000 })
  await shot(page, 'pod-success', '.pod-summary')
  await ctx.close()
}

// ── 6. Mobile 375 — desk + form ──
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 780 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await dismissCookies(page)
  await shot(page, 'desk-375', '.ctc-desk')
  await ctx.close()
}

console.log('\nREAL_SUCCESS:', realSuccess)
await browser.close()
console.log('done')
