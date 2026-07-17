import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const PORT = process.argv[2] || '5184'
const browser = await chromium.launch()

console.log('Verifying Global Markets page...\n')

const languages = ['en', 'fr', 'es']
const screenshotDir = 'shots/globalmarkets'

for (const lng of languages) {
  const ctx = await browser.newContext({
    viewport: { width: 1536, height: 743 },
    deviceScaleFactor: 1.25,
  })
  const page = await ctx.newPage()

  await page.addInitScript((lang) => {
    try { localStorage.setItem('qfp.lang', lang) } catch {}
  }, lng)

  await page.goto(`http://localhost:${PORT}/global-markets`, { waitUntil: 'networkidle', timeout: 60000 })

  const html = await page.content()
  const currentUrl = page.url()

  const checks = [
    { pattern: /Printed in India|Imprimé en Inde|Impreso en India/i, name: 'Main title' },
    { pattern: /Read by the World|Lu dans le monde|Leído en todo el mundo/i, name: 'Subtitle' },
    { pattern: /Navi Mumbai|15 minutes|JNPT/i, name: 'Location info' },
    { pattern: /25\+|25 \+/i, name: '25+ countries' },
    { pattern: /Africa|Afrique|África/i, name: 'Africa region' },
    { pattern: /India.*UAE.*Asia|Inde.*Émirats|India.*Emiratos/i, name: 'Asia region' },
    { pattern: /North America.*UK.*Europe|Amérique du Nord.*Royaume-Uni|América del Norte.*Reino Unido/i, name: 'NAUKE region' },
    { pattern: /20 printing towers|20.*presses|20 torres/i, name: '20 printing towers' },
    { pattern: /5 sheet fed|5.*presses|5 prensas/i, name: '5 sheet fed presses' },
    { pattern: /17 folders|17.*plieuses|17 plegadoras/i, name: '17 folders' },
    { pattern: /6 automatic thread|6.*couture|6.*cosido/i, name: '6 sewing machines' },
    { pattern: /FSC Chain of Custody|ISO 9001|Sedex/i, name: 'Certifications' },
    { pattern: /<main/i, name: 'Main landmark' },
    { pattern: /h1/i, name: 'H1 heading' },
  ]

  console.log(`${lng.toUpperCase()} locale:`)
  let passed = 0
  checks.forEach(check => {
    const found = check.pattern.test(html)
    const status = found ? '✓' : '✗'
    console.log(`  ${status} ${check.name}`)
    if (found) passed++
  })
  console.log(`  Result: ${passed}/${checks.length} checks passed`)
  console.log(`  URL: ${currentUrl}`)

  // Check for main a11y landmarks
  const a11yChecks = [
    { sel: 'main', name: 'Main landmark' },
    { sel: 'nav', name: 'Navigation' },
    { sel: 'h1', name: 'H1 element' },
    { sel: '[role="banner"]', name: 'Banner role' },
  ]

  console.log(`  Accessibility landmarks:`)
  for (const check of a11yChecks) {
    const found = await page.locator(check.sel).count()
    console.log(`    ${found > 0 ? '✓' : '✗'} ${check.name}`)
  }

  // Take screenshot
  const shotName = `${screenshotDir}/globalmarkets-${lng}.png`
  await page.screenshot({ path: shotName, fullPage: false })
  console.log(`  ✓ Screenshot: ${shotName}\n`)

  await ctx.close()
}

await browser.close()
console.log('✓ Verification complete')
