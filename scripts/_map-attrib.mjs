// MAP ATTRIBUTION — WHISPER MODE verification. Headed Playwright @ 1536×743 DPR 1.25.
// Proves the OSM/OpenMapTiles credit is legally present but visually quiet:
//   corner-<lng>.png        — bottom-right corner close-up (attribution in context)
//   legibility-<lng>.png    — the credit cropped + zoomed 4× (direct-look readability)
//   report.json             — 11px assert, links+hrefs intact, color, console errors
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'map-attribution')
mkdirSync(out, { recursive: true })
const URL = process.env.MAP_URL || 'http://localhost:5173'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

const browser = await chromium.launch({ headless: false })
const report = {}

async function run(lng) {
  const errors = []
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR })
  await ctx.addInitScript((l) => localStorage.setItem('qfp.lang', l), lng)
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(URL, { waitUntil: 'networkidle' })
  // Scroll the reach section into view to boot the map, then let it fly + land.
  await page.locator('#reach').scrollIntoViewIfNeeded()
  await page.waitForSelector('.qfp-globe .maplibregl-ctrl-attrib', { timeout: 20000 })
  // Wait until the credit actually has its text (style attribution resolved).
  await page.waitForFunction(() => {
    const el = document.querySelector('.qfp-globe .maplibregl-ctrl-attrib-inner')
    return el && /OpenStreetMap/i.test(el.textContent)
  }, { timeout: 20000 })
  await page.waitForTimeout(9000) // let the flyTo choreography settle to landed

  const attrib = page.locator('.qfp-globe .maplibregl-ctrl-attrib')
  const box = await attrib.boundingBox()

  // Computed style + link integrity, read from the live DOM.
  const facts = await page.evaluate(() => {
    const wrap = document.querySelector('.qfp-globe .maplibregl-ctrl-attrib')
    const cs = getComputedStyle(wrap)
    const links = [...wrap.querySelectorAll('a')].map((a) => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href'),
      decoration: getComputedStyle(a).textDecorationLine,
    }))
    return {
      text: wrap.textContent.trim(),
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      color: cs.color,
      background: cs.backgroundColor,
      border: cs.borderTopWidth,
      boxShadow: cs.boxShadow,
      whiteSpace: getComputedStyle(wrap.querySelector('.maplibregl-ctrl-attrib-inner') || wrap).whiteSpace,
      links,
    }
  })

  // Corner close-up: bottom-right ~460×120 region containing the credit.
  const cornerW = 480, cornerH = 130
  await page.screenshot({
    path: resolve(out, `corner-${lng}.png`),
    clip: { x: VP.width - cornerW, y: VP.height - cornerH, width: cornerW, height: cornerH },
  })

  // Direct-look legibility: crop just the attribution box and upscale 4×.
  if (box) {
    const raw = await page.screenshot({
      clip: {
        x: Math.max(0, box.x - 4), y: Math.max(0, box.y - 4),
        width: box.width + 8, height: box.height + 8,
      },
    })
    await sharp(raw).resize({ width: Math.round((box.width + 8) * 4), kernel: 'nearest' })
      .png().toFile(resolve(out, `legibility-${lng}.png`))
  }

  // Asserts
  const hrefFor = (re) => facts.links.find((l) => re.test(l.href || ''))?.href
  report[lng] = {
    ...facts,
    box,
    errors,
    asserts: {
      fontSize11px: facts.fontSize === '11px',
      dmMono: /dm mono/i.test(facts.fontFamily),
      transparentGround: /rgba\(0, 0, 0, 0\)|transparent/.test(facts.background),
      noBorder: facts.border === '0px',
      noShadow: facts.boxShadow === 'none',
      singleLine: facts.whiteSpace === 'nowrap',
      hasOsmLink: !!hrefFor(/openstreetmap\.org/i),
      hasLinks: facts.links.length > 0,
      linksHaveHref: facts.links.every((l) => l.href && l.href.length > 0),
      hoverOnlyUnderline: facts.links.every((l) => l.decoration === 'none'),
      zeroConsoleErrors: errors.length === 0,
    },
  }
  await ctx.close()
}

await run('en')
await run('fr')
await browser.close()
await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2))

// Console summary
for (const lng of ['en', 'fr']) {
  const r = report[lng]
  console.log(`\n── ${lng.toUpperCase()} ──`)
  console.log('  text     :', JSON.stringify(r.text))
  console.log('  fontSize :', r.fontSize, ' family:', r.fontFamily)
  console.log('  color    :', r.color, ' bg:', r.background, ' border:', r.border, ' shadow:', r.boxShadow)
  console.log('  links    :', r.links.map((l) => `${l.text}→${l.href}`).join('  |  '))
  console.log('  asserts  :', JSON.stringify(r.asserts))
  console.log('  errors   :', r.errors.length)
}
console.log('\nartifacts → shots/map-attribution/')
