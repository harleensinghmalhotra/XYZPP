import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const DIR = 'public/qfp/about'
mkdirSync(DIR, { recursive: true })

// Elegant navy brand plate. These are DROP-IN PLACEHOLDERS at the exact final
// paths — Harry overwrites each .webp in place with the real photo, zero code
// changes. Navy #0F2444 base, warm gold bloom, a faint registration mark, and a
// hairline gold frame so an un-filled slot still reads as intentional art
// direction (never a broken/empty box).
function plate(w, h, label) {
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.13
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <radialGradient id="bloom" cx="58%" cy="34%" r="80%">
          <stop offset="0%" stop-color="#1B3A6B"/>
          <stop offset="55%" stop-color="#122A4C"/>
          <stop offset="100%" stop-color="#0F2444"/>
        </radialGradient>
        <radialGradient id="gold" cx="60%" cy="26%" r="55%">
          <stop offset="0%" stop-color="#C89A3C" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#C89A3C" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bloom)"/>
      <rect width="${w}" height="${h}" fill="url(#gold)"/>
      <rect x="14" y="14" width="${w - 28}" height="${h - 28}" fill="none" stroke="#C89A3C" stroke-opacity="0.28" stroke-width="1.5"/>
      <g stroke="#C89A3C" stroke-opacity="0.5" stroke-width="1.4" fill="none">
        <circle cx="${cx}" cy="${cy}" r="${r}"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.42}"/>
        <line x1="${cx}" y1="${cy - r * 1.5}" x2="${cx}" y2="${cy + r * 1.5}"/>
        <line x1="${cx - r * 1.5}" y1="${cy}" x2="${cx + r * 1.5}" y2="${cy}"/>
      </g>
      <text x="${cx}" y="${h - 34}" text-anchor="middle" font-family="'DM Mono', monospace"
            font-size="${Math.round(Math.min(w, h) * 0.032)}" letter-spacing="4"
            fill="#FDFAF4" fill-opacity="0.5">${label}</text>
    </svg>`)
}

const jobs = [
  ['founder.webp', 760, 920, 'PORTRAIT · DROP-IN'],
  ['story.webp', 1280, 860, 'FACILITY · TALOJA'],
  ['people-01.webp', 640, 640, 'OUR PEOPLE 01'],
  ['people-02.webp', 640, 640, 'OUR PEOPLE 02'],
  ['people-03.webp', 640, 640, 'OUR PEOPLE 03'],
  ['people-04.webp', 640, 640, 'OUR PEOPLE 04'],
]

for (const [name, w, h, label] of jobs) {
  await sharp(plate(w, h, label)).webp({ quality: 88 }).toFile(`${DIR}/${name}`)
  console.log('wrote', `${DIR}/${name}`)
}
