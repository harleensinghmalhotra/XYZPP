// Central asset registry. Every path maps to a file under /assets that is
// replaced in place with real media later — no import site ever changes.
import bookHero from '@assets/hero/book-hero.png'
import heroPoster from '@assets/hero/poster.webp'

// transparent cutouts (white bg removed via rembg)
import pencil from '@assets/elements/pencil-cut.png'
import atlas from '@assets/elements/atlas-cut.png'
import star from '@assets/elements/star-cut.png'
import blocks from '@assets/elements/blocks-cut.png'
import inkdrop from '@assets/elements/inkdrop-cut.png'
import ruler from '@assets/elements/ruler-cut.png'
import plane from '@assets/elements/plane-cut.png'
import owl from '@assets/elements/owl-cut.png'

// hero book-opening frame sequence (WebP), sorted by filename
const frameGlob = import.meta.glob('../../assets/hero/frames/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})
export const heroFrames = Object.keys(frameGlob)
  .sort()
  .map((k) => frameGlob[k])
export { heroPoster }

import coverEducational from '@assets/covers/cover-educational.png'
import coverChildren from '@assets/covers/cover-children.png'
import coverNovel from '@assets/covers/cover-novel.png'
import coverHardcase from '@assets/covers/cover-hardcase.png'
import coverExercise from '@assets/covers/cover-exercise.png'

import heroVideo from '@assets/videos/hero.mp4'
import pressVideo from '@assets/videos/press.mp4'
import pagesVideo from '@assets/videos/pages.mp4'

export { bookHero, heroVideo, pressVideo, pagesVideo }

// Ordered for the floating hero constellation. `mobile` marks the 4 kept ≤640px.
export const elements = [
  { key: 'pencil', src: '/alternativ/638a339426bd37a4c51a546f_graphs-wf_book-intro1.webp', alt: 'Alternativ Graph 1', mobile: true },
  { key: 'atlas', src: '/alternativ/638a33952a790c598a81e611_graphs-wf_book-intro2.webp', alt: 'Alternativ Graph 2', mobile: true },
  { key: 'star', src: '/alternativ/638a3395251e5636765267d1_graphs-wf_book-intro3.webp', alt: 'Alternativ Graph 3', mobile: false },
  { key: 'blocks', src: '/alternativ/638a339464bf2baeb7343201_graphs-wf_book-intro4.webp', alt: 'Alternativ Graph 4', mobile: true },
  { key: 'inkdrop', src: '/alternativ/63909e9723b5302a3e916701_graphs-wf_book-intro5.webp', alt: 'Alternativ Graph 5', mobile: false },
  { key: 'ruler', src: '/alternativ/63909e975e921fd51873d41c_graphs-wf_book-intro6.webp', alt: 'Alternativ Graph 6', mobile: false },
  { key: 'plane', src: '/alternativ/63909e977507a17972c39266_graphs-wf_book-intro7.webp', alt: 'Alternativ Graph 7', mobile: true },
  { key: 'owl', src: '/alternativ/63909e97c64d6c15b390fa23_graphs-wf_book-intro8.webp', alt: 'Alternativ Graph 8', mobile: false },
]

export const covers = [
  { key: 'educational', src: coverEducational, label: 'Educational', tint: '#00AEEF', spec: 'Perfect bound · 4C offset' },
  { key: 'children', src: coverChildren, label: "Children's", tint: '#FFC800', spec: 'Board book · matte laminate' },
  { key: 'novel', src: coverNovel, label: 'Novels', tint: '#EC008C', spec: 'Paperback · 80gsm cream' },
  { key: 'hardcase', src: coverHardcase, label: 'Hardcase', tint: '#C9A24B', spec: 'Case bound · gold foil' },
  { key: 'exercise', src: coverExercise, label: 'Exercise', tint: '#A9814E', spec: 'Saddle stitch · kraft' },
]
