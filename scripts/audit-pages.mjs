import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const OUT = 'shots/phase25/audit-before'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5177'
const ROUTES = [
  ['home', '/'], ['about', '/about'], ['educational-books', '/educational-books'],
  ['trade-books', '/trade-books'], ['print-on-demand', '/print-on-demand'],
  ['infrastructure', '/infrastructure'], ['fulfilment', '/fulfilment'], ['contact', '/contact'],
]
const b = await chromium.launch({ headless: true })
const ctx = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1 })
for (const [name, route] of ROUTES) {
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url()))
  await p.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(1200)
  // scroll EVERY page fully to trigger lazy images + scroll-reveal animations,
  // then return to top so fullPage capture shows revealed (not pre-reveal) state
  await p.evaluate(async () => {
    const go = (y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y))
    for (let y = 0; y < document.body.scrollHeight; y += 500) { go(y); await new Promise(r => setTimeout(r, 160)) }
    go(0)
  })
  await p.waitForTimeout(700)
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log(`${name.padEnd(20)} errs:${errs.length} ${errs.slice(0, 2).join(' | ')}`)
  await p.close()
}
await b.close()
