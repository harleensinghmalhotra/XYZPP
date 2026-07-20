// About-page gallery imagery — Pexels mocks (free license, credit-free), awaiting
// client photography. TRIVIALLY SWAPPABLE: drop a new `gallery-NN.webp` in this
// folder (or replace an existing file) and it appears here automatically, in
// filename order. No component edits needed.
const modules = import.meta.glob('./gallery-*.webp', { eager: true, import: 'default' })
export const GALLERY = Object.keys(modules)
  .sort()
  .map((key) => modules[key])
