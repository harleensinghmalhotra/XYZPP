import sharp from 'sharp'
const OUT = 'd:/WEBSITES/Website University/public/site-assets/homepage/facility-book'
// Finishing trimmer: source reads cool + dark. Lift exposure + a touch of saturation,
// and warm gently via per-channel gain (more red, less blue). Keep real colour intact.
await sharp('d:/WEBSITES/Website University/_assets-in2/Finishing.png')
  .removeAlpha()
  .resize({ width: 1600, withoutEnlargement: true })
  .modulate({ brightness: 1.06, saturation: 1.06 })
  .linear([1.05, 1.0, 0.95], [0, 0, 0])
  .webp({ quality: 80 })
  .toFile(`${OUT}/binding-finishing-trimmer.webp`)
await sharp(`${OUT}/binding-finishing-trimmer.webp`).png().toFile('d:/WEBSITES/Website University/_assets-in2/prev-trimmer.png')
const m = await sharp(`${OUT}/binding-finishing-trimmer.webp`).metadata()
const kb = (await import('node:fs')).statSync(`${OUT}/binding-finishing-trimmer.webp`).size / 1024
console.log(`trimmer: ${m.width}x${m.height} ${m.channels}ch ${kb.toFixed(0)} KB`)
