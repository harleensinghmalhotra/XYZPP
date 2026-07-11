// CASE STUDIES — THE OPEN BOOK verification harness.
// Headed Playwright @ 1536×743 DPR 1.25 → shots/cases-book/.
// Evidence produced:
//   en-full.png / fr-full.png     — the whole section, both languages
//   gap.png                       — the shelf, with the OPEN case's spine missing
//   spine-hover.png               — a spine pulled out on hover
//   bookmark-counter.png          — the ribbon "you are here" + DM Mono counter
//   flip-next-1..4.png            — mid page-turn frames, forward
//   flip-prev-1..4.png            — mid page-turn frames, backward
//   keyboard.png / swipe.png      — after ← → keys / a left swipe (both asserted)
//   reduced.png                   — prefers-reduced-motion crossfade (no flip)
//   gate-off.png                  — SHOW_MINISTRY_NAMES=false → ministry name gone
//   contrast.json / fps.json      — AA on pages+spines / page-turn fps
//   console.json                  — every console + page error (must be empty)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'cases-book')
mkdirSync(out, { recursive: true })
const URL = process.env.CASES_URL || 'http://localhost:5173'
const VP = { width: 1536, height: 743 }
const DPR = 1.25
const COMPLIANCE = resolve(root, 'src', 'lib', 'compliance.js')

function contrast(hex1, hex2) {
  const lum = (hex) => {
    const c = hex.replace('#', '')
    const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x)
  return +((a + 0.05) / (b + 0.05)).toFixed(2)
}

const browser = await chromium.launch({ headless: false })
const problems = []

async function makePage({ reducedMotion, lang } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion, hasTouch: true })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') problems.push({ kind: 'console', text: m.text() }) })
  page.on('pageerror', (e) => problems.push({ kind: 'pageerror', text: e.message }))
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  return { ctx, page }
}

async function settle(page) {
  await page.waitForTimeout(900)
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* noop */ }
  await page.waitForTimeout(300)
}

async function showCases(page) {
  const y = await page.evaluate(() => {
    const el = document.querySelector('#cases')
    return el ? el.getBoundingClientRect().top + window.scrollY : 0
  })
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y - 20)
  await page.waitForTimeout(700)
}

// screenshot only the interactive book region (nice tight evidence crops)
async function shotBook(page, name) {
  const el = await page.$('.cs-stage')
  if (el) await el.screenshot({ path: resolve(out, name) })
  else await page.screenshot({ path: resolve(out, name) })
}
// screenshot the whole section (header band + stage + footer) as full evidence
async function shotSection(page, name) {
  const el = await page.$('#cases')
  if (el) await el.screenshot({ path: resolve(out, name) })
  else await page.screenshot({ path: resolve(out, name) })
}

const counter = (page) => page.$eval('.cs-counter', (n) => n.textContent.replace(/\s+/g, ' ').trim())

// ── 1. EN full + details + flips + interactions ──
{
  const { ctx, page } = await makePage({ lang: 'en' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await showCases(page)

  await shotSection(page, 'en-full.png')
  console.log('✓ en-full.png')

  // the shelf gap — the OPEN case's spine is absent (case 01 active by default)
  const gapCount = await page.$$eval('.cs-slot--gap', (n) => n.length)
  const spineCount = await page.$$eval('.cs-spine', (n) => n.length)
  if (gapCount !== 1) problems.push({ kind: 'assert', text: `expected 1 shelf gap, got ${gapCount}` })
  const shelf = await page.$('.cs-shelf')
  if (shelf) await shelf.screenshot({ path: resolve(out, 'gap.png') })
  console.log(`✓ gap.png (gaps=${gapCount}, spines=${spineCount})`)

  // spine hover pull
  await page.hover('.cs-spine')
  await page.waitForTimeout(400)
  if (shelf) await shelf.screenshot({ path: resolve(out, 'spine-hover.png') })
  console.log('✓ spine-hover.png')
  await page.mouse.move(VP.width / 2, VP.height / 2)
  await page.waitForTimeout(300)

  // ribbon + counter detail — the book's full top strip (ribbon on the spine at
  // centre, DM Mono counter at the top-right corner)
  const bookEl = await page.$('.cs-book')
  const box = await bookEl.boundingBox()
  await page.screenshot({
    path: resolve(out, 'bookmark-counter.png'),
    clip: { x: box.x, y: Math.max(0, box.y - 30), width: box.width, height: 100 },
  })
  console.log('✓ bookmark-counter.png')

  // ── keyboard ← → assert ──
  await page.focus('.cs-interactive')
  const k0 = await counter(page)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(700)
  const k1 = await counter(page)
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(700)
  const k2 = await counter(page)
  await shotBook(page, 'keyboard.png')
  if (!(k0 !== k1 && k2 === k0)) problems.push({ kind: 'assert', text: `keyboard nav failed: ${k0} → ${k1} → ${k2}` })
  console.log(`✓ keyboard.png  ${k0} → ${k1} → ${k2}`)

  // ── swipe assert (left swipe → next) ──
  const s0 = await counter(page)
  await page.evaluate(() => {
    const el = document.querySelector('.cs-book')
    const r = el.getBoundingClientRect()
    const y = r.top + r.height / 2
    const mk = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y })
    // a real browser always populates targetTouches; mirror that so global touch
    // listeners (Lenis) see a valid touch and don't fault on the synthetic event
    const fire = (type, x, ended) => el.dispatchEvent(new TouchEvent(type, {
      bubbles: true, cancelable: true,
      touches: ended ? [] : [mk(x)],
      targetTouches: ended ? [] : [mk(x)],
      changedTouches: [mk(x)],
    }))
    const x0 = r.left + r.width * 0.7
    fire('touchstart', x0, false)
    fire('touchend', x0 - 180, true)
  })
  await page.waitForTimeout(700)
  const s1 = await counter(page)
  await shotBook(page, 'swipe.png')
  if (s0 === s1) problems.push({ kind: 'assert', text: `swipe did not advance (${s0})` })
  console.log(`✓ swipe.png  ${s0} → ${s1}`)

  // ── contrast probe (pages + spines) ──
  const contrastReport = {
    creamPageInk: { pair: ['#0f2444', '#fdfaf4'], ratio: contrast('#0f2444', '#fdfaf4'), passAA: contrast('#0f2444', '#fdfaf4') >= 4.5 },
    creamPageEyebrow: { pair: ['#836013', '#fdfaf4'], ratio: contrast('#836013', '#fdfaf4'), passAA: contrast('#836013', '#fdfaf4') >= 4.5 },
    pillText: { pair: ['#e6bd6a', '#0f2444'], ratio: contrast('#e6bd6a', '#0f2444'), passAA: contrast('#e6bd6a', '#0f2444') >= 4.5 },
    ctaText: { pair: ['#836013', '#fdfaf4'], ratio: contrast('#836013', '#fdfaf4'), passAA: contrast('#836013', '#fdfaf4') >= 4.5 },
    spineNumNavy: { pair: ['#c89a3c', '#0f2444'], ratio: contrast('#c89a3c', '#0f2444'), passAA_large: contrast('#c89a3c', '#0f2444') >= 3 },
    spineNumCream: { pair: ['#836013', '#f4eede'], ratio: contrast('#836013', '#f4eede'), passAA: contrast('#836013', '#f4eede') >= 4.5 },
    spineTextCream: { pair: ['#0f2444', '#f4eede'], ratio: contrast('#0f2444', '#f4eede'), passAA: contrast('#0f2444', '#f4eede') >= 4.5 },
    counterGold: { pair: ['#c89a3c', '#0f2444'], ratio: contrast('#c89a3c', '#0f2444'), passAA_large: contrast('#c89a3c', '#0f2444') >= 3 },
  }
  await writeFile(resolve(out, 'contrast.json'), JSON.stringify(contrastReport, null, 2))
  console.log('✓ contrast.json')

  // ── fps while page-turning back and forth ──
  const fps = await page.evaluate(() => new Promise((res) => {
    const deltas = []
    let last = performance.now()
    const start = last
    const next = document.querySelector('.cs-arrow--next')
    const prev = document.querySelector('.cs-arrow--prev')
    let toggle = 0
    const beat = setInterval(() => { (toggle++ % 2 ? prev : next).click() }, 620)
    function frame(now) {
      deltas.push(now - last); last = now
      if (now - start < 2600) requestAnimationFrame(frame)
      else {
        clearInterval(beat)
        const d = deltas.slice(2).sort((a, b) => a - b)
        res({ frames: d.length, medianFps: +(1000 / d[Math.floor(d.length / 2)]).toFixed(1) })
      }
    }
    requestAnimationFrame(frame)
  }))
  await writeFile(resolve(out, 'fps.json'), JSON.stringify({ viewport: VP, dpr: DPR, pageTurn: fps, above55: fps.medianFps >= 55 }, null, 2))
  console.log('✓ fps.json', fps)

  await ctx.close()
}

// ── 2. FR full ──
{
  const { ctx, page } = await makePage({ lang: 'fr' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await showCases(page)
  await shotSection(page, 'fr-full.png')
  const frCounter = await counter(page)
  if (!/^CAS/i.test(frCounter)) problems.push({ kind: 'assert', text: `FR counter not localised: ${frCounter}` })
  console.log('✓ fr-full.png', frCounter)
  await ctx.close()
}

// ── 2b. slowed page-turn (?flip=1600) — crisp mid-flip frames, both directions ──
{
  const { ctx, page } = await makePage({ lang: 'en' })
  await page.goto(URL + '?flip=1600', { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await showCases(page)

  // forward 01 → 02: sample across the ~1.6s turn
  const before = await counter(page)
  await page.click('.cs-arrow--next')
  for (let i = 1; i <= 4; i++) {
    await page.waitForTimeout(300)
    await shotBook(page, `flip-next-${i}.png`)
  }
  await page.waitForTimeout(700)
  const afterNext = await counter(page)
  if (before === afterNext) problems.push({ kind: 'assert', text: `next did not advance (${before})` })
  console.log(`✓ flip-next-1..4.png  ${before} → ${afterNext}`)

  // backward 02 → 01
  await page.click('.cs-arrow--prev')
  for (let i = 1; i <= 4; i++) {
    await page.waitForTimeout(300)
    await shotBook(page, `flip-prev-${i}.png`)
  }
  await page.waitForTimeout(700)
  const afterPrev = await counter(page)
  if (afterPrev === afterNext) problems.push({ kind: 'assert', text: `prev did not go back (${afterNext})` })
  console.log(`✓ flip-prev-1..4.png  ${afterNext} → ${afterPrev}`)
  await ctx.close()
}

// ── 3. reduced-motion crossfade (no flip) ──
{
  const { ctx, page } = await makePage({ reducedMotion: 'reduce', lang: 'en' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await showCases(page)
  const noLeaf = await page.evaluate(() => {
    document.querySelector('.cs-arrow--next').click()
    return new Promise((r) => setTimeout(() => r(!document.querySelector('.cs-leaf')), 120))
  })
  if (!noLeaf) problems.push({ kind: 'assert', text: 'reduced-motion still rendered a turning leaf' })
  await page.waitForTimeout(300)
  await shotBook(page, 'reduced.png')
  console.log(`✓ reduced.png  (no leaf on change: ${noLeaf})`)
  await ctx.close()
}

// ── 4. gate-off ministry assert — flip SHOW_MINISTRY_NAMES→false, HMR, verify ──
const original = readFileSync(COMPLIANCE, 'utf8')
try {
  writeFileSync(COMPLIANCE, original.replace('SHOW_MINISTRY_NAMES = true', 'SHOW_MINISTRY_NAMES = false'))
  const { ctx, page } = await makePage({ lang: 'en' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1600) // let vite HMR settle the flag
  await settle(page)
  await showCases(page)
  // open the Ghana case (case 03) via its spine, read the open-page eyebrow
  await page.click('.cs-spine >> text=Ghana')
  await page.waitForTimeout(800)
  const eyebrow = await page.$eval('.cs-page--left .cs-eyebrow', (n) => n.textContent.trim())
  if (/USAID/i.test(eyebrow)) problems.push({ kind: 'assert', text: `gate OFF still shows ministry: "${eyebrow}"` })
  if (!/GHANA/i.test(eyebrow)) problems.push({ kind: 'assert', text: `gate OFF lost the country: "${eyebrow}"` })
  await shotBook(page, 'gate-off.png')
  console.log(`✓ gate-off.png  eyebrow="${eyebrow}"`)
  await ctx.close()
} finally {
  writeFileSync(COMPLIANCE, original) // ALWAYS restore the flag
  console.log('✓ compliance.js restored to original')
}

await browser.close()

await writeFile(resolve(out, 'console.json'), JSON.stringify(problems, null, 2))
console.log(`\n${problems.length ? '✗ ' + problems.length + ' PROBLEM(S)' : '✓ zero problems'} →`, out)
if (problems.length) { for (const p of problems) console.log('  -', p.kind, p.text) }
