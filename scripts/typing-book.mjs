// PHASE 3.4 — Typing book verification harness. Headed Playwright @ 1536×743.
// Artefacts → shots/typing-book/:
//   type-00..05.png    six frames across the reveal (progressive typing)
//   fast.png / slow.png  same progress reached fast vs slow (scrub-purity proof)
//   scrub-diff.json    pixel diff of fast vs slow (must be ~0)
//   fr.png             French mid-typing frame
//   reduced.png        prefers-reduced-motion (fully-typed, static)
//   closeup.png        book crop at full typing — text fits the page planes
//   fps.json           pin-scroll fps
//   console.json       any console errors during the run
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'typing-book')
mkdirSync(out, { recursive: true })
const URL = process.env.HERO_URL || 'http://localhost:5173'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

const browser = await chromium.launch({ headless: false })

async function newPage({ reducedMotion, lang } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion })
  const page = await ctx.newPage()
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  return { ctx, page }
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
  await page.waitForTimeout(180)
}
// bloom/typing window scroll Y for a given progress 0..1
async function yForProgress(page, p) {
  return page.evaluate((pp) => {
    const pinEnd = window.innerHeight * 1.5
    const start = pinEnd - 262
    const end = pinEnd + 140
    return start + pp * (end - start)
  }, p)
}
async function bookClip(page) {
  const box = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#hero img'))
    const b = imgs.find((i) => (i.currentSrc || i.src).includes('qfp-book-cover'))
    if (!b) return null
    const r = b.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  return box
}

const consoleErrors = []

// ── 1. Six progressive typing frames + FR + fast/slow purity ──
{
  const { ctx, page } = await newPage()
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)

  const stops = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  for (let i = 0; i < stops.length; i++) {
    const y = await yForProgress(page, stops[i])
    await scrollTo(page, y)
    await page.waitForTimeout(260)
    await page.screenshot({ path: resolve(out, `type-0${i}.png`) })
    console.log(`✓ type-0${i}.png  p=${stops[i]}  y=${Math.round(y)}`)
  }

  // close-up at full typing — crop the book
  const yFull = await yForProgress(page, 1.0)
  await scrollTo(page, yFull)
  await page.waitForTimeout(300)
  const clip = await bookClip(page)
  if (clip) {
    const pad = 10
    await page.screenshot({
      path: resolve(out, 'closeup.png'),
      clip: { x: Math.max(0, clip.x - pad), y: Math.max(0, clip.y - pad), width: Math.min(VP.width, clip.width + pad * 2), height: Math.min(VP.height, clip.height + pad * 2) },
    })
    console.log('✓ closeup.png')
  }

  // Z-ORDER — capture frames through the book RISE (main pin), where the book
  // passes over the headline. At no frame may a headline glyph render over the
  // book/pages. Also measure: does any headline pixel sit in front of the book?
  // stops where the risen book overlaps the giant title ghost (3× scale) — the
  // clearest proof the headline paints BEHIND the book / pages
  const zStops = [960, 1040, 1094, 1160]
  for (let i = 0; i < zStops.length; i++) {
    await scrollTo(page, zStops[i])
    await page.waitForTimeout(320)
    await page.screenshot({ path: resolve(out, `zorder-${i}.png`) })
  }
  // Programmatic z-order check: the book image must paint ABOVE the headline.
  // Sample the DOM stacking — headline wrapper z vs riseWrap z (computed).
  const zInfo = await page.evaluate(() => {
    const headline = document.querySelector('#hero [class*="pt-\\[23vh\\]"]') || document.querySelectorAll('#hero .absolute')[0]
    const rise = document.querySelector('#hero .z-\\[15\\]')
    const zi = (el) => el ? Number(getComputedStyle(el).zIndex) || 0 : null
    return { headlineZ: zi(headline), riseZ: zi(rise), bookAboveHeadline: (zi(rise) ?? -1) > (zi(headline) ?? 999) }
  })
  await writeFile(resolve(out, 'zorder.json'), JSON.stringify(zInfo, null, 2))
  console.log('✓ zorder-0..3.png  bookAboveHeadline=', zInfo.bookAboveHeadline, zInfo)

  // SCRUB PURITY — reach p=0.5 two ways, settle fully (scrub 0.3 catch-up), then
  // pixel-diff the BOOK CROP (where the text lives) to prove same progress = same
  // glyphs regardless of scroll speed.
  const yMid = await yForProgress(page, 0.5)
  // (a) FAST: jump straight there
  await scrollTo(page, 0)
  await page.waitForTimeout(200)
  await scrollTo(page, yMid)
  await page.waitForTimeout(750)
  const clipM = await bookClip(page)
  // integer clip so fast & slow shots share EXACT dimensions (no resize → no
  // sub-pixel misalignment inflating the diff on text edges)
  const rx = Math.max(0, Math.round(clipM ? clipM.x : 0))
  const ry = Math.max(0, Math.round(clipM ? clipM.y : 0))
  const region = clipM ? { x: rx, y: ry, width: Math.round(Math.min(VP.width - rx, clipM.width)), height: Math.round(Math.min(VP.height - ry, clipM.height)) } : undefined
  const fast = await page.screenshot({ path: resolve(out, 'fast.png'), clip: region })
  // (b) SLOW: creep in 24 small steps
  await scrollTo(page, 0)
  await page.waitForTimeout(200)
  for (let s = 1; s <= 24; s++) { await scrollTo(page, (yMid * s) / 24); await page.waitForTimeout(20) }
  await page.waitForTimeout(750)
  const slow = await page.screenshot({ path: resolve(out, 'slow.png'), clip: region })
  // real pixel diff (mean abs per channel + % of pixels that differ meaningfully).
  // Both shots are the same integer clip → identical dims, direct compare.
  const ra = await sharp(fast).raw().toBuffer({ resolveWithObject: true })
  const rbo = await sharp(slow).raw().toBuffer({ resolveWithObject: true })
  const rb = rbo.data
  const a = ra.data, n = Math.min(a.length, rb.length)
  let sum = 0, diffPx = 0
  for (let i = 0; i < n; i += 4) {
    const d = Math.abs(a[i] - rb[i]) + Math.abs(a[i + 1] - rb[i + 1]) + Math.abs(a[i + 2] - rb[i + 2])
    sum += d
    if (d > 24) diffPx++
  }
  const totalPx = n / 4
  const report = { progress: 0.5, meanAbsDiffPerPixel: +(sum / totalPx).toFixed(3), pctPixelsDiffer: +((100 * diffPx) / totalPx).toFixed(3), pure: (100 * diffPx) / totalPx < 0.5, note: 'book-crop pixel diff of same progress reached fast vs slow; ~0 proves scrub-purity' }
  await writeFile(resolve(out, 'scrub-diff.json'), JSON.stringify(report, null, 2))
  console.log('✓ fast.png / slow.png  pctPixelsDiffer=', report.pctPixelsDiffer, 'pure=', report.pure)

  await ctx.close()
}

// ── 2. French mid-typing frame ──
{
  const { ctx, page } = await newPage({ lang: 'fr' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  const y = await yForProgress(page, 0.7)
  await scrollTo(page, y)
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(out, 'fr.png') })
  console.log('✓ fr.png')
  await ctx.close()
}

// ── 3. Reduced-motion (fully typed, static) ──
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await page.screenshot({ path: resolve(out, 'reduced.png') })
  console.log('✓ reduced.png')
  await ctx.close()
}

// ── 4. Pin-scroll fps ──
{
  const { ctx, page } = await newPage()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  const fps = await page.evaluate(
    () => new Promise((res) => {
      const start = performance.now()
      let last = start
      const deltas = []
      const maxY = window.innerHeight * 1.6
      function frame(now) {
        deltas.push(now - last); last = now
        const t = (now - start) / 3000
        const y = Math.min(1, t) * maxY
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
        if (now - start < 3000) requestAnimationFrame(frame)
        else {
          const d = deltas.slice(2).sort((a, b) => a - b)
          res({ frames: d.length, medianFps: +(1000 / d[Math.floor(d.length / 2)]).toFixed(1), worstFrameMs: +d[Math.floor(d.length * 0.95)].toFixed(1) })
        }
      }
      requestAnimationFrame(frame)
    }),
  )
  console.log('  fps', fps)
  await writeFile(resolve(out, 'fps.json'), JSON.stringify({ viewport: VP, dpr: DPR, ...fps, medianAbove55: fps.medianFps >= 55 }, null, 2))
  console.log('✓ fps.json')
  await ctx.close()
}

await writeFile(resolve(out, 'console.json'), JSON.stringify({ errors: consoleErrors, count: consoleErrors.length }, null, 2))
console.log(consoleErrors.length ? `! console errors: ${consoleErrors.length}` : '✓ zero console errors')

await browser.close()

// ── Side-by-side: our full-typing frame vs Ekta's vibe-coded mockup ──
try {
  const ref = resolve(root, 'recon', 'ekta-assets', 'powering-global-education-through-print-.webp')
  const H = 620
  const ours = await sharp(resolve(out, 'type-05.png')).resize({ height: H }).toBuffer()
  const theirs = await sharp(ref).resize({ height: H }).toBuffer()
  const om = await sharp(ours).metadata()
  const tm = await sharp(theirs).metadata()
  const gap = 24
  await sharp({ create: { width: om.width + tm.width + gap, height: H, channels: 3, background: '#0c2f4a' } })
    .composite([{ input: ours, left: 0, top: 0 }, { input: theirs, left: om.width + gap, top: 0 }])
    .png()
    .toFile(resolve(out, 'compare-ekta.png'))
  console.log('✓ compare-ekta.png (ours | Ekta mockup)')
} catch (e) {
  console.log('! compare-ekta skipped:', e.message)
}

console.log('\nAll typing-book artefacts →', out)
