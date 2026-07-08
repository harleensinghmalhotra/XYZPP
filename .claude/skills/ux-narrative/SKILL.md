---
name: ux-narrative
description: Structures award-grade sites so they convert — narrative arcs for landing pages, information architecture that survives heavy art direction, delight budgeting, and calm conversion flows inside designed worlds. USE WHEN: "structure this landing page", "what's the story of this site", "our beautiful site doesn't convert", "plan the scroll narrative", "map sections to story beats", "information architecture for a creative site", "users get lost in the experience", "where should the wow moment go", "the form feels off-brand", "content strategy before design", "how long should this page be", "run a 5-second test", "rank which interactions to keep", "mobile version of this narrative", "scroll-depth drop-off analysis".
license: MIT
metadata:
  suite: award-grade
  version: "1.4.0"
---

# UX Narrative — the architect who makes wow usable, so delight converts instead of decorates.

## Mission

Award sites die two deaths: boring ones nobody remembers, and gorgeous ones nobody can use. This skill owns the second death. It structures pages as stories with jobs — every scroll beat earns attention, every wow moment is placed where the narrative needs it, and every conversion surface stays calm enough to actually convert.

## When NOT to use

- **Utility-first products** (dashboards, admin panels, settings screens). They need task flows and Jakob's-law conventions, not narrative arcs. Forcing story structure onto a CRUD screen is malpractice.
- **Docs, blogs, and reference content.** Readers arrive mid-page from search; a linear arc assumes an entry point they don't use. Give them scannable hierarchy instead.
- **When you have no real content yet.** This skill's output is only as good as its inputs — go get the actual value proposition and copy first (see Content-first prototyping below; it IS the prerequisite, not a step you skip).
- **Post-hoc rationalization.** If the page is built and shipping tomorrow, a narrative audit produces regret, not improvement. Use `award-judge` for a scored verdict and triage instead.
- **Pure brand/art pieces with no conversion goal.** If nothing is being sold, signed up for, or contacted, the delight budget math below doesn't apply — hand structure to `wow-director` and let art lead.

## Workflow

1. **Extract the 5-second contract** from the client/brief: what is this, for whom, why care, what next. Write the four answers in ≤ 12 words each. If you can't, the brief is incomplete — stop and ask.
2. **Gather real content**: actual headline, actual proof points, actual CTA labels, actual pricing. No lorem ipsum past this step. The copy is the design brief.
3. **Write the beat sheet**: map the narrative arc (hook → tension → proof → resolution → action) to scroll positions. One beat per 1–2 viewport-heights. Deliver as the narrative storyboard (format below).
4. **Place the signature moment** — with `wow-director` — at the hook or the resolution. Never mid-proof. Record the decision and the reason.
5. **Draw the IA map**: nav items, wayfinding anchors, escape hatches from immersive sections, and the path from any beat to the primary CTA in ≤ 2 interactions.
6. **Rank the delight budget**: list every proposed animated/interactive moment, rank by narrative value, cut the bottom half. Hand the survivors to `signature-interactions` and `motion-choreography` with their priority rank attached.
7. **Design conversion surfaces calm**: forms, checkout, contact — specify the restraint treatment explicitly so the visual team doesn't "fix" the plainness later.
8. **Mobile pass first, not last**: re-cut the beat sheet for a 375px viewport and thumb reach. If the mobile narrative doesn't stand alone, the desktop one is a facade.
9. **Instrument and verify**: scroll-depth funnel per beat, rage-click detection on decorative elements, [HUMAN] 5-second test with ≥ 5 people (or the [EMULATED] fresh-context model panel as a disclosed pre-check when no tester is available yet). Record numbers. "Should work" is not a deliverable.

## Technique library

### The 5-second contract
A first-time visitor must be able to answer four questions within 5 seconds of first paint: **what is this** · **who is it for** · **why should I care** · **what do I do next**. This is the Usability axis's opening test in `../../references/awwwards-scoring.md`, and it is where art direction most often commits fraud — a stunning hero that answers zero of the four. Art direction *serves* the contract: the visual mood answers "why care" emotionally while the headline answers it literally. If the hero animation delays the headline past ~1.5s, the contract is broken regardless of how good the animation is.

**Test script — [HUMAN], ≥ 5 real people, run it, don't imagine it and don't simulate it:** show the page for 5 seconds to someone unfamiliar, hide it, ask the four questions. ≥ 4 of 5 people answering 3+ correctly = pass. Record the answers verbatim — wrong guesses tell you exactly which element is lying. This is a human-judgment ritual: an agent has no naive first impression to report, so **request human testing and do not simulate respondents** — a fabricated set of five "user" answers is a faked verification, not a cheaper one.

**[EMULATED] agent-runnable proxy (when no human tester is available yet):** ask 5 *fresh-context* model instances — no prior exposure to the brief, the brand, or this conversation — to look at the page for the first time and answer the same four questions cold. Disclose the method plainly wherever the result is recorded ("5-instance fresh-context model panel, EMULATED proxy, not user data") and treat it as a cheap pre-check that catches an obviously broken hero (e.g., a headline that never renders in view). It never substitutes for the human pass in a shipped verdict — a model panel cannot report confusion, hesitation, or "why should I care" the way a person can, and reporting it as if it were user research is the exact honesty failure this law exists to prevent.

### Narrative arc design for landing pages
Landing pages are five-act structures mapped to scroll:

| Beat | Job | Typical depth | Signature moment allowed? |
|---|---|---|---|
| Hook | Contract + emotional claim | 0–1 viewport | YES — strongest position |
| Tension | The problem, felt not listed | 1–2.5 vh | No — tension needs friction, not fireworks |
| Proof | Evidence: demo, numbers, logos, testimonials | 2.5–5 vh | NEVER — proof demands credibility, wow here reads as compensation |
| Resolution | The transformed after-state | 5–6.5 vh | YES — second-strongest position |
| Action | CTA, calm and unmissable | final viewport | No — this is a conversion surface |

The signature moment (one, per `../../references/awwwards-scoring.md` — more than one is noise) lives at the hook or the resolution. Mid-proof wow is the classic agency mistake: it interrupts exactly when the visitor is deciding whether to believe you. Beats are checkpoints, not cages — a visitor deep-linking to pricing skipped your tension act; the page must still work.

**Narrative bans** (structural slop, as fatal as the motion slop list):
- **No preloader-as-hook.** A loading screen is not act one; it's a tax before act one. If the hero needs a preloader, the hero is too heavy — fix the payload, don't theme the wait.
- **No double hook.** Two competing claims above the fold means neither was believed in. Pick one.
- **No proof-free arc.** Mood → mood → CTA converts nobody; the proof beat is load-bearing and needs at least one real number, demo, or named customer.
- **No CTA ambush.** The action beat is earned by the resolution, not sprung mid-tension. Sticky CTAs are fine; modal interrupts before the proof beat are not.
- **No orphan beats.** Every section must advance a beat. "We also do X" sections that serve no act get cut or moved to a secondary page.

### Information architecture under art direction
Creative direction erodes IA one "cleaner" decision at a time. Hold these lines:
- **Nav survives creativity.** A hamburger on desktop for a 4-item nav is a design ego decision, not a UX one. Persistent nav or a shrinking-on-scroll bar; the site's sections reachable in ≤ 2 interactions from anywhere (the jury tests exactly this).
- **Wayfinding in scroll narratives.** Long narratives need position feedback: a progress indicator, numbered chapters, or section labels that update. A visitor 4 viewports deep who can't answer "how much is left?" starts scanning instead of reading.
- **Escape hatches from immersive sections.** Every full-viewport takeover (WebGL scene, horizontal-scroll gallery, pinned sequence) needs a visible skip affordance and must release native scroll per `../../references/accessibility-motion.md` — keyboard, PgDn, and screen-reader virtual scroll all keep working. Trapping users in your best section is how your best section generates your worst analytics.

### The delight budget
Attention is spent once per visit; every animated moment withdraws from the same account. Protocol: list every proposed moment, score each 1–5 on **narrative value** (does it advance a beat?) and 1–5 on **cost** (attention demanded + performance weight per `../../references/performance-budgets.md`). Rank by value-minus-cost. **Cut the bottom half. Not the bottom quarter — the bottom half.** What survives gets built properly by `signature-interactions`; what's cut gets written down so the client sees restraint as a decision, not an omission. This is the restraint clause from `../../references/awwwards-scoring.md` turned into arithmetic: one loud idea, ten quiet perfect decisions.

### Form and flow design inside designed worlds
The canon's restraint clause applied to money and data-entry: **conversion surfaces get the calm treatment.** Concretely:
- No entrance animation on form fields; no parallax within 1 viewport of a form; motion limited to `--duration-instant`/`--duration-fast` state feedback per `../../references/motion-canon.md`.
- Labels always visible (placeholder-as-label is a ban), errors inline via `aria-describedby`, focus moved to first error — the a11y canon's form rules apply *especially* inside designed worlds.
- The visual system stays (type, color, spacing) — the *theatrics* stop. A calm form inside a wild site reads as confidence; a wild form reads as a site that doesn't want your money.
- Checkout/signup flows: one job per screen, progress visible, back always safe. Every field you cut is worth more than any animation you add.

### Content-first prototyping
Real copy before layout — the copy IS the design brief. A hero designed around "Lorem ipsum dolor" breaks when the real headline is 11 words; a testimonial card sized for two lines lies about the 6-line quote that's actually coming. Process: write the page as a plain text document first (headline, subhead, every section's copy, every CTA label, every proof point with its real number). If the text document doesn't sell, no amount of art direction will — and if it does, layout becomes an amplification problem instead of a disguise problem. Hand the text doc to `design-dna-forge` as the input for visual language, not the other way around.

### Mobile as the primary narrative
Most first visits are mobile; design the 375px narrative first, then let desktop elaborate.
- **Scroll-length tolerance: ~6–8 viewport-heights** for a narrative landing page. Beyond that, completion craters — merge beats or move content to secondary pages rather than stretching the arc.
- **Thumb reach**: primary CTA and nav trigger in the bottom half of the viewport; hit targets ≥ 44×44px per `../../references/accessibility-motion.md`. Hover-dependent reveals need tap equivalents or they simply don't exist on mobile.
- **Never hide the contract on small screens.** The mobile hero must still answer all four 5-second questions — cutting the subhead "for space" cuts the "why care."
- Signature moments that can't perform on mobile (heavy WebGL, cursor-driven effects) need a designed mobile alternative from `webgl-shader-fx` or `motion-choreography` — a static crop of the desktop wow is an admission, not an adaptation.

### Measurement — where wow meets drop-off
Instrument the narrative, then believe the numbers over the mood:
- **Scroll-depth funnel per beat**, not per percentage. Fire an event as each beat enters view:

```js
document.querySelectorAll("[data-beat]").forEach((el) => {
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { track("beat_viewed", { beat: el.dataset.beat }); obs.disconnect(); }
  }, { threshold: 0.4 }).observe(el);
});
```

  Read it as a funnel: hook → tension → proof → resolution → action. A cliff at one beat is a content problem *at that beat*, not a "page too long" problem.
- **Rage-click detection** (3+ clicks, same spot, < 1s): rage clicks on decorative elements mean the art direction promised interactivity it didn't deliver — either wire it or make it read as static.
- **The correlation that matters**: if drop-off spikes *at* the signature moment, the wow is costing you the story — check its load cost against `../../references/performance-budgets.md` before blaming the concept; a 4MB hero that stutters kills more visitors than a boring one.
- Verify in a browser and record the numbers (funnel percentages, LCP, 5-second-test scores) in the project report. Claims without recorded numbers don't count as verification.

## Quality gates

Gate against the canon before anything ships — these are the rules that bite this skill hardest:
- `../../references/awwwards-scoring.md` — the Usability axis (30%) is this skill's home turf: 5-second contract, any section in ≤ 2 interactions, mobile parity not mobile survival. The **memory gate** decides signature-moment placement; the **restraint clause** decides the delight budget.
- `../../references/motion-canon.md` — the 1-second ceiling and interruptibility rule govern every narrative reveal; the entrance-fadein-theater ban is a narrative failure too (if every beat animates in, no beat matters).
- `../../references/performance-budgets.md` — LCP < 2.5s is a 5-second-contract dependency (a contract that hasn't painted is broken); CLS < 0.05 protects reading mid-narrative.
- `../../references/accessibility-motion.md` — escape hatches, native scroll survival, heading hierarchy under art direction, 44px targets, calm-form a11y. Structure must survive the wow.

## Deliverables

1. **Narrative storyboard (beat sheet)** — table: beat · scroll depth (vh) · copy (real, final-draft) · visual/motion intent · conversion job · owner skill. One row per beat, signature moment flagged, cuts listed at the bottom with reasons. Example row:

   | Beat | Depth | Copy | Visual/motion intent | Job | Owner |
   |---|---|---|---|---|---|
   | Hook ★ | 0–1 vh | "Ship audits in hours, not weeks" | Kinetic type resolve, ≤ 1s, interruptible | Contract + claim | signature-interactions |

2. **IA map** — nav structure, section anchors, wayfinding mechanism, escape hatches, and the ≤ 2-interaction path proof from every beat to the primary CTA.
3. **Interaction-priority ranking** — the delight-budget table (moment · value · cost · rank · KEEP/CUT), signed off before motion work starts.
4. **5-second-test script + results** — the four questions, the pass bar, and recorded verbatim answers from ≥ 5 testers, labeled **[HUMAN]**. If run before human testers are available, the **[EMULATED]** fresh-context model panel result may stand in as a disclosed, temporary proxy — never merged into or reported as the human result.

## Related skills

- **wow-director** — orchestrates the whole suite; this skill supplies the structure the director's concept must live inside.
- **award-judge** — gates everything; its Usability score is largely a verdict on this skill's work.
- **signature-interactions** / **motion-choreography** — build the moments this skill ranks and places; they receive the beat sheet and priority ranking as their brief.
- **design-dna-forge** — turns the content-first text doc into visual language.
- **webgl-shader-fx** — owns immersive sections; this skill owns their escape hatches and mobile alternatives.
- **video-motion-studio** — video beats slot into the arc like any other beat, same budget rules.
