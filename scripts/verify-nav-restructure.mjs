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
    console.log('🔍 Verifying navigation restructure...\n')

    // Test 1: Navigation shows POD as standalone item
    console.log('Test 1: POD is standalone nav item')
    await page.goto(`${BASE_URL}/`)
    await page.waitForTimeout(800)

    const navButtons = await page.locator('nav .qnav-link').allTextContents()
    console.log('  Nav items:', navButtons)

    const hasPODInNav = navButtons.some(text => text.includes('Print on Demand'))
    if (hasPODInNav) {
      console.log('  ✓ Print on Demand found in top-level nav')
    } else {
      throw new Error('✗ Print on Demand NOT in top-level nav')
    }

    // Test 2: Dropdown has exactly 9 items
    console.log('\nTest 2: Dropdown has 9 items')

    // Find the What We Print button and hover directly on it
    const whatWePrintBtn = page.locator('nav button:has-text("What We Print")')
    await whatWePrintBtn.hover()
    await page.waitForTimeout(800)

    // Wait for dropdown to appear
    await page.waitForSelector('#wwp-dropdown', { timeout: 5000 })

    const dropdownItems = await page.locator('#wwp-dropdown button[role="menuitem"]').count()
    console.log(`  Dropdown items count: ${dropdownItems}`)
    if (dropdownItems === 9) {
      console.log('  ✓ Dropdown has exactly 9 items')
    } else {
      throw new Error(`✗ Expected 9 items, got ${dropdownItems}`)
    }

    const dropdownTexts = await page.locator('#wwp-dropdown button[role="menuitem"]').allTextContents()
    console.log('  Dropdown items:')
    dropdownTexts.forEach((text, idx) => console.log(`    ${idx + 1}. ${text}`))

    // Test 3: Verify all items are NOT "Print on Demand"
    if (dropdownTexts.some(text => text.includes('Print on Demand'))) {
      throw new Error('✗ Print on Demand should NOT be in dropdown')
    } else {
      console.log('  ✓ Print on Demand is NOT in dropdown')
    }

    // Test 4: Clicking "Trade Books" in dropdown navigates to homepage
    console.log('\nTest 4: Dropdown items anchor to homepage WWP cards')

    const whatWePrintBtn2 = page.locator('nav button:has-text("What We Print")')
    await whatWePrintBtn2.hover()
    await page.waitForTimeout(500)

    const tradeBtn = page.locator('#wwp-dropdown button:has-text("Trade Books")')
    await tradeBtn.click()
    await page.waitForTimeout(800)

    const urlAfterClick = page.url()
    if (urlAfterClick.includes('/#wwp-coffee')) {
      console.log(`  ✓ Trade Books navigates to homepage with #wwp-coffee anchor`)
    } else {
      throw new Error(`✗ Expected URL to contain #wwp-coffee, got ${urlAfterClick}`)
    }

    // Test 5: Visiting /educational-books redirects to homepage
    console.log('\nTest 5: /educational-books redirects to homepage anchor')
    await page.goto(`${BASE_URL}/educational-books`)
    await page.waitForTimeout(800)

    const educationalUrl = page.url()
    if (educationalUrl.includes('/#wwp-educational')) {
      console.log(`  ✓ /educational-books redirects to /#wwp-educational`)
    } else {
      throw new Error(`✗ Expected redirect to /#wwp-educational, got ${educationalUrl}`)
    }

    // Test 6: Visiting /trade-books redirects to homepage
    console.log('\nTest 6: /trade-books redirects to homepage anchor')
    await page.goto(`${BASE_URL}/trade-books`)
    await page.waitForTimeout(800)

    const tradeUrl = page.url()
    if (tradeUrl.includes('/#wwp-trade')) {
      console.log(`  ✓ /trade-books redirects to /#wwp-trade`)
    } else {
      throw new Error(`✗ Expected redirect to /#wwp-trade, got ${tradeUrl}`)
    }

    // Test 7: /print-on-demand page still loads
    console.log('\nTest 7: /print-on-demand page loads')
    await page.goto(`${BASE_URL}/print-on-demand`)
    await page.waitForTimeout(800)

    const podUrl = page.url()
    if (podUrl.includes('/print-on-demand')) {
      console.log(`  ✓ /print-on-demand page loads`)
    } else {
      throw new Error(`✗ /print-on-demand page failed to load`)
    }

    // Test 8: Take screenshot of nav for visual verification
    console.log('\nTest 8: Taking nav screenshot')
    await page.goto(`${BASE_URL}/`)
    await page.waitForTimeout(800)

    const navScreenshot = path.join(SCREENSHOT_DIR, 'nav-restructure.png')
    await page.screenshot({ path: navScreenshot, fullPage: false })
    console.log(`  ✓ Screenshot saved to ${navScreenshot}`)

    // Test 9: Keyboard navigation test
    console.log('\nTest 9: Keyboard navigation works')
    await page.goto(`${BASE_URL}/`)
    await page.waitForTimeout(500)

    const whatWePrintBtn3 = page.locator('nav button:has-text("What We Print")')
    await whatWePrintBtn3.focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    const isDropdownOpen = await page.locator('#wwp-dropdown').isVisible()
    if (isDropdownOpen) {
      console.log('  ✓ Dropdown opens with Enter key')
    } else {
      throw new Error('✗ Keyboard navigation failed')
    }

    // Close dropdown
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

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
