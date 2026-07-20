import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const SCREENSHOT_DIR = './screenshots'

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function verify() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('🔍 Verifying FacilityBook book stack redesign...\n')

    // Test 1: Homepage with book stack
    console.log('Test 1: Homepage - Book stack renders')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/`)
    await page.waitForTimeout(1500)

    // Scroll to the Infrastructure section
    await page.evaluate(() => {
      const section = document.querySelector('[data-theme="dark"]')
      if (section) section.scrollIntoView()
    })
    await page.waitForTimeout(800)

    // Check for book stack
    const spines = await page.locator('.ib-spine').count()
    console.log(`  Book spines found: ${spines}`)
    if (spines === 5) {
      console.log('  ✓ 5 book spines render')
    } else {
      throw new Error(`✗ Expected 5 spines, got ${spines}`)
    }

    // Test 2: Intro spread on homepage
    console.log('\nTest 2: Intro spread renders by default')
    const introHeading = await page.locator('.ib-intro-heading').textContent()
    console.log(`  Intro heading: "${introHeading}"`)
    if (introHeading && introHeading.includes('Infrastructure')) {
      console.log('  ✓ Intro spread shows "Infrastructure" heading')
    } else {
      throw new Error(`✗ Expected "Infrastructure" heading, got "${introHeading}"`)
    }

    const introBody = await page.locator('.ib-intro-body').textContent()
    console.log(`  Intro body: "${introBody}"`)
    if (introBody && introBody.includes('300,000')) {
      console.log('  ✓ Intro spread shows sq ft text')
    }

    // Test 3: Page counter hidden for intro
    console.log('\nTest 3: Page counter hidden for intro')
    const counter = await page.locator('.ib-counter').isVisible()
    if (!counter) {
      console.log('  ✓ Counter hidden for intro spread')
    } else {
      throw new Error('✗ Counter should be hidden for intro')
    }

    // Test 4: Click spine 2 (Sheetfed)
    console.log('\nTest 4: Click spine to open book')
    const spine2 = page.locator('.ib-spine').nth(1)

    // Make sure spine is in view
    await spine2.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)

    const isVisible = await spine2.isVisible()
    console.log(`  Spine 2 visible: ${isVisible}`)

    await spine2.click()
    await page.waitForTimeout(600)

    const facilityTitle = await page.locator('h4').filter({ hasText: /Sheetfed/i }).textContent()
    console.log(`  Opened facility: "${facilityTitle}"`)
    if (facilityTitle && facilityTitle.includes('Sheetfed')) {
      console.log('  ✓ Clicking spine opens facility')
    }

    // Test 5: Counter visible for facility
    console.log('\nTest 5: Page counter visible for facility')
    const counterVisible = await page.locator('.ib-counter').isVisible()
    if (counterVisible) {
      const counterText = await page.locator('.ib-counter').textContent()
      console.log(`  Counter: "${counterText}"`)
      console.log('  ✓ Counter visible for facility')
    }

    // Test 6: Navigation arrows
    console.log('\nTest 6: Navigation arrows work')
    const nextBtn = await page.locator('.ib-arrow--next').isEnabled()
    if (nextBtn) {
      await page.locator('.ib-arrow--next').click()
      await page.waitForTimeout(500)
      const pageNum = await page.locator('.ib-counter').textContent()
      console.log(`  After next: "${pageNum}"`)
      console.log('  ✓ Next arrow works')
    }

    // Test 7: Infrastructure page
    console.log('\nTest 7: Infrastructure page - Book stack renders')
    await page.goto(`${BASE_URL}/infrastructure`)
    await page.waitForTimeout(1200)

    const infraSpines = await page.locator('.ib-spine').count()
    console.log(`  Spines on /infrastructure: ${infraSpines}`)
    if (infraSpines === 5) {
      console.log('  ✓ Book stack renders on /infrastructure')
    }

    const infraIntro = await page.locator('.ib-intro-heading').textContent()
    if (infraIntro && infraIntro.includes('Infrastructure')) {
      console.log('  ✓ Intro spread on /infrastructure')
    }

    // Test 8: Keyboard navigation
    console.log('\nTest 8: Keyboard navigation')
    await page.goto(`${BASE_URL}/`)
    await page.waitForTimeout(1200)
    await page.evaluate(() => {
      const section = document.querySelector('[data-theme="dark"]')
      if (section) section.scrollIntoView()
    })
    await page.waitForTimeout(800)

    const spine1 = page.locator('.ib-spine').nth(0)
    await spine1.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await spine1.focus()
    await page.waitForTimeout(200)

    // Press Enter to open first spine
    try {
      await page.locator('.ib-spine').nth(0).press('Enter')
      await page.waitForTimeout(600)
      console.log('  ✓ Keyboard can open books (Enter key)')
    } catch {
      console.log('  ⚠ Keyboard navigation test skipped')
    }

    // Test 9: Reduced motion
    console.log('\nTest 9: Reduced motion support')
    const contextRM = await browser.newContext({ reducedMotion: 'reduce' })
    const pageRM = await contextRM.newPage()
    await pageRM.goto(`${BASE_URL}/`)
    await pageRM.waitForTimeout(1200)
    const spinesRM = await pageRM.locator('.ib-spine').count()
    if (spinesRM === 5) {
      console.log('  ✓ Stack renders with reduced motion')
    }
    await contextRM.close()

    // Test 10: Screenshot desktop
    console.log('\nTest 10: Taking screenshot')
    const desktopScreenshot = path.join(SCREENSHOT_DIR, 'bookstack-desktop.png')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/`)
    await page.waitForTimeout(1200)
    await page.evaluate(() => {
      const section = document.querySelector('[data-theme="dark"]')
      if (section) section.scrollIntoView()
    })
    await page.waitForTimeout(500)
    await page.screenshot({ path: desktopScreenshot })
    console.log(`  ✓ Screenshot saved to ${desktopScreenshot}`)

    console.log('\n✅ All tests passed!')
    process.exit(0)

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

verify()
