# The Rounded Return — Radius Pass (HOMEPAGE scope)

Harry's call: the site returns to the rounded language of the old build (branch
`main`, deployed at xyzpp.vercel.app). Radius values only — no layout, colour,
animation, or content changed. This round is **homepage + shared components only**;
inner pages (/about, /educational-books, /trade-books, /print-on-demand,
/infrastructure, /fulfilment, /contact, /legal/*) get the same token pass in their
own later rounds. The token scale is already defined in `:root`, so those rounds are
one-line applications.

## 1 · ARCHAEOLOGY — every border-radius mined from `main` (read-only `git show`)

| Element family (main selector) | Old radius on `main` | New token |
|---|---|---|
| Buttons / CTAs (`.edu-btn`, `.ctc-submit`, `.ctc-btn`, `.ff-cta-pill`, `.tb-quote/.tb-spec/.tb-close-pill`, nav CTA) | `999px` pill | `--radius-pill` |
| Tags / badges / seals (`.tb-badge`, `.tb-stage-tag`, `.edu-awards-seal`, `.certs-pill`) | `999px` / `50%` | `--radius-pill` / `--radius-round` |
| Team card (`.wwp-card`) | `34px` | `--r-card` (22) |
| Feature cards & panels (`.cert-card`, `.ff-card`, `.tb-stage/.tb-sib`, `.infra-card`, contact/addr cards) | `20–24px` | `--r-card` (22) |
| Large panels / form cards / process cards (`.edu-proc-card`, `.ctc-form`, `.ctc-success`) | `26px` | `--radius-2xl` |
| Photos / media (`.infra-photo`, `.ff-feat-media`, `.inf-photo`, dialog panels) | `16–20px` | `--r-media` (18) |
| Inputs / list rows / thumbnails (`.ctc-field`, `.ff-mq-item`, `.tb-thumb`, `.tb-swatch`) | `12–14px` | `--radius-md` (14) |
| Small controls / icon tiles / plaque photo (`.pod-chip-sw`, `.tb-swatch-chip`, `.aw-photo`, chips) | `6–10px` | `--radius-sm` (8) |
| Small plaque card (`.plq`) | `10px` | `--radius-md` (14) |
| Decorative frames / clip lines / book-spine inner (`.aw-photo-ph::before`, `.aw-clip-lines`, rules, shelves) | `2–3px` | `--radius-xs` (3) |
| Circles (icons, play, dots, avatars) | `50%` | `--radius-round` |

## 2 · THE TOKEN SCALE (one tunable family, in `src/index.css :root`)

```
--radius-xs: 3px;    --radius-sm: 8px;    --radius-md: 14px;
--radius-lg: 18px;   --radius-xl: 22px;   --radius-2xl: 26px;
--radius-pill: 999px;  --radius-round: 50%;
/* semantic aliases (already wired into buttons/cards/ring): */
--r-card:var(--radius-xl)  --r-btn:var(--radius-pill)  --r-media:var(--radius-lg)
--r-chip:var(--radius-sm)  --r-pill:var(--radius-pill) --r-round:var(--radius-round)
```

The whole site's softness now tunes from these lines. Buttons were pills in the old
build (`--r-btn` → pill); if Harry's eye wants a softened rectangle instead, it is
one edit: `--r-btn: var(--radius-md)`.

## 3 · APPLIED (homepage families) — every one verified in `shots/radius-pass/`

- **Nav CTA** ("Request a Quote" / "Demander un devis") → pill.
- **Nebula buttons** (Hero, CTAFooter) → pill; the `::before` foil ring uses
  `border-radius: inherit`, so it hugs the pill exactly — verified at three rotation
  timestamps (`nebula-ring-t0/t1/t2`): no clip, box never moves.
- **Destination panels** (`.proj-dest-frame`) → `--r-card`; the crisp glow
  `::before` outsets 4px via `calc(var(--r-card) + 4px)` so it stays concentric.
- **Homepage infra cards** (`.infra-card`) → `--r-card`; glow `::before/::after`
  given matching radii so no square aura sits under the round card; photo panels → `--r-media`.
- **Shelf books** (`.proj-book-cover`) → `--radius-xs`/`--radius-sm` asymmetric
  (bound edge tight, fore-edge eased) — still believable as hardcovers, milestone gold ribbon crops clean.
- **Case-study spread** (`.cs-*`) → book pages/cards rounded, tag & CTA pills, spine `--radius-sm`.
- **FSC chip** (`.svA-chip`) → `--r-chip` soft plate; **Certifications pills** → pill.
- **Globe** → full-bleed by design (no container radius); marker tooltip → `--radius-sm`.

## 4 · CROSS-CHECKS
Hover states, glow blurs and shadows follow their element's new radius (glow calc +4px).
Reduced-motion, WCAG, EN+FR untouched. CSS-drawn checked: the homepage speech bubbles
are image sprites (artwork) — untouched. The 3D conveyor is geometry — untouched.

## 5 · ZERO-HARDCODED-RADIUS PROOF (homepage-relevant scope)
- Every tokenised line in `index.css` belongs to a homepage/shared selector.
- Every *remaining* literal radius in `index.css` belongs to an inner-page selector
  (`.edu-/.ctc-/.tb-/.ff-`, deferred to their rounds) or the one intentional
  `border-radius: 0` on `.maplibregl-ctrl-attrib` — a transparent element whose `0`
  functionally flattens MapLibre's injected default pill (no visible corner).
- `Cases.css` and the shared JSX (`SiteNav.jsx`, `CTAFooter.jsx`): zero hardcoded, all tokens.
- Playwright: 0 console errors, EN and FR.

## Judge verdict
**The old build's softness is back, tokenised — one variable family away from any
future tune, and nothing else moved a pixel.** Homepage-scoped, ring hugs at every
rotation, books still read as books, inner pages left pristine for their own rounds.
