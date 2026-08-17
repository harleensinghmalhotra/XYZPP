// Task 4 — develop the Aster PNG into a web-ready binding-09.webp.
// Cool/underexposed source -> gray-world white balance + exposure lift, 1600px wide 3:2.
import sharp from 'sharp'
const SRC = 'THE FINAL DESKTOP WEBSITE CHANGE/drive-download-20260727T161613Z-1-001/Aster-Automatic.png'
const DST = process.argv[2] || '_lane7/aster-out.webp'
const bright = parseFloat(process.argv[3] || '1.16')
const wbK = parseFloat(process.argv[4] || '0.75')   // 0 = no WB, 1 = full gray-world
const sat = parseFloat(process.argv[5] || '1.07')

// 1) channel means on a small proxy for gray-world
const { channels } = await sharp(SRC).resize(400).stats()
const [r, g, b] = channels.map(c => c.mean)
const gray = (r + g + b) / 3
const mul = [r, g, b].map(m => 1 + wbK * ((gray / m) - 1))
console.log('means', [r, g, b].map(x => x.toFixed(1)).join(','), '-> wb mul', mul.map(x => x.toFixed(3)).join(','))

await sharp(SRC)
  .resize(1600)                             // 3:2 -> 1600x1067
  .linear(mul, [0, 0, 0])                   // per-channel white balance
  .modulate({ brightness: bright, saturation: sat })
  .webp({ quality: 82 })
  .toFile(DST)
const meta = await sharp(DST).metadata()
console.log('wrote', DST, meta.width + 'x' + meta.height)
