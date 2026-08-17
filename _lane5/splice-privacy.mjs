import fs from 'node:fs'
for (const l of ['en','fr','es']) {
  const file = `src/locales/${l}/legal.json`
  const frag = fs.readFileSync(`_lane5/privacy-${l}.txt`, 'utf8').replace(/\n$/, '')
  let txt = fs.readFileSync(file, 'utf8')
  const start = txt.indexOf('  "privacy": {')
  if (start < 0) { console.error(l, 'no privacy marker'); process.exit(1) }
  let i = txt.indexOf('{', start), depth = 0, end = -1
  for (; i < txt.length; i++) { if (txt[i]==='{') depth++; else if (txt[i]==='}') { depth--; if (depth===0){ end=i; break } } }
  const out = txt.slice(0, start) + frag + txt.slice(end + 1)
  JSON.parse(out) // validate
  fs.writeFileSync(file, out)
  const d = JSON.parse(out)
  const heads = d.privacy.sections.map(s=>s.h)
  console.log(l, 'OK — privacy sections:', heads.length, '| cookies present:', 'cookies' in d, '| terms present:', 'terms' in d)
}
