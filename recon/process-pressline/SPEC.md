# RECON — "Paper-Feed Press Line" for *One Continuous Process*

**Status:** Recon only. No code written. This spec drives a future build.
**Concept:** Reimagine the 6-stage process as a **printing press in motion** — a sheet
seated in the press while a gold **print-head** travels left→right as you scroll,
each stage *printing in* (ink impression) as the head reaches it. The signature idea
that makes this section unmistakably **QFP (a printer)**, replacing the current flat
horizontal beam ([`src/sections/Process.jsx`](../../src/sections/Process.jsx),
`.hproc` in [`src/index.css`](../../src/index.css)).

---

## ▲ TOP 3 FINDINGS (read first)

1. **Full skill stack is installed and mirrored.** Every requested award-grade,
   GSAP, and support skill is present in *both* `.claude/skills/` and
   `.agents/skills/`. Bonus finds directly relevant to this build: **`paper`**
   (print-texture design system), **`svg-animation`**, **`60fps-animation`**,
   **`accessible-animation`**, **`micro-interaction`**, **`emil-design-eng`**.
   Nothing is missing — no WebGL is required, but `webgl-shader-fx` is available
   if we ever justify it (we don't, see #2).

2. **Recommend approach (a) CSS/GSAP — with one discipline refinement.** Confirmed
   over Canvas/SVG-filter. Refinement: drive the *heavy* motion with **transform**
   (sheet + print-head) and **opacity** (outline→inked cross-fade); treat
   `clip-path`/`mask` ink-flood as a **scrubbed garnish on ≤6 small elements only**.
   This preserves what the current section already earned — **real DOM text,
   axe-clean, selectable/SEO** — while holding the 60fps floor and working
   everywhere. Canvas (b) and SVG-filter (c) both *risk* that a11y/perf win and
   are not justified for a deliberately brief, "get-out" section.

3. **Framing decision matters more than the tech.** Build **"print-head travels
   over a seated sheet"** (labels stay fixed → clear, accessible), **NOT** "labels
   ride a moving sheet" (literal but confusing + a11y/reflow risk). Sell the *feed*
   with edge **rollers** + a faint grain drift — never by moving the text. The only
   genuinely **asset-dependent** items are an *optional* paper-texture WebP and an
   *optional* ink-bleed alpha PNG; everything core is CSS/SVG-generated.

---

## PART 1 — Skill inventory for this build

Location: present in `.claude/skills/` **and** `.agents/skills/` (identical mirror).

### Requested — availability

| Requested | Installed? | Resolves to |
|---|---|---|
| award-grade → motion-choreography | ✅ | `motion-choreography` (suite: award-grade v1.4.0) |
| award-grade → signature-interactions | ✅ | `signature-interactions` (award-grade v1.4.0) |
| award-grade → wow-director | ✅ | `wow-director` (award-grade v1.4.0) |
| award-grade → webgl-shader-fx | ✅ | `webgl-shader-fx` (not needed here) |
| ui-ux-pro-max | ✅ | `ui-ux-pro-max` |
| gsap → scrolltrigger | ✅ | `gsap-scrolltrigger` |
| gsap → timeline | ✅ | `gsap-timeline` |
| gsap → performance | ✅ | `gsap-performance` |
| zero-jank-scroll | ✅ | `zero-jank-scroll` (v0.2.0) |
| taste-skill | ✅ | `design-taste-frontend` (the anti-slop taste skill); also `award-judge` |
| impeccable | ✅ | `impeccable` |

### Bonus skills that apply to a scroll-driven paper-feed

- **`paper`** — print-inspired, paper-textured design system. Directly on-concept for
  the sheet surface, grain, and tactile press feel.
- **`svg-animation`** — for roller/guide graphics and any stroke-based print-head detail.
- **`60fps-animation`** — transform/opacity discipline, avoiding layout thrash on the wipe.
- **`accessible-animation`** — tiered reduced-motion (not all-or-nothing).
- **`micro-interaction`** — the per-stage "stamp" impression as a discrete micro-moment.
- **`emil-design-eng`** — final polish pass (the invisible details: ink settle, shadow softness).
- `gsap-core`, `gsap-react` — tweens + `useGSAP`/context cleanup for our React mount.

### Which sub-skills drive which part

| Build concern | Skill(s) |
|---|---|
| One timing system (durations, eases, stagger, scrub value, reduced-motion track) | **motion-choreography** (owns the token sheet) |
| The single memorable moment = the press printing | **signature-interactions** (storyboard → isolate → verify 60fps) |
| Whether this is *the* signature vs. a quiet one; kill/keep | **wow-director** (only if scope is contested; likely skip for one section) |
| Scroll architecture: scrub, trigger range, no-jank, native scroll preserved | **zero-jank-scroll** + **gsap-scrolltrigger** |
| Timeline authoring: print-head + per-stage impressions sequenced off head position | **gsap-timeline** |
| Keep it composited, no paint storms on the wipe | **gsap-performance** + **60fps-animation** |
| Surface/type/tactility of the sheet, ink color law | **paper** + **impeccable** + **ui-ux-pro-max** |
| Reduced-motion twin | **accessible-animation** |
| Roller/guide vector detail | **svg-animation** |
| Final settle + shadow craft | **emil-design-eng** |
| Pre-ship jury check | **award-judge** / **design-taste-frontend** |

---

## PART 2 — Technical approach options

Judged against three hard constraints: **60fps floor**, **~55–65vh height budget**,
**works-everywhere (no WebGL unless clearly justified)**. Current section already
passes axe, holds 56vh, and scrubs at ~284fps headless — the bar is "don't regress."

### (a) Pure CSS/GSAP  ◀ RECOMMENDED

The sheet is a static seated element (cream + grain + soft shadow). A gold
**print-head** bar is translated left→right on a scrubbed `ScrollTrigger`
(`transform: translateX`, GPU). Track split like today: grey/un-inked ahead of the
head, inked behind. Per-stage impression = an **outline layer cross-faded to an
inked layer** (opacity) + a short **stamp overshoot** (transform scale) + an
optional **top→down ink wipe** (`mask-image` linear-gradient, scrubbed).

- **Pros:** transform+opacity are compositor-friendly → holds 60fps trivially;
  **real DOM text stays** (accessible, selectable, SEO, axe-clean — the win we
  already have); reduced-motion = the CSS resting state, zero extra logic;
  degrades on any browser; tiny code delta from the existing `.hproc` build.
- **Cons:** `clip-path`/`mask` animation is *paint*, not composite — so it must be
  **rationed** (≤6 small elements, scrubbed, short). Paper grain must be a **static**
  texture (data-URI SVG noise or WebP), never an animated `feTurbulence`.
- **Verdict:** best fit. Confirms Harry's lean, with the refinement that transform+
  opacity do the heavy lifting and the wipe is garnish.

### (b) Canvas 2D (hero-engine style, proven)

Paper, grain, ink bleed, and stamps drawn frame-by-frame, scrubbed to scroll like
the existing hero engine.

- **Pros:** total art control — organic ink bleed, real impression texture, pixel-
  accurate stamps; proven pattern in this repo.
- **Cons:** **text in canvas loses accessibility/selection/SEO** → we'd need a real-
  DOM text overlay anyway (hybrid), so canvas only buys the ink texture; retina
  (DPR 1.25+) redraw cost; more code + a second render loop to babysit against the
  60fps floor; overkill for "low-value, brief" content.
- **Verdict:** only if we decide organic ink-bleed realism is the whole point.
  It isn't — restraint is the brief. **Reject** for now.

### (c) SVG (animated sheet path + per-stage SVG masks)

Sheet as an SVG shape; print-head as `stroke-dashoffset` travel; ink-fill via SVG
`<mask>` per stage; grain via `feTurbulence`.

- **Pros:** crisp at any scale; mask-based ink reveal is idiomatic in SVG; vector
  rollers are natural here.
- **Cons:** **`feTurbulence` on scroll is a known perf trap** (repaint heavy);
  animated SVG masks/filters can thrash paint; text-in-SVG needs `foreignObject`
  (fragile) to stay selectable. Works-everywhere risk is higher than (a).
- **Verdict:** borrow SVG **only** for the static roller/guide graphics (Part 3),
  not as the animation engine. **Reject as the primary approach.**

### Recommendation

**(a) Pure CSS/GSAP**, transform+opacity primary, `mask` ink-wipe as rationed
garnish, **static** grain texture, **real DOM text** preserved. Reuse the tuned
scroll range from the current build (`start: 'top 78%'`, `end: 'bottom 45%'`,
`scrub: 0.5`). This holds every constraint and keeps the axe pass.

---

## PART 3 — Visual / motion spec

Palette law: navy `#0F2444`, gold `#9B7420`, olive `#6B7A2A`, cream `#FDFAF4`,
cream2 `#F0EBE0`, ink `#1C2019`. Fonts: Inter Tight (headline/stage names), Inter
(subhead/lines), DM Mono (stage index). Height budget **55–65vh**. Junction above is
navy Promise → cream (unchanged).

### The sheet (press bed)

- A wide seated panel on cream, tinted a hair warmer/lighter than the section
  (`#FDFAF4` sheet over a `#F0EBE0` bed lip) to read as *paper on a press*.
- **Grain:** subtle fiber via a **static** data-URI SVG noise (the pattern already
  used in `index.css`) at ~4–6% opacity, or an optional WebP paper texture (Part 5).
  Never animated.
- **Seat shadow:** soft, low drop shadow beneath the sheet (`box-shadow`/`filter:
  drop-shadow`) so it "sits" in the press. Slightly deeper under the delivery (right)
  edge to imply thickness.

### The print-head (the moving element)

- A **slim vertical gold bar** (`#9B7420`), ~3–4px wide, full sheet-height, = the
  impression point. Travels left→right via `translateX`, scrubbed.
- Trailing **ink smudge/glow**: a short gold→transparent gradient behind the bar
  (behind = inked, ahead = grey), reusing today's "lit behind / grey ahead" logic
  re-skinned. Optional 1px soft `box-shadow` bloom for the "wet ink" gleam.
- Optionally cap the bar with a tiny **roller cylinder** so the head reads as a
  press roller, not a laser.

### Per-stage ink impression

Each stage (icon + name + one line) has two visual states:

- **Un-inked (resting-ahead):** faint **outline** — stroke-only icon, name/line at
  low opacity (~0.28), as if the plate isn't inked yet.
- **Inked (after head passes):** solid — icon filled/gold, name navy, line ink,
  index gold. This is also the **reduced-motion / final CSS truth**.

Transition as the head reaches the stage's x (**staggered `1/6` off head progress**):

1. **Impression stamp** — quick `scale 1 → 1.06 → 1` (a press *chunk*), ~120ms-equiv
   in scrub units, `ease: power2.out` with a hair of overshoot. (`micro-interaction`)
2. **Ink cross-fade** — outline→inked opacity swap, ~100ms-equiv.
3. **Ink flood (garnish)** — optional `mask-image` linear-gradient wipe **top→down**
   on the icon+name so ink appears to *lay down* under the roller. Rationed: 6 small
   elements, scrubbed, short. Cut it first if any paint cost shows.
4. **Line settle** — the one-line description rises `y: 8 → 0` + fades to full.

Timing lives in a **motion-choreography** token sheet (durations, eases, stagger,
scrub) — no ad-hoc numbers. Reuse the proven range: `start top 78%`, `end bottom 45%`,
`scrub 0.5` (draw runs as the section sits in view, never pre-completed).

### Press-hardware framing (sell "this is a press")

- **Top edge:** one or two thin **guide rollers** — SVG cylinders with a cylindrical
  linear-gradient + subtle end-caps. On scroll, a *tiny* continuous rotate (a few
  degrees, transform, cheap) to imply feed. Keep monochrome/low-contrast.
- **Bottom edge:** a **delivery lip / paper-guide** line (the tray the printed sheet
  feeds onto). Thin, restrained.
- **No** feed-arrows, gauges, or labels — that's clutter; the rollers + traveling
  head carry the metaphor. `impeccable` + `emil-design-eng` guard against over-dressing.

### Reduced-motion

Fully-printed **final state**: all six stages inked, print-head parked at far right
(or hidden), rollers static, sheet seated, no movement. This is the CSS resting truth,
so reduced-motion needs no separate animation path — matches how the current build
handles it. (`accessible-animation`)

### Responsive

Desktop 1536 = one clean row of 6 (the priority). Below the wrap breakpoint
(~900px) → 2 rows of 3, **print-head + rollers hidden**, all stages shown inked
(final state) — exactly the pattern the current `.hproc` already ships.

---

## PART 4 — Content (unchanged)

Pulled verbatim from the current `Process.jsx` `STAGES`. Do not rewrite.

- **Headline:** `One Continuous Process.`
- **Subhead:** `One partner. One workflow. We take care of everything so you can focus on your mission.`

| # | Stage | One line |
|---|---|---|
| 01 | **Print** | Offset and sheet-fed production, calibrated for colour at volume. |
| 02 | **Quality** | Double quality checks, so it reaches you as expected. |
| 03 | **Fulfillment** | Kitting, collating and packing, tailored to your project. |
| 04 | **Warehouse** | Climate-appropriate storage, released on your timeline. |
| 05 | **Ship** | Documentation, customs and delivery to 25+ countries. |
| 06 | **You're Covered** | We handle everything, you focus on your mission. |

Icons: reuse the existing inline line-icon set (`print, quality, fulfillment,
warehouse, ship, covered`) from `Process.jsx` — they already read as minimal and
consistent; add a *filled* variant (or animate `fill`) for the inked state.

---

## PART 5 — Asset needs

### CSS/SVG-generated (no asset required)

- Sheet color/bed lip — palette colors.
- **Paper grain** — static data-URI SVG noise (pattern already in `index.css`).
- Seat drop shadow — CSS `box-shadow` / `drop-shadow`.
- Print-head bar + ink glow — CSS gradient + `box-shadow`.
- **Rollers / delivery lip** — inline SVG with linear-gradient cylindrical shading.
- Stage icons (outline + inked) — existing inline SVG set.
- Ink-flood wipe — CSS `mask-image` linear-gradient.

### Harry may want to provide/generate (optional fidelity upgrades — FLAG)

- ⚑ **Paper texture WebP** — tileable ~1500×400, subtle fiber, ~20–40KB, if the SVG
  noise grain reads too "digital." *Nice-to-have, not required to ship.*
- ⚑ **Ink-bleed alpha PNG** — a soft-edged ink/impression texture (transparent PNG)
  if the CSS `mask` wipe looks too clean/vector and we want organic ink edges.
  *Optional; only if we push realism.*

**Everything core is CSS/SVG-generated.** The two flagged items are upgrade paths,
not blockers — decide before the polish pass, not before scaffolding.

---

## Build order (when green-lit)

1. **Static final state first** (= reduced-motion truth): section, headline/subhead,
   seated sheet (grain + shadow), 6 inked stages, rollers, print-head parked right.
   Verify **height 55–65vh**, **axe clean**, **one clean row @1536**.
2. **Motion tokens** via `motion-choreography`: durations, eases, stagger, `scrub`,
   trigger range (reuse `top 78%` → `bottom 45%`, `scrub 0.5`).
3. **Print-head travel** — `translateX` + inked/grey split, scrubbed ScrollTrigger.
   Verify **60fps** (`gsap-performance`).
4. **Per-stage impression** — stamp overshoot + outline→inked cross-fade + top→down
   ink wipe + line settle, staggered off head position. Verify **partial-draw frames
   at 25/50/75%** (proof it animates, nodes/stages inked only up to the head).
5. **Press hardware + polish** — roller micro-rotate, optional grain parallax;
   `emil-design-eng` settle pass (ink softness, shadow).
6. **Reduced-motion + narrow wrap** — 2×3, head/rollers hidden, all inked.
7. **Verification** — Playwright 1536×743 DPR 1.25: report height in vh; capture
   `shots/process-anim-*.png` at 25/50/75% (partial print proof); fps green; CLS ~0;
   axe pass; reduced-motion final state; junction from Promise clean.

**Guardrails:** keep real DOM text; ration `clip-path`/`mask` to ≤6 small scrubbed
elements; static grain only; don't move the labels; kill the ink-wipe first if paint
cost appears. Do **not** regress the current axe/60fps/56vh baseline.
