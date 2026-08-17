import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://localhost:4173'
const RUNS = Number(process.env.RUNS || 5)
const VIEW = { width: 1536, height: 743 }
const DSF = 1.25
const TARGETS = {
  '/infrastructure': ['.inf-finish-cell', '.yt-channel', '.inf-gallery-item', '.inf-cta-inner'],
  '/contact': ['.ctc-cell', '.ctc-reveal'],
}
const sleep = (p, ms) => p.waitForTimeout(ms)
async function slowScroll(page) {
  await page.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 160) { window.scrollBy(0, 160); await s(28) } await s(400) })
}
async function runOne(browser, pagePath, sels, idx) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DSF, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(page, 1200)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(page, 500)
  const links = page.locator(`a[href="${pagePath}"]`)
  const cnt = await links.count()
  const link = cnt > 1 ? links.nth(cnt - 1) : links.first()
  await link.click({ force: true, timeout: 6000 }).catch(async () => { await links.first().click({ force: true, timeout: 6000 }) })
  await page.waitForFunction((p) => location.pathname === p, pagePath, { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(400)
  await slowScroll(page)
  const report = await page.evaluate((sels) => {
    const out = {}
    for (const sel of sels) {
      const el = document.querySelector(sel)
      if (!el) { out[sel] = { exists: false }; continue }
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect()
      out[sel] = { exists: true, opacity: cs.opacity, visibility: cs.visibility, w: Math.round(r.width), h: Math.round(r.height) }
    }
    return out
  }, sels)
  const hidden = Object.entries(report).filter(([, v]) => v.exists && (parseFloat(v.opacity) < 0.5 || v.visibility === 'hidden'))
  const fail = hidden.length > 0
  console.log(`${pagePath} #${idx} ${fail ? 'FAIL' : 'ok'}` + (fail ? '  hidden: ' + hidden.map(([k, v]) => `${k}[op=${v.opacity} vis=${v.visibility} ${v.w}x${v.h}]`).join(', ') : ''))
  await ctx.close()
  return fail
}
async function main() {
  const browser = await chromium.launch({ headless: false })
  const summary = {}
  for (const [path, sels] of Object.entries(TARGETS)) {
    let f = 0
    for (let i = 0; i < RUNS; i++) if (await runOne(browser, path, sels, i)) f++
    summary[path] = `${f}/${RUNS}`
    console.log(`==== ${path}: ${f}/${RUNS} blank ====`)
  }
  await browser.close()
  console.log('SUMMARY ' + JSON.stringify(summary))
}
main().catch(e => { console.error(e); process.exit(1) })
