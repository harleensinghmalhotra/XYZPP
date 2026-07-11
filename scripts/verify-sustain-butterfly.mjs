import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5250'
const out = resolve(root, 'shots', 'sustainability-butterfly')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ headless: false })
const errors = []

async function open({ reduced = false, lang = 'en' } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1536, height: 743 },
    deviceScaleFactor: 1.25,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  await ctx.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${lang}${reduced ? ',reduced' : ''}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${lang}] pageerror: ${e.message}`))
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  // bring the section into view via Lenis (immediate, so scroll settles), kill header
  await page.evaluate(() => {
    const el = document.getElementById('sustainability')
    const y = el.getBoundingClientRect().top + window.scrollY - (window.innerHeight - el.offsetHeight) / 2
    if (window.__lenis) { window.__lenis.scrollTo(y, { immediate: true }); window.__lenis.stop() }
    else window.scrollTo(0, y)
    const n = document.querySelector('header, nav'); if (n) n.style.visibility = 'hidden'
  })
  await page.waitForTimeout(700)
  return { ctx, page }
}

// clip-based (no stability wait — safe over animating elements)
async function clip(page, sel, full) {
  return page.evaluate(({ sel, full }) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (full) return { x: 0, y: Math.max(0, r.top), width: 1536, height: Math.min(743, r.height) }
    return { x: Math.max(0, Math.floor(r.left)), y: Math.max(0, Math.floor(r.top)), width: Math.ceil(r.width), height: Math.ceil(r.height) }
  }, { sel, full })
}

async function shootSection(page, name) {
  const box = await clip(page, '#sustainability', true)
  await page.screenshot({ path: resolve(out, `${name}.png`), clip: box })
}

async function shootClip(page, sel, name) {
  const box = await clip(page, sel, false)
  if (box && box.width > 0 && box.height > 0) await page.screenshot({ path: resolve(out, `${name}.png`), clip: box })
}

// ── EN: section + a run of frames across the flight path ──────────────────────
{
  const { ctx, page } = await open({ lang: 'en' })
  await shootSection(page, 'section-en')
  await shootClip(page, '.svA-chip', 'chip-en')
  // 6 frames sampled ~2.5s apart → covers >15s of the 15s / 18.5s drift loops
  for (let i = 0; i < 6; i++) {
    await shootSection(page, `flight-${i}`)
    await page.waitForTimeout(2500)
  }
  // wing-flap mid-frame: sample four frames ~205ms apart inside one ~0.82s flap
  for (let i = 0; i < 4; i++) {
    await shootClip(page, '.bfly-1', `flap-${i}`)
    await page.waitForTimeout(205)
  }
  // butterfly geometry sanity: report positions relative to the chip
  const geo = await page.evaluate(() => {
    const frame = document.querySelector('.svA-frame').getBoundingClientRect()
    const chip = document.querySelector('.svA-chip').getBoundingClientRect()
    const bs = [...document.querySelectorAll('.bfly')].map((b) => {
      const r = b.getBoundingClientRect()
      return { top: Math.round(r.top - frame.top), left: Math.round(r.left - frame.left), w: Math.round(r.width) }
    })
    return { frameH: Math.round(frame.height), chipTop: Math.round(chip.top - frame.top), butterflies: bs, wings: document.querySelectorAll('.bfly-wing').length }
  })
  console.log('EN geometry:', JSON.stringify(geo))
  await ctx.close()
}

// ── FR ────────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await open({ lang: 'fr' })
  const chipText = await page.$eval('.svA-chip', (el) => el.textContent.replace(/\s+/g, ' ').trim())
  console.log('FR chip text:', chipText)
  await shootSection(page, 'section-fr')
  await shootClip(page, '.svA-chip', 'chip-fr')
  await ctx.close()
}

// ── reduced-motion: butterflies must be static, wings open ────────────────────
{
  const { ctx, page } = await open({ lang: 'en', reduced: true })
  const p1 = await page.$eval('.bfly-1', (el) => el.getBoundingClientRect().left)
  await page.waitForTimeout(1500)
  const p2 = await page.$eval('.bfly-1', (el) => el.getBoundingClientRect().left)
  const anim = await page.$eval('.bfly-1 .bfly-wing-r', (el) => getComputedStyle(el).animationName)
  console.log(`reduced-motion: drift Δx=${Math.abs(p2 - p1).toFixed(2)}px (want 0)  wing animationName=${anim} (want none)`)
  await shootSection(page, 'section-reduced')
  await ctx.close()
}

// ── contrast: chip label + code luminance vs plate ground ─────────────────────
{
  const { ctx, page } = await open({ lang: 'en' })
  const contrast = await page.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.match(/\d+\.?\d*/g).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (a, b) => { const [hi, lo] = [lum(a) + 0.05, lum(b) + 0.05].sort((x, y) => y - x); return (hi / lo).toFixed(2) }
    const chip = document.querySelector('.svA-chip')
    const bg = getComputedStyle(chip).backgroundColor
    return {
      label: ratio(getComputedStyle(document.querySelector('.svA-chip-label')).color, bg),
      code: ratio(getComputedStyle(document.querySelector('.svA-chip-code')).color, bg),
    }
  })
  console.log('chip contrast vs plate — label:', contrast.label, ' code:', contrast.code, '(AA text ≥4.5)')
  await ctx.close()
}

// ── fps while the butterflies animate ─────────────────────────────────────────
{
  const { ctx, page } = await open({ lang: 'en' })
  const fps = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now()
    const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round((n / (performance.now() - t0)) * 1000)) }
    requestAnimationFrame(tick)
  }))
  console.log('fps over 2s:', fps)
  await ctx.close()
}

console.log('\nconsole errors:', errors.length ? errors : 'NONE')
await browser.close()
console.log('DONE →', out)
