import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://alternativinc.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000); 

  try {
    const styles = await page.evaluate(() => {
      const getStyles = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, col: s.color, font: s.fontFamily, size: s.fontSize, lw: s.letterSpacing, fw: s.fontWeight };
      };
      
      return {
        body: getStyles(document.body),
        h1: getStyles(document.querySelector('h1')),
        h1span1: document.querySelector('h1')?.childNodes[0] ? getStyles(document.querySelector('h1').childNodes[0].parentElement) : null,
        seal: getStyles(document.querySelector('.hero-section_symbol-wrapper') || document.querySelector('[class*="symbol"]')),
        btn1: getStyles(document.querySelectorAll('a')[0]),
        btn2: getStyles(document.querySelectorAll('a')[1]),
      };
    });
    console.log("STYLES:", styles);
  } catch(e) { console.log(e); }

  console.log("Downloading cover...");
  const downloadImg = await page.evaluate(async (url) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return Array.from(new Uint8Array(buf));
  }, "https://cdn.prod.website-files.com/632b67171587d4389caa1723/6373bde1e7eec824c08cdbe2_Hero-BookCover.webp");
  
  fs.writeFileSync('assets/hero/book-cover.webp', Buffer.from(downloadImg));
  
  console.log("Downloading pages...");
  const downloadPages = await page.evaluate(async (url) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return Array.from(new Uint8Array(buf));
  }, "https://cdn.prod.website-files.com/632b67171587d4389caa1723/637482ea7c55490ffbe32c71_Hero-InnerPages.webp");

  fs.writeFileSync('assets/hero/book-pages.webp', Buffer.from(downloadPages));

  await browser.close();
})();
