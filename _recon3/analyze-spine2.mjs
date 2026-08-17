import sharp from 'sharp'
const PNG = process.argv[2]
const { data, info } = await sharp(PNG).raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, ch = info.channels
const navy = (x, y) => {
  const i = (y * W + x) * ch
  const r = data[i], g = data[i + 1], b = data[i + 2]
  const bright = 0.299 * r + 0.587 * g + 0.114 * b
  return bright < 60 && b > r + 8 && b >= g   // strict dark-blue (book cover/binding #030C31-ish)
}
// per-row leftmost/rightmost navy across the book base, midpoint per row, then median of midpoints
const xmin = 470, xmax = 1080
const mids = []
for (let y = 690; y <= 782; y++) {
  let lo = 1e9, hi = -1
  for (let x = xmin; x < xmax; x++) if (navy(x, y)) { if (x < lo) lo = x; if (x > hi) hi = x }
  if (hi > lo && (hi - lo) > 120) mids.push({ y, lo, hi, mid: Math.round((lo + hi) / 2), width: hi - lo })
}
mids.sort((a, b) => a.mid - b.mid)
const median = mids.length ? mids[Math.floor(mids.length / 2)].mid : null
console.log('rows measured:', mids.length, ' median book-base midpoint (spine x):', median)
console.log('sample rows:', JSON.stringify(mids.filter((_, k) => k % 8 === 0)))
