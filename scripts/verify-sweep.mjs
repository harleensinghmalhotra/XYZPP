import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message.slice(0, 120)))
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(700)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const topOf = (id) => page.evaluate((i) => { const el = document.getElementById(i); return el ? el.getBoundingClientRect().top + window.scrollY : null }, id)
const shotEl = async (id, name, pad = 0) => {
  const el = await page.$('#' + id)
  if (!el) { console.log(`  ${name}: #${id} MISSING`); return }
  await to(Math.round((await topOf(id)) - 40)); await page.waitForTimeout(900)
  await page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = 'hidden' })
  await el.screenshot({ path: resolve(out, name) })
  await page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = '' })
  console.log('  ✓', name)
}

// ── PRIORITY: Awards broadway + Promise waves (mid-animation) ─────────────────
await to(Math.round((await topOf('promise')) - 20)); await page.waitForTimeout(1400) // let waves drift
await page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = 'hidden' })
await page.screenshot({ path: resolve(out, 'sweep-promise-waves.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } })
await page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = '' })
console.log('  ✓ sweep-promise-waves.png (mid-animation)')
await shotEl('awards', 'sweep-awards-broadway.png')

// ── other sweep shots ────────────────────────────────────────────────────────
await shotEl('services', 'sweep-wwp.png')
await shotEl('process', 'sweep-process.png')
await shotEl('marquee', 'sweep-strip.png')
await shotEl('cases', 'sweep-cases.png')
await shotEl('contact', 'sweep-footer.png')
// nav logo closeup (over a dark section)
await to(Math.round((await topOf('awards')) - 20)); await page.waitForTimeout(500)
await page.screenshot({ path: resolve(out, 'sweep-nav-logo.png'), clip: { x: 0, y: 0, width: 620, height: 150 } })
console.log('  ✓ sweep-nav-logo.png')

// ── deleted sections gone ────────────────────────────────────────────────────
const ids = await page.evaluate(() => [...document.querySelectorAll('section[id]')].map((s) => s.id))
const del = ['scope', 'path', 'proof'].filter((d) => ids.includes(d))
console.log(`\nDELETED sections gone: ${del.length ? 'STILL PRESENT ' + del : 'YES ✓'} (scope/path/proof)`)
console.log('console errors:', errors.length ? errors : 'NONE ✓')

// ── FPS on the wave canvas + awards ──────────────────────────────────────────
const fpsAt = async (id) => {
  await to(Math.round((await topOf(id)) - 20)); await page.waitForTimeout(400)
  return page.evaluate(() => new Promise((done) => {
    const d = []; let last = performance.now(); let raf
    const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
    raf = requestAnimationFrame(s)
    setTimeout(() => { cancelAnimationFrame(raf); const a = d.slice(3).sort((x, y) => x - y); const m = a.reduce((x, y) => x + y, 0) / a.length; done({ fps: +(1000 / m).toFixed(1), long: a.filter((x) => x > 18.5).length }) }, 2000)
  }))
}
console.log('\nFPS promise(waves):', JSON.stringify(await fpsAt('promise')))
console.log('FPS awards(lights):', JSON.stringify(await fpsAt('awards')))

// ── axe on the changed dark sections ─────────────────────────────────────────
for (const id of ['promise', 'awards', 'cases', 'marquee', 'contact']) {
  const axe = await new AxeBuilder({ page }).include('#' + id).analyze()
  const cc = axe.violations.find((v) => v.id === 'color-contrast')
  console.log(`axe #${id}: ${axe.violations.length} violations${cc ? ' (contrast FAIL)' : ''}`)
}

await browser.close()
console.log('\nDONE.')
