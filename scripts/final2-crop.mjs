import sharp from 'sharp'
import { resolve } from 'node:path'
const O = 'recon/final-2/ours'
const C = 'recon/co-review/shots'
const cropDir = 'recon/final-2/crops'
import { mkdirSync } from 'node:fs'
mkdirSync(cropDir, { recursive: true })
async function meta(p){const m=await sharp(p).metadata();return [m.width,m.height]}
// bloom peak crops - center book region
for (const [src,name] of [
  [`${O}/step-05-y695.png`,'ours-bloom'],
  [`${O}/step-06-y843.png`,'ours-bloom6'],
  [`${C}/CANON_cp05_y1150.png`,'canon-bloom'],
  [`${C}/CANON_y1300.png`,'canon-land'],
]){
  const [w,h]=await meta(src)
  await sharp(src).extract({left:Math.round(w*0.25),top:Math.round(h*0.3),width:Math.round(w*0.5),height:Math.round(h*0.65)}).resize(700).toFile(resolve(cropDir,name+'.png'))
  console.log(name,w,h)
}
