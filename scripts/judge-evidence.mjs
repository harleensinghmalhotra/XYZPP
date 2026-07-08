// Evidence collection for the award-judge pass: axe a11y violations,
// reduced-motion screenshots, and signature-moment state slices.
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'http://localhost:5173'
const out = resolve(root, 'shots')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()

// ---- 1. axe accessibility audit (desktop) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const crit = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  console.log('AXE violations total:', results.violations.length, '| critical/serious:', crit.length)
  for (const v of results.violations) {
    console.log(`  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} nodes)`)
  }
  await page.close()
}

// ---- 2. reduced-motion pass ----
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: resolve(out, 'reduced-hero.png') })
  await page.evaluate(() => document.querySelector('#path')?.scrollIntoView())
  await page.waitForTimeout(900)
  await page.screenshot({ path: resolve(out, 'reduced-path.png') })
  console.log('✓ reduced-motion screenshots')
  await page.close()
}

// ---- 3. signature moment states (book fan pill → spring) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('#scope').scrollIntoViewIfNeeded()
  await page.waitForTimeout(900)
  await page.locator('#scope').screenshot({ path: resolve(out, 'sig-before.png') })
  const pill = page.getByRole('button', { name: 'Educational', exact: true })
  await pill.click()
  await page.waitForTimeout(120)
  await page.locator('#scope').screenshot({ path: resolve(out, 'sig-mid.png') })
  await page.waitForTimeout(700)
  await page.locator('#scope').screenshot({ path: resolve(out, 'sig-settled.png') })
  console.log('✓ signature state slices (before/mid/settled)')
  await page.close()
}

await browser.close()
