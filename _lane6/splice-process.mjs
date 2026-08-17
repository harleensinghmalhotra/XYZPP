import fs from 'node:fs'
for (const l of ['en','fr','es']) {
  const file = `src/locales/${l}/homeProcess.json`
  let txt = fs.readFileSync(file, 'utf8')
  const before = JSON.parse(txt)
  const droppedBadges = before.badges.slice(3).map(b => `${b.lead} ${b.sub}`)
  // 1) remove the "steps": [ ... ], line-block
  const sKey = txt.indexOf('"steps": [')
  let i = txt.indexOf('[', sKey), depth = 0, sEnd = -1
  for (; i < txt.length; i++) { if (txt[i]==='[') depth++; else if (txt[i]===']'){ depth--; if(depth===0){ sEnd=i; break } } }
  const lineStart = txt.lastIndexOf('\n', sKey) + 1
  let after = sEnd + 1
  if (txt[after] === ',') after++
  if (txt[after] === '\n') after++
  txt = txt.slice(0, lineStart) + txt.slice(after)
  // 2) truncate badges to first 3, keeping the inline-object style
  const kept = before.badges.slice(0, 3)
  const badgesStr = '[\n' + kept.map(b => `    { "lead": ${JSON.stringify(b.lead)}, "sub": ${JSON.stringify(b.sub)} }`).join(',\n') + '\n  ]'
  const bKey = txt.indexOf('"badges": ')
  const bStart = txt.indexOf('[', bKey)
  let j = bStart, bd = 0, bEnd = -1
  for (; j < txt.length; j++) { if (txt[j]==='[') bd++; else if (txt[j]===']'){ bd--; if(bd===0){ bEnd=j; break } } }
  txt = txt.slice(0, bStart) + badgesStr + txt.slice(bEnd + 1)
  const out = JSON.parse(txt)
  fs.writeFileSync(file, txt)
  console.log(`${l}: steps removed=${!('steps' in out)}, badges kept=${out.badges.length} [${out.badges.map(b=>b.lead).join(' | ')}], dropped=[${droppedBadges.join(' | ')}]`)
}
