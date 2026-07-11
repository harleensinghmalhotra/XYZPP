// GLOW RING ROTATION verification — headed Playwright @ 1536×743 DPR 1.25.
// The Uiverse hover sweep restored on BOTH the facility cards (.infra-card) and the
// team placeholder cards (.infra-person): on hover the ::before gradient ring rotates
// -90deg with a stretch (springy ease), swinging the gold/navy tabs to the sides while
// the ::after glow deepens. NOTE: .infra-person / .infra-card only become stacking
// contexts on hover (via the -5px lift), which is exactly when the negative-z ring is
// meant to show — so every shot here uses a REAL :hover, and clips include a margin so
// the side tabs poking into the grid gaps / section padding are never cropped.
// Evidence → shots/glow-rotate/:
//   {team,infra}-rest.png / -hover.png    — grid at rest vs hover peak (margin clip)
//   {team,infra}-mid-{100,300,500}.png    — ring caught mid-sweep (spring overshoot)
//   reduced-motion.png                    — no rotation, static ring
//   audit.json                            — hover transform, fps, console errors
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'glow-rotate')
mkdirSync(out, { recursive: true })
const BASE = process.env.URL || 'http://localhost:5196'
const VP = { width: 1536, height: 743 }
const DPR = 1.25
const MARGIN = 74

const browser = await chromium.launch({ headless: false })
const errors = []

async function open(reduced = false) {
  const ctx = await browser.newContext({
    viewport: VP, deviceScaleFactor: DPR,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch {}
  await page.waitForTimeout(400)
  return { ctx, page }
}
async function reveal(page, sel) {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel)
  await page.waitForTimeout(1200)
  await page.mouse.move(5, 5)
  await page.waitForTimeout(250)
}
async function clipOf(page, gridSel) {
  const box = await page.locator(gridSel).boundingBox()
  return { x: Math.max(0, box.x - MARGIN), y: Math.max(0, box.y - MARGIN), width: box.width + MARGIN * 2, height: box.height + MARGIN * 2 }
}

const audit = { base: BASE }

async function shootSweep(page, gridSel, cardSel, tag) {
  const clip = await clipOf(page, gridSel)
  await page.screenshot({ path: resolve(out, `${tag}-rest.png`), clip })
  const card = page.locator(cardSel).nth(1) // interior card — worst case for gap width
  await card.hover()
  for (const ms of [100, 300, 500]) {
    await page.waitForTimeout(ms === 100 ? 100 : 200)
    await page.screenshot({ path: resolve(out, `${tag}-mid-${ms}.png`), clip })
  }
  await page.waitForTimeout(450)
  await page.screenshot({ path: resolve(out, `${tag}-hover.png`), clip })
  const m = await page.evaluate((sel) => {
    const el = document.querySelectorAll(sel)[1]
    const before = getComputedStyle(el, '::before')
    return { transform: before.transform, opacity: before.opacity }
  }, cardSel)
  await page.mouse.move(5, 5)
  await page.waitForTimeout(450)
  return m
}

{ const { ctx, page } = await open(); await reveal(page, '.infra-people'); audit.team = await shootSweep(page, '.infra-people-grid', '.infra-person', 'team'); await ctx.close() }
{ const { ctx, page } = await open(); await reveal(page, '.infra-cards'); audit.infra = await shootSweep(page, '.infra-cards', '.infra-card', 'infra'); await ctx.close() }

// reduced-motion: no rotation
{
  const { ctx, page } = await open(true)
  await reveal(page, '.infra-people')
  const clip = await clipOf(page, '.infra-people-grid')
  await page.locator('.infra-person').nth(1).hover()
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(out, 'reduced-motion.png'), clip })
  audit.reducedMotion = await page.evaluate(() => getComputedStyle(document.querySelectorAll('.infra-person')[1], '::before').transform)
  await ctx.close()
}

// fps during a hover sweep
{
  const { ctx, page } = await open()
  await reveal(page, '.infra-people')
  audit.fps = await page.evaluate(async () => {
    const el = document.querySelectorAll('.infra-person')[1]
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    let frames = 0; const t0 = performance.now()
    return await new Promise((res) => { function loop(t) { frames++; if (t - t0 >= 1000) res(Math.round(frames * 1000 / (t - t0))); else requestAnimationFrame(loop) } requestAnimationFrame(loop) })
  })
  await ctx.close()
}

audit.consoleErrors = errors
audit.pass = {
  teamRotates: /matrix/.test(audit.team.transform),
  infraRotates: /matrix/.test(audit.infra.transform),
  reducedNoRotate: audit.reducedMotion === 'none' || /matrix\(1, 0, 0, 1/.test(audit.reducedMotion),
  fps55: audit.fps >= 55,
  zeroErrors: errors.length === 0,
}
await writeFile(resolve(out, 'audit.json'), JSON.stringify(audit, null, 2))
console.log(JSON.stringify(audit, null, 2))
await browser.close()
