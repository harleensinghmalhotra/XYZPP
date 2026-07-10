import sharp from 'sharp'
import { resolve } from 'node:path'

const SRC = process.argv[2] || '/tmp/harry-cards'
const rows = []
for (let i = 1; i <= 8; i++) {
  const f = resolve(SRC, `${i}.png`)
  const m = await sharp(f).metadata()
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const total = info.width * info.height
  let transp = 0, semi = 0
  // opaque bounding box (where alpha>10) to gauge subject framing / margins
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0
  for (let idx = 0, p = 3; p < data.length; p += 4, idx++) {
    const a = data[p]
    if (a < 250) transp++
    if (a > 10 && a < 245) semi++
    if (a > 10) {
      const x = idx % info.width, y = (idx / info.width) | 0
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }
  const bbW = maxX - minX + 1, bbH = maxY - minY + 1
  rows.push({
    i, dims: `${m.width}x${m.height}`, alpha: m.hasAlpha,
    transparentPct: +(100 * transp / total).toFixed(1),
    softEdgePct: +(100 * semi / total).toFixed(2),
    subjectBBox: `${bbW}x${bbH}`,
    marginPct: +(100 * (1 - (bbW * bbH) / total)).toFixed(1),
    aspect: +(bbW / bbH).toFixed(2),
  })
}
console.table(rows)
