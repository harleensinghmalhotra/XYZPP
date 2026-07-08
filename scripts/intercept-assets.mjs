import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('Hero-BookCover.webp')) {
      const buffer = await response.body();
      fs.writeFileSync('assets/hero/book-cover.webp', buffer);
      console.log('Saved book-cover.webp');
    }
    if (url.includes('Hero-InnerPages.webp')) {
      const buffer = await response.body();
      fs.writeFileSync('assets/hero/book-pages.webp', buffer);
      console.log('Saved book-pages.webp');
    }
    if (url.includes('alternativ_logo')) { // or whatever their logo is
       const buffer = await response.body();
       fs.writeFileSync('assets/hero/logo.svg', buffer);
    }
  });

  await page.goto('https://alternativinc.com', { waitUntil: 'networkidle' });
  await browser.close();
  console.log("Assets extraction complete via network interception.");
})();
