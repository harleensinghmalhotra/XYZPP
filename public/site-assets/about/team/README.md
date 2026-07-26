# About — Team

**Appears on the site:** /about (Our Story) → "Our Team" — six compact cards in a 3-up grid
(2 per row on tablet/phone). Each collapsed card shows the portrait, name, title and a 2-line
bio excerpt; a **Read more** toggle expands that card in place (accordion — opening one closes
any other) to reveal the full bio and quote. All six collapsed cards are the same height and the
whole section fits one 1536×743 screen.

Names / titles / bios / quotes live in `src/locales/<lang>/ourStory.json` (`team.members`);
the toggle labels are `team.readMore` / `team.readLess`. Card order matches that array and the
slug list in `src/pages/OurStory.jsx` (`TEAM_SLUGS`).

## Photos

Each webp is the photographer's **full frame, never cropped**. Sources have mixed aspect ratios,
so every image is normalised to a common **2:3 portrait** (the tallest source's shape): the full
photo is centred and any remaining area is filled with the photo's own blurred edge (no subject,
face or hand is ever cropped). Output is **480×720 WebP, quality 85** (≤ 640px wide). The card's
image frame is exactly 2:3, so the webp fills it with no letterbox.

To replace one, drop a new file at the **exact filename** below, keeping the same treatment:
the full photo centred on a 2:3 canvas with the remaining area filled by the photo's own blurred
edge, exported at 480×720 q85. (`placeholder-portrait.svg` is a safety net used only if missing.)

| File | Who | Title |
|------|-----|-------|
| `sameer-kazi.webp`         | Sameer Kazi        | Director, Sales |
| `charani-dhankani.webp`    | Charani Dhankani   | Director |
| `dhiresh-verlekar.webp`    | Dhiresh Verlekar   | Head, Procurement |
| `dilip-ramrakhyani.webp`   | Dilip Ramrakhyani  | CFO, Finance Leader |
| `patrick-carrapiett.webp`  | Patrick Carrapiett | President |
| `priyanka-rajpal.webp`     | Priyanka Rajpal    | Head, Human Resources & Administration |

Every card has a title. Charani has a bio but no quote; Priyanka has a quote but no bio — each
still renders at the uniform collapsed height, and Read more simply reveals whatever is present.

`placeholder-portrait.svg` is the shared fallback and should stay in place.

> Source masters: the Leadership Team studio shots; Charani uses her high-resolution seated
> portrait. The earlier `team-01.webp … team-06.webp` files are no longer referenced by the site.
