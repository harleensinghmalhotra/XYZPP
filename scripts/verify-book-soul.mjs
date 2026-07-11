import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots', 'book-soul')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const FSC = 'TUVDC-COC-101258'
const CIN = 'CIN U74999MH2020PTC337494'
const REG = 'Office No 1207, Plot No 4 & 6, Sector 30A, Navi Mumbai, Maharashtra 400705'

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m) } else { fail++; console.log('  ✗ FAIL:', m) } }

const browser = await chromium.launch({ headless: false })

async function newCtx(opts = {}) {
  const ctx = await browser.newContext({ ...VP, ...opts })
  const errors = []
  ctx.on('page', (p) => {
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    p.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  })
  return { ctx, errors }
}

async function setLang(page, lng) {
  await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lng)
}

// Read the colophon count as an integer (strips thousands separators / spaces).
const readCount = (page) => page.evaluate(() => {
  const el = document.querySelector('[data-book-count]')
  return el ? parseInt(el.textContent.replace(/[^\d]/g, ''), 10) : null
})

// ─── 1. COLOPHON: EN + FR, FSC + CIN present & verbatim ──────────────────────
for (const lng of ['en', 'fr']) {
  console.log(`\n── COLOPHON (${lng.toUpperCase()}) ──`)
  const { ctx, errors } = await newCtx()
  const page = await ctx.newPage()
  await setLang(page, lng)
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(900)

  const foot = await page.evaluate(() => document.querySelector('#contact')?.innerText || '')
  ok(foot.includes(FSC), `FSC licence code "${FSC}" present & verbatim`)
  ok(foot.includes(CIN), `CIN "${CIN}" present & verbatim`)
  ok(foot.includes(REG), 'Registered office line present & verbatim')
  ok(/Inter Tight/.test(foot) && /DM Mono/.test(foot), 'type credit ("Set in Inter Tight & DM Mono") present')
  ok(/Navi Mumbai/.test(foot), 'locale credit ("Navi Mumbai") present')
  const lead = lng === 'fr' ? '1,26 seconde' : 'every 1.26 seconds'
  ok(foot.includes(lead), `ticker lead present (${lead})`)

  await page.evaluate(() => document.querySelector('#contact').scrollIntoView({ block: 'end' }))
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, `colophon-${lng}.png`), fullPage: false })

  // contrast (axe) on the footer colophon
  const axe = await new AxeBuilder({ page }).include('#contact').withTags(['wcag2aa']).analyze()
  const contrast = axe.violations.filter((v) => v.id === 'color-contrast')
  ok(contrast.length === 0, `no AA color-contrast violations in footer${contrast.length ? ' — ' + JSON.stringify(contrast[0].nodes.map(n => n.target)) : ''}`)

  ok(errors.length === 0, `zero console errors${errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''}`)
  await ctx.close()
}

// ─── 2. TICKER: N ticks up at t=0 vs t=10s ───────────────────────────────────
console.log('\n── TICKER (t=0 → t=10s) ──')
{
  const { ctx } = await newCtx()
  const page = await ctx.newPage()
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(200)
  const n0 = await readCount(page)
  await page.waitForTimeout(10000)
  const n10 = await readCount(page)
  const expected = Math.floor(10000 / 1260) // ≈ 7 books in 10s at 1.26s each
  console.log(`  N@t=0=${n0}  N@t=10s=${n10}  expected≈${expected}`)
  ok(n0 !== null && n10 !== null, 'counter renders a number')
  ok(n10 - n0 >= expected - 1 && n10 - n0 <= expected + 1, `counter advanced by ~${expected} (got ${n10 - n0})`)
  await ctx.close()
}

// ─── 3. TAB-HIDDEN PAUSE PROOF ───────────────────────────────────────────────
console.log('\n── TAB-HIDDEN PAUSE ──')
{
  const { ctx } = await newCtx()
  const page = await ctx.newPage()
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)
  const before = await readCount(page)
  // Drive the real Page Visibility contract the component listens to: force
  // document.hidden/visibilityState and dispatch 'visibilitychange'. (Playwright's
  // bringToFront doesn't reliably background a tab in headed Chromium, so we
  // exercise the handler directly — the same code path a hidden tab triggers.)
  const hidden = await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
    return document.visibilityState
  })
  await page.waitForTimeout(5000) // 5s hidden — would be ~4 ticks if it didn't pause
  const whileHidden = await readCount(page)
  // Return to visible and confirm it resumes.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(3000)
  const afterResume = await readCount(page)
  console.log(`  visibilityState=${hidden}  count before=${before}  after 5s hidden=${whileHidden}  after resume=${afterResume}`)
  ok(hidden === 'hidden', 'document reports visibilityState="hidden" after visibilitychange')
  ok(whileHidden === before, `counter PAUSED while hidden (${before} → ${whileHidden}, no ticks)`)
  ok(afterResume > whileHidden, `counter RESUMES when visible again (${whileHidden} → ${afterResume})`)
  await ctx.close()
}

// ─── 4. 404 OUT-OF-PRINT: EN + FR + link home ────────────────────────────────
for (const lng of ['en', 'fr']) {
  console.log(`\n── 404 (${lng.toUpperCase()}) ──`)
  const { ctx, errors } = await newCtx()
  const page = await ctx.newPage()
  await setLang(page, lng)
  await page.goto(base + '/this-title-was-never-printed', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(500)

  const txt = await page.evaluate(() => document.querySelector('#main')?.innerText || '')
  const title = lng === 'fr' ? "Cette page n'est plus au catalogue." : 'This page is out of print.'
  const eyebrow = lng === 'fr' ? 'ÉPUISÉ' : 'OUT OF STOCK'
  ok(txt.includes(title), `headline present (${title})`)
  ok(/404/.test(txt) && txt.includes(eyebrow), `mono eyebrow present (ERROR 404 · ${eyebrow})`)
  ok((await page.locator('#main svg').count()) >= 1, 'stroke-drawn book icon present')

  await page.screenshot({ path: resolve(out, `404-${lng}.png`), fullPage: false })

  const axe = await new AxeBuilder({ page }).include('#main').withTags(['wcag2aa']).analyze()
  const contrast = axe.violations.filter((v) => v.id === 'color-contrast')
  ok(contrast.length === 0, `no AA color-contrast violations on 404${contrast.length ? ' — ' + JSON.stringify(contrast[0].nodes.map(n => n.target)) : ''}`)

  // link navigates home
  const back = lng === 'fr' ? 'Retour au catalogue' : 'Back to the catalogue'
  await page.getByRole('link', { name: new RegExp(back) }).click()
  await page.waitForTimeout(600)
  const url = new URL(page.url())
  ok(url.pathname === '/', `"${back}" link routes to home (${url.pathname})`)
  ok(errors.length === 0, `zero console errors${errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''}`)
  await ctx.close()
}

// ─── 5. REDUCED MOTION: still ticks (information, not decoration) ─────────────
console.log('\n── REDUCED MOTION ──')
{
  const { ctx, errors } = await newCtx({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(200)
  const r0 = await readCount(page)
  await page.waitForTimeout(4000)
  const r4 = await readCount(page)
  console.log(`  reduced-motion count ${r0} → ${r4}`)
  ok(r4 > r0, 'counter still ticks under prefers-reduced-motion (information, not decoration)')
  ok(errors.length === 0, `zero console errors${errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''}`)
  await ctx.close()
}

await browser.close()
console.log(`\n════════════════════════════════\n  RESULT: ${pass} passed, ${fail} failed\n════════════════════════════════`)
process.exit(fail ? 1 : 0)
