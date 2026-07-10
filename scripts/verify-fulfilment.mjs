// VERIFY /fulfilment — 1536×743 DPR 1.25. Full-page + section shots, axe (incl.
// colour-contrast), console-error capture, permission-gate assert (no HDFC/ZEE in
// DOM), 11px font-floor scan, reduced-motion marquee check. Shots → shots/page-fulfilment/.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/page-fulfilment')
mkdirSync(out, { recursive: true })
const URL = 'http://localhost:5173/fulfilment'

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const ctx = await context.newPage()

const errors = []
ctx.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
ctx.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))

await ctx.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await ctx.waitForTimeout(1400)

// full-page
await ctx.screenshot({ path: resolve(out, 'full.png'), fullPage: true })

// section slices (scroll + reveal settle + count-ups)
const total = await ctx.evaluate(() => document.body.scrollHeight)
let i = 0
for (let y = 0; y < total; y += Math.round(743 * 0.9)) {
  await ctx.evaluate((yy) => window.scrollTo(0, yy), y)
  await ctx.waitForTimeout(650)
  await ctx.screenshot({ path: resolve(out, `slice-${String(i).padStart(2, '0')}.png`) })
  i++
}
await ctx.evaluate(() => window.scrollTo(0, 0))
await ctx.waitForTimeout(300)

// ── permission gate: no restricted clients in the DOM ──
const html = await ctx.content()
const leaks = ['HDFC', 'ZEE', 'Kidzee', 'Reliance'].filter((k) => html.includes(k))
console.log('PERMISSION-GATE leaks:', leaks.length ? leaks.join(', ') : 'NONE ✓')

// ── single h1 ──
const h1s = await ctx.$$eval('h1', (n) => n.map((e) => e.textContent.trim()))
console.log('H1 count:', h1s.length, JSON.stringify(h1s))

// ── 11px font floor ──
const small = await ctx.evaluate(() => {
  const bad = []
  document.querySelectorAll('body *').forEach((el) => {
    if (!el.children.length && el.textContent.trim()) {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs && fs < 11) bad.push({ t: el.textContent.trim().slice(0, 28), fs: Math.round(fs * 100) / 100 })
    }
  })
  return bad
})
console.log('SUB-11px text nodes:', small.length ? JSON.stringify(small.slice(0, 12)) : 'NONE ✓')

// ── axe (a11y + colour-contrast) ──
const axe = await new AxeBuilder({ page: ctx }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
console.log('AXE violations total:', axe.violations.length, '| serious/critical:', serious.length)
for (const v of axe.violations) {
  console.log(`  · [${v.impact}] ${v.id}: ${v.nodes.length} node(s) — ${v.help}`)
  if (v.id === 'color-contrast') v.nodes.slice(0, 6).forEach((n) => console.log('      ', n.target.join(' '), '::', (n.any[0]?.message || '').slice(0, 90)))
}

// ── SEO ──
const seo = await ctx.evaluate(() => ({
  title: document.title,
  desc: document.querySelector('meta[name="description"]')?.content || '',
  ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent)['@type'] } catch { return '?' } }),
}))
console.log('SEO title:', `"${seo.title}"`, `(${seo.title.length}ch)`)
console.log('SEO desc :', `"${seo.desc}"`, `(${seo.desc.length}ch)`)
console.log('SEO jsonLd types:', seo.ld.join(', '))

console.log('CONSOLE errors:', errors.length ? errors : 'NONE ✓')

// ── reduced-motion pass: marquee track should carry no live WAAPI animation ──
const rmCtx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const rm = await rmCtx.newPage()
await rm.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await rm.waitForTimeout(1000)
const rmState = await rm.evaluate(() => {
  const t = document.querySelector('.ff-mq-track')
  const running = t ? t.getAnimations().filter((a) => a.playState === 'running').length : -1
  return { running, transform: t ? getComputedStyle(t).transform : 'n/a' }
})
console.log('REDUCED-MOTION marquee running-animations:', rmState.running, '(expect 0)')
await rm.screenshot({ path: resolve(out, 'reduced-motion.png'), fullPage: true })

await browser.close()
console.log('\n✓ verify complete →', out)
