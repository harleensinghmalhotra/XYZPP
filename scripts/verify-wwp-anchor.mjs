import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'C:/Users/Harleen/AppData/Local/Temp/claude/d--WEBSITES-Website-University/82f8417a-f3a7-4c7e-9124-12c64d24d14c/scratchpad'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5200'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } })

async function dismissCookies(page) {
  for (const label of ['Accept all', 'Reject all']) {
    const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
    if (await b.count()) { await b.first().click().catch(() => {}); break }
  }
}

// Measure where the heading / section / prior section land relative to the nav.
async function probe(page) {
  return page.evaluate(() => {
    const header = document.querySelector('header[role="banner"]')
    const navH = header ? Math.round(header.getBoundingClientRect().height) : 86
    const section = document.getElementById('what-we-print')
    const title = [...document.querySelectorAll('.wwp-title')].find(Boolean)
    const eyebrow = [...document.querySelectorAll('.wwp-eyebrow')].find(Boolean)
    const firstCard = document.querySelector('.wwp-card')
    const s = section?.getBoundingClientRect()
    const ti = title?.getBoundingClientRect()
    const ey = eyebrow?.getBoundingClientRect()
    const vh = window.innerHeight
    return {
      navH,
      hash: location.hash,
      sectionTop: s ? Math.round(s.top) : null,
      eyebrowTop: ey ? Math.round(ey.top) : null,
      titleTop: ti ? Math.round(ti.top) : null,
      titleBottom: ti ? Math.round(ti.bottom) : null,
      titleText: title?.textContent?.trim(),
      // heading fully visible below the nav, above the fold
      headingBelowNav: ey ? ey.top >= navH - 1 : false,
      headingFullyVisible: ti ? (ti.top >= navH - 1 && ti.bottom <= vh) : false,
      // nothing of the PREVIOUS section should show above the WWP section top
      priorSectionHidden: s ? s.top <= navH + 2 : false,
      cardsInView: firstCard ? firstCard.getBoundingClientRect().top < vh : false,
    }
  })
}

// Which card is centered in the horizontal row (by id)?
async function centeredCard(page) {
  return page.evaluate(() => {
    const vp = document.querySelector('.wwp-viewport')
    if (!vp) return null
    const vpMidX = vp.getBoundingClientRect().left + vp.clientWidth / 2
    let best = null, bestD = Infinity
    for (const c of vp.querySelectorAll('.wwp-card')) {
      const r = c.getBoundingClientRect()
      const d = Math.abs((r.left + r.width / 2) - vpMidX)
      if (d < bestD) { bestD = d; best = c.id }
    }
    return { centered: best, dist: Math.round(bestD) }
  })
}

async function run(name, fromUrl, action) {
  const page = await ctx.newPage()
  await page.goto(fromUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await dismissCookies(page)
  await page.waitForTimeout(300)
  await action(page)
  await page.waitForTimeout(2600) // let scroll + settle-recheck finish
  const p = await probe(page)
  const c = await centeredCard(page)
  await page.screenshot({ path: `${OUT}/wwp-${name}.png` })
  console.log(`\n[${name}] from ${fromUrl}`)
  console.log('  probe:', JSON.stringify(p))
  console.log('  centered:', JSON.stringify(c))
  const pass =
    p.titleText?.includes('Formats') &&
    p.headingFullyVisible &&
    p.headingBelowNav &&
    p.priorSectionHidden &&
    p.cardsInView
  console.log('  RESULT:', pass ? 'PASS ✅' : 'FAIL ❌')
  await page.close()
  return { p, c }
}

// 1) Label click from /about (cross-route)
await run('about-label', `${BASE}/about`, async (page) => {
  await page.getByRole('button', { name: /^what we print$/i }).first().click()
})

// 2) Dropdown "Educational Book Printing" from /about → #wwp-educational
await run('about-educational', `${BASE}/about`, async (page) => {
  await page.getByRole('button', { name: /^what we print$/i }).first().hover()
  await page.waitForTimeout(250)
  await page.getByRole('menuitem', { name: /^Educational Book Printing$/i }).click()
})

// 3) Dropdown "Trade Books" from /about → #wwp-coffee
await run('about-trade', `${BASE}/about`, async (page) => {
  await page.getByRole('button', { name: /^what we print$/i }).first().hover()
  await page.waitForTimeout(250)
  await page.getByRole('menuitem', { name: /^Trade Books$/i }).click()
})

// 4) Same-page from homepage footer scroll position
await run('home-from-footer', `${BASE}/`, async (page) => {
  // scroll to the very bottom (footer) first
  await page.evaluate(() => (window.__lenis
    ? window.__lenis.scrollTo(document.body.scrollHeight, { immediate: true })
    : window.scrollTo(0, document.body.scrollHeight)))
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: /^what we print$/i }).first().click()
})

await browser.close()
console.log('\ndone')
