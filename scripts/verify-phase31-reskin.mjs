// Phase 3.1 reskin verification — headed Playwright, 1536×743 @1.25 DSR.
// Targets the fresh production build served by `vite preview` on :4173.
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:4173'
const EKTA = 'file:///D:/WEBSITES/Website%20University/Ektas%20Vibe%20Coded%20Latest/qfp-homepage-v17.html'
const OUT = 'shots/phase31-reskin'
fs.mkdirSync(OUT, { recursive: true })

const VP = { width: 1536, height: 743 }
const DSR = 1.25

const ROUTES = [
  ['home', '/'],
  ['about', '/about'],
  ['educational-books', '/educational-books'],
  ['trade-books', '/trade-books'],
  ['print-on-demand', '/print-on-demand'],
  ['infrastructure', '/infrastructure'],
  ['fulfilment', '/fulfilment'],
  ['contact', '/contact'],
  ['legal-privacy', '/legal/privacy'],
]

// Old System-A palette that must be GONE from computed styles.
const FORBIDDEN_COLORS = {
  'cyan #00AEEF': 'rgb(0, 174, 239)',
  'magenta #EC008C': 'rgb(236, 0, 140)',
  'yellow #FFC800': 'rgb(255, 200, 0)',
  'paper #F3EDE1': 'rgb(243, 237, 225)',
  'ink #16130F': 'rgb(22, 19, 15)',
  'tone #2D2926': 'rgb(45, 41, 38)',
}
const FORBIDDEN_FONTS = ['metrisch', 'space mono', 'bricolage', 'libre bodoni', 'great vibes']

const results = { screenshots: [], forbiddenColorHits: {}, forbiddenFontHits: {}, seal: {}, motionless: null, mapZoom: {}, i18n: {}, contrast: [] }

// ---- WCAG contrast helper ----
function lum(hex) {
  const c = hex.replace('#', '')
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}
function contrast(a, b) {
  const l1 = lum(a), l2 = lum(b)
  return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2)
}
const PALETTE_PAIRS = [
  ['gold #9B7420', '#9B7420', 'cream #FDFAF4', '#FDFAF4', 'normal'],
  ['gold-text #836013', '#836013', 'cream #FDFAF4', '#FDFAF4', 'normal'],
  ['gold #9B7420', '#9B7420', 'cream-2 #F0EBE0', '#F0EBE0', 'normal'],
  ['gold-2 #C89A3C', '#C89A3C', 'navy #0F2444', '#0F2444', 'normal'],
  ['gold-2 #C89A3C', '#C89A3C', 'cream #FDFAF4', '#FDFAF4', 'large'],
  ['cream #FDFAF4', '#FDFAF4', 'navy #0F2444', '#0F2444', 'normal'],
  ['ink #1C2019', '#1C2019', 'cream #FDFAF4', '#FDFAF4', 'normal'],
  ['navy #0F2444', '#0F2444', 'cream #FDFAF4', '#FDFAF4', 'normal'],
  ['olive #6B7A2A', '#6B7A2A', 'cream #FDFAF4', '#FDFAF4', 'normal'],
  ['ink-2 #444', '#444444', 'cream #FDFAF4', '#FDFAF4', 'normal'],
]
for (const [fgN, fg, bgN, bg, size] of PALETTE_PAIRS) {
  const ratio = Number(contrast(fg, bg))
  const need = size === 'large' ? 3.0 : 4.5
  results.contrast.push({ fg: fgN, bg: bgN, size, ratio, pass: ratio >= need, need })
}

async function sweep(page) {
  return page.evaluate((forbiddenFonts) => {
    const colorHits = {}, fontHits = {}
    const els = document.querySelectorAll('*')
    for (const el of els) {
      const cs = getComputedStyle(el)
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'fill', 'stroke']) {
        const v = cs[prop]
        if (v) { colorHits[v] = (colorHits[v] || 0) + 1 }
      }
      const ff = (cs.fontFamily || '').toLowerCase()
      for (const f of forbiddenFonts) if (ff.includes(f)) fontHits[f] = (fontHits[f] || 0) + 1
    }
    return { colorHits, fontHits }
  }, FORBIDDEN_FONTS)
}

async function sealCheck(page) {
  return page.evaluate(() => {
    let spin = 0, wordmark = 0
    for (const el of document.querySelectorAll('*')) {
      const a = getComputedStyle(el).animationName || ''
      if (a.includes('seal-spin')) spin++
    }
    for (const tp of document.querySelectorAll('textPath, text')) {
      if ((tp.textContent || '').includes('QFP STORIES')) wordmark++
    }
    return { spinningEls: spin, storiesWordmark: wordmark }
  })
}

const run = async () => {
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DSR })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message))

  for (const [name, route] of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    if (name === 'home') {
      // scroll through to trigger reveals, then back to top
      for (let y = 0; y <= 16000; y += 1000) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(90) }
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600)
    }
    await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: name !== 'home' })
    if (name === 'home') await page.screenshot({ path: `${OUT}/${name}-viewport.png` })
    results.screenshots.push(`${name}-full.png`)
    const { colorHits, fontHits } = await sweep(page)
    const hits = {}
    for (const [label, rgb] of Object.entries(FORBIDDEN_COLORS)) if (colorHits[rgb]) hits[label] = colorHits[rgb]
    if (Object.keys(hits).length) results.forbiddenColorHits[name] = hits
    if (Object.keys(fontHits).length) results.forbiddenFontHits[name] = fontHits
    results.seal[name] = await sealCheck(page)
  }

  // ---- Header side-by-side: ours vs Ekta's file ----
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const ourHeader = await page.$('header')
  if (ourHeader) await ourHeader.screenshot({ path: `${OUT}/header-OURS.png` })
  await page.screenshot({ path: `${OUT}/header-ours-context.png`, clip: { x: 0, y: 0, width: VP.width, height: 120 } })
  try {
    await page.goto(EKTA, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/header-EKTA-context.png`, clip: { x: 0, y: 0, width: VP.width, height: 120 } })
    const ektaNav = await page.$('nav')
    if (ektaNav) await ektaNav.screenshot({ path: `${OUT}/header-EKTA.png` })
  } catch (e) { results.ektaHeaderError = String(e) }

  // ---- Motionless hero: two frames 10s apart must be identical ----
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  const heroA = await page.screenshot({ clip: { x: 0, y: 86, width: VP.width, height: 640 } })
  await page.waitForTimeout(10000)
  const heroB = await page.screenshot({ clip: { x: 0, y: 86, width: VP.width, height: 640 } })
  fs.writeFileSync(`${OUT}/hero-frameA.png`, heroA)
  fs.writeFileSync(`${OUT}/hero-frameB.png`, heroB)
  results.motionless = { identical: Buffer.compare(heroA, heroB) === 0, bytesA: heroA.length, bytesB: heroB.length }

  // ---- Map zoom: home (#reach) and about. ctrl+wheel must change the map. ----
  for (const [mapName, route, anchor] of [['home', '/', '#reach'], ['about', '/about', null]]) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle' })
      // scroll the globe section into view and wait for it to land
      await page.waitForTimeout(1000)
      const globe = await page.$('.qfp-globe')
      if (globe) await globe.scrollIntoViewIfNeeded()
      // wait up to ~16s for the flyTo choreography to reach 'landed'
      let phase = 'boot'
      for (let i = 0; i < 40; i++) {
        phase = await page.evaluate(() => document.querySelector('.qfp-globe')?.getAttribute('data-phase') || 'none')
        if (phase === 'landed') break
        await page.waitForTimeout(500)
      }
      const canvasBox = await page.evaluate(() => {
        const c = document.querySelector('.qfp-globe canvas.maplibregl-canvas') || document.querySelector('.qfp-globe canvas')
        if (!c) return null
        const r = c.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, has: true }
      })
      let zoomChanged = false
      if (canvasBox && phase === 'landed') {
        const before = await page.screenshot({ clip: { x: 0, y: Math.max(0, canvasBox.y - 200), width: VP.width, height: 400 } })
        await page.mouse.move(canvasBox.x, canvasBox.y)
        await page.keyboard.down('Control')
        await page.mouse.wheel(0, -900)
        await page.waitForTimeout(200)
        await page.mouse.wheel(0, -900)
        await page.keyboard.up('Control')
        await page.waitForTimeout(900)
        const after = await page.screenshot({ clip: { x: 0, y: Math.max(0, canvasBox.y - 200), width: VP.width, height: 400 } })
        fs.writeFileSync(`${OUT}/map-${mapName}-before.png`, before)
        fs.writeFileSync(`${OUT}/map-${mapName}-after.png`, after)
        zoomChanged = Buffer.compare(before, after) !== 0
      }
      results.mapZoom[mapName] = { phase, hasCanvas: !!canvasBox, zoomChanged }
    } catch (e) { results.mapZoom[mapName] = { error: String(e) } }
  }

  // ---- EN/FR spot check on home ----
  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const enQuote = await page.evaluate(() => document.body.innerText.includes('Request a Quote'))
    // click FR
    const frBtn = await page.$('button[aria-pressed]:has-text("FR")')
    if (frBtn) { await frBtn.click(); await page.waitForTimeout(700) }
    const frQuote = await page.evaluate(() => document.body.innerText.includes('Demander un devis'))
    await page.screenshot({ path: `${OUT}/home-FR.png`, clip: { x: 0, y: 0, width: VP.width, height: 120 } })
    results.i18n = { enHadRequestQuote: enQuote, frShowedDemanderUnDevis: frQuote }
  } catch (e) { results.i18n = { error: String(e) } }

  results.consoleErrors = consoleErrors.slice(0, 30)
  await browser.close()
  fs.writeFileSync(`${OUT}/_verify-results.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
}
run().catch((e) => { console.error(e); process.exit(1) })
