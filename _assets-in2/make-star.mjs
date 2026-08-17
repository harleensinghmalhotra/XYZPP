import sharp from 'sharp'
const SRC = 'd:/WEBSITES/Website University/2 star certificate QFP.png'
const DEST = 'd:/WEBSITES/Website University/public/site-assets/footer-certs/star-export-house.webp'
const O = 'd:/WEBSITES/Website University/_assets-in2'

// Trim the transparent padding down to the outer blue ring, then square-fit to 96x96.
const trimmed = await sharp(SRC).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true })
console.log('trimmed to', trimmed.info.width + 'x' + trimmed.info.height)

await sharp(trimmed.data)
  .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(DEST)

const kb = (await import('node:fs')).statSync(DEST).size / 1024
const m = await sharp(DEST).metadata()
console.log('icon', m.width + 'x' + m.height, kb.toFixed(1) + ' KB')

// preview on cream (the footer card colour) at render size
await sharp(DEST).resize(88).flatten({ background: '#fdfaf4' }).png().toFile(`${O}/prev-star-new.png`)
