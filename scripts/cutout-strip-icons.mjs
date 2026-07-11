// Cut Harry's 4 strip-icon renders (navy/gold clay on flat light-grey) to true
// alpha. Same method as the hero stickers (scripts/cutout-bg.mjs): flood-fill
// the neutral-grey background from the image borders, so only edge-CONNECTED
// grey is cleared. The navy/gold subjects are dark/saturated (non-neutral) and
// form a barrier; the clock's cream face is fully enclosed by its navy rim, so
// the flood can't reach it — it survives. Output: cropped, small-padded WebP
// with alpha to public/qfp/icons3d/stat-*.webp.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'FLOW assets', 'Strip Images')
const OUT = resolve(root, 'public', 'qfp', 'icons3d')
const JOBS = [
  ['Book.jpeg', 'stat-book'],
  ['globe.jpeg', 'stat-globe'],
  ['box.jpeg', 'stat-box'],
  ['clock.jpeg', 'stat-clock'],
]

// Background = near-neutral grey (tiny channel spread) in the bg luma range.
// Navy (min≈27–70), gold (spread≈120+) and the warm cream clock face are all
// excluded; and the cream face is enclosed anyway, so flood never reaches it.
const isBg = (r, g, b) => {
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  return max - min <= 24 && min >= 138
}

async function cut(srcFile, outName) {
  const src = resolve(SRC, srcFile)
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const N = W * H

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

  // Keep only the largest connected subject component — drops isolated jpeg-noise
  // specks in the background that the grey flood couldn't swallow (they'd stretch
  // the crop bbox and leave floating pixels).
  const label = new Int32Array(N).fill(0)
  let best = null, bestSize = 0, cur = 0
  for (let s = 0; s < N; s++) {
    if (bg[s] || label[s]) continue
    cur++
    let size = 0
    const st = [s]
    label[s] = cur
    while (st.length) {
      const idx = st.pop()
      size++
      const x = idx % W, y = (idx / W) | 0
      const nb = [x + 1 < W ? idx + 1 : -1, x - 1 >= 0 ? idx - 1 : -1, y + 1 < H ? idx + W : -1, y - 1 >= 0 ? idx - W : -1]
      for (const n of nb) if (n >= 0 && !bg[n] && !label[n]) { label[n] = cur; st.push(n) }
    }
    if (size > bestSize) { bestSize = size; best = cur }
  }
  for (let idx = 0; idx < N; idx++) if (!bg[idx] && label[idx] !== best) bg[idx] = 1

  // Feather + 1px erode entirely in JS (sharp raw round-trips on 1-channel
  // buffers shear the data). Separable 3×3 box blur of the binary keep-mask,
  // then a steep remap that erodes the grey jpeg fringe and keeps a soft edge.
  const keep = new Float32Array(N)
  for (let idx = 0; idx < N; idx++) keep[idx] = bg[idx] ? 0 : 255
  const tmp = new Float32Array(N)
  for (let y = 0; y < H; y++) {
    const row = y * W
    for (let x = 0; x < W; x++) {
      const l = x > 0 ? keep[row + x - 1] : keep[row + x]
      const r = x < W - 1 ? keep[row + x + 1] : keep[row + x]
      tmp[row + x] = (l + keep[row + x] + r) / 3
    }
  }
  const soft = new Float32Array(N)
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      const u = y > 0 ? tmp[(y - 1) * W + x] : tmp[y * W + x]
      const d = y < H - 1 ? tmp[(y + 1) * W + x] : tmp[y * W + x]
      soft[y * W + x] = (u + tmp[y * W + x] + d) / 3
    }
  }
  const alpha = Buffer.alloc(N)
  for (let idx = 0; idx < N; idx++) {
    const a = (soft[idx] - 96) / (255 - 96) // erode ~1px, feather the edge
    alpha[idx] = Math.round(Math.max(0, Math.min(1, a)) * 255)
  }

  const rgb = Buffer.alloc(N * 3)
  for (let idx = 0; idx < N; idx++) {
    rgb[idx * 3] = data[idx * 4]
    rgb[idx * 3 + 1] = data[idx * 4 + 1]
    rgb[idx * 3 + 2] = data[idx * 4 + 2]
  }
  const rgba = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } })
    .png().toBuffer()

  // Crop to content via the alpha bbox (deterministic — sharp's .trim() misreads
  // these), then a small transparent pad so the float/shadow has room.
  let minX = W, minY = H, maxX = 0, maxY = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha[y * W + x] > 16) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  const cw = maxX - minX + 1, ch = maxY - minY + 1
  const pad = Math.round(Math.max(cw, ch) * 0.05)
  const out = await sharp(rgba)
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(resolve(OUT, `${outName}.webp`))

  const kept = alpha.reduce((n, a) => n + (a > 10 ? 1 : 0), 0)
  console.log(`  ✓ ${outName}.webp  ${out.width}x${out.height}  ${Math.round(out.size / 1024)}KB  subject:${(100 * kept / N).toFixed(0)}%`)
}

for (const [f, o] of JOBS) await cut(f, o)
console.log('done →', OUT)
