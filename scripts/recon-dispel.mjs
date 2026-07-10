import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'recon', 'dispel')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
await page.goto('https://dispel.com/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(3500)

// dismiss any cookie banner
for (const t of ['Accept', 'Accept all', 'Got it', 'I agree', 'Allow all']) {
  const b = page.getByRole('button', { name: new RegExp(t, 'i') })
  if (await b.count()) { try { await b.first().click({ timeout: 1500 }); break } catch {} }
}
await page.waitForTimeout(600)

// Walk the page, screenshot every ~0.85 viewport as a "section" strip
const total = await page.evaluate(() => document.body.scrollHeight)
const step = Math.round(743 * 0.85)
let i = 0
for (let y = 0; y < total; y += step) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await page.waitForTimeout(650)
  await page.screenshot({ path: resolve(out, `strip-${String(i).padStart(2, '0')}.png`) })
  i++
  if (i > 24) break
}

// full-page
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(out, 'full.png'), fullPage: true })

// structural outline of the DOM (section tags, headings)
const outline = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('section, header, footer, h1, h2, h3').forEach((el) => {
    const tag = el.tagName.toLowerCase()
    if (/h[123]/.test(tag)) out.push(`${tag}: ${el.textContent.trim().slice(0, 90)}`)
    else out.push(`<${tag}> ${(el.className || '').toString().slice(0, 60)}`)
  })
  return out.slice(0, 120)
})
console.log('PAGE HEIGHT:', total, 'strips:', i)
console.log('OUTLINE:\n' + outline.join('\n'))

await browser.close()
console.log('DONE. shots in recon/dispel/')
