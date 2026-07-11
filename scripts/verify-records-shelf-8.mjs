import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5193'
const out = resolve(root, 'shots', 'records-shelf-8')
mkdirSync(out, { recursive: true })

// section height on the 6-book (gate-off) shelf, for the before/after delta
const BEFORE = { sectionH: 1854 }

const browser = await chromium.launch({ headless: false })
const VP = { width: 1536, height: 743 }
const consoleErrors = []
function wire(page) {
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))
}
async function fresh(path = '/', { lang, reduced } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25, ...(reduced ? { reducedMotion: 'reduce' } : {}) })
  const page = await ctx.newPage()
  wire(page)
  if (lang) await page.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(500)
  return { ctx, page }
}
async function centerOn(page, sel, settle = 1800) {
  await page.evaluate((s) => {
    const g = document.querySelector(s)
    const r = g.getBoundingClientRect()
    const y = r.top + window.scrollY - (window.innerHeight - r.height) / 2
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
  }, sel)
  await page.waitForTimeout(settle)
}
async function clipOf(page, sel, pad = 14) {
  const b = await (await page.$(sel)).boundingBox()
  const x = Math.max(0, Math.round(b.x - pad)), y = Math.max(0, Math.round(b.y - pad))
  return { x, y, width: Math.min(VP.width - x, Math.round(b.width + pad * 2)), height: Math.min(VP.height - y, Math.round(b.height + pad * 2)) }
}

// ── 1. EN shelf — 8 books, new HDFC/ZEE render, layout + height ──────────────
{
  const { ctx, page } = await fresh()
  await centerOn(page, '.proj-books')
  await page.screenshot({ path: resolve(out, 'shelf-en.png'), clip: await clipOf(page, '.proj-books') })

  const info = await page.evaluate(() => {
    const sec = document.getElementById('projects')
    const rail = document.querySelector('.proj-books-rail')
    const scroll = document.querySelector('.proj-books-scroll')
    const books = [...document.querySelectorAll('.proj-book')].map((b) => ({
      country: b.querySelector('.proj-book-country')?.textContent.trim(),
      figure: b.querySelector('.proj-book-countn')?.textContent,
      variant: b.className.match(/proj-book--(\w+)/)?.[1],
      stamp: b.querySelector('.proj-book-stamp-arc-text')?.textContent.trim() || null,
    }))
    // reachability of both ends of the scroll (centre-justified overflow trap check)
    scroll.scrollLeft = 0; const left0 = scroll.scrollLeft
    scroll.scrollLeft = 99999; const rightMax = scroll.scrollLeft
    scroll.scrollLeft = 0
    return {
      count: books.length,
      books,
      hdfc: books.find((b) => /HDFC/i.test(b.country || '')),
      zee: books.find((b) => /ZEE/i.test(b.country || '')),
      railW: rail.scrollWidth,
      scrollW: scroll.clientWidth,
      overflows: rail.scrollWidth > scroll.clientWidth + 1,
      leftReachable: left0 === 0,
      rightReachable: rightMax > 0,
      sectionH: Math.round(sec.getBoundingClientRect().height),
    }
  })
  console.log('  ✓ shelf-en.png')
  console.log('    book count:', info.count, '(want 8)')
  for (const b of info.books) console.log(`      · ${b.variant.padEnd(5)} ${String(b.country).padEnd(16)} ${String(b.figure).padEnd(7)} stamp:${b.stamp ?? '—'}`)
  console.log('    HDFC:', JSON.stringify(info.hdfc), '| ZEE:', JSON.stringify(info.zee))
  console.log(`    LAYOUT: rail ${info.railW}px vs scroll box ${info.scrollW}px → ${info.overflows ? 'SCROLLS' : 'fits one row'} | left-reachable:${info.leftReachable} right-reachable:${info.rightReachable}`)
  console.log(`    SECTION HEIGHT: 6-book ${BEFORE.sectionH}px → 8-book ${info.sectionH}px (Δ ${info.sectionH - BEFORE.sectionH}px)`)

  // scroll to the right end to shoot the two new books
  await page.evaluate(() => { const s = document.querySelector('.proj-books-scroll'); s.scrollLeft = 99999 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(out, 'shelf-en-newbooks.png'), clip: await clipOf(page, '.proj-books') })
  console.log('  ✓ shelf-en-newbooks.png — scrolled to HDFC + ZEE')
  await ctx.close()
}

// ── 2. Hover pull on both new books (HDFC + ZEE) ─────────────────────────────
{
  const { ctx, page } = await fresh()
  await centerOn(page, '.proj-books')
  for (const name of ['HDFC', 'ZEE']) {
    const handle = await page.evaluateHandle((n) => {
      return [...document.querySelectorAll('.proj-book')].find((b) => new RegExp(n, 'i').test(b.querySelector('.proj-book-country')?.textContent || ''))
    }, name)
    const el = handle.asElement()
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    const bb = await el.boundingBox()
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
    await page.waitForTimeout(520)
    const st = await page.evaluate((n) => {
      const b = [...document.querySelectorAll('.proj-book')].find((x) => new RegExp(n, 'i').test(x.querySelector('.proj-book-country')?.textContent || ''))
      const inner = b.querySelector('.proj-book-inner')
      return { is3d: getComputedStyle(inner).transform.startsWith('matrix3d'), z: getComputedStyle(b).zIndex }
    }, name)
    await page.screenshot({ path: resolve(out, `hover-${name.toLowerCase()}.png`), clip: await clipOf(page, '.proj-books') })
    console.log(`  ✓ hover-${name.toLowerCase()}.png — pull 3d:${st.is3d ? '✓' : '✗'} z:${st.z}`)
    await page.mouse.move(4, 4)
    await page.waitForTimeout(300)
  }
  await ctx.close()
}

// ── 3. CountUp on the new books (mid-animation) ──────────────────────────────
{
  const { ctx, page } = await fresh()
  await page.evaluate(() => { const g = document.querySelector('.proj-books').getBoundingClientRect(); const y = g.top + window.scrollY - window.innerHeight * 0.95; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y) })
  await page.waitForTimeout(300)
  await page.evaluate(() => { const g = document.querySelector('.proj-books').getBoundingClientRect(); const y = g.top + window.scrollY - (window.innerHeight - g.height) / 2; if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y) })
  let mid = null
  for (let i = 0; i < 44; i++) {
    const vals = await page.evaluate(() => {
      const pick = (n) => [...document.querySelectorAll('.proj-book')].find((b) => new RegExp(n, 'i').test(b.querySelector('.proj-book-country')?.textContent || ''))?.querySelector('.proj-book-countn')?.textContent
      return { hdfc: pick('HDFC'), zee: pick('ZEE') }
    })
    if ((vals.hdfc && vals.hdfc !== '0M+' && vals.hdfc !== '1.3M+') || (vals.zee && vals.zee !== '0M+' && vals.zee !== '0.5M+')) { mid = vals; break }
    await page.waitForTimeout(40)
  }
  await page.screenshot({ path: resolve(out, 'countup-mid.png'), clip: await clipOf(page, '.proj-books') })
  console.log('  ✓ countup-mid.png — new-book mid-count:', JSON.stringify(mid || 'not caught'))
  await ctx.close()
}

// ── 4. FR shelf — 8 books, ZEE stamp = Kits d'apprentissage ──────────────────
{
  const { ctx, page } = await fresh('/', { lang: 'fr' })
  await centerOn(page, '.proj-books')
  await page.evaluate(() => { const s = document.querySelector('.proj-books-scroll'); s.scrollLeft = 99999 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, 'shelf-fr.png'), clip: await clipOf(page, '.proj-books') })
  const fr = await page.evaluate(() => {
    const pick = (n) => [...document.querySelectorAll('.proj-book')].find((b) => new RegExp(n, 'i').test(b.querySelector('.proj-book-country')?.textContent || ''))
    const zee = pick('ZEE')
    return {
      lang: document.documentElement.lang,
      count: document.querySelectorAll('.proj-book').length,
      zeeCountry: zee?.querySelector('.proj-book-country')?.textContent.trim(),
      zeeStamp: zee?.querySelector('.proj-book-stamp-arc-text')?.textContent.trim(),
      hdfcCountry: pick('HDFC')?.querySelector('.proj-book-country')?.textContent.trim(),
    }
  })
  console.log('  ✓ shelf-fr.png — lang:', fr.lang, '| books:', fr.count, '| HDFC:', JSON.stringify(fr.hdfcCountry), '| ZEE:', JSON.stringify(fr.zeeCountry), 'stamp:', JSON.stringify(fr.zeeStamp))
  await ctx.close()
}

// ── 5. Reduced motion — final figures, no shimmer ────────────────────────────
{
  const { ctx, page } = await fresh('/', { reduced: true })
  await centerOn(page, '.proj-books', 900)
  await page.screenshot({ path: resolve(out, 'reduced-motion.png'), clip: await clipOf(page, '.proj-books') })
  const rm = await page.evaluate(() => ({
    anim: getComputedStyle(document.querySelector('.proj-book-countn')).animationName,
    figs: [...document.querySelectorAll('.proj-book-countn')].map((e) => e.textContent),
  }))
  console.log('  ✓ reduced-motion.png — countn animation:', rm.anim, '(want none) | figures:', JSON.stringify(rm.figs))
  await ctx.close()
}

// ── 6. BLAST RADIUS — TrustStrips (shared flag) should now show HDFC/ZEE/Reliance
{
  const { ctx, page } = await fresh()
  await centerOn(page, '#trust', 1200).catch(() => {})
  const ts = await page.evaluate(() => {
    const strip = document.querySelector('#trust')
    const all = strip ? strip.innerText : document.body.innerText
    return {
      found: !!strip,
      hasHDFC: /HDFC/i.test(all),
      hasZEE: /ZEE/i.test(all),
      hasReliance: /Reliance/i.test(all),
    }
  })
  const clip = await clipOf(page, '#trust').catch(() => null)
  if (clip) await page.screenshot({ path: resolve(out, 'blast-truststrips.png'), clip })
  else await page.screenshot({ path: resolve(out, 'blast-truststrips.png') })
  console.log('  ✓ blast-truststrips.png — HDFC:', ts.hasHDFC, '| ZEE:', ts.hasZEE, '| Reliance:', ts.hasReliance, '(shared flag → expect all true)')
  await ctx.close()
}

// ── 7. BLAST RADIUS — About page (LOCAL const, should NOT change) ────────────
{
  const { ctx, page } = await fresh('/about')
  await page.waitForTimeout(1200)
  const ab = await page.evaluate(() => ({
    hasHDFC: /HDFC/i.test(document.body.innerText),
    hasZEE: /ZEE/i.test(document.body.innerText),
    hasReliance: /Reliance/i.test(document.body.innerText),
  }))
  await page.screenshot({ path: resolve(out, 'blast-about.png'), fullPage: false })
  console.log('  ⚠ blast-about.png — HDFC:', ab.hasHDFC, '| ZEE:', ab.hasZEE, '| Reliance:', ab.hasReliance, '(LOCAL const false → expect all FALSE = unchanged)')
  await ctx.close()
}

// ── 8. BLAST RADIUS — Fulfilment page (LOCAL const, should NOT change) ───────
{
  const { ctx, page } = await fresh('/fulfilment')
  await page.waitForTimeout(1200)
  const fu = await page.evaluate(() => ({
    hasHDFC: /HDFC/i.test(document.body.innerText),
    hasZEE: /ZEE/i.test(document.body.innerText),
    hasReliance: /Reliance/i.test(document.body.innerText),
  }))
  await page.screenshot({ path: resolve(out, 'blast-fulfilment.png'), fullPage: false })
  console.log('  ⚠ blast-fulfilment.png — HDFC:', fu.hasHDFC, '| ZEE:', fu.hasZEE, '| Reliance:', fu.hasReliance, '(LOCAL const false → expect all FALSE = unchanged)')
  await ctx.close()
}

console.log('\nCONSOLE ERRORS:', consoleErrors.length)
for (const e of consoleErrors.slice(0, 12)) console.log('   ⚠', e)
await browser.close()
console.log('DONE → shots/records-shelf-8/')
