import sharp from 'sharp'
const B = 'd:/WEBSITES/Website University/public/site-assets/footer-certs'
const O = 'd:/WEBSITES/Website University/_assets-in2/prev-certs-row.png'
const slugs = ['fsc', 'iso-9001', 'iso-27001', 'sedex', 'star-export-house']
const S = 44, GAP = 24, PAD = 24
const W = PAD * 2 + slugs.length * S + (slugs.length - 1) * GAP
const H = PAD * 2 + S
const comps = []
for (let i = 0; i < slugs.length; i++) {
  const buf = await sharp(`${B}/${slugs[i]}.webp`).resize(S, S, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  comps.push({ input: buf, left: PAD + i * (S + GAP), top: PAD })
}
await sharp({ create: { width: W, height: H, channels: 3, background: '#fdfaf4' } }).composite(comps).png().toFile(O)
console.log('wrote', O)
