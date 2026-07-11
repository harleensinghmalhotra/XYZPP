// HERO POLISH R2 verification — bigger bubble text (fill + line-count), page text
// from the TOP, SCROLL pill removed. Headed Playwright @ 1536×743, DPR 1.25.
// Artefacts → shots/hero-polish-r2/.
//   bubble-<key>-en.png / -fr.png   close-up WITH ruler overlay (fill% + line count)
//   fill.json                       per-bubble line count + interior fill %, EN & FR
//   pages-top-en.png / -fr.png      full typing — first line hugs the page top
//   page-start.json                 first-line Y as a fraction of the book box
//   compare-ref.png                 our full-typing book crop | reference book art
//   seq-1..4.png                    reveal order (red→blonde→green→mustard)
//   typing-mid-en.png               mid-typing from the new top origin
//   noscroll.json                   assert the SCROLL pill is gone
//   reduced.png                     prefers-reduced-motion (static, no shimmer)
//   contrast.json                   per-bubble AA (actual rendered pixels)
//   console.json                    console errors across the run
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'hero-polish-r2')
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
async function scrollToSp(page, sp) {
  const y = await page.evaluate((s) => {
    const sec = document.querySelector('#hero')
    const dist = sec.offsetHeight - window.innerHeight
    return Math.round(s * dist)
  }, sp)
  await page.evaluate((yy) => { if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true }); else window.scrollTo(0, yy) }, y)
  await page.waitForTimeout(220)
  return y
}
async function bubbleData(page) {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('#hero img')).filter((i) => (i.currentSrc || i.src).includes('qfp-bubble'))
    const keys = ['mustard', 'red', 'blonde', 'green']
    return imgs.map((img, n) => {
      const ir = img.getBoundingClientRect()
      const p = img.parentElement.querySelector('p')
      const cs = getComputedStyle(p)
      const lh = parseFloat(cs.lineHeight)
      const pr = p.getBoundingClientRect()
      const lines = Math.max(1, Math.round(pr.height / lh))
      // interior body ≈ upper 78% of the bubble frame (above the tail), inset ~7%
      const bodyH = ir.height * 0.78
      const bodyW = ir.width * 0.86
      return {
        key: keys[n],
        box: { x: ir.x, y: ir.y, width: ir.width, height: ir.height },
        fontPx: +parseFloat(cs.fontSize).toFixed(1),
        lines,
        fillV: +((pr.height / bodyH) * 100).toFixed(0),
        fillW: +((pr.width / bodyW) * 100).toFixed(0),
      }
    })
  })
}
// inject a ruler overlay (text bbox outline + fill/line label) for the shot
async function withRuler(page, key, on) {
  await page.evaluate(({ k, show }) => {
    const imgs = Array.from(document.querySelectorAll('#hero img')).filter((i) => (i.currentSrc || i.src).includes('qfp-bubble'))
    const keys = ['mustard', 'red', 'blonde', 'green']
    const wrap = imgs[keys.indexOf(k)].parentElement
    let ov = wrap.querySelector('.ruler-ov')
    if (!show) { if (ov) ov.remove(); return }
    const p = wrap.querySelector('p')
    const cs = getComputedStyle(p)
    const lines = Math.max(1, Math.round(p.getBoundingClientRect().height / parseFloat(cs.lineHeight)))
    const ir = imgs[keys.indexOf(k)].getBoundingClientRect()
    const wr = wrap.getBoundingClientRect()
    const pr = p.getBoundingClientRect()
    const fillV = Math.round((pr.height / (ir.height * 0.78)) * 100)
    ov = document.createElement('div')
    ov.className = 'ruler-ov'
    ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:99'
    // text bbox
    const b = document.createElement('div')
    b.style.cssText = `position:absolute;left:${pr.x - wr.x}px;top:${pr.y - wr.y}px;width:${pr.width}px;height:${pr.height}px;outline:1.5px dashed #e0483a;`
    // body-area bbox (upper 78%)
    const body = document.createElement('div')
    body.style.cssText = `position:absolute;left:${ir.x - wr.x + ir.width * 0.07}px;top:${ir.y - wr.y}px;width:${ir.width * 0.86}px;height:${ir.height * 0.78}px;outline:1px solid rgba(0,120,220,.7);`
    const lbl = document.createElement('div')
    lbl.textContent = `${lines} lines · fill ${fillV}%`
    lbl.style.cssText = `position:absolute;left:${ir.x - wr.x}px;top:${ir.y - wr.y - 18}px;font:600 11px system-ui;color:#e0483a;background:#fff;padding:1px 5px;border-radius:3px;white-space:nowrap`
    ov.append(body, b, lbl)
    wrap.appendChild(ov)
  }, { k: key, show: on })
}
async function cropBox(page, box, file, pad = 26) {
  const clip = { x: Math.max(0, Math.round(box.x - pad)), y: Math.max(0, Math.round(box.y - pad)), width: Math.round(Math.min(VP.width, box.width + pad * 2)), height: Math.round(Math.min(VP.height, box.height + pad * 2)) }
  await page.screenshot({ path: resolve(out, file), clip })
  return clip
}
function lum([r, g, b]) { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
function contrast(a, b) { const L1 = lum(a), L2 = lum(b), hi = Math.max(L1, L2), lo = Math.min(L1, L2); return +((hi + 0.05) / (lo + 0.05)).toFixed(2) }
async function groundColor(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const px = []
  for (let i = 0; i < data.length; i += info.channels) px.push([data[i], data[i + 1], data[i + 2], lum([data[i], data[i + 1], data[i + 2]])])
  px.sort((a, b) => b[3] - a[3]); const top = px.slice(0, Math.max(1, Math.floor(px.length * 0.25))); const m = top[Math.floor(top.length / 2)]; return [m[0], m[1], m[2]]
}
async function foilColor(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const gold = []
  for (let i = 0; i < data.length; i += info.channels) { const r = data[i], g = data[i + 1], b = data[i + 2]; if (b < 95 && r - b > 55 && r > 90 && r < 205 && g < r && g > b) gold.push([r, g, b, lum([r, g, b])]) }
  if (!gold.length) return null
  gold.sort((a, b) => a[3] - b[3]); const m = gold[Math.floor(gold.length / 2)]; return [m[0], m[1], m[2]]
}
// first typed line top as a fraction of the book-image box (page-start position)
async function pageStart(page) {
  return page.evaluate(() => {
    const book = Array.from(document.querySelectorAll('#hero img')).find((i) => (i.currentSrc || i.src).includes('qfp-book-cover'))
    const br = book.getBoundingClientRect()
    const firstTop = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return +(((r.top - br.top) / br.height)).toFixed(3) }
    return { bookBox: { y: br.y, height: br.height }, leftFirstLineFrac: firstTop('.tb-lhead'), rightFirstLineFrac: firstTop('.tb-rhead') }
  })
}

// ── EN run ──
{
  const { ctx, page } = await newPage()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)

  // SCROLL pill absent assert — search hero for the old pill (dot + SCROLL label)
  const noScroll = await page.evaluate(() => {
    const hero = document.querySelector('#hero')
    const txt = (hero.innerText || '').toUpperCase()
    const hasScrollWord = /\bSCROLL\b/.test(txt)
    // the pill was the only bottom-centered translate-x-1/2 chip with a dot
    const chips = Array.from(hero.querySelectorAll('.-translate-x-1\\/2'))
    return { hasScrollWord, bottomCenterChips: chips.length }
  })
  await writeFile(resolve(out, 'noscroll.json'), JSON.stringify({ ...noScroll, pass: !noScroll.hasScrollWord }, null, 2))
  console.log('✓ noscroll.json  hasScrollWord=', noScroll.hasScrollWord)

  // reveal order
  const seq = [{ key: 'red', sp: 0.27 }, { key: 'blonde', sp: 0.37 }, { key: 'green', sp: 0.47 }, { key: 'mustard', sp: 0.57 }]
  for (let i = 0; i < seq.length; i++) { await scrollToSp(page, seq[i].sp); await page.waitForTimeout(280); await page.screenshot({ path: resolve(out, `seq-${i + 1}-${seq[i].key}.png`) }) }
  console.log('✓ seq-1..4')

  // all bubbles visible (sp 0.58) → measure + ruler close-ups + contrast
  await scrollToSp(page, 0.58)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, 'full-en.png') })
  const data = await bubbleData(page)
  const contrastReport = []
  const NAVY = [0x0f, 0x24, 0x44]
  const fillEN = []
  for (const d of data) {
    await withRuler(page, d.key, true)
    const clip = await cropBox(page, d.box, `bubble-${d.key}-en.png`)
    await withRuler(page, d.key, false)
    const buf = await page.screenshot({ clip })
    const ground = await groundColor(buf); const foil = await foilColor(buf)
    contrastReport.push({ key: d.key, sentenceNavy: contrast(NAVY, ground), foilGold: foil ? contrast(foil, ground) : null, sentencePassAA: contrast(NAVY, ground) >= 4.5, foilPassAA: foil ? contrast(foil, ground) >= 4.5 : null })
    fillEN.push({ key: d.key, fontPx: d.fontPx, lines: d.lines, fillV: d.fillV })
  }
  console.log('✓ bubble rulers EN', fillEN.map((f) => `${f.key}:${f.lines}L/${f.fillV}%/${f.fontPx}px`).join('  '))

  // typing origin mid-frame + full typing (pages from top) + page-start measure
  await scrollToSp(page, 0.72); await page.waitForTimeout(400); await page.screenshot({ path: resolve(out, 'typing-mid-en.png') })
  await scrollToSp(page, 1.0); await page.waitForTimeout(500); await page.screenshot({ path: resolve(out, 'pages-top-en.png') })
  const start = await pageStart(page)
  await writeFile(resolve(out, 'page-start.json'), JSON.stringify({ ...start, note: 'first typed line top as fraction of book box; ~0.20 = just under the top curve', targetFrac: 0.22 }, null, 2))
  console.log('✓ page-start.json  left=', start.leftFirstLineFrac, 'right=', start.rightFirstLineFrac)

  // side-by-side vs the reference book art (text starts near the top there too)
  try {
    const book = await page.evaluate(() => { const b = Array.from(document.querySelectorAll('#hero img')).find((i) => (i.currentSrc || i.src).includes('qfp-book-cover')); const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })
    const ours = await page.screenshot({ clip: { x: Math.max(0, Math.round(book.x)), y: Math.max(0, Math.round(book.y)), width: Math.round(Math.min(VP.width, book.width)), height: Math.round(Math.min(VP.height - book.y, book.height)) } })
    const H = 460
    const oursR = await sharp(ours).resize({ height: H }).toBuffer()
    const ref = await sharp(resolve(root, 'FLOW assets', 'Book with text.png')).resize({ height: H }).toBuffer()
    const om = await sharp(oursR).metadata(); const rm = await sharp(ref).metadata(); const gap = 20
    await sharp({ create: { width: om.width + rm.width + gap, height: H, channels: 3, background: '#0c2f4a' } }).composite([{ input: oursR, left: 0, top: 0 }, { input: ref, left: om.width + gap, top: 0 }]).png().toFile(resolve(out, 'compare-ref.png'))
    console.log('✓ compare-ref.png (ours | reference book art)')
  } catch (e) { console.log('! compare-ref skipped:', e.message) }

  await writeFile(resolve(out, 'contrast.json'), JSON.stringify(contrastReport, null, 2))
  await writeFile(resolve(out, 'fill-en.json'), JSON.stringify(fillEN, null, 2))
  console.log('✓ contrast.json', contrastReport.map((c) => `${c.key}:navy${c.sentenceNavy}/gold${c.foilGold}(${c.foilPassAA})`).join('  '))
  await ctx.close()
}

// ── FR run ── (longer strings — line count + fill must still hold)
{
  const { ctx, page } = await newPage({ lang: 'fr' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await scrollToSp(page, 0.58); await page.waitForTimeout(400); await page.screenshot({ path: resolve(out, 'full-fr.png') })
  const data = await bubbleData(page)
  const fillFR = []
  for (const d of data) { await withRuler(page, d.key, true); await cropBox(page, d.box, `bubble-${d.key}-fr.png`); await withRuler(page, d.key, false); fillFR.push({ key: d.key, fontPx: d.fontPx, lines: d.lines, fillV: d.fillV }) }
  await scrollToSp(page, 1.0); await page.waitForTimeout(500); await page.screenshot({ path: resolve(out, 'pages-top-fr.png') })
  await writeFile(resolve(out, 'fill-fr.json'), JSON.stringify(fillFR, null, 2))
  console.log('✓ FR rulers', fillFR.map((f) => `${f.key}:${f.lines}L/${f.fillV}%/${f.fontPx}px`).join('  '))
  await ctx.close()
}

// ── Reduced-motion ──
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await page.screenshot({ path: resolve(out, 'reduced.png') })
  const anyLit = await page.evaluate(() => document.querySelectorAll('#hero .bub-foil.is-lit').length)
  console.log('✓ reduced.png  is-lit (must be 0):', anyLit)
  await ctx.close()
}

await writeFile(resolve(out, 'console.json'), JSON.stringify({ errors: consoleErrors, count: consoleErrors.length }, null, 2))
console.log(consoleErrors.length ? `! console errors: ${consoleErrors.length}` : '✓ zero console errors')
await browser.close()
console.log('\nAll hero-polish-r2 artefacts →', out)
