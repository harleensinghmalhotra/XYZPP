# FINAL 2% — Punch List

Ranked by visual impact. **P0** = anyone notices · **P1** = designers notice · **P2** = only we notice.
Capped at the 10 highest-impact deltas. Recon only — nothing here has been changed.

Legend: **fix type** = `code` / `asset` / `both`.

---

### P0 — 1. Hero type is oversized and top-heavy  · `code`
- **Wrong:** `PRINTING/STORIES` fills ~75% of width and sits pinned to the top of the viewport; feels cramped and shouty.
- **Reference:** ~45% width, vertically centered, generous left/right margins and headroom — calm and editorial.
- **Fix:** [src/sections/Hero.jsx:167,172](src/sections/Hero.jsx#L167-L172) — drop `text-[20vw] md:text-[14vw]` to ~`text-[11vw]` (and mobile ~`16vw`); remove the `mr-[10vw]`/`ml-[10vw]` splay or reduce to ~`4vw`, and let the pin flex-center the block (it already `justify-center`s — the size is what breaks it). Consider capping with `max-w` so it can't run edge-to-edge.

### P0 — 2. Bloom is sparse and under-scaled  · `both`
- **Wrong:** Characters are ~130px, clustered at the gutter/center-bottom, leaving big empty white page areas. The signature "pop-up" moment reads thin.
- **Reference:** Large characters filling **both** pages and spilling **above** the book's top edge; the spread is full.
- **Fix:** [src/sections/Hero.jsx:126-129,213](src/sections/Hero.jsx#L126-L213) — increase base size (`130 + (b.depth-1)*60` → ~`200 + …*90`), widen spread (`b.vx * innerWidth * 0.35` → ~`0.5`; allow positive `vy` so some rise above the book, currently all `*-0.45`). Add 2–4 more `BURST` entries so the spread isn't half-empty. `asset` side: make sure the extra cutouts exist at 2× for crispness.

### P0/P1 — 3. Missing giant "ghost letters" behind the rising book  · `code`
- **Wrong:** During the rise the text just fades to `opacity:0` at `scale:1.15`. Background behind the book is flat navy.
- **Reference:** `PRINTING STORIES` scales into enormous, very faint ghost letters that fill the frame behind the book (canon cp03) — the moment that gives the rise its depth.
- **Fix:** [src/sections/Hero.jsx:105](src/sections/Hero.jsx#L105) — the tween scales only to `1.15` and kills opacity. Either scale `textWrap` to ~`2.8–4` while fading to a low **non-zero** opacity (~`0.06`), or add a dedicated ghost `<div>` layer (z below the book) that scales up and lingers. Right now the ghost simply doesn't exist.

### P1 — 4. SCROLL pill missing  · `code`
- **Wrong:** No scroll affordance anywhere in the hero.
- **Reference:** Persistent translucent, letter-spaced `• SCROLL` pill parked at the book gutter through the whole intro.
- **Fix:** [src/sections/Hero.jsx:160-233](src/sections/Hero.jsx#L160-L233) — add a `pointer-events-none` pill (`rounded-full bg-white/15 backdrop-blur px-6 py-3`, dot + `.label`-style text) absolutely positioned at bottom-center of the pin; fade it out as bloom begins.

### P1 — 5. Seal renders in CAPS with a "PRIPRINTING" text overlap  · `code`
- **Wrong:** The circular badge shows ALL-CAPS and the loop text overlaps into "PRIPRINTING". Two bugs: (a) the seal lives inside the `uppercase` STORIES div so it inherits caps; (b) `<textPath>{text}{text}` renders the already-doubled string ~4× and it crowds/overlaps at the seam.
- **Reference:** lowercase `printing stories`, evenly spaced, clean open ring forming the `O`.
- **Fix:** [src/sections/Hero.jsx:23,32](src/sections/Hero.jsx#L23-L32) — add `normal-case` (or `lowercase`) to the SVG `<text>`; render `{text}` **once**, not `{text}{text}`, and tune `startOffset`/`r` so one pass fills the ring without overlap.

### P1 — 6. Nav is missing the language switch + MENU button  · `both`
- **Wrong:** [src/components/SiteNav.jsx:45-52](src/components/SiteNav.jsx#L45-L52) ends at "Ask for a quote" — no globe/`En`, no `MENU` circle.
- **Reference:** globe + `En` language toggle and a circular `MENU` button on the far right.
- **Fix:** add both to `SiteNav`. `MENU` = bordered circle (`rounded-full border h-11 w-11`) with stacked `ME/NU`; `En` = globe glyph + label. Wire to whatever menu exists (or stub).

### P1 — 7. Nav typography: ALL-CAPS + heavy tracking vs Title Case  · `code`
- **Wrong:** Nav links use `.label` (`text-transform:uppercase; letter-spacing:0.28em`) — reads technical/cramped.
- **Reference:** Title Case, near-normal tracking, larger and lighter.
- **Fix:** [src/components/SiteNav.jsx:46-48](src/components/SiteNav.jsx#L46-L48) — drop `label` for the nav links (keep the casing from the JSX text), set a normal weight/size; reserve `.label` ([src/index.css:64](src/index.css#L64)) for actual eyebrow labels.

### P1 — 8. Bloom characters don't escape the page edges  · `both`
- **Wrong:** Every cutout stays inside the book footprint, clustered center.
- **Reference:** Characters framing the book — blonde-with-speech-bubble bottom-left, seal bottom-right, chef up top — sitting **outside** the page perimeter.
- **Fix:** [src/sections/Hero.jsx:110-133](src/sections/Hero.jsx#L110-L133) — give 3–4 `BURST` entries larger/edge-ward vectors (`|vx|` toward 0.6–0.8, mixed `vy` sign) so they land off the pages. `asset`: the speech-bubble + side characters if not already in the set.

### P1 — 9. Motion timing: sequence too compressed, bloom fires during the rise  · `code`
- **Wrong:** Whole intro happens in ~600px of scroll; stickers are already blooming while the book is still rising and text still readable (phases overlap).
- **Reference:** clean sequence — text fades → book rises into empty ghost field → book settles → **then** bloom.
- **Fix:** [src/sections/Hero.jsx:105-133](src/sections/Hero.jsx#L105-L133) — bloom starts at `0.2` on the timeline while the book tween runs `0→`. Push bloom start to ~`0.5–0.6` (after the rise), and/or lengthen the pin (`height:'220vh'` at [Hero.jsx:149](src/sections/Hero.jsx#L149)) so each phase gets its own scroll room.

### P2 — 10. Book pages don't glow; hand-lettering too contrasty  · `asset`
- **Wrong:** Our page hand-lettering is dark/busy, so pages read grey and flat rather than glowing white against the navy.
- **Reference:** page print is very faint; pages read as bright, softly-glowing paper — high contrast against the bg.
- **Fix:** lower the printed-lettering opacity/contrast in `/alternativ/book_pages.webp` (asset edit), or add a subtle white/warm glow/drop-shadow behind the book so it separates from `#0c2f4a`. Low effort, real lift.

---

**Not on the list (deliberately):** the post-landing section diverges by design (ours → `FOIL BLOCKING · PERFECT BOUND` marquee + "FIVE FORMATS, one press"; canon → "PRINTING SERVICES"). That's content architecture, not a 2% polish delta.
