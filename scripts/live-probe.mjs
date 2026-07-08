// LIVE RUNTIME PROBE — alternativinc.com hero, 1:1 clone recon.
// Recon only. Headed Chromium, 1536x743 @ DSF 1.25, real wheel events.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'recon/final-2/live')
mkdirSync(OUT, { recursive: true })

// Real Webflow class names (underscore form) confirmed from the scraped DOM.
const SEL = {
  scrollWrapper: '.hero-section-scroll-wrapper',
  hero: '.hero-section',
  navbar: '.navbar',
  brandImg: '.navbar_brand_img',
  navItem: '.navbar_menu_item',
  langWrap: '.navbar_language-wrapper',
  menuBtn: '.navbar_menu-btn',
  content: '.hero-section_content',
  titleWrap: '.hero-section_content_title-wrapper',
  line1: '.hero-section_content_title-line._1',
  line2: '.hero-section_content_title-line._2',
  printing: '.hero-section_content_title-line_txt.green',
  seal: '.hero-section_content_title-line_seal',
  stories: '.hero-section_content_title-line._2 .hero-section_content_title-line_txt',
  subcopy: '.hero-section_content_p',
  buttonBox: '.button-box',
  btnOutline: '.button.outline-white',
  btnLink: '.button-link.white',
  graphWrap: '.hero-section_graph-wrapper',
  bookOver: '.hero-section_graph_book.over',
  bookBase: '.hero-section_graph-wrapper .hero-section_graph_book:not(.over)',
  details: '.hero-section_graph-details',
  d1: '.hero-section_graph-details1',
  d2: '.hero-section_graph-details2',
  d3: '.hero-section_graph-details3',
  d4: '.hero-section_graph-details4',
  d5: '.hero-section_graph-details5',
  d6: '.hero-section_graph-details6',
  d7: '.hero-section_graph-details7',
  d8: '.hero-section_graph-details8',
  bgLeft: '.hero-section_bg-detail1',
  bgRight: '.hero-section_bg-detail2',
  scrollWrap2: '.hero-section_scroll-wrapper',
  scrollBase: '.hero-section_scroll-base',
  scrollDot: '.hero-section_scroll-dot',
  scrollTxt: '.hero-section_scroll-txt',
  services: '.services-section',
}

const PROPS = ['display','position','zIndex','opacity','transform','transformOrigin','filter','mixBlendMode','objectFit','objectPosition','overflow','pointerEvents','width','height','top','left','right','bottom','marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft','fontSize','lineHeight','letterSpacing','fontWeight','textTransform','color','backgroundColor','borderTopWidth','borderStyle','borderColor','borderTopLeftRadius']

const probeFull = ({ selectors, props }) =>
  Object.fromEntries(Object.entries(selectors).map(([name, sel]) => {
    const el = document.querySelector(sel)
    if (!el) return [name, null]
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const style = {}
    for (const p of props) style[p] = cs[p]
    const round = (n) => Math.round(n)
    return [name, {
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 40) || undefined,
      src: el.getAttribute ? (el.getAttribute('src') || undefined) : undefined,
      rect: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height), top: round(r.top), left: round(r.left), right: round(r.right), bottom: round(r.bottom) },
      style,
      parent: el.parentElement ? String(el.parentElement.className).slice(0, 50) : null,
    }]
  }))

// compact per-state row for the timeline
const probeCompact = (selectors) =>
  Object.fromEntries(Object.entries(selectors).map(([name, sel]) => {
    const el = document.querySelector(sel)
    if (!el) return [name, null]
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return [name, { op: +cs.opacity, tf: cs.transform === 'none' ? 'none' : cs.transform, top: Math.round(r.top), y: Math.round(r.y), h: Math.round(r.height) }]
  }))

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()

console.log('goto…')
try {
  await page.goto('https://www.alternativinc.com/', { waitUntil: 'load', timeout: 60000 })
} catch (e) { console.log('load timeout, continuing', e.message) }
try { await page.waitForLoadState('networkidle', { timeout: 20000 }) } catch {}
await page.waitForTimeout(4000) // Webflow IX2 + intro settle

// dismiss any cookie/consent if present (best effort)
for (const t of ['Accept', 'Accepter', 'J’accepte', 'OK', 'Got it']) {
  const b = page.getByRole('button', { name: t })
  if (await b.count().catch(() => 0)) { try { await b.first().click({ timeout: 800 }) } catch {} }
}
await page.waitForTimeout(500)

// ---- REST: full node map + computed dump + screenshot ----
const nodemap = await page.evaluate(probeFull, { selectors: SEL, props: PROPS })
writeFileSync(resolve(OUT, 'nodemap-rest.json'), JSON.stringify(nodemap, null, 2))
console.log('REST scrollY', await page.evaluate(() => window.scrollY))
await page.screenshot({ path: resolve(OUT, 'shot-00-rest.png') })

// book image src forensics (both graph_book imgs, in order)
const bookImgs = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.hero-section_graph-wrapper .hero-section_graph_book, .hero-section_graph_book')).map((el) => ({
    cls: el.className, src: el.currentSrc || el.src, z: getComputedStyle(el).zIndex, pos: getComputedStyle(el).position, op: getComputedStyle(el).opacity, mb: getComputedStyle(el).marginBottom,
  })))
writeFileSync(resolve(OUT, 'book-imgs.json'), JSON.stringify(bookImgs, null, 2))

// seal element type forensics
const sealInfo = await page.evaluate(() => {
  const el = document.querySelector('.hero-section_content_title-line_seal')
  if (!el) return null
  return { tag: el.tagName.toLowerCase(), src: el.getAttribute('src'), width: el.getAttribute('width'), cs: { transform: getComputedStyle(el).transform, position: getComputedStyle(el).position, margin: getComputedStyle(el).margin } }
})
writeFileSync(resolve(OUT, 'seal.json'), JSON.stringify(sealInfo, null, 2))

// ---- SWEEP with real wheel events ----
await page.mouse.move(768, 371)
const timeline = []
const totalTarget = await page.evaluate(() => document.documentElement.scrollHeight)
console.log('docHeight', totalTarget)

const STEP = 140
const MAX = 40
for (let i = 0; i <= MAX; i++) {
  if (i > 0) { await page.mouse.wheel(0, STEP); await page.waitForTimeout(220) }
  const row = await page.evaluate(probeCompact, SEL)
  const scrollY = await page.evaluate(() => window.scrollY)
  timeline.push({ i, scrollY, ...row })
  await page.screenshot({ path: resolve(OUT, `sweep-${String(i).padStart(2, '0')}-y${scrollY}.png`) })
  const svc = row.services
  const sy = row.stories, ov = row.bookOver, d1 = row.d1
  console.log(`i${i} y${scrollY} title.op=${sy ? sy.op : '-'} over.op=${ov ? ov.op : '-'} d1.op=${d1 ? d1.op : '-'} svcTop=${svc ? svc.top : '-'}`)
  // stop when services section has entered the viewport (landing done)
  if (svc && svc.top < 200) { console.log('services in view — stop'); break }
}
writeFileSync(resolve(OUT, 'timeline.json'), JSON.stringify(timeline, null, 2))
console.log('sweep rows', timeline.length)

await browser.close()
console.log('DONE')
