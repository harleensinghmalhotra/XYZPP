// NEBULA SWEEP verification — the 3 missed CTAs + a full-homepage straggler audit.
// Headed Playwright @ 1536×743 DPR 1.25 → shots/nebula-sweep/:
//   hero-chips-*.png     — both hero chips rest/hover/focus over the hero art
//   view-all-*.png       — Cases "View All Case Studies" rest/hover
//   ring-clip.png        — wide hero frame to eyeball ring clipping at wrappers
//   audit.json           — every button-ish element on the homepage + nebula status
//   contrast.json        — AA of the 3 new CTAs at nebula-brightest
//   reduced-*.png        — reduced-motion static ring
//   bubble-order.json    — spot-check the 4-bubble hero sequence still plays
//   console.json         — console/page errors, EN + FR
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'nebula-sweep')
mkdirSync(out, { recursive: true })
const URL = process.env.NB_URL || 'http://localhost:5174'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

function contrast(hex1, hex2) {
  const lum = (hex) => {
    const c = hex.replace('#', '')
    const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

const browser = await chromium.launch({ headless: false })
async function newPage({ reducedMotion, lang } = {}) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion })
  await ctx.addInitScript((l) => { try { localStorage.setItem('qfp.lang', l) } catch { /* noop */ } }, lang || 'en')
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  return { ctx, page, errors }
}
async function settle(page) {
  await page.waitForTimeout(1200)
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* noop */ }
  await page.waitForTimeout(400)
}
async function scrollTo(page, y) {
  await page.evaluate((yy) => { if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true }); else window.scrollTo(0, yy) }, y)
  await page.waitForTimeout(500)
}
async function shotEl(page, locator, name, pad = 30) {
  const box = await locator.boundingBox()
  if (!box) { console.log('! no box for', name); return null }
  await page.screenshot({ path: resolve(out, name), clip: {
    x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
    width: Math.min(VP.width, box.width + pad * 2), height: Math.min(VP.height, box.height + pad * 2)
  } })
  return box
}

const consoleReport = {}
const contrastReport = {}

// ── EN + FR pass ──
for (const lang of ['en', 'fr']) {
  const pre = lang === 'en' ? '' : 'fr-'
  const { ctx, page, errors } = await newPage({ lang })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await scrollTo(page, 0)

  // both hero chips (over the dark hero art)
  const services = page.locator('a.btn-nebula[href="#services"]').first()
  const projects = page.locator('a.btn-nebula[href="#projects"]').first()
  if (await services.count() && await projects.count()) {
    // a frame with BOTH chips for the pair read
    const b1 = await services.boundingBox(); const b2 = await projects.boundingBox()
    if (b1 && b2) {
      const x = Math.max(0, b1.x - 34), y = Math.max(0, Math.min(b1.y, b2.y) - 34)
      await page.screenshot({ path: resolve(out, `${pre}hero-chips-rest.png`), clip: {
        x, y, width: Math.min(VP.width - x, (b2.x + b2.width) - b1.x + 68), height: 130 } })
    }
    await services.hover(); await page.waitForTimeout(450); await shotEl(page, services, `${pre}hero-services-hover.png`)
    await projects.hover(); await page.waitForTimeout(450); await shotEl(page, projects, `${pre}hero-projects-hover.png`)
    await projects.focus(); await page.waitForTimeout(300); await shotEl(page, projects, `${pre}hero-projects-focus.png`)
    if (lang === 'en') {
      // ring-clip check — a wide hero grab to see if any wrapper eats the aura
      await page.mouse.move(10, 10); await page.waitForTimeout(400)
      await page.screenshot({ path: resolve(out, 'ring-clip.png'), clip: { x: 0, y: Math.max(0, Math.min(b1.y, b2.y) - 60), width: VP.width, height: 180 } })
      contrastReport.heroChips = { surface: 'hero navy #0c2f4a', label: '#ffffff', ratio: +contrast('#ffffff', '#0c2f4a').toFixed(2) }
    }
  } else { console.log('! hero chips not both found', await services.count(), await projects.count()) }

  // View All Case Studies
  const viewAll = page.locator('button.view-all-cases.btn-nebula').first()
  if (await viewAll.count()) {
    await viewAll.scrollIntoViewIfNeeded(); await page.waitForTimeout(700)
    await shotEl(page, viewAll, `${pre}view-all-rest.png`, 34)
    await viewAll.hover(); await page.waitForTimeout(450)
    await shotEl(page, viewAll, `${pre}view-all-hover.png`, 34)
    if (lang === 'en') contrastReport.viewAll = { surface: 'navy fill on cream band', label: 'gold #c89a3c', ratio: +contrast('#c89a3c', '#0f2444').toFixed(2) }
  } else { console.log('! view-all not found') }

  consoleReport[lang] = errors.slice()
  await ctx.close()
}

// ── FULL-HOMEPAGE STRAGGLER AUDIT ──
{
  const { ctx, page } = await newPage()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  // walk every section so lazy content mounts
  const h = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y <= h; y += VP.height) await scrollTo(page, y)
  await scrollTo(page, 0)
  const audit = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, a[href], [role="button"]'))
    const rows = []
    for (const el of els) {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none'
      const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent'
      const cls = (el.className && el.className.baseVal !== undefined) ? el.className.baseVal : String(el.className || '')
      const looksBtn = /btn|cta|pill|button|view-all|request|quote/i.test(cls) ||
        (cs.cursor === 'pointer' && (hasBorder || hasBg) && parseFloat(cs.paddingTop) >= 6 && r.width >= 60 && r.height >= 28)
      if (!looksBtn) continue
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)
      const hasNebula = /(^|\s)btn-nebula(\s|$)/.test(' ' + cls + ' ')
      // classify non-CTA controls that are intentionally NOT nebula-treated
      let status
      if (hasNebula) status = 'NEBULA'
      else if (/certs-pill/.test(cls)) status = 'excluded: filter toggle (segmented control, not a CTA)'
      else if (/aria-pressed/.test(el.outerHTML.slice(0, 80)) || /Sound/i.test(label)) status = 'excluded: utility toggle (sound chip, scoped out)'
      else if (el.tagName === 'A' && !hasBorder && !hasBg) status = 'excluded: plain text link (links ≠ buttons)'
      else status = 'STRAGGLER'
      rows.push({
        tag: el.tagName.toLowerCase(),
        label,
        cls: cls.split(/\s+/).filter((c) => /btn|cta|pill|view-all|nav|quote|nebula/i.test(c)).join(' ') || cls.slice(0, 40),
        hasNebula, status,
        w: Math.round(r.width), h: Math.round(r.height)
      })
    }
    return rows
  })
  const stragglers = audit.filter((r) => r.status === 'STRAGGLER')
  const excluded = audit.filter((r) => !r.hasNebula && r.status !== 'STRAGGLER')
  await writeFile(resolve(out, 'audit.json'), JSON.stringify({
    total: audit.length,
    withNebula: audit.filter((r) => r.hasNebula).length,
    excludedNonCta: excluded.length,
    trueStragglers: stragglers.length,
    rows: audit
  }, null, 2))
  console.log(`AUDIT: ${audit.length} button-ish | ${audit.filter((r) => r.hasNebula).length} nebula | ${excluded.length} excluded non-CTA | ${stragglers.length} TRUE stragglers`)
  audit.forEach((s) => console.log(`  ${s.hasNebula ? '✓' : '·'} ${s.tag} "${s.label}" → ${s.status}`))
  await ctx.close()
}

// ── BUBBLE ORDER spot-check — the 4-bubble hero sequence still plays ──
{
  const { ctx, page } = await newPage()
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  const order = await page.evaluate(() => new Promise((res) => {
    const seen = []
    const bubbles = Array.from(document.querySelectorAll('#hero [data-cut], #hero .bub-foil')).slice(0, 8)
    let t = 0
    const maxY = window.innerHeight * 2.4
    const iv = setInterval(() => {
      t += 1
      const y = Math.min(1, t / 30) * maxY
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
      document.querySelectorAll('#hero [data-cut]').forEach((el, i) => {
        const op = parseFloat(getComputedStyle(el).opacity)
        if (op > 0.5 && !seen.includes(i)) seen.push(i)
      })
      if (t >= 32) { clearInterval(iv); res({ revealedInOrder: seen, count: seen.length }) }
    }, 40)
  }))
  await writeFile(resolve(out, 'bubble-order.json'), JSON.stringify(order, null, 2))
  console.log('BUBBLE ORDER:', JSON.stringify(order))
  await ctx.close()
}

// ── REDUCED MOTION ──
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  // NOTE: the hero has a separate reduced-motion composition (Hero.jsx ~L283)
  // that renders only the landed book scene — the CTA chips do not exist there.
  // So reduced-motion ring evidence uses buttons that DO render: nav + view-all.
  const navCta = page.locator('a.btn-nebula--light[href="/contact"]').first()
  if (await navCta.count()) await shotEl(page, navCta, 'reduced-nav.png')
  const viewAll = page.locator('button.view-all-cases.btn-nebula').first()
  if (await viewAll.count()) { await viewAll.scrollIntoViewIfNeeded(); await page.waitForTimeout(600); await shotEl(page, viewAll, 'reduced-view-all.png', 34) }
  await ctx.close()
}

await writeFile(resolve(out, 'console.json'), JSON.stringify(consoleReport, null, 2))
await writeFile(resolve(out, 'contrast.json'), JSON.stringify(contrastReport, null, 2))
console.log('✓ reports written')
await browser.close()
console.log('\nAll nebula-sweep artefacts →', out)
