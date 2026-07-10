import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const OUT = 'public/qfp/live'
mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['home', 'https://quarterfoldltd.com/'],
  ['about-us', 'https://quarterfoldltd.com/portfolio/about-us/'],
  ['educational-books', 'https://quarterfoldltd.com/portfolio/educational-books/'],
  ['infrastructure', 'https://quarterfoldltd.com/portfolio/infrastructure/'],
  ['trade-books', 'https://quarterfoldltd.com/portfolio/trade-books/'],
  ['print-on-demand', 'https://quarterfoldltd.com/portfolio/print-on-demand/'],
  ['warehousing-fulfilment', 'https://quarterfoldltd.com/portfolio/warehousing-fulfilment/'],
]

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' })
const page = await ctx.newPage()

const found = new Map() // url -> {pages:Set, alt}
for (const [name, url] of PAGES) {
  try {
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }) } catch (e) { console.log(`    (goto warn: ${e.message.split('\n')[0]})`) }
    try { await page.waitForLoadState('networkidle', { timeout: 10000 }) } catch {}
    await page.waitForTimeout(2500)
    // lazy-load: scroll through
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 150)) }
      window.scrollTo(0, 0)
    }).catch(() => {})
    await page.waitForTimeout(800)
    const urls = await page.evaluate(() => {
      const set = []
      const push = (u, alt) => { if (u) set.push({ u, alt: alt || '' }) }
      document.querySelectorAll('img').forEach((img) => {
        let best = img.currentSrc || img.src
        if (img.srcset) {
          const cand = img.srcset.split(',').map(s => s.trim().split(' ')).map(([u, w]) => ({ u, w: parseInt(w) || 0 }))
          const top = cand.sort((a, b) => b.w - a.w)[0]
          if (top && top.w) best = top.u
        }
        push(best, img.alt)
      })
      document.querySelectorAll('*').forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage
        const m = bg && bg.match(/url\(["']?(.*?)["']?\)/)
        if (m && m[1] && !m[1].startsWith('data:')) push(m[1], '')
      })
      return set
    })
    for (const { u, alt } of urls) {
      let abs
      try { abs = new URL(u, url).href } catch { continue }
      if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(abs)) continue
      if (/data:|\.svg/i.test(abs)) continue
      const rec = found.get(abs) || { pages: new Set(), alt }
      rec.pages.add(name)
      if (!rec.alt && alt) rec.alt = alt
      found.set(abs, rec)
    }
    console.log(`  ${name}: ${urls.length} refs`)
  } catch (e) { console.log(`  ${name}: FAILED ${e.message}`) }
}
await browser.close()

console.log(`\nunique image URLs: ${found.size}\ndownloading + webp…`)
const hashes = new Map()
const rows = []
let idx = 0
for (const [url, rec] of found) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) { console.log('  skip', res.status, url.slice(-40)); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 2500) continue // icons/spacers
    const h = createHash('md5').update(buf).digest('hex').slice(0, 8)
    if (hashes.has(h)) continue
    let img = sharp(buf)
    const meta = await img.metadata()
    if ((meta.width || 0) < 200 || (meta.height || 0) < 150) continue // tiny/logos
    hashes.set(h, true)
    const base = (url.split('/').pop() || 'img').split('?')[0].replace(/\.[a-z]+$/i, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase().slice(0, 40)
    const fname = `${String(++idx).padStart(2, '0')}-${base}.webp`
    await sharp(buf).resize({ width: Math.min(meta.width, 1800), withoutEnlargement: true }).webp({ quality: 86 }).toFile(`${OUT}/${fname}`)
    rows.push({ fname, pages: [...rec.pages].join(','), dims: `${meta.width}x${meta.height}`, alt: rec.alt.slice(0, 60), url })
    process.stdout.write('.')
  } catch (e) { /* skip broken */ }
}

// subject guess from alt/filename
const guess = (r) => {
  const s = (r.alt + ' ' + r.fname.replace(/\.webp$/, '').replace(/^\d+-/, '')).toLowerCase()
  if (/press|machin|tower|sheet-?fed|offset|lineomat|printing/.test(s)) return 'machine'
  if (/warehous|logist|contain|pallet|ship|fulfil|forklift/.test(s)) return 'logistics'
  if (/book|textbook|notebook|diary|cover|read/.test(s)) return 'books'
  if (/award|forbes|print week|capexil|assocham|certif|fsc|iso/.test(s)) return 'awards/certs'
  if (/team|people|staff|worker|hand|founder|nilesh/.test(s)) return 'people'
  if (/facilit|factory|plant|infra|building/.test(s)) return 'facility'
  return 'misc'
}
rows.forEach(r => r.subject = guess(r))

let md = '# QFP Live-Site Assets — scraped\n\n'
md += `Source: quarterfoldltd.com (7 pages) · deduped by content hash · converted to webp.\nSaved to \`public/qfp/live/\`. Total: ${rows.length} images.\n\n`
md += '| filename | source page(s) | dims | subject | alt |\n|---|---|---|---|---|\n'
for (const r of rows.sort((a, b) => a.subject.localeCompare(b.subject))) {
  md += `| ${r.fname} | ${r.pages} | ${r.dims} | ${r.subject} | ${r.alt.replace(/\|/g, '/')} |\n`
}
writeFileSync('recon/qfp-live-assets.md', md)
console.log(`\n\nwrote ${rows.length} images → ${OUT}/`)
console.log('inventory → recon/qfp-live-assets.md')
const bySubject = {}
rows.forEach(r => bySubject[r.subject] = (bySubject[r.subject] || 0) + 1)
console.log('by subject:', JSON.stringify(bySubject))
