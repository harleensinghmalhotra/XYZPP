// Intelligent dedup: downscale each raw frame to small grayscale, compute
// mean-absolute-pixel-difference vs the last KEPT frame (accumulates slow drift
// so gradual animations still register). Keep if diff >= THRESHOLD.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, '_raw');
const OUT = path.join(__dirname, '_kept');
const FPS = 3;
const W = 48, H = 27; // small grayscale grid
const THRESHOLD = parseFloat(process.argv[2] || '2.6');

function ts(idx1) { // 1-based frame -> mm-ss of video
  const t = (idx1 - 1) / FPS;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2,'0')}-${String(s).padStart(2,'0')}`;
}

(async () => {
  const files = fs.readdirSync(RAW).filter(f => f.endsWith('.jpg')).sort();
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const bufs = [];
  for (const f of files) {
    const g = await sharp(path.join(RAW, f)).greyscale().resize(W, H, { fit: 'fill' }).raw().toBuffer();
    bufs.push(g);
  }

  const diffs = [0];
  for (let i = 1; i < bufs.length; i++) {
    let s = 0;
    for (let p = 0; p < bufs[i].length; p++) s += Math.abs(bufs[i][p] - bufs[i-1][p]);
    diffs.push(s / bufs[i].length);
  }
  // distribution report (consecutive-frame diffs)
  const sorted = [...diffs].slice(1).sort((a,b)=>a-b);
  const pct = p => sorted[Math.floor((sorted.length-1)*p)].toFixed(2);
  console.log(`consecutive-diff percentiles: p10=${pct(.1)} p25=${pct(.25)} p50=${pct(.5)} p75=${pct(.75)} p90=${pct(.9)} p99=${pct(.99)} max=${sorted[sorted.length-1].toFixed(2)}`);

  // keep pass: compare against last KEPT buffer
  const manifest = [];
  let lastKept = null;
  let dropped = 0;
  for (let i = 0; i < files.length; i++) {
    let keep = false, d = 0;
    if (lastKept === null) { keep = true; }
    else {
      let s = 0;
      for (let p = 0; p < bufs[i].length; p++) s += Math.abs(bufs[i][p] - lastKept[p]);
      d = s / bufs[i].length;
      keep = d >= THRESHOLD;
    }
    if (keep) {
      lastKept = bufs[i];
      manifest.push({ raw: files[i], idx: i+1, t: ts(i+1), consecDiff: +diffs[i].toFixed(2), keptDiff: +d.toFixed(2) });
    } else dropped++;
  }
  fs.writeFileSync(path.join(__dirname, '_kept_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`THRESHOLD=${THRESHOLD}  raw=${files.length}  kept=${manifest.length}  dropped=${dropped}`);
})();
