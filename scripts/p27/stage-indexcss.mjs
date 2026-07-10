// Build a patch containing ONLY my "PHASE 2.7" hunk of index.css and stage it,
// leaving the other session's line-197 hunk unstaged in the working tree.
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const diff = execSync('git diff HEAD -- src/index.css', { encoding: 'utf8' })
const lines = diff.split('\n')
// header = everything up to the first '@@'
const firstHunk = lines.findIndex(l => l.startsWith('@@'))
const header = lines.slice(0, firstHunk)
// split into hunks
const hunks = []
let cur = null
for (let i = firstHunk; i < lines.length; i++) {
  if (lines[i].startsWith('@@')) { if (cur) hunks.push(cur); cur = [lines[i]] }
  else if (cur) cur.push(lines[i])
}
if (cur) hunks.push(cur)
const mine = hunks.filter(h => h.join('\n').includes('PHASE 2.7'))
if (mine.length !== 1) { console.error('expected exactly 1 mine hunk, got', mine.length); process.exit(1) }
const patch = [...header, ...mine.flat()].join('\n').replace(/\r/g, '') + '\n'
writeFileSync('scripts/p27/indexcss-mine.patch', patch)
console.log('patch built, applying to index...')
execSync('git apply --cached --unidiff-zero scripts/p27/indexcss-mine.patch', { stdio: 'inherit' })
console.log('staged my index.css hunk')
