// Compose old-dotted (cobe) vs new-Earth (react-globe.gl) side by side.
import sharp from 'sharp'

const SIZE = 380
const PAD = 28
const LABEL_H = 46
const GAP = 24
const navy = { r: 15, g: 36, b: 68, alpha: 1 }

async function tile(src, label) {
  const globe = await sharp(src).resize(SIZE, SIZE, { fit: 'contain', background: navy }).toBuffer()
  const svg = Buffer.from(
    `<svg width="${SIZE}" height="${LABEL_H}"><rect width="100%" height="100%" fill="rgb(15,36,68)"/>
     <text x="${SIZE / 2}" y="30" font-family="Arial" font-size="18" font-weight="600" fill="#C89A3C" text-anchor="middle">${label}</text></svg>`,
  )
  const lab = await sharp(svg).png().toBuffer()
  return sharp({ create: { width: SIZE, height: SIZE + LABEL_H, channels: 4, background: navy } })
    .composite([{ input: lab, top: 0, left: 0 }, { input: globe, top: LABEL_H, left: 0 }])
    .png()
    .toBuffer()
}

const left = await tile('shots/projects-globe.png', 'BEFORE — cobe dotted globe')
const right = await tile('shots/phase35/02-rotate-0.png', 'AFTER — photoreal Earth')

const W = SIZE * 2 + PAD * 2 + GAP
const H = SIZE + LABEL_H + PAD * 2
await sharp({ create: { width: W, height: H, channels: 4, background: navy } })
  .composite([
    { input: left, top: PAD, left: PAD },
    { input: right, top: PAD, left: PAD + SIZE + GAP },
  ])
  .png()
  .toFile('shots/phase35/06-sidebyside.png')
console.log('wrote shots/phase35/06-sidebyside.png')
