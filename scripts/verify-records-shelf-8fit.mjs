import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5193'
const out = resolve(root, 'shots', 'records-shelf-8fit')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const VP = { width: 1536, height: 743 }
const consoleErrors = []
function wire(page) {
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
}
async function fresh({ lang, reduced } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25, ...(reduced ? { reducedMotion: 'reduce' } : {}) })
  const page = await ctx.newPage()
  wire(page)
  if (lang) await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(500)
  return { ctx, page }
}
async function center(page, settle = 1700) {
  await page.evaluate(() => { const g = document.querySelector('.proj-books').getBoundingClientRect(); const y = g.top + window.scrollY - (window.innerHeight - g.height) / 2; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y) })
  await page.waitForTimeout(settle)
}
async function clip(page, sel, pad = 12) {
  const b = await (await page.$(sel)).boundingBox()
  const x = Math.max(0, Math.round(b.x - pad)), y = Math.max(0, Math.round(b.y - pad))
  return { x, y, width: Math.min(VP.width - x, Math.round(b.width + pad * 2)), height: Math.min(VP.height - y, Math.round(b.height + pad * 2)) }
}

// ── 1. EN — all 8, no scroll + 11px floor audit ──────────────────────────────
{
  const { ctx, page } = await fresh()
  await center(page)
  await page.screenshot({ path: resolve(out, 'shelf-en.png'), clip: await clip(page, '.proj-books') })

  const info = await page.evaluate(() => {
    const rail = document.querySelector('.proj-books-rail'), scroll = document.querySelector('.proj-books-scroll')
    // clipping check: is any book's right edge past the scroll box right edge?
    const boxR = scroll.getBoundingClientRect().right
    const clipped = [...document.querySelectorAll('.proj-book')].filter((b) => b.getBoundingClientRect().right > boxR + 0.5).length
    // 11px floor audit — smallest rendered px per text kind
    const px = (el) => el ? parseFloat(getComputedStyle(el).fontSize) : null
    const stampPx = [...document.querySelectorAll('.proj-book-stamp-arc-text')].map((e) => px(e))
    return {
      books: document.querySelectorAll('.proj-book').length,
      railW: rail.scrollWidth, boxW: scroll.clientWidth,
      overflows: rail.scrollWidth > scroll.clientWidth + 1,
      clippedBooks: clipped,
      floor: {
        eyebrow: px(document.querySelector('.proj-books-eyebrow')),
        country: Math.min(...[...document.querySelectorAll('.proj-book-country')].map(px)),
        number: Math.min(...[...document.querySelectorAll('.proj-book-countn')].map(px)),
        line: Math.min(...[...document.querySelectorAll('.proj-book-line')].map(px)),
        banner: px(document.querySelector('.proj-book-banner')),
        stampText: Math.min(...stampPx),
        stampMark: px(document.querySelector('.proj-book-stamp-mark')),
      },
      figures: [...document.querySelectorAll('.proj-book-countn')].map((e) => e.textContent),
    }
  })
  console.log('  ✓ shelf-en.png')
  console.log(`    books:${info.books} | rail ${info.railW}px ≤ box ${info.boxW}px → ${info.overflows ? 'OVERFLOW ✗' : 'FITS ✓'} | clipped books:${info.clippedBooks} (want 0)`)
  console.log('    figures:', JSON.stringify(info.figures))
  console.log('    11px FLOOR AUDIT (computed px):', JSON.stringify(info.floor))
  const belowFloor = Object.entries(info.floor).filter(([, v]) => v != null && v < 11)
  console.log('    below 11px:', belowFloor.length ? JSON.stringify(belowFloor) : 'NONE ✓')

  const axe = await new AxeBuilder({ page }).include('.proj-books').analyze()
  console.log('  axe .proj-books — color-contrast violations:', axe.violations.filter((v) => v.id === 'color-contrast').length)
  await ctx.close()
}

// ── 2. FR — all 8, ZEE stamp per locale ──────────────────────────────────────
{
  const { ctx, page } = await fresh({ lang: 'fr' })
  await center(page)
  await page.screenshot({ path: resolve(out, 'shelf-fr.png'), clip: await clip(page, '.proj-books') })
  const fr = await page.evaluate(() => {
    const rail = document.querySelector('.proj-books-rail'), scroll = document.querySelector('.proj-books-scroll')
    const zee = [...document.querySelectorAll('.proj-book')].find((b) => /ZEE/i.test(b.querySelector('.proj-book-country')?.textContent || ''))
    return { books: document.querySelectorAll('.proj-book').length, overflows: rail.scrollWidth > scroll.clientWidth + 1, zeeStamp: zee?.querySelector('.proj-book-stamp-arc-text')?.textContent }
  })
  console.log(`  ✓ shelf-fr.png — books:${fr.books} overflow:${fr.overflows ? '✗' : 'FITS ✓'} | ZEE stamp:${JSON.stringify(fr.zeeStamp)}`)
  await ctx.close()
}

// ── 3. Hover pull on books 1, 5, 8 (idx 0,4,7) ───────────────────────────────
{
  const { ctx, page } = await fresh()
  await center(page)
  for (const idx of [0, 4, 7]) {
    await page.mouse.move(4, 4); await page.waitForTimeout(350)
    const b = (await page.$$('.proj-book'))[idx]
    const bb = await b.boundingBox()
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
    await page.waitForTimeout(500)
    const is3d = await page.evaluate((i) => getComputedStyle(document.querySelectorAll('.proj-book')[i].querySelector('.proj-book-inner')).transform.startsWith('matrix3d'), idx)
    await page.screenshot({ path: resolve(out, `hover-book-${idx + 1}.png`), clip: await clip(page, '.proj-books') })
    console.log(`  ✓ hover-book-${idx + 1}.png — pull 3d:${is3d ? '✓' : '✗'}`)
  }
  await page.mouse.move(4, 4)
  await ctx.close()
}

// ── 4. Milestone detail ──────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  await center(page)
  const m = await (await page.$('.proj-book.is-milestone')).boundingBox()
  await page.screenshot({ path: resolve(out, 'milestone-detail.png'), clip: { x: Math.max(0, Math.round(m.x - 20)), y: Math.max(0, Math.round(m.y - 28)), width: Math.round(m.width + 54), height: Math.round(m.height + 46) } })
  console.log('  ✓ milestone-detail.png')
  await ctx.close()
}

// ── 5. Reduced motion ────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ reduced: true })
  await center(page, 900)
  await page.screenshot({ path: resolve(out, 'reduced-motion.png'), clip: await clip(page, '.proj-books') })
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.proj-book-countn')).animationName)
  console.log('  ✓ reduced-motion.png — countn animation:', anim, '(want none)')
  await ctx.close()
}

console.log('\nCONSOLE ERRORS:', consoleErrors.length)
for (const e of consoleErrors.slice(0, 10)) console.log('   ⚠', e)
await browser.close()
console.log('DONE → shots/records-shelf-8fit/')
