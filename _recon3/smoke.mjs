import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const browser = await chromium.launch({ headless: true })
for (const path of ['/', '/about', '/infrastructure']) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
  await page.goto(BASE + path, { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  const info = await page.evaluate(() => ({
    navLinks: Array.from(document.querySelectorAll('nav a, header a')).map(a => a.textContent.trim()).filter(Boolean).slice(0, 12),
    hasFounderNav: !!Array.from(document.querySelectorAll('a')).find(a => /^Founder$|Fondateur|Fundador/.test(a.textContent.trim())),
  }))
  const real = errs.filter(e => !/ytimg|maxresdefault|postMessage|www-embed|Failed to load resource/i.test(e))
  console.log(`${path} errs=${real.length} founderNav=${info.hasFounderNav} nav=${JSON.stringify(info.navLinks)}`)
}
await browser.close()
