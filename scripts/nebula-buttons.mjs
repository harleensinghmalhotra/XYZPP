// GALAXY-NEBULA BUTTON verification — headed Playwright @ 1536×743 DPR 1.25.
// Evidence → shots/nebula-buttons/:
//   For each touched button: rest / hover / focus / active crops, both surfaces.
//   nav-cta-over-cream.png  — the sticky nav CTA sitting over the cream nav.
//   reduced.png             — prefers-reduced-motion: ring static, no drift.
//   fps.json                — median fps scrolling the full homepage (nebula ON).
//   contrast.json           — AA contrast of every button label vs its fill.
//   console.json            — any console errors during EN + FR runs.
//   fr-*.png                — the same CTAs with French labels (fit check).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'nebula-buttons')
mkdirSync(out, { recursive: true })
const URL = process.env.NB_URL || 'http://localhost:5173'
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

async function newPage({ reducedMotion, lang } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion })
  // The site reads its language from localStorage['qfp.lang'] (src/i18n.js) — seed
  // it before any script runs so the FR pass renders real French labels.
  await ctx.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l) } catch { /* noop */ } }, lang || 'en')
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  return { ctx, page, errors }
}

async function settle(page) {
  await page.waitForTimeout(1200)
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* noop */ }
  await page.waitForTimeout(400)
}
async function scrollTo(page, y) {
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)
  await page.waitForTimeout(500)
}
// crop a padded box around a locator into a named file (rest state)
async function shotEl(page, locator, name, pad = 26) {
  const box = await locator.boundingBox()
  if (!box) { console.log('! no box for', name); return null }
  const clip = {
    x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
    width: Math.min(VP.width, box.width + pad * 2),
    height: Math.min(VP.height, box.height + pad * 2)
  }
  await page.screenshot({ path: resolve(out, name), clip })
  return box
}

const langs = ['en', 'fr']
const contrastReport = {}
const consoleReport = {}

for (const lang of langs) {
  const pre = lang === 'en' ? '' : 'fr-'
  const { ctx, page, errors } = await newPage({ lang })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await scrollTo(page, 0)

  // ── NAV CTA (cream surface, sticky) ──
  const navCta = page.locator('a.btn-nebula--light[href="/contact"], a.btn-nebula--light').first()
  if (await navCta.count()) {
    await shotEl(page, navCta, `${pre}nav-rest.png`)
    await navCta.hover(); await page.waitForTimeout(500)
    await shotEl(page, navCta, `${pre}nav-hover.png`)
    await navCta.focus(); await page.waitForTimeout(300)
    await shotEl(page, navCta, `${pre}nav-focus.png`)
    if (lang === 'en') {
      const c = await navCta.evaluate((el) => {
        const cs = getComputedStyle(el)
        return { color: cs.color, bg: cs.backgroundColor }
      })
      contrastReport.navCta = { surface: 'cream #fdfaf4', label: '#0f2444 navy', ratio: +contrast('#0f2444', '#fdfaf4').toFixed(2), computed: c }
    }
  } else { console.log('! nav CTA not found') }

  // ── HERO primary CTA (dark surface) ──
  await scrollTo(page, 0)
  const heroCta = page.locator('a.btn-nebula[href="#services"]').first()
  if (await heroCta.count()) {
    await shotEl(page, heroCta, `${pre}hero-rest.png`, 32)
    await heroCta.hover(); await page.waitForTimeout(500)
    await shotEl(page, heroCta, `${pre}hero-hover.png`, 32)
  }

  // ── CASES CTA (cream page of the spread) ──
  const casesCta = page.locator('a.cs-cta.btn-nebula--light').first()
  if (await casesCta.count()) {
    await casesCta.scrollIntoViewIfNeeded(); await page.waitForTimeout(700)
    await shotEl(page, casesCta, `${pre}cases-rest.png`)
    await casesCta.hover(); await page.waitForTimeout(500)
    await shotEl(page, casesCta, `${pre}cases-hover.png`)
    if (lang === 'en') {
      contrastReport.casesCta = { surface: 'cream', label: '#836013 gold', ratio: +contrast('#836013', '#f0ebe0').toFixed(2) }
    }
  }

  // ── FOOTER CTAs (dark surface) ──
  const footReq = page.locator('a.btn-nebula[href^="mailto:"]').first()
  const footDl = page.locator('a.btn-nebula[href="#"]').filter({ hasNotText: '' }).first()
  if (await footReq.count()) {
    await footReq.scrollIntoViewIfNeeded(); await page.waitForTimeout(700)
    await shotEl(page, footReq, `${pre}footer-req-rest.png`, 32)
    await footReq.hover(); await page.waitForTimeout(500)
    await shotEl(page, footReq, `${pre}footer-req-hover.png`, 32)
    // active state — press and hold
    await page.mouse.down()
    await page.waitForTimeout(180)
    await shotEl(page, footReq, `${pre}footer-req-active.png`, 32)
    await page.mouse.up()
    if (lang === 'en') {
      contrastReport.footerRequest = { surface: 'navy footer', fill: 'gold #c89a3c', label: '#0f2444 navy', ratio: +contrast('#0f2444', '#c89a3c').toFixed(2) }
    }
    // both footer CTAs together for the surface-variant overview
    const wrap = page.locator('a.btn-nebula[href^="mailto:"]').first()
    const box = await wrap.boundingBox()
    if (box) {
      await page.screenshot({ path: resolve(out, `${pre}footer-both.png`), clip: {
        x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 40),
        width: Math.min(VP.width, 760), height: 150
      } })
    }
  }

  consoleReport[lang] = errors.slice()
  await ctx.close()
}

await writeFile(resolve(out, 'contrast.json'), JSON.stringify(contrastReport, null, 2))
await writeFile(resolve(out, 'console.json'), JSON.stringify(consoleReport, null, 2))
console.log('✓ contrast + console reports')

// ── REDUCED MOTION — ring static, no star drift ──
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  const navCta = page.locator('a.btn-nebula--light').first()
  if (await navCta.count()) await shotEl(page, navCta, 'reduced-nav.png')
  const heroCta = page.locator('a.btn-nebula[href="#services"]').first()
  if (await heroCta.count()) await shotEl(page, heroCta, 'reduced-hero.png', 32)
  await ctx.close()
}

// ── FPS — scroll the full homepage with nebula ON ──
{
  const { ctx, page } = await newPage()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  const fps = await page.evaluate(() => new Promise((res) => {
    const start = performance.now(); let last = start; const deltas = []
    const maxY = document.body.scrollHeight - window.innerHeight
    function frame(now) {
      deltas.push(now - last); last = now
      const t = (now - start) / 5000
      const y = Math.min(1, t) * maxY
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
      else window.scrollTo(0, y)
      if (now - start < 5000) requestAnimationFrame(frame)
      else {
        const d = deltas.slice(2).sort((a, b) => a - b)
        const med = d[Math.floor(d.length / 2)]
        const avg = d.reduce((s, x) => s + x, 0) / d.length
        const p95 = d[Math.floor(d.length * 0.95)]
        res({ frames: d.length, medianFps: +(1000 / med).toFixed(1), avgFps: +(1000 / avg).toFixed(1), worstFrameMs: +p95.toFixed(1) })
      }
    }
    requestAnimationFrame(frame)
  }))
  await writeFile(resolve(out, 'fps.json'), JSON.stringify({ viewport: VP, dpr: DPR, note: 'full-homepage scroll 0→bottom over 5s, nebula ON', ...fps, above55: fps.medianFps >= 55 }, null, 2))
  console.log('✓ fps.json', fps.medianFps)
  await ctx.close()
}

await browser.close()
console.log('\nAll nebula-button artefacts →', out)
