import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const assets = new Set();
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('.webp') || url.includes('.png') || url.includes('.jpg') || url.includes('.mp4') || url.includes('.webm')) {
      assets.add(url);
    }
  });

  console.log("Navigating...");
  try {
    await page.goto('https://alternativinc.com', { waitUntil: 'load', timeout: 20000 });
  } catch (e) {
    console.log("Navigation timeout, but proceeding with parsed elements");
  }

  // wait an extra 2 seconds for JS assets
  await page.waitForTimeout(2000);

  const locators = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('img, video, source'));
    return els.map(e => ({
      tag: e.tagName,
      src: e.src || e.currentSrc,
      className: e.className
    }));
  });
  
  const bgImages = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    return els.map(e => {
       const bg = window.getComputedStyle(e).backgroundImage;
       if (bg && bg !== 'none') return bg;
       return null;
    }).filter(Boolean);
  });
  
  console.log("--- FOUND ASSET URLS FROM NETWORK ---");
  for (const url of assets) {
    if (url.includes('book') || url.includes('hero') || url.includes('graph')) {
      console.log("POSSIBLE ASSET:", url);
    } else {
      console.log(url);
    }
  }

  console.log("\n--- DOM ASSETS (IMG, VIDEO) ---");
  console.log(JSON.stringify(locators, null, 2));
  
  console.log("\n--- CSS BG IMAGES ---");
  console.log([...new Set(bgImages)]);
  
  await browser.close();
})();
