# About — Team

**Appears on the site:** /about (Our Story) → "Our Team" — a **spotlight**: a six-card grid (3×2,
2-wide on phone) beside one sticky navy panel. Each card is just the 3:4 portrait (greyscale) with
the name + gold-mono title on a bottom gradient — no bios, no quotes, no overlays on cards, ever.
Cards warm greyscale → colour and lift on hover; the **selected** card keeps its colour and wears a
2px gold ring. Clicking a card fills the panel with that person in full: name (Inter Tight), title
(gold mono), full bio (cream), quote (italic, gold left rule) — always complete, never truncated.
Every person's block is stacked in the same panel cell, so the panel's height is fixed to the
longest person and never jumps; the outgoing block fades down 12px while the incoming fades up
(250ms). Default selection is the first card, Sameer Kazi. On phone (<768px) the grid sits on top
and the panel below it (not sticky); tapping a card scrolls the panel into view.

Names / titles / bios / quotes live in `src/locales/<lang>/ourStory.json` (`team.members`).
Card order matches that array and `TEAM_SLUGS` in `src/pages/OurStory.jsx`.

## Photos

Each webp is **one honest crop — no padding, no blur, no vignette, no added effect**. All six are
cropped to **3:4** (width:height) from the original masters, anchored to the TOP of the frame (never
centred vertically): a source wider than 3:4 keeps its full height (head + air above are always
retained) and trims width on the face; a taller source keeps its full width and crops the height
with the window starting ~4% below the top edge; an exact-3:4 source is only resized. Output
**720×960 WebP, quality 85, in colour** — greyscale is applied by CSS (a filter), not baked into the
file. Re-export with `node scripts/reexport-team-photos.mjs` (masters live outside the repo in the
QFP archive's `Leadership Team` folder). To replace one, drop a top-anchored 3:4 crop at the same
filename. (`placeholder-portrait.svg` is a safety net used only if a file is missing.)

| File | Who | Title |
|------|-----|-------|
| `sameer-kazi.webp`         | Sameer Kazi        | Director, Sales |
| `charani-dhankani.webp`    | Charani Dhankani   | Director |
| `dhiresh-verlekar.webp`    | Dhiresh Verlekar   | Head, Procurement |
| `dilip-ramrakhyani.webp`   | Dilip Ramrakhyani  | CFO, Finance Leader |
| `patrick-carrapiett.webp`  | Patrick Carrapiett | President |
| `priyanka-rajpal.webp`     | Priyanka Rajpal    | Head, Human Resources & Administration |

Every card has a title. Charani has a bio but no quote; Priyanka has a quote but no bio — each
reveals cleanly with whatever is present.

> Source masters: the Leadership Team studio shots; Charani uses her high-resolution seated
> portrait. The earlier `team-01.webp … team-06.webp` files are no longer referenced by the site.
