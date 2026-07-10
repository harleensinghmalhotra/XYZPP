import { chromium } from 'playwright'

const URL = 'http://localhost:5177/infrastructure'
const OUT = 'shots/phase25/infrastructure.png'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(URL, { waitUntil: 'networkidle' })

// scroll fully top->bottom to trigger reveals + lazy images
await page.evaluate(async () => {
  const h = document.body.scrollHeight
  for (let y = 0; y <= h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)) }
  window.scrollTo(0, 0)
  await new Promise(r => setTimeout(r, 400))
})
await page.waitForTimeout(600)

// check every InfraPhoto has a loaded background image + video poster
const frameAudit = await page.evaluate(async () => {
  const results = []
  const load = (url) => new Promise((res) => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = url })
  const nodes = [...document.querySelectorAll('.inf-photo-img, .inf-video-img')]
  for (const n of nodes) {
    const bg = getComputedStyle(n).backgroundImage
    const m = bg.match(/url\("?([^")]+)"?\)/)
    const url = m ? m[1] : null
    const ok = url ? await load(url) : false
    results.push({ cls: n.className, url: url ? url.split('/').pop() : null, ok })
  }
  return results
})

await page.screenshot({ path: OUT, fullPage: true })
await browser.close()

console.log('CONSOLE ERRORS:', errors.length)
errors.forEach((e) => console.log('  !', e))
console.log('FRAME AUDIT:')
frameAudit.forEach((f) => console.log(`  ${f.ok ? 'OK ' : 'FAIL'} ${f.url}  (${f.cls})`))
const bad = frameAudit.filter((f) => !f.ok)
console.log(bad.length ? `\n${bad.length} BROKEN FRAME(S)` : '\nALL FRAMES LOADED')
