// RECON v2: proof each new cutout full-size on checker | card bg #FDFAF4.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'recon/what-we-print/cutouts-v2')
const shots = resolve(root, 'shots')

const CW = 400, rowH = 250
const checker = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#a8a8a8"/>${Array.from({length:Math.ceil(h/16)},(_,y)=>Array.from({length:Math.ceil(w/16)},(_,x)=>(x+y)%2?`<rect x="${x*16}" y="${y*16}" width="16" height="16" fill="#e6e6e6"/>`:'').join('')).join('')}</svg>`)

const comps = []
for (let i = 1; i <= 8; i++) {
  const img = await sharp(resolve(SRC, `${i}.png`)).trim({ threshold: 1 }).resize({ width: CW - 26, height: rowH - 18, fit: 'inside' }).toBuffer()
  const m = await sharp(img).metadata()
  const y0 = (i - 1) * rowH
  const chk = await sharp(checker(CW, rowH)).composite([{ input: img, left: Math.round((CW - m.width) / 2), top: Math.round((rowH - m.height) / 2) }]).png().toBuffer()
  comps.push({ input: chk, left: 0, top: y0 })
  comps.push({ input: img, left: CW + Math.round((CW - m.width) / 2), top: y0 + Math.round((rowH - m.height) / 2) })
}
await sharp({ create: { width: CW * 2, height: rowH * 8, channels: 3, background: '#FDFAF4' } }).composite(comps).png().toFile(resolve(shots, 'v2-cutouts-all.png'))
console.log('  ✓ shots/v2-cutouts-all.png (col1 checker | col2 card #FDFAF4)')

// two split sheets for closer viewing (1-4, 5-8)
for (const [tag, start] of [['a', 1], ['b', 5]]) {
  const cc = []
  for (let k = 0; k < 4; k++) {
    const i = start + k
    const img = await sharp(resolve(SRC, `${i}.png`)).trim({ threshold: 1 }).resize({ width: CW - 26, height: rowH - 18, fit: 'inside' }).toBuffer()
    const m = await sharp(img).metadata(), y0 = k * rowH
    const chk = await sharp(checker(CW, rowH)).composite([{ input: img, left: Math.round((CW - m.width) / 2), top: Math.round((rowH - m.height) / 2) }]).png().toBuffer()
    cc.push({ input: chk, left: 0, top: y0 }, { input: img, left: CW + Math.round((CW - m.width) / 2), top: y0 + Math.round((rowH - m.height) / 2) })
  }
  await sharp({ create: { width: CW * 2, height: rowH * 4, channels: 3, background: '#FDFAF4' } }).composite(cc).png().toFile(resolve(shots, `v2-cutouts-${tag}.png`))
  console.log(`  ✓ shots/v2-cutouts-${tag}.png`)
}
