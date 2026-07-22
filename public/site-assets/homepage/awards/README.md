# Homepage — Awards

**Appears on the site:** homepage → "Awards & Press" wall (11 cards, newest first).

**How to swap:** replace a file below with your own, keeping the **exact same filename
and extension**. The card photo frame is **4:3 — 1200×900 fills it perfectly** (the
frame is `object-fit: contain`, so a 4:3 image sits edge-to-edge; a 16:9 image
letterboxes). Each card's title, year and issuer live in the locale files
(`src/locales/*/homeAwards.json`); the image is the only thing you overwrite here.
Push the change to deploy.

> Real award art (award-03·04·05·07·08·10) was refreshed from the client's
> **22 Jul 2026** batch at native **1200×900** so every card fills the 4:3 frame
> (no more letterbox). `award-07` is the Two Star Export House certificate composed
> on the brand navy field (`#0e1b46`) with a thin orange rule, per house treatment.
> Two slots still lack their true image — see `award-06` and `award-09` below.

| File | Award (card title · year · issuer) | Status |
|------|-------------------------------------|--------|
| `award-01.webp` | PrintWeek Power 100 · 2026 · PrintWeek India | ✅ real |
| `award-11.webp` | One of the Most Inspiring Business Leaders · 2025 · Business Connect Magazine | ✅ real |
| `award-02.webp` | Forbes India D.Gems · 2024 · Forbes India | ✅ real |
| `award-03.webp` | Book Education Company of the Year · 2024 · PrintWeek India | ✅ real |
| `award-04.webp` | Excellence in the Field of Education, Runner-Up · 2024 · ASSOCHAM | ✅ real |
| `award-05.webp` | Export Company of the Year · 2023 · PrintWeek India | ✅ real |
| `award-06.webp` | Most Trusted Brand of the Year · 2023 · MSME | 🅿️ **placeholder — the 22 Jul 2026 client batch contained NO MSME image; still awaiting it** |
| `award-07.webp` | Two Star Export House · 2022 · Govt of India | ✅ real (certificate composed on a navy field) |
| `award-08.webp` | Highest Exporter of Printed Books · CAPEXIL | ✅ real |
| `award-09.webp` | One of the Youngest & Most Enterprising Book Presses · 2019 · PrintWeek | 🅿️ **facility stand-in — the 22 Jul batch's "Print Technologies 2019" file is a DIFFERENT award (The Association for PRINT Technologies, to the founder), NOT this PrintWeek honour; still awaiting the correct image** |
| `award-10.webp` | Most Emerging SME, Indian Company · 2016 · Dun & Bradstreet | ✅ real |

> The card **order** (newest first) is set in `src/sections/Awards.jsx`, not by the
> filename number — so `award-11` (Business Connect, 2025) shows in the 2nd position.
