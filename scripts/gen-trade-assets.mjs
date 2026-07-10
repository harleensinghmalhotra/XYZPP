// Generate the /trade-books gallery + lifestyle imagery for Phase 2.5 asset fill.
// Every frame composites a REAL treated photograph (QFP live asset or verified
// Pexels product/scene shot) onto a branded System-B studio backdrop, so the
// sticky gallery (object-fit:contain over #F0EBE0 beige) shows real books with
// NO white letterbox boxes and NO synthetic vector placeholders.
//
// Products (book covers, notebooks) → full colour. Reading / study scenes →
// warm brand duotone. The dark lifestyle break → navy brand duotone.
// Strict System B palette. Regenerates files IN PLACE at existing paths, so the
// JSX/CSS is untouched. Sources: public/qfp/live/*  and  .assetsrc/px-*.jpg
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'

const OUT = 'public/qfp/trade'
const LIVE = 'public/qfp/live'
const PX = '.assetsrc'
mkdirSync(OUT, { recursive: true })

const C = {
  cream: '#FDFAF4', beige: '#F0EBE0', paper2: '#E9E2D2',
  navy: '#0F2444', navy2: '#1B3A6B', slate: '#24344F', midnight: '#16203A',
  gold: '#9B7420', gold2: '#C89A3C', gold3: '#E6BD6A', ink: '#1C2019',
}

const W = 1200, H = 1500 // uniform 4:5 gallery frame

// warm brand duotone: grayscale→normalise then tint toward brand amber, keep detail.
const TINTS = { warm: { r: 150, g: 110, b: 50 }, navy: { r: 47, g: 88, b: 150 } }
async function duotone(buf, tone) {
  const t = TINTS[tone] || TINTS.warm
  return sharp(buf).removeAlpha().normalise().linear(1.04, -5)
    .modulate({ brightness: tone === 'warm' ? 1.02 : 0.94 }).tint(t)
}

// studio backdrop: cream→beige sweep + soft top spotlight (matches .tb-stage #F0EBE0)
function backdropSVG(w, h) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C.cream}"/>
          <stop offset="54%" stop-color="${C.beige}"/>
          <stop offset="100%" stop-color="${C.paper2}"/>
        </linearGradient>
        <radialGradient id="spot" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stop-color="#fffef9" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#fffef9" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)"/>
      <rect width="${w}" height="${h}" fill="url(#spot)"/>
    </svg>`,
  )
}

// grain + vignette overlay, printed on top of the composite
function grainSVG(w, h) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/></filter>
        <radialGradient id="vig" cx="50%" cy="44%" r="74%">
          <stop offset="0%" stop-color="#000" stop-opacity="0"/>
          <stop offset="76%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#0F2444" stop-opacity="0.15"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" filter="url(#gr)" opacity="0.05"/>
      <rect width="${w}" height="${h}" fill="url(#vig)"/>
    </svg>`,
  )
}

// rounded-rect alpha mask + drop-shadow card at a given box
function cardMaskSVG(cw, ch, r = 26) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">
      <rect x="0" y="0" width="${cw}" height="${ch}" rx="${r}" ry="${r}" fill="#fff"/>
    </svg>`,
  )
}
function cardShadowSVG(w, h, box, r = 26) {
  const { left, top, cw, ch } = box
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><filter id="sh" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="26"/></filter></defs>
      <rect x="${left}" y="${top + 20}" width="${cw}" height="${ch}" rx="${r}"
        fill="#0F2444" opacity="0.24" filter="url(#sh)"/>
    </svg>`,
  )
}

// place a source photo as a centred, rounded, shadowed card on the studio backdrop.
// coverW/coverH = fraction of frame the card occupies. tone: 'none' | 'warm'.
async function studioCard(srcPath, { coverW = 0.78, coverH = 0.66, tone = 'none', r = 26 } = {}) {
  const cw = Math.round(W * coverW)
  const ch = Math.round(H * coverH)
  const left = Math.round((W - cw) / 2)
  const top = Math.round((H - ch) / 2)

  let photo = sharp(srcPath).resize({ width: cw, height: ch, fit: 'cover', position: 'attention' })
  if (tone !== 'none') photo = await duotone(await photo.toBuffer(), tone)
  const mask = await cardMaskSVG(cw, ch, r).toString ? cardMaskSVG(cw, ch, r) : cardMaskSVG(cw, ch, r)
  const carded = await sharp(await photo.png().toBuffer())
    .composite([{ input: cardMaskSVG(cw, ch, r), blend: 'dest-in' }])
    .png().toBuffer()

  return sharp(backdropSVG(W, H))
    .composite([
      { input: cardShadowSVG(W, H, { left, top, cw, ch, r }), top: 0, left: 0 },
      { input: carded, top, left },
      { input: grainSVG(W, H), top: 0, left: 0 },
    ])
    .webp({ quality: 88 })
    .toBuffer()
}

// ── slot → source map ────────────────────────────────────────────────────────
// QFP live product photos (full colour) + verified Pexels (products full colour,
// reading/study scenes warm duotone). Every category's 3 slots are distinct.
const q = (n) => `${LIVE}/${n}.webp`
const p = (id) => `${PX}/px-${id}.jpg`

const SLOTS = {
  'coffee-table': [
    { src: q('37-11-3'), coverW: 0.86, coverH: 0.5 },              // photo coffee-table books
    { src: q('06-11-4'), coverW: 0.86, coverH: 0.6 },              // Monocle Book of Japan + spreads
    { src: q('39-11-2'), coverW: 0.86, coverH: 0.52 },             // open landscape spread
  ],
  notebooks: [
    { src: q('36-whatsapp-image-2025-04-07-at-12-14-13-52'), coverW: 0.86, coverH: 0.56 }, // notebooks trio
    { src: p(6373305), coverW: 0.66, coverH: 0.74 },               // blank hardcover on wood
    { src: p(1226398), coverW: 0.84, coverH: 0.56 },               // spiral notebook
  ],
  diaries: [
    { src: p(1925536), coverW: 0.84, coverH: 0.6, tone: 'warm' },  // writing in journal
    { src: p(606539), coverW: 0.84, coverH: 0.6, tone: 'warm' },   // open diary + pen
    { src: p(46274), coverW: 0.78, coverH: 0.64, tone: 'warm' },   // fanned pages, warm
  ],
  calendars: [
    { src: q('39-11-2'), coverW: 0.88, coverH: 0.5 },              // landscape spread
    { src: p(1226398), coverW: 0.84, coverH: 0.56 },               // grid page
    { src: p(6373305), coverW: 0.66, coverH: 0.74 },               // hardcover block
  ],
  autobiographies: [
    { src: p(762687), coverW: 0.82, coverH: 0.58, tone: 'warm' },  // old open book
    { src: p(3059748), coverW: 0.84, coverH: 0.62, tone: 'warm' }, // writing / study
    { src: p(46274), coverW: 0.78, coverH: 0.64, tone: 'warm' },   // fanned pages
  ],
  novels: [
    { src: p(46274), coverW: 0.78, coverH: 0.64, tone: 'warm' },   // open book
    { src: p(762687), coverW: 0.82, coverH: 0.58, tone: 'warm' },  // pages
    { src: p(2465877), coverW: 0.86, coverH: 0.6, tone: 'warm' },  // reading a novel
  ],
}

for (const [key, slots] of Object.entries(SLOTS)) {
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    if (!existsSync(s.src)) { console.error('MISSING SRC', s.src); process.exit(1) }
    const buf = await studioCard(s.src, s)
    const name = `${key}-0${i + 1}`
    await sharp(buf).toFile(`${OUT}/${name}.webp`)
    console.log('✓', name, '←', s.src.split('/').pop())
  }
}

// ── lifestyle full-bleed — navy-duotone library scene ────────────────────────
{
  const w = 2400, h = 1040
  const base = await duotone(await sharp(p(1319854)).resize({ width: w, height: h, fit: 'cover', position: 'attention' }).toBuffer(), 'navy')
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <linearGradient id="lb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0a1220" stop-opacity="0.30"/>
          <stop offset="55%" stop-color="#0f2444" stop-opacity="0.42"/>
          <stop offset="100%" stop-color="#0a1220" stop-opacity="0.70"/>
        </linearGradient>
        <radialGradient id="rim" cx="74%" cy="26%" r="55%">
          <stop offset="0%" stop-color="#c89a3c" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#c89a3c" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#lb)"/>
      <rect width="${w}" height="${h}" fill="url(#rim)"/>
    </svg>`,
  )
  await sharp(await base.png().toBuffer())
    .composite([{ input: overlay, top: 0, left: 0 }])
    .webp({ quality: 86 })
    .toFile(`${OUT}/lifestyle.webp`)
  console.log('✓ lifestyle ← px-1319854 (navy duotone library)')
}

console.log('done')
