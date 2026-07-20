// About-page gallery media — real QFP photography + facility video (Ekta's asset
// drop). TRIVIALLY SWAPPABLE and MEDIA-AGNOSTIC: drop a new `gallery-NN.webp` (or
// `.mp4`) in this folder and it appears here automatically, in filename order. The
// gallery renders images as <img> and video files as <video> with zero edits.
const modules = import.meta.glob('./gallery-*.{webp,mp4}', { eager: true, import: 'default' })
export const GALLERY = Object.keys(modules)
  .sort()
  .map((key) => modules[key])
