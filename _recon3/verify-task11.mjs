import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const LABELS = ['FSC', 'ISO 9001:2015', 'ISO/IEC 27001:2022', 'Sedex', 'Two Star Export House']
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const results = {}
for (const from of ['/about', '/contact']) {
  results[from] = []
  for (const label of LABELS) {
    await page.goto(BASE + from, { waitUntil: 'load' })
    await page.waitForTimeout(700)
    for (const b of ['Decline', 'Accept']) { const x = page.locator(`button:has-text("${b}")`).first(); if (await x.count()) { try { await x.click({ timeout: 800 }) } catch {} break } }
    const link = page.locator(`footer a[aria-label="${label}"]`).first()
    await link.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await link.click()
    await page.waitForTimeout(1600) // allow route change + Lenis scroll
    const info = await page.evaluate(() => {
      const el = document.getElementById('certifications')
      const r = el ? el.getBoundingClientRect() : null
      return { path: location.pathname, hash: location.hash, scrollY: Math.round(window.scrollY),
        certTop: r ? Math.round(r.top) : null, inView: r ? (r.top < window.innerHeight && r.bottom > 0) : false }
    })
    const ok = info.path === '/' && info.hash === '#certifications' && info.scrollY > 100 && info.inView
    results[from].push({ label, ok, ...info })
    console.log(`${from} · ${label} -> ${ok ? 'PASS' : 'FAIL'} path=${info.path}${info.hash} scrollY=${info.scrollY} certTop=${info.certTop} inView=${info.inView}`)
  }
}
const passAbout = results['/about'].filter(r => r.ok).length
const passContact = results['/contact'].filter(r => r.ok).length
console.log(`SUMMARY about ${passAbout}/5  contact ${passContact}/5`)
await browser.close()
