// STEP 1 recon: study alternativinc.com hero frame-by-frame + dump real
// transform values on the hero layers at several scroll depths.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })
const URL = 'https://www.alternativinc.com/'

// snapshot every transformed element currently in/near the viewport
const dumpTransforms = () =>
  Array.from(document.querySelectorAll('*'))
    .map((el) => {
      const s = getComputedStyle(el)
      if (s.transform === 'none' && s.opacity === '1') return null
      const r = el.getBoundingClientRect()
      if (r.width < 40 || r.height < 40) return null
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return null
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 50),
        transform: s.transform,
        opacity: s.opacity,
        top: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      }
    })
    .filter(Boolean)
    .slice(0, 30)

const browser = await chromium.launch()
const log = { desktop: [], mobile: [], mechanism: null }

// ---------- DESKTOP 1440x900, 25 steps @ 40px ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(7000) // fonts, hero media, entrance animation

  // dismiss common consent overlays
  for (const t of ['Accept', 'Accept all', 'I agree', 'Agree', 'OK', 'Got it']) {
    const b = page.getByRole('button', { name: new RegExp(t, 'i') }).first()
    if (await b.count()) { await b.click().catch(() => {}); break }
  }
  await page.waitForTimeout(500)

  // detect scroll mechanism
  log.mechanism = await page.evaluate(() => ({
    lenis: !!window.__lenis || !!document.querySelector('.lenis'),
    locomotive: !!document.querySelector('[data-scroll-container],[data-scroll]'),
    bodyScrollHeight: document.body.scrollHeight,
    hasSmoothWrapper: !!document.querySelector('#smooth-wrapper,#smooth-content'),
  }))

  await page.mouse.move(720, 450)
  const dumpAt = [0, 3, 8, 16]
  for (let i = 0; i < 25; i++) {
    const y = await page.evaluate(() => window.scrollY || (window.__lenis && window.__lenis.scroll) || 0)
    const frame = String(i).padStart(3, '0')
    await page.screenshot({ path: resolve(out, `alt-scroll-${frame}.png`) })
    const entry = { step: i, scrollY: Math.round(y) }
    if (dumpAt.includes(i)) entry.transforms = await page.evaluate(dumpTransforms)
    log.desktop.push(entry)
    await page.mouse.wheel(0, 40)
    await page.waitForTimeout(380)
  }
  await ctx.close()
}

// ---------- MOBILE 375, 10 steps @ 40px ----------
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(7000)
  for (const t of ['Accept', 'Accept all', 'Agree', 'OK']) {
    const b = page.getByRole('button', { name: new RegExp(t, 'i') }).first()
    if (await b.count()) { await b.click().catch(() => {}); break }
  }
  await page.mouse.move(180, 400)
  for (let i = 0; i < 10; i++) {
    const y = await page.evaluate(() => window.scrollY || 0)
    await page.screenshot({ path: resolve(out, `alt-m-scroll-${String(i).padStart(3, '0')}.png`) })
    log.mobile.push({ step: i, scrollY: Math.round(y) })
    await page.mouse.wheel(0, 40)
    await page.waitForTimeout(380)
  }
  await ctx.close()
}

writeFileSync(resolve(out, 'alt-recon.json'), JSON.stringify(log, null, 2))
console.log('mechanism:', JSON.stringify(log.mechanism))
console.log('desktop scrollY sequence:', log.desktop.map((d) => d.scrollY).join(', '))
console.log('done — wrote alt-recon.json + alt-scroll-*.png')
await browser.close()
