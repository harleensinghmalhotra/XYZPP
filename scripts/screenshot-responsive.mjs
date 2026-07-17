import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(__dirname, '..', 'shots', 'nav-fix');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const BASE_URL = 'http://localhost:5173';

  // Check 1280px
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 743 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(shotsDir, '1280.png') });
    console.log('✓ 1280px screenshot saved');
    await context.close();
  }

  // Check 1920px
  {
    const context = await browser.newContext({ viewport: { width: 1920, height: 743 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(shotsDir, '1920.png') });
    console.log('✓ 1920px screenshot saved');
    await context.close();
  }

  // Check mobile (768px) for hamburger
  {
    const context = await browser.newContext({ viewport: { width: 768, height: 600 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Check if nav is hidden and mobile menu works
    const nav = page.locator('nav.lg\\:flex');
    const isHidden = await nav.evaluate(el => window.getComputedStyle(el).display === 'none');
    console.log(`✓ Mobile nav hidden at 768px: ${isHidden}`);

    await page.screenshot({ path: path.join(shotsDir, '768-mobile.png') });
    console.log('✓ 768px (mobile) screenshot saved');
    await context.close();
  }

  await browser.close();
  console.log('\n✓ Responsive checks complete');
})().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
