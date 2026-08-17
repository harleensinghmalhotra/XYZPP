import sharp from 'sharp'
const PNG = process.argv[2]
const img = sharp(PNG)
const meta = await img.metadata()
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, ch = info.channels
console.log('image', W, 'x', H, 'channels', ch)
const dark = (x, y) => {
  const i = (y * W + x) * ch
  const r = data[i], g = data[i + 1], b = data[i + 2]
  // navy binding: very dark, blue-ish. brightness low.
  const bright = 0.299 * r + 0.587 * g + 0.114 * b
  return bright < 70 && b >= r // dark & not warm (excludes shadows under warm chars)
}
// scan several horizontal bands through the book base; report dark-pixel centroid in central x window
for (const [y0, y1] of [[700, 770], [710, 760], [690, 780]]) {
  const xmin = 600, xmax = 950
  let sum = 0, cnt = 0, lo = 1e9, hi = -1
  const colCount = new Array(xmax - xmin).fill(0)
  for (let y = y0; y <= y1; y++) for (let x = xmin; x < xmax; x++) {
    if (dark(x, y)) { sum += x; cnt++; if (x < lo) lo = x; if (x > hi) hi = x; colCount[x - xmin]++ }
  }
  const centroid = cnt ? Math.round(sum / cnt) : null
  // also find the column with the most dark pixels (thickest part of wedge) near centre
  let best = -1, bestc = -1
  for (let k = 0; k < colCount.length; k++) if (colCount[k] > bestc) { bestc = colCount[k]; best = k + xmin }
  console.log(`band y[${y0}-${y1}] darkPx=${cnt} centroid=${centroid} extent[${lo}-${hi}] mid=${lo<hi?Math.round((lo+hi)/2):null} peakCol=${best}(${bestc})`)
}
