import fs from 'node:fs'
const ORDER = ['__NILESH__','Patrick Carrapiett','Dilip Ramrakhyani','Charani Dhankani','Sameer Kazi','Dhiresh Verlekar','Priyanka Rajpal']
for (const l of ['en','fr','es']) {
  const file = `src/locales/${l}/ourStory.json`
  let txt = fs.readFileSync(file, 'utf8')
  const d = JSON.parse(txt)
  const byName = Object.fromEntries(d.team.members.map(m => [m.name, m]))
  const f = d.founder
  const nilesh = { name: 'Nilesh Dhankani', role: f.role, bio: f.bio, quote: f.quote }
  const newMembers = ORDER.map(n => {
    if (n === '__NILESH__') return nilesh
    const m = { ...byName[n] }
    if (n === 'Charani Dhankani') m.name = 'Charani Khekho Dhankani'
    return m
  })
  if (newMembers.some(m => !m || !m.name)) { console.error(l, 'missing member'); process.exit(1) }
  // serialize the array, re-indent every line but the first by +4 spaces so it aligns under "members": [
  const arrStr = JSON.stringify(newMembers, null, 2).split('\n').map((ln,i)=> i===0 ? ln : '    ' + ln).join('\n')
  // splice: replace the array value after "members": with arrStr
  const key = '"members": '
  const ki = txt.indexOf(key)
  const start = txt.indexOf('[', ki)
  let i = start, depth = 0, end = -1
  for (; i < txt.length; i++) { if (txt[i]==='[') depth++; else if (txt[i]===']'){ depth--; if(depth===0){ end=i; break } } }
  const out = txt.slice(0, start) + arrStr + txt.slice(end + 1)
  JSON.parse(out) // validate
  fs.writeFileSync(file, out)
  const names = JSON.parse(out).team.members.map(m=>m.name)
  console.log(l, 'OK →', names.join(' | '))
}
