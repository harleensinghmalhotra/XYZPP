const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const load = f => JSON.parse(fs.readFileSync(path.join(ROOT, f, '_frames.json')));
const tt = t => t.replace('-', ':'); // 00-41 -> 00:41

// Per-frame descriptions. Keyed by "<folder>/<file>". A folder may also supply a
// fn(row,i,rows) fallback for frames not explicitly keyed.
const D = {};

// ---------- 01-loading ----------
D['01-loading'] = {
  fn: () => 'blank / preloader state',
  map: {
    '000_t00-09': 'First load — blank deep-navy page, browser chrome only (page assets loading).',
    '001_t00-20': 'Still loading — blank navy, no content painted yet.',
    '002_t00-57': 'PRELOADER SEAL — "alt." wordmark (green dot) ringed by rotating "printing stories" text, centred on navy gradient.',
    '003_t00-57': 'Seal begins to clear / fade before first paint.',
    '004_t00-58': 'FIRST PAINT — "PRINTING STORIES" hero fades up faintly from the dark.',
    '005_t02-13': 'SECOND LOAD (mid-walkthrough reload) — page blanks back to navy.',
    '006_t02-24': 'Second preloader — the "alt." rotating seal shows again.',
    '007_t02-25': 'Second load resolving — coloured section filter pills peek in at top as the seal clears.',
  },
};

// ---------- 02-hero-resting ----------
D['02-hero-resting'] = {
  fn: () => 'Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom.',
  map: {
    '000_t00-00': 'Initial capture — hero fully at rest (pre-reload): nav, "PRINTING STORIES", book peeking at bottom.',
    '001_t00-58': 'Hero settling in after first paint — headline still muted.',
    '007_t01-00': 'Full rest — nav (alternativ · Our expertise / Our approach / About us / Ask for a quote · En · MENU), circular "printing stories" mark in the "O".',
    '012_t01-07': 'Rested, colours settled: PRINTING (green) / STORIES (pale blue), tagline + "Our expertise →" CTA + SCROLL button, book asleep at bottom.',
  },
};

// ---------- 03-hero-scroll ----------
D['03-hero-scroll'] = {
  fn: (r,i) => `Hero scroll frame ${i} — book/element choreography in flight.`,
  map: {
    '000_t01-15': 'REST (reference) — headline + tagline present, book low at bottom.',
    '001_t01-16': '▶ TEXT EXIT — "PRINTING STORIES" has left; empty navy, book still low.',
    '002_t01-16': 'Text gone, book still at rest position (pre-rise hold).',
    '003_t01-16': 'Text gone, book still low.',
    '004_t01-17': '▶ BOOK RISE BEGINS — open book starts translating up; giant faded "PRINTING STORIES" bleed text appears behind it.',
    '005_t01-17': 'Book rising, bleed text stronger behind.',
    '006_t01-17': 'Book rising further up the viewport.',
    '007_t01-17': 'Book near full rise, blank white pages.',
    '008_t01-18': 'Book risen; faded PRINTING/STORIES bleed fills background.',
    '009_t01-18': '▶ FIRST ELEMENTS — tiny characters appear on the pages at scale≈0 (a figure, a pink blob).',
    '010_t01-19': 'Elements growing — more characters scaling in, staggered.',
    '011_t01-19': 'Elements larger, rotation visible as they scale up.',
    '012_t01-19': 'Burst building — chef w/ speech bubble, girl in bed, monsters emerging.',
    '013_t01-20': 'Burst — Asterix/Obelix, pink & teal monsters, dessert cart scaling toward full size.',
    '014_t01-20': 'Burst near peak — most creatures at full scale, sparkle stars on right.',
    '015_t01-20': '▶ BURST PEAK — full illustrated scene bursting from the open book.',
    '016_t01-21': 'Peak burst held — all characters full-size on the spread.',
    '017_t01-21': 'Peak burst, elements at rest on the book.',
    '018_t01-21': 'Burst fully settled on the spread.',
    '019_t01-22': 'Scene settled; scroll about to advance past the book.',
    '020_t01-22': 'Book scene fully formed, beginning to move off.',
    '021_t01-22': 'Book/elements starting to recede upward.',
    '022_t01-23': '▶ BLEED / CROSSFADE — book fades out; "PRINTING SERVICES" heading rises into view (section handoff).',
    '023_t01-23': 'Crossfade — "PRINTING" visible, services layout forming underneath.',
    '024_t01-23': '"PRINTING SERVICES" heading resolved — hero hands off to Services.',
  },
};

// ---------- 04-services ----------
D['04-services'] = {
  fn: () => 'Services — "PRINTING SERVICES" heading + product category grid.',
  map: {
    '000_t01-23': 'Handoff from hero — book/elements sliding off, "PRINTING" heading crossfading in.',
    '001_t01-23': '"PRINTING SERVICES" heading appears with intro copy.',
    '005_t01-25': '"PRINTING SERVICES" + paragraph; first product photos slide up.',
    '010_t01-27': 'Category grid forming — Book Printing / Bag Printing / Packaging Printing / Toys.',
    '015_t01-30': 'Four category columns with product photography (books, printed bags, boxes, plush toy).',
    '023_t01-35': 'Services grid fully settled — 4 labelled categories with imagery.',
  },
};

// ---------- 05-portfolio ----------
D['05-portfolio'] = {
  fn: () => '"Some of our creations" — colourful portfolio grid of printed projects.',
  map: {
    '000_t01-35': 'Section handoff — "Some of our creations" heading rises in.',
    '005_t01-40': 'Portfolio grid building — red / green / blue project cards (book covers & creations).',
    '015_t01-46': 'Dense grid of creation cards scrolling past (children\'s books, printed pieces).',
    '025_t02-00': 'More rows of colourful project cards continue scrolling.',
    '035_t02-07': 'End of portfolio — last creation cards before Certifications.',
  },
};

// ---------- 06-certifications ----------
D['06-certifications'] = {
  fn: () => 'Certifications — cream section, logos + descriptive text, rotating seal.',
  map: {
    '000_t02-07': 'Entry — coloured filter pills at top; "Certifications: a guarantee of excellence" heading appears on cream.',
    '003_t02-26': 'Brief dark wipe as the (reloaded) certifications section resolves.',
    '004_t02-26': '"Certifications: a guarantee of excellence" heading + intro + rotating seal (top-right).',
    '015_t02-32': 'Scrolling bodies — FSC (Forest Stewardship Council) / PEFC logos + paragraphs.',
    '022_t02-36': 'Disney (The Walt Disney Company) + SMETA / Sedex certifications.',
    '029_t02-40': 'Ethical Printing program + further bodies, carousel dots at bottom.',
    '036_t02-44': 'ISO + final certification bodies before the next section.',
  },
};

// ---------- 07-story-about ----------
D['07-story-about'] = {
  fn: () => 'About narrative.',
  map: {
    '000_t02-45': '7A transition — cream certifications below, dark "WHAT SETS US APART" section rising with a curved top edge.',
    '002_t02-46': '7A "WHAT SETS US APART" heading emerges on dark navy (curved reveal).',
    '005_t02-47': '7A value cards building — Turnkey service / Effective communication.',
    '009_t02-54': '7A four value cards: Turnkey service, Effective communication, Fair price, Social responsibility (icons + copy).',
    '012_t02-55': '7A fully settled, green pill CTA at bottom.',
    '013_t02-57': '▶ 7B "ALTERNATIV: A STORY TO TELL" begins — dark section, image of printing work on left.',
    '015_t02-58': '7B story section — heading + paragraph, photo of hands working with prints.',
    '020_t02-59': '7B "A STORY TO TELL" with "Learn more about us" link, fully settled.',
    '023_t03-00': '7B end — story section holds before footer.',
  },
};

// ---------- 08-footer-contact ----------
D['08-footer-contact'] = {
  fn: () => 'Footer / contact.',
  map: {
    '000_t03-01': 'Footer transition — dark section curves, footer content forming.',
    '003_t03-01': 'Footer resolving — "alt." logo, contact block appearing.',
    '004_t03-04': 'FOOTER — info@alternativinc.com, Sitemap / Services / International Printing Services columns, newsletter form.',
    '005_t03-04': 'Footer full — "Subscribe to our newsletter" (First name / Last name / e-mail) + certification logo row.',
    '007_t03-10': 'Footer at rest (end of walkthrough) — full contact + newsletter + certifications strip.',
  },
};

const FOLDERS = [
  ['01-loading','Loading / preloader'],
  ['02-hero-resting','Hero at rest'],
  ['03-hero-scroll','Hero scroll choreography'],
  ['04-services','Services'],
  ['05-portfolio','Portfolio — "Some of our creations"'],
  ['06-certifications','Certifications'],
  ['07-story-about','About — "What sets us apart" + "A story to tell"'],
  ['08-footer-contact','Footer / contact'],
  ['09-interactions','Interactions'],
  ['10-mobile','Mobile / responsive'],
];

let md = '';
md += '# ALTERNATIVINC.COM — Walkthrough Screenshot Reference Library\n\n';
md += '**Source:** `ALTERNATIVINC.COM Walkthrough.mp4` (project root)  \n';
md += '**Video:** 3:14.61 · 1920×1032 · ~36.7 fps (60 tbr) · h264/aac. Capture includes Brave browser chrome (~top 100px); the site itself starts just below the toolbar.\n\n';
md += '## Method\n';
md += '- **Pass A — raw extraction:** ffmpeg @ 3 fps → `_raw/` = **584 frames** (permanent archive, never deleted).\n';
md += '- **Pass B — intelligent dedup:** each frame downscaled to 48×27 greyscale (sharp), mean-absolute-pixel-diff vs the last *kept* frame (accumulates slow drift so gradual animations still register). Threshold 1.5 → **162 kept**, 422 dropped. Consecutive-diff percentiles: p50 0.06, p75 1.83, p90 11.68, p99 48.55, max 184.7.\n';
md += '- **Classification:** every kept frame was viewed (contact sheets + full-res on transitions) and copied from `_raw/` into the folders below. `03-hero-scroll` is deliberately *denser* — it holds **every** raw frame across the exit→rise→burst→bleed window (raw #228–252), not just deduped ones.\n';
md += '- Frames are named `NN_tMM-SS.jpg` (sequence index + video timestamp) so order and video position are always recoverable. Each folder has a `_frames.json` manifest.\n\n';

// folder tree with counts
md += '## Folder tree\n```\nrecon/walkthrough/\n';
md += '  _raw/                 584  (archive — do not delete)\n';
md += '  _kept/                162  (deduped, sequential)\n';
md += '  _sheets/                   (contact sheets for review)\n';
for (const [f,label] of FOLDERS) {
  let n = 0; try { n = load(f).length; } catch(e){}
  md += `  ${(f+'/').padEnd(22)}${String(n).padStart(3)}  ${label}\n`;
}
md += '```\n\n';

// hero transition flags
md += '## ⚑ Hero phase-transition frames (exact)\n';
md += '| Phase transition | Frame | Video time | Evidence |\n|---|---|---|---|\n';
md += '| Rest (last) | `03-hero-scroll/000_t01-15.jpg` | 01:15 | Headline + tagline present, book low |\n';
md += '| **Text starts exiting** | `03-hero-scroll/001_t01-16.jpg` | 01:16 | "PRINTING STORIES" gone, book still low |\n';
md += '| **Book starts rising** | `03-hero-scroll/004_t01-17.jpg` | 01:17 | Book translates up; faded bleed text appears behind |\n';
md += '| **First element appears** | `03-hero-scroll/009_t01-18.jpg` | 01:18 | Tiny characters born at scale≈0 on the pages |\n';
md += '| **Burst peak** | `03-hero-scroll/015_t01-20.jpg` | 01:20 | Full illustrated scene bursting from the book |\n';
md += '| **Bleed crosses into Services** | `03-hero-scroll/022_t01-23.jpg` | 01:23 | Book crossfades out, "PRINTING SERVICES" rises |\n\n';

// per-folder tables
for (const [f,label] of FOLDERS) {
  md += `## ${f} — ${label}\n`;
  let rows;
  try { rows = load(f); } catch(e){ rows = []; }
  if (!rows.length) {
    if (f === '09-interactions') md += '_No discrete interactions (menu-open, hover, modal, click) were captured — this walkthrough is a continuous top-to-bottom scroll-through. The `MENU` button and nav hovers exist in the resting hero (see 02) but were never actuated on camera._\n\n';
    else if (f === '10-mobile') md += '_No mobile/responsive views appear in the recording — the entire walkthrough is the 1920-wide desktop layout._\n\n';
    else md += '_(empty)_\n\n';
    continue;
  }
  const desc = D[f] || { fn: ()=> '', map:{} };
  md += '| # | Frame | Time | raw | Description |\n|---|---|---|---|---|\n';
  rows.forEach((r,i) => {
    const key = r.file.replace('.jpg','');
    const d = (desc.map && desc.map[key]) || desc.fn(r,i,rows);
    md += `| ${i} | \`${r.file}\` | ${tt(r.t)} | #${r.rawIdx} | ${d} |\n`;
  });
  md += '\n';
}

fs.writeFileSync(path.join(ROOT, 'CATALOG.md'), md);
console.log('CATALOG.md written,', md.length, 'chars');
