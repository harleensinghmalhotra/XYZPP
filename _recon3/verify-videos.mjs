import { chromium } from 'playwright'
const BASE = 'http://localhost:4173'
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForTimeout(1500)
for (const b of ['Decline']) { const x = page.locator(`button:has-text("${b}")`).first(); if (await x.count()) { try { await x.click({ timeout: 800 }) } catch {} } }

// Process video (muted, autoplay). Scroll it into view to ensure it starts.
await page.evaluate(() => { const v = document.querySelector('video'); if (v) v.scrollIntoView() })
await page.waitForTimeout(2500)
const proc = await page.evaluate(() => {
  const vids = Array.from(document.querySelectorAll('video'))
  const v = vids.find(x => (x.currentSrc || x.src || '').includes('how-we-work')) || vids[0]
  if (!v) return null
  return { src: (v.currentSrc || v.src).split('/').pop(), muted: v.muted, paused: v.paused, currentTime: +v.currentTime.toFixed(2), readyState: v.readyState }
})
console.log('PROCESS VIDEO:', JSON.stringify(proc))

// AV: click the infrastructure play button to open the dialog, then check playback.
await page.locator('.infra-video-thumb').scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
await page.locator('.infra-video-thumb').click()
await page.waitForSelector('.infra-dialog-video', { timeout: 6000 })
await page.waitForTimeout(3000)
const av = await page.evaluate(() => {
  const v = document.querySelector('.infra-dialog-video')
  if (!v) return null
  // hasAudio heuristics across engines
  const hasAudio = v.mozHasAudio || Boolean(v.webkitAudioDecodedByteCount) || (v.audioTracks && v.audioTracks.length > 0) || 'unknown-in-chromium'
  return { src: (v.currentSrc || v.src).split('/').pop(), muted: v.muted, paused: v.paused, currentTime: +v.currentTime.toFixed(2), duration: +v.duration.toFixed(1), readyState: v.readyState, hasAudio }
})
console.log('AV VIDEO:', JSON.stringify(av))
await browser.close()
