import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const PAGES = [['home', '/'], ['about', '/about'], ['infrastructure', '/infrastructure'], ['global-markets', '/global-markets'], ['print-on-demand', '/print-on-demand'], ['contact', '/contact']]
const LANGS = ['en', 'fr', 'es']
const browser = await chromium.launch({ headless: true })
for (const lang of LANGS) {
  for (const [name, path] of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })
    await ctx.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l) } catch {} }, lang)
    const page = await ctx.newPage()
    const errs = []
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
    await page.goto(BASE + path, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    await page.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 900) { window.scrollTo(0, y); await s(50) } window.scrollTo(0, 0); await s(150) })
    const m = await page.evaluate(() => {
      const de = document.documentElement
      return { overflow: Math.max(de.scrollWidth - de.clientWidth, document.body.scrollWidth - de.clientWidth), h1: document.querySelectorAll('h1').length, lang: de.lang }
    })
    const realErrs = errs.filter(e => !/maxresdefault|ytimg|postMessage|www-embed|ERR_BLOCKED_BY|Failed to load resource/i.test(e))
    console.log(`${lang} ${name.padEnd(15)} overflow=${String(m.overflow).padStart(4)} h1=${m.h1} htmlLang=${m.lang} errs=${realErrs.length}${realErrs.length ? ' ' + JSON.stringify(realErrs.slice(0, 2)) : ''}`)
    await ctx.close()
  }
}
await browser.close()
console.log('METRICS DONE')
