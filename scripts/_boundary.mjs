import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
const BASE = 'http://localhost:5215'
const OUT = process.env.OUT || 'shots/conveyor-exit/boundary'
mkdirSync(OUT, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await chromium.launch({ headless: false })
const page = await (await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })).newPage()
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await sleep(2200)
const projTop = await page.evaluate(() => document.querySelector('.proj').getBoundingClientRect().top + window.scrollY)
const vh = 743
// scroll so the boundary sweeps through the viewport
const offs = { 'a-before': -0.75, 'b-enter': -0.45, 'c-mid': -0.15, 'd-unpin': 0.02, 'e-past': 0.30 }
for (const [name, f] of Object.entries(offs)) {
  const y = projTop + f * vh
  await page.evaluate(y => window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y), y)
  await sleep(700)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}
// sample colors right above/below the boundary at the 'c-mid' position
await page.evaluate(y => window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y), projTop - 0.15 * vh)
await sleep(600)
const buf = await page.screenshot()
await b.close()
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
const W = info.width
// scan a vertical line at center x, find the biggest luminance jump (the seam)
const cx = Math.floor(W / 2)
let seamY = 0, maxJump = 0
for (let y = 100; y < info.height - 2; y++) {
  const i0 = (y * W + cx) * info.channels, i1 = ((y + 2) * W + cx) * info.channels
  const l0 = data[i0] + data[i0 + 1] + data[i0 + 2], l1 = data[i1] + data[i1 + 1] + data[i1 + 2]
  if (Math.abs(l1 - l0) > maxJump) { maxJump = Math.abs(l1 - l0); seamY = y }
}
const px = (y) => { const i = (y * W + cx) * info.channels; return `rgb(${data[i]},${data[i + 1]},${data[i + 2]})` }
console.log('projTop=', Math.round(projTop), 'seamY≈', seamY, 'jump=', maxJump)
console.log('above seam:', px(seamY - 6), ' below seam:', px(seamY + 6))
console.log('errors:', errs.length)
