// VERIFY /contact — headed 1536×743 DPR 1.25.
// Full-page + band shots · axe (wcag2a/aa/21aa) · console-error capture ·
// consent-unticked assert · 11px-floor scan · keyboard-only form completion pass.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'shots', 'page-contact')
mkdirSync(outDir, { recursive: true })

const URL = process.argv[2] || 'http://localhost:5173/contact'
const W = 1536, H = 743
const browser = await chromium.launch({ headless: false })

// ── shared: 11px floor scan — smallest font-size on any element with real text ──
const floorScan = () => document.evaluate
  ? Array.from(document.querySelectorAll('body *'))
      .filter((el) => {
        if (el.closest('svg')) return false
        const direct = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())
        if (!direct) return false
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
      })
      .map((el) => ({ px: parseFloat(getComputedStyle(el).fontSize), t: el.textContent.trim().slice(0, 42), cls: el.className?.toString().slice(0, 40) }))
      .sort((a, b) => a.px - b.px)
      .slice(0, 8)
  : []

async function run(label, reduced) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1.25,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)

  // ── consent-unticked assert (initial state) ──
  const consentChecked = await page.locator('#f-consent').isChecked()
  const consentOK = consentChecked === false

  // ── one <h1> only ──
  const h1Count = await page.locator('main h1').count()

  // ── band screenshots down the page ──
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  const step = Math.round(H * 0.85)
  let i = 0
  for (let y = 0; y <= maxY; y += step) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y)
    await page.waitForTimeout(500)
    await page.screenshot({ path: resolve(outDir, `${label}-${String(i).padStart(2, '0')}.png`) })
    i++
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(outDir, `${label}-full.png`), fullPage: true })

  // ── 11px floor scan ──
  const floor = await page.evaluate(floorScan)

  let axeSummary = 'skipped'
  let kb = 'skipped'
  if (!reduced) {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    axeSummary = results.violations.map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) — ${v.help}`)
    writeFileSync(resolve(outDir, 'axe.json'), JSON.stringify(results.violations, null, 2))

    // ── keyboard-only form completion pass ──
    // Focus the first field, then tab/type through every control with the keyboard only.
    await page.locator('#f-enquiry').scrollIntoViewIfNeeded()
    await page.locator('#f-first').focus()
    await page.keyboard.type('Ada')
    await page.keyboard.press('Tab'); await page.keyboard.type('Lovelace')          // last
    await page.keyboard.press('Tab'); await page.keyboard.type('ada@example.com')   // email
    await page.keyboard.press('Tab'); await page.keyboard.type('+44 20 7946 0000')  // phone
    await page.keyboard.press('Tab'); await page.keyboard.type('Analytical Press')  // company
    await page.keyboard.press('Tab')                                                // country select
    await page.keyboard.press('u'); await page.keyboard.press('u')                  // -> United Kingdom
    await page.keyboard.press('Tab')                                                // enquiry select
    await page.keyboard.press('p')                                                  // -> Print on Demand
    await page.keyboard.press('Tab'); await page.keyboard.type('A first run of one hardback novel, 320pp, please quote.') // message
    await page.keyboard.press('Tab'); await page.keyboard.press('Space')            // consent checkbox -> tick

    const consentAfter = await page.locator('#f-consent').isChecked()
    const firstFocused = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)

    // submit via keyboard (mailto nav is external — ignore any navigation abort)
    await page.locator('.ctc-submit').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(700)
    const successVisible = await page.locator('.ctc-success').isVisible().catch(() => false)
    await page.screenshot({ path: resolve(outDir, 'form-success.png') })

    kb = { consentTickedByKeyboard: consentAfter, focusAfterTabbing: firstFocused, successStateShown: successVisible }
  }

  console.log(`\n===== ${label} =====`)
  console.log('console errors:', errors.length ? errors : 'none')
  console.log('h1 count:', h1Count, h1Count === 1 ? '(ok)' : '(!!)')
  console.log('consent unticked on load:', consentOK)
  console.log('11px floor (smallest text):', floor)
  console.log('axe violations:', axeSummary.length ? axeSummary : 'none')
  console.log('keyboard form pass:', kb)
  await ctx.close()
}

await run('motion', false)
await run('reduced', true)
await browser.close()
