// Generate navy-duotone warehouse/logistics imagery for /fulfilment.
// Strict System B palette — navy ground, cream light, gold rim. Fully offline,
// on-brand, uniform framing so cards/rows keep equal heights. Same sharp+SVG
// pipeline as gen-trade-assets. Paths are exact drop-ins — a real photo can later
// replace any file with ZERO code change.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const OUT = 'public/qfp/fulfil'
mkdirSync(OUT, { recursive: true })

const C = {
  deep: '#0A1220', navy: '#0F2444', navy2: '#1B3A6B', slate: '#24344F',
  midnight: '#16203A', steel: '#2E4straggler',
  cream: '#FDFAF4', beige: '#F0EBE0',
  gold: '#9B7420', gold2: '#C89A3C', gold3: '#E6BD6A', ink: '#1C2019',
}
C.steel = '#33496E'

// ── shared atmosphere ───────────────────────────────────────────────────────
const defs = `
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.midnight}"/>
    <stop offset="100%" stop-color="${C.deep}"/>
  </linearGradient>
  <linearGradient id="airbg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.navy2}"/>
    <stop offset="46%" stop-color="${C.navy}"/>
    <stop offset="100%" stop-color="${C.deep}"/>
  </linearGradient>
  <radialGradient id="rim" cx="72%" cy="26%" r="66%">
    <stop offset="0%" stop-color="${C.gold2}" stop-opacity="0.24"/>
    <stop offset="60%" stop-color="${C.gold2}" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="${C.gold2}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="spot" cx="50%" cy="16%" r="70%">
    <stop offset="0%" stop-color="#dfe8f5" stop-opacity="0.16"/>
    <stop offset="100%" stop-color="#dfe8f5" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="46%" r="72%">
    <stop offset="0%" stop-color="#000" stop-opacity="0"/>
    <stop offset="72%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="${C.deep}" stop-opacity="0.55"/>
  </radialGradient>
  <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>`

const atmos = (w, h) => `
  <rect width="${w}" height="${h}" fill="url(#spot)"/>
  <rect width="${w}" height="${h}" fill="url(#rim)"/>
  <rect width="${w}" height="${h}" filter="url(#gr)" opacity="0.05"/>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>`

const tone = (i) => [C.navy, C.navy2, C.slate, C.midnight, C.steel][i % 5]

// ── primitives ──────────────────────────────────────────────────────────────
// corrugated carton, front + top flap peek. tape strip in gold at low alpha.
function carton(x, y, w, h, t = C.navy2, gold = false) {
  const lid = h * 0.16
  return `
  <g>
    <path d="M${x} ${y + lid} L${x + w * 0.5} ${y} L${x + w} ${y + lid} L${x + w * 0.5} ${y + lid * 2} Z" fill="${t}" opacity="0.9"/>
    <rect x="${x}" y="${y + lid}" width="${w}" height="${h}" fill="${t}"/>
    <rect x="${x}" y="${y + lid}" width="${w}" height="${h}" fill="#000" opacity="0.14"/>
    <rect x="${x + w * 0.5 - w * 0.02}" y="${y + lid}" width="${w * 0.04}" height="${h}" fill="${gold ? C.gold : '#000'}" opacity="${gold ? 0.5 : 0.22}"/>
    <line x1="${x}" y1="${y + lid + h * 0.5}" x2="${x + w}" y2="${y + lid + h * 0.5}" stroke="${C.deep}" stroke-width="1.5" opacity="0.4"/>
  </g>`
}

// shipping container with corrugations + doors
function container(x, y, w, h, t = C.navy2) {
  const ribs = Math.max(6, Math.round(w / 26))
  let r = ''
  for (let i = 1; i < ribs; i++) {
    const rx = x + (w / ribs) * i
    r += `<line x1="${rx}" y1="${y}" x2="${rx}" y2="${y + h}" stroke="${C.deep}" stroke-width="2" opacity="0.34"/>`
  }
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${t}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.14}" fill="#fff" opacity="0.05"/>
    ${r}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="${C.deep}" stroke-width="2" opacity="0.5"/>
  </g>`
}

// pallet-racking bay: uprights + 3 beams carrying pallet loads
function rackBay(x, y, w, h, t) {
  const post = Math.max(6, w * 0.03)
  const levels = 3
  let out = `<rect x="${x}" y="${y}" width="${post}" height="${h}" fill="${C.deep}"/>
             <rect x="${x + w - post}" y="${y}" width="${post}" height="${h}" fill="${C.deep}"/>`
  for (let l = 0; l < levels; l++) {
    const by = y + (h / levels) * l + h / levels - 8
    out += `<rect x="${x}" y="${by}" width="${w}" height="7" fill="${C.gold}" opacity="0.5"/>`
    // two pallet loads per shelf
    const pw = (w - post * 2) * 0.42
    for (let p = 0; p < 2; p++) {
      const px = x + post + p * (pw + (w - post * 2 - pw * 2)) + 6
      const ph = h / levels * 0.6
      out += carton(px, by - ph, pw, ph * 0.82, tone(l + p + 1))
    }
  }
  return out
}

// delivery box-truck silhouette, cab to the right
function truck(x, base, s = 1, t = C.navy2) {
  const bw = 260 * s, bh = 150 * s, cab = 92 * s
  const y = base - bh
  return `
  <g>
    <ellipse cx="${x + (bw + cab) / 2}" cy="${base + 10}" rx="${(bw + cab) * 0.56}" ry="${16 * s}" fill="${C.deep}" opacity="0.6" filter="url(#soft)"/>
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" fill="${t}"/>
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="#000" opacity="0.12"/>
    <rect x="${x + bw * 0.16}" y="${y + bh * 0.2}" width="${bw * 0.68}" height="${bh * 0.5}" rx="4" fill="none" stroke="${C.gold}" stroke-width="${2 * s}" opacity="0.6"/>
    <path d="M${x + bw} ${y} h${cab * 0.5} q${cab * 0.5} 0 ${cab * 0.5} ${cab * 0.5} v${bh - cab * 0.5} h${-cab} Z" fill="${C.slate}"/>
    <path d="M${x + bw + 8} ${y + 10} h${cab * 0.42} q${cab * 0.36} 2 ${cab * 0.4} ${cab * 0.42} l${-cab * 0.06} ${bh * 0.28} h${-cab * 0.4} Z" fill="${C.navy2}" opacity="0.8"/>
    <circle cx="${x + bw * 0.28}" cy="${base}" r="${26 * s}" fill="${C.deep}"/><circle cx="${x + bw * 0.28}" cy="${base}" r="${11 * s}" fill="${C.steel}"/>
    <circle cx="${x + bw + cab * 0.5}" cy="${base}" r="${26 * s}" fill="${C.deep}"/><circle cx="${x + bw + cab * 0.5}" cy="${base}" r="${11 * s}" fill="${C.steel}"/>
  </g>`
}

// overhead light strips receding for warehouse ceilings
function ceilingLights(w, cx, rows) {
  let out = ''
  for (let i = 0; i < rows; i++) {
    const t = i / rows
    const ly = 40 + t * 150
    const half = (w * 0.5) * (0.3 + t * 0.7)
    out += `<rect x="${cx - half}" y="${ly}" width="${half * 2}" height="${4 + t * 6}" rx="4" fill="#cfe0f5" opacity="${0.10 + t * 0.14}"/>`
  }
  return out
}

// scattered world dots (shipping reach)
function worldDots(w, h, n) {
  let out = ''
  const seed = [13, 29, 47, 71, 89, 101, 131, 157, 179, 199, 223, 241]
  for (let i = 0; i < n; i++) {
    const rx = ((seed[i % seed.length] * (i + 3)) % 100) / 100 * w
    const ry = (((seed[(i + 4) % seed.length]) * (i + 7)) % 100) / 100 * h * 0.7 + h * 0.12
    const r = 2 + (i % 3)
    out += `<circle cx="${rx.toFixed(0)}" cy="${ry.toFixed(0)}" r="${r}" fill="${C.gold2}" opacity="${0.25 + (i % 4) * 0.12}"/>`
  }
  return out
}

function svg(w, h, body, bg = 'url(#airbg)') {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>${defs}</defs>
      <rect width="${w}" height="${h}" fill="${bg}"/>
      ${body}
      ${atmos(w, h)}
    </svg>`,
  )
}

// receding warehouse corridor: two rack walls + perspective floor + ceiling light
function warehouseCorridor(w, h) {
  const cx = w * 0.5
  const floorY = h * 0.62
  const bays = 4
  let left = '', right = ''
  for (let i = 0; i < bays; i++) {
    const t = i / bays
    const bw = w * (0.28 - t * 0.16)
    const bh = h * (0.5 - t * 0.16)
    const gap = (cx - 20) * t
    const lx = 20 + gap
    left += rackBay(lx, floorY - bh, bw * (1 - t * 0.2), bh, tone(i))
    const rx = w - 20 - gap - bw * (1 - t * 0.2)
    right += rackBay(rx, floorY - bh, bw * (1 - t * 0.2), bh, tone(i + 1))
  }
  return `
    <rect x="0" y="${floorY}" width="${w}" height="${h - floorY}" fill="url(#floor)"/>
    <polygon points="0,${floorY} ${w},${floorY} ${cx + 60},${floorY - 4} ${cx - 60},${floorY - 4}" fill="${C.deep}" opacity="0.5"/>
    ${ceilingLights(w, cx, 6)}
    <path d="M${cx - 40} ${floorY} L${cx - w * 0.34} ${h} M${cx + 40} ${floorY} L${cx + w * 0.34} ${h}" stroke="${C.gold}" stroke-width="2" opacity="0.14"/>
    ${right}${left}
    <ellipse cx="${cx}" cy="${floorY + 6}" rx="${w * 0.3}" ry="14" fill="${C.gold2}" opacity="0.06" filter="url(#soft)"/>`
}

// ── jobs ────────────────────────────────────────────────────────────────────
const jobs = []

// HERO POSTER 16:9 — warehouse corridor, cinematic, room for H1 (kept low-detail up top)
jobs.push(['hero-poster', svg(2400, 1350, warehouseCorridor(2400, 1350)), 2400, 1350])

// CARD 01 — Kitting & Assembly: conveyor + travelling cartons (4:5 tall)
{
  const w = 1200, h = 1500
  const beltY = h * 0.6
  let boxes = ''
  for (let i = 0; i < 4; i++) {
    const bw = 150, bh = 140
    boxes += carton(120 + i * 250, beltY - bh - (i % 2) * 20, bw, bh, tone(i + 1), i === 1)
  }
  const body = `
    <rect x="60" y="${beltY}" width="${w - 120}" height="44" rx="8" fill="${C.slate}"/>
    <rect x="60" y="${beltY + 44}" width="${w - 120}" height="16" fill="${C.deep}"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${90 + i * 120}" y="${beltY + 8}" width="60" height="28" rx="3" fill="${C.deep}" opacity="0.5"/>`).join('')}
    ${boxes}
    <g stroke="${C.gold2}" stroke-width="3" fill="none" opacity="0.5">
      <path d="M980 ${beltY - 260} q120 40 120 160"/><path d="M1080 ${beltY - 120} l24 20 20 -26"/>
    </g>
    <circle cx="300" cy="${beltY - 360}" r="70" fill="none" stroke="${C.gold}" stroke-width="4" opacity="0.4"/>`
  jobs.push(['card-01', svg(w, h, body), w, h])
}

// CARD 02 — Warehousing & Storage: tall racking wall (4:5)
{
  const w = 1200, h = 1500
  const body = `
    <rect x="0" y="${h * 0.86}" width="${w}" height="${h * 0.14}" fill="url(#floor)"/>
    ${rackBay(90, 150, 460, h * 0.72, C.navy)}
    ${rackBay(650, 150, 460, h * 0.72, C.navy2)}
    ${ceilingLights(w, w * 0.5, 4)}`
  jobs.push(['card-02', svg(w, h, body), w, h])
}

// CARD 03 — Last-Mile Delivery: truck on road with route dots (4:5)
{
  const w = 1200, h = 1500
  const base = h * 0.7
  const body = `
    <rect x="0" y="${base}" width="${w}" height="${h - base}" fill="url(#floor)"/>
    <path d="M0 ${base} H${w}" stroke="${C.gold}" stroke-width="3" opacity="0.4" stroke-dasharray="30 26"/>
    ${worldDots(w, h * 0.5, 10)}
    ${truck(360, base, 1.7, C.navy2)}
    <path d="M120 ${base + 90} H${w - 120}" stroke="${C.gold2}" stroke-width="4" opacity="0.3" stroke-dasharray="4 22" stroke-linecap="round"/>`
  jobs.push(['card-03', svg(w, h, body), w, h])
}

// FEATURE 01 — The Warehouse (4:3)
jobs.push(['feature-01', svg(1600, 1200, warehouseCorridor(1600, 1200)), 1600, 1200])

// FEATURE 02 — Kitting & Assembly (4:3): dual conveyors + kit trays
{
  const w = 1600, h = 1200
  const y1 = 470, y2 = 820
  const belt = (yy, tint) => `
    <rect x="120" y="${yy}" width="${w - 240}" height="52" rx="8" fill="${C.slate}"/>
    <rect x="120" y="${yy + 52}" width="${w - 240}" height="16" fill="${C.deep}"/>
    ${Array.from({ length: 5 }, (_, i) => carton(200 + i * 250, yy - 130, 140, 130, tone(i + tint), i === 2)).join('')}`
  jobs.push(['feature-02', svg(w, h, `${belt(y1, 1)}${belt(y2, 3)}
    <g stroke="${C.gold2}" stroke-width="3" fill="none" opacity="0.45"><path d="M1250 300 q120 40 120 150"/></g>`), w, h])
}

// FEATURE 03 — In-House Packaging (4:3): carton stack + 5-colour ink bars + die-cut
{
  const w = 1600, h = 1200
  const base = 980
  let stack = ''
  const rows = [[3, 260], [2, 220], [1, 200]]
  let yy = base
  rows.forEach(([n, bh], ri) => {
    yy -= bh + 10
    for (let i = 0; i < n; i++) {
      stack += carton(220 + i * 260 + ri * 40, yy, 240, bh - 20, tone(ri + i + 1), ri === 0 && i === 1)
    }
  })
  const inks = ['#00AEEF', '#EC008C', '#FFC800', C.navy, C.gold2]
  const bars = inks.map((c, i) => `<rect x="${1120 + i * 74}" y="220" width="60" height="360" rx="6" fill="${c}" opacity="0.9"/>
    <rect x="${1120 + i * 74}" y="220" width="60" height="360" rx="6" fill="${C.deep}" opacity="0.25"/>`).join('')
  jobs.push(['feature-03', svg(w, h, `
    <rect x="0" y="${base}" width="${w}" height="${h - base}" fill="url(#floor)"/>
    ${stack}${bars}
    <text x="1150" y="180" font-family="monospace" font-size="26" fill="${C.gold3}" opacity="0.7">5-COLOUR</text>`), w, h])
}

// FEATURE 04 — Global Shipping (4:3): container yard + crane + ship + world dots
{
  const w = 1600, h = 1200
  const base = 900
  let yard = ''
  const grid = [[6, 0], [5, 1], [3, 2]]
  let yy = base
  grid.forEach(([n, lvl]) => {
    yy -= 120
    for (let i = 0; i < n; i++) yard += container(180 + i * 210 + lvl * 40, yy, 190, 110, tone(i + lvl))
  })
  const crane = `
    <rect x="1180" y="200" width="14" height="640" fill="${C.deep}"/>
    <rect x="1180" y="200" width="360" height="14" fill="${C.deep}"/>
    <line x1="1420" y1="214" x2="1420" y2="440" stroke="${C.gold}" stroke-width="3" opacity="0.6"/>
    ${container(1360, 440, 130, 80, C.navy2)}`
  const ship = `<path d="M120 ${base + 60} h1360 l-90 120 h-1180 Z" fill="${C.midnight}"/>
    <rect x="120" y="${base + 60}" width="1360" height="20" fill="${C.deep}"/>`
  jobs.push(['feature-04', svg(w, h, `
    ${worldDots(w, h * 0.4, 14)}
    ${crane}${yard}${ship}
    <rect x="0" y="${base + 180}" width="${w}" height="${h - base - 180}" fill="url(#floor)"/>`), w, h])
}

// JOURNEY BAND 2400×1000 — press → road → port horizon (full-bleed, scrim added in CSS)
{
  const w = 2400, h = 1000
  const base = h * 0.72
  // left: warehouse block, mid: truck on road, right: container yard + crane + ship
  let yard = ''
  ;[[5, 0], [4, 1], [2, 2]].forEach(([n, lvl]) => {
    const yy = base - 110 - lvl * 108
    for (let i = 0; i < n; i++) yard += container(1720 + i * 128 + lvl * 30, yy, 116, 92, tone(i + lvl))
  })
  const body = `
    <rect x="0" y="${base}" width="${w}" height="${h - base}" fill="url(#floor)"/>
    ${worldDots(w, h * 0.42, 16)}
    <!-- connecting dotted route across the band -->
    <path d="M120 ${base - 20} H${w - 120}" stroke="${C.gold2}" stroke-width="4" opacity="0.28" stroke-dasharray="4 26" stroke-linecap="round"/>
    <!-- left: warehouse/press block -->
    ${rackBay(120, base - 320, 360, 320, C.navy)}
    <!-- mid: truck -->
    ${truck(1000, base, 1.5, C.navy2)}
    <!-- right: port -->
    <rect x="1660" y="200" width="14" height="${base - 200}" fill="${C.deep}"/>
    <rect x="1660" y="200" width="300" height="14" fill="${C.deep}"/>
    ${yard}
    <path d="M1560 ${base + 40} h740 l-70 90 h-670 Z" fill="${C.midnight}"/>`
  jobs.push(['journey', svg(w, h, body), w, h])
}

for (const [name, buf, w, h] of jobs) {
  await sharp(buf).resize(w, h).webp({ quality: 86 }).toFile(`${OUT}/${name}.webp`)
  console.log('✓', name, `${w}×${h}`)
}
console.log('done —', jobs.length, 'assets →', OUT)
