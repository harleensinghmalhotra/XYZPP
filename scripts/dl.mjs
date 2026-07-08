import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const dl = async (url, dest) => {
    return new Promise(async (resolve) => {
      page.on('response', async (res) => {
        if (res.url() === url && res.status() === 200) {
          const buffer = await res.body();
          fs.writeFileSync(dest, buffer);
          console.log("Downloaded:", dest);
          resolve();
        }
      });
      await page.goto(url);
    });
  };

  await dl("https://cdn.prod.website-files.com/632b67171587d4389caa1723/6373bde1e7eec824c08cdbe2_Hero-BookCover.webp", "assets/hero/book-cover.webp");
  await dl("https://cdn.prod.website-files.com/632b67171587d4389caa1723/637482ea7c55490ffbe32c71_Hero-InnerPages.webp", "assets/hero/book-pages.webp");
  
  await browser.close();
})();
