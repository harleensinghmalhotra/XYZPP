import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5193'
const out = resolve(root, 'shots', 'destinations-revamp')
mkdirSync(out, { recursive: true })

const CANDS = {
  africa: ['africa-1.jpg', 'africa-2.jpg', 'africa-3.jpg', 'africa-4.jpg'],
  asia: ['asia-1.jpg', 'asia-2.jpg', 'asia-3.jpg'],
  europe: ['europe-1.jpg', 'europe-2.jpg', 'europe-3.jpg', 'europe-4.jpg'],
}
const SLUGS = ['africa', 'asia', 'europe']

const browser = await chromium.launch({ headless: false })
const VP = { width: 1536, height: 743 }
const consoleErrors = []

function wireErrors(page) {
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
}

async function fresh(url, { lang, reduced } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25, ...(reduced ? { reducedMotion: 'reduce' } : {}) })
  const page = await ctx.newPage()
  wireErrors(page)
  if (lang) await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(700)
  return { ctx, page }
}

// scroll the destination GRID (the panels themselves) to a stable, fully-in-frame
// position — the reveal is scroll-triggered, so settle long enough for it to finish.
async function frameDests(page) {
  await page.evaluate(() => {
    const g = document.querySelector('.proj-dests-grid')
    const r = g.getBoundingClientRect()
    const y = r.top + window.scrollY - (window.innerHeight - r.height) / 2
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
  })
  await page.waitForTimeout(1500)
}
async function destsClip(page) {
  const b = await (await page.$('.proj-dests-grid')).boundingBox()
  const x = Math.max(0, Math.round(b.x - 16))
  const y = Math.max(0, Math.round(b.y - 44)) // headroom for the eyebrow above the grid
  return { x, y, width: Math.min(VP.width - x, Math.round(b.width + 32)), height: Math.min(VP.height - y, Math.round(b.height + 60)) }
}

// ── 1. EN full section + default (navy) glow ─────────────────────────────────
{
  const { ctx, page } = await fresh(base)
  await frameDests(page)
  await page.screenshot({ path: resolve(out, 'dests-en-navy.png'), clip: await destsClip(page) })
  console.log('  ✓ dests-en-navy.png — EN, default gold→navy glow')

  // report which images + descriptors actually render
  const info = await page.evaluate(() => ({
    imgs: [...document.querySelectorAll('.proj-dest-photo')].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), natural: i.naturalWidth })),
    kickers: [...document.querySelectorAll('.proj-dest-kicker')].map((k) => k.textContent.trim()),
    names: [...document.querySelectorAll('.proj-dest-name')].map((n) => n.textContent.trim()),
  }))
  console.log('    imgs:', JSON.stringify(info.imgs))
  console.log('    kickers:', JSON.stringify(info.kickers), '| names:', JSON.stringify(info.names))

  // ── hover each panel → glow brightens, card lifts ──────────────────────────
  const panels = await page.$$('.proj-dest')
  for (let i = 0; i < panels.length; i++) {
    await page.mouse.move(6, 6)
    await page.waitForTimeout(500)
    const pb = await panels[i].boundingBox()
    await page.mouse.move(pb.x + pb.width / 2, Math.min(pb.y + 60, VP.height - 12))
    await page.waitForTimeout(800)
    const st = await page.evaluate((idx) => {
      const el = document.querySelectorAll('.proj-dest')[idx]
      const aft = getComputedStyle(el, '::after')
      return { lift: getComputedStyle(el).transform, glowOpacity: aft.opacity, glowBg: aft.backgroundImage.slice(0, 60) }
    }, i)
    await page.screenshot({ path: resolve(out, `hover-${SLUGS[i]}.png`), clip: await destsClip(page) })
    console.log(`  ✓ hover-${SLUGS[i]}.png — lift:${st.lift !== 'none' ? '✓' : '✗'} glow::after opacity:${st.glowOpacity} bg:${st.glowBg}`)
  }
  await page.mouse.move(6, 6)

  // ── contrast: sample label text vs the scrim beneath it (AA on both) ────────
  const axe = await new AxeBuilder({ page }).include('.proj-dests').analyze()
  const contrastV = axe.violations.filter((v) => v.id === 'color-contrast')
  console.log('  axe .proj-dests — total violations:', axe.violations.length, '| color-contrast:', contrastV.length)
  for (const v of axe.violations) console.log(`     [${v.impact}] ${v.id}: ${v.nodes.length} node(s)`)

  await ctx.close()
}

// ── 2. OLIVE variant (side-by-side comparison) ───────────────────────────────
{
  const { ctx, page } = await fresh(base + '?glow=olive')
  await frameDests(page)
  await page.screenshot({ path: resolve(out, 'dests-en-olive.png'), clip: await destsClip(page) })
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.proj-dest'), '::after').backgroundImage.slice(0, 80))
  console.log('  ✓ dests-en-olive.png — olive glow ::after bg:', bg)
  await ctx.close()
}
// compose navy | olive side-by-side
try {
  const a = resolve(out, 'dests-en-navy.png'), b = resolve(out, 'dests-en-olive.png')
  const ma = await sharp(a).metadata()
  const gap = 24
  await sharp({ create: { width: ma.width * 2 + gap, height: ma.height, channels: 4, background: { r: 6, g: 10, b: 20, alpha: 1 } } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: ma.width + gap, top: 0 }])
    .png().toFile(resolve(out, 'variants-navy-vs-olive.png'))
  console.log('  ✓ variants-navy-vs-olive.png — LEFT navy · RIGHT olive')
} catch (e) { console.log('  ✗ compose failed:', e.message) }

// ── 3. Each image candidate in place (per-panel crop) ────────────────────────
{
  const { ctx, page } = await fresh(base)
  await frameDests(page)
  for (let i = 0; i < SLUGS.length; i++) {
    const slug = SLUGS[i]
    for (const file of CANDS[slug]) {
      await page.evaluate(({ idx, f }) => {
        const img = document.querySelectorAll('.proj-dest-photo')[idx]
        img.src = '/qfp/destinations/' + f
      }, { idx: i, f: file })
      await page.waitForTimeout(450)
      const panel = (await page.$$('.proj-dest'))[i]
      const pb = await panel.boundingBox()
      const clip = { x: Math.max(0, Math.round(pb.x - 14)), y: Math.max(0, Math.round(pb.y - 14)), width: Math.round(pb.width + 28), height: Math.min(VP.height - Math.max(0, Math.round(pb.y - 14)), Math.round(pb.height + 28)) }
      await page.screenshot({ path: resolve(out, `cand-${file.replace('.jpg', '')}.png`), clip })
    }
    console.log(`  ✓ cand-${slug}-*.png — ${CANDS[slug].length} candidates in place`)
  }
  await ctx.close()
}

// ── 4. FR full section ───────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh(base, { lang: 'fr' })
  await frameDests(page)
  await page.screenshot({ path: resolve(out, 'dests-fr-navy.png'), clip: await destsClip(page) })
  const fr = await page.evaluate(() => ({
    kickers: [...document.querySelectorAll('.proj-dest-kicker')].map((k) => k.textContent.trim()),
    lang: document.documentElement.lang,
  }))
  console.log('  ✓ dests-fr-navy.png — FR kickers:', JSON.stringify(fr.kickers), 'lang:', fr.lang)
  await ctx.close()
}

// ── 5. Reduced motion → glow static ──────────────────────────────────────────
{
  const { ctx, page } = await fresh(base, { reduced: true })
  await frameDests(page)
  const c = await destsClip(page)
  const r1 = await page.screenshot({ clip: c })
  await page.waitForTimeout(1400)
  const r2 = await page.screenshot({ clip: c })
  // diff to prove the breathe is OFF
  const [b1, b2] = await Promise.all([sharp(r1).raw().toBuffer({ resolveWithObject: true }), sharp(r2).raw().toBuffer({ resolveWithObject: true })])
  let diff = 0
  for (let i = 0; i < b1.data.length; i += 4) if (Math.abs(b1.data[i] - b2.data[i]) + Math.abs(b1.data[i + 1] - b2.data[i + 1]) + Math.abs(b1.data[i + 2] - b2.data[i + 2]) > 24) diff++
  const pct = +(diff / (b1.data.length / 4) * 100).toFixed(3)
  await page.screenshot({ path: resolve(out, 'reduced-motion.png'), clip: c })
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.proj-dest'), '::after').animationName)
  console.log(`  ✓ reduced-motion.png — frame diff ${pct}% (want ~0) | ::after animation-name: ${anim} (want none)`)
  await ctx.close()
}

// ── 6. FPS with globe + glow live ────────────────────────────────────────────
{
  const { ctx, page } = await fresh(base)
  const geo = await page.evaluate(() => {
    const el = document.getElementById('projects')
    return { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, innerH: window.innerHeight }
  })
  await page.evaluate((y) => { if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y) }, Math.round(geo.top - geo.innerH))
  await page.waitForTimeout(300)
  const fps = await page.evaluate(({ y }) => new Promise((done) => {
    const d = []; let last = performance.now(); let raf
    const s = (t) => { d.push(t - last); last = t; raf = requestAnimationFrame(s) }
    raf = requestAnimationFrame(s)
    const dur = 2400
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur / 1000 }); else window.scrollTo(0, y)
    setTimeout(() => { cancelAnimationFrame(raf); const arr = d.slice(3).sort((a, b) => a - b); const mean = arr.reduce((a, b) => a + b, 0) / arr.length; done({ fpsMean: +(1000 / mean).toFixed(1), longFrames: arr.filter((x) => x > 18.5).length }) }, dur + 250)
  }), { y: geo.top + geo.h })
  console.log('  FPS (globe + glow live):', JSON.stringify(fps))
  await ctx.close()
}

console.log('\nCONSOLE ERRORS:', consoleErrors.length)
for (const e of consoleErrors.slice(0, 12)) console.log('   ⚠', e)
await browser.close()
console.log('DONE → shots/destinations-revamp/')
