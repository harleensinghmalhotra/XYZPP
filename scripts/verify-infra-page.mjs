import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = (process.env.URL || 'http://localhost:5173') + '/infrastructure'
const out = resolve(root, 'shots', 'page-infrastructure')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.addInitScript(() => {
  window.__cls = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value })
    .observe({ type: 'layout-shift', buffered: true })
})
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(500)

const H = await page.evaluate(() => document.body.scrollHeight)
console.log('PAGE HEIGHT:', H)

// walk down to fire every reveal
for (let y = 0; y < H; y += Math.round(743 * 0.6)) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await page.waitForTimeout(240)
}
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(700)

// per-section shots
const sections = ['.inf-hero', '.inf-strip', '.inf-acc', '.inf-mach-sec', '.inf-results', '.inf-recognition', '.inf-gallery', '.inf-cta']
for (const sel of sections) {
  const el = await page.$(sel)
  if (!el) { console.log('  MISSING section', sel); continue }
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await el.screenshot({ path: resolve(out, 'sec-' + sel.replace(/[^a-z]/gi, '') + '.png') })
}
// full page
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await page.screenshot({ path: resolve(out, 'full.png'), fullPage: true })
console.log('  ✓ screenshots written')

// FSC licence code present near the FSC mark
const fsc = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.inf-strip-item')]
  const fscItem = items.find((it) => /FSC/i.test(it.textContent))
  return { found: !!fscItem, hasCode: fscItem ? /TUVDC-COC-101258/.test(fscItem.textContent) : false }
})
console.log(`FSC MARK: ${fsc.found ? 'present' : 'MISSING'} · licence code TUVDC-COC-101258: ${fsc.hasCode ? 'PRESENT ✓' : 'MISSING ✗'}`)

// exactly one h1
const h1 = await page.evaluate(() => [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()))
console.log(`H1 COUNT: ${h1.length} ${h1.length === 1 ? '✓' : '✗'} — ${JSON.stringify(h1)}`)

// 11px floor across every text node in the page
const tiny = await page.evaluate(() => {
  const bad = []
  document.querySelectorAll('main .inf-wrap *, main [class*="inf-"]').forEach((el) => {
    if (!el.textContent || !el.textContent.trim()) return
    if (el.children.length && ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return
    const px = parseFloat(getComputedStyle(el).fontSize)
    if (px && px < 11) bad.push(`${el.className || el.tagName} = ${px}px`)
  })
  return [...new Set(bad)]
})
console.log(`≥11px FLOOR: ${tiny.length === 0 ? 'PASS ✓' : 'FAIL ✗ ' + JSON.stringify(tiny)}`)

// uniform card heights — machines (per size), awards, gallery
const heights = await page.evaluate(() => {
  const grab = (sel) => [...document.querySelectorAll(sel)].map((e) => Math.round(e.getBoundingClientRect().height))
  return {
    machinesLarge: grab('.inf-machine--large'),
    machinesSmall: grab('.inf-machine--small'),
    awards: grab('.inf-award'),
    gallery: grab('.inf-gallery-photo'),
  }
})
const uniform = (arr) => arr.length && arr.every((h) => Math.abs(h - arr[0]) <= 1)
console.log('UNIFORM HEIGHTS:',
  'large', heights.machinesLarge, uniform(heights.machinesLarge) ? '✓' : '✗',
  '| small', heights.machinesSmall, uniform(heights.machinesSmall) ? '✓' : '✗',
  '| awards', heights.awards, uniform(heights.awards) ? '✓' : '✗',
  '| gallery', heights.gallery, uniform(heights.gallery) ? '✓' : '✗')

// video dialog open/Esc
await page.$eval('.inf-video-thumb', (b) => b.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(400)
await page.click('.inf-video-thumb')
await page.waitForTimeout(400)
const dlg = await page.$('.inf-dialog')
await page.screenshot({ path: resolve(out, 'video-dialog.png') })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
const closed = !(await page.$('.inf-dialog'))
console.log(`VIDEO DIALOG: open ${dlg ? '✓' : '✗'} · Esc closes ${closed ? '✓' : '✗'}`)

// accordion switches image + panel
const accBefore = await page.evaluate(() => document.querySelector('.inf-acc-photo .inf-photo-img')?.style.backgroundImage || '')
await page.click('.inf-acc-row:nth-child(3) .inf-acc-head')
await page.waitForTimeout(300)
const accAfter = await page.evaluate(() => document.querySelector('.inf-acc-photo .inf-photo-img')?.style.backgroundImage || '')
console.log(`ACCORDION swap image: ${accBefore !== accAfter ? '✓' : '✗'} (${accBefore} → ${accAfter})`)

// axe
const axe = await new AxeBuilder({ page }).include('main').analyze()
console.log('axe violations:', axe.violations.length)
for (const v of axe.violations) { console.log(` [${v.impact}] ${v.id}: ${v.help}`); for (const n of v.nodes.slice(0, 4)) console.log('     ', n.target.join(' ')) }
const cc = axe.violations.find((v) => v.id === 'color-contrast')
console.log('color-contrast violations:', cc ? cc.nodes.length : 0)
console.log('CLS:', await page.evaluate(() => +window.__cls.toFixed(5)))
console.log('CONSOLE ERRORS:', errors.length ? errors : 'none')

// reduced motion pass
const rc = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await rp.waitForTimeout(700)
const rm = await rp.evaluate(() => {
  const t = document.querySelector('.inf-hero-title')
  const s = document.querySelector('.inf-machine')
  return { title: getComputedStyle(t).opacity, card: getComputedStyle(s).opacity }
})
console.log(`REDUCED-MOTION: hero title opacity ${rm.title}, first card opacity ${rm.card} (want 1/1 static)`)
await rc.close()

await browser.close()
console.log('DONE.')
