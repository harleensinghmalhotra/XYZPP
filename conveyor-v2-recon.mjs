#!/usr/bin/env node
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOTS_DIR = path.join(__dirname, 'shots', 'conveyor-v2')

// Ensure shots directory exists
if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true })
}

const BASE_URL = 'http://localhost:4174'

async function runReShoot() {
  const browser = await chromium.launch()
  const log = []

  try {
    // ── DESKTOP: 1536x743 @ DPR 1.25 ──────────────────────────────────────
    console.log('Starting conveyor v2 re-shoot (desktop 1536×743)...\n')

    const ctx = await browser.newContext({
      viewport: { width: 1536, height: 743 },
      deviceScaleFactor: 1.25
    })
    const page = await ctx.newPage()

    // Navigate to homepage
    await page.goto(`${BASE_URL}/#process`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Step 1: DISMISS COOKIE BANNER
    console.log('Step 1: Dismissing cookie banner...')
    const rejectBtn = await page.$('button:has-text("Reject")')
    if (rejectBtn) {
      await rejectBtn.click()
      await page.waitForTimeout(500)
      const bannerGone = await page.evaluate(() => {
        const banner = document.querySelector('[role="dialog"], .ck-consent-banner, [class*="cookie"]')
        return !banner || window.getComputedStyle(banner).display === 'none'
      })
      console.log(`  Banner dismissed: ${bannerGone ? '✅' : '❌'}\n`)
      log.push(`Banner dismissed: ${bannerGone}`)
    } else {
      console.log('  ⚠️ No reject button found, proceeding\n')
      log.push('No cookie banner found')
    }

    // Step 2: GET SECTION MEASUREMENTS
    console.log('Step 2: Computing scroll positions...')
    const measurements = await page.evaluate(() => {
      const section = document.getElementById('process')
      const head = document.querySelector('.conv-head')
      const scrollTrack = document.querySelector('.conv-scroll')

      return {
        sectionTop: section?.offsetTop || 0,
        headHeight: head?.offsetHeight || 0,
        scrollTrackHeight: scrollTrack?.scrollHeight || 0
      }
    })

    const { sectionTop, headHeight, scrollTrackHeight } = measurements
    const scrollBase = sectionTop + headHeight

    console.log(`  Section top: ${sectionTop}px`)
    console.log(`  Head height: ${headHeight}px`)
    console.log(`  Scroll track: ${scrollTrackHeight}px`)
    console.log(`  Scroll base (top + head): ${scrollBase}px\n`)

    log.push(`Section measurements: top=${sectionTop}, headH=${headHeight}, trackH=${scrollTrackHeight}`)

    // Step 3: SHOOT AT EACH SCROLL POSITION (0%, 15%, 30%, 45%, 60%, 75%, 90%, 100%)
    const percentages = [0, 15, 30, 45, 60, 75, 90, 100]

    for (const pct of percentages) {
      console.log(`\nScrolling to ${pct}%...`)

      // Compute scroll Y
      const scrollY = scrollBase + (scrollTrackHeight * pct) / 100

      // Scroll the page
      await page.evaluate((y) => {
        window.scrollTo({ top: y, behavior: 'auto' })
      }, scrollY)

      // Wait for scrub to settle
      await page.waitForTimeout(600)

      // Step 4: VERIFY PROGRESS BY READING VISIBLE CAPTION
      const captionData = await page.evaluate(() => {
        const visibleCap = document.querySelector('.conv-cap.is-active')
        if (!visibleCap) return { name: 'NONE', desc: '(hidden)' }

        const name = visibleCap.querySelector('.conv-cap-name')?.textContent.trim() || ''
        const desc = visibleCap.querySelector('.conv-cap-desc')?.textContent.trim() || ''

        return {
          name,
          desc: desc.substring(0, 60) + (desc.length > 60 ? '...' : '')
        }
      })

      console.log(`  Caption: "${captionData.name}" — ${captionData.desc}`)

      // Screenshot
      const screenshotPath = path.join(SHOTS_DIR, `conveyor-v2-${pct}.png`)
      await page.screenshot({ path: screenshotPath })
      console.log(`  ✅ Saved: ${path.basename(screenshotPath)}`)

      log.push(`${pct}% - Caption: "${captionData.name}"`)
    }

    await ctx.close()

    // ── MOBILE: 390x844 @ DPR 3 ──────────────────────────────────────────
    console.log('\n' + '='.repeat(60))
    console.log('Mobile check (390×844 @ DPR 3)...\n')

    const ctxMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3
    })
    const pageMobile = await ctxMobile.newPage()

    await pageMobile.goto(`${BASE_URL}/#process`, { waitUntil: 'networkidle' })
    await pageMobile.waitForTimeout(1500)

    // Dismiss banner on mobile
    const rejectBtnMobile = await pageMobile.$('button:has-text("Reject")')
    if (rejectBtnMobile) {
      await rejectBtnMobile.click()
      await pageMobile.waitForTimeout(500)
    }

    // Scroll to process section
    await pageMobile.evaluate(() => {
      const section = document.getElementById('process')
      if (section) section.scrollIntoView({ behavior: 'auto' })
    })
    await pageMobile.waitForTimeout(300)

    // Screenshot poster area
    const mobilePath = path.join(SHOTS_DIR, 'conveyor-v2-mobile-poster.png')
    await pageMobile.screenshot({ path: mobilePath })
    console.log(`Mobile poster screenshot: ${path.basename(mobilePath)}`)

    // Check poster image details
    const posterInfo = await pageMobile.evaluate(() => {
      const img = document.querySelector('.conv-poster img')
      if (!img) return { found: false, src: '' }
      return {
        found: true,
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height,
        complete: img.complete,
        currentSrc: img.currentSrc
      }
    })

    console.log(`Poster image info:`)
    console.log(`  Found: ${posterInfo.found}`)
    console.log(`  Source: ${posterInfo.src}`)
    console.log(`  Natural size: ${posterInfo.naturalWidth}×${posterInfo.naturalHeight}`)
    console.log(`  Display size: ${posterInfo.displayWidth}×${posterInfo.displayHeight}`)
    console.log(`  Loaded: ${posterInfo.complete}`)

    log.push(`\nMobile poster: src=${posterInfo.src}, size=${posterInfo.naturalWidth}×${posterInfo.naturalHeight}, loaded=${posterInfo.complete}`)

    // Fetch poster image directly from dist
    console.log(`\nFetching poster image from dist...`)
    const posterUrl = `${BASE_URL}/assets/poster-Ch5gyr9j.jpg`
    try {
      const posterRes = await pageMobile.context().browser().newContext().then(async (c) => {
        const p = await c.newPage()
        const r = await p.goto(posterUrl)
        await c.close()
        return r
      })

      console.log(`Poster fetch status: ${posterRes?.status()}`)
      log.push(`Poster fetch: ${posterRes?.status() || 'failed'}`)
    } catch (err) {
      console.log(`Poster fetch error: ${err.message}`)
      log.push(`Poster fetch error: ${err.message}`)
    }

    await ctxMobile.close()

    // ── SUMMARY ────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(60))
    console.log('Re-shoot complete! ✅\n')

    console.log('Shot log:')
    log.forEach((line) => console.log(`  ${line}`))

    console.log(`\nAll shots saved to: ${SHOTS_DIR}`)
    console.log(`Files: ${fs.readdirSync(SHOTS_DIR).join(', ')}\n`)

    // Git status
    console.log('Git status (should be clean):')
  } catch (err) {
    console.error('Error:', err)
    log.push(`ERROR: ${err.message}`)
  } finally {
    await browser.close()

    // Write log
    const logPath = path.join(SHOTS_DIR, 'v2-shot-log.txt')
    fs.writeFileSync(logPath, log.join('\n'))
    console.log(`Shot log saved: ${logPath}`)
  }
}

runReShoot().catch(console.error)
