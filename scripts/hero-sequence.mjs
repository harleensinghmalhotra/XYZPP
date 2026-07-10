// PHASE 3.4 R3 — THE SEQUENCE verification. Headed Playwright @ 1536×743.
// Artefacts → shots/hero-sequence/:
//   w0..w6.png       one frame per window, proving strict order (nothing early)
//   rev-a.png/b.png  reverse-scrub frames at two points (played backwards)
//   rev-diff.json    fwd vs reverse pixel diff at the same progress (purity)
//   fr.png           French typing frame
//   reduced.png      reduced-motion (everything landed + fully typed, no motion)
//   fps.json         fps across the extended pin
//   console.json     console errors during the run
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'hero-sequence')
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
async function yFor(page, p) {
  return page.evaluate((pp) => {
    const sec = document.querySelector('#hero')
    return pp * (sec.offsetHeight - window.innerHeight)
  }, p)
}
async function scrollTo(page, y) {
  await page.evaluate((yy) => { window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy) }, y)
  await page.waitForTimeout(160)
}
async function goP(page, p, settleMs = 650) {
  const y = await yFor(page, p)
  await scrollTo(page, y)
  await page.waitForTimeout(settleMs)
}
async function bookRegion(page) {
  const b = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#hero img'))
    const el = imgs.find((i) => (i.currentSrc || i.src).includes('qfp-book-cover'))
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  if (!b) return undefined
  const x = Math.max(0, Math.round(b.x)), y = Math.max(0, Math.round(b.y))
  return { x, y, width: Math.round(Math.min(VP.width - x, b.width)), height: Math.round(Math.min(VP.height - y, b.height)) }
}

const consoleErrors = []

// ── 1. Seven window frames + reverse-scrub + fps ──
{
  const { ctx, page } = await newPage()
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)

  // window sample progress (settled state at/near each window's completion)
  const windows = [
    ['w0', 0.15], // landed rest — blank book, nothing else
    ['w1', 0.26], // boy-red + bubble
    ['w2', 0.36], // girl-blonde + bubble
    ['w3', 0.46], // boy-green + bubble
    ['w4', 0.56], // girl-mustard + bubble (typing not started)
    ['w5', 0.86], // typing complete
    ['w6', 0.97], // settle — everything done, about to release
  ]
  for (const [name, p] of windows) {
    await goP(page, p)
    await page.screenshot({ path: resolve(out, `${name}.png`) })
    console.log(`✓ ${name}.png  p=${p}`)
  }

  // Count visible kids + typed chars at each window (programmatic order proof)
  const orderProbe = []
  for (const [name, p] of windows) {
    await goP(page, p, 700)
    const probe = await page.evaluate(() => {
      const vis = (el) => { const s = getComputedStyle(el); return Number(s.opacity) > 0.5 }
      const kids = Array.from(document.querySelectorAll('#hero [data-cut]')).filter((n) => vis(n)).map((n) => n.getAttribute('data-cut'))
      const typed = Array.from(document.querySelectorAll('#hero .tb-char.is-on')).length
      const total = Array.from(document.querySelectorAll('#hero .tb-char')).length
      return { kids, typed, total }
    })
    orderProbe.push({ window: name, p, ...probe })
  }
  await writeFile(resolve(out, 'order.json'), JSON.stringify(orderProbe, null, 2))
  console.log('✓ order.json', orderProbe.map((o) => `${o.window}:${o.kids.length}k/${o.typed}c`).join(' '))

  // REVERSE-SCRUB — reach a point by scrubbing FORWARD past it then BACK to it;
  // must equal the forward-only state at the same progress (purity), and shows
  // the sequence running backwards (kids un-pop, text untypes).
  async function reverseVsForward(p, tag) {
    // forward-only
    await scrollTo(page, 0); await page.waitForTimeout(200)
    await goP(page, p, 750)
    const region = await bookRegion(page)
    const fwd = await page.screenshot({ clip: region })
    // reverse: overshoot then come back
    await goP(page, 1.0, 350)
    await goP(page, p, 750)
    const rev = await page.screenshot({ path: resolve(out, `${tag}.png`), clip: region })
    // pixel diff
    const ra = await sharp(fwd).raw().toBuffer({ resolveWithObject: true })
    const rb = (await sharp(rev).raw().toBuffer({ resolveWithObject: true })).data
    const a = ra.data, n = Math.min(a.length, rb.length)
    let diffPx = 0
    for (let i = 0; i < n; i += 4) { if (Math.abs(a[i] - rb[i]) + Math.abs(a[i + 1] - rb[i + 1]) + Math.abs(a[i + 2] - rb[i + 2]) > 24) diffPx++ }
    return { p, tag, pctPixelsDiffer: +((100 * diffPx) / (n / 4)).toFixed(3) }
  }
  const revA = await reverseVsForward(0.40, 'rev-a') // mid kid sequence (W3)
  const revB = await reverseVsForward(0.72, 'rev-b') // mid typing (W5)
  await writeFile(resolve(out, 'rev-diff.json'), JSON.stringify({ revA, revB, pure: revA.pctPixelsDiffer < 0.5 && revB.pctPixelsDiffer < 0.5 }, null, 2))
  console.log('✓ rev-a/rev-b  purity', revA.pctPixelsDiffer, revB.pctPixelsDiffer)

  // fps across the extended pin
  const fps = await page.evaluate(
    () => new Promise((res) => {
      const sec = document.querySelector('#hero')
      const maxY = sec.offsetHeight - window.innerHeight
      const start = performance.now(); let last = start; const deltas = []
      function frame(now) {
        deltas.push(now - last); last = now
        const t = (now - start) / 4000
        const y = Math.min(1, t) * maxY
        window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)
        if (now - start < 4000) requestAnimationFrame(frame)
        else { const d = deltas.slice(2).sort((a, b) => a - b); res({ frames: d.length, medianFps: +(1000 / d[Math.floor(d.length / 2)]).toFixed(1), worstFrameMs: +d[Math.floor(d.length * 0.95)].toFixed(1) }) }
      }
      requestAnimationFrame(frame)
    }),
  )
  await writeFile(resolve(out, 'fps.json'), JSON.stringify({ viewport: VP, dpr: DPR, ...fps, medianAbove55: fps.medianFps >= 55 }, null, 2))
  console.log('✓ fps.json', fps)
  await ctx.close()
}

// ── 2. French typing frame ──
{
  const { ctx, page } = await newPage({ lang: 'fr' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await goP(page, 0.74)
  await page.screenshot({ path: resolve(out, 'fr.png') })
  console.log('✓ fr.png')
  await ctx.close()
}

// ── 3. Reduced-motion (everything landed + fully typed, no sequence) ──
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await page.screenshot({ path: resolve(out, 'reduced.png') })
  console.log('✓ reduced.png')
  await ctx.close()
}

await writeFile(resolve(out, 'console.json'), JSON.stringify({ errors: consoleErrors, count: consoleErrors.length }, null, 2))
console.log(consoleErrors.length ? `! console errors: ${consoleErrors.length}` : '✓ zero console errors')

await browser.close()
console.log('\nAll hero-sequence artefacts →', out)
