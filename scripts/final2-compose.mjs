import sharp from 'sharp'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
const O='recon/final-2/ours', C='recon/co-review/shots'
const outDir='recon/final-2/pairs'; mkdirSync(outDir,{recursive:true})
// [ours, canon, name] paired by visual phase
const pairs=[
 [`${O}/step-00-rest.png`, `${C}/CANON_cp00_y0.png`, '01-rest'],
 [`${O}/step-01-y98.png`,  `${C}/CANON_cp01_y350.png`,'02-early-fade'],
 [`${O}/step-02-y238.png`, `${C}/CANON_cp02_y700.png`,'03-mid-rise'],
 [`${O}/step-03-y400.png`, `${C}/CANON_cp03_y850.png`,'04-ghost'],
 [`${O}/step-06-y843.png`, `${C}/CANON_cp05_y1150.png`,'05-bloom-peak'],
 [`${O}/step-08-y1142.png`,`${C}/CANON_landing_y1650.png`,'06-landing'],
]
const W=920
for(const [a,b,name] of pairs){
  const gap=16
  const la=await sharp(a).resize(W).png().toBuffer()
  const lb=await sharp(b).resize(W).png().toBuffer()
  const ma=await sharp(la).metadata(), mb=await sharp(lb).metadata()
  const h=Math.max(ma.height,mb.height)
  await sharp({create:{width:W*2+gap,height:h,channels:4,background:{r:20,g:30,b:48,alpha:1}}})
    .composite([{input:la,left:0,top:0},{input:lb,left:W+gap,top:0}])
    .png().toFile(resolve(outDir,name+'.png'))
  console.log('pair',name)
}
