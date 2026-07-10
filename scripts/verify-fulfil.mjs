import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const URL = 'http://localhost:5177/fulfilment'
mkdirSync('shots/phase25', { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
const page = await ctx.newPage()
const errors = []       // real console.error / pageerror
const reqfails = []      // network-level failures (aborts are usually benign)
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
page.on('requestfailed', (r) => {
  reqfails.push({ url: r.url(), err: r.failure()?.errorText || '' })
})

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// scroll fully to trigger reveals / lazy media
const H = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < H; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(120) }
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(1500)

// hero video state
const vid = await page.evaluate(() => {
  const v = document.querySelector('.ff-hero-video')
  if (!v) return { present: false }
  return {
    present: true, src: v.currentSrc || v.src, readyState: v.readyState,
    paused: v.paused, currentTime: v.currentTime, vw: v.videoWidth, vh: v.videoHeight,
    opacity: getComputedStyle(v).opacity,
  }
})

// audit every image/video frame for empty/broken backgrounds
const frames = await page.evaluate(() => {
  const out = []
  const sels = ['.ff-hero-poster', '.ff-card-media', '.ff-feat-media', '.ff-journey-media']
  for (const sel of sels) {
    document.querySelectorAll(sel).forEach((el, i) => {
      const bg = getComputedStyle(el).backgroundImage
      const r = el.getBoundingClientRect()
      out.push({ sel: sel + '#' + i, hasBg: bg && bg !== 'none', bg: bg.slice(0, 60), w: Math.round(r.width), h: Math.round(r.height) })
    })
  }
  return out
})

// verify each referenced webp actually loaded (natural check via fetch)
const assets = await page.evaluate(async () => {
  const urls = new Set()
  document.querySelectorAll('.ff-hero-poster,.ff-card-media,.ff-feat-media,.ff-journey-media').forEach((el) => {
    const m = getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)
    if (m) urls.add(m[1])
  })
  const res = []
  for (const u of urls) {
    try { const r = await fetch(u, { method: 'HEAD' }); res.push({ u, ok: r.ok, status: r.status }) }
    catch (e) { res.push({ u, ok: false, status: 'ERR ' + e.message }) }
  }
  return res
})

await page.screenshot({ path: 'shots/phase25/fulfilment.png', fullPage: true })
await browser.close()

console.log('=== CONSOLE / PAGE ERRORS ===', errors.length)
errors.forEach((e) => console.log('  ', e))
const realReqFails = reqfails.filter((r) => r.err && !/ERR_ABORTED/.test(r.err))
console.log('=== REQUEST FAILURES (non-abort) ===', realReqFails.length)
realReqFails.forEach((r) => console.log('  ', r.err, r.url))
console.log('   (aborted requests, benign:', reqfails.filter((r) => /ERR_ABORTED/.test(r.err)).length, ')')
console.log('=== HERO VIDEO ===', JSON.stringify(vid))
console.log('=== FRAMES ===')
frames.forEach((f) => console.log('  ', f.sel, 'bg=' + f.hasBg, f.w + 'x' + f.h, f.bg))
console.log('=== ASSET LOADS ===')
assets.forEach((a) => console.log('  ', a.ok ? 'OK ' : 'FAIL', a.status, a.u))
const emptyFrames = frames.filter((f) => !f.hasBg || f.w === 0 || f.h === 0)
const failedAssets = assets.filter((a) => !a.ok)
console.log('=== VERDICT ===')
console.log('  empty frames:', emptyFrames.length)
console.log('  failed assets:', failedAssets.length)
console.log('  console/page errors:', errors.length)
console.log('  real request failures:', realReqFails.length)
console.log('  video plays:', vid.present && vid.vw > 0 && (!vid.paused || vid.currentTime > 0))
