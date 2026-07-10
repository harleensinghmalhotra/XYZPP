import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'recon/what-we-print/cutouts-v2')
const shots = resolve(root, 'shots')
// white-halo test: among semi-transparent EDGE pixels, what fraction are near-white?
// (a bad matte leaves a bright fringe; a clean one has neutral/dark AA)
for (const i of [1,2,3,4,5,6,7,8]) {
  const { data } = await sharp(resolve(SRC, `${i}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let semi=0, whiteFringe=0
  for (let p=0;p<data.length;p+=4){ const a=data[p+3]; if(a>20&&a<230){ semi++; const r=data[p],g=data[p+1],b=data[p+2]; if(Math.min(r,g,b)>232) whiteFringe++ } }
  console.log(`${i}: semiEdgePx=${semi}  whiteFringe%=${(100*whiteFringe/semi).toFixed(1)}`)
}
// zoom crops of 07 + 08 top edges (white/cream subjects) on checker
const checker=(w,h)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#9a9a9a"/>${Array.from({length:Math.ceil(h/14)},(_,y)=>Array.from({length:Math.ceil(w/14)},(_,x)=>(x+y)%2?`<rect x="${x*14}" y="${y*14}" width="14" height="14" fill="#eee"/>`:'').join('')).join('')}</svg>`)
for(const i of [7,8]){
  const img=await sharp(resolve(SRC,`${i}.png`)).extract({left:120,top:60,width:460,height:300}).resize({width:640}).toBuffer()
  const m=await sharp(img).metadata()
  await sharp(checker(m.width,m.height)).composite([{input:img}]).png().toFile(resolve(shots,`v2-edge-${i}.png`))
  console.log('  ✓ v2-edge-'+i+'.png')
}
