# What We Print — Card Recon

**RECON ONLY. No code was changed.** Diagnoses why our cards fail vs the Alternativ
original. Evidence scripts: `scripts/recon-cutout-damage.mjs`, `scripts/recon-proof.mjs`,
`scripts/recon-measure.mjs`, `scripts/recon-zones.mjs`. Proof images in `shots/recon-*`.
Measured on the live build at 1536×743 DPR 1.25.

---

## TOP 3 FINDINGS

1. **The striping is self-inflicted, and it is unfixable by us.** Harry's 8 files are **opaque
   white-background renders, not cutouts** (700×560, zero alpha). Our `cutout-bg.mjs` white-key
   flood destroyed **8–21% of real subject content** per image (avg ~13%) — it cannot tell a
   white *book cover* from the white *background*, so every light/white cover and the white
   page-edges of flat stacks get cut into stripes and holes (General: 21% destroyed + 7.8%
   striping — see `shots/recon-srcvscut-4.png`). **No threshold ever fixes this.** We need
   **true PNG-alpha exports from Harry** (Canva "remove background" outputs real alpha).

2. **Ours reads flat mainly because the *subjects* are wrong, not the overhang.** Alternativ's
   cutouts are **one bold object** (a 3-book cluster, a single tote, a plush dog) in **portrait**
   orientation that rises out of the card like a hero (`recon/alternativ/scroll-039.png`,
   `public/alternativ/…books.webp`). Ours are **8–15 tiny books in a wide landscape pile**
   (aspect 1.5–2.9) that reads as "a photo of a shelf." A wide pile physically *cannot* overhang —
   card **04's image overhang is −2px (it sits *below* the card top)**. Subject density + aspect,
   not shadow tuning, is the primary flatness cause.

3. **Their cutouts carry a baked contact-shadow; ours float.** Their PNG alpha includes a soft
   grounded drop-shadow under the object. Ours is a single diffuse CSS `drop-shadow(0 16px 20px
   navy/.24)` (20px blur) wrapped around a ragged auto-keyed silhouette — so it floats instead of
   sitting. Combined with a **±2.5° rotation** (theirs is **±6–18°**), the dimensional cues are
   all under-dialed.

---

# QUESTION 1 — Why is the transparency striped/ugly?

## 1a. Per-image artifact table

Source = Harry's opaque render (`recon/what-we-print/cutouts-src/N.png`, 700×560).
Cut = our keyed `public/qfp/products/product-0N.webp`.
`destroyed%` = share of **real, non-white** source content the key turned transparent.
`striping%` = share of frame that is transparent **but trapped between opaque pixels on its row**
(the venetian-blind holes). Full-size proofs: `shots/recon-cutouts-all.png` (checker | card).

| # | Category | destroyed% | striping% | Visible artifact | Grade |
|---|---|---|---|---|---|
| 01 | Educational | 14.1 | 3.1 | minor edge nibble on pale covers | **usable** |
| 02 | Trade | 13.1 | 1.5 | clean; slight loss on white notepad | **usable** |
| 03 | Coffee Table | **21.0** | 0.0 | light/cream covers (Kinfolk, Scandinavian) washed to semi-transparent | **poor — washed** |
| 04 | General | **21.4** | **7.8** | white puzzle covers (Crossword/Word Search/Sudoku) cut into horizontal stripes + holes | **broken** |
| 05 | Children's | 8.2 | 4.7 | clean; colour-saturated so keys well | **good** |
| 06 | Learning Kits | 4.6 | 1.1 | cleanest; bright saturated boxes | **good** |
| 07 | Corporate | 6.7 | 2.2 | white annual-report covers slightly nibbled | **usable** |
| 08 | POD | 11.3 | 4.2 | cream/light travel-book spines washed, tops faded | **poor — washed** |

**Pattern:** damage tracks **whiteness of the subject**. Saturated, dark subjects (Learning Kits,
Children's) survive; anything with white/cream/pale covers or white page-edges is eaten. The key
removes *colour-neutral bright* pixels — which is exactly what a white book cover is.

## 1b. Root cause — the key vs the source

The white-key is a **colour classifier with no spatial/model knowledge**. Harry's renders put the
product on **pure white (255,255,255 at all four corners)** with soft grey contact-shadows. Three
failure modes, all inherent:

- **White covers = background.** A `#fff` cover is pixel-identical to `#fff` backdrop. Flood-fill
  connectivity saves *enclosed* covers but not ones touching the backdrop → they dissolve
  (03 Coffee Table, 08 POD washed; 21% destroyed).
- **White page-edges of flat stacks = stripes.** 04's puzzle books lie in a flat stack; the bright
  page-edges between layers are pure white and **open to the border**, so the flood threads through
  them → horizontal transparent stripes (7.8% interior holes). `shots/recon-srcvscut-4.png` shows
  it exactly: dark covers survive, white/light covers shredded.
- **Soft shadow = grey halo or over-erosion.** Removing the grey shadow risks eating light covers;
  keeping it leaves grey blocks. Every threshold trades one artifact for the other.

## 1c. VERDICT — can white-keying ever be clean here?

**No. Not from these sources. Ever.** The sources are opaque renders where subject-white and
background-white are the same pixels; separating them is ill-posed for any colour key (proven:
6 parameter passes, best case still 4.6–21% destroyed). This is a **matting** problem — it needs
an alpha-aware model, which is what Canva's background remover already runs.

### What Harry should export (zero-artifact drop-in)

| Field | Spec |
|---|---|
| **Format** | **PNG with real alpha** (RGBA). Export straight from Canva **"Remove background"** → Download → **PNG** with **"transparent background" checked**. Not JPG, not "white background". |
| **Verify** | Open the PNG on a dark/checker slide — the area around and *between* the books must be a checkerboard, not white. If it's white, the alpha wasn't kept. |
| **Resolution** | ~**1000–1400px on the long edge**, trimmed to the subject (little margin). We downscale to WebP; more pixels = cleaner edges. |
| **Filenames** | Keep `1.png … 8.png` (same category order). We convert to `product-0N.webp` — the site swaps with **zero code change**. |
| **Subject style (the important one)** | **One bold hero arrangement of 3–5 large books, portrait/upright, angled** — like the reference. **Not** a wide flat pile of 10–15 small books. Fewer, bigger, taller, tilted. This fixes both the matting *and* the flatness (Q2). |
| **Shadow** | Fine either way — a soft baked contact-shadow in the PNG grounds it (like Alternativ's), or none and we add CSS. Do **not** bake a hard white plate. |

If Harry can only give white-background renders, we cannot ship clean cutouts — full stop.

---

# QUESTION 2 — Why doesn't it feel 3D like Alternativ?

## 2a. Measurement table — theirs vs ours

Theirs: measured from the cutout assets (`public/alternativ/*.webp`), the reconstructed measured
Webflow spec (`src/sections/PrintingServices.jsx`), and frame `recon/alternativ/scroll-039.png`
(live site timed out at capture). Ours: measured on the live build (`scripts/recon-measure.mjs`).

| Dimension | **Alternativ (theirs)** | **Ours** | Delta |
|---|---|---|---|
| Card width | 300px | 300px | = |
| Card radius | **48px** | 22px | ours tighter |
| Card bg / section bg | `#f3fafd` (cool light-blue) / `#fffffc` | `#FDFAF4` (warm cream) / `#F0EBE0` | both separate OK |
| **Subject** | **1 bold object / ≤3 books, portrait** | **8–15 books, landscape pile** | **root cause** |
| Cutout aspect | **~0.87–1.06 (portrait/square)** | **1.5–2.9 (wide)** | **root cause** |
| Image width vs card | ~92–95% | ~102% | ~= |
| **Overhang above card top** | **~70–115px ≈ 25–30% of card H, consistent** | **−2 → 101px (−0.7% → 28.5%), erratic** | ours inconsistent; 04 = none |
| **Rotation** | **±6° to ±18°** | **±2.5°** | **ours ~4–7× too flat** |
| Shadow | **baked soft contact-shadow in PNG alpha (grounded)** | CSS `drop-shadow 0 16px 20px navy/.24` (20px blur, floats) | ours diffuse & ungrounded |
| Image-bottom → label gap | generous, consistent | 38px, consistent | ~= |
| Alpha quality | true clean cutout | auto-keyed, striped/washed | ours dirty |

Our per-card overhang (live): 01 **24.2%**, 02 19.2%, 03 **28.5%**, 04 **−0.7%**, 05 18.9%,
06 27.0%, 07 21.7%, 08 18.8%.

## 2b. Diagnosis — the specific deltas (hypotheses tested)

- **"Their overhang is more dramatic" — PARTLY TRUE.** Our *best* cards hit 24–28%, matching
  theirs. But ours is **erratic (−0.7% to 28.5%)** and a wide subject **can't** overhang at all
  (04). Theirs is uniformly 25–30% because every subject is tall. So the fault is **inconsistency
  + landscape aspect**, not peak magnitude.
- **"Single bold objects, not busy clusters" — TRUE, primary cause.** A single tilted object has
  one clean silhouette that pops; a 12-book pile has no silhouette and reads as a flat photo. This
  is the biggest single delta.
- **"Card bg contrast stronger" — MOSTLY REFUTED.** Their `#f3fafd`/`#fffffc` separation is *subtle*
  (cool-on-warm); our near-white card on beige actually separates about as well. Contrast is a minor
  polish lever, **not** why ours reads flat.
- **"Shadow tighter/darker" — TRUE (different axis).** Theirs is a **baked, grounded** contact
  shadow; ours is a **diffuse floating** CSS shadow wrapping a ragged edge. Grounding matters more
  than darkness.
- **Un-hypothesised but real: rotation.** ±2.5° vs ±6–18°. Our tilt barely registers, killing the
  playful dimensional read. Cheapest single fix.

**Summary:** theirs is 3D because a *few large upright angled objects with clean alpha and a grounded
shadow* burst off the card. Ours is flat because *many small wide-piled objects with dirty alpha, a
weak tilt and a floating shadow* lie on it. Fixing the **source subject (Q1c) + rotation + shadow
grounding** recovers most of the 3D; overhang magnitude is already fine on good cards.

---

# QUESTION 3 — Uniform card structure

## 3a. Current variance

Card heights (live): 01 367 · 02 384 · 03 355 · 04 350 · 05 332 · 06 332 · 07 **385** · 08 350.
**Variance = 53px.** Cause is text reflow, isolated per zone (`scripts/recon-zones.mjs`):

| Cause | Cards affected | Cost |
|---|---|---|
| **Name wraps to 2 lines** | 03 "Coffee Table & Hardcase Books" (46px vs 23px) | +23px |
| **Subtitle wraps to 2 lines** | 02 "Notebooks, pads, counterbooks & stationery" (34 vs 17) | +17px |
| **Bullets wrap** (4 bullets → 5–7 rendered lines) | 07 Corporate = **7 lines/144px**, 01 & 02 = 6 lines/126px; 05/06 = 4 lines/91px | +35–53px |

Worst case is **07 Corporate** (1-line name, 1-line sub, but **7 bullet-lines** — "Annual reports,
Reliance, HDFC Bank & more" and "Corporate brochures & financial documentation" each wrap) and
**03 Coffee Table** (2-line name). No single card maxes every zone at once.

## 3b. Fixed 3-zone card spec (identical dimensions, all 8)

Give each zone a **fixed height** with content top-aligned; the card becomes a constant height.
Numbers reserve the worst observed case per zone at 300px width / 1536 canonical viewport.

| Zone | Fixed height | Holds | Reservation basis |
|---|---|---|---|
| **A · Photo/pop** | **150px** (visible band; cutout overflows upward into the track's 96px top padding) | the cutout, bottom seated on the band base, top overhanging ~30% of card height | independent of image; overhang normalized, not per-image |
| **B · Heading** | **116px** | number badge (22) + 10 + name **(reserve 2 lines = 48)** + 4 + subtitle **(reserve 2 lines = 34)** | worst name (03) + worst sub (02) |
| **C · Body** | **150px** | 4 bullets, **reserve up to 7 lines** (18px line + gaps) | worst bullets (07 Corporate = 144px) |
| **Total** | **≈ 416px** (150+116+150) + body h-padding | identical for all 8 | — |

Notes / recommendations:
- **Whitespace trade-off:** fixed zones leave the 4-single-line-bullet cards (05/06) ~50px of empty
  body. Acceptable for uniformity; or **vertically center** Zone C content to balance it.
- **Cheaper alternative to a tall body:** tighten the two long Corporate bullets so no bullet
  exceeds 1 line at this width (e.g. "Annual reports — Reliance, HDFC & more" / "Corporate
  brochures & financial docs"). That drops worst-case body to **~5 lines/109px**, letting Zone C =
  **120px** and the card = **~386px** with far less dead space.
- **Guarantee it in code, not by luck:** `min-height` on each zone (or a CSS grid with fixed rows
  `150px 116px 1fr`) — not the current natural-height flow that produced the 53px spread.
- Keep the number badge, name, subtitle, and 4 dash bullets in that order (SPEC content is law).

---

# ROUND 2 ASSETS — Harry's transparent re-export (verify)

**RECON ONLY. No component/CSS changed.** New `8 Cards.zip` extracted to
`recon/what-we-print/cutouts-v2/`. Scripts: `scripts/recon-v2-alpha.mjs`,
`recon-v2-proof.mjs`, `recon-v2-edge.mjs`. Proofs: `shots/v2-cutouts-*.png`,
`shots/v2-edge-*.png`.

## Headline: the alpha problem is SOLVED at the source

All 8 are now **real PNG-alpha cutouts** — every corner samples `rgba(0,0,0,0)` (true
transparent, **no white-baked plate**), clean anti-aliased edges, **zero striping, zero
washing**. The self-inflicted white-key damage from Round 1 is gone because there is no
white-key anymore — Harry's Canva alpha is authoritative. General (04)'s white puzzle
covers and POD (08)'s cream spines — the two that shredded in v1 — are now solid.

**One thing Harry did NOT change:** the compositions are still **wide multi-book clusters**
(bbox aspect 1.24–1.76, 700×560 canvas), not the bold ≤3-book upright arrangement
recommended in Q1c. Clean, but still "a shelf," not "a hero." Consequence is limited to
overhang punch (below) — it does not block the build.

## Round-2 per-image table

`alpha✓` = real transparency, corners=0. `whiteFringe%` = share of soft-edge pixels that are
near-white (halo test; 07 is high only because its subjects literally are white report covers,
confirmed clean in `shots/v2-edge-7.png`). `overhang` = achievable % of card height in a 150px
photo zone at ~110% card-width sizing.

| # | Category | dims | alpha✓ | transp% | softEdge% | whiteFringe% | edge | composition | subj aspect | overhang fitness |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Educational | 700×560 | ✓ | 32.2 | 2.82 | 1.3 | **A** clean | B− busy cluster | 1.24 | **~27% ✓** |
| 02 | Trade | 700×560 | ✓ | 34.2 | 3.39 | 1.1 | **A** clean | B− busy | 1.30 | **~26% ✓** |
| 03 | Coffee Table | 700×560 | ✓ | 44.5 | 1.79 | 0.4 | **A** clean | B fewer/larger | 1.38 | ~24% ✓ |
| 04 | **General** | 700×560 | ✓ | 53.0 | 2.30 | 0.7 | **A** clean | **C widest flat pile** | **1.76** | **~10–15% ✗ weak** |
| 05 | Children's | 700×560 | ✓ | 37.1 | 2.02 | 0.2 | **A** clean | B− cluster | 1.33 | ~24% ✓ |
| 06 | Learning Kits | 700×560 | ✓ | 25.7 | 3.39 | 0.1 | **A** clean | B− busy grid | 1.30 | **~27% ✓** |
| 07 | Corporate | 700×560 | ✓ | 35.4 | 2.03 | 6.4* | **A** clean (*legit white covers) | B+ ~6 reports | 1.32 | ~25% ✓ |
| 08 | POD | 700×560 | ✓ | 29.6 | 2.87 | 0.0 | **A** clean | B travel stack | 1.30 | **~28% ✓** |

## Overhang fitness

7 of 8 (aspect ~1.3) reach the **25–30% overhang target** when displayed at ~110% card width in
the 150px photo zone. **04 General (aspect 1.76, subject 695×395 — wide & short) cannot** — it
tops out ~10–15% and will read flattest, exactly as in v1. Everything else is fit.

## Uniform card readiness

**All 8 are identical 700×560 canvases** with the subject bottom-seated inside. This unlocks a
real simplification: **if the webp conversion keeps the full 700×560 canvas (no `trim()`), ONE set
of pop values — a single width%, marginTop and rotate — works for all 8**, replacing the current
8 per-image tunes in `WhatWePrint.jsx`. Caveat: 04's shorter subject will overhang less under
uniform values (its transparent top padding is larger), so it self-corrects toward "sits lower."
Card *height* uniformity is a separate text-zone problem (see Q3) — unaffected.

## v2 vs v1 damage — confirmed fixed

| # | v1 destroyed% | v1 striping% | v1 result | v2 result |
|---|---|---|---|---|
| 01 | 14.1 | 3.1 | edge nibble | **clean** |
| 02 | 13.1 | 1.5 | notepad loss | **clean** |
| 03 | 21.0 | 0.0 | **washed** | **clean, solid** |
| 04 | 21.4 | **7.8** | **striped/broken** | **clean, solid** (composition still flat) |
| 05 | 8.2 | 4.7 | ok | **clean** |
| 06 | 4.6 | 1.1 | ok | **clean** |
| 07 | 6.7 | 2.2 | covers nibbled | **clean** |
| 08 | 11.3 | 4.2 | **washed** | **clean, solid** |

Self-inflicted keying damage: **8–21% → 0%**. The Round-1 root cause is eliminated.

## VERDICT — BUILD-READY: **YES**

The transparency/edge quality is production-grade on all 8; nothing needs re-export for alpha.
Two non-blocking notes:

- **04 General — optional re-export for punch, not correctness.** It's cleanly cut but its wide,
  flat ~11-book pile can only manage ~10–15% overhang and will read flattest. If maximum 3D parity
  with Alternativ matters, ask Harry for a **taller, fewer-book upright** version of 04 (and it
  would lift 01/02/05/06's busy clusters too). Ships fine as-is otherwise.
- **Next build step (not done here — recon only):** convert `cutouts-v2/*.png` → `product-0N.webp`
  **keeping the 700×560 canvas (no trim)** so uniform geometry applies, then the `public/qfp/products`
  assets (currently still the v1 keyed webp) are replaced. That is a build action for the
  implementation pass, not this recon.

---

## Evidence index
- `shots/v2-cutouts-all.png` / `-a` / `-b` — all 8 v2 cuts, checker | card (#FDFAF4)
- `shots/v2-edge-7.png`, `-8.png` — edge/fringe zooms (white & cream subjects)
- `recon/what-we-print/cutouts-v2/` — Harry's raw round-2 PNGs
- `shots/recon-cutouts-all.png` — all 8 cuts, checker | card (#FDFAF4)
- `shots/recon-srcvscut-3.png`, `-4.png` — Harry's source vs our cut (Coffee Table, General)
- `recon/alternativ/scroll-039.png` — their Printing Services cards (4 bold single-subject cards)
- `public/alternativ/…books.webp` (765×880) — their 3-book portrait cutout w/ baked shadow
- `scripts/recon-cutout-damage.mjs` — destroyed%/striping% table
- `scripts/recon-measure.mjs` / `recon-zones.mjs` — live card + zone measurements
