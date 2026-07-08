# Alternativ hero — scroll breakdown & diagnosis of ours

Recon method: Playwright, 1440×900, wheel 40px/step, screenshot each step, plus
`getComputedStyle().transform` dumps at several scroll depths. Frames in
`shots/alt-scroll-*.png`; raw data in `shots/alt-recon.json`.

## 1. Reference (alternativinc.com)

**Scroll mechanism:** native scroll (no Lenis / Locomotive / smooth-wrapper
detected). Motion is GSAP-style scrub + an intro preloader.

**Structure (from real class names):** `hero-section_content` › `…_title-wrapper`
› `…_title-line _1` (green "PRINTING") + `_2` (white "STORIES") · `…_title-line_seal`
(rotating "printing stories" badge) · `button-box` (CTA) · `hero-section_graph-wrapper`
(the open-book photo, anchored bottom center) · faint `aaa` watermark pattern.

**What actually happens on scroll (measured):**

| Layer | y≈160 | y≈480 | behaviour |
|---|---|---|---|
| `navbar` | op 1.0 | op 0.56 | fades out |
| `title-wrapper` | op 1.0 | op 0.56 | fades out |
| `button-box` | op 0.71 | op 0.37 | fades out |
| `graph-wrapper` (book) | `matrix3d rotateY≈0.43°` | `matrix(1,0,0,1,0,0)` | **near-static**, micro 3D wobble |
| `title-line_seal` | rot θ₁ | rot θ₂ (different) | **continuous rotation** |
| `hero-section_content` | top:135 | top:135 | **pinned** — stays put across scroll |

**Key truth:** the hero is **pinned** and the scroll drives an **opacity fade**
(nav + title + CTA: 1 → ~0.4 over ~500px). The book barely moves. There is **no
dramatic parallax and no early "explosion."** Frames y80→y240 are almost
identical.

**So why does it feel alive?** Not scroll parallax. It's:
1. the **always-spinning seal** — perpetual motion independent of scroll,
2. a **strong entrance** (preloader → title/book reveal),
3. a **rich photographic book** with real depth as the anchor,
4. a **graceful pinned fade** on scroll-out.

## 2. Ours (before) — why it reads dead

Measured at `#hero` in 40px steps (`shots/old-scroll-*.png`):

- **Dead centerpiece.** The video/book layer has `transform: none` at every
  scroll position — it never scales, translates, or breathes. It's a dark empty
  rectangle. The reference's book is the opposite: the visual anchor.
- **No life at rest (y0).** Idle float was slow (3.4–7s) and small; the hero is
  static before you scroll. The reference always has the spinning seal moving.
- **Motion smeared across the whole 900px range.** Fly-apart mapped linearly to
  `end:'bottom top'`, so at 200px only ~22% of the movement had happened — the
  first, most-important 200px barely separates.
- **Scrub lag = 1s.** `scrub: 1` lets motion trail the scroll by a full second,
  so early scroll feels disconnected ("Lenis is eating the immediacy").
- **Headline drift too gentle** (−18px / op 0.78 over 400px).
- **Video frame-scrub invisible** — scrubbing `currentTime` on a slow gradient
  placeholder produces no visible frame-to-frame change (as suspected).

## 3. Fix strategy (match the FEEL, not clone)

Keep our concept (8 elements flying apart — richer than the reference) but borrow
the reference's sources of life:

1. **Front-load the reaction.** One scrubbed **timeline** with eased tweens
   (`power2.out`) instead of a linear scrub — ~40% of the separation now lands in
   the first 200px. Tighten `scrub` 1 → 0.5 for immediacy.
2. **Give the centerpiece its own motion.** The video layer scales `1 → 1.14` +
   lifts on scroll, and **breathes at rest** (idle scale 1↔1.015, slow drift) —
   so it's alive even at y0, like the reference book.
3. **Bigger per-element parallax by depth** (`dx·7 / dy·7`, rot ×1.5) so elements
   clearly separate early, each at its own depth ratio.
4. **Livelier idle** (2.2–3.4s, larger amplitude + wobble) so the whole field
   breathes before any scroll — our equivalent of the ever-spinning seal (which
   we also keep).
5. Transforms/opacity only, still scrub-tied → zero-jank preserved.
