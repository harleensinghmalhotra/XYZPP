import sharp from 'sharp'
import { readdirSync } from 'node:fs'

const DIR = 'public/qfp/live'
const files = readdirSync(DIR).filter(f => f.endsWith('.webp')).sort()
const COLS = 6, TW = 236, TH = 168, PAD = 6, LABEL = 18
const rows = Math.ceil(files.length / COLS)
const cellW = TW + PAD * 2, cellH = TH + PAD * 2 + LABEL
const W = COLS * cellW, H = rows * cellH

const comps = []
for (let i = 0; i < files.length; i++) {
  const col = i % COLS, row = Math.floor(i / COLS)
  const thumb = await sharp(`${DIR}/${files[i]}`).resize(TW, TH, { fit: 'cover' }).png().toBuffer()
  comps.push({ input: thumb, left: col * cellW + PAD, top: row * cellH + PAD + LABEL })
  const label = Buffer.from(`<svg width="${cellW}" height="${LABEL}"><text x="4" y="13" font-family="monospace" font-size="12" fill="#111">${files[i].slice(0, 34)}</text></svg>`)
  comps.push({ input: label, left: col * cellW, top: row * cellH })
}
await sharp({ create: { width: W, height: H, channels: 3, background: '#e8e8e8' } }).composite(comps).png().toFile('shots/phase25/live-contact-sheet.png')
console.log('wrote shots/phase25/live-contact-sheet.png', W, 'x', H, files.length, 'imgs')
