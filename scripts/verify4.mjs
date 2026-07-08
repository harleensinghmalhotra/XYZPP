import { chromium } from 'playwright'
import sharp from 'sharp'
const b = await chromium.launch({ headless: true })
const c = await b.newContext({ viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 })
const p = await c.newPage()
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' }); await p.waitForTimeout(3500)
// seal rotation
const s0 = await p.evaluate(() => getComputedStyle(document.querySelector('#hero img[alt="Printing stories seal"]')).transform)
await p.waitForTimeout(2500)
const s2 = await p.evaluate(() => getComputedStyle(document.querySelector('#hero img[alt="Printing stories seal"]')).transform)
console.log('seal t0:', s0)
console.log('seal t2:', s2, s0 === s2 ? '(STATIC!)' : '(ROTATING ✓)')
// scroll to transition (book bottom + curve)
await p.mouse.move(960, 470)
let cur = 0; while (cur < 1560) { cur = Math.min(1560, cur + 80); await p.evaluate(d => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(50) } await p.waitForTimeout(650)
const books = await p.evaluate(() => [...document.querySelectorAll('img')].filter(im => /book_pages|book_cover|graph_book/.test(im.src)).map(im => ({ src: im.src.split('/').pop().slice(0, 14), sec: im.closest('section')?.id, op: getComputedStyle(im).opacity })))
console.log('book imgs @transition:', JSON.stringify(books))
await sharp(await p.screenshot()).resize(1200).toFile('recon/final-2/v4-transition.png')
// also a bit further to see the full curve + services
cur = 1560; while (cur < 1750) { cur = Math.min(1750, cur + 80); await p.evaluate(d => { window.__lenis ? window.__lenis.scrollTo(d, { immediate: true }) : window.scrollTo(0, d) }, cur); await p.waitForTimeout(50) } await p.waitForTimeout(650)
await sharp(await p.screenshot()).resize(1200).toFile('recon/final-2/v4-curve.png')
// rest for seal look
await p.evaluate(() => window.__lenis ? window.__lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0)); await p.waitForTimeout(800)
await sharp(await p.screenshot()).extract({ left: 0, top: 0, width: 1150, height: 900 }).resize(760).toFile('recon/final-2/v4-seal.png')
console.log('done')
await b.close()
