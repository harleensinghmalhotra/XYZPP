import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5182'
const out = resolve(root, 'shots', 'sustainability')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 1120 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()

const variants = (process.env.ONLY ? process.env.ONLY.split(',') : ['a', 'b', 'c'])

for (const v of variants) {
  await page.goto(`${base}/?sv=${v}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(400)
  const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="site-nav"], [class*="SiteNav"]'); if (n) { n.dataset._h = '1'; n.style.visibility = 'hidden' } })
  const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)

  const geo = await page.evaluate(() => {
    const el = document.getElementById('sustainability')
    return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
  })
  // bring section in + settle so entrance + draws complete
  await to(Math.round(geo.top - geo.innerH * 0.35))
  await page.waitForTimeout(400)
  await to(Math.round(geo.top - 20))
  await page.waitForTimeout(1800)
  hideNav()

  const sH = await page.evaluate(() => document.getElementById('sustainability').offsetHeight)
  await page.screenshot({ path: resolve(out, `concept-${v}.png`), clip: { x: 0, y: 0, width: 1536, height: Math.min(1120, sH + 40) } })

  // tight crop of the left media alone
  const box = await page.evaluate(() => {
    const m = document.querySelector('.sustain-media').getBoundingClientRect()
    return { x: Math.max(0, m.left - 30), y: Math.max(0, m.top - 30), width: m.width + 60, height: m.height + 60 }
  })
  await page.screenshot({ path: resolve(out, `media-${v}.png`), clip: box })
  console.log(`✓ concept-${v}.png  +  media-${v}.png   (section ${sH}px)`)
}

await browser.close()
console.log('\nDONE →', out)
