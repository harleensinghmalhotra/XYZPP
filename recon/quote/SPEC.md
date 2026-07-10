# Quote / Mission — Recon Spec

**RECON ONLY. No code changed.** Sources: Ekta's `D:\WEBSITES\QFP\EKTA DOCS\qfp-homepage-v17.html`
(mission band, lines 115–122 CSS / 635–641 markup); our `src/sections/Quote.jsx`; **Harry's
reference screenshot (now provided — analysed directly in Part 3).**

---

## TOP 3 FINDINGS

1. **The live Ekta band uses `.mission`, not `.mission-alt` — there is no bg image to port.**
   `class="mission-alt"` appears **nowhere** in the v17 markup. The mounted "Your mission is
   education" band is `.mission`: **solid navy (`#0F2444`) + two faint cream radial corner-glows,
   center-aligned**. The gradient-over-base64-photo `.mission-alt` (asset #21 `mission-band-bg`,
   1515×1038) is **defined in CSS but unused**. So the brief's "gradient + bg image" describes a
   dead style; the target left-aligned editorial layout is a **new composition**, not a port.

2. **Almost nothing of our current Quote.jsx carries over — it's a different section.** Ours is a
   centered, serif-italic **Mandela** quote floating over ambient page **video** with CMYK-magenta
   accent. The target is a left-aligned **Inter Tight** brand manifesto on **navy**, no video, gold
   accents, QFP attribution. Reusable: the per-line **scroll-reveal motion** and the **word-split
   model** (`{t, accent}` → `{t, weight}`). Everything else (font, alignment, background,
   attribution, `VideoBackdrop`) is replaced.

3. **Mixed weight IS the aesthetic — WEIGHT ONLY, one colour.** The reference confirms it: bold and
   light words are the **same black** — the ONLY variable is weight (heavy ~700 vs light ~300). No
   opacity fade, no colour shift on the light words. (This corrects my first draft, which faded the
   light words to cream@50 — too weak.) On our navy the quote should stay **one colour (cream),
   weight-only**; reserve gold for the eyebrow + attribution, not the quote body. Get the weight
   jump right and it sings; add colour tricks and it muddies.

---

# PART 1 — Ekta's version (`.mission`, v17)

### Exact copy (lines 635–641)
```
Your mission is education.
Ours is to <strong>ensure nothing gets in its way.</strong>
  <span class="mission-small">Printing. Kitting. Quality checks. Warehousing. Shipment.
   One system, start to finish, with nothing left to chance.</span>
Quarterfold Printabilities · Est. 2014
```
- The **only** emphasised phrase is `ensure nothing gets in its way.` (`<strong>` → gold).
- `<br>` after "education." — two lines in the main quote.

### Structure
`.mission` (section) → `.mission-q` (`<p>`, holds the two-line quote + a nested
`.mission-small` `<span>`) → `.mission-attr` (`<p>`, attribution). Center-aligned, single column.

### CSS (exact values, lines 115–122)
```
.mission        { background: var(--navy #0F2444); padding: 80px 56px; text-align:center;
                  position:relative; overflow:hidden }
.mission::before{ radial-gradient cream@4%, 400px, top-left  (-120,-120) }   /* corner glow */
.mission::after { radial-gradient cream@3%, 400px, bottom-right (-120,-120) }/* corner glow */
.mission-q      { Inter Tight; clamp(22px,3vw,38px); weight 500;
                  color: rgba(245,240,232,0.85) (≈cream@85%); line-height 1.4;
                  max-width 820px; margin 0 auto }
.mission-q strong { non-italic; weight 600; color #9B7420 (gold); size 1.12em; letter-spacing 0 }
.mission-small  { display:block; margin-top 22px; Inter; 14.5px; weight 400;
                  letter-spacing .3px; color rgba(245,240,232,0.5) (cream@50%) }
.mission-attr   { Inter Tight; 12px; letter-spacing 1px; color rgba(155,116,32,0.75) (gold@75%);
                  weight 600; margin-top 28px }
```
Palette: `--navy #0F2444 · --gold #9B7420 · --gold-text #836013 · --cream #FDFAF4`.
Fonts: **Inter Tight** (quote, attr), **Inter** (small line). All already loaded in our `index.html`.

### Unused alternate (for reference only — do NOT port)
`.mission-alt` = `linear-gradient(180deg navy variants)` over a base64 JPEG (`mission-band-bg`).
`.mission-alt-q`: Inter Tight **clamp(30px,4.4vw,54px)**/500, cream@90, lh 1.28, max-w 840;
`strong` → gold. `.mission-alt-body`: Inter 17px, cream@55%, lh 1.85, max-w 660. Bigger scale
than `.mission` — useful as a **size reference** for our larger target, nothing else.

---

# PART 2 — Ours (`src/sections/Quote.jsx`)

### What it does
- `<section id="ethos" data-theme="dark">`, `min-h-[100svh]`, flex-centered, `bg-tone`.
- **`VideoBackdrop`** (ambient `pagesVideo`, opacity 70) + two scrims (tone@45% flat + radial
  vignette to `--video-tone`) for legibility.
- `<blockquote>` **serif, italic**, `clamp(2rem,5.4vw,4.6rem)`, weight 500, cream, centered.
  Content = Mandela: "Education is the most **powerful** weapon…", one word (`powerful`) gets
  `text-magenta` (CMYK accent).
- Reveal: `LINES` array, each line a `motion.span` — `opacity 0→1`, `y 26→0`, stagger `li*0.12`,
  ease `[0.16,1,0.3,1]`, `whileInView` once. Gated by `useReducedMotion` (`initial={false}`).
- `<figcaption>`: hairline — "Nelson Mandela" (`.label`, mono caps) — hairline.
- Mounts in `App.jsx` between `PrintPath` and `Proof`.

### Reusable vs replace
| Element | Verdict |
|---|---|
| Per-line `motion.span` scroll-reveal (opacity+y, stagger, reduced-motion gate) | **Reuse** — retarget to mixed-weight lines |
| Word-split data model `LINES=[{t, accent}]` | **Reuse** — extend `accent` → `weight: 'bold'\|'light'` |
| `data-theme="dark"` section shell, `useReducedMotion` | **Reuse** |
| `min-h-[100svh]` + flex **center** | **Replace** — target is left-aligned, band height (not full-screen) |
| `font-serif italic`, magenta accent | **Replace** — Inter Tight, gold accent |
| `VideoBackdrop` + scrims | **Drop** — target is solid navy + faint glow, no video |
| Mandela attribution / `#ethos` id | **Replace** — QFP attribution, `#promise` (or `#mission`) |

---

# PART 3 — Target design (from Harry's reference screenshot)

Reference quote: **`"Design should be easy to understand because simple ideas are quicker to grasp..."`**

Measured pattern, exactly as shown:
- **Eyebrow** — `I believe` — **lowercase** (not caps), small (~15px), muted **coral/accent**,
  sitting just above the quote and **indented to the quote's text start** (left edge aligns with
  the first glyph, not the page margin).
- **Pull-quote** — very large, **left-aligned**, ragged right, fills most of the block width, tight
  line-height (~1.05–1.1). Clean grotesque sans (Inter-family). Wrapped in literal `"…"`, ends on
  an **ellipsis** `..."`. Monochrome black on near-white (with a faint dot-grid texture behind).
- **Mixed weight — the whole move, and it is WEIGHT ONLY:**
  - Bold segments (heavy ~700): `"Design should be`, `because`, `are quicker to grasp..."`
  - Light segments (regular/light ~300–400): `easy to understand`, `simple ideas`
  - **Same colour throughout** — the light words are NOT faded; only the stroke weight drops.
  - The emphasis is **rhythmic, not grammatical**: note `because` (a connector) is bold while the
    nouns `simple ideas` are light. The bolding creates a visual/verbal *pulse* and lands on the
    logical pivot — it is a cadence, not a "bold the important nouns" rule.
  - Words **flow inline and wrap by width** — spans break mid-phrase across lines; there are no
    forced per-anchor line breaks.
- No supporting line / no attribution in this particular reference — those come from Ekta's content
  (Part 1) and are additive for our build.
- **Motion** — the screenshot is a still; no motion shown. Treat entrance as our call (Part 4).

---

# PART 4 — Build spec (QFP version)

### Layout
Replace `Quote.jsx` (same `App.jsx` slot, between `PrintPath` and `Proof`). Section:
`data-theme="dark"`, background **solid navy `#0F2444`** + the two faint cream radial corner-glows
from `.mission` (keep — cheap, on-brand, CLS-free). **Left-aligned**, content in a
`max-w-page` container with generous left padding; **band height** (~`clamp(70vh, …, 100svh)` or
`padding: 140px 56px`), not forced full-screen. Optional 1px gold top hairline
(`linear-gradient(90deg,transparent,gold@20%,transparent)`) to divide from PrintPath.

### Eyebrow
Text — **recommend "Our promise"**, set to match the reference's quiet **lowercase** "I believe"
(sentence case, small ~14px, gold `--gold-text #836013`), indented so its left edge aligns with the
quote's first glyph. "One system" is the runner-up; keep "Est. 2014" for the attribution.
> **Decision to surface:** the brief said "gold **caps**"; the reference is **lowercase**. Lowercase
> is truer to the reference's manifesto feel — recommended. If house style demands caps, use the
> `.sec-ey` treatment (Inter Tight 12px / letter-spacing 3px / uppercase / 52px gold hairline).

### Main quote — mixed weight (weight-only, per reference)
Text (verbatim): **"Your mission is education. Ours is to ensure nothing gets in its way."**
- Font: **Inter Tight**, `clamp(2.4rem, 5.5vw, 5rem)`, line-height ~1.1, letter-spacing -0.5px,
  left-aligned, ragged right, `max-width ~1000px`. (Bigger than Ekta's 38px cap — this is the hero.)
- **Weight only, one colour** (the reference rule): **bold = 700**, **light = 300**, both in
  **cream `#FDFAF4`**. The light words are NOT faded — let the weight jump do the work. On navy,
  drop the light words to at most `cream@88%` only if legibility needs it; do not go to 50%.
- **Flow inline; let it wrap by width** (as the reference does) — no forced `<br>`. At this scale it
  naturally breaks to ~3–4 lines with bold/light spans wrapping mid-phrase.
- Optional, to match the reference literally: wrap the whole line in `"…"`. Judgement call — a
  *promise* reads fine unquoted; the quote marks make it feel more like a "belief". Recommend
  **unquoted** for a brand promise, but it's a clean either/or.

#### RECOMMENDED bold/light word map
| Segment | Weight | Colour | Why |
|---|---|---|---|
| `Your` | light 300 | cream | connective setup |
| `mission is education.` | **bold 700** | cream | anchor 1 — *their* purpose |
| `Ours is to` | light 300 | cream | connective pivot |
| `ensure nothing gets in its way.` | **bold 700** | cream | anchor 2 — *our* promise (Ekta's `<strong>`) |

Read the bold words alone: *"mission is education … ensure nothing gets in its way."* — the message
survives on the anchors, which is the test of a correct map. This is a cleaner 2-anchor rhythm than
the reference's 3-pulse ("Design should be … because … are quicker to grasp") — appropriate for a
shorter promise.
> **Gold option (diverges from the reference's monochrome):** if the client wants Ekta's gold
> payoff, tint ONLY the final phrase `ensure nothing gets in its way.` gold `#9B7420`. Costs the
> reference's purity; gains brand colour. Recommended default = **monochrome cream** (reference-true).

### Supporting line (smaller)
"Printing. Kitting. Quality checks. Warehousing. Shipment. One system, start to finish, with nothing
left to chance." — Inter, `clamp(15px,1.3vw,18px)`, weight 400, `cream@55%`, line-height 1.8,
`max-width ~620px`, `margin-top ~28px`. *Optional emphasis:* set the five process nouns
("Printing. Kitting. Quality checks. Warehousing. Shipment.") to weight 500 / cream@75 to echo the
mixed-weight rhythm at small scale.

### Attribution
"Quarterfold Printabilities · Est. 2014" — Inter Tight, 12–13px, letter-spacing 1px, weight 600,
`gold@75%` (`rgba(155,116,32,.75)`), `margin-top ~32px`. Left-aligned under the supporting line.

### Entrance animation (scroll-reveal)
- **Base reveal:** eyebrow → quote → supporting line → attribution, each `opacity 0→1` + `y 20→0`,
  stagger ~0.1s, ease `[0.16,1,0.3,1]`, `whileInView` once (reuse Quote.jsx's motion pattern).
- **Signature beat (optional):** split the quote so the **light connectives reveal first**
  (`opacity`/`y`, quick), then the **bold anchors arrive a half-beat later** via a left-to-right
  `clip-path` inset wipe — so the eye catches the bold phrases landing. This animates the emphasis
  the weight already encodes, without touching colour.
  **Do NOT animate `font-weight`** (300→700 reflows every frame → jank). Keep weights static at
  their final value; animate only `transform` / `opacity` / `clip-path`.
- **Reduced motion:** render final state, no reveal (gate with `useReducedMotion`, `initial=false`).

### Mount
`App.jsx`: swap `<Quote />` for the new component (rename e.g. `Mission.jsx`/`Promise.jsx`),
same position between `PrintPath` and `Proof`. Section id `#promise`. Keep `data-theme="dark"` so
`SiteNav` theme-switching still works. Drop the `VideoBackdrop` import/usage.

### Palette / type lock
navy `#0F2444`, gold `#9B7420`, gold-text `#836013`, cream `#FDFAF4`; Inter Tight (eyebrow, quote,
attribution) + Inter (supporting line). Labels ≥11px. No serif, no magenta, no video.
