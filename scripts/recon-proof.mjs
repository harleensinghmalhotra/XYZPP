// RECON: full-size proof of each cutout on checker | live card bg (#FDFAF4),
// plus source-vs-cut side-by-side for the worst offenders.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'recon/what-we-print/cutouts-src')
const OUT = resolve(root, 'public/qfp/products')
const shots = resolve(root, 'shots')

const CW = 380
const checker = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#b0b0b0"/>${Array.from({length:Math.ceil(h/18)},(_,y)=>Array.from({length:Math.ceil(w/18)},(_,x)=>(x+y)%2?`<rect x="${x*18}" y="${y*18}" width="18" height="18" fill="#e8e8e8"/>`:'').join('')).join('')}</svg>`)

// grid of all 8: two columns per image (checker, card-cream)
const rowH = 210
const sheetW = CW * 2, sheetH = rowH * 8
const comps = []
for (let i = 1; i <= 8; i++) {
  const img = await sharp(resolve(OUT, `product-0${i}.webp`)).resize({ width: CW - 30, height: rowH - 20, fit: 'inside' }).toBuffer()
  const m = await sharp(img).metadata()
  const y0 = (i - 1) * rowH, ox = Math.round((CW - m.width) / 2), oy = y0 + Math.round((rowH - m.height) / 2)
  const chk = await sharp(checker(CW, rowH)).composite([{ input: img, left: ox, top: Math.round((rowH - m.height) / 2) }]).png().toBuffer()
  comps.push({ input: chk, left: 0, top: y0 })
  comps.push({ input: img, left: CW + ox, top: oy })
}
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#FDFAF4' } }).composite(comps).png().toFile(resolve(shots, 'recon-cutouts-all.png'))
console.log('  ✓ recon-cutouts-all.png (col1=checker, col2=card #FDFAF4)')

// worst-case source vs cut, big
for (const i of [3, 4]) {
  const src = await sharp(resolve(SRC, `${i}.png`)).resize({ width: 460 }).toBuffer()
  const cutOnCard = await sharp({ create: { width: 460, height: 368, channels: 3, background: '#FDFAF4' } })
    .composite([{ input: await sharp(resolve(OUT, `product-0${i}.webp`)).resize({ width: 440, height: 348, fit: 'inside' }).toBuffer(), gravity: 'center' }]).png().toBuffer()
  const sm = await sharp(src).metadata()
  await sharp({ create: { width: 940, height: Math.max(sm.height, 368), channels: 3, background: '#ffffff' } })
    .composite([{ input: src, left: 0, top: 0 }, { input: cutOnCard, left: 470, top: 0 }]).png().toFile(resolve(shots, `recon-srcvscut-${i}.png`))
  console.log(`  ✓ recon-srcvscut-${i}.png (left=source PNG, right=our cut on card)`)
}
