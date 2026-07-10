import fs from 'fs'
import crypto from 'crypto'
import path from 'path'

const SRC = 'D:/WEBSITES/QFP/EKTA DOCS/qfp-homepage-v17.html'
const OUT = 'recon/qfp-assets'
const html = fs.readFileSync(SRC, 'utf8')

// ---- dimension parsers (no deps) ----
function pngSize(b){ return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) } }
function jpgSize(b){
  let p = 2
  while (p < b.length){
    if (b[p] !== 0xFF){ p++; continue }
    const m = b[p+1]
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC){
      return { h: b.readUInt16BE(p+5), w: b.readUInt16BE(p+7) }
    }
    p += 2 + b.readUInt16BE(p+2)
  }
  return { w: 0, h: 0 }
}

// nearest preceding <!-- COMMENT --> for section attribution
function sectionAt(idx){
  const before = html.slice(0, idx)
  const m = [...before.matchAll(/<!--\s*([^>]*?)\s*-->/g)]
  return m.length ? m[m.length-1][1].replace(/\s*—.*$/,'').trim() : '(none)'
}

const slug = s => (s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42) || 'img'

// match every img carrying a data URI (capture whole tag for alt/class), then background urls
const results = []
const seen = new Map()
let n = 0

const imgRe = /<img\b[^>]*?src="(data:image\/([a-z+]+);base64,([A-Za-z0-9+/=]+))"[^>]*>/g
let mm
while ((mm = imgRe.exec(html))){
  const [tag,, fmt, b64] = mm
  const alt = (tag.match(/alt="([^"]*)"/)||[])[1] ?? ''
  const cls = (tag.match(/class="([^"]*)"/)||[])[1] ?? ''
  const prodNum = (html.slice(mm.index-90, mm.index).match(/prod-num">(\d+)</)||[])[1]
  results.push({ idx: mm.index, kind:'img', fmt, b64, alt, cls, prodNum, section: sectionAt(mm.index) })
}
const bgRe = /background(?:-image)?:\s*url\((data:image\/([a-z+]+);base64,([A-Za-z0-9+/=]+))\)/g
while ((mm = bgRe.exec(html))){
  const [, , fmt, b64] = mm
  results.push({ idx: mm.index, kind:'bg', fmt, b64, alt:'(background-image)', cls:'', section: sectionAt(mm.index) })
}
results.sort((a,b)=>a.idx-b.idx)

const rows = []
for (const r of results){
  n++
  const buf = Buffer.from(r.b64, 'base64')
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0,8)
  const ext = r.fmt === 'jpeg' ? 'jpg' : r.fmt
  const dim = r.fmt === 'png' ? pngSize(buf) : jpgSize(buf)
  let base
  if (r.prodNum) base = `product-${r.prodNum}-${slug(r.alt)}`
  else if (/HERO/i.test(r.section)) base = `hero-${slug(r.alt)}`
  else if (/NAV/i.test(r.section)) base = `nav-${slug(r.alt)}`
  else if (/PROCESS|HOW WE WORK/i.test(r.section)) base = `process-${slug(r.alt)}`
  else if (/PROJECT/i.test(r.section)) base = `worldmap-dots`
  else if (/CERT/i.test(r.section)) base = `cert-${slug(r.alt)}-${hash}`
  else if (/FOOTER/i.test(r.section)) base = `footer-${slug(r.alt)}-${hash}`
  else base = `${slug(r.section)}-${slug(r.alt)}`
  let file = `${String(n).padStart(2,'0')}_${base}.${ext}`
  const dupOf = seen.get(hash)
  if (!dupOf) { fs.writeFileSync(path.join(OUT, file), buf); seen.set(hash, file) }
  rows.push({ n, file, dupOf: dupOf||'', kb:(buf.length/1024).toFixed(1), fmt:ext, w:dim.w, h:dim.h, section:r.section, alt:r.alt, cls:r.cls })
}
console.log(JSON.stringify(rows, null, 1))
console.log('TOTAL data-uri occurrences:', n, '| unique files written:', seen.size)
