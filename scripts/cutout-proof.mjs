// Contact sheet: each cutout on a checkerboard (transparency truth) and on the
// cream2 card tone (real-world) so halos / leftover bg / eaten covers show.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = resolve(root, 'public/qfp/products')
const shots = resolve(root, 'shots')

const CELL = 260, PAD = 14
const checkerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${CELL}">
  <rect width="100%" height="100%" fill="#cfcfcf"/>
  ${Array.from({ length: 13 }, (_, y) => Array.from({ length: 13 }, (_, x) =>
    (x + y) % 2 ? `<rect x="${x * 20}" y="${y * 20}" width="20" height="20" fill="#f4f4f4"/>` : '').join('')).join('')}
</svg>`

const tiles = []
for (let i = 1; i <= 8; i++) {
  const f = resolve(DIR, `product-0${i}.webp`)
  const img = await sharp(f).resize({ width: CELL - PAD * 2, height: CELL - PAD * 2, fit: 'inside' }).toBuffer()
  const meta = await sharp(img).metadata()
  const left = Math.round((CELL - meta.width) / 2), top = Math.round((CELL - meta.height) / 2)
  const onCheck = await sharp(Buffer.from(checkerSvg)).composite([{ input: img, left, top }]).png().toBuffer()
  const onCream = await sharp({ create: { width: CELL, height: CELL, channels: 3, background: '#F0EBE0' } })
    .composite([{ input: img, left, top }]).png().toBuffer()
  tiles.push({ i, onCheck, onCream })
}

// grid: 8 rows? too tall. Do 4 cols x 2 rows for checker, then same for cream.
async function grid(key, out) {
  const cols = 4, rows = 2
  const canvas = sharp({ create: { width: cols * CELL, height: rows * CELL, channels: 3, background: '#ffffff' } })
  const comps = tiles.map((t, n) => ({ input: t[key], left: (n % cols) * CELL, top: ((n / cols) | 0) * CELL }))
  await canvas.composite(comps).png().toFile(resolve(shots, out))
  console.log('  ✓', out)
}
await grid('onCheck', 'wwp-cutout-checker.png')
await grid('onCream', 'wwp-cutout-cream.png')
