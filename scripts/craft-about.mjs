// CRAFT — About page detail-pass capture harness.
// Per-section screenshots at 1536×743, plus full page, mobile, FR, reduced-motion.
// Usage: node scripts/craft-about.mjs [tag]   (tag defaults to 'now')
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'

const TAG = process.argv[2] || 'now'
const OUT = `./scripts/craft/${TAG}`
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5173/about'

const SECTIONS = ['.ab-hero', '.tl', '.mvv', '.fnd', '.ab-marquee', '.tm', '.aw', '.certs']

async function settle(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  for (const label of ['Accept all', 'Accept', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(300); break }
  }
}

async function shootSections(page, prefix) {
  for (const sel of SECTIONS) {
    const el = page.locator(sel).first()
    if (!(await el.count())) continue
    await el.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(700)
    const name = sel.replace(/[.#]/g, '')
    await page.screenshot({ path: `${OUT}/${prefix}-${name}.png` })
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${prefix}-top.png` })
  await page.screenshot({ path: `${OUT}/${prefix}-full.png`, fullPage: true })
}

async function audit(page) {
  return page.evaluate(() => {
    const h1s = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim())
    const heroH = document.querySelector('.ab-hero')?.getBoundingClientRect()
    return {
      h1count: h1s.length, h1: h1s,
      heroHeight: heroH ? Math.round(heroH.height) : null,
      heroVh: heroH ? +(heroH.height / window.innerHeight * 100).toFixed(1) : null,
      viewportH: window.innerHeight,
    }
  })
}

const browser = await chromium.launch()

// desktop
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await settle(page)
  console.log('[desktop]', JSON.stringify(await audit(page)))
  await shootSections(page, 'd')
  await ctx.close()
}
// mobile 375
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await settle(page)
  await shootSections(page, 'm')
  await ctx.close()
}
// FR
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await settle(page)
  const btn = page.getByRole('button', { name: /^fr$/i }).first()
  if (await btn.count()) { await btn.click().catch(() => {}) }
  else { await page.getByText('FR', { exact: true }).first().click().catch(() => {}) }
  await page.waitForTimeout(900)
  console.log('[fr]', JSON.stringify(await audit(page)))
  await shootSections(page, 'fr')
  await ctx.close()
}
// reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await settle(page)
  await shootSections(page, 'rm')
  await ctx.close()
}

await browser.close()
console.log('done →', OUT)
