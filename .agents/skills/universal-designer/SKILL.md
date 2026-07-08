---
name: universal-designer
description: 'UniversalDesigner is the single entry point for ALL frontend design, animation, and 3D work. It understands the project architecture (stack, existing design infra, constraints), sets a design direction, then routes execution to the right specialist skill(s) among 24 design skills: 3D engines (Three.js, R3F, Babylon, PlayCanvas, A-Frame), scroll/motion libraries (GSAP/ScrollTrigger, Locomotive, Barba, AOS, Framer Motion, React Spring, Anime.js), component/asset libraries (Magic UI/React Bits, Lottie, Rive, PixiJS), authoring pipelines (Blender, Spline, Substance), and the design-system/taste layer (modern-web-design, ui-ux-pro-max, frontend-design). Use it whenever a task involves building, designing, redesigning, reviewing, fixing, or animating any UI/UX, web page, landing page, dashboard, component, hero, scroll experience, page transition, 3D scene, product viewer, data-viz, micro-interaction, or visual effect, on web or Flutter. It invokes specialists via the Skill tool.'
---

# UniversalDesigner

## Overview

UniversalDesigner is a **meta-orchestrator** ("the conductor") for 24 specialist
frontend skills. It does not reimplement animation/3D/design logic — it
**understands the project, decides the design direction, then calls the right
specialist skill(s)** via the Skill tool and composes their output into a
coherent, performant, accessible result that fits the existing codebase.

Use this skill as the **first stop for any visual/frontend task**. It guarantees
three things every other skill in isolation cannot:
1. The work **fits the project's actual architecture** (stack, conventions, deps).
2. The **right tool is chosen** (these skills heavily overlap — picking wrong is the
   most common failure: GSAP vs AOS, Three.js vs R3F, Lottie vs Rive, Motion vs Spring).
3. The pieces **compose** (layering, conflict resolution, perf, a11y, responsive).

## The mandatory workflow (run in order)

Follow these phases in order. Skip a phase only with a clear reason.

### Phase 0 — Understand the architecture FIRST (never skip)

Before any design decision, learn what is actually being built and on what.
Run the bundled detector, then confirm by reading the project:

```bash
bash scripts/detect_stack.sh [project-root]   # defaults to CWD
```

It reports: framework (React/Next/Vue/Svelte/Flutter/vanilla), package manager,
which design/animation/3D libraries are ALREADY installed, monorepo layout, and a
shortlist of recommended skills. Then verify by hand:
- Read `package.json` / `pubspec.yaml`, the framework config, and an existing
  component to match conventions (styling system, component patterns, file layout).
- Identify hard constraints. **These are project facts, not preferences** — e.g.
  React 19 peer conflicts (drei was dropped here for that reason), SSR/RSC
  server→client boundaries in Next, no-authored-assets (Lottie/Rive need source
  files), or "must not break the Flutter mobile app."
- Decide the **layer**: design-system/taste, UI motion, scroll, 3D, asset
  authoring, or a combination.

Load `references/architecture-playbook.md` for stack→skill mapping and how to
adapt to each architecture. **Never recommend installing a library the stack
can't support** (verify peer deps), and **reuse existing design infra** rather
than rebuilding it.

### Phase 1 — Establish design direction (the taste layer)

Decide *what it should look and feel like* before touching execution skills. Use
the three design-system skills in this order (they are complementary, not
redundant — see catalog):
1. **`modern-web-design`** — strategy: performance budget, accessibility baseline,
   motion philosophy, which pattern fits (scrollytelling? 3D viewer? data-viz?).
2. **`ui-ux-pro-max`** — structure & rules: run its `--design-system` first to get
   an AI-reasoned system (style, 161 color palettes, 57 font pairings, UX
   guidelines, anti-patterns) keyed to the product type and stack.
3. **`frontend-design`** — taste: commit to ONE bold/refined aesthetic direction,
   distinctive typography, spatial composition — so the result is not generic.

For a quick fix or a single component, a lightweight pass through these is fine —
scale the ceremony to the task.

### Phase 2 — Route execution to specialist skill(s)

Translate the design direction into concrete specialist skills using
`references/decision-matrix.md` (intent → skill, with overlap tie-breakers).
Invoke each chosen skill with the **Skill tool** using its `name` (e.g. invoke
`gsap-scrolltrigger`, `react-three-fiber`, `motion-framer`). Prefer the skill
already aligned with the detected stack (React project → R3F/Motion over
vanilla Three.js/Anime.js, unless a reason dictates otherwise).

### Phase 3 — Compose & integrate

When more than one specialist skill is used (the common case for rich
experiences), load `references/integration-and-quality.md` and apply the layering
rules from **`web3d-integration-patterns`**: assign each library a layer, make sure
two libraries never animate the same property, manage one render loop, and wire
state/refs correctly. This is where multi-library work succeeds or breaks.

### Phase 4 — Quality gates (always)

Before declaring done, verify against `references/integration-and-quality.md`:
- **Performance**: animate transform/opacity only; GPU-accelerate; lazy-load heavy
  3D/WebGL; respect a perf budget; dispose Three.js/PixiJS GPU resources.
- **Accessibility**: honor `prefers-reduced-motion`; contrast; keyboard nav;
  scroll-hijacking has an escape hatch.
- **Responsive**: works on mobile/tablet/desktop (this repo's standing rule).
- **Cleanup**: destroy instances / kill tweens / dispose on unmount (memory leaks
  are the #1 SPA bug across these libraries).
- **Mobile-app safety**: if the change touches shared UX, confirm it does not
  break the Flutter app in `apps/mobile`.

## The 24 skills at a glance

| Layer | Skills (invoke by name) |
|---|---|
| **Design system / taste** | `modern-web-design`, `ui-ux-pro-max`, `frontend-design` |
| **UI motion (React)** | `motion-framer`, `react-spring-physics`, `animated-component-libraries` |
| **UI motion (agnostic)** | `animejs` |
| **Scroll & transitions** | `gsap-scrolltrigger`, `locomotive-scroll`, `scroll-reveal-libraries` (AOS), `barba-js` |
| **3D engines** | `threejs-webgl`, `react-three-fiber`, `babylonjs-engine`, `playcanvas-engine`, `aframe-webxr` |
| **2D / effects / assets** | `pixijs-2d`, `lightweight-3d-effects` (Zdog/Vanta/Tilt), `lottie-animations`, `rive-interactive` |
| **3D authoring pipeline** | `blender-web-pipeline`, `spline-interactive`, `substance-3d-texturing` |
| **Integration meta** | `web3d-integration-patterns` |

Full descriptions, when-to-use, gotchas, and pairings: `references/skill-catalog.md`.

## Fast routing (full matrix in references/decision-matrix.md)

- **Simple fade/slide on scroll** → `scroll-reveal-libraries` (AOS). Don't reach for GSAP.
- **Complex scroll timeline / pin / scrub / parallax** → `gsap-scrolltrigger`
  (+ `locomotive-scroll` only if smooth-scroll container is required).
- **React UI animation / gestures / layout / exit** → `motion-framer`.
- **Physics-real, interruptible, momentum motion** → `react-spring-physics`.
- **Vanilla/SVG timeline, no React** → `animejs`.
- **Pre-built animated React components fast** → `animated-component-libraries`.
- **Multi-page site, SPA-feel transitions** → `barba-js`.
- **3D in React** → `react-three-fiber`; **3D vanilla/max control** → `threejs-webgl`;
  **physics/game/WebXR production** → `babylonjs-engine`; **ECS/editor game** →
  `playcanvas-engine`; **VR/AR/360** → `aframe-webxr`.
- **Designer-made AE animation** → `lottie-animations`; **stateful interactive vector**
  → `rive-interactive`; **decorative bg/tilt, no heavy framework** →
  `lightweight-3d-effects`; **thousands of 2D sprites/particles** → `pixijs-2d`.
- **Need 3D assets** → author with `blender-web-pipeline` / `spline-interactive`,
  texture with `substance-3d-texturing`, render with three/R3F/Babylon.
- **Combining 3+ libraries** → `web3d-integration-patterns` for architecture.

## Golden rules (guardrails)

1. **Architecture before aesthetics.** Phase 0 is non-negotiable. A beautiful
   component that fights the stack is a defect.
2. **Reuse before rebuild.** If the project already has motion/effects/3D infra or
   components (e.g. existing AnimatedNumber/Accordion/Skeleton/AuthShell), extend
   them; don't duplicate.
3. **Pick one tool per job.** Resolve overlaps with the decision matrix; do not
   stack two libraries that do the same thing (e.g. AOS + GSAP for the same reveal).
4. **Verify deps before suggesting installs.** Honor peer-dep constraints (React 19,
   SSR/RSC, Flutter). Don't propose an asset-driven skill (Lottie/Rive) when no
   authored asset exists.
5. **Always ship the quality gates** (Phase 4). Motion without reduced-motion,
   responsiveness, and cleanup is incomplete.
6. **Invoke, don't reinvent.** Delegate execution detail to the specialist skill
   via the Skill tool; UniversalDesigner orchestrates and integrates.

## When to load each reference

- `references/skill-catalog.md` — deep dossier on every skill (what/when/gotchas/pairs).
  Load when choosing between similar skills or needing a skill's specifics.
- `references/decision-matrix.md` — intent→skill routing + overlap tie-breakers.
  Load at Phase 2.
- `references/architecture-playbook.md` — stack detection details + per-architecture
  adaptation (React/Next/Vue/Svelte/Flutter/vanilla). Load at Phase 0.
- `references/integration-and-quality.md` — composition patterns, layer assignment,
  conflict resolution, performance & accessibility gates. Load at Phases 3–4.
