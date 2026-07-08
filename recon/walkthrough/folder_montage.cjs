// Contact sheet for one library folder (verify classification/order).
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const folder = process.argv[2];
const dir = path.join(__dirname, folder);
const rows = JSON.parse(fs.readFileSync(path.join(dir, '_frames.json')));
const COLS = 5, TW = 340, TH = 183, LBL = 20, CW = TW, CH = TH + LBL;
(async () => {
  const ROWS = Math.ceil(rows.length / COLS);
  const comps = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], col = i % COLS, row = Math.floor(i / COLS);
    const x = col*CW, y = row*CH;
    const thumb = await sharp(path.join(dir, r.file)).resize(TW, TH, {fit:'fill'}).jpeg().toBuffer();
    const svg = Buffer.from(`<svg width="${TW}" height="${LBL}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="15" font-family="monospace" font-size="13" fill="#0f0">${r.file.replace('.jpg','')}  raw${r.rawIdx}</text></svg>`);
    comps.push({input:thumb,left:x,top:y},{input:svg,left:x,top:y+TH});
  }
  const out = path.join(__dirname, '_sheets', `folder_${folder}.jpg`);
  await sharp({create:{width:COLS*CW,height:ROWS*CH,channels:3,background:'#000'}}).composite(comps).jpeg({quality:82}).toFile(out);
  console.log('wrote', out, `(${rows.length} frames)`);
})();
