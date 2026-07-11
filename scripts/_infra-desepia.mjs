// De-sepia the three facility photos: the client webps ship with a heavy warm/gold
// wash baked in. Gray-world white balance neutralises the cast (per-channel gain so
// the average pixel goes neutral grey), then a gentle level-stretch + saturation
// restore brings the scene back to a clean, natural read. Originals are backed up in
// recon/infra-sepia-orig/ — this writes previews to shots/infra-glow/clean-preview/
// (pass --apply to overwrite public/qfp/infra in place after the judge approves).
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const apply = process.argv.includes('--apply')
const srcDir = resolve(root, 'recon/infra-sepia-orig')          // always de-sepia from the untouched originals
const outDir = apply ? resolve(root, 'public/qfp/infra') : resolve(root, 'shots/infra-glow/clean-preview')
mkdirSync(outDir, { recursive: true })

const FILES = ['facility-01.webp', 'facility-02.webp', 'facility-03.webp']
// Gain clamp keeps the WB honest — a channel is nudged toward neutral, never blown
// out. facility-02 (the gold "Colección Oro" book) is genuinely gold, so its cast is
// milder-corrected via a per-file strength.
const STRENGTH = { 'facility-01.webp': 1.0, 'facility-02.webp': 0.72, 'facility-03.webp': 1.0 }

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

for (const f of FILES) {
  const src = resolve(srcDir, f)
  const stats = await sharp(src).stats()
  const [r, g, b] = stats.channels.map((c) => c.mean)
  const target = (r + g + b) / 3
  const s = STRENGTH[f] ?? 1
  // gray-world gains, eased by strength and clamped so nothing over-corrects
  const gain = [r, g, b].map((m) => clamp(1 + (target / m - 1) * s, 0.7, 1.4))
  const cleaned = await sharp(src)
    .linear(gain, [0, 0, 0])
    .normalise({ lower: 1, upper: 99 })       // gentle level stretch to recover contrast
    .modulate({ saturation: 1.12 })           // restore a little natural colour
    .webp({ quality: 82 })
    .toBuffer()
  await sharp(cleaned).toFile(resolve(outDir, f))
  console.log(`${f}: means R=${r.toFixed(1)} G=${g.toFixed(1)} B=${b.toFixed(1)}  gain=[${gain.map((x) => x.toFixed(3)).join(', ')}]  strength=${s}`)
}
console.log(apply ? '\nAPPLIED to public/qfp/infra' : `\nPREVIEW written to ${outDir}`)
