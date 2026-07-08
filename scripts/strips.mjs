// Build side-by-side comparison strips for the hero scroll study.
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const S = (f) => resolve(root, 'shots', f)
const TW = 360, TH = 225, GAP = 10, BG = { r: 12, g: 11, b: 10, alpha: 1 }

async function strip(frames, outName, labelPrefix) {
  const n = frames.length
  const W = n * TW + (n + 1) * GAP
  const H = TH + 2 * GAP
  const thumbs = await Promise.all(
    frames.map((f) => sharp(S(f)).resize(TW, TH, { fit: 'cover' }).png().toBuffer()),
  )
  const composites = thumbs.map((buf, i) => ({ input: buf, left: GAP + i * (TW + GAP), top: GAP }))
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
    .composite(composites)
    .png()
    .toFile(S(outName))
  console.log('✓', outName, `(${labelPrefix}: ${frames.join(', ')})`)
}

// reference: real hero frames (000-004 were the preloader) → y80..y400
await strip(
  ['alt-scroll-006.png', 'alt-scroll-008.png', 'alt-scroll-010.png', 'alt-scroll-012.png', 'alt-scroll-014.png', 'alt-scroll-016.png'],
  'STRIP-1-reference.png', 'reference y80-480',
)
// ours BEFORE: y0..y200
await strip(
  ['old-scroll-000.png', 'old-scroll-001.png', 'old-scroll-002.png', 'old-scroll-003.png', 'old-scroll-004.png', 'old-scroll-005.png'],
  'STRIP-2-ours-old.png', 'ours-old y0-200',
)
// ours AFTER: y0..y200
await strip(
  ['new-scroll-000.png', 'new-scroll-001.png', 'new-scroll-002.png', 'new-scroll-003.png', 'new-scroll-004.png', 'new-scroll-005.png'],
  'STRIP-3-ours-new.png', 'ours-new y0-200',
)
console.log('done')
