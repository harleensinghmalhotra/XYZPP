import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext(VP)
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 80)) })
page.on('pageerror', (e) => errors.push('PAGEERR:' + e.message.slice(0, 80)))
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() => document.fonts && document.fonts.ready)
await page.waitForTimeout(600)
const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
const topOf = (id) => page.evaluate((i) => document.getElementById(i).getBoundingClientRect().top + window.scrollY, id)
const hideNav = () => page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = 'hidden' })
const showNav = () => page.evaluate(() => { const n = document.querySelector('header'); if (n) n.style.visibility = '' })

// ═══════════ 2 · PRESS-LINE TIMING — stage 6 completes while fully visible ═══
const pTop = await topOf('process')
const pInfo = await page.evaluate(() => { const el = document.getElementById('process'); return { h: el.offsetHeight, vh: window.innerHeight } })
// end trigger = 'center center' → centre the section in the viewport
const centerScroll = Math.round(pTop + pInfo.h / 2 - pInfo.vh / 2)
await to(centerScroll)
await page.waitForTimeout(900) // let the scrub settle to progress 1
const press = await page.evaluate(() => {
  const el = document.getElementById('process')
  const r = el.getBoundingClientRect()
  const stages = [...document.querySelectorAll('.press-stage')]
  const last = stages[stages.length - 1]
  const lastLabel = last.querySelector('.press-label')
  const lastIcon = last.querySelector('.press-icon svg')
  const drawn = [...last.querySelectorAll('.pdraw')].every((p) => { const o = parseFloat(getComputedStyle(p).strokeDashoffset) || 0; return o < 2 })
  return {
    fullyVisible: r.top >= -2 && r.bottom <= window.innerHeight + 2,
    top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight,
    lastLabelOpacity: getComputedStyle(lastLabel).opacity,
    lastIconColor: getComputedStyle(lastIcon).color,
    stage6Inked: drawn,
  }
})
hideNav(); await page.screenshot({ path: resolve(out, 'pressline-timing.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } }); showNav()
console.log('PRESS-LINE TIMING (section centred = trigger end):')
console.log(`   section rect: top=${press.top}, bottom=${press.bottom}, vh=${press.vh} → fully visible: ${press.fullyVisible ? 'YES ✓' : 'NO ✗'}`)
console.log(`   stage 6 inked: strokes drawn=${press.stage6Inked}, label opacity=${press.lastLabelOpacity}, icon=${press.lastIconColor} → ${press.stage6Inked && +press.lastLabelOpacity > 0.8 ? 'PAYOFF VISIBLE ✓' : 'not yet ✗'}`)

// ═══════════ 1 · STATS TICKER — mid-roll ═════════════════════════════════════
await to(0); await page.waitForTimeout(300)
const tsTop = await topOf('trust')
// scroll the stats into view, then poll for a mid-roll frame
await to(Math.round(tsTop + (await page.evaluate(() => document.querySelector('.ts-stats').getBoundingClientRect().top + window.scrollY - document.getElementById('trust').getBoundingClientRect().top - window.innerHeight * 0.6))))
let midShot = false, midVals = null
for (let i = 0; i < 40; i++) {
  const vals = await page.evaluate(() => [...document.querySelectorAll('.ts-stat-num')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()))
  const nums = vals.map((v) => parseInt(v.replace(/[^\d]/g, ''), 10))
  // mid-roll if any number is > 0 but below its final (400/25/1000/98)
  const finals = [400, 25, 1000, 98]
  if (nums.some((n, k) => n > 0 && n < finals[k])) {
    midVals = vals; midShot = true
    hideNav(); await page.screenshot({ path: resolve(out, 'stats-ticker.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } }); showNav()
    break
  }
  await page.waitForTimeout(35)
}
await page.waitForTimeout(1400)
const finalVals = await page.evaluate(() => [...document.querySelectorAll('.ts-stat-num')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()))
console.log(`\nSTATS TICKER: mid-roll ${midShot ? 'captured ✓ ' + JSON.stringify(midVals) : 'MISSED ✗'}`)
console.log(`   final values: ${JSON.stringify(finalVals)}`)

// ═══════════ 3 · FOOTER LOGO ═════════════════════════════════════════════════
await to(Math.round((await topOf('contact')) - 20)); await page.waitForTimeout(500)
await page.evaluate(() => document.querySelector('#contact footer').scrollIntoView({ block: 'start' }))
await page.waitForTimeout(500)
const flogo = await page.evaluate(() => {
  const img = document.querySelector('#contact footer img')
  return img ? { src: img.getAttribute('src'), w: Math.round(img.getBoundingClientRect().width) } : null
})
hideNav(); await page.screenshot({ path: resolve(out, 'footer-logo.png'), clip: { x: 0, y: 0, width: 1536, height: 743 } }); showNav()
console.log(`\nFOOTER LOGO: ${flogo ? `src=${flogo.src}, width=${flogo.w}px (want 140–180)` : 'MISSING ✗'}`)

// ═══════════ axe on the touched sections ═════════════════════════════════════
for (const id of ['trust', 'process', 'contact']) {
  const axe = await new AxeBuilder({ page }).include('#' + id).analyze()
  console.log(`axe #${id}: ${axe.violations.length} violations`)
}
console.log('\nconsole errors:', errors.length ? errors : 'NONE ✓')

// ═══════════ reduced-motion: stats instant, press final ══════════════════════
const rc = await browser.newContext({ ...VP, reducedMotion: 'reduce' })
const rp = await rc.newPage()
await rp.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await rp.evaluate(() => document.getElementById('trust').scrollIntoView({ block: 'center' }))
await rp.waitForTimeout(700)
const rmStats = await rp.evaluate(() => [...document.querySelectorAll('.ts-stat-num')].map((n) => n.textContent.replace(/\s+/g, ' ').trim()))
console.log(`\nREDUCED-MOTION stats (want final instantly): ${JSON.stringify(rmStats)}`)
await rc.close()

await browser.close()
console.log('\nDONE.')
