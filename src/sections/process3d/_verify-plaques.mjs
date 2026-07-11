// Dev-only. Proves the dormant plaque-swap path: (1) with the folder EMPTY the
// live conveyor is pixel-identical before/after the wiring commit, and (2) drop a
// PNG into public/qfp/conveyor/plaques/ and it takes over the plaque face.
// Headed Playwright 1536×743 DPR 1.25 → shots/plaque-templates/.
//
// Dust.jsx seeds mote positions with Math.random() per mount, so we pin Math.random
// to a fixed seed in every context — the dust is then identical across reloads and
// the before/after diff isolates ACTUAL rendering changes (there should be none).
//
// Run (dev server on :5173): node src/sections/process3d/_verify-plaques.mjs
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'

const BASE = process.env.CONV_URL || 'http://localhost:5173'
const OUT = 'shots/plaque-templates'
const PLAQUE_DIR = 'public/qfp/conveyor/plaques'
const FILES = ['src/sections/process3d/Station.jsx', 'src/sections/process3d/Scene.jsx']
const FRACS = [0.06, 0.30, 0.55, 0.80] // scrub positions across the pinned #process range
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const errors = []

// deterministic Math.random (mulberry32) so Dust + any random init is reproducible
const SEED_RANDOM = () => {
  let s = 0x9e3779b9 >>> 0
  Math.random = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function convRange(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#process .conv-scroll')
    if (!el) return null
    const r = el.getBoundingClientRect()
    const absTop = r.top + window.scrollY
    return { start: absTop, end: absTop + el.offsetHeight - window.innerHeight }
  })
}
async function scrubTo(page, range, frac) {
  const y = range.start + (range.end - range.start) * frac
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)
  await sleep(1500) // let velocity decay → vtime freezes (idle) → deterministic frame
}

async function newSeededContext(browser, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  await ctx.addInitScript(() => localStorage.setItem('qfp.lang', 'en'))
  await ctx.addInitScript(SEED_RANDOM)
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${tag}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message}`))
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sleep(1600)
  return { ctx, page }
}

// capture the full FRACS set with the given filename prefix
async function captureSet(browser, tag, prefix) {
  const { ctx, page } = await newSeededContext(browser, tag)
  const range = await convRange(page)
  for (let i = 0; i < FRACS.length; i++) {
    await scrubTo(page, range, FRACS[i])
    await page.screenshot({ path: `${OUT}/${prefix}-${i}-${FRACS[i].toFixed(2)}.png` })
  }
  await ctx.close()
}

// mean/max per-channel diff between two PNGs, computed in-page via canvas
async function diffPng(browser, aPath, bPath) {
  const toUrl = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const res = await page.evaluate(async ({ a, b }) => {
    const load = (src) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = src })
    const [ia, ib] = await Promise.all([load(a), load(b)])
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height
    const g = c.getContext('2d')
    g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data
    g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data
    let sum = 0, max = 0, changed = 0
    for (let i = 0; i < da.length; i += 4) {
      let px = 0
      for (let k = 0; k < 3; k++) { const d = Math.abs(da[i + k] - db[i + k]); sum += d; if (d > px) px = d }
      if (px > 6) changed++
      if (px > max) max = px
    }
    const npx = da.length / 4
    return { mean: sum / (npx * 3), max, changedPct: (changed / npx) * 100 }
  }, { a: toUrl(aPath), b: toUrl(bPath) })
  await ctx.close()
  return res
}

async function run() {
  const browser = await chromium.launch({ headless: false })

  // ── PASS 1 — AFTER: current working tree (swap wired, plaques/ empty) ─────────
  console.log('· capturing AFTER (working tree, dormant swap, folder empty)')
  await captureSet(browser, 'after', 'after')

  // ── CONTROL — same working tree, second run: the run-to-run NOISE FLOOR. The
  // scene freezes ambient motion at idle but at a vtime phase that varies per
  // reload, so even identical code differs by a sub-pixel camera drift. Any
  // before/after diff must not exceed this floor. ────────────────────────────
  console.log('· capturing CONTROL (same code, 2nd run → noise floor)')
  await captureSet(browser, 'ctrl', 'ctrl')

  // ── PASS 2 — BEFORE: stash the two edited files → committed scene ─────────────
  console.log('· stashing swap wiring → capturing BEFORE (committed scene)')
  execSync(`git stash push -- ${FILES.join(' ')}`, { stdio: 'pipe' })
  await sleep(3800) // Vite recompiles the stashed modules
  await captureSet(browser, 'before', 'before')
  execSync('git stash pop', { stdio: 'pipe' })
  await sleep(3200) // restore working tree

  // ── PASS 3 — DUMMY: prove a dropped PNG overrides the print plaque ────────────
  console.log('· dropping dummy plaque-print.png → capturing swap proof')
  mkdirSync(PLAQUE_DIR, { recursive: true })
  const { ctx: gctx, page: gpage } = await (async () => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    return { ctx, page }
  })()
  const dummyUrl = await gpage.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1280; c.height = 964
    const g = c.getContext('2d'); g.fillStyle = '#FF00AA'; g.fillRect(0, 0, 1280, 964)
    g.fillStyle = '#003'; g.font = 'bold 160px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('DUMMY', 640, 482)
    return c.toDataURL('image/png')
  })
  await gctx.close()
  writeFileSync(`${PLAQUE_DIR}/plaque-print.png`, Buffer.from(dummyUrl.split(',')[1], 'base64'))

  const { ctx: dctx, page: dpage } = await newSeededContext(browser, 'dummy')
  const drange = await convRange(dpage)
  await scrubTo(dpage, drange, FRACS[0]) // first station = print
  await dpage.screenshot({ path: `${OUT}/dummy-print-${FRACS[0].toFixed(2)}.png` })
  await dctx.close()
  rmSync(PLAQUE_DIR, { recursive: true, force: true }) // remove dummy + empty dir → back to shipped state

  await browser.close()

  // ── DIFF: signal (before vs after) must stay within noise (after vs ctrl) ────
  const f = (i) => FRACS[i].toFixed(2)
  const b2 = await chromium.launch({ headless: true })
  let worstSignal = 0, worstNoise = 0
  console.log('\n            SIGNAL(before→after)      NOISE(after→ctrl, same code)')
  for (let i = 0; i < FRACS.length; i++) {
    const sig = await diffPng(b2, `${OUT}/before-${i}-${f(i)}.png`, `${OUT}/after-${i}-${f(i)}.png`)
    const noi = await diffPng(b2, `${OUT}/after-${i}-${f(i)}.png`, `${OUT}/ctrl-${i}-${f(i)}.png`)
    worstSignal = Math.max(worstSignal, sig.mean); worstNoise = Math.max(worstNoise, noi.mean)
    console.log(`  frac ${f(i)}   mean ${sig.mean.toFixed(4)} chg ${sig.changedPct.toFixed(3)}%     mean ${noi.mean.toFixed(4)} chg ${noi.changedPct.toFixed(3)}%`)
  }
  const dumDiff = await diffPng(b2, `${OUT}/after-0-${f(0)}.png`, `${OUT}/dummy-print-${f(0)}.png`)
  await b2.close()
  console.log(`\nDUMMY swap proof (after vs dummy @ print): mean ${dumDiff.mean.toFixed(3)}  changed ${dumDiff.changedPct.toFixed(2)}%`)

  // inert if the before→after signal is no larger than same-code run-to-run noise
  const identical = worstSignal <= worstNoise * 1.5 + 0.05
  const swapWorks = dumDiff.changedPct > 0.5
  console.log('\n──────── VERDICT ────────')
  console.log('inert with folder empty      :', identical ? 'PASS' : 'FAIL', `(signal ${worstSignal.toFixed(4)} ≤ noise-floor ${worstNoise.toFixed(4)} ×1.5+0.05 = ${(worstNoise * 1.5 + 0.05).toFixed(4)})`)
  console.log('swap path takes over on drop :', swapWorks ? 'PASS' : 'FAIL', `(${dumDiff.changedPct.toFixed(2)}% changed)`)
  console.log('console errors               :', errors.length)
  errors.forEach((e) => console.log('   -', e))

  if (!identical || !swapWorks || errors.length) process.exitCode = 1
}

run().catch((e) => { console.error(e); process.exit(1) })
