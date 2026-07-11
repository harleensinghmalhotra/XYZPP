// TEAM GLOW-BORDER verification — headed Playwright @ 1536×743 DPR 1.25.
// Territory: the 4 navy team placeholder cards in the "600+ Hands Behind Every
// Shipment" people block (homepage Infrastructure section). Evidence → shots/team-glow/:
//   section-en.png / section-fr.png     — people grid, glow at rest (EN + FR)
//   hover-card1..4.png                   — each card forced :hover (glow deepen + lift)
//   glow-crop.png                        — tight crop: warm gold aura on cream
//   reduced-motion.png                   — glow static, no breathe/lift
//   audit.json                           — glow layers present, no layout shift,
//                                          caption font-size (≥11px), console errors, fps
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'team-glow')
mkdirSync(out, { recursive: true })
const BASE = process.env.URL || 'http://localhost:5196'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

const browser = await chromium.launch({ headless: false })
const errors = []

async function open(lang, reduced = false) {
  const ctx = await browser.newContext({
    viewport: VP, deviceScaleFactor: DPR,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${lang}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${lang}] pageerror ${e.message}`))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  if (lang === 'fr') {
    await page.evaluate(() => { try { localStorage.setItem('qfp.lang', 'fr') } catch {} })
    await page.reload({ waitUntil: 'networkidle' })
  }
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch {}
  await page.waitForTimeout(500)
  return { ctx, page }
}

async function toPeople(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.infra-people')
    if (el) el.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(1200) // let the reveal timeline finish
}

const audit = { base: BASE }

// ── EN: rest + measurements ──
{
  const { ctx, page } = await open('en')
  await toPeople(page)
  await page.locator('.infra-people-grid').screenshot({ path: resolve(out, 'section-en.png') })

  const m = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.infra-person')]
    const first = cards[0]
    const cs = getComputedStyle(first)
    const before = getComputedStyle(first, '::before')
    const after = getComputedStyle(first, '::after')
    const caps = [...document.querySelectorAll('.infra-person-cap')]
    // layout-shift probe: offsetWidth/Height of the figure vs its panel — the glow
    // pseudos must NOT change the figure box (absolute + pointer-events none)
    const panel = first.querySelector('.infra-ph')
    return {
      cardCount: cards.length,
      hostPosition: cs.position,
      before: {
        content: before.content, zIndex: before.zIndex, opacity: before.opacity,
        bg: before.backgroundImage, pointerEvents: before.pointerEvents, position: before.position,
      },
      after: {
        content: after.content, zIndex: after.zIndex, opacity: after.opacity,
        filter: after.filter, animationName: after.animationName,
      },
      capFs: caps.map((c) => parseFloat(getComputedStyle(c).fontSize)),
      figureW: first.offsetWidth, figureH: first.offsetHeight,
      panelW: panel.offsetWidth, panelH: panel.offsetHeight,
    }
  })
  audit.en = m
  await ctx.close()
}

// ── EN: hover each card (force :hover) ──
{
  const { ctx, page } = await open('en')
  await toPeople(page)
  for (let i = 1; i <= 4; i++) {
    const card = page.locator('.infra-person').nth(i - 1)
    await card.hover()
    await page.waitForTimeout(650) // let opacity/blur transition settle
    await page.locator('.infra-people-grid').screenshot({ path: resolve(out, `hover-card${i}.png`) })
  }
  // tight glow-on-cream crop around card 1
  const box = await page.locator('.infra-person').first().boundingBox()
  await page.locator('.infra-person').first().hover()
  await page.waitForTimeout(650)
  await page.screenshot({
    path: resolve(out, 'glow-crop.png'),
    clip: { x: box.x - 22, y: box.y - 22, width: box.width + 44, height: box.height + 44 },
  })
  await ctx.close()
}

// ── FR ──
{
  const { ctx, page } = await open('fr')
  await toPeople(page)
  await page.locator('.infra-people-grid').screenshot({ path: resolve(out, 'section-fr.png') })
  audit.fr = { capText: await page.evaluate(() =>
    [...document.querySelectorAll('.infra-person-cap')].map((c) => c.textContent)) }
  await ctx.close()
}

// ── reduced-motion: static glow, no breathe, no lift ──
{
  const { ctx, page } = await open('en', true)
  await toPeople(page)
  const rm = await page.evaluate(() => {
    const first = document.querySelector('.infra-person')
    const after = getComputedStyle(first, '::after')
    return { animationName: after.animationName, opacity: after.opacity }
  })
  audit.reducedMotion = rm
  await page.locator('.infra-people-grid').screenshot({ path: resolve(out, 'reduced-motion.png') })
  await ctx.close()
}

// ── fps sample during a hover on the people grid ──
{
  const { ctx, page } = await open('en')
  await toPeople(page)
  const fps = await page.evaluate(async () => {
    await new Promise((r) => {
      const card = document.querySelector('.infra-person')
      card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      setTimeout(r, 100)
    })
    let frames = 0
    const t0 = performance.now()
    return await new Promise((res) => {
      function loop(t) {
        frames++
        if (t - t0 >= 1000) res(Math.round((frames * 1000) / (t - t0)))
        else requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    })
  })
  audit.fps = fps
  await ctx.close()
}

audit.consoleErrors = errors
audit.pass = {
  fourCards: audit.en.cardCount === 4,
  hostRelative: audit.en.hostPosition === 'relative',
  beforeRing: audit.en.before.content === '""' && audit.en.before.zIndex === '-2' && audit.en.before.pointerEvents === 'none',
  afterGlow: audit.en.after.content === '""' && audit.en.after.zIndex === '-1' && audit.en.after.filter.includes('blur'),
  breatheAnim: audit.en.after.animationName === 'infraGlowBreathe',
  noLayoutShift: audit.en.figureW === audit.en.panelW, // pseudos didn't widen the figure
  captionMin11: audit.en.capFs.every((f) => f >= 11),
  reducedStaticGlow: audit.reducedMotion.animationName === 'none' && parseFloat(audit.reducedMotion.opacity) > 0,
  fps55: audit.fps >= 55,
  zeroErrors: errors.length === 0,
}

await writeFile(resolve(out, 'audit.json'), JSON.stringify(audit, null, 2))
console.log(JSON.stringify(audit, null, 2))
await browser.close()
