import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const BASE = process.env.NR_BASE || 'http://localhost:5175'
const OUT = resolve('./scripts')
const browser = await chromium.launch()

async function shot(page, name, full = false) {
  const buf = await page.screenshot({ fullPage: full })
  writeFileSync(`${OUT}/verify-newsroom-${name}.png`, buf)
  console.log(`✓ ${name}`)
}

// Scroll the whole page so every [data-reveal] element fires before a full capture.
async function revealAll(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(400)
}

// ── Desktop 1536×743 ──
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(`${BASE}/newsroom`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await shot(page, 'index-top')
await revealAll(page)
await shot(page, 'index-full', true)

// image load check
const imgOk = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('.nr-card-media img')]
  return { total: imgs.length, loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length }
})
console.log('index card images:', JSON.stringify(imgOk))

// ── Click-through: card → article ──
await page.locator('.nr-card-link').first().click()
await page.waitForURL(/\/newsroom\/.+/)
await page.waitForTimeout(1200)
console.log('article URL:', page.url())
await shot(page, 'article-top')
await revealAll(page)
await shot(page, 'article-full', true)

// video block present?
const hasVideo = await page.evaluate(() => document.querySelectorAll('.nra-figure--video video').length)

// ── Navigate to an article that HAS the video block (third-fulfilment-centre) ──
await page.goto(`${BASE}/newsroom/third-fulfilment-centre-opens`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const videoOnFacility = await page.evaluate(() => {
  const v = document.querySelector('.nra-figure--video video')
  return v ? { present: true, src: v.querySelector('source')?.src, poster: v.poster } : { present: false }
})
console.log('video block (facility post):', JSON.stringify(videoOnFacility))
await revealAll(page)
await shot(page, 'article-video-full', true)

// ── Related → click first related, then Back ──
const relFirst = await page.locator('.nra-rel-link').first()
const relHref = await relFirst.getAttribute('href')
await relFirst.click()
await page.waitForURL(/\/newsroom\/.+/)
await page.waitForTimeout(800)
console.log('related click →', page.url(), '(expected', relHref, ')')
await page.locator('.nra-back').click()
await page.waitForURL(/\/newsroom$/)
await page.waitForTimeout(600)
console.log('back link → ', page.url())
await ctx.close()

// ── Mobile 375 ──
const mctx = await browser.newContext({ viewport: { width: 375, height: 780 } })
const mpage = await mctx.newPage()
await mpage.goto(`${BASE}/newsroom`, { waitUntil: 'networkidle' })
await mpage.waitForTimeout(1000)
await revealAll(mpage)
await shot(mpage, 'mobile-index', true)
await mpage.goto(`${BASE}/newsroom/printweek-book-education-company-of-the-year`, { waitUntil: 'networkidle' })
await mpage.waitForTimeout(1000)
await revealAll(mpage)
await shot(mpage, 'mobile-article', true)
await mctx.close()

await browser.close()
console.log('\nconsole errors:', errors.length ? errors : 'none')
console.log('video branch rendered on first article:', hasVideo, '| facility video:', videoOnFacility.present)
