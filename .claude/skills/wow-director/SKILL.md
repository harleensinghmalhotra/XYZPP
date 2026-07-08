---
name: wow-director
description: Runs the full award-grade agency pipeline as a creative director — boots from the project taste ledger (design/TASTE.md) so settled taste stays settled, interrogates the brief down to one feeling, forces a choice between three concept territories, commits to a single signature moment, assigns sibling skills and budgets, and drives the build/judge/ship loop until verified numbers exist. USE WHEN: "build me an award-worthy site", "make this feel like an Awwwards winner", "design a landing page that people remember", "I have a brief, where do we start", "plan a portfolio site with wow factor", "creative direction for this product page", "which effects should this site have", "orchestrate a full redesign", "our site looks generic, direct a rework", "pitch me three creative directions", "what's the signature moment for this project", "scope this design engagement", "assemble the design pipeline for this app", "turn this Figma into something jury-grade".
license: MIT
metadata:
  suite: award-grade
  version: "1.4.0"
---

# wow-director — the creative director that runs the room, not the tools

## Mission
Every forgettable site died the same death: nobody decided what it was FOR, so everything got a little effect and nothing got a point of view. This skill is the deciding function — it converts a vague brief into one feeling, one signature moment, and one ordered plan of sibling skills with budgets attached. It does not implement; it directs, and it kills things.

## When NOT to use
- Single-component or single-page-section tasks with a clear spec — go straight to `signature-interactions` or `motion-choreography`; a director for a button is theater.
- Pure engineering work (refactors, bug fixes, API wiring) — no creative decision exists to direct.
- The client has locked art direction and you are executing to a redline — direction is done; you'd only re-litigate it.
- Internal tools where the honest success metric is task speed, not memory — run `ux-narrative` for flow clarity and stop there.
- When the user explicitly asks for one technique ("add a shader hover") — deliver the technique, not a pipeline.

## Workflow
1. **Taste boot, then brief interrogation.** If `design/TASTE.md` exists, read it first (`../../references/taste-memory.md`): the stable protect-list is inherited into this engagement as standing do-not-touch lines, and standing dispositions are settled — reopening one requires THE ONE FEELING to have changed or the finding to have returned as most-damaging; anything else is re-litigating decided taste. Then fill the brief template (below) by asking, not assuming. Refuse to proceed past three unknowns: the ONE feeling, the ONE thing a visitor must remember, and the target calibration band from `../../references/awwwards-scoring.md` (SOTD band ≥ 7.5 changes the budget math versus honorable mention 6.5–7.4). Verify: TASTE.md read (or confirmed absent), template complete, feeling is one word, memory is one sentence.
2. **Reference safari.** Collect 3–5 references. For each, write WHAT to steal structurally (a pacing idea, a nav pattern, a type-scale relationship) and one line on why it works. Ban literal theft: never the same easing + same layout + same palette from one source. Verify: every reference has a named structural takeaway, not "vibes".
3. **Concept territories.** Write exactly 3 distinct directions. Each is one sentence + one signature-moment candidate + the feeling it optimizes. If two territories could be described by the same sentence, they're one territory — replace one. Present them and force a CHOICE. Verify: user (or you, if autonomous) picked one and said why the other two lose.
4. **THE SIGNATURE MOMENT decision.** Name the single interaction/scene/transition that will be the 24-hour memory (`awwwards-scoring.md` Memory gate). Write it as: trigger → what happens → what it means → duration class from `../../references/motion-canon.md`. Everything else on the site now exists to support this, and nothing may compete with it. Verify: one signature, written down, with a duration token.
5. **Craft plan.** Assign sibling skills in firing order using the triage matrix (below). Attach budgets per skill from `../../references/performance-budgets.md` (JS, LCP, frame) and the reduced-motion mandate from `../../references/accessibility-motion.md`. Verify: every planned effect has an owner skill AND a budget line; anything without both is cut now. Also check the project scaffolding (`../../references/project-scaffolding.md`): token files, the /lab isolation route, and the canon-audit guard wired into the build — missing scaffolding gets fixed BEFORE craft work starts, not after it drifts.
6. **Build loop, checkpoint order: structure → typography → motion → signature → sound?** Structure first (real HTML, landmarks, content), typography second (the voice), ambient motion third, signature moment fourth — it needs the finished stage to land on. Sound is a question mark on purpose — answered by `../../references/sound-design.md` when the brief's feeling demands an answer: always user-initiated, never autoplay. At each checkpoint: screenshot/record, compare to the brief's feeling, only then advance. Verify: checkpoint artifact exists before the next stage starts.
7. **Judge loop.** Send the build to `award-judge` for a scored verdict. You are the director: juries are advisors, the director decides. Accept every performance/a11y/slop finding without argument (those are gates, not opinions). For taste findings, accept, defer, or reject — but a rejection requires a written reason tied to the brief's feeling, or it's ego. Record every disposition into the current verdict block in `design/TASTE.md` (`dispositions[]`, per `../../references/taste-memory.md`) — a disposition in chat history gets re-litigated next session; one in the ledger stays decided. Verify: each finding has a disposition — accepted / deferred / rejected-with-reason — written to TASTE.md.
8. **Ship ritual.** No "should work". The evidence source is `node scripts/judge-evidence.mjs --url <url>` → `evidence/LEDGER.md`. Record: Lighthouse mobile score, LCP/CLS/INP, 4×-throttle frame trace result during the signature moment, reduced-motion screenshots, keyboard-only pass — the script rows plus the two hand-run rows, all logged in the ledger. Numbers go in the project report; a claim without a recorded number is not verification. Verify: all five artifacts recorded in `evidence/LEDGER.md`.

## Technique library

### The brief template (fill before anything else)
```
PROJECT: <name>                      DEADLINE: <date>
THE ONE FEELING: <single word — e.g. "precise", "alive", "vast">
THE MEMORY: after 24h, a visitor tells a friend: "<one sentence>"
AUDIENCE: <who arrives, in what state, on what device>
SUCCESS BAND: <honorable-mention 6.5–7.4 | SOTD 7.5–8.4 | SOTM ≥ 8.5>
REAL CONTENT STATUS: <exists | partial | lorem — lorem means content risk owns the schedule>
HARD CONSTRAINTS: <brand, stack, CMS, legal, perf floor>
FORBIDDEN: <anything the client/brand bans up front>
SCOPE CLASS: <1-day | 1-week | 1-month>  (drives the triage matrix)
```
A brief where THE ONE FEELING is a list ("modern, clean, bold") is unfilled. Push until it's one word — the word is what breaks ties for the next four weeks.

### Writing territories that force a choice
A territory is a bet, not a mood board. Format each as three lines:
```
T1 "LEDGER":  Everything arrives like entries in a precise ledger — rules, columns, monospace numerals.
    Signature candidate: numbers that tick-roll into place as each section settles (--duration-base per digit).
    Optimizes: "precise". Loses: warmth.
T2 "TIDE":    The page breathes — content surfaces and recedes on a slow vertical rhythm.
    Signature candidate: one scroll-driven hero where the product rises through a layered gradient sea (--duration-cinematic, interruptible).
    Optimizes: "alive". Loses: density.
T3 "ARCHIVE": A flat index of everything at once; hierarchy comes only from type and hover.
    Signature candidate: hover on any index row expands a full-bleed preview in <180ms.
    Optimizes: "vast". Loses: guidance.
```
The "Loses:" line is mandatory — a territory that costs nothing is a platitude. If the user can't pick, the brief's ONE FEELING is wrong; go back to step 1, not forward.

### Signature moment spec (worked example)
```
SIGNATURE: "the ledger settles"
Trigger:    first scroll past the hero (once per session)
Behavior:   the loose hero typography snaps to a strict baseline grid; key metrics
            tick-roll from 0 to real values, 40ms stagger, reading order
Meaning:    chaos → precision; the product's promise performed, not claimed
Duration:   --duration-cinematic (900ms total), interruptible by scroll/click/key
Budget:     transform/opacity only; zero long tasks >50ms in the trace; no added JS lib
Reduced:    grid renders pre-settled; numbers crossfade to final values (--duration-fast)
Owner:      motion-choreography (timing system) + signature-interactions (trigger wiring)
```
Every line is checkable later. A signature spec you can't verify in a browser is a wish, not a decision.

### One loud idea, ten quiet decisions (the doctrine)
The strongest submissions have ONE loud idea and ten quiet, perfect decisions (`awwwards-scoring.md`, restraint clause). Operationalize it: keep a two-column ledger — LOUD (max one entry: the signature moment) and QUIET (type scale, easing family, grid rhythm, link states, focus rings, 404, form errors, empty states, loading strategy, reduced-motion art direction). When someone proposes a second loud thing, it must either replace the signature or become quiet. There is no third column.

### Kill-your-darlings protocol
For any beloved effect that's in doubt, run the four questions in order; first "no" kills it:
1. Does it serve THE ONE FEELING? (not "is it cool")
2. Does it survive the budget? (frame trace at 4× throttle, JS weight, LCP impact — numbers, not confidence)
3. Does it have a reduced-motion equivalent designed with equal care?
4. Would the signature moment be weaker without it? (if the site is merely "less busy" without it, it was noise)
Ritual: write one sentence of eulogy in the project notes ("cut the WebGL cursor trail — competed with the hero reveal, +180KB") and move on. The eulogy prevents re-litigation next week. Cut fast, cut early — a darling killed at concept stage costs a sentence; killed at ship, a sprint.

### Scope triage (what a deadline buys)
| Scope | Signature moment class | Siblings fired | Explicitly out |
|---|---|---|---|
| **1 day** | One perfected micro-interaction or one page transition (`--duration-base`/`--duration-slow` class) | `motion-choreography`, `award-judge` | WebGL, custom video, bespoke type system — a rushed shader loses to a perfect hover |
| **1 week** | One scroll-driven sequence, hero reveal, or view-transition system | + `design-dna-forge`, `signature-interactions`, `ux-narrative` | `webgl-shader-fx` unless the hero IS the product; `video-motion-studio` |
| **1 month** | A scene: WebGL hero, narrative scroll world, or filmic launch package | Full roster as the brief demands | Nothing by default — but each sibling still needs a budget line to fire |
Rule: scope down the signature before scoping down the quiet decisions. A 1-day job with perfect type and one crisp interaction beats a 1-day job with a janky "cinematic" hero every time.

### Sibling selection matrix (who's overkill for what)
| Brief type | Fire | Overkill (do NOT fire) |
|---|---|---|
| Docs / content site | `motion-choreography`, `ux-narrative`, `award-judge` | `webgl-shader-fx`, `video-motion-studio` — readers came to read |
| Product marketing page | `design-dna-forge`, `signature-interactions`, `motion-choreography`, `ux-narrative`, `award-judge` | `webgl-shader-fx` unless the product is 3D/spatial |
| Portfolio / agency site | `design-dna-forge`, `signature-interactions`, `webgl-shader-fx` (if band ≥ 7.5), `motion-choreography`, `award-judge` | `video-motion-studio` unless film is the work being shown |
| App UI / dashboard | `design-dna-forge`, `motion-choreography` (UI class durations only), `ux-narrative`, `award-judge` | `webgl-shader-fx`, cinematic anything — motion-canon bans bounce/spectacle on product UI |
| Launch film / promo | `video-motion-studio`, `design-dna-forge`, `award-judge` | `signature-interactions` — there's no pointer in a video |
Every skill you don't fire is budget returned to the ones you do. Firing the whole roster on every brief is the junior tell this matrix exists to prevent.

### Why the checkpoint order is structure → typography → motion → signature → sound
- **Structure first**: real HTML, real content, landmarks, heading hierarchy. Motion applied to lorem ipsum gets rebuilt when content lands — always. Content risk owns the schedule (see brief template).
- **Typography second**: type is 90% of the design surface on most sites and the cheapest place to earn the Design 40% axis. Locking the type scale before motion means motion has real targets with final metrics — no CLS surprises from font swaps mid-animation.
- **Ambient motion third**: the ONE easing family and duration scale go in as a system (CSS custom properties from `motion-canon.md`), applied to hovers, reveals, transitions. This is the quiet column of the ledger.
- **Signature fourth**: it lands on a finished stage. Building the signature first (the junior instinct) means it gets rebuilt twice and its perf budget gets eaten by whatever ships around it.
- **Sound last, and usually never**: only if THE ONE FEELING demands it — then directed per `../../references/sound-design.md` — always behind a user gesture, always with a visible control. Autoplay audio is an instant credibility kill in front of any jury.

### Directing the judge loop (juries advise, directors decide)
`award-judge` returns a score table, the most damaging weakness, three fixes, and a do-not-touch list. Triage in this order: (1) gate failures — perf, a11y, slop-list hits — are accepted unconditionally; (2) the "most damaging weakness" gets a fix or a written defense; (3) taste-level suggestions are weighed against THE ONE FEELING — a fix that improves the score but dilutes the feeling is rejected in writing. Every disposition lands in `design/TASTE.md` per `../../references/taste-memory.md`; a rejection that holds across two subsequent verdicts becomes standing and stops being an argument. Never iterate more than 3 judge loops without shipping something; past that you're polishing anxiety, not the site.

## Quality gates
- `../../references/awwwards-scoring.md` — the Memory gate forces step 4 (one signature, exactly one); the restraint clause backs the loud/quiet ledger; the target band from the brief sets when to stop polishing (≥ 8.5: defend, change nothing without reason).
- `../../references/motion-canon.md` — one easing family + one duration scale per project is a DIRECTOR'S decision made in step 5, not left to whoever animates last; the 1-second ceiling and the slop bans bound every signature-moment candidate in step 3.
- `../../references/performance-budgets.md` — budgets are assigned per sibling at craft-plan time (step 5) and re-measured at ship (step 8): LCP < 2.5s, CLS < 0.05, INP < 200ms, 60fps at 4× throttle, < 200KB landing JS. The test ritual's recorded-numbers rule IS the ship ritual.
- `../../references/accessibility-motion.md` — reduced-motion is art-directed in the craft plan, not patched after judging; keyboard pass and contrast-over-media checks are ship-ritual line items.
- `../../references/taste-memory.md` — `design/TASTE.md` is read before the brief (step 1) and written after every judge loop (step 7); the inherited protect-list and standing dispositions are what stop the suite from re-arguing settled taste every session.

## Deliverables
- **Completed brief** (template above) — the contract every later dispute resolves against.
- **Reference safari notes** — 3–5 references, each with a named structural steal.
- **Territory memo** — 3 directions, the chosen one, and one line each on why the others lose.
- **Signature moment spec** — trigger → behavior → meaning → duration class → reduced-motion equivalent.
- **Craft plan** — sibling firing order with per-skill budget lines and the loud/quiet ledger.
- **Judge dispositions** — every `award-judge` finding marked accepted / deferred / rejected-with-reason, recorded in `design/TASTE.md` (`dispositions[]` per `../../references/taste-memory.md`).
- **Ship report** — Lighthouse, LCP/CLS/INP, throttled frame-trace result, reduced-motion screenshots, keyboard pass, sourced from `scripts/judge-evidence.mjs` → `evidence/LEDGER.md`. Recorded numbers or it didn't happen.

## Related skills
- `award-judge` — the standing jury; scores every checkpoint against the rubric. The director decides what to take.
- `design-dna-forge` — builds the visual system (type, color, grid) the brief's feeling demands.
- `signature-interactions` — implements the pointer-level moments, including the signature when it's an interaction.
- `motion-choreography` — owns timing, easing, stagger, and transitions across the whole build.
- `webgl-shader-fx` — fired only when the matrix says so; the most expensive tool in the building.
- `ux-narrative` — pacing, information order, and the story the scroll tells.
- `video-motion-studio` — launch films, product motion, and rendered sequences.
