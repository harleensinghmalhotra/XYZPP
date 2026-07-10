import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'recon/what-we-print/cutouts-src')
for (const i of [3, 4, 7, 8]) {
  const { data, info } = await sharp(resolve(SRC, `${i}.png`)).raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const at = (x, y) => { const p = (y * W + x) * 3; return [data[p], data[p+1], data[p+2]] }
  console.log(`${i}.png ${W}x${H}`,
    'TL', at(3,3), 'TR', at(W-4,3),
    'BL', at(3,H-4), 'BR', at(W-4,H-4),
    'midBot', at(W>>1, H-4), 'centerFloor', at(W>>1, H-40))
}
