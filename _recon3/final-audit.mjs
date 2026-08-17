import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const SC = 'C:\\Users\\Harleen\\AppData\\Local\\Temp\\claude\\d--WEBSITES-Website-University\\8ebd6733-c21d-48c6-86fc-1050687fe924\\scratchpad'
const PAGES = [['home', '/'], ['about', '/about'], ['infrastructure', '/infrastructure'], ['global-markets', '/global-markets'], ['print-on-demand', '/print-on-demand'], ['contact', '/contact']]
const LANGS = ['en', 'fr', 'es']
const browser = await chromium.launch({ headless: false })
const rows = []
for (const lang of LANGS) {
  for (const [name, path] of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })
    await ctx.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l) } catch {} }, lang)
    const page = await ctx.newPage()
    const errs = []
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
    await page.goto(BASE + path, { waitUntil: 'load' })
    await page.waitForTimeout(1200)
    for (const b of ['Decline']) { const x = page.locator(`button:has-text("${b}")`).first(); if (await x.count()) { try { await x.click({ timeout: 800 }) } catch {} } }
    // scroll through to trigger lazy sections, then back to top
    await page.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 700) { window.scrollTo(0, y); await s(60) } window.scrollTo(0, 0); await s(200) })
    await page.waitForTimeout(500)
    const m = await page.evaluate(() => {
      const de = document.documentElement
      const overflow = Math.max(de.scrollWidth - de.clientWidth, document.body.scrollWidth - de.clientWidth)
      return { overflow, h1: document.querySelectorAll('h1').length, lang: de.lang,
        h1texts: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim().slice(0, 40)) }
    })
    // filter benign console noise (youtube postmessage / thumbnail 404 fallbacks)
    const realErrs = errs.filter(e => !/maxresdefault|ytimg|postMessage|Failed to load resource.*ytimg|www-embed/i.test(e))
    await page.screenshot({ path: `${SC}\\final-${name}-${lang}.png`, fullPage: true }).catch(() => {})
    rows.push({ lang, name, overflow: m.overflow, h1: m.h1, htmlLang: m.lang, errs: realErrs.length, h1texts: m.h1texts })
    console.log(`${lang} ${name.padEnd(16)} overflow=${String(m.overflow).padStart(4)} h1=${m.h1} lang=${m.lang} errs=${realErrs.length}${realErrs.length ? ' ' + JSON.stringify(realErrs.slice(0, 3)) : ''}`)
    await ctx.close()
  }
}
console.log('--- issues ---')
rows.filter(r => r.overflow > 2 || r.h1 !== 1 || r.errs > 0).forEach(r => console.log('ISSUE', JSON.stringify(r)))
console.log('done')
