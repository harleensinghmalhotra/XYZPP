import { chromium } from 'playwright'
const BASE = 'http://localhost:5177'
const ROUTES = [['home', '/'], ['about', '/about'], ['educational-books', '/educational-books'], ['trade-books', '/trade-books'], ['print-on-demand', '/print-on-demand'], ['infrastructure', '/infrastructure'], ['fulfilment', '/fulfilment'], ['contact', '/contact']]
const isReal = (e) => !/aborted|ERR_ABORTED|\.mp4/i.test(e)

const b = await chromium.launch({ headless: true })

// A) fps proxy while scrolling (canvases running) — motion ON
console.log('── fps proxy (worst frame ms during scroll, canvases live) ──')
const ctxM = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
for (const [name, route] of ROUTES) {
  const p = await ctxM.newPage()
  await p.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(800)
  const stat = await p.evaluate(async () => {
    const go = (y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: false }) : window.scrollTo(0, y))
    const deltas = []; let last = performance.now(); let raf
    const loop = (t) => { deltas.push(t - last); last = t; raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    const H = document.body.scrollHeight
    for (let y = 0; y < H; y += 240) { go(y); await new Promise(r => setTimeout(r, 32)) }
    cancelAnimationFrame(raf)
    deltas.sort((a, b) => a - b)
    const worst = deltas[Math.floor(deltas.length * 0.98)] || 0
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
    return { avg: +avg.toFixed(1), p98: +worst.toFixed(1), over18: +(100 * deltas.filter(d => d > 18).length / deltas.length).toFixed(1) }
  })
  console.log(`  ${name.padEnd(18)} avg ${stat.avg}ms  p98 ${stat.p98}ms  frames>18ms ${stat.over18}%`)
  await p.close()
}
await ctxM.close()

// B) reduced-motion: console errors + canvas count (should render static, no errors)
console.log('\n── reduced-motion pass (console errors) ──')
const ctxR = await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
for (const [name, route] of ROUTES) {
  const p = await ctxR.newPage()
  const errs = []
  p.on('console', (m) => { if (m.type() === 'error' && isReal(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message))
  await p.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {})
  await p.waitForTimeout(1000)
  const canvases = await p.locator('canvas').count()
  console.log(`  ${name.padEnd(18)} canvases:${canvases}  real console errors:${errs.length}${errs.length ? ' → ' + errs[0].slice(0, 60) : ''}`)
  await p.close()
}
await ctxR.close()
await b.close()
