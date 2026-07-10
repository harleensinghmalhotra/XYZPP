import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'recon/what-we-print/cutouts-v2')
const OUT = resolve(root, 'public/qfp/products')
for (let i = 1; i <= 8; i++) {
  // NO trim — keep shared 700x560 canvas so one geometry fits all 8.
  const info = await sharp(resolve(SRC, `${i}.png`))
    .webp({ quality: 88, alphaQuality: 100, effort: 5 })
    .toFile(resolve(OUT, `product-0${i}.webp`))
  console.log(`  ✓ product-0${i}.webp  ${info.width}x${info.height}  ${Math.round(info.size/1024)}KB  alpha:${info.channels===4}`)
}
