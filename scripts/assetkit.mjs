// Shared asset toolkit for the Phase 2.5 asset fill.
//   node scripts/assetkit.mjs duotone <in> <out.webp> <navy|warm> [width]
//   node scripts/assetkit.mjs pexels  <photoId> <out.webp> <navy|warm|none> [width]
// Brand duotone: grayscale+normalise, then multiply a dark stop into the shadows
// and screen a cream stop into the highlights → a true two-tone that reads on-brand
// over navy or cream sections. `none` keeps full colour (book covers/products).
import sharp from 'sharp'

// Brand tone chroma. sharp's .tint() shifts the image's a/b chroma toward this
// colour while PRESERVING luminance — a true tonal duotone (detail stays, hue
// unifies). navy = brand blue; warm = brand amber.
const TINTS = {
  navy: { r: 47, g: 88, b: 150 },
  warm: { r: 150, g: 110, b: 50 },
}

export async function duotone(input, tone = 'navy', width = 1600) {
  const tint = TINTS[tone] || TINTS.navy
  return sharp(input)
    .resize({ width, withoutEnlargement: true })
    .removeAlpha()
    .normalise()
    .linear(1.04, -5)
    .modulate({ brightness: tone === 'warm' ? 1.0 : 0.94 })
    .tint(tint)
}

export async function fetchBuf(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`fetch ${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// Pexels free CDN — no API key needed for direct photo download.
export function pexelsUrl(id, w = 1600) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`
}

async function main() {
  const [cmd, ...a] = process.argv.slice(2)
  if (cmd === 'duotone') {
    const [inp, out, tone = 'navy', width = '1600'] = a
    await (await duotone(inp, tone, +width)).webp({ quality: 86 }).toFile(out)
    console.log('wrote', out)
  } else if (cmd === 'pexels') {
    const [id, out, tone = 'navy', width = '1600'] = a
    const buf = await fetchBuf(pexelsUrl(id, +width))
    if (tone === 'none') await sharp(buf).resize({ width: +width, withoutEnlargement: true }).webp({ quality: 86 }).toFile(out)
    else await (await duotone(buf, tone, +width)).webp({ quality: 86 }).toFile(out)
    console.log('wrote', out)
  } else {
    console.log('usage: duotone <in> <out> <navy|warm> [w] | pexels <id> <out> <navy|warm|none> [w]')
  }
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('assetkit.mjs')) main()
