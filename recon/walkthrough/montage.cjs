// Build labeled contact sheets from _kept frames for fast visual review.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '_kept');
const SHEETS = path.join(__dirname, '_sheets');
const m = JSON.parse(fs.readFileSync(path.join(__dirname, '_kept_manifest.json')));

const COLS = 6, ROWS = 4, TW = 300, TH = 161, LBL = 20;
const CW = TW, CH = TH + LBL;
const perSheet = COLS * ROWS;

(async () => {
  if (!fs.existsSync(SHEETS)) fs.mkdirSync(SHEETS, { recursive: true });
  fs.readdirSync(SHEETS).forEach(f => fs.unlinkSync(path.join(SHEETS, f)));
  const nSheets = Math.ceil(m.length / perSheet);
  for (let s = 0; s < nSheets; s++) {
    const slice = m.slice(s * perSheet, (s + 1) * perSheet);
    const composites = [];
    for (let i = 0; i < slice.length; i++) {
      const e = slice[i];
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = col * CW, y = row * CH;
      const thumb = await sharp(path.join(OUT, e.kept)).resize(TW, TH, { fit: 'fill' }).jpeg().toBuffer();
      const label = `#${e.idx}  ${e.kept.replace('.jpg','')}`;
      const svg = Buffer.from(
        `<svg width="${TW}" height="${LBL}"><rect width="100%" height="100%" fill="#111"/>` +
        `<text x="4" y="15" font-family="monospace" font-size="13" fill="#0f0">${label}</text></svg>`);
      composites.push({ input: thumb, left: x, top: y });
      composites.push({ input: svg, left: x, top: y + TH });
    }
    const sheetW = COLS * CW, sheetH = ROWS * CH;
    await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#000' } })
      .composite(composites).jpeg({ quality: 80 })
      .toFile(path.join(SHEETS, `sheet_${String(s).padStart(2,'0')}.jpg`));
    console.log(`sheet_${String(s).padStart(2,'0')}.jpg : frames ${slice[0].kept} .. ${slice[slice.length-1].kept}`);
  }
})();
