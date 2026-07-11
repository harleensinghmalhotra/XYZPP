// R6: process Harry's conveyor assets into WebP for public/qfp/conveyor/.
// The girl renders (1-4.png) ALREADY ship with a clean alpha channel — so we only
// trim the transparent margins and convert (preserving alpha). FRAME.jpeg is a flat
// cream/gold plate on a navy field → a luma key lifts it off the navy cleanly.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'FLOW assets/3d scene assets')
const OUT = resolve(root, 'public/qfp/conveyor')
mkdirSync(OUT, { recursive: true })

async function passAlpha(srcName, outName) {
  const out = await sharp(resolve(SRC, srcName))
    .ensureAlpha()
    .trim({ threshold: 10 }) // crop transparent margins → tight sprite
    .webp({ quality: 90, alphaQuality: 100, effort: 5 })
    .toFile(resolve(OUT, outName))
  console.log(`  ✓ ${outName}  ${out.width}x${out.height}  ${Math.round(out.size / 1024)}KB`)
}

// FRAME plate: bright cream/gold on dark navy → clean LUMA key (no flood needed).
async function cutPlate() {
  const trimmed = await sharp(resolve(SRC, 'FRAME.jpeg')).trim({ threshold: 26 }).toBuffer()
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const N = W * H
  const alpha = Buffer.alloc(N)
  for (let idx = 0; idx < N; idx++) {
    const p = idx * 4
    const luma = 0.3 * data[p] + 0.59 * data[p + 1] + 0.11 * data[p + 2]
    alpha[idx] = Math.round(Math.max(0, Math.min(1, (luma - 72) / 40)) * 255)
  }
  const rgb = Buffer.alloc(N * 3)
  for (let idx = 0; idx < N; idx++) { rgb[idx * 3] = data[idx * 4]; rgb[idx * 3 + 1] = data[idx * 4 + 1]; rgb[idx * 3 + 2] = data[idx * 4 + 2] }
  const rgba = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer()
  const out = await sharp(rgba).trim({ threshold: 1 }).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(resolve(OUT, 'label-plate.webp'))
  console.log(`  ✓ label-plate.webp  ${out.width}x${out.height}  ${Math.round(out.size / 1024)}KB`)
}

await passAlpha('4.png', 'girl-reach.webp') // waiting state (reaching for the box)
await passAlpha('2.png', 'girl-jump.webp')  // celebration (box overhead)
await passAlpha('1.png', 'girl-pick.webp')
await passAlpha('3.png', 'girl-stand.webp')
await cutPlate()
