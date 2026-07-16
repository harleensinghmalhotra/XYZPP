// Hero composed-art swap — verification harness (built output @ :4319).
// Shots hero + junction at 3 viewports, tests both CTAs, runs axe, logs console.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'hero-swap')
mkdirSync(out, { recursive: true })
const URL = process.env.HERO_URL || 'http://127.0.0.1:4319'

const VIEWS = [
  { name: '1536x743@1.25', width: 1536, height: 743, dpr: 1.25 },
  { name: '1280x720', width: 1280, height: 720, dpr: 1 },
  { name: '1920x1080', width: 1920, height: 1080, dpr: 1 },
]

const browser = await chromium.launch({ headless: true })

async function settle(page) {
  await page.waitForTimeout(1200)
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* noop */ }
  await page.waitForTimeout(300)
}
async function scrollTo(page, y) {
  await page.evaluate((yy) => { if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true }); else window.scrollTo(0, yy) }, y)
}

for (const v of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await scrollTo(page, 0)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(out, `hero-${v.name}.png`) })

  // Junction: scroll so hero bottom / TrustStrips seam is centered in view.
  const heroBottom = await page.evaluate(() => { const h = document.querySelector('#hero'); return h.offsetTop + h.offsetHeight })
  await scrollTo(page, Math.max(0, heroBottom - v.height * 0.62))
  await page.waitForTimeout(600)
  await page.screenshot({ path: resolve(out, `junction-${v.name}.png`) })

  console.log(`OK ${v.name} shots  | console errors: ${errors.length}`)
  if (errors.length) console.log('   ', errors.slice(0, 6).join('\n    '))
  await ctx.close()
}

// CTA scroll tests + axe on canonical viewport.
{
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)

  for (const [sel, target] of [['a[href="#services"]', 'services'], ['a[href="#reach"]', 'reach']]) {
    await scrollTo(page, 0)
    await page.waitForTimeout(300)
    await page.click(sel)
    await page.waitForTimeout(1200)
    const info = await page.evaluate((id) => {
      const el = document.getElementById(id)
      if (!el) return { found: false }
      const r = el.getBoundingClientRect()
      return { found: true, top: Math.round(r.top), inView: r.top < window.innerHeight && r.bottom > 0 }
    }, target)
    console.log(`CTA ${sel} -> #${target}:`, JSON.stringify(info))
  }

  const results = await new AxeBuilder({ page }).include('#main').analyze()
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
  await writeFile(resolve(out, 'axe.json'), JSON.stringify({
    total: results.violations.length,
    serious: serious.length,
    violations: results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
  }, null, 2))
  console.log(`OK axe: ${results.violations.length} violations (${serious.length} serious/critical)`)
  for (const v of results.violations) console.log(`   [${v.impact}] ${v.id} x${v.nodes.length} — ${v.help}`)
  await ctx.close()
}

await browser.close()
console.log('\nArtefacts ->', out)
