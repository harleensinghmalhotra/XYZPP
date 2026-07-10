import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = resolve(root, 'public/qfp/products')
const shots = resolve(root, 'shots')
const i = process.argv[2]
const W = 560
const checker = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}"><rect width="100%" height="100%" fill="#b8b8b8"/>${Array.from({length:28},(_,y)=>Array.from({length:28},(_,x)=>(x+y)%2?`<rect x="${x*20}" y="${y*20}" width="20" height="20" fill="#efefef"/>`:'').join('')).join('')}</svg>`
const img = await sharp(resolve(DIR, `product-0${i}.webp`)).resize({ width: W-20, height: W-20, fit: 'inside' }).toBuffer()
const m = await sharp(img).metadata()
await sharp(Buffer.from(checker)).composite([{ input: img, left: (W-m.width)>>1, top: (W-m.height)>>1 }]).png().toFile(resolve(shots, `wwp-one-${i}.png`))
console.log('done', i)
