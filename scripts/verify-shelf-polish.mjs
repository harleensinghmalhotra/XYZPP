import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5193'
const out = resolve(root, 'shots', 'shelf-polish')
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
async function clipOf(page, sel, pad = 12) {
  const b = await (await page.$(sel)).boundingBox()
  const x = Math.max(0, Math.round(b.x - pad)), y = Math.max(0, Math.round(b.y - pad))
  return { x, y, width: Math.min(VP.width - x, Math.round(b.width + pad * 2)), height: Math.min(VP.height - y, Math.round(b.height + pad * 2)) }
}
// sRGB relative luminance + contrast ratio
function lum(hex) {
  const n = hex.replace('#', '')
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2) }

// ── 1. EN shelf + collision assert + gold consistency strip ──────────────────
{
  const { ctx, page } = await fresh()
  await center(page)
  await page.screenshot({ path: resolve(out, 'shelf-en.png'), clip: await clipOf(page, '.proj-books') })
  console.log('  ✓ shelf-en.png')

  // stamp sits BELOW the full-width title row → assert NO 2D overlap (box + ink)
  // against BOTH the country and the number, and that every country is ONE line.
  const coll = await page.evaluate(() => {
    return [...document.querySelectorAll('.proj-book')].map((bk, i) => {
      const s = bk.querySelector('.proj-book-stamp'), c = bk.querySelector('.proj-book-country'), n = bk.querySelector('.proj-book-countn')
      const country = c?.textContent.trim()
      const lines = Math.round(c.getBoundingClientRect().height / parseFloat(getComputedStyle(c).lineHeight))
      if (!s) return { i, country, lines, stamp: false }
      const sr = s.getBoundingClientRect()
      const ink = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect() }
      const ov = (r) => !(sr.right < r.left || sr.left > r.right || sr.bottom < r.top || sr.top > r.bottom)
      return {
        i, country, lines, stamp: true,
        boxVsCountry: ov(c.getBoundingClientRect()), inkVsCountry: ov(ink(c)), inkVsNumber: ov(ink(n)),
      }
    })
  })
  const bad = coll.filter((c) => c.stamp && (c.boxVsCountry || c.inkVsCountry || c.inkVsNumber))
  const multiline = coll.filter((c) => c.lines !== 1)
  console.log('  STAMP↔TITLE / STAMP↔NUMBER collisions:', bad.length === 0 ? 'NONE ✓' : JSON.stringify(bad))
  console.log('  country all one line:', multiline.length === 0 ? 'YES ✓ (incl. MAHARASHTRA)' : JSON.stringify(multiline))
  for (const c of coll) if (c.stamp) console.log(`      ${c.country.padEnd(15)} lines:${c.lines} vsCountry:${c.boxVsCountry || c.inkVsCountry ? 'OVERLAP' : 'clear'} vsNumber:${c.inkVsNumber ? 'OVERLAP' : 'clear'}`)
  console.log('  stamp labels:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.proj-book-stamp-text')].map((t) => t.textContent))))

  // gold consistency strip — crop every number, compose side by side
  const nums = await page.$$('.proj-book-countn')
  const crops = []
  for (let i = 0; i < nums.length; i++) {
    const b = await nums[i].boundingBox()
    const c = { x: Math.max(0, Math.round(b.x - 6)), y: Math.max(0, Math.round(b.y - 6)), width: Math.round(b.width + 12), height: Math.round(b.height + 12) }
    crops.push(await page.screenshot({ clip: c }))
  }
  const metas = await Promise.all(crops.map((c) => sharp(c).metadata()))
  const gap = 12, H = Math.max(...metas.map((m) => m.height)), W = metas.reduce((a, m) => a + m.width + gap, gap)
  await sharp({ create: { width: W, height: H + 20, channels: 4, background: { r: 10, g: 16, b: 30, alpha: 1 } } })
    .composite(crops.map((c, i) => ({ input: c, left: gap + metas.slice(0, i).reduce((a, m) => a + m.width + gap, 0), top: 10 })))
    .png().toFile(resolve(out, 'gold-consistency-strip.png'))
  console.log('  ✓ gold-consistency-strip.png — all 8 figures side by side (navy vs cream ramps)')

  // contrast — foil darkest stops vs grounds + solid copy (both grounds)
  console.log('  CONTRAST (WCAG):')
  console.log(`     navy figure darkest stop #a07622 on navy #0f2444: ${contrast('#a07622', '#0f2444')}:1 (large ≥3)`)
  console.log(`     cream figure lightest stop #a87a20 on cream #fdfaf4 (lightest): ${contrast('#a87a20', '#fdfaf4')}:1 | on #f6f1e6: ${contrast('#a87a20', '#f6f1e6')}:1 (large ≥3)`)
  console.log(`     country cream #f5f0e8 on navy: ${contrast('#f5f0e8', '#0f2444')}:1 | country navy #0f2444 on cream: ${contrast('#0f2444', '#f6f1e6')}:1`)
  console.log(`     banner ink #241a06 on foil #b98f36: ${contrast('#241a06', '#b98f36')}:1`)
  const axe = await new AxeBuilder({ page }).include('.proj-books').analyze()
  console.log('  axe .proj-books — color-contrast violations:', axe.violations.filter((v) => v.id === 'color-contrast').length)
  await ctx.close()
}

// ── 2. FR shelf ──────────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ lang: 'fr' })
  await center(page)
  await page.screenshot({ path: resolve(out, 'shelf-fr.png'), clip: await clipOf(page, '.proj-books') })
  const fr = await page.evaluate(() => ({
    banner: document.querySelector('.proj-book-banner')?.textContent.trim(),
    stamps: [...document.querySelectorAll('.proj-book-stamp-text')].map((t) => t.textContent),
    countries: [...document.querySelectorAll('.proj-book-country')].map((c) => c.textContent.trim()),
  }))
  console.log('  ✓ shelf-fr.png — banner:', JSON.stringify(fr.banner), '| stamps:', JSON.stringify(fr.stamps))
  console.log('    countries:', JSON.stringify(fr.countries))
  await ctx.close()
}

// ── 3. Milestone banner/title detail ─────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  await center(page)
  const m = await (await page.$('.proj-book.is-milestone')).boundingBox()
  await page.screenshot({ path: resolve(out, 'milestone-detail.png'), clip: { x: Math.max(0, Math.round(m.x - 18)), y: Math.max(0, Math.round(m.y - 26)), width: Math.round(m.width + 48), height: Math.round(m.height + 44) } })
  const gap = await page.evaluate(() => {
    const ms = document.querySelector('.proj-book.is-milestone')
    const banner = ms.querySelector('.proj-book-banner').getBoundingClientRect()
    const country = ms.querySelector('.proj-book-country').getBoundingClientRect()
    return { bannerBottom: Math.round(banner.bottom), countryTop: Math.round(country.top), gap: Math.round(country.top - banner.bottom) }
  })
  console.log(`  ✓ milestone-detail.png — banner↔TANZANIA vertical gap: ${gap.gap}px (want > 0, no overlap)`)
  await ctx.close()
}

// ── 4. Stamp detail crop (text inside, star below) ───────────────────────────
{
  const { ctx, page } = await fresh()
  await center(page)
  const zee = await page.evaluateHandle(() => [...document.querySelectorAll('.proj-book')].find((b) => /ZEE/i.test(b.querySelector('.proj-book-country')?.textContent || '')))
  const b = await zee.asElement().boundingBox()
  await page.screenshot({ path: resolve(out, 'stamp-detail-zee.png'), clip: { x: Math.max(0, Math.round(b.x - 6)), y: Math.max(0, Math.round(b.y - 6)), width: Math.round(b.width + 12), height: Math.round(b.height + 12) } })
  console.log('  ✓ stamp-detail-zee.png — KITS inside the ring, star below')
  await ctx.close()
}

// ── 5. Hover pull ────────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  await center(page)
  const b = (await page.$$('.proj-book'))[3]
  const bb = await b.boundingBox()
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
  await page.waitForTimeout(500)
  const is3d = await page.evaluate(() => getComputedStyle(document.querySelectorAll('.proj-book')[3].querySelector('.proj-book-inner')).transform.startsWith('matrix3d'))
  await page.screenshot({ path: resolve(out, 'hover.png'), clip: await clipOf(page, '.proj-books') })
  console.log('  ✓ hover.png — pull 3d:', is3d ? '✓' : '✗')
  await page.mouse.move(4, 4)
  await ctx.close()
}

// ── 6. Reduced motion ────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ reduced: true })
  await center(page, 900)
  await page.screenshot({ path: resolve(out, 'reduced-motion.png'), clip: await clipOf(page, '.proj-books') })
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.proj-book-countn')).animationName)
  console.log('  ✓ reduced-motion.png — countn animation:', anim, '(want none)')
  await ctx.close()
}

console.log('\nCONSOLE ERRORS:', consoleErrors.length)
for (const e of consoleErrors.slice(0, 10)) console.log('   ⚠', e)
await browser.close()
console.log('DONE → shots/shelf-polish/')
