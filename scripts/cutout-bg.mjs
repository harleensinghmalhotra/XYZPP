// Turn Harry's white-background product renders into transparent cutouts.
// Strategy: flood-fill from the image borders, clearing only near-white / soft
// neutral-grey pixels CONNECTED to the edge. Interior white/cream book covers
// are enclosed by their own darker edges, so the flood stops at them and they
// survive. Mask edge is feathered (blur) + slightly eroded (despill) to kill the
// white halo. Output = high-quality WebP with alpha, product-0N.webp.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, process.argv[2] || 'recon/what-we-print/cutouts-src')
const OUT = resolve(root, 'public/qfp/products')
mkdirSync(OUT, { recursive: true })

// A pixel is "background" if it is bright and near-neutral (white or soft grey
// shadow). Book art is either coloured (channel spread) or dark (low min).
// White bg AND the soft neutral drop-shadows on it (down to ~188 luma). Only
// pixels flood-connected to the border are cleared, so enclosed light/cream
// book covers survive; colour (channel spread) or darkness marks real subject.
// Conservative: clear only high-confidence PURE white flood-connected to the
// border. Anything even slightly tinted/greyed (light covers, book pages, the
// soft shadows) stays — so no subject is eaten and no light channels striate.
// Residual base shadow is dissolved downstream by a CSS bottom-fade mask on the
// <img>, which also survives a later swap to Harry's true-alpha cutouts.
const isBg = (r, g, b) => {
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  return min > 236 && max - min < 16
}

async function cut(i) {
  const src = resolve(SRC, `${i}.png`)
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const N = W * H
  // mask: 1 = keep (subject), 0 = background. Start all keep, flood-clear edges.
  const bg = new Uint8Array(N) // 1 = flooded background
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const idx = y * W + x
    if (bg[idx]) return
    const p = idx * 4
    if (!isBg(data[p], data[p + 1], data[p + 2])) return
    bg[idx] = 1
    stack.push(idx)
  }
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1) }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y) }
  while (stack.length) {
    const idx = stack.pop()
    const x = idx % W, y = (idx / W) | 0
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }

  // Flood decides subject vs background. Keep it binary — no global near-white
  // pass (it ate light/cream covers) — so kept subjects stay fully opaque and
  // only the true silhouette is cut.
  const mask = Buffer.alloc(N)
  for (let idx = 0; idx < N; idx++) mask[idx] = bg[idx] ? 0 : 255
  // Light AA only: soft-blur then a steep remap so the edge is ~1px feathered
  // but interiors snap to solid (no wide semi-transparent ghost bands on light
  // book faces).
  const soft = await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
    .blur(0.8)
    .raw().toBuffer()
  const alpha = Buffer.alloc(N)
  for (let idx = 0; idx < N; idx++) {
    let a = soft[idx] / 255
    a = (a - 0.15) / 0.85 // erode the 1px white fringe, keep AA
    alpha[idx] = Math.round(Math.max(0, Math.min(1, a)) * 255)
  }

  // Interior fill: bridge thin transparent stripes/pinholes that sit INSIDE the
  // subject (e.g. the pure-white page-edge gaps in a flat book stack). Heavily
  // blurring alpha makes any region well-surrounded by opaque read high, while
  // large true-background areas stay low — so we only re-solidify enclosed gaps.
  const fill = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
    .blur(5).raw().toBuffer()
  for (let idx = 0; idx < N; idx++) if (fill[idx] > 190) alpha[idx] = 255

  // Recombine RGB with the new alpha.
  const rgb = Buffer.alloc(N * 3)
  for (let idx = 0; idx < N; idx++) {
    rgb[idx * 3] = data[idx * 4]
    rgb[idx * 3 + 1] = data[idx * 4 + 1]
    rgb[idx * 3 + 2] = data[idx * 4 + 2]
  }
  const rgba = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } })
    .png().toBuffer()

  // Trim fully-transparent margins so the subject fills the frame (better pop),
  // then export WebP with alpha.
  const dst = resolve(OUT, `product-0${i}.webp`)
  const out = await sharp(rgba)
    .trim({ threshold: 1 })
    .webp({ quality: 88, alphaQuality: 100, effort: 5 })
    .toFile(dst)

  const kept = alpha.reduce((n, a) => n + (a > 10 ? 1 : 0), 0)
  console.log(`  ✓ product-0${i}.webp  ${out.width}x${out.height}  ${Math.round(out.size / 1024)}KB  subject:${(100 * kept / N).toFixed(0)}%`)
}

for (let i = 1; i <= 8; i++) await cut(i)
