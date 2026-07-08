// Placeholder asset generator for XYZ Printabilities.
// PNGs are rasterized from hand-authored SVG via sharp; MP4s via ffmpeg-static.
// Real assets replace these files in place later — filenames never change.
import sharp from 'sharp'
import { spawnSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import ffmpegPath from 'ffmpeg-static'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const A = (p) => resolve(root, 'assets', p)
for (const d of ['hero', 'elements', 'covers', 'videos']) mkdirSync(A(d), { recursive: true })

const INK = '#16130F'
const PAPER = '#F3EDE1'
const CYAN = '#00AEEF'
const MAGENTA = '#EC008C'
const YELLOW = '#FFC800'
const GOLD = '#C9A24B'
const KRAFT = '#A9814E'

const grain = (id, o = 0.05) =>
  `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="${o}"/></feComponentTransfer><feComposite operator="over" in2="SourceGraphic"/></filter>`

async function png(svg, out, w, h) {
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(A(out))
  console.log('  ✓', out)
}

// ---- HERO STILL (dark premium, 1920x1080) ---------------------------------
async function hero() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="g" cx="50%" cy="64%" r="75%">
      <stop offset="0%" stop-color="#1d2a2e"/>
      <stop offset="42%" stop-color="#14181a"/>
      <stop offset="100%" stop-color="#0c0d0c"/>
    </radialGradient>
    <linearGradient id="spine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#20161c"/><stop offset="100%" stop-color="#0e0b0d"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  <!-- a suggested book standing in gloom -->
  <g transform="translate(960 620)">
    <rect x="-215" y="-360" width="430" height="620" rx="8" fill="url(#spine)"/>
    <rect x="-215" y="-360" width="46" height="620" rx="8" fill="#000" opacity="0.35"/>
    <rect x="-150" y="-300" width="300" height="2" fill="${CYAN}" opacity="0.5"/>
    <rect x="-150" y="150" width="180" height="2" fill="${MAGENTA}" opacity="0.5"/>
    <circle cx="0" cy="-60" r="54" fill="none" stroke="${YELLOW}" stroke-width="1.5" opacity="0.4"/>
  </g>
</svg>`
  await png(svg, 'hero/book-hero.png', 1920, 1080)
}

// ---- FLOATING ELEMENTS (400x400 transparent, icon chips) ------------------
const chip = (bg, inner, shape = 'squircle') => {
  const bgShape =
    shape === 'circle'
      ? `<circle cx="200" cy="200" r="176" fill="${bg}"/>`
      : `<rect x="24" y="24" width="352" height="352" rx="96" fill="${bg}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000" flood-opacity="0.28"/></filter>
  <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.16"/><stop offset="55%" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <g filter="url(#s)">${bgShape}${shape === 'circle' ? '<circle cx="200" cy="200" r="176" fill="url(#sheen)"/>' : '<rect x="24" y="24" width="352" height="352" rx="96" fill="url(#sheen)"/>'}
  ${inner}</g></svg>`
}
const elements = {
  pencil: chip(
    YELLOW,
    `<g transform="rotate(-38 200 200)"><rect x="180" y="96" width="40" height="180" rx="6" fill="${INK}"/><rect x="180" y="96" width="40" height="30" fill="${MAGENTA}"/><path d="M180 276 L200 316 L220 276 Z" fill="${INK}"/><path d="M192 300 L200 316 L208 300 Z" fill="${PAPER}"/></g>`,
    'squircle',
  ),
  atlas: chip(
    CYAN,
    `<circle cx="200" cy="200" r="96" fill="none" stroke="${PAPER}" stroke-width="12"/><ellipse cx="200" cy="200" rx="42" ry="96" fill="none" stroke="${PAPER}" stroke-width="10"/><line x1="104" y1="200" x2="296" y2="200" stroke="${PAPER}" stroke-width="10"/><line x1="120" y1="156" x2="280" y2="156" stroke="${PAPER}" stroke-width="8"/><line x1="120" y1="244" x2="280" y2="244" stroke="${PAPER}" stroke-width="8"/>`,
    'circle',
  ),
  star: chip(
    MAGENTA,
    `<path d="M200 104 L228 172 L300 178 L245 226 L262 298 L200 260 L138 298 L155 226 L100 178 L172 172 Z" fill="${PAPER}"/><path d="M200 104 L228 172 L300 178 L245 226 L262 298 L200 260 Z" fill="${YELLOW}"/>`,
    'squircle',
  ),
  blocks: chip(
    PAPER,
    `<rect x="120" y="200" width="76" height="76" rx="12" fill="${CYAN}"/><rect x="204" y="200" width="76" height="76" rx="12" fill="${MAGENTA}"/><rect x="162" y="120" width="76" height="76" rx="12" fill="${YELLOW}"/><text x="200" y="172" font-family="Georgia, serif" font-size="52" font-weight="700" fill="${INK}" text-anchor="middle">A</text>`,
    'squircle',
  ),
  inkdrop: chip(
    INK,
    `<path d="M200 100 C245 170 268 210 268 244 a68 68 0 1 1 -136 0 C132 210 155 170 200 100 Z" fill="${CYAN}"/><ellipse cx="176" cy="238" rx="16" ry="26" fill="${PAPER}" opacity="0.55"/>`,
    'circle',
  ),
  ruler: chip(
    CYAN,
    `<g transform="rotate(-38 200 200)"><rect x="150" y="90" width="100" height="220" rx="8" fill="${PAPER}"/><rect x="150" y="90" width="100" height="220" rx="8" fill="none" stroke="${INK}" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="150" y1="${112 + i * 28}" x2="${i % 2 ? 186 : 200}" y2="${112 + i * 28}" stroke="${INK}" stroke-width="4"/>`).join('')}</g>`,
    'squircle',
  ),
  plane: chip(
    PAPER,
    `<path d="M112 200 L296 118 L232 296 L206 226 Z" fill="${MAGENTA}"/><path d="M206 226 L296 118 L232 296 Z" fill="${INK}" opacity="0.85"/><path d="M112 200 L296 118 L206 226 Z" fill="${MAGENTA}"/>`,
    'squircle',
  ),
  owl: chip(
    MAGENTA,
    `<circle cx="160" cy="182" r="46" fill="${YELLOW}"/><circle cx="240" cy="182" r="46" fill="${YELLOW}"/><circle cx="160" cy="182" r="18" fill="${INK}"/><circle cx="240" cy="182" r="18" fill="${INK}"/><path d="M186 214 L200 236 L214 214 Z" fill="${INK}"/><path d="M150 120 Q200 150 250 120" fill="none" stroke="${YELLOW}" stroke-width="10" stroke-linecap="round"/>`,
    'circle',
  ),
}

// ---- BOOK COVERS (600x800 portrait 3:4) -----------------------------------
function cover({ base, spine, text, accent, motif, title, tItalic, cat }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.10"/><stop offset="40%" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="sp" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${spine}"/><stop offset="100%" stop-color="${spine}" stop-opacity="0"/></linearGradient>
    ${grain('gn', 0.05)}
  </defs>
  <rect width="600" height="800" fill="${base}"/>
  <rect width="600" height="800" fill="url(#lg)"/>
  <rect x="0" y="0" width="44" height="800" fill="url(#sp)"/>
  <rect x="52" y="52" width="8" height="8" fill="${accent}"/>
  <text x="76" y="72" font-family="'Courier New', monospace" font-size="15" letter-spacing="4" fill="${text}" opacity="0.85">XYZ</text>
  <text x="524" y="72" font-family="'Courier New', monospace" font-size="13" letter-spacing="3" fill="${text}" text-anchor="end" opacity="0.7">PRINTABILITIES</text>
  ${motif}
  <text x="76" y="560" font-family="Georgia, serif" font-size="66" font-weight="700" fill="${text}">${title}</text>
  <text x="76" y="626" font-family="Georgia, serif" font-style="italic" font-size="60" fill="${accent}">${tItalic}</text>
  <rect x="76" y="672" width="120" height="3" fill="${accent}"/>
  <text x="76" y="716" font-family="'Courier New', monospace" font-size="15" letter-spacing="5" fill="${text}" opacity="0.85">${cat}</text>
  <rect width="600" height="800" filter="url(#gn)" opacity="0.6"/>
</svg>`
}
const covers = {
  'cover-educational': cover({
    base: CYAN, spine: '#0079a6', text: INK, accent: MAGENTA, title: 'THE ATLAS', tItalic: 'of learning', cat: 'EDUCATIONAL',
    motif: `<circle cx="300" cy="300" r="150" fill="none" stroke="${INK}" stroke-width="3" opacity="0.55"/><ellipse cx="300" cy="300" rx="60" ry="150" fill="none" stroke="${INK}" stroke-width="3" opacity="0.55"/><line x1="150" y1="300" x2="450" y2="300" stroke="${INK}" stroke-width="3" opacity="0.55"/>`,
  }),
  'cover-children': cover({
    base: YELLOW, spine: '#c99700', text: INK, accent: MAGENTA, title: 'LITTLE', tItalic: 'wanderers', cat: "CHILDREN'S",
    motif: `<path d="M300 180 L336 262 L424 268 L356 326 L378 412 L300 366 L222 412 L244 326 L176 268 L264 262 Z" fill="${MAGENTA}"/><circle cx="300" cy="300" r="18" fill="${CYAN}"/>`,
  }),
  'cover-novel': cover({
    base: MAGENTA, spine: '#a30062', text: PAPER, accent: YELLOW, title: 'NIGHT', tItalic: 'chapters', cat: 'NOVEL',
    motif: `<circle cx="360" cy="250" r="90" fill="${PAPER}" opacity="0.9"/><circle cx="330" cy="235" r="90" fill="${MAGENTA}"/><g fill="${YELLOW}"><circle cx="180" cy="200" r="3"/><circle cx="240" cy="330" r="2.5"/><circle cx="430" cy="360" r="3"/><circle cx="150" cy="300" r="2"/></g>`,
  }),
  'cover-hardcase': cover({
    base: INK, spine: '#000000', text: PAPER, accent: GOLD, title: 'THE PRESS', tItalic: 'anthology', cat: 'HARDCASE · FOIL',
    motif: `<rect x="150" y="200" width="300" height="200" fill="none" stroke="${GOLD}" stroke-width="2.5"/><rect x="166" y="216" width="268" height="168" fill="none" stroke="${GOLD}" stroke-width="1"/><text x="300" y="320" font-family="Georgia, serif" font-size="72" fill="${GOLD}" text-anchor="middle" font-weight="700">✶</text>`,
  }),
  'cover-exercise': cover({
    base: KRAFT, spine: '#7d5f38', text: INK, accent: CYAN, title: 'DAILY', tItalic: 'practice', cat: 'EXERCISE BOOK',
    motif: `<g stroke="${INK}" stroke-width="2" opacity="0.5">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="150" y1="${210 + i * 30}" x2="450" y2="${210 + i * 30}"/>`).join('')}</g><line x1="196" y1="200" x2="196" y2="450" stroke="${MAGENTA}" stroke-width="2.5" opacity="0.7"/>`,
  }),
}

// ---- VIDEOS (slow animated gradient, ffmpeg) ------------------------------
function video(out, c0, c1, c2) {
  const args = [
    '-y', '-f', 'lavfi',
    '-i', `gradients=size=1280x720:c0=0x${c0}:c1=0x${c1}:c2=0x${c2}:nb_colors=3:type=linear:duration=16:speed=0.006:seed=9`,
    '-t', '16', '-r', '24', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', A('videos/' + out),
  ]
  const r = spawnSync(ffmpegPath, args, { stdio: 'ignore' })
  if (r.status === 0) console.log('  ✓ videos/' + out)
  else console.log('  ✗ videos/' + out + ' (ffmpeg failed — CSS gradient fallback will show)')
}

async function main() {
  console.log('HERO'); await hero()
  console.log('ELEMENTS'); for (const [k, svg] of Object.entries(elements)) await png(svg, `elements/${k}.png`, 400, 400)
  console.log('COVERS'); for (const [k, svg] of Object.entries(covers)) await png(svg, `covers/${k}.png`, 600, 800)
  if (process.argv.includes('novideo')) { console.log('skip videos'); console.log('done.'); return }
  console.log('VIDEOS (ffmpeg:', ffmpegPath ? 'found' : 'missing', ')')
  if (ffmpegPath) {
    video('hero.mp4', '0a1418', '0e2b33', '141014')
    video('pages.mp4', '120d0a', '2a1a12', '0e0b0c')
    video('press.mp4', '16070f', '2e0a1e', '0c0709')
  }
  console.log('done.')
}
main()
