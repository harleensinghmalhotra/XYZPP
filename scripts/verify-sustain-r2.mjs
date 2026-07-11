import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5251'
const out = resolve(root, 'shots', 'sustainability-r2')
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

async function clip(page, sel, full, pad = 0) {
  return page.evaluate(({ sel, full, pad }) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (full) return { x: 0, y: Math.max(0, r.top), width: 1536, height: Math.min(743, r.height) }
    return { x: Math.max(0, Math.floor(r.left - pad)), y: Math.max(0, Math.floor(r.top - pad)), width: Math.ceil(r.width + pad * 2), height: Math.ceil(r.height + pad * 2) }
  }, { sel, full, pad })
}

async function shootSection(page, name) {
  const box = await clip(page, '#sustainability', true)
  await page.screenshot({ path: resolve(out, `${name}.png`), clip: box })
}
async function shootClip(page, sel, name, pad = 0) {
  const box = await clip(page, sel, false, pad)
  if (box && box.width > 0 && box.height > 0) await page.screenshot({ path: resolve(out, `${name}.png`), clip: box })
}

// ── THE SNAIL TEST — butterfly close-up, STATIC (reduced), attached first ─────
{
  const { ctx, page } = await open({ lang: 'en', reduced: true })
  await shootClip(page, '.bfly', 'AA-snail-test-butterfly', 14)
  await ctx.close()
}

// ── EN full scene + element inventory + a run across the drift ────────────────
{
  const { ctx, page } = await open({ lang: 'en' })
  await shootSection(page, 'scene-en')
  const inv = await page.evaluate(() => ({
    clouds: document.querySelectorAll('.scn-cloud').length,
    sunDisc: !!document.querySelector('.scn-sun-disc'),
    sunRays: document.querySelectorAll('.scn-sun-rays path').length,
    plantLeaves: document.querySelectorAll('.scn-leaf').length,
    grassBlades: document.querySelectorAll('.scn-grass path').length,
    wingLobes: document.querySelectorAll('.bfly-wing-fill').length,
    body: !!document.querySelector('.bfly-body-fill'),
    antennae: document.querySelectorAll('.bfly-antenna').length,
  }))
  console.log('scene inventory:', JSON.stringify(inv))
  for (let i = 0; i < 4; i++) {
    await shootSection(page, `drift-${i}`)
    await page.waitForTimeout(2600)
  }
  // greenery sway mid-frame (grass crop)
  await shootClip(page, '.scn-grass', 'grass-sway', 6)
  // butterfly close-up while flapping (a couple of phases)
  for (let i = 0; i < 3; i++) { await shootClip(page, '.bfly', `bfly-live-${i}`, 14); await page.waitForTimeout(300) }
  await ctx.close()
}

// ── FR full scene ─────────────────────────────────────────────────────────────
{
  const { ctx, page } = await open({ lang: 'fr' })
  const chipText = await page.$eval('.svA-chip', (el) => el.textContent.replace(/\s+/g, ' ').trim())
  console.log('FR chip text:', chipText)
  await shootSection(page, 'scene-fr')
  await ctx.close()
}

// ── reduced-motion: nothing moves ─────────────────────────────────────────────
{
  const { ctx, page } = await open({ lang: 'en', reduced: true })
  const p1 = await page.$eval('.bfly', (el) => el.getBoundingClientRect().left)
  await page.waitForTimeout(1600)
  const p2 = await page.$eval('.bfly', (el) => el.getBoundingClientRect().left)
  const wingAnim = await page.$eval('.bfly-wings', (el) => getComputedStyle(el).animationName)
  const grassAnim = await page.$eval('.scn-grass path', (el) => getComputedStyle(el).animationName)
  console.log(`reduced-motion: butterfly Δx=${Math.abs(p2 - p1).toFixed(2)}px  wingAnim=${wingAnim}  grassAnim=${grassAnim} (all want 0/none)`)
  await shootSection(page, 'scene-reduced')
  await ctx.close()
}

// ── fps ───────────────────────────────────────────────────────────────────────
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
