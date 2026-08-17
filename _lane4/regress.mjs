// Full configurator regression for one language.
// Usage: node _lane4/regress.mjs <lang> <submitMode: real|honeypot>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.env.PORT || '5184'
const [, , lang = 'en', submitMode = 'honeypot'] = process.argv
mkdirSync('_lane4', { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await context.newPage()
const consoleErrors = [], consoleWarnings = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
  else if (m.type() === 'warning') consoleWarnings.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
await page.addInitScript((lng) => { localStorage.setItem('qfp.consent', 'accepted'); localStorage.setItem('qfp.lang', lng) }, lang)
await page.goto(`http://localhost:${PORT}/print-on-demand`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts?.ready)
await page.waitForTimeout(500)
await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (getComputedStyle(el).position === 'fixed') el.style.visibility = 'hidden' })

const readSummary = () => page.$$eval('.pod-summary-row', rows => rows.map(r => ({
  key: r.querySelector('.pod-summary-key')?.textContent?.trim(),
  val: r.querySelector('.pod-summary-val')?.childNodes[1]?.textContent?.trim() || r.querySelector('.pod-summary-val')?.textContent?.trim(),
})))

const defaults = await readSummary()

// click EVERY option in EVERY step, verify summary updates + no throw
const groups = ['format', 'size', 'paper', 'binding', 'finish', 'quantity']
const rowIndex = { format: 0, size: 1, paper: 2, binding: 3, finish: 4, quantity: 5 }
const clickLog = []
for (const g of groups) {
  const radios = page.locator(`#step-${g}-sec button[role="radio"]`)
  const n = await radios.count()
  for (let i = 0; i < n; i++) {
    const r = radios.nth(i)
    await r.scrollIntoViewIfNeeded()
    const chip = (await r.innerText()).split('\n')[0].trim()
    const errBefore = consoleErrors.length
    await r.click()
    await page.waitForTimeout(120)
    const summary = await readSummary()
    clickLog.push({ group: g, i, chip, summaryVal: summary[rowIndex[g]]?.val, threw: consoleErrors.length > errBefore })
  }
}

// three visibly-different configs -> preview screenshots (by INDEX, language-independent)
async function setConfig(cfg) {
  for (const [g, idx] of Object.entries(cfg)) {
    await page.locator(`#step-${g}-sec button[role="radio"]`).nth(idx).click()
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(600)
  await page.mouse.move(1, 1)
}
const configs = {
  A: { format: 0, size: 0, paper: 3, binding: 0, finish: 0, quantity: 0 }, // Paperback · A5 · Cream80 · Perfect · Matte · 1
  B: { format: 1, size: 2, paper: 0, binding: 1, finish: 1, quantity: 4 }, // Hardcover · A4 · White70 · Sewn · Gloss · 500+
  C: { format: 0, size: 1, paper: 5, binding: 2, finish: 0, quantity: 2 }, // Paperback · B5 · GlossArt100 · Saddle · Matte · 50
}
const cfgSummaries = {}
for (const [name, cfg] of Object.entries(configs)) {
  await setConfig(cfg)
  await page.locator('.pod-preview').first().screenshot({ path: `_lane4/r-${lang}-cfg${name}.png` })
  cfgSummaries[name] = await readSummary()
}

// request form flow
await page.locator('button', { hasText: /Request This Book|Demander ce livre|Solicitar este libro/ }).first().click()
await page.waitForTimeout(300)
await page.fill('#pod-req-name', 'Lane 4 QA Test')
await page.fill('#pod-req-email', 'lane4-test@example.com')
await page.fill('#pod-req-phone', '+44 20 7946 0000')
await page.fill('#pod-req-notes', `Automated Lane 4 QA (${lang}) — please ignore.`)
if (submitMode === 'honeypot') {
  await page.evaluate(() => { const hp = document.querySelector('input[name="botcheck"]'); if (hp) hp.value = 'x' })
}
await page.check('#pod-req-consent')
await page.waitForTimeout(150)
await page.locator('form.pod-req button[type="submit"]').click()
// wait for success state
let success = false
try { await page.waitForSelector('.pod-req-done', { timeout: 12000 }); success = true } catch {}
await page.waitForTimeout(300)
await page.locator('.pod-summary').first().screenshot({ path: `_lane4/r-${lang}-submit.png` })

console.log(JSON.stringify({
  lang, submitMode,
  defaults,
  optionCounts: groups.reduce((a, g) => { a[g] = clickLog.filter(c => c.group === g).length; return a }, {}),
  anyThrewOnClick: clickLog.some(c => c.threw),
  clickLog,
  cfgSummaries,
  formSuccess: success,
  consoleErrors,
  consoleWarnings,
}, null, 2))
await browser.close()
