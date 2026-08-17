import sharp from 'sharp'
const OUT = 'd:/WEBSITES/Website University/public/site-assets/homepage/facility-book'

// Binding Image (diptych 1544x1177, RGBA fully-opaque) -> RGB webp, ~1600 wide (no upscale), q80
await sharp('d:/WEBSITES/Website University/_assets-in2/Binding Image.png')
  .removeAlpha()
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 80 })
  .toFile(`${OUT}/binding-finishing-diptych.webp`)

// Finishing (2033x1148 trimmer, RGBA fully-opaque) -> RGB webp, 1600 wide, q80,
// with a gentle warmth + exposure lift (reads slightly cool/dark in the source).
await sharp('d:/WEBSITES/Website University/_assets-in2/Finishing.png')
  .removeAlpha()
  .resize({ width: 1600, withoutEnlargement: true })
  .modulate({ brightness: 1.06 })
  .tint({ r: 255, g: 250, b: 243 })
  .webp({ quality: 80 })
  .toFile(`${OUT}/binding-finishing-trimmer.webp`)

for (const f of ['binding-finishing-diptych.webp', 'binding-finishing-trimmer.webp']) {
  const m = await sharp(`${OUT}/${f}`).metadata()
  const kb = (await import('node:fs')).statSync(`${OUT}/${f}`).size / 1024
  console.log(`${f}: ${m.width}x${m.height} ${m.channels}ch ${kb.toFixed(0)} KB`)
}
