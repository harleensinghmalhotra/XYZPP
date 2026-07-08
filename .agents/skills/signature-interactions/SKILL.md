---
name: signature-interactions
description: Designs and builds the interactions people screenshot and remember — scroll-driven narratives, live page-to-page route transitions, custom cursors, brand-grade hover states, drag surfaces with real physics, kinetic type running in the DOM, loading choreography, and one well-budgeted easter egg — each prototyped in isolation and verified at 60fps under throttle before it touches the codebase. USE WHEN: "make this page feel alive", "add a signature interaction", "scroll animation for the hero", "scrollytelling section", "navigate between routes without a hard reload feel", "custom cursor", "magnetic button", "hover effect for this grid", "drag-to-explore carousel", "kinetic type on the live page", "text reveal on scroll", "the loader feels cheap", "site feels static and boring", "award-worthy interaction", "add delight without killing performance".
license: MIT
metadata:
  suite: award-grade
  version: "1.4.0"
---

# Signature Interactions — engineer the one moment a visitor describes to someone else tomorrow.

## Mission
A site earns memory with ONE loud interaction and ten quiet, perfect ones — never eleven loud ones. This skill builds that one moment with an engineer's discipline: storyboard it, prototype it standalone, measure it at 60fps throttled, ship the reduced-motion twin with equal care. Everything here is subordinate to the jury's memory gate: if nobody can name your interaction 24 hours later, it was decoration.

## When NOT to use
- Content-first surfaces (docs, checkout, dashboards, anything with money numbers) — interaction budget there is ~zero; use restraint, not this skill.
- When the team can't yet name the site's single signature moment — decide that first (with `wow-director`); this skill executes a decision, it doesn't replace one.
- When performance budgets are already blown — an interaction added to a stuttering page is lag with ambition. Fix the floor first.
- To "fill" a plain section. Plain sections with great type are design; animated plain sections are noise.
- When the deadline forbids the verification ritual. An unverified interaction is a liability, not a feature.

## Workflow
1. **Name the signature moment.** One sentence: "When the user ___, the ___ does ___." If the sentence could describe 100 other sites, redo it (see `../../references/awwwards-scoring.md`, Creativity test).
2. **Storyboard the beat structure**: trigger → build → peak → release. Assign durations/easings from the motion canon tokens only.
3. **Prototype standalone** — CodePen-grade isolation: one HTML file, real assets, no framework, no app code. This is non-negotiable; integration bugs and feel bugs must never be debugged simultaneously.
4. **Verify feel under throttle**: DevTools Performance, 4× CPU throttle, record the full gesture. Pass = 60fps sustained, zero long tasks > 50ms. Write the numbers down. "Should work" is not a state.
5. **Build the reduced-motion variant in the same prototype** — crossfade/instant-resolve version, same content and hierarchy. It ships together or neither ships.
6. **Integrate**, then re-run step 4 inside the real app (frameworks add hydration and re-render costs the prototype never saw).
7. **Fill the interaction inventory** (see Deliverables) and hand it to `award-judge` for the gate pass.

## Technique library

### 1. Scroll-driven narrative
Sections that tell a story as the user scrolls — progress maps to scenes, not to random fade-ins.
**Earns its place** when the content has genuine sequence (process, product tour, timeline). If the sections are peers, use layout, not scroll theater.
**Decision table — CSS scroll-driven animations vs GSAP ScrollTrigger:**

| Need | Use |
|---|---|
| Element animates on its own viewport progress (reveal, progress bar) | CSS `animation-timeline: view()` / `scroll()` — zero JS, compositor-friendly |
| Pinning, multi-element scenes, scrubbed timelines, snap, callbacks | GSAP ScrollTrigger |
| Must work in every browser today | ScrollTrigger; layer CSS behind `@supports (animation-timeline: view())` as enhancement |
| Split-text stagger tied to scroll | ScrollTrigger + a split routine |

```css
@supports (animation-timeline: view()) {
  .figure { animation: rise linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 40%; }
}
```
**Storyboard scene-based**: name each scene (Scene 1 "arrival", Scene 2 "assembly"…), give each a start/end in scroll distance, and write what the non-scrolling user sees (the resting frame must compose on its own).
**Pinning discipline (the restraint rule):** ≤ 2–3 pinned scenes per page; pin distance ≤ 200% viewport height; never two pins back-to-back; scrub-linked motion resolves instantly under reduced motion; the user can always scroll out — no locked sections.

### 2. Page transitions
Continuity between routes so navigation reads as travel, not teleport.
**Earns its place** on portfolio/case-study/gallery flows where a shared element (image, title) persists across pages.
**Implementation**: View Transitions API first — `document.startViewTransition(updateDOM)` for SPA, `@view-transition { navigation: auto; }` for MPA; name persisting elements with `view-transition-name` for shared-element continuity. Where unsupported, FLIP fallback (measure First, apply Last, Invert with a transform, Play the removal) — GSAP's `Flip.getState()`/`Flip.from()` does the bookkeeping. Always feature-detect; the no-support path is an honest instant swap, not a broken half-morph.
**Restraint rule**: transition ≤ `--duration-slow` for spatial swaps, one cinematic route pair max (usually list → detail). Back navigation must be at least as fast as forward. Never block input while transitioning.

### 3. Cursor design
The cursor as a brand surface: custom cursor dot/label, magnetic buttons, media that reacts to pointer position.
**Earns its place** on desktop-first creative/portfolio sites where pointer play IS the personality.
**Implementation**: custom cursor = decoration layered over a functioning native pointer (a11y canon), rendered as a `position: fixed` transform-only element updated via `requestAnimationFrame` with lerp smoothing (~0.15 factor). Magnetic elements: the HIT AREA never moves — outer button keeps full static bounds, inner span translates toward the pointer, clamped:

```js
const pull = 0.3;                       // fraction of offset applied
const max = 12;                         // px travel cap
inner.style.transform =
  `translate(${clamp(dx*pull,-max,max)}px, ${clamp(dy*pull,-max,max)}px)`;
```
Cursor-reactive media (image tilt, WebGL displacement) reads pointer position normalized to the element, eased, never raw.
**Restraint rule**: everything in this family disappears on `(pointer: coarse)` and under reduced motion. If the site is unusable with the OS cursor, the design failed. One cursor personality per site.

### 4. Hover states as brand
Hover is where craft is cheapest to show: image reveals, text scrambles, split reveals, underline choreography.
**Earns its place** on link lists, project grids, nav — high-traffic pointer paths.
**Implementation**: image reveal = `clip-path: inset()` animation or scale-inside-`overflow:hidden` (transform-only, never width/height). Text scramble = character shuffle resolving left-to-right, ≤ 400ms, once per hover-enter, display type only — never body text. Split reveal = duplicate line translating within a masked container. Underline choreography = `transform: scaleX()` with a `transform-origin` swap (origin left on enter, right on exit) so the line exits the way it entered.
**Restraint rule**: pick ONE hover personality per element class and repeat it — a grid where every card hovers differently reads as no direction. First visual response < 100ms (`--duration-instant`), always.

### 5. Drag / inertia surfaces
Carousels and canvases with real physics — velocity carries, release decelerates, edges resist.
**Earns its place** when there is genuinely more content than viewport and browsing it should feel tactile (project reels, drag-to-explore maps).
**Implementation**: Framer Motion `drag` with `dragConstraints`/`dragElastic` and momentum, or GSAP Draggable with inertia. Physics per canon: stiffness 300–500 / damping 28–40 for UI snapping; softer only for playful release. Requirements that are not optional: touch parity, wheel/trackpad support, keyboard arrows move the same list, and a visible affordance (offset peek or cursor label) — an undiscoverable drag surface is hidden content.
**Restraint rule**: never hijack vertical page scroll for a horizontal surface without a pinned-scene contract (see §1); drag must not be the ONLY path to content — links inside remain tabbable and clickable.

### 6. Text as interface
Type that moves: kinetic headlines, split-line reveals, variable-font axes bound to scroll or pointer.
**Earns its place** on editorial/brand statements where the words ARE the hero — no imagery to compete with.
**Implementation**: split-line reveals — split into lines (not letters, for reading rhythm), mask each line, translate up with 30–60ms sibling stagger in reading order, ≤ 7 lines staggered then batch. Variable font axes: animate `font-variation-settings` ("wght", "wdth") from scroll progress or pointer distance — cheap wow, but it triggers re-layout, so confine it to a handful of display glyphs and verify under throttle. Kinetic loops (marquees) use `--ease-linear` and pause on hover/reduced-motion.
**Restraint rule**: body text never moves against scroll and is never scrambled/split — kinetic treatment is for display type. Set type is the reduced-motion variant, designed, not defaulted.

### 7. Loading as theater
The load sequence as the first designed moment instead of a blank apology.
**Earns its place** when there is a REAL wait (WebGL/asset-heavy heroes). If the page can paint in under ~1s, the best loader is none — don't manufacture a wait to show a logo.
**Implementation**: progress choreography maps a monotonic 0→100 counter to actual bytes/asset-count loaded — never fabricate progress, never jump backwards; choreograph the EXIT (counter resolves → curtain lifts revealing the hero mid-motion) so loading hands off into the signature moment. Skeletons are content-aware: mirror the final layout's exact boxes (reserving space, CLS < 0.05), not generic gray bars. The shimmer ban bites here: no shimmer loop past 1.5s — after that, show honest progress or content.
**Restraint rule**: loader appears once per session, ≤ 1s of user-blocking time beyond real load, always skippable. Returning visitors skip theater entirely.

### 8. Easter eggs & the delight budget
A hidden, optional surprise — konami code, console credits, a 404 that plays.
**Earns its place** for brands with a wink in their voice, aimed at the 1% who explore. It signals "humans who care made this" — which is exactly why it must be flawless.
**Implementation**: keyboard-sequence or long-idle triggers; the whole egg ≤ 5KB JS, lazy-loaded, zero effect on landing metrics; fully keyboard-dismissable; obeys reduced-motion like everything else.
**Restraint rule**: ONE per project. It never gates content, never interrupts a task, never fires uninvited. If the main experience isn't yet at award grade, the delight budget is zero — polish the signature moment instead.

## Quality gates
Run these before claiming done; `award-judge` will run them anyway.
- `../../references/motion-canon.md` — token-only durations/easings; enter ≠ exit; the 1-second interruptibility ceiling; the slop bans (entrance-fadein theater and `transition: all` are the two this skill's users trip most).
- `../../references/performance-budgets.md` — 60fps at 4× CPU throttle with zero long tasks > 50ms; transform/opacity only; no layout reads in scroll handlers; recorded numbers or it didn't happen.
- `../../references/accessibility-motion.md` — static hit areas under magnetic drift; custom cursors off on `(pointer: coarse)`; native scroll survives smoothing (Lenis must not swallow keyboard/AT scroll); reduced-motion is a designed variant with screenshots to prove it.
- `../../references/awwwards-scoring.md` — the memory gate (one signature moment, named) and the restraint clause (any slop-list hit caps Design at 6).
- `../../references/gsap-recipes.md` — scrub vs toggle discipline for scroll narratives, pinning rules, Flip for shared-element continuity when View Transitions isn't available, and the React cleanup traps.


## Deliverables
1. **Standalone prototype** — one self-contained HTML file per signature moment, with real assets, runnable anywhere.
2. **Verification record** — throttled fps, long-task count, and device tested, written into the inventory. Claims without numbers are returned.
3. **Interaction inventory** — one row per interactive element:

| Element | Trigger | States (rest/hover/active/focus/disabled) | Motion (token durations + easing) | Reduced-motion fallback | Touch / keyboard behavior | Verified fps (4× throttle) |
|---|---|---|---|---|---|---|
| Project card | hover / focus | 5 defined | image reveal 240ms `--ease-out-quart` | crossfade | tap = navigate; tabbable | 60 |

Every cell filled. "n/a" is allowed; blank is not — a blank cell is an undesigned state.
4. **Reduced-motion spec** — per interaction, what the reduced path shows, with before/after screenshots.

## Related skills
- **wow-director** — decides WHICH moment is the signature before this skill builds it; orchestrates the whole suite.
- **motion-choreography** — owns the system-wide timing language this skill's moments must speak.
- **webgl-shader-fx** — when the signature moment needs shaders/3D beyond DOM reach.
- **ux-narrative** — supplies the story structure scroll-driven scenes dramatize.
- **design-dna-forge** — the visual identity hover states and cursors must express.
- **award-judge** — gates every deliverable here against the canon; nothing ships around it.
