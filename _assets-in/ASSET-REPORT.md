# ASSET RECON REPORT — client drive delivery `drive-download-20260728T032950Z-1-001.zip`

**Date:** 2026-07-28 · **Mode:** READ-ONLY recon. Nothing in `src/`, `public/`, or any repo
source file was touched. Archive extracted to `./_assets-in/` only.
**Tooling:** Python 3.12 / Pillow 12.2 (dims, colour space, alpha), PyMuPDF (PDF), manual TIFF
parse + embedded-JPEG extraction (the Sony RAW). No ImageMagick/ffprobe on this box; there is no
video file in the drop, so none was needed.

> **Headline:** This is **NOT a clean fresh set.** It is the previous (2026-07-27) delivery with
> 8 new files added on top. All four old files are still here **byte-for-byte identical**, and the
> new set actually **dropped** the developed `Aster-Automatic.png` the old set had — so the Aster
> now ships **only as an unusable 61.9 MB RAW.** Two content/filename mismatches, one white-box
> "transparent" icon, and at least one certification icon missing. Details below.

---

## TASK 1 — INVENTORY (12 files, 121 MB extracted)

| # | File | Bytes | Type | Pixels | Ratio | Mode / colour | Alpha | Web-usable as-is? |
|---|------|------:|------|--------|-------|---------------|-------|-------------------|
| 1 | `African.png` | 2,787,758 | PNG | 1600×1200 | 4:3 | RGB (no ICC) | none | ⚠ convert→webp |
| 2 | `America.png` | 2,725,622 | PNG | 1600×1200 | 4:3 | RGB (no ICC) | none | ⚠ convert→webp + **content wrong** |
| 3 | `Asia.png` | 3,057,866 | PNG | 1600×1200 | 4:3 | RGB (no ICC) | none | ⚠ convert→webp |
| 4 | `Untitled design - 1.png` | 320,225 | PNG | 512×512 | 1:1 | **RGB (no alpha)** | **NONE — white box** | ❌ needs bg removal |
| 5 | `Untitled design - 2.png` | 11,594 | PNG | 512×512 | 1:1 | RGBA | 92.7% transp | ✅ (Sedex) |
| 6 | `Untitled design - 3.png` | 34,629 | PNG | 512×512 | 1:1 | RGBA | 42.6% transp | ✅ (ISO circle) |
| 7 | `Untitled design - 4.png` | 26,449 | PNG | 512×512 | 1:1 | RGBA | 41.4% transp | ✅ (FSC) |
| 8 | `AV  video thumbnail.png` | 1,066,620 | PNG | 2000×1125 | 16:9 | RGBA (opaque) | unused | ⚠ convert→webp |
| 9 | `Infrastructure reference image.png` | 452,373 | PNG | 2000×1125 | 16:9 | RGBA (opaque) | unused | 🚫 reference only (UI mockup) |
| 10 | `Remove this and replace with aster_.jpg` | 516,315 | JPEG | 1206×1607 | 3:4 | RGB + ICC | none | 🚫 reference only (do NOT ship) |
| 11 | `1- Sheetfed8 Colour-8.png` | 2,106,040 | PNG | 1537×1023 | 3:2 | RGB (no ICC) | none | 🚫 old cruft (already on site as webp) |
| 12 | `Aster-Automatic.ARW` | 61,901,824 | **Sony RAW** | ~9568×6376 | 3:2 | 14-bit RAW / camera CFA | n/a | ❌ **NOT web-usable** |

**Not web-usable, and the conversion each needs**

- **`Aster-Automatic.ARW` — Sony A7R-class camera RAW (61.9 MB, ~61 MP).** Browsers cannot render
  `.ARW`. Must be **developed** in a RAW processor (Lightroom / Capture One / `darktable`),
  white-balance + exposure corrected (the embedded preview reads cool/blue and underexposed — see
  Task 2), then exported and **downscaled to ~1600 px** and saved as **webp**. Its embedded full
  preview is only 1616×1080. *(The previous delivery contained a developed `Aster-Automatic.png` at
  9568×6376 / 97.5 MB — that neutral-balance render is the fastest usable source, but this new drop
  no longer includes it. See Task 3.)*
- **`Untitled design - 1.png` (ISO 9001) — flat white background, no alpha.** Not usable as a
  certification badge over any coloured surface until the white is removed → transparent PNG/webp.

Everything else is technically web-loadable but every ship-able PNG should still be
**resized-as-needed + converted to webp** to match the repo convention. **No CMYK, no camera RAW
other than the ARW, no wrong-format surprises** beyond those two. The lone embedded ICC profile is on
the reference-only sewing JPG.

---

## TASK 2 — WHAT EACH IMAGE ACTUALLY SHOWS (looked at every one)

**1. `African.png` (1600×1200)** — Four smiling young **adults** on a sunny city sidewalk holding
coloured folders: a Black man in red plaid, a Black woman with braids front-and-centre, a
light-skinned young man, and a young woman in green. Reads as a generic **"diverse international
students"** stock shot, not a location shot of Africa. The central Black woman loosely anchors the
"Africa" label, but it is a mixed group with no African setting. → **Destination card, Africa.**
Dimensions match the 1600×1200 slot exactly. *(Content is defensible but generic; see caution.)*

**2. `America.png` (1600×1200)** — ⚠ **FILENAME vs PICTURE MISMATCH.** Four young **girls (children,
~6–9)** sit on a green wooden bench reading children's picture books. **The books are printed in
CYRILLIC** ("Бендэрики"), i.e. Russian / Eastern-European. This is **not America** and not adults —
it breaks the young-adult theme of the other two cards. If anything the Cyrillic points to **Europe**
(the slot we actually asked for), just mislabeled "America." Dimensions match 1600×1200, **content
does not match its name or a polished region card.**

**3. `Asia.png` (1600×1200)** — Five South-Asian young **adults** outdoors reading booklets branded
**"aat Sri Lanka — Association of Accounting Technicians of Sri Lanka / Business Mathematics &
Statistics."** Clearly South Asia / Sri Lanka. → **Destination card, Asia.** Correct content,
dimensions match exactly.

**4. `Untitled design - 1.png` (512×512)** — The **ISO 9001:2015** logo (blue ISO globe wordmark +
"9001:2015") on a **solid white square.** → Certification icon (ISO 9001). 512×512 correct, **but
zero transparency** (see Task 4).

**5. `Untitled design - 2.png` (512×512)** — The **Sedex** wordmark (dark-grey "Sedex" + magenta dot,
® mark) on transparency. → Certification icon (Sedex). Clean.

**6. `Untitled design - 3.png` (512×512)** — A **solid blue disc with a white ISO globe** — a
generic **ISO** roundel with **no standard number on it.** → Certification icon (ISO — *which* ISO is
ambiguous; see Task 3/4). Clean transparency.

**7. `Untitled design - 4.png` (512×512)** — The **FSC** label (green tree-checkmark + "FSC" + ®
inside a green rounded-rectangle border, white field). → Certification icon (FSC). Clean transparency
around a legitimately white FSC field.

**8. `AV  video thumbnail.png` (2000×1125, 16:9)** — A designed **title card**, not a photo: navy
dotted-world-map background, the Quarterfold Printabilities logo centred, headline **"Powering Global
Education / Through print excellence."** → **Video thumbnail.** 16:9 exact. (Note the two-space typo
in the filename.)

**9. `Infrastructure reference image.png` (2000×1125, 16:9)** — A **UI design mockup** of the
Infrastructure section: navy panel, "Built for Scale. Engineered for Precision.", and four stat
columns (300,000 sq ft · 3 facilities · 800+ professionals · 75 Million+ books). This is a **layout
reference, not a shippable asset.**

**10. `Remove this and replace with aster_.jpg` (1206×1607, portrait)** — Two **old GREEN MANUAL
book-sewing machines** with vertical white thread spools + thread guides, a framed **"QUALITY
PRECISION PERFORMANCE"** sign, bookshelf, plants, a blue folded cloth on a white side table, a book
with an orange map page being sewn. The filename literally instructs the swap. → **Reference only —
the manual machine to be replaced.** DO NOT ship. (This is the key to Task 5.)

**11. `1- Sheetfed8 Colour-8.png` (1537×1023)** — Photo of a **Komori Lithrone G37P sheetfed offset
press** in a clean hall with the Quarterfold logo on the wall. → Old sheetfed asset; **already live on
the site** as `sheetfed-*.webp`. Not needed.

**12. `Aster-Automatic.ARW` (RAW; ~9568×6376 landscape)** — extracted the embedded preview to
`_assets-in/_preview_aster_arw.jpg`, and downscaled the previous delivery's matching PNG to
`_assets-in/_preview_aster_png.jpg`. Both show the **SAME scene:** a large **modern AUTOMATIC
book-sewing machine** (cream/white enclosed body, orange beacon, gauges, sign "1" above it) in an
industrial shed with wall fans, beside a big stack of folded signatures. This is the **Aster
Automatic** that replaces the green manual machine. **Landscape 3:2.** (The `_preview_*.jpg` files are
tool-generated evidence, not client files.)

---

## TASK 3 — DELIVERED / MISSING / WRONG SPEC (vs what we asked for)

| # | Requested | Status | Actual |
|---|-----------|--------|--------|
| 1 | Milton team photo & details | **MISSING (expected/OK)** | Not present — client said skip. Fine. |
| 2 | Nilesh photo, 1600×1000 landscape | **MISSING** | No 1600×1000 file anywhere in the drop. Newsroom article still unblocked-blocked. |
| 3 | Three destination cards, 1600×1200 | **PARTIAL / WRONG** | Africa ✅ 1600×1200 · Asia ✅ 1600×1200 · **Europe ❌ not delivered.** Instead `America.png` (1600×1200) shows Eastern-European **children**, wrong for the label. **Right dimensions, wrong roster.** |
| 4 | Five cert icons, 512×512 PNG transparent | **PARTIAL / SPEC ISSUES** | 4 files @ 512×512. FSC ✅ · Sedex ✅ · ISO 9001 ✅ *but on a white box, not transparent* · **ISO/IEC 27001 ❌** (the 5th ISO file is a *generic* ISO roundel with **no "27001"**) · **Two Star Export House ❌ absent.** So 3 clean, 1 needs bg removal, 2 of the requested five are effectively missing/ambiguous. |
| 5 | Infrastructure gallery photos | **MISSING (expected/OK)** | Client said reuse existing. Fine. |
| 6 | Company Profile PDF | **MISSING (expected/OK)** | No PDF in the drop. Client said ~1 week out. Fine. |
| 7 | Video thumbnail, 16:9 | **DELIVERED** | `AV  video thumbnail.png` 2000×1125 = 16:9 exact. ✅ |
| 8 | Aster Automatic photo | **DELIVERED but WRONG FORMAT** | Present only as `Aster-Automatic.ARW` (61.9 MB Sony RAW). Needs full RAW development + downscale + webp. The usable PNG from the prior drop is **not** included this time. |

### Duplicate / near-duplicate check (by content, not filename)

A previous delivery is on disk at
`THE FINAL DESKTOP WEBSITE CHANGE/drive-download-20260727T161613Z-1-001/`. SHA-256 comparison:

| File | New vs previous |
|------|-----------------|
| `1- Sheetfed8 Colour-8.png` | **byte-identical** (be6ca18d…) |
| `Aster-Automatic.ARW` | **byte-identical** (1281e6ea…) |
| `Infrastructure reference image.png` | **byte-identical** (c537930a…) |
| `Remove this and replace with aster_.jpg` | **byte-identical** (1655cf90…) |

**All four "old" files flagged in the brief are still here, unchanged.** The folder is the previous
set **plus** 8 genuinely new files (3 destination cards, 4 cert icons, 1 video thumbnail).

- **`1- Sheetfed8 Colour-8.png`** is also already **live on the site** as
  `public/site-assets/homepage/facility-book/sheetfed-01..08.webp` and
  `public/site-assets/infrastructure/sheetfed/sheetfed-0*.webp` → true duplicate, discard.
- **`Infrastructure reference image.png`** and **`Remove this and replace with aster_.jpg`** are
  **reference material**, not deliverables.
- **Regression:** the previous folder also had `Aster-Automatic.png` (9568×6376, 97.5 MB developed
  render). **This new folder does NOT** — the Aster is RAW-only now. If you don't want to re-develop
  the RAW, that prior PNG is your source.

---

## TASK 4 — TRANSPARENCY & QUALITY

**Alpha verification (every PNG claimed transparent):**

| Icon | Fully transparent | Semi (anti-alias edge) | Verdict |
|------|------------------:|-----------------------:|---------|
| `Untitled design - 1` ISO 9001 | **0.0%** | 0.00% | ❌ **FAKE — solid white rectangle.** All four corners = pure white (255,255,255), no alpha channel. Exactly the "white PNG that isn't transparent" failure mode. Must have the white knocked out. |
| `Untitled design - 2` Sedex | 92.7% | 0.82% | ✅ Real transparency, cleanly anti-aliased wordmark. No white halo (0% near-white opaque). |
| `Untitled design - 3` ISO circle | 42.6% | 0.96% | ✅ Real transparency (corners around the disc). The white pixels are the logo's own ISO lettering, not a matte. Clean. |
| `Untitled design - 4` FSC | 41.4% | 1.22% | ✅ Real transparency around the badge. The ~79% "near-white opaque" is the **white field inside the FSC box — that is correct FSC artwork**, not a background bleed. On a dark site surface it will read as a white rounded card (by FSC design). |

- **Screenshot vs clean logo:** none of the four look like screen-grabs with jagged white edges;
  each has smooth sub-pixel anti-aliasing. #2/#3/#4 are clean vector-style exports. #1's only fault
  is the missing knockout, not edge quality.
- **Watermarks / low-res / bad crop / heavy compression:** none detected. The three destination
  stock photos are crisp studio-grade at native 1600×1200 (no visible watermark, no upscaling
  artefacts, no JPEG mush — they're PNGs). Flag instead: they read as **licensed stock library
  images** — confirm we hold usage rights before publishing.
- **Aspect-ratio vs slot:**
  - Destination cards 1600×1200 = **exact** 4:3, no crop needed.
  - Cert icons 512×512 = **exact**, no crop.
  - Video thumbnail 2000×1125 = **exact** 16:9, no crop.
  - **Aster** is **3:2 landscape (~9568×6376)** but the slot it replaces currently renders
    **portrait** (see Task 5) → a crop/orientation decision is required. Cropping a 3:2 landscape to
    the ~3:4 portrait of the current slot discards ≈50% of the frame width. Better: let the Aster
    ship **landscape** (see Task 5 fix).

**Set-consistency note (design, not a blocker):** the five cert icons don't form a uniform family —
a bare wordmark (Sedex), a filled circle (ISO), a rounded-rect white card (FSC), and a white square
(ISO 9001). Rendered in one row they'll look mismatched in shape and padding. Worth normalising to a
common badge treatment.

---

## TASK 5 — THE ASTER PAIR (which binding image gets replaced)

**The reference `Remove this and replace with aster_.jpg` = `binding-09.webp`.** Confirmed by eye,
not by filename — I opened all eleven `public/site-assets/homepage/facility-book/binding-01..11.webp`
and only **binding-09** shows the identical scene: the two **green manual thread-sewing machines**,
the vertical **white thread spools** + thread guides, the framed **"QUALITY PRECISION PERFORMANCE"**
sign, the same bookshelf, plants, blue trash bin, the **blue folded cloth** on the white side table,
and the **book with the orange map page** mid-sew. Same shot, web-optimised (portrait 1047×1364 vs the
reference's 1206×1607).

**→ The file that gets replaced later is `public/site-assets/homepage/facility-book/binding-09.webp`.**

The other ten, for the record: 01 blue "bindwel" perfect-binding hall (overhead) · 02 blue "bindline
signa 4K" gathering line · 03 wide overhead of the binding/warehouse hall · 04 row of green
glass-hooded **collating** machines (near-square, also TALL — *not* the sewing pair) · 05 ultrawide
blue perfect-binding panorama · 06 green+white rounding machine (green sewing line behind) · 07 blue
folder + "shumAVfen" perfect binder · 08 long **automated** green sewing line (multiple heads — a
different machine from the two manual ones) · 10 blue "WB 2000" gathering close-up (soft focus,
likely a video still) · 11 white/maroon automatic perfect-binder in a clean room.

### TALL-set impact (portrait vs landscape crop)

`FacilityBook.jsx` defines:
```js
const TALL = new Set([
  'web-machines-03','web-machines-08','web-machines-09',
  'sheetfed-08','binding-04','binding-09',
])
```
**`binding-09` IS in the TALL set** → it currently renders as a **single portrait page**. The Aster
replacement is **landscape 3:2.** So the swap forces a choice:

- **Option A (recommended) — keep it landscape.** Remove `'binding-09'` from the `TALL` set so the
  Aster renders as a full landscape double-page spread. Export the Aster at ~1600 px wide, 3:2. No
  content lost. (One-line edit in `FacilityBook.jsx` — for the *later* build lane, not this recon.)
- **Option B — keep the portrait slot.** Crop the 3:2 Aster to ~3:4 portrait to match binding-09's
  current shape; you lose ≈50% of the frame width and the machine will feel cramped.

Either way the replacement is **`binding-09.webp`**, and the orientation mismatch (delivered
landscape → current portrait slot) is the thing to decide before the swap.

---

## FINAL LISTS

### ✅ READY TO USE (with the conversion each needs)
- **`Asia.png`** → Asia destination card. Resize/keep 1600×1200, convert to **webp q≈80**.
- **`African.png`** → Africa destination card. 1600×1200 → **webp q≈80**. *(Content generic — see
  caution; dimensions perfect.)*
- **`AV  video thumbnail.png`** → video thumbnail. 2000×1125 → **webp q≈82** (rename, drop the
  double space).
- **`Untitled design - 2.png` (Sedex)** → cert icon. Rename → e.g. `cert-sedex.webp`, keep 512×512
  transparency, convert to **webp (lossless/alpha)**.
- **`Untitled design - 3.png` (ISO roundel)** → cert icon **IF** confirmed as the intended ISO mark.
  Rename, 512×512 transparent → **webp**.
- **`Untitled design - 4.png` (FSC)** → cert icon. Rename, 512×512 transparent → **webp**.

### 🛠 NEEDS WORK BEFORE USE
- **`Aster-Automatic.ARW`** → **develop the RAW** (WB/exposure fix — preview is cool & dark),
  export, **downscale to ~1600 px**, convert to **webp**; then it replaces `binding-09.webp`. Decide
  Option A/B orientation first. *(Or reuse the prior delivery's `Aster-Automatic.png` as the source
  and just downscale + webp.)*
- **`Untitled design - 1.png` (ISO 9001)** → **knock out the white background** to real
  transparency, then 512×512 → **webp**. As delivered it's a white box.
- **`America.png`** → **do not use for "Europe" (or America) as-is.** Content is Eastern-European
  children with Cyrillic books — wrong for a polished region card and mislabeled. Get client
  confirmation: is this meant to be the **Europe** card (then relabel + probably reshoot to match the
  adult-student style of Africa/Asia), or replace outright.
- **Cert-icon set consistency** → normalise the five badges to one shape/padding treatment so the row
  reads as a set.

### ❌ STILL MISSING
- **Europe destination card** (1600×1200) — not delivered (America.png is not it).
- **ISO/IEC 27001 icon** — the delivered ISO roundel carries **no "27001"**; a proper 27001 badge is
  missing/ambiguous.
- **Two Star Export House icon** (512×512 transparent) — absent.
- **Nilesh photo** (1600×1000 landscape) — absent.
- **Usable Aster file** — only the RAW arrived (developed PNG from the prior drop was dropped).
- *(Expected-missing / fine per brief: Milton team photo, Infrastructure gallery photos, Company
  Profile PDF.)*

---

## ⚠ OPEN QUESTIONS FOR THE CLIENT (ambiguities — need a decision, changed nothing)
1. **`America.png`:** we asked for **Europe**. Is this the Europe card (mislabeled), or is the scope
   now "Americas"? Either way the picture (Eastern-European children, Cyrillic) doesn't fit — confirm
   intent / provide a replacement in the adult-student style.
2. **`Untitled design - 3.png`:** is this generic ISO roundel meant to stand in for **ISO/IEC
   27001**? It shows no standard number. If so, please supply the real 27001 mark; if not, 27001 is
   missing.
3. **`Two Star Export House` icon:** was it meant to be in this batch? It isn't here.
4. **Aster orientation:** confirm Option A (ship landscape, drop binding-09 from TALL) vs Option B
   (portrait crop) before the swap is built.
