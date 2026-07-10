// RECON: quantify what the white-key flood destroyed vs Harry's source renders.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'recon/what-we-print/cutouts-src')
const OUT = resolve(root, 'public/qfp/products')

const NAMES = ['Educational', 'Trade', 'CoffeeTable', 'General', 'Children', 'LearningKits', 'Corporate', 'POD']
const rows = []
for (let i = 1; i <= 8; i++) {
  // source (opaque) at native 700x560
  const src = await sharp(resolve(SRC, `${i}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const SW = src.info.width, SH = src.info.height
  // webp output, resized to source dims for pixel compare
  const cut = await sharp(resolve(OUT, `product-0${i}.webp`)).resize(SW, SH, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const sd = src.data, cd = cut.data, N = SW * SH

  // classify each source pixel: nearWhite (legit bg) vs content
  // then check webp alpha: transparent (<40) vs kept
  let srcContent = 0, destroyedContent = 0, keptContent = 0, transpTotal = 0
  // interior-transparency (holes/stripes): transparent pixel with opaque neighbours L&R within subject
  let interiorTransp = 0
  for (let idx = 0; idx < N; idx++) {
    const p = idx * 4
    const r = sd[p], g = sd[p + 1], b = sd[p + 2]
    const min = Math.min(r, g, b), max = Math.max(r, g, b)
    const nearWhite = min > 220 && max - min < 20
    const a = cd[p + 3]
    const transparent = a < 40
    if (transparent) transpTotal++
    if (!nearWhite) {
      srcContent++
      if (transparent) destroyedContent++
      else keptContent++
    }
  }
  // stripe/hole pass: for each row, count transparent pixels that sit between
  // opaque pixels on the same row (interior cut) using the webp alpha
  for (let y = 0; y < SH; y++) {
    let firstOpaque = -1, lastOpaque = -1
    for (let x = 0; x < SW; x++) if (cd[(y * SW + x) * 4 + 3] >= 40) { if (firstOpaque < 0) firstOpaque = x; lastOpaque = x }
    if (firstOpaque < 0) continue
    for (let x = firstOpaque; x <= lastOpaque; x++) if (cd[(y * SW + x) * 4 + 3] < 40) interiorTransp++
  }

  rows.push({
    i, cat: NAMES[i - 1],
    contentPx: srcContent,
    destroyedPct: +(100 * destroyedContent / srcContent).toFixed(1),
    interiorHolePct: +(100 * interiorTransp / N).toFixed(1),
    keptPct: +(100 * keptContent / srcContent).toFixed(1),
  })
}
console.table(rows)
console.log('destroyedPct = % of real (non-white) source content the key turned transparent (higher = worse).')
console.log('interiorHolePct = % of frame that is transparent BUT enclosed between opaque pixels on its row (striping/holes).')
