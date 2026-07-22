// Packaging & Gifting product-grouping render → transparent WWP cutout (product-10).
// Source: "Ektas Vibe Coded Latest/Packaging and Gifting.png" — six kit boxes on a
// glossy studio floor. This render is unusually hard to key: the white box faces are
// the SAME luminance as the floor, and the glossy floor carries faint reflections +
// baked noise bands. A plain white-threshold flood (scripts/cutout-bg.mjs) leaves
// striations, so this uses a four-step mask:
//   1 · flood the border-connected background on a SATURATION gate (desaturated +
//       light = floor / reflection; colourful or dark = product).
//   2 · drop small isolated kept islands by connected-component area (kills the
//       stripe / reflection noise the flood can't reach).
//   3 · hole-fill bg pockets that don't touch the border → the enclosed white box
//       faces (AstraPlus, Ultimate Photo Paper) survive.
//   4 · erode light reflection tails + snap the faintest alpha to 0, then feather,
//       trim and export WebP with alpha. The card's CSS drop-shadow grounds it.
// Re-run after re-exporting the source: `node scripts/cut-packaging.mjs`
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'Ektas Vibe Coded Latest/Packaging and Gifting.png')
const OUT = resolve(root, 'public/site-assets/homepage/products/product-10.webp')

// tuned params (see header) — recalibrate only if the source render changes.
const NEUTRAL_LUMA = 125   // floor is desaturated + brighter than this
const NEUTRAL_SPREAD = 22  // channel spread below this = neutral (floor), above = colour
const MIN_AREA = 6000      // smallest kept subject island (px); smaller = noise
const REFLECT_LUMA = 200   // erode light tails ≤ this off the transparent side
const REFLECT_PASS = 10
const ALPHA_FLOOR = 95     // snap alpha below this (faint haze) fully transparent

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H } = info
const N = W * H
const lm = (i) => 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
const spread = (i) => { const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]; return Math.max(r, g, b) - Math.min(r, g, b) }
const isNeutralBg = (i) => lm(i) > NEUTRAL_LUMA && spread(i) < NEUTRAL_SPREAD

// 1 · neutral/desaturated background flood from all four borders
const bg = new Uint8Array(N)
let stack = []
const seed = (i) => { if (!bg[i] && isNeutralBg(i)) { bg[i] = 1; stack.push(i) } }
for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x) }
for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1) }
while (stack.length) {
  const i = stack.pop(), x = i % W, y = (i / W) | 0
  if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (y > 0) seed(i - W); if (y < H - 1) seed(i + W)
}

// 2 · drop small isolated kept islands (stripe / reflection noise)
const seen = new Uint8Array(N)
for (let s = 0; s < N; s++) {
  if (bg[s] || seen[s]) continue
  const comp = []; stack = [s]; seen[s] = 1
  while (stack.length) {
    const i = stack.pop(); comp.push(i)
    const x = i % W, y = (i / W) | 0
    for (const j of [x > 0 && i - 1, x < W - 1 && i + 1, y > 0 && i - W, y < H - 1 && i + W]) {
      if (j !== false && !bg[j] && !seen[j]) { seen[j] = 1; stack.push(j) }
    }
  }
  if (comp.length < MIN_AREA) for (const i of comp) bg[i] = 1
}

// 3 · hole-fill: bg pockets NOT touching the border are enclosed product faces
const bgSeen = new Uint8Array(N)
stack = []
const touch = (i) => { if (bg[i] && !bgSeen[i]) { bgSeen[i] = 1; stack.push(i) } }
for (let x = 0; x < W; x++) { touch(x); touch((H - 1) * W + x) }
for (let y = 0; y < H; y++) { touch(y * W); touch(y * W + W - 1) }
while (stack.length) {
  const i = stack.pop(), x = i % W, y = (i / W) | 0
  if (x > 0) touch(i - 1); if (x < W - 1) touch(i + 1); if (y > 0) touch(i - W); if (y < H - 1) touch(i + W)
}
for (let i = 0; i < N; i++) if (bg[i] && !bgSeen[i]) bg[i] = 0

// 4a · erode light reflection tails inward from the transparent side
for (let pass = 0; pass < REFLECT_PASS; pass++) {
  const add = []
  for (let i = 0; i < N; i++) {
    if (bg[i] || lm(i) <= REFLECT_LUMA) continue
    const x = i % W, y = (i / W) | 0
    if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) add.push(i)
  }
  if (!add.length) break
  for (const i of add) bg[i] = 1
}

// 4b · feather + alpha floor + compose + trim + WebP
const mask = Buffer.alloc(N)
for (let i = 0; i < N; i++) mask[i] = bg[i] ? 0 : 255
const soft = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(0.8).raw().toBuffer()
const alpha = Buffer.alloc(N)
for (let i = 0; i < N; i++) {
  const v = Math.round(Math.max(0, Math.min(1, (soft[i] / 255 - 0.15) / 0.85)) * 255)
  alpha[i] = v < ALPHA_FLOOR ? 0 : v
}
const rgb = Buffer.alloc(N * 3)
for (let i = 0; i < N; i++) { rgb[i * 3] = data[i * 4]; rgb[i * 3 + 1] = data[i * 4 + 1]; rgb[i * 3 + 2] = data[i * 4 + 2] }
const rgba = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
  .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer()

const out = await sharp(rgba).trim({ threshold: 1 }).resize({ width: 1200, withoutEnlargement: true })
  .webp({ quality: 88, alphaQuality: 100, effort: 5 }).toFile(OUT)
console.log(`  ✓ product-10.webp  ${out.width}x${out.height}  ${Math.round(out.size / 1024)}KB`)
