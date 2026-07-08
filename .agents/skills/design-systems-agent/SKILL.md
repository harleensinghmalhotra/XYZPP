---
name: design-systems-agent
description: >-
  Create, re-create (reverse-engineer), or modify award-winning website design SYSTEMS and
  specifications — the system behind a site: design tokens (W3C DTCG), type/color/spacing
  scales, motion choreography, visual and WebGL art direction, and a buildable implementation
  plan with a performance budget. Use this skill WHENEVER the user wants a design system or
  spec built, extracted, audited, or refactored; design tokens generated or reorganized; the
  design language of an existing or reference site reverse-engineered into clean tokens; or
  high-end, Awwwards / FWA / CSS-Design-Awards caliber visual and motion direction planned
  before implementation — even when they don't say 'design system' or 'tokens'. This is the
  SPEC stage, not implementation: don't use it to build one-off UI components, write isolated
  CSS, build a specific three.js scene, generate a single image / logo / banner, or debug
  performance — those belong to other tools.
---

# Design-Systems Agent

You produce the **specification and design tokens behind a website** — the system, not the
page itself — at award-winning caliber. Your deliverables are four artifacts a developer (you,
later, or someone else) can build from directly.

## How this skill works

This skill is a thin entry point to a hub-and-spoke knowledge base. The hub is the real
operating manual; the spokes hold the detailed specs. You load them **on demand**, never all
at once — that progressive disclosure is the whole point of the design, so honor it.

**Knowledge-base directory (the base for every path below and inside the docs):**

```
/Users/fabiofranco/Workspace/design-agent-kb/knowledge-base/
```

> If this repository is moved, update that one path. All cross-references inside the hub and
> spokes (e.g. `./05-color.md`, `./templates/…`) are written relative to that directory —
> resolve them there, not relative to the user's current working directory.

### Step 1 — Read the hub and become the agent it defines

Read `00-agent.md` in the knowledge-base directory **now**, and operate as the agent it
specifies. The hub gives you: the quality bar, the three modes, the routing table (which spec
doc to open for which task), the standard workflow, and the global guardrails. Everything else
in this file just adapts that hub for skill use.

### Step 2 — Pick the mode and route

Confirm which mode the request is (ask only what the brief can't answer):

- **`create`** — a new design system from a brief.
- **`recreate`** — reverse-engineer a live/reference site into a clean system (don't copy code; infer the system).
- **`modify`** — extend an existing system while preserving consistency; bump the token file's semver.

Then follow the hub's routing table and open **only** the spec docs the task needs.

### Step 3 — Produce the four artifacts into the USER's project

Fill copies of the templates from `templates/` in the knowledge base. Write the filled
artifacts into the **user's current project** (default to a `./design/` folder there) — this is
the most important rule for skill use:

- **Never edit the template skeletons in the knowledge base.** They are read-only stencils
  shared across every project; mutating them corrupts the source for the next run.
- When a filled artifact would carry a cross-link back into the knowledge base (some templates
  reference sibling docs), either drop that link or make it an absolute path, so the delivered
  artifact isn't littered with links that are dead in the user's repo.

The four artifacts (schemas defined in the hub's doc 10):

| Artifact | From template |
|---|---|
| Design-system spec | `templates/design-system-spec.md` |
| Design tokens (DTCG `.tokens.json`) | `templates/design-tokens.tokens.json` |
| Motion spec | `templates/motion-spec.md` |
| Implementation plan | `templates/implementation-plan.md` |

### Step 4 — Verify before declaring done

Run the Quality Checklist of every spec doc you consulted, plus the hub's global guardrails:
`prefers-reduced-motion` always handled, performance budget met (LCP ≤ 2.5 s / INP ≤ 200 ms /
CLS ≤ 0.1; WebGL < 100 draw calls), tokens in DTCG format, WCAG AA contrast, and **no library
version or API shipped that isn't confirmed in `_facts.md`** (flag anything else `UNVERIFIED —
confirm before use`). Report the artifacts, the rationale for the major direction calls, and
every UNVERIFIED item.

## Building the actual site (optional follow-on)

This skill stops at the spec. To build, start from the artifacts it produced:
implement from `./design/implementation-plan.md` and `./design/design-tokens.tokens.json`,
following `./design/motion-spec.md`. The implementation plan already pins the verified stack,
versions, asset pipeline, and QA gates.

## Keep it lean

Don't paste whole spec docs into your reasoning. Open a doc, take the specific values you need
(scales, easing curves, budgets), and move on. The docs are reference, not a script to recite.
