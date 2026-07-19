import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:5174'
const OUT = './screenshots'
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

async function shot(page, name, clipToSection = true) {
  if (clipToSection) {
    const box = await page.locator('.mvv').boundingBox()
    if (box) {
      // scroll the section fully into the frame, then screenshot the viewport
      await page.evaluate((top) => window.scrollTo(0, top), Math.max(0, box.y - (743 - box.height) / 2))
      await page.waitForTimeout(700)
    }
  }
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`  📸 ${name}.png`)
}

async function probe(page) {
  return page.evaluate(() => {
    const sec = document.querySelector('.mvv')
    const cols = [...document.querySelectorAll('.mvv-col')]
    const r = sec.getBoundingClientRect()
    return {
      sectionH: Math.round(r.height),
      vh: window.innerHeight,
      cols: cols.length,
      labels: cols.map((c) => c.querySelector('.mvv-label')?.textContent),
      indices: cols.map((c) => c.querySelector('.mvv-index')?.textContent),
      ghosts: cols.map((c) => c.querySelector('.mvv-ghost')?.textContent),
      hairlines: cols.filter((c) => getComputedStyle(c, '::before').content !== 'none').length,
      textOverflow: cols.map((c) => {
        const b = c.querySelector('.mvv-col-body')
        return b ? Math.round(b.scrollHeight) : 0
      }),
    }
  })
}

async function run() {
  const browser = await chromium.launch()

  // ── 1536×743 DESKTOP, EN ────────────────────────────────────────────────
  let ctx = await browser.newContext({ viewport: { width: 1536, height: 743 } })
  let page = await ctx.newPage()
  await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const en = await probe(page)
  console.log('\n── DESKTOP 1536×743 (EN) ──')
  console.log(en)
  console.log(`  section ${en.sectionH}px vs vh ${en.vh}px  → ${en.sectionH <= en.vh ? '✓ fits one screen' : '✗ EXCEEDS viewport'}`)
  await shot(page, 'mvv-desktop-en')
  // hover column 2 to verify rule extend + ghost warm
  await page.locator('.mvv-col').nth(1).hover()
  await page.waitForTimeout(500)
  await shot(page, 'mvv-desktop-hover', false)
  await ctx.close()

  // ── 1536×743, FR (longer copy) — switch via header toggle ───────────────
  ctx = await browser.newContext({ viewport: { width: 1536, height: 743 } })
  page = await ctx.newPage()
  await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'FR' }).click().catch(async () => {
    await page.click('text=FR')
  })
  await page.waitForTimeout(1400)
  const fr = await probe(page)
  console.log('\n── DESKTOP 1536×743 (FR) ──')
  console.log(fr)
  console.log(`  section ${fr.sectionH}px vs vh ${fr.vh}px  → ${fr.sectionH <= fr.vh ? '✓ fits' : '⚠ grows past viewport in FR (allowed, reported)'}`)
  await shot(page, 'mvv-desktop-fr')
  await ctx.close()

  // ── 375 MOBILE ──────────────────────────────────────────────────────────
  ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
  page = await ctx.newPage()
  await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const m = await probe(page)
  console.log('\n── MOBILE 375 ──')
  console.log(m)
  const box = await page.locator('.mvv').boundingBox()
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, box.y - 40))
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/mvv-mobile.png`, fullPage: false })
  console.log('  📸 mvv-mobile.png')
  await ctx.close()

  // ── REDUCED MOTION ──────────────────────────────────────────────────────
  ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, reducedMotion: 'reduce' })
  page = await ctx.newPage()
  await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const rm = await page.evaluate(() => {
    const b = document.querySelector('.mvv-col-body')
    return { opacity: getComputedStyle(b).opacity, transform: getComputedStyle(b).transform }
  })
  console.log('\n── REDUCED MOTION ──')
  console.log(`  col-body opacity ${rm.opacity} (expect 1), transform ${rm.transform}`)
  await shot(page, 'mvv-reduced')
  await ctx.close()

  await browser.close()
  console.log('\n✅ done')
}
run().catch((e) => { console.error(e); process.exit(1) })
