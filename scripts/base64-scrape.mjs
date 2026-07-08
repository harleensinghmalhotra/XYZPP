import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://alternativinc.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // let images fully paint

  console.log("Extracting base64...");
  
  const b64_cover = await page.evaluate(() => {
    const img = document.querySelector('.hero-section_graph-details3');
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
  });

  const b64_pages = await page.evaluate(() => {
    const img = document.querySelector('.hero-section_graph-details4');
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
  });

  if (b64_cover) fs.writeFileSync('assets/hero/book-cover.png', Buffer.from(b64_cover, 'base64'));
  if (b64_pages) fs.writeFileSync('assets/hero/book-pages.png', Buffer.from(b64_pages, 'base64'));

  console.log("Images extracted via canvas API!");
  await browser.close();
})();
