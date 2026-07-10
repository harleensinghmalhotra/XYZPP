/* POD configurator redesign — verification harness.
   Headed Playwright at 1536×743 AND 1280×720, English + French.
   Proves: zero chip/card overflow (Harry's headline bug), circled-number badges
   gone, every step keyboard-navigable, summary live-updates.
   Screens → shots/pod-redesign/.  Run:  node scripts/pod-redesign.mjs           */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots', 'pod-redesign')
mkdirSync(out, { recursive: true })

const VIEWPORTS = [
  { w: 1536, h: 743, tag: '1536' },
  { w: 1280, h: 720, tag: '1280' },
]
const LANGS = ['en', 'fr']
const STEPS = ['format', 'size', 'paper', 'binding', 'finish', 'quantity']
const CIRCLED = /[①-⑳]/ // ①..⑳ — the banned badges

const browser = await chromium.launch({ headless: false })
let failures = 0
const note = (ok, msg) => { if (!ok) failures++; console.log(`   ${ok ? '✓' : '✗ FAIL'}  ${msg}`) }

for (const vp of VIEWPORTS) {
  for (const lang of LANGS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 })
    await ctx.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 100)))
    console.log(`\n════════ ${vp.tag}px · ${lang.toUpperCase()} ════════`)
    await page.goto(`${base}/print-on-demand`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.evaluate(() => document.fonts && document.fonts.ready)
    await page.waitForTimeout(500)

    // active language actually applied?
    const htmlLang = await page.getAttribute('html', 'lang')
    note(htmlLang === lang, `document lang = ${htmlLang}`)

    // scroll the configurator into view (Lenis-aware)
    await page.evaluate(() => {
      const y = document.getElementById('build').getBoundingClientRect().top + window.scrollY - 10
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)
    })
    await page.waitForTimeout(500)

    // ── 1 · circled-number badges must be gone ──────────────────────────────
    const circled = await page.evaluate((rx) => {
      const re = new RegExp(rx, 'u')
      return [...document.querySelectorAll('.pod-config *, .pod-step-head *')]
        .filter((el) => !el.children.length && re.test(el.textContent)).length
    }, CIRCLED.source)
    note(circled === 0, `no circled-number badges in step headers (found ${circled})`)

    // kickers read "Step NN" / "Étape NN"
    const kickers = await page.$$eval('.pod-step-kicker', (els) => els.map((e) => e.textContent.trim()))
    note(kickers.length === 6 && kickers.every((k) => /\d\d$/.test(k)),
      `6 DM-Mono step kickers: ${JSON.stringify(kickers)}`)

    // ── 2 · overflow audit across EVERY option card / chip ──────────────────
    const overflow = await page.evaluate(() => {
      const bad = []
      const chips = [...document.querySelectorAll('.pod-config .pod-chip')]
      for (const chip of chips) {
        const cr = chip.getBoundingClientRect()
        // hero + name are the single-line-ish elements most at risk of clipping
        for (const el of chip.querySelectorAll('.pod-chip-hero, .pod-chip-name')) {
          if (el.scrollWidth > el.clientWidth + 1)
            bad.push(`text-clip "${el.textContent.trim()}" (${el.scrollWidth}>${el.clientWidth})`)
        }
        // any child escaping the card's box = the collision Harry flagged
        for (const el of chip.querySelectorAll('span, p')) {
          const er = el.getBoundingClientRect()
          if (er.right > cr.right + 0.6 || er.left < cr.left - 0.6 || er.bottom > cr.bottom + 0.6 || er.top < cr.top - 0.6)
            bad.push(`box-escape "${el.textContent.trim().slice(0, 24)}" [${el.className}]`)
        }
      }
      return bad
    })
    note(overflow.length === 0, `zero overflow across ${await page.$$eval('.pod-config .pod-chip', (e) => e.length)} cards/chips`)
    if (overflow.length) overflow.slice(0, 8).forEach((b) => console.log(`        · ${b}`))

    // ── 2b · no description is truncated by the 2-line clamp (full text fits) ─
    const clamped = await page.evaluate(() =>
      [...document.querySelectorAll('.pod-chip-desc')]
        .filter((el) => el.scrollHeight > el.clientHeight + 1)
        .map((el) => el.textContent.trim()))
    note(clamped.length === 0, `every description fits 2 lines uncut (${clamped.length} truncated)`)
    if (clamped.length) clamped.forEach((c) => console.log(`        · clipped: "${c}"`))

    // ── 3 · uniform heights per row (size + quantity chips) ─────────────────
    for (const grp of ['size', 'qty']) {
      const heights = await page.$$eval(`.pod-opts.chips.${grp} .pod-chip`, (els) =>
        els.map((e) => Math.round(e.getBoundingClientRect().height)))
      const uniform = new Set(heights).size === 1
      note(uniform, `${grp} chips equal height ${JSON.stringify(heights)}`)
    }

    // ── screenshots: whole configurator + each step ─────────────────────────
    await page.evaluate(() => { const h = document.querySelector('header'); if (h) h.style.visibility = 'hidden' })
    const cfg = await page.$('.pod-config')
    await cfg.screenshot({ path: resolve(out, `config-${vp.tag}-${lang}.png`) })
    for (const s of STEPS) {
      const el = await page.$(`#step-${s}-sec`)
      if (el) await el.screenshot({ path: resolve(out, `step-${s}-${vp.tag}-${lang}.png`) })
    }
    await page.evaluate(() => { const h = document.querySelector('header'); if (h) h.style.visibility = '' })

    // ── 4 · keyboard nav on all six radiogroups (only once, at 1536/en) ─────
    if (vp.tag === '1536' && lang === 'en') {
      const selIdx = (step) => page.evaluate((st) => {
        const radios = [...document.querySelectorAll(`[aria-labelledby="step-${st}"] [role="radio"]`)]
        return radios.findIndex((r) => r.getAttribute('aria-checked') === 'true')
      }, step)
      for (const s of STEPS) {
        const before = await selIdx(s)
        // focus the currently-checked radio (roving tabindex) with a real trusted focus
        await page.$eval(`[aria-labelledby="step-${s}"] [role="radio"][aria-checked="true"]`, (el) => el.focus())
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(60)
        const after = await selIdx(s)
        note(after !== before && after >= 0, `keyboard ArrowRight moves selection in ${s} (${before}→${after})`)
      }

      // ── 5 · summary live-updates on selection ─────────────────────────────
      const summaryBefore = await page.$eval('.pod-summary-list', (el) => el.textContent)
      // pick a non-selected format card and click it
      await page.evaluate(() => {
        const g = document.querySelector('[aria-labelledby="step-paper"]')
        const radios = [...g.querySelectorAll('[role="radio"]')]
        ;(radios.find((r) => r.getAttribute('aria-checked') !== 'true') || radios[1]).click()
      })
      await page.waitForTimeout(120)
      const summaryAfter = await page.$eval('.pod-summary-list', (el) => el.textContent)
      note(summaryBefore !== summaryAfter, 'summary panel updates when a card is chosen')
    }

    note(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`)
    await ctx.close()
  }
}

await browser.close()
console.log(`\n${failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`}  —  shots in shots/pod-redesign/`)
process.exit(failures === 0 ? 0 : 1)
