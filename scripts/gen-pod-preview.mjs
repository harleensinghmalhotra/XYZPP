// Generates the cover face used by the /print-on-demand live book preview.
// Phase 2.5: replaced the synthetic "placeholder" cover with a REAL QFP educational
// book cover, perspective-corrected (de-skewed) out of a live product photo into a
// flat, front-on 660×990 cover panel. Full colour (a book cover IS a product), with
// a faint gutter shade near the spine so it seats naturally onto the 3D CSS book.
// The output path never changes — the page needs no code edit.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/qfp/pod')
mkdirSync(out, { recursive: true })

// Source: 21-csq-3 "TICE 6e" — a real QFP educational cover with a navy/blue
// palette that sits closest to Brand System B. 1800×1200, book shot at an angle.
const SRC = resolve(root, 'public/qfp/live/21-csq-3-scaled-uai-2560x1706.webp')
const W = 660, H = 990

// Four corners of the front-cover panel in the SOURCE image (measured from a grid
// overlay). Order: TL, TR, BR, BL.  dst = flat rectangle (0,0)-(W,H).
const quad = { tl: [572, 190], tr: [1158, 112], br: [1236, 892], bl: [602, 1016] }

// Build the homography mapping DEST (flat) -> SRC (angled) so we can inverse-sample.
// Solve for the projective transform from unit square to the source quad, then scale
// dest coords into unit square. Standard 8-DoF solve.
function computeHomography(s) {
  // maps (0,0),(1,0),(1,1),(0,1) -> tl,tr,br,bl
  const [x0, y0] = s.tl, [x1, y1] = s.tr, [x2, y2] = s.br, [x3, y3] = s.bl
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1
  const g = (dx3 * dy2 - dx2 * dy3) / den
  const h = (dx1 * dy3 - dx3 * dy1) / den
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + h * x3
  const c = x0
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + h * y3
  const f = y0
  return [a, b, c, d, e, f, g, h, 1]
}
const Hm = computeHomography(quad)
function map(u, v) {
  // u,v in [0,1] -> source px
  const [a, b, c, d, e, f, g, h] = Hm
  const w = g * u + h * v + 1
  return [(a * u + b * v + c) / w, (d * u + e * v + f) / w]
}

const src = sharp(SRC)
const meta = await src.metadata()
const { data: sbuf, info } = await src.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const SW = info.width, SH = info.height, SC = info.channels

// bilinear sample from source
function sample(px, py, o) {
  const x = Math.max(0, Math.min(SW - 1.001, px))
  const y = Math.max(0, Math.min(SH - 1.001, py))
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0
  const i00 = (y0 * SW + x0) * SC
  const i10 = i00 + SC
  const i01 = i00 + SW * SC
  const i11 = i01 + SC
  for (let ch = 0; ch < 3; ch++) {
    const top = sbuf[i00 + ch] * (1 - fx) + sbuf[i10 + ch] * fx
    const bot = sbuf[i01 + ch] * (1 - fx) + sbuf[i11 + ch] * fx
    o[ch] = top * (1 - fy) + bot * fy
  }
}

// warp DEST -> sample SRC
const dst = Buffer.alloc(W * H * 3)
const tmp = [0, 0, 0]
for (let dy = 0; dy < H; dy++) {
  const v = dy / (H - 1)
  for (let dx = 0; dx < W; dx++) {
    const u = dx / (W - 1)
    const [sx, sy] = map(u, v)
    sample(sx, sy, tmp)
    const di = (dy * W + dx) * 3
    dst[di] = tmp[0]; dst[di + 1] = tmp[1]; dst[di + 2] = tmp[2]
  }
}

// gentle print polish: slight saturation + a soft gutter shade near the left (spine)
// edge and a whisper of top vignette so it reads as a bound book, not a flat scan.
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="gutter" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0f2444" stop-opacity="0.34"/>
      <stop offset="0.12" stop-color="#0f2444" stop-opacity="0.06"/>
      <stop offset="0.5" stop-color="#0f2444" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#gutter)"/>
  <rect width="${W}" height="${H}" fill="url(#sheen)"/>
</svg>`

await sharp(dst, { raw: { width: W, height: H, channels: 3 } })
  .modulate({ saturation: 1.06, brightness: 1.02 })
  .linear(1.03, -3)
  .composite([{ input: Buffer.from(overlay), blend: 'over' }])
  .webp({ quality: 90 })
  .toFile(resolve(out, 'preview-base.webp'))

console.log('✓ public/qfp/pod/preview-base.webp  (real QFP cover, de-skewed  from', meta.width + '×' + meta.height + ')')
