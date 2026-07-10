import { chromium } from 'playwright'
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
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(500)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header, nav, [class*="SiteNav"], [class*="site-nav"]'); if (n) { n.dataset._h = '1'; n.style.display = 'none' } })
const showNav = () => page.evaluate(() => { const n = document.querySelector('[data-_h]'); if (n) n.style.display = '' })

const geo = await page.evaluate(() => {
  const el = document.getElementById('sustainability')
  return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
})
const vhPct = (geo.h / geo.innerH * 100).toFixed(1)
console.log(`SECTION HEIGHT: ${geo.h}px = ${vhPct}vh → ${geo.h >= geo.innerH * 0.83 && geo.h <= geo.innerH * 0.92 ? 'IN ~85–90vh ✓' : geo.h >= geo.innerH * 0.74 ? '(near)' : 'OUT ✗'}`)

// scroll section in + settle so the entrance completes
await to(Math.round(geo.top - geo.innerH * 0.4))
await page.waitForTimeout(300)
await to(Math.round(geo.top - 20))
await page.waitForTimeout(1800)

// ── COLUMN GAP + composition metrics ─────────────────────────────────────────
const m = await page.evaluate(() => {
  const inner = document.querySelector('.sustain-inner').getBoundingClientRect()
  const panel = document.querySelector('.sustain-panel').getBoundingClientRect()
  const body = document.querySelector('.sustain-body').getBoundingClientRect()
  const sec = document.getElementById('sustainability').getBoundingClientRect()
  return {
    innerLeft: +inner.left.toFixed(1), innerRight: +inner.right.toFixed(1), innerWidth: +inner.width.toFixed(1),
    panelRight: +panel.right.toFixed(1), bodyLeft: +body.left.toFixed(1), bodyRight: +body.right.toFixed(1),
    gap: +(body.left - panel.right).toFixed(1),
    panelToContainerLeft: +(panel.left - inner.left).toFixed(1),
    bodyToContainerRight: +(inner.right - body.right).toFixed(1),
    padTop: +(document.querySelector('.sustain-inner').getBoundingClientRect().top - sec.top).toFixed(1),
    padBottom: +(sec.bottom - document.querySelector('.sustain-inner').getBoundingClientRect().bottom).toFixed(1),
  }
})
console.log('\nCOMPOSITION @1536:')
console.log(`   inner width           = ${m.innerWidth}px  (${m.innerLeft} → ${m.innerRight})`)
console.log(`   CENTRE GUTTER (gap)   = ${m.gap}px  ${m.gap >= 80 && m.gap <= 130 ? '✓ (80–120 target)' : ''}`)
console.log(`   panel → container L   = ${m.panelToContainerLeft}px (panel near left edge)`)
console.log(`   body  → container R   = ${m.bodyToContainerRight}px (text reaches right)`)
console.log(`   top air / bottom air  = ${m.padTop}px / ${m.padBottom}px`)

// ── FULL SECTION ──────────────────────────────────────────────────────────────
await page.setViewportSize({ width: 1536, height: 1120 })
await page.waitForTimeout(150)
const sTop = await page.evaluate(() => document.getElementById('sustainability').getBoundingClientRect().top + window.scrollY)
const sH = await page.evaluate(() => document.getElementById('sustainability').offsetHeight)
await to(Math.round(sTop - 20))
await page.waitForTimeout(350)
hideNav()
await page.screenshot({ path: resolve(out, 'sustain-v3.png'), clip: { x: 0, y: 0, width: 1536, height: Math.min(1120, sH + 40) } })
showNav()
await page.setViewportSize(VP.viewport)
console.log('\n  ✓ sustain-v3.png')

// ── JUNCTIONS above (strip) + below (BookFan) ─────────────────────────────────
const j = await page.evaluate(() => {
  const y = (id) => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY } }
  const m = y('marquee'), s = y('sustainability'), b = document.getElementById('bookfan') ? y('bookfan') : null
  return {
    stripBottom: +m.bottom.toFixed(1), sustainTop: +s.top.toFixed(1), aboveGap: +(s.top - m.bottom).toFixed(1),
    sustainBottom: +s.bottom.toFixed(1), belowTop: b ? +b.top.toFixed(1) : null, belowGap: b ? +(b.top - s.bottom).toFixed(1) : null,
  }
})
console.log('\nJUNCTIONS:')
console.log(`   strip → sustain : gap ${j.aboveGap}px ${Math.abs(j.aboveGap) < 2 ? '✓ (adjacent, breathes via padding)' : ''}`)
console.log(`   sustain → below : gap ${j.belowGap}px ${j.belowGap == null || Math.abs(j.belowGap) < 2 ? '✓' : ''}`)

await browser.close()
console.log('\nDONE.')
