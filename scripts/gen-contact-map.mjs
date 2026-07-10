// One-off: renders public/qfp/contact/map.webp — a static, styled, navy-duotone
// map placeholder (NO live Google Maps iframe → cookieless-safe). Two gold
// location pins mark Vashi (Head Office) and Taloja (Main Factory). Purely
// decorative geography; the real "Open in Google Maps" link carries the truth.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const W = 1600, H = 820
const NAVY = '#0F2444', NAVY2 = '#12294C', NAVY3 = '#1B3A6B'
const GOLD = '#C89A3C', GOLD2 = '#9B7420'

// deterministic PRNG so the render is stable across runs
let seed = 20260710
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }

// faint duotone dot-grid texture
let dots = ''
for (let y = 40; y < H; y += 34) {
  for (let x = 40; x < W; x += 34) {
    const jx = x + (rnd() - 0.5) * 8, jy = y + (rnd() - 0.5) * 8
    const o = (0.05 + rnd() * 0.06).toFixed(3)
    dots += `<circle cx="${jx.toFixed(1)}" cy="${jy.toFixed(1)}" r="1.5" fill="#8fb0e0" opacity="${o}"/>`
  }
}

// abstract "landmass" blocks (lighter navy) with gold coastline strokes
const land = `
  <path d="M-40 300 C 260 250 360 360 520 350 C 700 338 760 210 980 250
           C 1180 286 1240 430 1460 400 C 1560 386 1640 430 1700 410 L 1700 900 L -40 900 Z"
        fill="${NAVY3}" opacity="0.55"/>
  <path d="M-40 300 C 260 250 360 360 520 350 C 700 338 760 210 980 250
           C 1180 286 1240 430 1460 400 C 1560 386 1640 430 1700 410"
        fill="none" stroke="${GOLD2}" stroke-width="1.4" opacity="0.35"/>
  <path d="M120 620 C 360 560 520 640 700 600 C 900 556 1020 660 1240 616 C 1400 585 1520 640 1660 610"
        fill="none" stroke="${GOLD2}" stroke-width="1" opacity="0.22"/>
`

// thin road network (gold-tinted hairlines)
const roads = `
  <g fill="none" stroke="${GOLD}" stroke-opacity="0.16" stroke-width="1.6">
    <path d="M460 720 C 500 560 560 520 600 470 C 660 400 700 380 760 330"/>
    <path d="M760 330 C 900 300 1000 360 1120 300 C 1180 270 1220 250 1300 240"/>
    <path d="M180 420 C 320 440 420 470 600 470"/>
    <path d="M600 470 C 700 520 820 540 980 560 C 1120 578 1220 540 1360 560"/>
  </g>
`

// a location pin: teardrop + inner dot + soft halo, anchored at (x,y) tip
const pin = (x, y, label, sub) => {
  const r = 26
  return `
  <g>
    <circle cx="${x}" cy="${y}" r="72" fill="${GOLD}" opacity="0.10"/>
    <circle cx="${x}" cy="${y}" r="44" fill="${GOLD}" opacity="0.14"/>
    <g transform="translate(${x} ${y - 66})">
      <path d="M0 66 C -22 34 -${r} 18 -${r} -6 A ${r} ${r} 0 1 1 ${r} -6 C ${r} 18 22 34 0 66 Z"
            fill="${GOLD}" stroke="#FDFAF4" stroke-width="2.5"/>
      <circle cx="0" cy="-6" r="9" fill="${NAVY}"/>
    </g>
    <g font-family="'DM Mono','Courier New',monospace" text-anchor="middle">
      <text x="${x}" y="${y + 34}" font-size="27" font-weight="600" fill="#FDFAF4" letter-spacing="1.5">${label}</text>
      <text x="${x}" y="${y + 60}" font-size="17" fill="${GOLD}" letter-spacing="2">${sub}</text>
    </g>
  </g>`
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="52%" cy="34%" r="85%">
      <stop offset="0%" stop-color="${NAVY2}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="72%">
      <stop offset="62%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${dots}
  ${land}
  ${roads}
  ${pin(560, 470, 'VASHI', 'HEAD OFFICE')}
  ${pin(1150, 300, 'TALOJA', 'MAIN FACTORY')}
  <line x1="586" y1="450" x2="1124" y2="320" stroke="${GOLD}" stroke-width="1.4" stroke-dasharray="3 8" opacity="0.4"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`

mkdirSync('public/qfp/contact', { recursive: true })
await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile('public/qfp/contact/map.webp')
console.log('wrote public/qfp/contact/map.webp', W + 'x' + H)
