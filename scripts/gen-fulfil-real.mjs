// Fill /qfp/fulfil image frames with REAL QFP warehouse/logistics/press assets,
// navy-duotone (System B), at the exact drop-in paths the JSX already references.
import sharp from 'sharp'
import { duotone } from './assetkit.mjs'

const LIVE = 'public/qfp/live'
const OUT = 'public/qfp/fulfil'

// [dest, source, width, height, tone]  (dest = existing drop-in path)
const jobs = [
  // hero + journey — widescreen warehouse floor (07)
  ['hero-poster', '07-image-1-5-uai-1536x768', 2400, 1350, 'navy'],
  ['journey',     '07-image-1-5-uai-1536x768', 2400, 1000, 'navy'],
  // conviction cards (4:5 tall)
  ['card-01', '09-image-7-1-scaled', 1200, 1500, 'navy'], // Kitting & Assembly (press hall + workers)
  ['card-02', '05-warehousing-1',    1200, 1500, 'navy'], // Warehousing & Storage (aisle racking)
  ['card-03', '04-infra',            1200, 1500, 'navy'], // Last-Mile Delivery (facility / dispatch yard)
  // feature rows (4:3)
  ['feature-01', '12-warehousing-1-uai-750x500', 1600, 1200, 'navy'], // The Warehouse (racking aisle)
  ['feature-02', '08-image-6-1-scaled',          1600, 1200, 'navy'], // Kitting & Assembly (press hall)
  ['feature-03', '10-image-5-1-scaled',          1600, 1200, 'navy'], // In-House Packaging (print/finishing line)
  ['feature-04', '11-infra-uai-1486x991',        1600, 1200, 'navy'], // Global Shipping (facility exterior / dispatch)
]

for (const [dest, src, w, h, tone] of jobs) {
  const treated = await duotone(`${LIVE}/${src}.webp`, tone, Math.max(w, h))
  const buf = await treated.png().toBuffer()
  await sharp(buf).resize(w, h, { fit: 'cover', position: 'centre' }).webp({ quality: 84 }).toFile(`${OUT}/${dest}.webp`)
  console.log('✓', dest, `${w}x${h}`, '←', src)
}
console.log('done —', jobs.length, 'real-asset fills')
