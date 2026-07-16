// Homepage palette-unification verification (built output @ :4319).
// Full homepage scroll (section-by-section + fullpage), inner-page unchanged check,
// axe contrast, console log. Also samples navy/gold from rendered pixels.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'palette')
mkdirSync(out, { recursive: true })
const URL = process.env.BASE || 'http://127.0.0.1:4319'
const VP = { width: 1536, height: 743 }

const browser = await chromium.launch({ headless: true })
const settle = async (p, ms = 1200) => { await p.waitForTimeout(ms); try { await p.evaluate(() => document.fonts && document.fonts.ready) } catch {} ; await p.waitForTimeout(300) }
const scrollTo = (p, y) => p.evaluate((yy) => { if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true }); else window.scrollTo(0, yy) }, y)

// ── Homepage: scroll through, shoot each viewport-height slice ──
{
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  const total = await page.evaluate(() => document.body.scrollHeight)
  const step = Math.round(VP.height * 0.92)
  let i = 0
  for (let y = 0; y < total; y += step, i++) {
    await scrollTo(page, y)
    await page.waitForTimeout(500)
    await page.screenshot({ path: resolve(out, `home-${String(i).padStart(2, '0')}.png`) })
  }
  console.log(`OK homepage: ${i} slices, height ${total}px | console errors: ${errors.length}`)
  if (errors.length) console.log('   ', errors.slice(0, 8).join('\n    '))

  // Sample rendered navy/gold from a few homepage elements.
  const probe = await page.evaluate(() => {
    const bg = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).backgroundColor : null }
    const col = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).color : null }
    const rootNavy = getComputedStyle(document.querySelector('.home-palette')).getPropertyValue('--navy')
    const rootGold = getComputedStyle(document.querySelector('.home-palette')).getPropertyValue('--gold')
    return { heroBg: bg('#hero'), homeNavyVar: rootNavy.trim(), homeGoldVar: rootGold.trim() }
  })
  console.log('   home --navy:', probe.homeNavyVar, '| --gold:', probe.homeGoldVar, '| #hero bg:', probe.heroBg)

  // axe (contrast focus)
  const results = await new AxeBuilder({ page }).include('#main').analyze()
  const contrast = results.violations.filter((v) => v.id === 'color-contrast')
  await writeFile(resolve(out, 'axe-home.json'), JSON.stringify({
    total: results.violations.length,
    ids: results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    contrastNodes: contrast.flatMap((v) => v.nodes.map((n) => ({ html: n.html.slice(0, 120), summary: (n.any?.[0]?.message || '').slice(0, 160) }))),
  }, null, 2))
  console.log(`OK axe home: ${results.violations.length} violations | color-contrast nodes: ${contrast.reduce((s, v) => s + v.nodes.length, 0)}`)
  for (const v of results.violations) console.log(`   [${v.impact}] ${v.id} x${v.nodes.length}`)
  await ctx.close()
}

// ── Inner page (About) — must be UNCHANGED ──
{
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  await page.goto(URL + '/about', { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await page.screenshot({ path: resolve(out, 'about.png'), fullPage: false })
  const navy = await page.evaluate(() => {
    const r = getComputedStyle(document.documentElement)
    return { navy: r.getPropertyValue('--navy').trim(), gold: r.getPropertyValue('--gold').trim(), goldNode: (() => { const el = document.querySelector('.home-palette'); return el ? 'HAS home-palette (unexpected)' : 'no home-palette (correct)' })() }
  })
  console.log('OK about: :root --navy', navy.navy, '| --gold', navy.gold, '|', navy.goldNode)
  await ctx.close()
}

await browser.close()
console.log('\nArtefacts ->', out)
