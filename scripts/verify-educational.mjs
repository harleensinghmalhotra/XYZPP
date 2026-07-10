// VERIFY /educational-books — headed 1536×743 DPR 1.25.
// Full-scroll band shots + reduced-motion run + axe + console-error capture.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'shots', 'page-educational')
mkdirSync(outDir, { recursive: true })

const URL = process.argv[2] || 'http://localhost:5174/educational-books'
const W = 1536, H = 743
const browser = await chromium.launch({ headless: false })

async function run(label, reduced) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1.25,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)

  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  const step = Math.round(H * 0.85)
  let i = 0
  for (let y = 0; y <= maxY; y += step) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y)
    await page.waitForTimeout(700)
    await page.screenshot({ path: resolve(outDir, `${label}-${String(i).padStart(2, '0')}.png`) })
    i++
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(500)

  // 60fps scrub audit — drive a slow scroll through the book pin (top→150vh)
  // and record rAF frame deltas; report worst frame + % over 16.7ms.
  if (!reduced) {
    const fps = await page.evaluate(async () => {
      const book = document.querySelector('.edu-book')
      const start = book.offsetTop
      const end = start + book.offsetHeight - window.innerHeight
      const frames = []
      let last = performance.now()
      const N = 90
      for (let i = 0; i <= N; i++) {
        window.scrollTo({ top: start + ((end - start) * i) / N, behavior: 'instant' })
        await new Promise((r) => requestAnimationFrame(() => {
          const now = performance.now(); frames.push(now - last); last = now; r()
        }))
      }
      const body = frames.slice(3) // drop warmup
      const worst = Math.max(...body).toFixed(1)
      const over = ((body.filter((d) => d > 18).length / body.length) * 100).toFixed(0)
      const avg = (body.reduce((a, b) => a + b, 0) / body.length).toFixed(1)
      return { avg, worst, overPct: over }
    })
    console.log(`\n===== ${label} book-scrub fps =====`)
    console.log(`avg frame ${fps.avg}ms · worst ${fps.worst}ms · frames >18ms: ${fps.overPct}%`)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(400)
  }

  let axeSummary = 'skipped'
  if (!reduced) {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    axeSummary = results.violations.map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) — ${v.help}`)
    writeFileSync(resolve(outDir, 'axe.json'), JSON.stringify(results.violations, null, 2))
  }
  console.log(`\n===== ${label} =====`)
  console.log('console errors:', errors.length ? errors : 'none')
  console.log('axe violations:', axeSummary)
  await ctx.close()
}

await run('motion', false)
await run('reduced', true)
await browser.close()
