// About gallery media, in display order — served from the readable asset tree at
// public/site-assets/about/gallery/. Public URLs (not bundler imports), so a
// straight file overwrite (same name) swaps the asset with no rebuild-rename.
// The gallery renders .webp as <img> and .mp4 as <video> (media-agnostic);
// facility-tour.mp4 is the lightbox's 11th item. Reorder/add by editing this list.
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
]
