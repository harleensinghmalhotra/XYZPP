# Site assets — the overwrite-to-swap image library

Every photo, video and logo on the Quarterfold website lives in this folder tree,
organised by the page it appears on. **To change a visual, replace the matching
file here with your own — keeping the exact same filename and extension** — then
push the change (or upload it through GitHub in the browser). It goes live on the
next deploy. No code edits, no developer needed.

## The three rules
1. **Same name, same extension.** `hero-main.webp` must stay `hero-main.webp`. A
   `.jpg` renamed to `.webp` (or the reverse) will **not** show.
2. **Match the size** where a folder's README lists one — it keeps the layout tidy.
3. **One file = one spot.** Each folder's README says exactly where each file
   appears on the site and shows its current pixel size.

## Where everything lives (by page)

| Page (URL) | Folder(s) that feed it |
|---|---|
| Homepage `/` | `homepage/hero`, `homepage/stat-icons`, `homepage/products`, `homepage/globe`, `homepage/video`, `homepage/process`, `homepage/destinations`, `homepage/facility-book`, `homepage/certifications`, `homepage/awards`, `homepage/cases` *(hidden)* |
| Our Story `/about` | `about/founder`, `about/team`, `about/timeline`, `about/gallery` |
| Infrastructure `/infrastructure` | `infrastructure/awards`, `infrastructure/certs`, `infrastructure/facility`, `infrastructure/gallery`, `homepage/facility-book` *(the book)*, `infrastructure/video` *(pending)* |
| Print on Demand `/print-on-demand` | `print-on-demand` |
| Fulfilment `/fulfilment` | `fulfilment` |
| Contact `/contact` | `contact` |
| **Every** page | `homepage/brand` — the nav + footer logo |

## Two things that are NOT folder-swappable

- **Newsroom `/newsroom`** — articles (text **and** images) are managed in the
  **Sanity Studio**, not here. The `newsroom/` folder holds legacy/source files
  only; dropping files there does nothing to the live site.
- **Some pages have no photos at all** — Global Markets, Founder and CSR are built
  from text, colour and vector art, so there is nothing to swap.

## Folders marked "reference / not used"

A few folders keep look-alike copies that the site does not read; their README says
so plainly (e.g. `infrastructure/binding/` → the live photos are actually in
`homepage/facility-book/`). Overwriting a "reference" file changes nothing — swap
the file the README points you to instead. Likewise a handful of individual files
are marked **⚠️ not used** (e.g. `contact/map.webp`) — safe to ignore.
