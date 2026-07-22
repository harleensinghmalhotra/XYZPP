// About gallery media, in display order — served from the readable asset tree at
// public/site-assets/about/gallery/. Public URLs (not bundler imports), so a
// straight file overwrite (same name) swaps the asset with no rebuild-rename.
// The gallery renders .webp as <img> and .mp4 as <video> (media-agnostic).
// The preview grid shows the first 6 tiles (all stills); the "See More" lightbox
// walks the FULL list, videos included. Reorder/add by editing this list.
//
// Items 1–11 are the original set (10 stills + the facility tour). Items 12–14 are
// the real machine/factory media appended after them: a digital print-on-
// demand press still, the web-offset press running, and the automated binding line.
const BASE = '/site-assets/about/gallery'
export const GALLERY = [
  `${BASE}/gallery-01.webp`,
  `${BASE}/gallery-02.webp`,
  `${BASE}/gallery-03.webp`,
  `${BASE}/gallery-04.webp`,
  `${BASE}/gallery-05.webp`,
  `${BASE}/gallery-06.webp`,
  `${BASE}/gallery-07.webp`,
  `${BASE}/gallery-08.webp`,
  `${BASE}/gallery-09.webp`,
  `${BASE}/gallery-10.webp`,
  `${BASE}/facility-tour.mp4`,
  `${BASE}/gallery-11.webp`,   // digital print-on-demand press
  `${BASE}/web-press.mp4`,     // web-offset press running (Cityline)
  `${BASE}/binding-line.mp4`,  // automated binding & finishing line
]
