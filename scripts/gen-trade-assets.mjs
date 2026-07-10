// Generate warm-duotone "studio" placeholder imagery for /trade-books.
// Strict System B palette — navy covers, cream pages, gold foil. No photography
// dependency, fully offline, on-brand. Gallery frames are a uniform 4:5 so the
// sticky gallery keeps uniform slot heights; the book inside varies orientation.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const OUT = 'public/qfp/trade'
mkdirSync(OUT, { recursive: true })

const C = {
  cream: '#FDFAF4', beige: '#F0EBE0', paper2: '#E9E2D2',
  navy: '#0F2444', navy2: '#1B3A6B', slate: '#24344F', midnight: '#16203A',
  leather: '#3A2C1A', leather2: '#4A3A22',
  gold: '#9B7420', gold2: '#C89A3C', gold3: '#E6BD6A', ink: '#1C2019',
}

// fine film grain + soft vignette, shared across every frame
const grain = (w, h) => `
  <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/></filter>
  <radialGradient id="vig" cx="50%" cy="44%" r="72%">
    <stop offset="0%" stop-color="#000" stop-opacity="0"/>
    <stop offset="78%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#0F2444" stop-opacity="0.16"/>
  </radialGradient>
  <rect width="${w}" height="${h}" filter="url(#gr)" opacity="0.05"/>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>`

// warm studio backdrop (cream sweep with a soft grounded floor)
const backdrop = (w, h) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.cream}"/>
      <stop offset="52%" stop-color="${C.beige}"/>
      <stop offset="100%" stop-color="${C.paper2}"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="38%" r="60%">
      <stop offset="0%" stop-color="#fffef9" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#fffef9" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#spot)"/>`

// grounded contact shadow under an object centred at (cx, base)
const shadow = (cx, base, rw, op = 0.28) => `
  <ellipse cx="${cx}" cy="${base}" rx="${rw}" ry="${rw * 0.16}" fill="#0F2444" opacity="${op}"
    filter="blur(18px)"/>`

// A 3/4-view hardcover book. cover tint from palette, gold foil furniture.
// x,y = top-left of the front face; w,h = face size; depth = spine thickness.
// motif differentiates the category silhouette (spiral calendar, elastic
// notebook, wrap-strap diary) so every colourway reads as its own product.
function book({ x, y, w, h, depth = 34, cover, foil = C.gold2, motif = 'crest', r = 6 }) {
  const pageEdge = C.cream
  const cx = x + w * 0.5

  // per-motif face furniture
  let face = ''
  if (motif === 'spiral') {
    // wall calendar: month grid + a hero image band; twin-loop wire binding on top
    face += `<rect x="${x + w * 0.1}" y="${y + h * 0.1}" width="${w * 0.8}" height="${h * 0.4}" rx="3" fill="${C.slate}" opacity="0.9"/>`
    face += `<g stroke="${foil}" stroke-width="1" opacity="0.6" fill="none">`
    for (let c = 0; c <= 7; c++) face += `<line x1="${x + w * 0.1 + (w * 0.8 / 7) * c}" y1="${y + h * 0.56}" x2="${x + w * 0.1 + (w * 0.8 / 7) * c}" y2="${y + h * 0.88}"/>`
    for (let rr = 0; rr <= 4; rr++) face += `<line x1="${x + w * 0.1}" y1="${y + h * 0.56 + (h * 0.32 / 4) * rr}" x2="${x + w * 0.9}" y2="${y + h * 0.56 + (h * 0.32 / 4) * rr}"/>`
    face += `</g>`
    face += `<g stroke="#8a8069" stroke-width="3" fill="none" opacity="0.9">`
    for (let s = 0; s < 9; s++) { const sx = x + w * 0.16 + (w * 0.68 / 8) * s; face += `<path d="M ${sx} ${y - 10} q 6 -14 12 0" />` }
    face += `</g>`
  } else if (motif === 'elastic') {
    // premium notebook: foil title bars + a vertical elastic band near the right edge + bottom ribbon
    face += `<rect x="${x + w * 0.14}" y="${y + h * 0.24}" width="${w * 0.5}" height="${Math.max(6, h * 0.03)}" rx="3" fill="${foil}"/>`
    face += `<rect x="${x + w * 0.14}" y="${y + h * 0.33}" width="${w * 0.34}" height="${Math.max(5, h * 0.022)}" rx="3" fill="${foil}" opacity="0.7"/>`
    face += `<rect x="${x + w * 0.8}" y="${y - 4}" width="${Math.max(10, w * 0.05)}" height="${h + 8}" rx="3" fill="#0a1220" opacity="0.85"/>`
    face += `<rect x="${x + w * 0.8}" y="${y - 4}" width="${Math.max(10, w * 0.05)}" height="${h + 8}" rx="3" fill="url(#cvlight)"/>`
    face += `<rect x="${cx - 6}" y="${y + h}" width="12" height="${h * 0.14}" rx="2" fill="${foil}"/>`
  } else if (motif === 'strap') {
    // leather diary: horizontal wrap strap + clasp button + blind-embossed frame
    face += `<rect x="${x + w * 0.14}" y="${y + h * 0.16}" width="${w * 0.72}" height="${h * 0.68}" rx="4" fill="none" stroke="${foil}" stroke-width="1.2" opacity="0.5"/>`
    face += `<rect x="${x + w * 0.28}" y="${y + h * 0.34}" width="${w * 0.44}" height="${Math.max(5, h * 0.02)}" rx="3" fill="${foil}" opacity="0.85"/>`
    face += `<rect x="${x - depth - 6}" y="${y + h * 0.56}" width="${w + depth + 30}" height="${Math.max(20, h * 0.11)}" fill="${cover}"/>`
    face += `<rect x="${x - depth - 6}" y="${y + h * 0.56}" width="${w + depth + 30}" height="${Math.max(20, h * 0.11)}" fill="#000" opacity="0.22"/>`
    face += `<circle cx="${x + w + 18}" cy="${y + h * 0.615}" r="${Math.max(7, w * 0.03)}" fill="${foil}"/>`
    face += `<circle cx="${x + w + 18}" cy="${y + h * 0.615}" r="${Math.max(3, w * 0.012)}" fill="${cover}"/>`
  } else {
    // default crest: rule frame + title bars + emblem
    face += `<rect x="${x + w * 0.12}" y="${y + h * 0.14}" width="${w * 0.76}" height="${h * 0.72}" rx="3" fill="none" stroke="${foil}" stroke-width="1.4" opacity="0.85"/>`
    face += `<rect x="${x + w * 0.2}" y="${y + h * 0.3}" width="${w * 0.6}" height="${Math.max(6, h * 0.028)}" rx="3" fill="${foil}"/>`
    face += `<rect x="${x + w * 0.28}" y="${y + h * 0.4}" width="${w * 0.44}" height="${Math.max(5, h * 0.022)}" rx="3" fill="${foil}" opacity="0.7"/>`
    face += `<circle cx="${cx}" cy="${y + h * 0.64}" r="${Math.min(w, h) * 0.07}" fill="none" stroke="${foil}" stroke-width="1.4" opacity="0.8"/>`
    face += `<circle cx="${cx}" cy="${y + h * 0.64}" r="${Math.min(w, h) * 0.028}" fill="${foil}" opacity="0.8"/>`
  }

  return `
  <g>
    <rect x="${x + 8}" y="${y + 8}" width="${w}" height="${h}" rx="${r}" fill="${pageEdge}"/>
    <g opacity="0.5" stroke="#cbc3b1" stroke-width="1">
      ${Array.from({ length: 5 }, (_, i) => `<line x1="${x + w + 2}" y1="${y + 16 + i * 3}" x2="${x + w + 6}" y2="${y + 16 + i * 3}"/>`).join('')}
    </g>
    <path d="M ${x} ${y} l ${-depth} ${depth * 0.5} l 0 ${h} l ${depth} ${-depth * 0.5} z" fill="${cover}" opacity="0.82"/>
    <path d="M ${x} ${y} l ${-depth} ${depth * 0.5} l 0 ${h} l ${depth} ${-depth * 0.5} z" fill="#000" opacity="0.18"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${cover}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#cvlight)"/>
    ${face}
  </g>`
}

const coverLight = `
  <linearGradient id="cvlight" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
    <stop offset="42%" stop-color="#ffffff" stop-opacity="0.02"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.14"/>
  </linearGradient>`

// A stack of closed books seen from the front edge (page-fore-edges + spines).
function stack({ cx, base, n = 4, w = 620, tint }) {
  let out = ''
  let y = base
  const colors = tint
  for (let i = 0; i < n; i++) {
    const bw = w - i * 42
    const bh = 60 - i * 2
    const x = cx - bw / 2 + (i % 2 ? 16 : -12)
    y -= bh + 6
    out += `
      <g>
        <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="7" fill="${C.cream}"/>
        <rect x="${x}" y="${y}" width="${bw}" height="${bh * 0.5}" rx="7" fill="${colors[i % colors.length]}"/>
        <rect x="${x}" y="${y + bh * 0.42}" width="${bw}" height="${bh * 0.1}" fill="${C.gold2}" opacity="0.8"/>
        <g opacity="0.4" stroke="#c9c1af" stroke-width="1">
          ${Array.from({ length: 4 }, (_, k) => `<line x1="${x + 4}" y1="${y + bh * 0.6 + k * 3}" x2="${x + bw - 4}" y2="${y + bh * 0.6 + k * 3}"/>`).join('')}
        </g>
      </g>`
  }
  return out
}

// An open coffee-table spread (two facing pages, gutter shadow, imagery blocks).
function spread({ cx, cy, w = 900, h = 560, cover }) {
  const x = cx - w / 2, y = cy - h / 2
  return `
    <g>
      <rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" rx="8" fill="${cover}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>
      <rect x="${cx - 2}" y="${y}" width="4" height="${h}" fill="#0F2444" opacity="0.12"/>
      <rect x="${x + 40}" y="${y + 40}" width="${w * 0.36}" height="${h * 0.5}" rx="4" fill="${C.slate}" opacity="0.9"/>
      <rect x="${cx + 30}" y="${y + 40}" width="${w * 0.36}" height="${h * 0.28}" rx="4" fill="${C.navy2}" opacity="0.85"/>
      <rect x="${cx + 30}" y="${y + h * 0.5}" width="${w * 0.3}" height="8" rx="4" fill="${C.gold2}"/>
      <rect x="${cx + 30}" y="${y + h * 0.5 + 18}" width="${w * 0.24}" height="6" rx="3" fill="${C.ink}" opacity="0.35"/>
      <rect x="${x + 40}" y="${y + h * 0.5 + 30}" width="${w * 0.3}" height="6" rx="3" fill="${C.ink}" opacity="0.3"/>
    </g>`
}

const W = 1200, H = 1500 // uniform 4:5 gallery frame

// composition builders return the mid-layer svg (object) for a frame
function frame(inner, w = W, h = H) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>${coverLight}</defs>
      ${backdrop(w, h)}
      ${inner}
      ${grain(w, h)}
    </svg>`,
  )
}

// per-category cover tint + book proportions
const CATS = {
  'coffee-table': { cover: C.slate, land: true, motif: 'crest' },
  notebooks: { cover: C.navy, land: false, motif: 'elastic' },
  diaries: { cover: C.leather, foil: C.gold3, land: false, motif: 'strap' },
  calendars: { cover: C.navy2, land: true, motif: 'spiral' },
  autobiographies: { cover: C.midnight, land: false, motif: 'crest' },
  novels: { cover: C.navy, land: false, slim: true, motif: 'crest' },
}

const jobs = []
for (const [key, cfg] of Object.entries(CATS)) {
  const foil = cfg.foil || C.gold2
  // slot 01 — hero single book, centred
  {
    const land = cfg.land
    const w = land ? 760 : cfg.slim ? 520 : 620
    const h = land ? 560 : cfg.slim ? 780 : 760
    const x = (W - w) / 2 + 30, y = (H - h) / 2 - 40
    const inner = `${shadow(W / 2, y + h + 26, w * 0.62)}${book({ x, y, w, h, depth: land ? 30 : 40, cover: cfg.cover, foil, motif: cfg.motif })}`
    jobs.push([`${key}-01`, frame(inner)])
  }
  // slot 02 — macro detail: corner/foil close-up (cropped big book)
  {
    const inner = `${shadow(W / 2, 1180, 520)}${book({ x: 260, y: 240, w: 1000, h: 1080, depth: 60, cover: cfg.cover, foil, motif: cfg.motif })}`
    jobs.push([`${key}-02`, frame(inner)])
  }
  // slot 03 — stack or open spread
  {
    const inner = cfg.land
      ? `${shadow(W / 2, 980, 500)}${spread({ cx: W / 2, cy: H / 2, w: 900, h: 560, cover: cfg.cover })}`
      : `${shadow(W / 2, 1120, 360)}${stack({ cx: W / 2, base: 1120, n: 5, w: 700, tint: [C.navy, C.slate, C.leather2, C.navy2, C.midnight] })}`
    jobs.push([`${key}-03`, frame(inner)])
  }
}

// lifestyle full-bleed — navy duotone study scene (abstract shelf of books + warm rim)
{
  const w = 2400, h = 1040
  const shelf = Array.from({ length: 16 }, (_, i) => {
    const bx = 120 + i * 130 + (i % 3) * 8
    const bh = 300 + (i % 4) * 60
    const by = 720 - bh
    const tints = ['#12294c', '#1b3a6b', '#0f2444', '#24344f', '#16203a']
    return `<rect x="${bx}" y="${by}" width="96" height="${bh}" rx="4" fill="${tints[i % tints.length]}"/>
      <rect x="${bx}" y="${by + 30}" width="96" height="8" fill="${C.gold2}" opacity="0.5"/>`
  }).join('')
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="lb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a1220"/><stop offset="55%" stop-color="#0f2444"/><stop offset="100%" stop-color="#16203a"/>
      </linearGradient>
      <radialGradient id="rim" cx="72%" cy="30%" r="55%">
        <stop offset="0%" stop-color="#c89a3c" stop-opacity="0.22"/><stop offset="100%" stop-color="#c89a3c" stop-opacity="0"/>
      </radialGradient>
      <filter id="gr2"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#lb)"/>
    <rect x="80" y="720" width="${w - 160}" height="26" rx="6" fill="#0a1220"/>
    ${shelf}
    <rect width="${w}" height="${h}" fill="url(#rim)"/>
    <rect width="${w}" height="${h}" filter="url(#gr2)" opacity="0.05"/>
    <rect width="${w}" height="${h}" fill="#0a1220" opacity="0.18"/>
  </svg>`)
  jobs.push(['lifestyle', svg, w, h])
}

for (const [name, svg] of jobs) {
  await sharp(svg).webp({ quality: 88 }).toFile(`${OUT}/${name}.webp`)
  console.log('✓', name)
}
console.log('done', jobs.length, 'assets')
