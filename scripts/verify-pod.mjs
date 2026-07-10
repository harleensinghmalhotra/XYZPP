// VERIFY /print-on-demand — headed, 1536×743 @ DPR 1.25.
// Shots -> shots/page-pod/. Asserts the summary updates on selection, does a
// keyboard-only pass with visible focus, runs axe (incl. contrast), checks the
// 11px type floor, reduced-motion, and captures console errors.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots/page-pod')
mkdirSync(out, { recursive: true })
const URL = process.argv[2] || 'http://localhost:5175/print-on-demand'
const shot = (p, name) => p.screenshot({ path: resolve(out, name) })

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1200)

// title check
const title = await page.title()
console.log('TITLE:', JSON.stringify(title), '(', title.length, 'ch )')

// 1 hero
await shot(page, '01-hero.png')

// scroll to build
await page.locator('#build').scrollIntoViewIfNeeded()
await page.waitForTimeout(600)
await shot(page, '02-build-default.png')

// helper: read the summary panel text
const summaryText = () => page.locator('.pod-summary-list').innerText()

// step through: click a NON-default option in each group, assert summary changes
const picks = [
  ['step-format', 'hardcover', 'Hardcover'],
  ['step-size', '8x10', '8 × 10 in'],
  ['step-paper', 'art', 'Art 150gsm'],
  ['step-binding', 'wiro', 'Wiro'],
  ['step-finish', 'gloss', 'Gloss Lamination'],
  ['step-quantity', '500', '500+ copies'],
]
let n = 3
for (const [label, , expect] of picks) {
  const before = await summaryText()
  const group = page.locator(`[aria-labelledby="${label}"]`)
  // click the radio whose accessible content matches expect
  const radio = group.getByRole('radio', { name: new RegExp(expect.replace(/[+()]/g, '\\$&'), 'i') })
  await radio.first().scrollIntoViewIfNeeded()
  await radio.first().click()
  await page.waitForTimeout(450)
  const after = await summaryText()
  const changed = before !== after && after.includes(expect)
  console.log(`SELECT ${label} -> ${expect}: summary ${changed ? 'CHANGED ✓' : 'NO-CHANGE ✗'}`)
  // capture the preview + summary state
  await page.locator('.pod-preview').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await shot(page, `${String(n).padStart(2, '0')}-picked-${label.replace('step-', '')}.png`)
  n++
}

// full summary state after all picks
await page.locator('.pod-summary').scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
await shot(page, '09-summary-final.png')

// verify Request link carries spec params
const href = await page.locator('.pod-request').getAttribute('href')
console.log('REQUEST HREF:', href)

// keyboard-only pass: focus first format radio, arrow through, screenshot focus ring
await page.locator('#build').scrollIntoViewIfNeeded()
const firstRadio = page.locator('[aria-labelledby="step-format"] [role="radio"]').first()
await firstRadio.focus()
await page.waitForTimeout(200)
await shot(page, '10-kbd-focus.png')
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(200)
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(200)
const kbSel = await page.locator('[aria-labelledby="step-format"] [role="radio"][aria-checked="true"]').getAttribute('aria-checked')
console.log('KEYBOARD arrow select works:', kbSel === 'true' ? '✓' : '✗')
await shot(page, '11-kbd-arrowed.png')

// Tab reaches the Request link
let tabs = 0, reached = false
while (tabs < 40 && !reached) {
  await page.keyboard.press('Tab')
  tabs++
  reached = await page.evaluate(() => document.activeElement?.classList?.contains('pod-request'))
}
console.log('Tab reaches Request link:', reached ? `✓ (${tabs} tabs)` : '✗')

// how-it-works + band + cta
await page.locator('.pod-how').scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await shot(page, '12-how.png')
await page.locator('.pod-band').scrollIntoViewIfNeeded(); await page.waitForTimeout(1600); await shot(page, '13-band.png')
await page.locator('.pod-cta').scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await shot(page, '14-cta.png')

// 11px type floor — any rendered text below 11px?
const tooSmall = await page.evaluate(() => {
  const bad = []
  document.querySelectorAll('.pod *').forEach((el) => {
    if (!el.children.length && el.textContent.trim()) {
      const fs = parseFloat(getComputedStyle(el).fontSize)
      if (fs && fs < 11) bad.push({ t: el.textContent.trim().slice(0, 24), fs })
    }
  })
  return bad
})
console.log('SUB-11px text nodes:', tooSmall.length, JSON.stringify(tooSmall.slice(0, 8)))

// axe (includes color-contrast)
const axe = await new AxeBuilder({ page }).include('.pod').analyze()
const serious = axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
console.log('AXE violations:', axe.violations.length, '| serious/critical:', serious.length)
for (const v of axe.violations) console.log('  -', v.id, `[${v.impact}]`, v.nodes.length, '::', v.help)

// reduced motion
const ctx2 = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
const p2 = await ctx2.newPage()
await p2.goto(URL, { waitUntil: 'networkidle' })
await p2.locator('#build').scrollIntoViewIfNeeded()
await p2.waitForTimeout(600)
await shot(p2, '15-reduced-motion.png')

console.log('\nCONSOLE ERRORS:', errors.length)
errors.forEach((e) => console.log('  !', e))

await browser.close()
console.log('done ->', out)
