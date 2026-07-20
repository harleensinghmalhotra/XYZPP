import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

async function run(browser, { name, url, vp, reduced = false, lang = 'en' }) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  // dismiss cookie bar if present so it doesn't cover the scroll cue
  for (const label of ['Accept all', 'Reject all', 'Accept']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(400); break }
  }
  await page.waitForTimeout(400)

  // language spot-check — switch via the nav toggle (no /fr/ route; i18n only)
  if (lang !== 'en') {
    const btn = page.getByRole('button', { name: new RegExp(`^${lang}$`, 'i') }).first()
    if (await btn.count()) { await btn.click().catch(() => {}) }
    else { await page.getByText(lang.toUpperCase(), { exact: true }).first().click().catch(() => {}) }
    await page.waitForTimeout(900)
  }

  // audit
  const audit = await page.evaluate(() => {
    const h1s = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim())
    const disp = document.querySelector('.ab-hero-display')
    const heroH = document.querySelector('.ab-hero')?.getBoundingClientRect()
    return {
      h1count: h1s.length,
      h1: h1s,
      displayText: disp?.textContent.trim(),
      displayWidthPct: disp ? +(disp.getBoundingClientRect().width / window.innerWidth * 100).toFixed(1) : null,
      heroHeight: heroH ? Math.round(heroH.height) : null,
      viewportH: window.innerHeight,
    }
  })
  console.log(`[${name}]`, JSON.stringify(audit))

  // hero screenshot (top of page)
  writeFileSync(`./scripts/${name}-hero.png`, await page.screenshot())
  // statement chapter
  await page.evaluate(() => document.querySelector('.ab-statement')?.scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(700)
  writeFileSync(`./scripts/${name}-statement.png`, await page.screenshot())
  // full page
  writeFileSync(`./scripts/${name}-full.png`, await page.screenshot({ fullPage: true }))

  await ctx.close()
}

const browser = await chromium.launch()
await run(browser, { name: 'about-v5-desktop', url: 'http://localhost:5173/about', vp: { width: 1536, height: 743 } })
await run(browser, { name: 'about-v5-mobile', url: 'http://localhost:5173/about', vp: { width: 375, height: 812 } })
await run(browser, { name: 'about-v5-fr', url: 'http://localhost:5173/about', vp: { width: 1536, height: 743 }, lang: 'fr' })
await run(browser, { name: 'about-v5-reduced', url: 'http://localhost:5173/about', vp: { width: 1536, height: 743 }, reduced: true })
await browser.close()
console.log('done')
