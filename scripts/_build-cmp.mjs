import s from 'sharp'
const jump = s('FLOW assets/3d scene assets/jumping girl.png').trim({ threshold: 5 })
await s('shots/conveyor-r8c/try2/apex-full.png').extract({ left: 905, top: 95, width: 300, height: 470 }).resize({ height: 560 }).toFile('shots/conveyor-r8c/try2/apex-tight.png')
await s('shots/conveyor-r8c/try2/hold-full.png').extract({ left: 870, top: 315, width: 300, height: 420 }).resize({ height: 520 }).toFile('shots/conveyor-r8c/try2/hold-tight.png')
for (const [name, H] of [['apex', 560], ['hold', 520]]) {
  const src = await jump.clone().resize({ height: H }).flatten({ background: '#17294c' }).toBuffer()
  const mine = await s(`shots/conveyor-r8c/try2/${name}-tight.png`).resize({ height: H }).toBuffer()
  const a = (await s(mine).metadata()).width, c = (await s(src).metadata()).width
  await s({ create: { width: a + c + 24, height: H, channels: 3, background: '#0d1526' } }).composite([{ input: mine, left: 0, top: 0 }, { input: src, left: a + 24, top: 0 }]).png().toFile(`shots/conveyor-r8c/try2/CMP-${name}-tight.png`)
}
const bf = await s('shots/conveyor-r8c/before/standing-full.png').resize({ width: 760 }).toBuffer()
const af = await s('shots/conveyor-r8c/try2/standing-full.png').resize({ width: 760 }).toBuffer()
const bh = (await s(bf).metadata()).height
await s({ create: { width: 760, height: bh * 2 + 16, channels: 3, background: '#0d1526' } }).composite([{ input: bf, left: 0, top: 0 }, { input: af, left: 0, top: bh + 16 }]).png().toFile('shots/conveyor-r8c/BEFORE-AFTER-fullscene.png')
console.log('built')
