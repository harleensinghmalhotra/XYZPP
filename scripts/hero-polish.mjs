// HERO POLISH verification — bubble foil text + page-text-from-top.
// Headed Playwright @ 1536×743, DPR 1.25. Artefacts → shots/hero-polish/.
//   full-en.png / full-fr.png            all 4 bubbles + book, sp≈0.58
//   pages-top-en.png / pages-top-fr.png  full-typing (sp 1.0) — text hugs page tops
//   typing-mid-en.png                    mid-typing from the new top origin
//   seq-1..4.png                         the 4-bubble reveal order (red→blonde→green→mustard)
//   bubble-<key>-en.png / -fr.png        per-bubble close-ups
//   shimmer-<key>.png                    a mid-sweep foil frame per bubble
//   reduced.png                          prefers-reduced-motion (static, no shimmer)
//   contrast.json                        per-bubble AA (navy sentence + foil gold vs cream ground)
//   console.json                         console errors across the run
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'hero-polish')
mkdirSync(out, { recursive: true })
const URL = process.env.HERO_URL || 'http://localhost:5199'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

const browser = await chromium.launch({ headless: false })
const consoleErrors = []

async function newPage({ reducedMotion, lang } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  return { ctx, page }
}
async function settle(page) {
  await page.waitForTimeout(1200)
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* noop */ }
  await page.waitForTimeout(400)
}
// scroll to a fraction of the hero section's scroll distance (== ScrollTrigger sp)
async function scrollToSp(page, sp) {
  const y = await page.evaluate((s) => {
    const sec = document.querySelector('#hero')
    const dist = sec.offsetHeight - window.innerHeight
    return Math.round(s * dist)
  }, sp)
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true }); else window.scrollTo(0, yy)
  }, y)
  await page.waitForTimeout(220)
  return y
}
// bounding boxes of the 4 speech-bubble images, keyed by their kid
async function bubbleBoxes(page) {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#hero img')).filter((i) => (i.currentSrc || i.src).includes('qfp-bubble'))
    // order in DOM == BUBBLES order: mustard, red, blonde, green
    const keys = ['mustard', 'red', 'blonde', 'green']
    return imgs.map((i, n) => { const r = i.getBoundingClientRect(); return { key: keys[n], x: r.x, y: r.y, width: r.width, height: r.height } })
  })
}
async function cropBubble(page, box, file, pad = 6) {
  const clip = {
    x: Math.max(0, Math.round(box.x - pad)),
    y: Math.max(0, Math.round(box.y - pad)),
    width: Math.round(Math.min(VP.width, box.width + pad * 2)),
    height: Math.round(Math.min(VP.height, box.height + pad * 2)),
  }
  await page.screenshot({ path: resolve(out, file), clip })
  return clip
}

// relative luminance + contrast ratio for a sRGB triplet
function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function contrast(a, b) { const L1 = lum(a), L2 = lum(b); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return +((hi + 0.05) / (lo + 0.05)).toFixed(2) }

// sample the cream bubble ground: median of the brightest 25% of pixels in a crop
async function groundColor(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const px = []
  for (let i = 0; i < data.length; i += info.channels) px.push([data[i], data[i + 1], data[i + 2], lum([data[i], data[i + 1], data[i + 2]])])
  px.sort((a, b) => b[3] - a[3])
  const top = px.slice(0, Math.max(1, Math.floor(px.length * 0.25)))
  const m = top[Math.floor(top.length / 2)]
  return [m[0], m[1], m[2]]
}

// median of the ACTUAL rendered gold foil pixels (body of the numerals): gold =
// warm, dark, clearly not the cream ground and not navy. Returns null if none.
async function foilColor(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const gold = []
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (b < 95 && r - b > 55 && r > 90 && r < 205 && g < r && g > b) gold.push([r, g, b, lum([r, g, b])])
  }
  if (!gold.length) return null
  gold.sort((a, b) => a[3] - b[3])
  const m = gold[Math.floor(gold.length / 2)]
  return [m[0], m[1], m[2]]
}

// ── EN run: full frame, sequence, per-bubble, shimmer, pages-top, contrast ──
{
  const { ctx, page } = await newPage()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)

  // 4-bubble reveal order (lit shortly after each kid window: at + 0.095)
  const seq = [
    { key: 'red', sp: 0.27 },
    { key: 'blonde', sp: 0.37 },
    { key: 'green', sp: 0.47 },
    { key: 'mustard', sp: 0.57 },
  ]
  for (let i = 0; i < seq.length; i++) {
    await scrollToSp(page, seq[i].sp)
    await page.waitForTimeout(300)
    await page.screenshot({ path: resolve(out, `seq-${i + 1}-${seq[i].key}.png`) })
  }
  console.log('✓ seq-1..4')

  // full hero — all 4 bubbles visible, before typing (sp 0.58)
  await scrollToSp(page, 0.58)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, 'full-en.png') })
  console.log('✓ full-en')

  // per-bubble close-ups + AA contrast (sentence navy + foil gold vs cream ground)
  const boxes = await bubbleBoxes(page)
  const contrastReport = []
  const NAVY = [0x0f, 0x24, 0x44]
  for (const box of boxes) {
    const clip = await cropBubble(page, box, `bubble-${box.key}-en.png`)
    const buf = await page.screenshot({ clip })
    const ground = await groundColor(buf)
    const foil = await foilColor(buf) // real rendered gold body pixels
    contrastReport.push({
      key: box.key,
      groundRGB: ground,
      foilRGB: foil,
      sentenceNavy: contrast(NAVY, ground),
      foilGoldActual: foil ? contrast(foil, ground) : null,
      sentencePassAA: contrast(NAVY, ground) >= 4.5,
      foilPassAA: foil ? contrast(foil, ground) >= 4.5 : null,
    })
  }
  console.log('✓ bubble close-ups EN')

  // shimmer mid-sweep — re-fire the CSS sweep deterministically and grab mid-frame
  for (const box of boxes) {
    await page.evaluate((k) => {
      const imgs = Array.from(document.querySelectorAll('#hero img')).filter((i) => (i.currentSrc || i.src).includes('qfp-bubble'))
      const keys = ['mustard', 'red', 'blonde', 'green']
      const wrap = imgs[keys.indexOf(k)].parentElement
      wrap.querySelectorAll('.bub-foil').forEach((el) => { el.classList.remove('is-lit'); void el.offsetWidth; el.classList.add('is-lit') })
    }, box.key)
    await page.waitForTimeout(420) // ~mid of the 1100ms sweep
    await cropBubble(page, box, `shimmer-${box.key}.png`)
  }
  console.log('✓ shimmer frames')

  // pages typed from the TOP — full typing (sp 1.0) and a mid-typing frame
  await scrollToSp(page, 0.72)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, 'typing-mid-en.png') })
  await scrollToSp(page, 1.0)
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(out, 'pages-top-en.png') })
  console.log('✓ typing-mid / pages-top EN')

  await writeFile(resolve(out, 'contrast.json'), JSON.stringify(contrastReport, null, 2))
  console.log('✓ contrast.json', contrastReport.map((c) => `${c.key}:navy${c.sentenceNavy}/gold${c.foilGoldActual}(${c.foilPassAA})`).join('  '))
  await ctx.close()
}

// ── FR run: full frame + per-bubble (longer strings) + pages-top ──
{
  const { ctx, page } = await newPage({ lang: 'fr' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await scrollToSp(page, 0.58)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, 'full-fr.png') })
  const boxes = await bubbleBoxes(page)
  for (const box of boxes) await cropBubble(page, box, `bubble-${box.key}-fr.png`)
  await scrollToSp(page, 1.0)
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(out, 'pages-top-fr.png') })
  console.log('✓ FR frames')
  await ctx.close()
}

// ── Reduced-motion: static, fully typed, no shimmer ──
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await page.screenshot({ path: resolve(out, 'reduced.png') })
  // assert no .is-lit ever gets added and no sweep animation is running
  const anyLit = await page.evaluate(() => document.querySelectorAll('#hero .bub-foil.is-lit').length)
  console.log('✓ reduced.png  is-lit count (must be 0):', anyLit)
  await ctx.close()
}

await writeFile(resolve(out, 'console.json'), JSON.stringify({ errors: consoleErrors, count: consoleErrors.length }, null, 2))
console.log(consoleErrors.length ? `! console errors: ${consoleErrors.length}` : '✓ zero console errors')
await browser.close()
console.log('\nAll hero-polish artefacts →', out)
