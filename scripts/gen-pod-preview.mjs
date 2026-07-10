// Generates the placeholder cover face used by the /print-on-demand live book
// preview. Neutral, warm, and title-less so the finish/binding CSS treatments
// (matte / gloss / lay-flat, spine styles) read clearly over it. Swap this file
// in place later with a real cover render — the page path never changes.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/qfp/pod')
mkdirSync(out, { recursive: true })

const W = 660, H = 990
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="cov" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fdfaf4"/>
      <stop offset="0.55" stop-color="#f6efe2"/>
      <stop offset="1" stop-color="#efe6d5"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c89a3c"/>
      <stop offset="0.5" stop-color="#9b7420"/>
      <stop offset="1" stop-color="#836013"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#cov)"/>
  <!-- inner gold rule frame -->
  <rect x="46" y="46" width="${W - 92}" height="${H - 92}" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.9"/>
  <rect x="60" y="60" width="${W - 120}" height="${H - 120}" fill="none" stroke="#9b7420" stroke-width="1" opacity="0.4"/>
  <!-- centred emblem -->
  <g transform="translate(${W / 2}, 360)">
    <circle r="70" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
    <circle r="54" fill="none" stroke="#9b7420" stroke-width="1" opacity="0.5"/>
    <path d="M-30 8 Q0 -30 30 8 M0 -22 L0 12" fill="none" stroke="#0f2444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-30 8 Q0 18 30 8" fill="none" stroke="#0f2444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- title plate -->
  <text x="${W / 2}" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#0f2444" letter-spacing="2">YOUR BOOK</text>
  <text x="${W / 2}" y="590" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#9b7420" letter-spacing="6">A PLACEHOLDER COVER</text>
  <text x="${W / 2}" y="${H - 90}" text-anchor="middle" font-family="monospace" font-size="17" fill="#836013" letter-spacing="4">QUARTERFOLD</text>
</svg>`

await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(resolve(out, 'preview-base.webp'))
console.log('✓ public/qfp/pod/preview-base.webp')
