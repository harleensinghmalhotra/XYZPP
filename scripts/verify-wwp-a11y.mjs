// axe pass on the What We Print section + reduced-motion fallback screenshot.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'http://localhost:5175'
const out = resolve(root, 'shots')
const browser = await chromium.launch({ headless: false })

// ---- 1. axe (normal motion) ----
{
  const context = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  const res = await new AxeBuilder({ page }).include('#services').analyze()
  const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  console.log('axe violations on #services:', res.violations.length, '(serious/critical:', bad.length + ')')
  for (const v of res.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help} — ${v.nodes.length} node(s)`)
    console.log('     ', v.nodes[0]?.target?.join(' '))
  }
  await page.close()
}

// ---- 2. reduced motion: no pin, native horizontal scroll ----
{
  const context = await browser.newContext({
    viewport: { width: 1536, height: 743 },
    deviceScaleFactor: 1.25,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  const info = await page.evaluate(() => {
    const el = document.getElementById('services')
    el.scrollIntoView()
    const vp = el.querySelector('.wwp-viewport')
    return {
      sectionHeight: el.offsetHeight,
      pinned: getComputedStyle(el.querySelector('.wwp-sticky')).position,
      viewportOverflowX: getComputedStyle(vp).overflowX,
      trackScrollable: vp.scrollWidth > vp.clientWidth,
    }
  })
  console.log('reduced-motion state:', info)
  await page.evaluate(() => document.getElementById('services').scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(out, 'wwp-reduced.png') })
  // scroll the track natively to prove card 8 reachable
  await page.evaluate(() => {
    const vp = document.querySelector('#services .wwp-viewport')
    vp.scrollLeft = vp.scrollWidth
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, 'wwp-reduced-end.png') })
  await page.close()
}

await browser.close()
console.log('done')
