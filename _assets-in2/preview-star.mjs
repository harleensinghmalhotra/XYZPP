import sharp from 'sharp'
const O = 'd:/WEBSITES/Website University/_assets-in2'
await sharp('d:/WEBSITES/Website University/2 star certificate QFP.png')
  .resize({ width: 400 }).flatten({ background: '#0f1838' }).png().toFile(`${O}/prev-star-src.png`)
await sharp('d:/WEBSITES/Website University/public/site-assets/footer-certs/star-export-house.webp')
  .resize({ width: 200 }).flatten({ background: '#0f1838' }).png().toFile(`${O}/prev-star-current.png`)
console.log('ok')
