import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
mkdirSync('shots/phase25/home', { recursive: true })
const b = await chromium.launch({ headless: true })
const p = await (await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1 })).newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message))
await p.goto('http://localhost:5177/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (const id of ['infrastructure', 'sustainability', 'awards', 'projects']) {
  await p.evaluate((sel) => {
    const el = document.getElementById(sel)
    if (el) { const y = el.getBoundingClientRect().top + (window.__lenis ? window.__lenis.scroll : window.scrollY); (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)) }
  }, id)
  await p.waitForTimeout(900)
  await p.screenshot({ path: `shots/phase25/home/${id}.png` })
}
console.log('home section shots done. real console errors (excl. mp4 aborts):', errs.filter(e => !/aborted|ERR_ABORTED|\.mp4/i.test(e)).length)
errs.filter(e => !/aborted|ERR_ABORTED|\.mp4/i.test(e)).slice(0, 5).forEach(e => console.log('  ', e))
await b.close()
