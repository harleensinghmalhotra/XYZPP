# About — Team

**Appears on the site:** /about (Our Story) → "Our Team" — six **split cards** in a 3-up grid
(2 per row on touch / phone). Each card is a photo zone on top (the 3:4 portrait, greyscale) and
an always-visible navy text panel below (name, gold-mono title, a 2-line bio preview clamped to a
whole line with a soft bottom fade). All six cards are one fixed height. On hover (desktop) the
photo warms greyscale → colour and scales 1.02, and the panel auto-scrolls its full text (bio →
quote) at ~28px/s with 800ms pauses, looping while hovered and easing back on mouse-out; text that
already fits is centred with no scroll. No card ever changes size on hover (no clipped words). On
touch, tapping a card expands its panel to the full text (reflowing the grid — mobile only), and a
second tap collapses it. The tall cards mean row 1 fills a 1536×743 screen and row 2 is a short
scroll.

Names / titles / bios / quotes live in `src/locales/<lang>/ourStory.json` (`team.members`).
Card order matches that array and `TEAM_SLUGS` in `src/pages/OurStory.jsx`.

## Photos

Each webp is **one honest crop — no padding, no blur, no vignette, no added effect**. All six are
cropped to **3:4** (width:height), object-fit: cover from the original, anchored to the subject's
face / upper body (never cutting heads or hands). Output **720×960 WebP, quality 85, in colour** —
greyscale is applied by CSS (a filter), not baked into the file. Six files, identical dimensions,
identical treatment. To replace one, drop a face-anchored 3:4 crop at the same filename.
(`placeholder-portrait.svg` is a safety net used only if a file is missing.)

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
