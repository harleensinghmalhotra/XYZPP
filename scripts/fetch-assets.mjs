import https from 'https';
import fs from 'fs';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://alternativinc.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve); 
      });
    }).on('error', (err) => { 
      fs.unlink(dest, () => reject(err)); 
    });
  });
};

(async () => {
  try {
    await download('https://cdn.prod.website-files.com/632b67171587d4389caa1723/6373bde1e7eec824c08cdbe2_Hero-BookCover.webp', 'assets/hero/book-cover.webp');
    console.log('Downloaded book-cover.webp');
    await download('https://cdn.prod.website-files.com/632b67171587d4389caa1723/637482ea7c55490ffbe32c71_Hero-InnerPages.webp', 'assets/hero/book-pages.webp');
    console.log('Downloaded book-pages.webp');
  } catch(e) {
    console.error('Error downloading:', e);
  }
})();
