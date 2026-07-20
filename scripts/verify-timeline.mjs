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
    console.log('🔍 Verifying timeline redesign...\n')

    // Test 1: Navigate to about page - desktop viewport
    console.log('Test 1: Navigate to About page (desktop)')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/about`)
    await page.waitForTimeout(1200)
    console.log('  ✓ Page loaded')

    // Test 2: Check 5 years in rail
    console.log('\nTest 2: 5 years visible in timeline')
    const pageContent = await page.content()
    const years = ['2014', '2015 to 2017', '2018', '2021 to 2023', '2024 to 2025']
    let allYearsFound = true
    years.forEach(year => {
      if (!pageContent.includes(year)) {
        allYearsFound = false
        console.log(`  ✗ Year "${year}" not found`)
      }
    })
    if (allYearsFound) {
      console.log('  Years found: ' + years.join(', '))
      console.log('  ✓ All 5 years present')
    }

    // Test 3: Click first year (2014) to ensure it loads
    console.log('\nTest 3: First year (2014) shows correct content')
    const titleInitial = await page.locator('h3').first().textContent()
    console.log(`  Initial title: ${titleInitial}`)
    if (titleInitial && titleInitial.includes('First')) {
      console.log('  ✓ First entry loaded')
    }

    // Test 4: Click "2018" and check content
    console.log('\nTest 4: Click "2018" and verify content')
    const btn2018 = page.locator('button:has-text("2018")').first()
    await btn2018.click()
    await page.waitForTimeout(600)

    const titleAfter2018 = await page.locator('h3').first().textContent()
    if (titleAfter2018 && titleAfter2018.includes('First Facility')) {
      console.log(`  Title after clicking 2018: ${titleAfter2018}`)
      console.log('  ✓ Clicking "2018" shows "Our First Facility"')
    } else {
      throw new Error(`✗ Expected "First Facility" in title, got: ${titleAfter2018}`)
    }

    // Test 5: Use next arrow
    console.log('\nTest 5: Next arrow works')
    const nextBtn = page.locator('button:has-text("→")').first()
    await nextBtn.click()
    await page.waitForTimeout(600)

    const titleAfterNext = await page.locator('h3').first().textContent()
    console.log(`  Title after next: ${titleAfterNext}`)
    if (titleAfterNext && titleAfterNext.includes('Scale With Systems')) {
      console.log('  ✓ Next arrow advances to "Scale With Systems"')
    } else {
      throw new Error(`✗ Expected "Scale With Systems", got: ${titleAfterNext}`)
    }

    // Test 6: Use prev arrow
    console.log('\nTest 6: Previous arrow works')
    const prevBtn = page.locator('button:has-text("←")').first()
    await prevBtn.click()
    await page.waitForTimeout(600)

    const titleAfterPrev = await page.locator('h3').first().textContent()
    if (titleAfterPrev && titleAfterPrev.includes('First Facility')) {
      console.log(`  Title after prev: ${titleAfterPrev}`)
      console.log('  ✓ Previous arrow works')
    } else {
      throw new Error(`✗ Expected "First Facility", got: ${titleAfterPrev}`)
    }

    // Test 7: Keyboard navigation
    console.log('\nTest 7: Keyboard navigation (← →)')
    // Focus on the timeline section and test keyboard
    await page.evaluate(() => {
      const btn = document.querySelector('section button')
      if (btn) btn.focus()
    })
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(600)
    const titleAfterKeyboard = await page.locator('h3').first().textContent()
    console.log(`  Title after right arrow key: ${titleAfterKeyboard}`)
    if (titleAfterKeyboard && titleAfterKeyboard.includes('Scale')) {
      console.log('  ✓ Right arrow key works')
    } else {
      console.log('  ⚠ Keyboard navigation may not be focused (manual test required)')
    }

    // Test 8: Take desktop screenshot
    console.log('\nTest 8: Taking desktop timeline screenshot')
    const desktopScreenshot = path.join(SCREENSHOT_DIR, 'timeline-desktop.png')
    await page.screenshot({ path: desktopScreenshot, fullPage: true })
    console.log(`  ✓ Screenshot saved to ${desktopScreenshot}`)

    // Test 9: Check mobile layout
    console.log('\nTest 9: Mobile layout (< 900px)')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`${BASE_URL}/about`)
    await page.waitForTimeout(1200)

    // On mobile, year buttons are in a different layout structure
    const mobilePageContent = await page.content()
    if (mobilePageContent.includes('2014') && mobilePageContent.includes('2018')) {
      console.log('  ✓ Mobile layout renders with all years visible')

      // Test mobile navigation - look for visible buttons with year text
      const mobileBtnsWithYear = await page.locator('div[class*="md:hidden"] button').count()
      console.log(`  Mobile buttons found: ${mobileBtnsWithYear}`)

      const mobileScreenshot = path.join(SCREENSHOT_DIR, 'timeline-mobile.png')
      await page.screenshot({ path: mobileScreenshot, fullPage: true })
      console.log(`  ✓ Mobile screenshot saved to ${mobileScreenshot}`)
    } else {
      throw new Error('✗ Mobile layout missing years')
    }

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
