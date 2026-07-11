// CASES BOOK — FOCUS-FREE KEYBOARD + SIZE-UP-TO-MATCH-WWP verification harness.
// Headed Playwright @ 1536×743 DPR 1.25 → shots/cases-keys-size/.
//
// Evidence produced:
//   before.png / after.png        — full #cases section, HEAD vs working tree
//   wwp-full.png                  — the WhatWePrint section, for the height compare
//   keys-active.png               — focus-FREE arrow flip with the book on screen
//   keys-inactive.png             — arrows scrolled away: page scrolls, book unmoved
//   typing-bail.png               — arrow while an <input> is focused: no flip
//   reduced.png                   — reduced-motion focus-free flip (crossfade, no leaf)
//   fr-full.png                   — FR full section
//   heights.json                  — WWP vs Cases section height, match delta
//   console.json                  — every console + page error (must be empty)
//
// Assertions (all pushed to `problems`, surfaced at the end + in console.json):
//   • Cases height matches WWP within ~24px
//   • data-kbd-active flips 1 when the book fills ≥50% of the viewport, 0 when away
//   • focus-free ArrowRight/Left flip the book (no click, no focus) AND preventDefault
//     the page scroll (scrollY held) while active
//   • while inactive, arrows DON'T flip and the page DOES scroll (pass-through)
//   • typing in an <input> never hijacks (counter unchanged)
//   • reduced-motion flips focus-free with no turning leaf
//   • FR localised, zero console/page errors
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'shots', 'cases-keys-size')
mkdirSync(out, { recursive: true })
const URL = process.env.CASES_URL || 'http://localhost:5176'
const VP = { width: 1536, height: 743 }
const DPR = 1.25

const browser = await chromium.launch({ headless: false })
const problems = []

function newCtxPage({ reducedMotion, lang } = {}) {
  return browser.newContext({ viewport: VP, deviceScaleFactor: DPR, reducedMotion, hasTouch: true })
    .then(async (ctx) => {
      if (lang) await ctx.addInitScript((l) => localStorage.setItem('qfp.lang', l), lang)
      const page = await ctx.newPage()
      page.on('console', (m) => { if (m.type() === 'error') problems.push({ kind: 'console', text: m.text() }) })
      page.on('pageerror', (e) => problems.push({ kind: 'pageerror', text: e.message }))
      return { ctx, page }
    })
}

async function settle(page) {
  await page.waitForTimeout(900)
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch { /* noop */ }
  await page.waitForTimeout(300)
}

// centre a section in the viewport (so it fills ≥50% → focus-free keys go active)
async function centre(page, sel) {
  const y = await page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return 0
    const r = el.getBoundingClientRect()
    const top = r.top + window.scrollY
    return Math.max(0, top + el.offsetHeight / 2 - window.innerHeight / 2)
  }, sel)
  await page.evaluate((yy) => {
    if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)
  await page.waitForTimeout(600)
}

const counter = (page) => page.$eval('.cs-counter', (n) => n.textContent.replace(/\s+/g, ' ').trim())
const kbdActive = (page) => page.$eval('#cases', (n) => n.dataset.kbdActive || '0')
const shotSection = async (page, sel, name) => {
  const el = await page.$(sel)
  if (el) await el.screenshot({ path: resolve(out, name) })
}

// ── 0. BEFORE frame — restore HEAD's Cases files, snap, then restore the new ones.
//     Wrapped so the working-tree edits are ALWAYS put back, even on error. ──
const JSX = resolve(root, 'src/sections/Cases.jsx')
const CSS = resolve(root, 'src/sections/Cases.css')
const newJsx = readFileSync(JSX)
const newCss = readFileSync(CSS)
{
  const { ctx, page } = await newCtxPage({ lang: 'en' })
  try {
    const oldJsx = execSync('git show HEAD:src/sections/Cases.jsx', { cwd: root })
    const oldCss = execSync('git show HEAD:src/sections/Cases.css', { cwd: root })
    writeFileSync(JSX, oldJsx)
    writeFileSync(CSS, oldCss)
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
    await settle(page)
    await centre(page, '#cases')
    await shotSection(page, '#cases', 'before.png')
    const beforeH = await page.$eval('#cases', (n) => Math.round(n.getBoundingClientRect().height))
    console.log(`✓ before.png  (Cases height @HEAD = ${beforeH}px)`)
  } finally {
    writeFileSync(JSX, newJsx)  // ALWAYS restore the working-tree edits
    writeFileSync(CSS, newCss)
    console.log('✓ Cases.jsx/css restored to working-tree edits')
    await ctx.close()
  }
}

// ── 1. EN — after frame + WWP vs Cases height compare + focus-free assertions ──
{
  const { ctx, page } = await newCtxPage({ lang: 'en' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)

  // heights: measure both sections live
  const heights = await page.evaluate(() => {
    const h = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null }
    const nav = document.querySelector('header.sticky') || document.querySelector('header')
    return {
      innerHeight: window.innerHeight,
      navH: nav ? Math.round(nav.getBoundingClientRect().height) : null,
      wwp: h('#services'),
      cases: h('#cases'),
    }
  })
  heights.delta = Math.abs(heights.wwp - heights.cases)
  heights.matchWithin24 = heights.delta <= 24
  await writeFile(resolve(out, 'heights.json'), JSON.stringify(heights, null, 2))
  if (!heights.matchWithin24) problems.push({ kind: 'assert', text: `Cases (${heights.cases}) vs WWP (${heights.wwp}) off by ${heights.delta}px (>24)` })
  console.log(`✓ heights.json  WWP=${heights.wwp}  Cases=${heights.cases}  Δ=${heights.delta}px  match=${heights.matchWithin24}`)

  // full frames of both, side by side as evidence. NOTE: a full-element screenshot
  // of the 2160px section scrolls it to the top, so we re-centre AFTER shooting,
  // right before the key tests, to guarantee the book fills ≥50% of the viewport.
  await shotSection(page, '#services', 'wwp-full.png')
  await centre(page, '#cases')
  await shotSection(page, '#cases', 'after.png')
  console.log('✓ wwp-full.png + after.png')

  // ── FOCUS-FREE ACTIVE: book centred → active flag on → arrows flip with NO click ──
  await centre(page, '#cases')
  await page.evaluate(() => document.activeElement && document.activeElement.blur())
  const activeFlag = await kbdActive(page)
  if (activeFlag !== '1') problems.push({ kind: 'assert', text: `kbd not active with book centred (data-kbd-active=${activeFlag})` })
  const scrollBefore = await page.evaluate(() => Math.round(window.scrollY))
  const k0 = await counter(page)
  await page.keyboard.press('ArrowRight')      // no focus, no click — pure window listener
  await page.waitForTimeout(750)
  const k1 = await counter(page)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(750)
  const k2 = await counter(page)
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(750)
  const k3 = await counter(page)
  const scrollAfter = await page.evaluate(() => Math.round(window.scrollY))
  await shotSection(page, '.cs-stage', 'keys-active.png')
  const flipped = k0 !== k1 && k1 !== k2 && k3 === k1
  if (!flipped) problems.push({ kind: 'assert', text: `focus-free keys failed: ${k0} → ${k1} → ${k2} → ${k3}` })
  if (Math.abs(scrollAfter - scrollBefore) > 4) problems.push({ kind: 'assert', text: `active arrows scrolled the page (${scrollBefore}→${scrollAfter}), preventDefault leaked` })
  // confirm the active handler actually calls preventDefault (page can't scroll under the flip)
  const activePrevented = await page.evaluate(() => new Promise((res) => {
    const h = (e) => { window.removeEventListener('keydown', h); res(e.defaultPrevented) }
    window.addEventListener('keydown', h)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
  }))
  if (!activePrevented) problems.push({ kind: 'assert', text: 'active arrow did NOT preventDefault — page scroll could leak under the flip' })
  await page.waitForTimeout(700)
  console.log(`✓ keys-active.png  active=${activeFlag}  ${k0} →→ ${k2} ← ${k3}  scroll ${scrollBefore}→${scrollAfter}`)

  // ── TYPING BAIL: focus an <input> while the section is active → arrow must NOT flip ──
  await page.evaluate(() => {
    const i = document.createElement('input')
    i.id = '__probe_input'
    i.style.cssText = 'position:fixed;top:20px;left:20px;z-index:99999'
    document.body.appendChild(i)
    i.focus()
  })
  const t0 = await counter(page)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(600)
  const t1 = await counter(page)
  await shotSection(page, '.cs-stage', 'typing-bail.png')
  if (t0 !== t1) problems.push({ kind: 'assert', text: `typing bail failed — arrow flipped while input focused (${t0} → ${t1})` })
  console.log(`✓ typing-bail.png  input-focused arrow: ${t0} → ${t1} (unchanged=${t0 === t1})`)
  await page.evaluate(() => document.getElementById('__probe_input')?.remove())

  // ── FLIP + SOUND CLEAN: rapid flips must stay guarded (one at a time), no errors ──
  await page.evaluate(() => document.activeElement && document.activeElement.blur())
  const f0 = await counter(page)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight') // second press lands mid-flip → must be dropped by the lock
  await page.waitForTimeout(300)
  const midCount = await page.$$eval('.cs-leaf', (n) => n.length)
  if (midCount > 1) problems.push({ kind: 'assert', text: `more than one leaf turning at once (${midCount}) — lock leaked` })
  await page.waitForTimeout(750)
  const f1 = await counter(page)
  if (f0 === f1) problems.push({ kind: 'assert', text: 'guarded flip did not advance at all' })
  console.log(`✓ flip guard  ${f0} → ${f1}  (leaves mid-flip=${midCount})`)

  await ctx.close()
}

// ── 2. INACTIVE (scrolled away) — arrows pass through: no flip, page DOES scroll ──
{
  const { ctx, page } = await newCtxPage({ lang: 'en' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await page.evaluate(() => { if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0) })
  await page.waitForTimeout(500)
  await page.evaluate(() => document.activeElement && document.activeElement.blur())
  const flag = await kbdActive(page)
  if (flag !== '0') problems.push({ kind: 'assert', text: `kbd still active at page top (data-kbd-active=${flag})` })
  const c0 = await counter(page)
  // (a) Left/Right are passed through untouched — the listener never preventDefaults
  const leftNotPrevented = await page.evaluate(() => new Promise((res) => {
    const h = (e) => { window.removeEventListener('keydown', h); res(!e.defaultPrevented) }
    window.addEventListener('keydown', h)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
  }))
  await page.waitForTimeout(200)
  const c1 = await counter(page)
  // (b) normal page scrolling still works — a real ArrowDown moves the page
  const y0 = await page.evaluate(() => Math.round(window.scrollY))
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(600)
  const y1 = await page.evaluate(() => Math.round(window.scrollY))
  await page.screenshot({ path: resolve(out, 'keys-inactive.png') })
  if (c0 !== c1) problems.push({ kind: 'assert', text: `inactive arrow still flipped the book (${c0} → ${c1})` })
  if (!leftNotPrevented) problems.push({ kind: 'assert', text: 'inactive Left/Right was preventDefaulted — scroll hijacked while off-screen' })
  if (y1 <= y0) problems.push({ kind: 'assert', text: `inactive ArrowDown did not scroll (${y0} → ${y1}) — page scroll blocked` })
  console.log(`✓ keys-inactive.png  active=${flag}  counter unchanged=${c0 === c1}  L/R passthrough=${leftNotPrevented}  scroll ${y0}→${y1}`)
  await ctx.close()
}

// ── 3. REDUCED MOTION — focus-free flip still works, crossfade only (no leaf) ──
{
  const { ctx, page } = await newCtxPage({ reducedMotion: 'reduce', lang: 'en' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await centre(page, '#cases')
  await page.evaluate(() => document.activeElement && document.activeElement.blur())
  const r0 = await counter(page)
  const noLeaf = await page.evaluate(() => new Promise((res) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
    setTimeout(() => res(!document.querySelector('.cs-leaf')), 120)
  }))
  await page.waitForTimeout(400)
  const r1 = await counter(page)
  await shotSection(page, '.cs-stage', 'reduced.png')
  if (!noLeaf) problems.push({ kind: 'assert', text: 'reduced-motion rendered a turning leaf' })
  if (r0 === r1) problems.push({ kind: 'assert', text: `reduced-motion focus-free key did not change case (${r0})` })
  console.log(`✓ reduced.png  ${r0} → ${r1}  (no leaf=${noLeaf})`)
  await ctx.close()
}

// ── 4. FR — full frame + localised counter ──
{
  const { ctx, page } = await newCtxPage({ lang: 'fr' })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await settle(page)
  await centre(page, '#cases')
  await shotSection(page, '#cases', 'fr-full.png')
  const frC = await counter(page)
  if (!/^CAS/i.test(frC)) problems.push({ kind: 'assert', text: `FR counter not localised: ${frC}` })
  // FR focus-free flip too — re-centre after the tall-element screenshot
  await centre(page, '#cases')
  await page.evaluate(() => document.activeElement && document.activeElement.blur())
  const frFlag = await kbdActive(page)
  const g0 = await counter(page)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(750)
  const g1 = await counter(page)
  if (g0 === g1) problems.push({ kind: 'assert', text: `FR focus-free key did not flip (active=${frFlag}, ${g0})` })
  console.log(`✓ fr-full.png  ${frC}  |  active=${frFlag}  focus-free ${g0} → ${g1}`)
  await ctx.close()
}

await browser.close()
await writeFile(resolve(out, 'console.json'), JSON.stringify(problems, null, 2))
console.log(`\n${problems.length ? '✗ ' + problems.length + ' PROBLEM(S)' : '✓ zero problems'} →`, out)
if (problems.length) for (const p of problems) console.log('  -', p.kind, p.text)
process.exit(problems.length ? 1 : 0)
