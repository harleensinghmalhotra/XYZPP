---
name: motion-choreography
description: Designs a project's complete motion system — token sheet, orchestration patterns, tool selection, spring tuning, scroll choreography, and reduced-motion parallel track — turning the suite's motion canon into project-grade choreography an agent can implement without inventing timing values. Owns the TIMING SYSTEM transitions obey (durations, easing, overlap), not the transition technique itself. USE WHEN: "design a motion system", "animation feels random/inconsistent", "pick durations and easings", "should I use GSAP or Framer Motion or CSS", "stagger this list", "what timing should transitions between states share", "scroll-linked animation", "scrub this timeline to scroll", "spring feels wrong / too bouncy", "make this hero breathe", "animate layout change without jank", "FLIP animation", "reduced-motion version", "animations are janky / dropping frames", "orchestrate enter and exit".
license: MIT
metadata:
  suite: award-grade
  version: "1.4.0"
---

# Motion Choreography — one timing system per project, directed like a film, not decorated like a template

## Mission

Turn the motion canon into THIS project's motion language: a token sheet, an orchestration grammar, and a tool choice — decided once, obeyed everywhere. Motion with no system is the loudest tell of AI-generated work; motion with one system reads as a director's hand. This skill exists so no animation on the project ever carries an ad-hoc number.

## When NOT to use

- **Content-first documents** (docs, blogs, legal, checkout): a 100–180ms hover/press vocabulary is the whole motion system. Don't invoke a choreographer for that.
- **The single signature interaction** — that's `signature-interactions`. This skill sets the system the signature lives inside.
- **Shader/WebGL scene motion** — camera moves and material animation belong to `webgl-shader-fx`; this skill only hands it the timing tokens.
- **When the team can't maintain it**: a GSAP timeline nobody on the team can debug is worse than CSS transitions everyone can. Choose down, not up.
- **To "add life" to a design that isn't working** — motion amplifies a composition; it cannot rescue one. Fix layout and hierarchy first (`design-dna-forge`).

## Workflow

1. **Read the canon** (`../../references/motion-canon.md`). Every token you mint is a mapping onto its scales, never a replacement.
2. **Name the personality in one line** ("calm authority", "playful precision") from the brand work — then map it to the canon scales (see Token sheet below). Write the mapping down with a WHY per token.
3. **Inventory every moving thing**: page enter/exit, nav, overlays, list reveals, hover/press, scroll effects, hero idle. Assign each a token pair (duration + easing) from your sheet. Anything unassigned doesn't animate.
4. **Choose the tool tier** with the decision table below. Write the choice and the reason into the token sheet so the next agent doesn't "upgrade" to GSAP for a tooltip.
5. **Design the reduced-motion track in the same pass** — a second column on the sheet, not a follow-up ticket (see Reduced-motion parallel design).
6. **Choreograph the composite moments** (page transitions, list entrances, modal open) using the orchestration patterns. Overlap, stagger, and enter/exit asymmetry are decided here, on paper, before code.
7. **Implement, then verify in a browser and record numbers**: DevTools performance recording at 4× CPU throttle, zero long tasks > 50ms during motion, reduced-motion pass screenshotted. "Should be smooth" is not a deliverable — recorded numbers are.
8. **Hand the sheet to `award-judge`** before shipping; any canon ban found caps the design score.

## Technique library

### The motion token sheet (per project — the core deliverable)

**Canon names are law.** The sheet mints the canon's own token names (`--duration-instant`, `--duration-fast`, `--duration-base`, `--duration-slow`, `--duration-cinematic`, `--ease-out-quart`, `--ease-in-quart`) with THIS project's tuned values — it never renames them. Personality shifts the VALUE within canon bounds; it never invents a new bound and never forks the name. Two worked mappings:

| Canon token | Canon range | "Calm fintech" value | "Playful studio" value |
|---|---|---|---|
| `--duration-instant` | 100ms | 100ms | 100ms (feedback speed is universal) |
| `--duration-fast` | 180ms | 160ms | 200ms |
| `--duration-base` | 240ms | 220ms | 280ms |
| `--duration-slow` | 400ms | 360ms | 450ms |
| `--duration-cinematic` | 600–1200ms | 600ms, used once | 900ms, used once |
| `--ease-out-quart` | `cubic-bezier(0.25,1,0.5,1)` | unchanged — enters always decelerate | unchanged — enters always decelerate |
| `--ease-in-quart` | `cubic-bezier(0.5,0,0.75,0)` | unchanged, applied @ 70% of enter's duration | unchanged, applied @ 70% of enter's duration |
| Springs (UI) | stiffness 300–500 / damping 28–40 | stiffness 400, damping 40 (near-critical, zero overshoot) | stiffness 300, damping 28 (one visible overshoot — the bound's soft corner, still in-bounds) |
| Stagger | 30–60ms | 30ms | 50ms |

Rules of the sheet: (a) calm brands compress durations and raise damping — confidence is quick and settled; (b) playful brands stretch durations ~15–20% and lean toward the bound's low-stiffness/low-damping corner for a livelier settle — never below it, never on dashboards, never on money (canon ban on bounce in product UI); (c) exit = 70% of enter's duration, always, same easing family; (d) ship it as CSS custom properties + a JS constants file that reads them, so both worlds share one source of truth.

**Semantic aliases — reference, never replace.** A project may want project-vocabulary names for readability (`--motion-hero` reads better in a component than `--duration-cinematic` to a designer skimming CSS) — that's allowed, but ONLY as a `var()` reference to the canon token, listed in an explicit alias table alongside it. An alias with its own raw value is the token schism this canon forbids: two sources of truth for the same timing that will drift the first time someone edits one and not the other.

| Alias (project vocabulary) | Resolves to (canon token) |
|---|---|
| `--motion-feedback` | `var(--duration-instant)` |
| `--motion-micro` | `var(--duration-fast)` |
| `--motion-base` | `var(--duration-base)` |
| `--motion-spatial` | `var(--duration-slow)` |
| `--motion-hero` | `var(--duration-cinematic)` |
| `--motion-enter` | `var(--ease-out-quart)` |
| `--motion-exit` | `var(--ease-in-quart)` |

```css
:root {
  /* canon tokens — mint values here, this is the only place values live */
  --duration-instant: 100ms;
  --duration-fast: 160ms;
  --duration-base: 220ms;
  --duration-slow: 360ms;
  --duration-cinematic: 600ms;
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-quart: cubic-bezier(0.5, 0, 0.75, 0);

  /* semantic aliases — references only, never a second value */
  --motion-feedback: var(--duration-instant);
  --motion-micro: var(--duration-fast);
  --motion-base: var(--duration-base);
  --motion-spatial: var(--duration-slow);
  --motion-hero: var(--duration-cinematic);
  --motion-enter: var(--ease-out-quart);
  --motion-exit: var(--ease-in-quart);
}
```

### Orchestration patterns

- **Stagger grammar**: stagger = hierarchy, so stagger order = reading order. 30–60ms between siblings, hard cap at 5–7 staggered items — beyond that, batch rows/groups and stagger the batches. A 12-item list staggered individually takes 720ms+ to settle: bureaucracy, not choreography.
- **Overlap, don't queue**: element B starts when A is ~60% done. In GSAP: `tl.to(b, {...}, "-=0.15")` relative offsets; in Framer Motion: `delayChildren` + `staggerChildren` on the parent variant. Fully sequential chains read as loading screens.
- **Parent-child choreography**: the container claims the spatial move (position/size); children only fade/slide ≤ 8px inside it. When both parent and children travel independently, the eye can't find the object — one mover per moment.
- **Exit-before-enter vs crossfade** — decide per transition, don't default:
  - *Exit-before-enter* (with ~40% overlap) when the two states are different PLACES — page navigation, step wizards. Preserves spatial story.
  - *Crossfade* (linear easing, opacity only) when it's the same place with different CONTENT — tab panels, data refresh, filter results. Travel here would lie about space.

### Tool decision table (opinionated: CSS first, JS when sequencing demands it)

| Need | Tool | Why |
|---|---|---|
| Hover, press, toggles, single-property state changes | CSS transitions | Zero JS, compositor-friendly, interruptible for free |
| Looping/idle motion, keyframed one-shots | CSS animations | Declarative, runs without main-thread help |
| Scroll-linked progress (supported browsers) | CSS scroll-driven animations, JS fallback | Off-main-thread scrubbing where available |
| Imperative one-shots, FLIP plays, needs a completion promise | Web Animations API | Native, no dependency, `animation.finished` |
| React app, interruptible enter/exit, layout animation | Framer Motion | Variants + `AnimatePresence` + `layout` solve interruption and exit-mounting correctly |
| Multi-element timelines, scroll scenes, SVG choreography | GSAP + ScrollTrigger | Real timeline authoring: relative offsets, labels, scrub |

The interruptibility test decides upgrades: if the user can re-trigger the motion mid-flight (open/close a menu fast), you need retargeting — CSS transitions and springs handle it natively; hand-rolled keyframe sequences don't. Never load GSAP for what a transition does; never hand-build in WAAPI what is genuinely a timeline.

### Spring physics tuning

Springs are for interruptible, physical gestures (drag-release, toggles, magnetic elements) — not decoration. Recipes:

- **UI standard**: stiffness 400, damping 40, mass 1 — settles ~300ms, no visible overshoot. Menus, toggles, sheet snaps.
- **Responsive-crisp**: stiffness 500, damping 35 — snappier settle, a hint of life. Cursor-adjacent elements.
- **Playful**: stiffness 300, damping 28 — the bound's softest legal corner, one visible overshoot. Only for genuinely playful brands (canon ban on bounce in product UI). Still 300–500/28–40 — UI springs never leave that range; softer than this is drag-release physics, a different recipe below, not a "more playful" version of this one.
- **Drag-release**: stiffness 150, damping 20 — reserved for interruptible drag-release physics only, never for a resting UI transition. Pass the gesture's release velocity into the spring — a release that ignores velocity feels like teleportation.

Tune damping before stiffness: damping controls overshoot count (the personality), stiffness controls settle speed (the tempo). Wobbling forever = raise damping; sluggish = raise stiffness. Never reach past the UI floor (300/28) toward the drag-release numbers (150/20) to manufacture more bounce — that boundary is what keeps product UI from feeling like a toy.

### Scroll choreography

- **Scroll-TRIGGERED** (crossing a line fires a normal animation): use for content reveals. Fire once, forward only — re-triggering on every scroll-past is noise.
- **Scroll-LINKED** (scroll position IS the playhead): use for narrative scenes. The pattern: **scroll progress owns the timeline** — build one timeline of the whole scene, map section progress 0→1 to timeline progress 0→1 (`ScrollTrigger` with `scrub`, or a CSS `animation-timeline: view()`), and let scroll be the only clock. Never mix a time-based tween into a scrubbed scene: two clocks, one element, guaranteed fights.
- **Scrub discipline**: reversible (scrolling up plays backward — if the scene can't reverse, it isn't scroll-linked, it's triggered), no layout reads in scroll handlers (canon: rAF-batched or CSS-driven only), and `scrub: 0.5`–`1` smoothing so pixel-jitter doesn't telegraph into the scene.
- Body text never parallaxes (canon ban). Backgrounds may drift at ≤ 20% of scroll delta.

### State-machine motion for hero elements

Give hero/signature elements four named states — enter, idle, emphasis, exit — and legal transitions between them, so motion code is a state chart, not an event-handler pile (Framer Motion `variants` map to this 1:1).

**Idle breathing rules** (where hero motion goes to die): total displacement < 1% of the element's size, period ≥ 8s, eased sinusoidally, and it PAUSES during user interaction — idle motion that competes with a hover response reads as broken. If you can consciously notice the loop within 3 seconds of looking, it's too loud.

### Micro-interaction grammar (press/release/success/error feels)

- **Press**: instant (≤ 100ms) scale to 0.97 with ease-out — response, not animation.
- **Release**: spring back (UI-standard recipe) — the release carries the personality, the press never does.
- **Success**: one confident motion, 240–400ms, decisive ease-out (checkmark draw-on, single settle). Never bounce — success is calm.
- **Error**: shake = 3 oscillations, ±4px, ~300ms total, then still — plus color and text; motion alone is not an error message (see `../../references/accessibility-motion.md`).

### FLIP for layout animation

Animating `width/height/top/left` triggers layout every frame. FLIP — First, Last, Invert, Play: measure first rect, apply the final layout instantly, measure last rect, invert the delta with a transform, then animate the transform to identity. All movement becomes compositor-only `transform`. Hand-roll with `getBoundingClientRect` + WAAPI, or use the maintained implementations: Framer Motion's `layout` prop / `LayoutGroup`, or GSAP's Flip plugin. Shared-element page transitions are the same idea via the View Transitions API — old/new snapshots animated by the browser. Watch scale-distortion on children (text stretching mid-flight); counter-scale children or crossfade content during the move.

### Reduced-motion parallel design (not a retrofit)

Design both tracks in the same sitting — the token sheet gets a reduced column from day one:

| Full track | Reduced track |
|---|---|
| Travel + fade enter | Opacity-only crossfade, same duration |
| Scroll-linked scene | States resolve instantly at trigger points |
| Idle breathing | Static |
| FLIP layout move | Instant re-layout + 150ms crossfade |
| Springy sheet | 200ms fade |

Implementation: gate at the token layer (`@media (prefers-reduced-motion: reduce)` overriding travel custom properties to `0`), not with per-component conditionals you'll forget. Content, hierarchy, and beauty identical in both tracks — reduced motion is an art direction, not an off switch (`../../references/accessibility-motion.md`). Verify by toggling the OS/DevTools setting and screenshotting both tracks.

### Debugging jank — the recording ritual

From `../../references/performance-budgets.md`, run before ANY "done" claim: DevTools → Performance, 4× CPU throttle, record the full journey including your choreography. Read it in this order: (1) red long-task blocks > 50ms during motion = fail, find the script; (2) purple layout strips inside the animation window = you're animating a layout property — convert to transform/FLIP; (3) dropped-frame gaps in the frame chart = check for `filter`/`box-shadow` animation on large surfaces (pre-render layers instead); (4) confirm `will-change` appears just before motion and is removed after. Then Rendering panel → Paint flashing: a whole-viewport repaint during a "transform-only" animation means something else is animating too. Record the numbers (long-task count, worst frame) in the project notes — unrecorded verification didn't happen.

## Quality gates

- `../../references/motion-canon.md` — the law this skill instantiates. Bites hardest here: one easing family per project, enter ≠ exit (exit = 70%), stagger caps, the 1-second ceiling, and every ban (`transition: all`, fade-in-up-everything, bounce on product UI, parallax on body text).
- `../../references/performance-budgets.md` — transform/opacity-only, zero long tasks > 50ms mid-motion, just-in-time `will-change`, the 4×-throttle recording ritual with recorded numbers.
- `../../references/accessibility-motion.md` — reduced-motion parity as art direction, vestibular limits (no counter-scroll parallax, pause control on loops > 5s), motion never the sole carrier of meaning.
- `../../references/awwwards-scoring.md` — mixed easings and entrance theater are generic-AI tells; any slop-list hit caps Design at 6. Restraint scores as maturity.
- `../../references/gsap-recipes.md` — when the tool ladder lands on GSAP: timeline/label architecture, ScrollTrigger scrub-vs-toggle discipline, the React Strict Mode traps (context/revert, never drive shader uniforms from useEffect tweens), SplitText bounds, Flip for layout morphs, and the one-ticker rule.

## Deliverables

1. **Motion token sheet** — CSS custom properties + mirrored JS constants, with personality mapping, reduced-motion column, and a one-line WHY per token.
2. **Choreography spec** — every composite moment (page transitions, reveals, overlays) as state charts and overlap/stagger timings, tool choice named with reason.
3. **Verification record** — DevTools recording numbers (long tasks, worst frame at 4× throttle) + reduced-motion screenshots of both tracks.

## Related skills

- **wow-director** — orchestrates the suite; commissions this motion system as part of the project brief.
- **signature-interactions** — builds the one loud moment inside the quiet system this skill defines.
- **webgl-shader-fx** — consumes the token sheet for scene/camera timing.
- **design-dna-forge** — supplies the brand personality the token mapping starts from.
- **ux-narrative** — decides WHAT the scroll story says; this skill decides how it moves.
- **award-judge** — gates the shipped result against the canon; run it before every release.
