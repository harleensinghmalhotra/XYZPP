import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5193'
const out = resolve(root, 'shots', 'records-shelf')
mkdirSync(out, { recursive: true })

// baseline captured on the pre-rebuild card grid (scripts/_records-before.mjs)
const BEFORE = { sectionH: 1987, blockH: 508 }

const browser = await chromium.launch({ headless: false })
const VP = { width: 1536, height: 743 }
const consoleErrors = []

function wire(page) {
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
}
async function fresh({ lang, reduced } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25, ...(reduced ? { reducedMotion: 'reduce' } : {}) })
  const page = await ctx.newPage()
  wire(page)
  if (lang) await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(500)
  return { ctx, page }
}
async function centerBooks(page, settle = 1800) {
  await page.evaluate(() => {
    const g = document.querySelector('.proj-books')
    const r = g.getBoundingClientRect()
    const y = r.top + window.scrollY - (window.innerHeight - r.height) / 2
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
  })
  await page.waitForTimeout(settle)
}
async function booksClip(page) {
  const b = await (await page.$('.proj-books')).boundingBox()
  const x = Math.max(0, Math.round(b.x - 12))
  const y = Math.max(0, Math.round(b.y - 12))
  return { x, y, width: Math.min(VP.width - x, Math.round(b.width + 24)), height: Math.min(VP.height - y, Math.round(b.height + 24)) }
}

// ── 1. EN full shelf + gate-off DOM assert + section-height delta ─────────────
{
  const { ctx, page } = await fresh()
  await centerBooks(page)
  await page.screenshot({ path: resolve(out, 'shelf-en.png'), clip: await booksClip(page) })

  const info = await page.evaluate(() => {
    const html = document.querySelector('.proj-books').innerHTML
    const sec = document.getElementById('projects')
    return {
      books: document.querySelectorAll('.proj-book').length,
      milestone: document.querySelectorAll('.proj-book.is-milestone').length,
      countns: [...document.querySelectorAll('.proj-book-countn')].map((e) => e.textContent),
      countries: [...document.querySelectorAll('.proj-book-country')].map((e) => e.textContent.trim()),
      stamps: [...document.querySelectorAll('.proj-book-stamp-arc-text')].map((e) => e.textContent.trim()),
      banner: document.querySelector('.proj-book-banner')?.textContent.trim(),
      hasHDFC: /HDFC/i.test(html),
      hasZEE: /ZEE/i.test(html),
      sectionH: Math.round(sec.getBoundingClientRect().height),
      blockH: Math.round(document.querySelector('.proj-books').getBoundingClientRect().height),
    }
  })
  console.log('  ✓ shelf-en.png')
  console.log('    books:', info.books, '| milestone:', info.milestone, '| banner:', JSON.stringify(info.banner))
  console.log('    countries:', JSON.stringify(info.countries))
  console.log('    figures:', JSON.stringify(info.countns))
  console.log('    stamps:', JSON.stringify(info.stamps))
  console.log('    GATE-OFF → HDFC in DOM:', info.hasHDFC, '| ZEE in DOM:', info.hasZEE, '(both want false)')
  console.log(`    SECTION HEIGHT  before ${BEFORE.sectionH}px → after ${info.sectionH}px  (Δ ${info.sectionH - BEFORE.sectionH}px)`)
  console.log(`    RECORDS BLOCK   before ${BEFORE.blockH}px → after ${info.blockH}px  (Δ ${info.blockH - BEFORE.blockH}px)`)

  // AA contrast on cover copy (country + human line). The gradient-clipped figure
  // is checked separately (axe can't read background-clip:text), see step 6.
  const axe = await new AxeBuilder({ page }).include('.proj-books').analyze()
  const cc = axe.violations.filter((v) => v.id === 'color-contrast')
  console.log('  axe .proj-books — total violations:', axe.violations.length, '| color-contrast:', cc.length)
  for (const v of axe.violations) console.log(`     [${v.impact}] ${v.id}: ${v.nodes.length} node(s) →`, v.nodes[0]?.target?.join(' '))
  await ctx.close()
}

// ── 2. Hover pull forced on 3 different books ────────────────────────────────
{
  const { ctx, page } = await fresh()
  await centerBooks(page)
  const targets = [0, 2, 4] // milestone(navy), navy row, navy row
  for (const idx of targets) {
    await page.mouse.move(4, 4)
    await page.waitForTimeout(400)
    const book = (await page.$$('.proj-book'))[idx]
    const bb = await book.boundingBox()
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
    await page.waitForTimeout(520)
    const st = await page.evaluate((i) => {
      const el = document.querySelectorAll('.proj-book')[i]
      const inner = el.querySelector('.proj-book-inner')
      const shadow = el.querySelector('.proj-book-shadow')
      return {
        transform: getComputedStyle(inner).transform.slice(0, 24),
        is3d: getComputedStyle(inner).transform.startsWith('matrix3d'),
        z: getComputedStyle(el).zIndex,
        shadowT: getComputedStyle(shadow).transform.slice(0, 24),
      }
    }, idx)
    await page.screenshot({ path: resolve(out, `hover-book-${idx}.png`), clip: await booksClip(page) })
    console.log(`  ✓ hover-book-${idx}.png — inner 3d:${st.is3d ? '✓' : '✗'} (${st.transform}…) z:${st.z} shadow scaled:${st.shadowT !== 'none' ? '✓' : '✗'}`)
  }
  await page.mouse.move(4, 4)
  await ctx.close()
}

// ── 3. Milestone book detail (banner, ribbon, taller, no round stamp) ─────────
{
  const { ctx, page } = await fresh()
  await centerBooks(page)
  const m = await (await page.$('.proj-book.is-milestone')).boundingBox()
  const clip = { x: Math.max(0, Math.round(m.x - 22)), y: Math.max(0, Math.round(m.y - 30)), width: Math.round(m.width + 60), height: Math.round(m.height + 50) }
  await page.screenshot({ path: resolve(out, 'milestone-detail.png'), clip })
  const md = await page.evaluate(() => {
    const ms = document.querySelector('.proj-book.is-milestone')
    const reg = document.querySelectorAll('.proj-book:not(.is-milestone)')[0]
    return {
      milestoneH: Math.round(ms.querySelector('.proj-book-cover').getBoundingClientRect().height),
      regularH: Math.round(reg.querySelector('.proj-book-cover').getBoundingClientRect().height),
      hasRibbon: !!ms.querySelector('.proj-book-ribbon'),
      hasBanner: !!ms.querySelector('.proj-book-banner'),
      hasRoundStamp: !!ms.querySelector('.proj-book-stamp'),
      firstChild: document.querySelector('.proj-books-rail').firstElementChild.classList.contains('is-milestone'),
    }
  })
  console.log('  ✓ milestone-detail.png')
  console.log(`    taller: milestone ${md.milestoneH}px vs regular ${md.regularH}px | ribbon:${md.hasRibbon} banner:${md.hasBanner} roundStamp:${md.hasRoundStamp} (want false) firstInRow:${md.firstChild}`)
  await ctx.close()
}

// ── 4. CountUp mid-animation frame ───────────────────────────────────────────
{
  const { ctx, page } = await fresh()
  // position the block just below the trigger, then scroll it in so the reveal fires
  await page.evaluate(() => {
    const g = document.querySelector('.proj-books')
    const r = g.getBoundingClientRect()
    const y = r.top + window.scrollY - window.innerHeight * 0.95
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
  })
  await page.waitForTimeout(300)
  await page.evaluate(() => {
    const g = document.querySelector('.proj-books')
    const r = g.getBoundingClientRect()
    const y = r.top + window.scrollY - (window.innerHeight - r.height) / 2
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
  })
  // grab the earliest frame where a figure is mid-count (not "0M+" nor its final)
  let mid = null
  for (let i = 0; i < 40; i++) {
    const vals = await page.evaluate(() => [...document.querySelectorAll('.proj-book-countn')].map((e) => e.textContent))
    const anyMid = vals.some((v) => v !== '0M+' && v !== '10M+' && v !== '8M+' && v !== '4M+' && v !== '3.5M+' && v !== '2M+' && v !== '1.5M+')
    if (anyMid) { mid = vals; break }
    await page.waitForTimeout(45)
  }
  await page.screenshot({ path: resolve(out, 'countup-mid.png'), clip: await booksClip(page) })
  console.log('  ✓ countup-mid.png — mid-count figures:', JSON.stringify(mid || 'not caught'))
  await ctx.close()
}

// ── 5. FR full shelf ─────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ lang: 'fr' })
  await centerBooks(page)
  await page.screenshot({ path: resolve(out, 'shelf-fr.png'), clip: await booksClip(page) })
  const fr = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    eyebrow: document.querySelector('.proj-books-eyebrow').textContent.trim(),
    banner: document.querySelector('.proj-book-banner')?.textContent.trim(),
    countries: [...document.querySelectorAll('.proj-book-country')].map((e) => e.textContent.trim()),
    stamps: [...document.querySelectorAll('.proj-book-stamp-arc-text')].map((e) => e.textContent.trim()),
  }))
  console.log('  ✓ shelf-fr.png — lang:', fr.lang, '| eyebrow:', JSON.stringify(fr.eyebrow), '| banner:', JSON.stringify(fr.banner))
  console.log('    countries:', JSON.stringify(fr.countries), '| stamps:', JSON.stringify(fr.stamps))
  await ctx.close()
}

// ── 6. Reduced motion → final figures immediately, hover = glow (no transform) ─
{
  const { ctx, page } = await fresh({ reduced: true })
  await centerBooks(page, 900)
  const c = await booksClip(page)
  const r1 = await page.screenshot({ clip: c })
  await page.waitForTimeout(1300)
  const r2 = await page.screenshot({ clip: c })
  const [b1, b2] = await Promise.all([sharp(r1).raw().toBuffer({ resolveWithObject: true }), sharp(r2).raw().toBuffer({ resolveWithObject: true })])
  let diff = 0
  for (let i = 0; i < b1.data.length; i += 4) if (Math.abs(b1.data[i] - b2.data[i]) + Math.abs(b1.data[i + 1] - b2.data[i + 1]) + Math.abs(b1.data[i + 2] - b2.data[i + 2]) > 24) diff++
  const pct = +(diff / (b1.data.length / 4) * 100).toFixed(3)
  await page.screenshot({ path: resolve(out, 'reduced-motion.png'), clip: c })

  const rm = await page.evaluate(() => {
    const anim = getComputedStyle(document.querySelector('.proj-book-countn')).animationName
    const figs = [...document.querySelectorAll('.proj-book-countn')].map((e) => e.textContent)
    return { anim, figs }
  })
  // hover under reduced motion → transform stays at base (no pull), glow via box-shadow
  const book = (await page.$$('.proj-book'))[2]
  const bb = await book.boundingBox()
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
  await page.waitForTimeout(400)
  const hov = await page.evaluate(() => {
    const el = document.querySelectorAll('.proj-book')[2]
    return { inner: getComputedStyle(el.querySelector('.proj-book-inner')).transform, cover: getComputedStyle(el.querySelector('.proj-book-cover')).boxShadow.includes('rgb') }
  })
  await page.screenshot({ path: resolve(out, 'reduced-motion-hover.png'), clip: c })
  await page.mouse.move(4, 4)
  console.log(`  ✓ reduced-motion.png — figures immediate:${JSON.stringify(rm.figs)} | countn animation:${rm.anim} (want none) | frame diff ${pct}% (want ~0)`)
  console.log(`  ✓ reduced-motion-hover.png — hover inner transform not-pulled:${!hov.inner.startsWith('matrix3d') || hov.inner === 'none'} glow box-shadow:${hov.cover}`)
  await ctx.close()
}

// ── 7. FPS scrolling the section (globe + shelf live) ────────────────────────
{
  const { ctx, page } = await fresh()
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
  console.log('  FPS (globe + shelf live):', JSON.stringify(fps))
  await ctx.close()
}

console.log('\nCONSOLE ERRORS:', consoleErrors.length)
for (const e of consoleErrors.slice(0, 12)) console.log('   ⚠', e)
await browser.close()
console.log('DONE → shots/records-shelf/')
