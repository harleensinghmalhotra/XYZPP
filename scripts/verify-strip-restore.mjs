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

// ── ORDER assertion ───────────────────────────────────────────────────────────
const order = await page.evaluate(() => {
  const ids = ['certifications', 'marquee', 'sustainability', 'bookfan']
  return ids.map((id) => { const el = document.getElementById(id); return { id, top: el ? +(el.getBoundingClientRect().top + window.scrollY).toFixed(0) : null } })
})
console.log('SECTION ORDER (by top Y):')
order.forEach((o) => console.log(`   ${o.id.padEnd(16)} @${o.top}`))
const seq = order.filter((o) => o.top != null)
const ok = seq.every((o, i) => i === 0 || o.top > seq[i - 1].top)
console.log(`   → ${ok ? 'certs < marquee < sustainability ✓' : 'ORDER WRONG ✗'}`)

// ── STRIP restored ────────────────────────────────────────────────────────────
const mTop = await page.evaluate(() => document.getElementById('marquee').getBoundingClientRect().top + window.scrollY)
await to(Math.round(mTop - 80))
await page.waitForTimeout(600)
hideNav()
await (await page.$('#marquee')).screenshot({ path: resolve(out, 'strip-restored.png') })
showNav()
console.log('\n  ✓ strip-restored.png')

// ── MARQUEE animates — sample the moving row transform twice ──────────────────
const t1 = await page.evaluate(() => { const el = document.querySelector('#marquee .w-max'); return el ? getComputedStyle(el).transform : 'none' })
await page.waitForTimeout(700)
const t2 = await page.evaluate(() => { const el = document.querySelector('#marquee .w-max'); return el ? getComputedStyle(el).transform : 'none' })
console.log(`  MARQUEE animates: ${t1 !== t2 ? 'MOVING ✓' : 'STATIC ✗'} (${t1.slice(0, 24)}… → ${t2.slice(0, 24)}…)`)

// ── JUNCTION certs → strip → sustain (one tall frame) ─────────────────────────
const geom = await page.evaluate(() => {
  const c = document.getElementById('certifications').getBoundingClientRect()
  const m = document.getElementById('marquee').getBoundingClientRect()
  const s = document.getElementById('sustainability').getBoundingClientRect()
  const y = (r) => r.top + window.scrollY
  return {
    certsBottom: +(y(c) + c.height).toFixed(1),
    marqueeTop: +y(m).toFixed(1),
    marqueeBottom: +(y(m) + m.height).toFixed(1),
    sustainTop: +y(s).toFixed(1),
    hasCertsArc: !!document.querySelector('.certs-arc-bottom'),
  }
})
console.log('\nJUNCTIONS:')
console.log(`   certs bottom @${geom.certsBottom} · strip @${geom.marqueeTop}–${geom.marqueeBottom} · sustain top @${geom.sustainTop}`)
console.log(`   certs→strip overlap (arc sweep): ${(geom.certsBottom - geom.marqueeTop).toFixed(1)}px, certs dark arc present: ${geom.hasCertsArc} ✓`)
console.log(`   strip→sustain gap: ${(geom.sustainTop - geom.marqueeBottom).toFixed(1)}px`)
// capture certs-bottom → strip → sustain-top in the normal viewport (no resize:
// vh paddings would shift the layout and invalidate these page-Y coords)
await to(Math.round(geom.marqueeTop - 150))
await page.waitForTimeout(350)
hideNav()
await page.screenshot({ path: resolve(out, 'certs-strip-sustain.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } })
showNav()
console.log('  ✓ certs-strip-sustain.png')

// ── FPS while the strip is on-screen ──────────────────────────────────────────
await to(Math.round(mTop - 200))
await page.waitForTimeout(250)
const fps = await page.evaluate(({ y }) => new Promise((done) => {
  const d = []; let last = performance.now(); let raf
  const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
  raf = requestAnimationFrame(s)
  const dur = 1800
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
  setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((x, y) => x - y); const mean = arr.reduce((x, y) => x + y, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
}), { y: mTop + 500 })
console.log('\nFPS:', JSON.stringify(fps))

await browser.close()
console.log('\nDONE.')
