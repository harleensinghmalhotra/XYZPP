// Convert the 8 QFP product scene photos (recon JPEGs 03–10) into web WebPs.
// Filename convention is card-order (her order): product-01..08.webp — when Harry
// delivers transparent cutouts they drop in over these with zero code change.
// POD (10) is 1402×1122; everything downscaled to max 760px wide, quality 82.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = (p) => resolve(root, 'recon/qfp-assets', p)
const out = (p) => resolve(root, 'public/qfp/products', p)
mkdirSync(resolve(root, 'public/qfp/products'), { recursive: true })

// card slot (her order) -> source recon file
const MAP = [
  ['product-01.webp', '03_product-01-educational-books.jpg'],            // Educational
  ['product-02.webp', '04_product-02-trade-books.jpg'],                  // Trade
  ['product-03.webp', '05_product-03-coffee-table-and-hardcase-books.jpg'], // Coffee Table
  ['product-04.webp', '06_product-04-general-books.jpg'],                // General
  ['product-05.webp', '07_product-05-children-s-books.jpg'],            // Children's
  ['product-06.webp', '08_product-06-learning-activity-kits.jpg'],      // Learning Kits
  ['product-07.webp', '09_product-07-corporate-banks-and-mncs.jpg'],    // Corporate
  ['product-08.webp', '10_product-08-print-on-demand.jpg'],             // Print on Demand
]

for (const [dst, s] of MAP) {
  const info = await sharp(src(s))
    .resize({ width: 760, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out(dst))
  console.log('  ✓', dst, `${info.width}×${info.height}`, `${Math.round(info.size / 1024)}KB`)
}
