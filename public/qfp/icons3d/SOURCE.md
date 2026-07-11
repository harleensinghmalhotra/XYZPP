# 3D stat icons — source & processing

The four stat-strip icons are **custom 3D renders by Harry** (navy/gold clay
style, matching Ekta's palette), delivered as JPEGs on a flat light-grey ground
in `FLOW assets/Strip Images/` (`Book.jpeg`, `globe.jpeg`, `box.jpeg`,
`clock.jpeg`).

| File here | Source render | Stat |
|---|---|---|
| `stat-book.webp` | `Book.jpeg` | 400M+ Books Delivered |
| `stat-globe.webp` | `globe.jpeg` | 25+ Countries Across 4 Continents |
| `stat-box.webp` | `box.jpeg` | 1000+ Containers Shipped |
| `stat-clock.webp` | `clock.jpeg` | 98% On-Time Delivery |

## Processing

`scripts/cutout-strip-icons.mjs` removes the flat grey background to true alpha
using the same edge-connected flood-fill as the hero stickers
(`scripts/cutout-bg.mjs`): grey is cleared only where it is connected to the
image border, so the navy/gold subjects (dark/saturated) and the clock's
enclosed cream face survive. It keeps the largest connected component (drops
jpeg-noise specks), feathers + erodes the edge ~1px in pure JS (sharp raw
round-trips on 1-channel buffers shear the data), crops to the alpha bbox with a
small transparent pad, and exports WebP with alpha.

Re-generate with `node scripts/cutout-strip-icons.mjs`. Alpha was verified on a
magenta render (`shots/stats-recon/MAGENTA-check.png`).

_(The previous 3dicons.co CC0 clay icons this replaced have been removed.)_
