import { chromium } from 'playwright'
import fs from 'node:fs'

// Screenshot the Hero → TrustStrips weld (the book landing on the strips) at a
// given build. Usage: node lane7c-weld.mjs <port> <label>
const PORT = process.argv[2] || '5200'
const LABEL = process.argv[3] || 'cur'
const OUT = 'shots/lane7c'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: false })

for (const [w, h] of [[1536, 743], [1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.addInitScript(() => { try { localStorage.setItem('qfp.lang', 'en'); localStorage.setItem('qfp.consent', 'accepted') } catch {} })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)

  // The book lands at the END of the hero pin. Scroll so the TrustStrips top
  // (navy curve → white → book → gold border → strips) sits framed with a little
  // hero navy still above it.
  await page.evaluate(() => {
    const trust = document.querySelector('#trust')
    window.scrollTo(0, trust.offsetTop - 170)
  })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/weld-${LABEL}-${w}x${h}.png` })
  await ctx.close()
}
await browser.close()
console.log(`weld shots written for ${LABEL}`)
