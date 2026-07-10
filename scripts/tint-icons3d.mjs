// Brand-tint the neutral 3dicons clay renders onto Ekta's palette.
// A luminance duotone: each pixel's brightness is remapped through a
// navy → gold → cream ramp (navy shadows, warm gold mid-lights, cream
// speculars), so the 3D depth is preserved but the material reads on-brand.
// Per-image contrast normalization stretches the clay's narrow tonal range to
// the full ramp, giving real navy shadows instead of muddy greys.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = resolve(root, 'public', 'qfp', 'icons3d')
const ICONS = ['books', 'countries', 'containers', 'ontime']

// Duotone ramp keyed on ABSOLUTE luminance (not per-image normalized), so all
// four clay icons — which share one material + lighting — get the identical
// mapping and read as siblings. Measured: clay bodies cluster at L≈0.82–0.90,
// so navy owns that band; gold/cream are reserved for the L>0.90 highlights.
// Stops: [absolute luminance 0..1, rgb] — Ekta's tokens.
const STOPS = [
  [0.6, [9, 22, 44]],     // deep navy — shadow floor / contact
  [0.84, [15, 36, 68]],   // navy #0F2444 — lit body
  [0.9, [120, 92, 34]],   // deep gold — shadow→rim transition
  [0.94, [170, 128, 44]], // gold ~#9B7420 — warm rim light
  [0.97, [205, 160, 66]], // light gold ~#C89A3C
  [1.0, [250, 247, 240]], // cream #FDFAF4 — specular hotspot
]

function ramp(t) {
  if (t <= STOPS[0][0]) return STOPS[0][1]
  if (t >= STOPS[STOPS.length - 1][0]) return STOPS[STOPS.length - 1][1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [p0, c0] = STOPS[i]
    const [p1, c1] = STOPS[i + 1]
    if (t >= p0 && t <= p1) {
      const f = (t - p0) / (p1 - p0)
      return [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * f))
    }
  }
  return STOPS[STOPS.length - 1][1]
}

for (const name of ICONS) {
  const src = resolve(DIR, `${name}.png`)
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  // Remap each pixel's absolute luminance through the shared ramp, keep alpha.
  const out = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i += channels) {
    const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
    const [r, g, b] = ramp(l)
    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
    out[i + 3] = data[i + 3]
  }

  await sharp(out, { raw: { width, height, channels } })
    .png()
    .toFile(resolve(DIR, `${name}-tinted.png`))
  console.log('✓', `${name}-tinted.png`)
}
console.log('done →', DIR)
