import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const TARGETS = {
  '/infrastructure': ['.inf-finish-cell', '.yt-channel', '.inf-gallery-item', '.inf-cta-inner'],
  '/contact': ['.ctc-cell', '.ctc-reveal'],
}
const browser = await chromium.launch({ headless: false })
for (const [path, sels] of Object.entries(TARGETS)) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  await page.goto(BASE + path, { waitUntil: 'load' }) // DIRECT hard load
  await page.waitForTimeout(800)
  await page.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 200) { window.scrollBy(0, 200); await s(25) } await s(300) })
  const r = await page.evaluate((sels) => sels.map(sel => { const el = document.querySelector(sel); if (!el) return sel + '=MISSING'; const cs = getComputedStyle(el); return `${sel}[op=${cs.opacity} vis=${cs.visibility}]` }), sels)
  const bad = r.filter(x => /op=0|vis=hidden|MISSING/.test(x))
  console.log(`${path} DIRECT ${bad.length ? 'FAIL ' + bad.join(', ') : 'ok  ' + r.join(', ')}`)
  await ctx.close()
}
await browser.close()
