// Phase 3.3 — compose specimen strips from captured shots.
// Proves ONE hero skeleton (all 8 page heroes) + ONE card system side by side.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const DIR = 'shots/phase33'
mkdirSync(DIR, { recursive: true })

async function tile(outName, files, cols, cellW) {
  const imgs = []
  for (const f of files) {
    const buf = await sharp(`${DIR}/${f}`).resize({ width: cellW }).toBuffer()
    const meta = await sharp(buf).metadata()
    imgs.push({ buf, w: meta.width, h: meta.height })
  }
  const rows = Math.ceil(imgs.length / cols)
  const cellH = Math.max(...imgs.map((i) => i.h))
  const gap = 12
  const W = cols * cellW + (cols + 1) * gap
  const H = rows * cellH + (rows + 1) * gap
  const composites = imgs.map((im, idx) => {
    const r = Math.floor(idx / cols)
    const c = idx % cols
    return { input: im.buf, left: gap + c * (cellW + gap), top: gap + r * (cellH + gap) }
  })
  await sharp({ create: { width: W, height: H, channels: 3, background: { r: 232, g: 228, b: 216 } } })
    .composite(composites)
    .png()
    .toFile(`${DIR}/${outName}`)
  console.log('wrote', outName, `${W}x${H}`, `(${files.length} tiles)`)
}

// HERO SPECIMEN — all 8 page heroes, 2 cols × 4 rows, proving one skeleton
await tile('SPECIMEN-heroes.png', [
  'hero-home.png', 'hero-about.png',
  'hero-educational-books.png', 'hero-trade-books.png',
  'hero-print-on-demand.png', 'hero-infrastructure.png',
  'hero-fulfilment.png', 'hero-contact.png',
], 2, 720)

// CARD SPECIMEN — card sections across pages, proving one card family
await tile('SPECIMEN-cards.png', [
  'body-edu-cards.png', 'body-inf-cards.png',
  'body-about-cards.png', 'body-pod-cards.png',
  'body-ctc-cards.png',
], 2, 720)

// FR hero specimen — proves the skeleton survives the language switch
await tile('SPECIMEN-heroes-FR.png', [
  'hero-educational-books-FR.png', 'hero-print-on-demand-FR.png',
  'hero-trade-books-FR.png', 'hero-fulfilment-FR.png',
], 2, 720)

console.log('done')
