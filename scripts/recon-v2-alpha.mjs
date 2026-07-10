// RECON v2: alpha truth test on Harry's new cutouts.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'recon/what-we-print/cutouts-v2')
const NAMES = ['Educational', 'Trade', 'CoffeeTable', 'General', 'Children', 'LearningKits', 'Corporate', 'POD']

const rows = []
for (let i = 1; i <= 8; i++) {
  const f = resolve(SRC, `${i}.png`)
  const m = await sharp(f).metadata()
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info, N = W * H
  const A = (x, y) => data[(y * W + x) * 4 + 3]
  const px = (x, y) => { const p = (y * W + x) * 4; return `rgba(${data[p]},${data[p+1]},${data[p+2]},${data[p+3]})` }

  let transp = 0, semi = 0
  let minX = W, minY = H, maxX = 0, maxY = 0
  for (let idx = 0, p = 3; p < data.length; p += 4, idx++) {
    const a = data[p]
    if (a < 250) transp++
    if (a > 12 && a < 243) semi++
    if (a > 12) { const x = idx % W, y = (idx / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
  }
  const bbW = maxX - minX + 1, bbH = maxY - minY + 1
  // corner alpha (must be 0 for real cutout; white-baked would be 255)
  const corners = [A(2, 2), A(W - 3, 2), A(2, H - 3), A(W - 3, H - 3)]
  const cornersZero = corners.every((a) => a === 0)
  rows.push({
    i, cat: NAMES[i - 1], dims: `${W}x${H}`, fmt: m.format, hasAlpha: m.hasAlpha,
    transparentPct: +(100 * transp / N).toFixed(1),
    softEdgePct: +(100 * semi / N).toFixed(2),
    cornersAlpha: corners.join(','), cornersZero,
    subjectBBox: `${bbW}x${bbH}`, bboxFill: +(100 * (bbW * bbH) / N).toFixed(0),
    aspect: +(bbW / bbH).toFixed(2),
    cornerSample: px(2, 2),
  })
}
console.table(rows.map(({ cornerSample, ...r }) => r))
console.log('\ncorner pixel sample (TL):')
rows.forEach((r) => console.log(`  ${r.i} ${r.cat}: ${r.cornerSample}  cornersZero=${r.cornersZero}`))
