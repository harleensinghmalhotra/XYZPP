import fs from 'fs';
import https from 'https';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve); 
      });
    }).on('error', (err) => {
      fs.unlink(dest); 
      reject(err.message);
    });
  });
};

console.log("Downloading cover...");
await download("https://cdn.prod.website-files.com/632b67171587d4389caa1723/6373bde1e7eec824c08cdbe2_Hero-BookCover.webp", "assets/hero/book-cover.webp");

console.log("Downloading pages...");
await download("https://cdn.prod.website-files.com/632b67171587d4389caa1723/637482ea7c55490ffbe32c71_Hero-InnerPages.webp", "assets/hero/book-pages.webp");

console.log("Done!");
