import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5182'
const out = resolve(root, 'shots', 'sustainability')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })

async function shoot(name, reduced) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 1120 }, deviceScaleFactor: 1.25, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(400)
  const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
  const geo = await page.evaluate(() => { const el = document.getElementById('sustainability'); return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight } })
  await to(Math.round(geo.top - geo.innerH * 0.35)); await page.waitForTimeout(350)
  await to(Math.round(geo.top - 20)); await page.waitForTimeout(1600)
  await page.evaluate(() => { const n = document.querySelector('header, nav'); if (n) n.style.visibility = 'hidden' })
  const sH = await page.evaluate(() => document.getElementById('sustainability').offsetHeight)

  // duotone-applied check
  const ok = await page.evaluate(() => {
    const img = document.querySelector('.svA-img')
    const chip = document.querySelector('.svA-chip')
    return { filter: img && getComputedStyle(img).filter, chip: !!chip && getComputedStyle(chip).visibility, h: img && img.getBoundingClientRect().height }
  })
  console.log(`[${name}] section=${sH}px  img.filter=${ok.filter}  chip=${ok.chip}  frameH≈${Math.round(ok.h)}`)
  await page.screenshot({ path: resolve(out, `${name}.png`), clip: { x: 0, y: 0, width: 1536, height: Math.min(1120, sH + 40) } })
  await ctx.close()
}

await shoot('FINAL', false)
await shoot('FINAL-reduced', true)
await browser.close()
console.log('DONE →', out)
