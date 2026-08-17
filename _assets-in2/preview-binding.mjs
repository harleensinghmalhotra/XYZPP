import sharp from 'sharp'
const B = 'd:/WEBSITES/Website University/public/site-assets/homepage/facility-book'
const O = 'd:/WEBSITES/Website University/_assets-in2'
await sharp(`${B}/binding-finishing-diptych.webp`).png().toFile(`${O}/prev-diptych.png`)
await sharp(`${B}/binding-finishing-trimmer.webp`).png().toFile(`${O}/prev-trimmer.png`)
console.log('ok')
