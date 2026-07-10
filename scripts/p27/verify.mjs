import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const OUT = 'shots/phase27'
mkdirSync(OUT, { recursive: true })
const VP = { width: 1536, height: 743 }
const b = await chromium.launch()

// ---- 1. HOVER STATES (force :hover on a gold pill + a card, per page) ----
const HOVER = [
  ['about', '/about', '[data-card="whatwedo"]', 'a[href="/contact"]'],
  ['edu', '/educational-books', '.edu-proc-card', '.edu-cta-pill'],
  ['pod', '/print-on-demand', '.pod-how-card', '.pod-request'],
  ['contact', '/contact', '.ctc-tile', '.ctc-submit'],
]
for (const [name, route, cardSel, pillSel] of HOVER) {
  const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  try {
    await p.goto('http://localhost:5173'+route, { waitUntil:'domcontentloaded', timeout:60000 })
    await p.waitForTimeout(1000)
    for (const [tag, sel] of [['card', cardSel], ['pill', pillSel]]) {
      try {
        const el = p.locator(sel).first()
        await el.scrollIntoViewIfNeeded({ timeout: 4000 })
        await el.hover({ timeout: 4000, force: true })
        await p.waitForTimeout(400)
        await el.screenshot({ path: `${OUT}/hover-${name}-${tag}.png` })
      } catch(e){ console.log(`  hover ${name}/${tag} skip: ${e.message.slice(0,45)}`) }
    }
  } catch(e){ console.log(`  ${name} hover-page fail: ${e.message.slice(0,45)}`) }
  await ctx.close()
}

// ---- 2. REDUCED MOTION (reveals must be resolved to full opacity instantly) ----
{
  const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: 1.25, reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto('http://localhost:5173/about', { waitUntil:'domcontentloaded', timeout:60000 })
  await p.waitForTimeout(1000)
  const hiddenReveals = await p.evaluate(() => {
    return [...document.querySelectorAll('[data-reveal],[data-textreveal]')]
      .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.99).length
  })
  await p.screenshot({ path: `${OUT}/reduced-about-top.png` })
  console.log(`REDUCED-MOTION /about: elements still <1 opacity = ${hiddenReveals} (want 0)`)
  await ctx.close()
}

// ---- 3. KEYBOARD FOCUS (tab to first nav link, capture gold ring) ----
{
  const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: 1.25 })
  const p = await ctx.newPage()
  await p.goto('http://localhost:5173/about', { waitUntil:'domcontentloaded', timeout:60000 })
  await p.waitForTimeout(900)
  for (let i=0;i<3;i++){ await p.keyboard.press('Tab'); await p.waitForTimeout(120) }
  const focused = await p.evaluate(() => {
    const el = document.activeElement
    const cs = el ? getComputedStyle(el) : null
    return { tag: el?.tagName, text: el?.textContent?.slice(0,20), outline: cs?.outlineColor, width: cs?.outlineWidth }
  })
  await p.screenshot({ path: `${OUT}/focus-about.png` })
  console.log(`FOCUS /about active=${focused.tag}"${focused.text}" outline=${focused.outline} ${focused.width}`)
  await ctx.close()
}
await b.close()
console.log('verify done')
