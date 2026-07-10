import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots')
const b = await chromium.launch({ headless: false })
const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(1200)

// mount order (DOM order of sections)
const order = await p.evaluate(() => [...document.querySelectorAll('main > section')].map(s => s.id || s.className.split(' ')[0]))
console.log('SECTION ORDER:', order.join(' → '))

const geo = await p.evaluate(() => {
  const pr = document.getElementById('promise'), sv = document.getElementById('services')
  return { promiseTop: pr.getBoundingClientRect().top + scrollY, servicesTop: sv.getBoundingClientRect().top + scrollY, servicesH: sv.offsetHeight, innerH: innerHeight }
})
const to = y => p.evaluate(yy => window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : scrollTo(0, yy), y)

// eyebrow closeup (fully revealed → scroll promise into view)
await to(Math.round(geo.promiseTop)); await p.waitForTimeout(900)
const eb = p.locator('#promise .promise-eyebrow')
await eb.screenshot({ path: resolve(out, 'promise-eyebrow.png') })
console.log('✓ promise-eyebrow.png  text:', JSON.stringify(await eb.textContent()))
const hasAfter = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('#promise .promise-eyebrow'), '::after'); return s.content !== 'none' && s.content !== '' && s.width !== '0px' && s.width !== 'auto' })
console.log('  eyebrow ::after renders a line?', hasAfter)

// junction: WhatWePrint release → Promise entering (promise top ~62% vp)
await to(Math.round(geo.promiseTop - 0.62 * geo.innerH)); await p.waitForTimeout(900)
await p.screenshot({ path: resolve(out, 'wwp-to-promise.png') })
console.log('✓ wwp-to-promise.png')
await b.close()
