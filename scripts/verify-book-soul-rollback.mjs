import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots', 'book-soul-rollback')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const FSC = 'TUVDC-COC-101258'
const CIN = 'CIN U74999MH2020PTC337494'
const REG = 'Office No 1207, Plot No 4 & 6, Sector 30A, Navi Mumbai, Maharashtra 400705'

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m) } else { fail++; console.log('  ✗ FAIL:', m) } }

const browser = await chromium.launch({ headless: false })
async function ctxFor(lng) {
  const ctx = await browser.newContext(VP)
  const errors = []
  ctx.on('page', (p) => {
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    p.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  })
  const page = await ctx.newPage()
  await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lng)
  return { ctx, page, errors }
}

// ─── 1. FOOTER POST-ROLLBACK: colophon+ticker GONE, CIN restored, EN + FR ────
for (const lng of ['en', 'fr']) {
  console.log(`\n── FOOTER ROLLBACK (${lng.toUpperCase()}) ──`)
  const { ctx, page, errors } = await ctxFor(lng)
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  // walk the page so every section (incl. FSC in Sustainability) mounts/reveals
  const H = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < H; y += 440) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120) }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(800)

  const foot = await page.evaluate(() => document.querySelector('#contact')?.innerText || '')
  const doc = await page.evaluate(() => document.body.innerText)

  // colophon + ticker must be gone from the footer
  ok(!/Set in Inter Tight/i.test(foot) && !/Composé en Inter Tight/i.test(foot), 'colophon type-credit line GONE from footer')
  ok(!/Printed & shipped|Imprimé et expédié/i.test(foot), 'colophon locale line GONE from footer')
  ok(!/leaves our floor every 1\.26|quitte nos ateliers/i.test(foot), 'ticker lead GONE from footer')
  ok((await page.locator('[data-book-count]').count()) === 0, 'live counter element GONE (no [data-book-count])')

  // CIN restored to the footer, verbatim
  ok(foot.includes(CIN), `CIN "${CIN}" present in footer & verbatim`)
  ok(foot.includes(REG), 'registered-office line present in footer & verbatim')
  // FSC still renders somewhere on the homepage (Sustainability / Certifications)
  ok(doc.includes(FSC), `FSC licence code "${FSC}" still present on the page & verbatim`)

  await page.evaluate(() => document.querySelector('#contact').scrollIntoView({ block: 'end' }))
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, `footer-${lng}.png`), fullPage: false })
  ok(errors.length === 0, `zero console errors${errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''}`)
  await ctx.close()
}

// ─── 2. 404 STILL UNTOUCHED: EN + FR ─────────────────────────────────────────
for (const lng of ['en', 'fr']) {
  console.log(`\n── 404 UNTOUCHED (${lng.toUpperCase()}) ──`)
  const { ctx, page, errors } = await ctxFor(lng)
  await page.goto(base + '/this-title-was-never-printed', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(400)
  const txt = await page.evaluate(() => document.querySelector('#main')?.innerText || '')
  const title = lng === 'fr' ? "Cette page n'est plus au catalogue." : 'This page is out of print.'
  ok(txt.includes(title), `404 headline intact (${title})`)
  ok((await page.locator('#main svg').count()) >= 1, '404 book icon intact')
  await page.screenshot({ path: resolve(out, `404-${lng}.png`), fullPage: false })
  ok(errors.length === 0, `zero console errors${errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''}`)
  await ctx.close()
}

await browser.close()
console.log(`\n════════════════════════════════\n  RESULT: ${pass} passed, ${fail} failed\n════════════════════════════════`)
process.exit(fail ? 1 : 0)
