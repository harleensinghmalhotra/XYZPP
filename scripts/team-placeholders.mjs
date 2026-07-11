// TEAM PLACEHOLDERS verification — headed Playwright @ 1536×743 DPR 1.25.
// Territory: the "600+ Hands Behind Every Shipment" people block in the homepage
// Infrastructure section. Evidence → shots/team-placeholders/:
//   section-en.png / section-fr.png   — the 4 team placeholder cards (EN + FR)
//   ribbon-placeholder.png            — placeholder + any corner ribbon together
//   hover.png                         — a card under :hover (gold warm-up)
//   audit.json                        — caption font-size (≥11px), AA contrast,
//                                        console errors, photo/img absence
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'team-placeholders')
mkdirSync(out, { recursive: true })
const BASE = process.env.URL || 'http://localhost:5196'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

function contrast(hex1, hex2) {
  const lum = (hex) => {
    const c = hex.replace('#', '')
    const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

const browser = await chromium.launch({ headless: false })
const errors = []

async function open(lang) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${lang}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${lang}] pageerror ${e.message}`))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  if (lang === 'fr') {
    // toggle to FR via the language switch (persist in localStorage + reload)
    await page.evaluate(() => { try { localStorage.setItem('qfp.lang', 'fr') } catch {} })
    await page.reload({ waitUntil: 'networkidle' })
  }
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch {}
  await page.waitForTimeout(600)
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

// ── EN ──
{
  const { ctx, page } = await open('en')
  await toPeople(page)
  const grid = page.locator('.infra-people-grid')
  await grid.screenshot({ path: resolve(out, 'section-en.png') })
  // whole people block (heading + cards) for context
  await page.locator('.infra-people').screenshot({ path: resolve(out, 'ribbon-placeholder.png') })

  // measurements on the first card
  const m = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.infra-person')]
    const caps = [...document.querySelectorAll('.infra-people-grid .infra-ph-cap')]
    const icons = document.querySelectorAll('.infra-people-grid .infra-ph-icon')
    const imgs = document.querySelectorAll('.infra-people-grid img, .infra-people-grid .infra-photo-img')
    const capFs = caps.map((c) => parseFloat(getComputedStyle(c).fontSize))
    const capColor = caps[0] && getComputedStyle(caps[0]).color
    const ground = document.querySelector('.infra-people-grid .infra-ph')
    const groundBg = ground && getComputedStyle(ground).backgroundColor
    const capText = caps.map((c) => c.textContent)
    const radius = ground && getComputedStyle(ground).borderTopLeftRadius
    return {
      cardCount: cards.length, capCount: caps.length, iconCount: icons.length,
      imgCount: imgs.length, capFs, capColor, groundBg, capText, radius,
    }
  })
  audit.en = m
  await ctx.close()
}

// hover on EN card
{
  const { ctx, page } = await open('en')
  await toPeople(page)
  const first = page.locator('.infra-person').first()
  await first.hover()
  await page.waitForTimeout(500)
  await page.locator('.infra-people-grid').screenshot({ path: resolve(out, 'hover.png') })
  await ctx.close()
}

// ── FR ──
{
  const { ctx, page } = await open('fr')
  await toPeople(page)
  await page.locator('.infra-people-grid').screenshot({ path: resolve(out, 'section-fr.png') })
  const capText = await page.evaluate(() =>
    [...document.querySelectorAll('.infra-people-grid .infra-ph-cap')].map((c) => c.textContent))
  audit.fr = { capText }
  await ctx.close()
}

// contrast: light-gold caption #e6bd6a on deep-navy #0f2444
audit.captionContrast = +contrast('#e6bd6a', '#0f2444').toFixed(2)
audit.iconContrast = +contrast('#d3ab57', '#0f2444').toFixed(2)
audit.consoleErrors = errors
audit.pass = {
  fourCards: audit.en.cardCount === 4 && audit.en.iconCount === 4 && audit.en.capCount === 4,
  noPhotos: audit.en.imgCount === 0,
  captionMin11: audit.en.capFs.every((f) => f >= 11),
  squareCorners: audit.en.radius === '0px',
  captionAA: audit.captionContrast >= 4.5,
  zeroErrors: errors.length === 0,
  frTranslated: audit.fr.capText.some((t) => /ÉQUIPE|QUALITÉ|ASSEMBLAGE|DIRECTION/i.test(t || '')),
}

await writeFile(resolve(out, 'audit.json'), JSON.stringify(audit, null, 2))
console.log(JSON.stringify(audit, null, 2))
await browser.close()
