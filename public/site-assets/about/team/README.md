# About — Team

**Appears on the site:** /about (Our Story) → "Our Team" leadership cards (6 members, 3-up grid).

Names / roles / bios / quotes live in `src/locales/<lang>/ourStory.json` (`team.members`).
Card order matches that array and the slug list in `src/pages/OurStory.jsx` (`TEAM_SLUGS`).

## Photos

Every card shows a real photograph, cropped to a consistent **3:4 portrait** (head and shoulders,
face centred), output at **600×800 WebP, quality 85**. Masters are the Leadership Team studio
shots. To replace one, drop a new file at the **exact filename** below (keep the 3:4 portrait);
it goes live on the next deploy, no code change. (`placeholder-portrait.svg` is a safety net used
only if a file is ever missing.)

| Drop-in file | Who | Copy shown |
|--------------|-----|------------|
| `sameer-kazi.webp`        | Sameer Kazi — Director, Sales        | full: title + bio + quote |
| `charani-dhankani.webp`   | Charani Dhankani                     | bio only (no title, no quote) |
| `dhiresh-verlekar.webp`   | Dhiresh Verlekar — Head, Procurement | full: title + bio + quote |
| `dilip-ramrakhyani.webp`  | Dilip Ramrakhyani                    | photo + name only — title/bio awaiting client copy |
| `patrick-carrapiett.webp` | Patrick Carrapiett                   | photo + name only — title/bio awaiting client copy |
| `priyanka-rajpal.webp`    | Priyanka Rajpal                      | photo + name only — title/bio awaiting client copy |

**Dilip, Patrick and Priyanka** render **photo + full name only**: their `role`, `bio` and
`quote` keys exist as empty strings in every locale, and each card cleanly drops those slots when
empty (no gaps, no "undefined"). When the client supplies their titles and bios, fill the copy
into `team.members` in all three locales (en / fr / es) — no code change needed.

`placeholder-portrait.svg` is the shared fallback and should stay in place.

> The earlier `team-01.webp … team-06.webp` portraits are no longer referenced by the site.
