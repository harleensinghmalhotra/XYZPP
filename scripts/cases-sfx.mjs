// CASES BOOK — page-turn SFX verification.
// Headed Playwright @ 1536×743 DPR 1.25 → shots/cases-sfx/.
// Proves: audio element created + preload='auto'; play() fires on EVERY turn path
// (spine / arrow / keyboard / swipe); NO play on mount; global mute is law; rapid
// flips never stack; reduced-motion is silent; a missing file degrades gracefully;
// zero console errors throughout.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.env.URL || 'http://localhost:5173'
const out = resolve(root, 'shots', 'cases-sfx')
mkdirSync(out, { recursive: true })
const VP = { viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 }
const FLIP_WAIT = 720 // > FLIP_MS (560) so the busy-lock has cleared before the next turn

let pass = 0, fail = 0
const ok = (label, cond, extra = '') => { console.log(`  ${cond ? 'PASS ✓' : 'FAIL ✗'}  ${label}${extra ? ' — ' + extra : ''}`); cond ? pass++ : fail++ }

// Records every play() call and every Audio instance, so we can assert WHEN sound
// fires, that the SAME element is reused (no clones), and that currentTime is reset
// to ~0 on each turn (restart-safe, never overlapping).
const initSpy = () => {
  window.__plays = []
  window.__audios = []
  const RealAudio = window.Audio
  function AudioSpy(...args) {
    const a = new RealAudio(...args)
    window.__audios.push(a)
    return a
  }
  AudioSpy.prototype = RealAudio.prototype
  window.Audio = AudioSpy
  const realPlay = window.HTMLMediaElement.prototype.play
  window.HTMLMediaElement.prototype.play = function (...a) {
    try {
      const src = String(this.currentSrc || this.src || '')
      if (src.includes('page-turn')) {
        window.__plays.push({ t: performance.now(), currentTime: this.currentTime, id: this.__id || (this.__id = window.__plays.length + '@' + window.__audios.indexOf(this)) })
      }
    } catch { /* ignore */ }
    return realPlay.apply(this, a)
  }
}

async function run(reduced) {
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({ ...VP, ...(reduced ? { reducedMotion: 'reduce' } : {}) })
  const errors = []
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  await page.addInitScript(initSpy)

  console.log(`\n════ ${reduced ? 'REDUCED-MOTION' : 'STANDARD'} PASS ════`)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await page.waitForTimeout(400)

  const to = (y) => page.evaluate((yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)), y)
  const geo = await page.evaluate(() => { const el = document.getElementById('cases'); return { top: el.getBoundingClientRect().top + window.scrollY } })
  const plays = () => page.evaluate(() => window.__plays.length)

  // ── Audio element + preload asserts (the object exists and is primed) ──────────
  const au = await page.evaluate(() => {
    const a = (window.__audios || []).find((x) => String(x.src).includes('page-turn'))
    return a ? { exists: true, preload: a.preload, volume: a.volume, src: a.src } : { exists: false }
  })
  ok('audio object created on mount', au.exists, au.src ? au.src.split('/').pop() : '')
  ok("preload='auto'", au.preload === 'auto', `preload=${au.preload}`)
  ok('volume ~0.35', Math.abs((au.volume ?? 0) - 0.35) < 0.001, `volume=${au.volume}`)

  // ── NO play on mount / default render ─────────────────────────────────────────
  await to(Math.round(geo.top - 40))
  await page.waitForTimeout(500)
  ok('no play() on mount / default render', (await plays()) === 0, `${await plays()} plays`)

  if (reduced) {
    // Reduced-motion → instant crossfade, NEVER a sound (the `!flat` gate fires
    // before the sound check, so this holds regardless of the toggle state).
    const spine = page.locator('.cs-spine').first()
    await spine.click()
    await page.waitForTimeout(500)
    ok('reduced-motion switch is silent', (await plays()) === 0, `${await plays()} plays`)
    ok('zero console errors', errors.length === 0, errors.join(' | '))
    await browser.close()
    return { pass, fail }
  }

  // ── MUTE IS LAW: sound defaults OFF → a real flip must stay silent ─────────────
  await page.locator('.cs-arrow--next').click()
  await page.waitForTimeout(FLIP_WAIT)
  ok('global mute respected (toggle OFF → no SFX)', (await plays()) === 0, `${await plays()} plays`)
  // reset back to case 0 (still silent)
  await page.locator('.cs-arrow--prev').click()
  await page.waitForTimeout(FLIP_WAIT)
  const silentPlays = await plays()

  // ── Enable the global sound via the hero's real toggle (a genuine user gesture) ─
  await to(0)
  await page.waitForTimeout(300)
  const toggle = page.locator('button[aria-pressed]').filter({ hasText: 'Sound' }).first()
  await toggle.click()
  const pressed = await toggle.getAttribute('aria-pressed')
  ok('hero sound toggle engaged', pressed === 'true', `aria-pressed=${pressed}`)
  await to(Math.round(geo.top - 40))
  await page.waitForTimeout(400)

  const before = () => page.evaluate(() => window.__plays.length)

  // ── Each trigger path fires exactly one play() ─────────────────────────────────
  // SPINE (click a docked case)
  let n = await before()
  await page.locator('.cs-spine').first().click()
  await page.waitForTimeout(FLIP_WAIT)
  ok('SPINE click → play()', (await plays()) === n + 1, `Δ${(await plays()) - n}`)

  // ARROW (prev/next corner buttons)
  n = await before()
  await page.locator('.cs-arrow--prev').click()
  await page.waitForTimeout(FLIP_WAIT)
  ok('ARROW click → play()', (await plays()) === n + 1, `Δ${(await plays()) - n}`)

  // KEYBOARD (← →) on the focused interactive group
  n = await before()
  await page.locator('.cs-interactive').focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(FLIP_WAIT)
  ok('KEYBOARD → → play()', (await plays()) === n + 1, `Δ${(await plays()) - n}`)

  // SWIPE (synthetic touch drag on the book — left swipe = next)
  n = await before()
  await page.evaluate(() => {
    const el = document.querySelector('.cs-book')
    const r = el.getBoundingClientRect()
    const cy = r.top + r.height / 2
    const mk = (type, x) => {
      const t = { clientX: x, clientY: cy, identifier: 1, target: el }
      const list = type === 'touchend' ? { changedTouches: [t], touches: [] } : { touches: [t], changedTouches: [t] }
      el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, ...list }))
    }
    // fall back to a plain Event with attached touch arrays if TouchEvent ctor is absent
    try { mk('touchstart', r.right - 40); mk('touchend', r.left + 40) }
    catch {
      const fire = (type, x) => { const e = new Event(type, { bubbles: true }); const t = { clientX: x, clientY: cy }; e.touches = type === 'touchend' ? [] : [t]; e.changedTouches = [t]; el.dispatchEvent(e) }
      fire('touchstart', r.right - 40); fire('touchend', r.left + 40)
    }
  })
  await page.waitForTimeout(FLIP_WAIT)
  ok('SWIPE → play()', (await plays()) === n + 1, `Δ${(await plays()) - n}`)

  // ── RAPID FLIP: two triggers inside one flip → busy-lock allows only ONE turn,
  //    so exactly one play(), no stacked audio. ───────────────────────────────────
  n = await before()
  await page.locator('.cs-arrow--prev').click()
  await page.locator('.cs-arrow--prev').click() // fired mid-flip; go() early-returns (busy)
  await page.waitForTimeout(FLIP_WAIT)
  const rapidDelta = (await plays()) - n
  ok('rapid double-trigger → no overlap (single play)', rapidDelta === 1, `Δ${rapidDelta}`)

  // ── No stacked voices: only ONE audio element ever, every play starts at ~0 ─────
  const analysis = await page.evaluate(() => {
    // Count DISTINCT elements that actually played — the real "no stacked voices"
    // proof. (window.__audios can hold a mount-time orphan from React StrictMode's
    // double-invoked effect in dev; only the live ref is ever played.)
    const playedEls = new Set((window.__plays || []).map((p) => String(p.id).split('@')[1]))
    const starts = (window.__plays || []).map((p) => p.currentTime)
    return { count: playedEls.size, maxStart: starts.length ? Math.max(...starts) : 0, plays: window.__plays.length }
  })
  ok('single reused audio element (no clones)', analysis.count === 1, `${analysis.count} element(s) played`)
  ok('every turn restarts from ~0 (currentTime reset)', analysis.maxStart < 0.05, `maxStart=${analysis.maxStart.toFixed(3)}s`)
  console.log(`  (total plays this pass: ${analysis.plays}; silent-while-muted plays: ${silentPlays})`)

  await page.locator('#cases').screenshot({ path: resolve(out, 'cases-sfx-standard.png') })

  ok('zero console errors', errors.length === 0, errors.join(' | '))
  await browser.close()
  return { pass, fail }
}

async function runMissing() {
  // FILE MISSING → 404: play() rejects, we swallow it, no console errors.
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext(VP)
  // Separate OUR errors (thrown exceptions / unhandled promise rejections — the
  // only thing app code controls) from Chromium's inherent "Failed to load
  // resource" network line, which the browser emits for ANY 404 and no JS can mute.
  const codeErrors = []
  const netNoise = []
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') (/(Failed to load resource|net::ERR|404)/i.test(m.text()) ? netNoise : codeErrors).push(m.text()) })
  page.on('pageerror', (e) => codeErrors.push('pageerror: ' + e.message))
  await page.route('**/page-turn.wav', (r) => r.fulfill({ status: 404, body: 'not found' }))
  await page.addInitScript(() => { window.addEventListener('unhandledrejection', (e) => { window.__unhandled = (window.__unhandled || 0) + 1 }) })
  await page.addInitScript(initSpy)

  console.log('\n════ FILE-MISSING (404) PASS ════')
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(400)
  const geo = await page.evaluate(() => { const el = document.getElementById('cases'); return { top: el.getBoundingClientRect().top + window.scrollY } })
  // enable sound then flip — play() will reject on the 404 source
  const toggle = page.locator('button[aria-pressed]').filter({ hasText: 'Sound' }).first()
  await toggle.click()
  await page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), Math.round(geo.top - 40))
  await page.waitForTimeout(400)
  await page.locator('.cs-arrow--next').click()
  await page.waitForTimeout(900)
  const unhandled = await page.evaluate(() => window.__unhandled || 0)
  ok('missing file: no thrown errors / unhandled play() rejection', codeErrors.length === 0 && unhandled === 0, `codeErrors=${codeErrors.length} unhandled=${unhandled}`)
  console.log(`  (browser network noise, inherent to a 404 & not app-controllable: ${netNoise.length} line(s))`)
  await browser.close()
}

await run(false)
await run(true)
await runMissing()

console.log(`\n──────── ${fail === 0 ? 'ALL GREEN ✓' : fail + ' FAILURES ✗'} (${pass} passed, ${fail} failed) ────────`)
process.exit(fail === 0 ? 0 : 1)
