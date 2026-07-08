// Classify kept frames into the folder library. Copies (never moves) from _raw
// so the archive stays intact. Names frames NN_tMM-SS.jpg within each folder.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const RAW = path.join(ROOT, '_raw');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, '_kept_manifest.json')));
const FPS = 3;

const rawName = idx => `f_${String(idx).padStart(4,'0')}.jpg`;
const tsOf = idx => { const t=(idx-1)/FPS; const m=Math.floor(t/60), s=Math.floor(t%60);
  return `${String(m).padStart(2,'0')}-${String(s).padStart(2,'0')}`; };
const rawByK = k => manifest[k].idx; // k-index -> raw idx

// folder -> array of raw indices (source frames, in video order)
const R = (a,b) => { const o=[]; for(let i=a;i<=b;i++) o.push(i); return o; };
const K = ks => ks.map(rawByK);

const plan = {
  '01-loading':        K([1,2,3,4,5]).concat(K([93,94,95])),
  '02-hero-resting':   K([0]).concat(K(R(6,17))),
  '03-hero-scroll':    R(228,252),                 // DENSE: every raw frame of exit->rise->burst->bleed
  '04-services':       K(R(30,53)),
  '05-portfolio':      K(R(54,89)),
  '06-certifications': K([90,91,92]).concat(K(R(96,129))),
  '07-story-about':    K(R(130,153)),              // 7A what-sets-apart + 7B a-story-to-tell
  '08-footer-contact': K(R(154,161)),
  '09-interactions':   [],                          // none discrete in this walkthrough
  '10-mobile':         [],                          // no mobile views recorded
};

const summary = {};
for (const [folder, idxs] of Object.entries(plan)) {
  const dir = path.join(ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.readdirSync(dir).filter(f=>f.endsWith('.png')||f.endsWith('.jpg')).forEach(f=>fs.unlinkSync(path.join(dir,f)));
  const uniq = [...new Set(idxs)].sort((a,b)=>a-b);
  const rows = [];
  uniq.forEach((idx, i) => {
    const src = path.join(RAW, rawName(idx));
    const t = tsOf(idx);
    const out = `${String(i).padStart(3,'0')}_t${t}.jpg`;
    fs.copyFileSync(src, path.join(dir, out));
    rows.push({ file: out, raw: rawName(idx), rawIdx: idx, t });
  });
  fs.writeFileSync(path.join(dir, '_frames.json'), JSON.stringify(rows, null, 2));
  summary[folder] = uniq.length;
}
console.log(JSON.stringify(summary, null, 2));
console.log('TOTAL classified frames:', Object.values(summary).reduce((a,b)=>a+b,0));
