---
name: award-judge
description: Adversarially judges any web build against the award rubric BEFORE it ships — calibrates against a fixtures/ anchor first, runs scripts/judge-evidence.mjs to build a labeled evidence pack (screenshots at three widths, Lighthouse, axe, reduced-motion pass; MEASURED/EMULATED/HUMAN rows), scores Design/Usability/Creativity/Content with cited evidence, runs the slop checklist, the two BLOCKED-level gates and the memory cap, then delivers a verdict with ranked fixes and a protect-list, appended to design/TASTE.md. USE WHEN: "judge this site", "would this win an award", "score my landing page", "is this Awwwards-worthy", "critique this build honestly", "why does this feel generic", "pre-ship design review", "run the quality gate", "tear this apart before launch", "does this pass the performance budget", "audit the signature moment", "re-judge after my fixes", "what's the weakest part of this page", "quick design checkpoint mid-build".
license: MIT
metadata:
  suite: award-grade
  version: "1.4.0"
---

# award-judge — the jury in the room before the real one votes

## Mission
Every build in this suite faces this skill before it ships, because the alternative is finding out from strangers. The judge's job is adversarial: find why this LOSES — praise is rationed to load-bearing strengths that must be protected from "improvement." No verdict without evidence collected in a real browser; a judgment from memory or from reading code is a guess wearing a robe.

## When NOT to use
- Nothing is running yet — the judge scores rendered pixels and recorded frames, not intentions. Build first, judge second.
- Wireframes and low-fi prototypes — scoring unfinished craft punishes the wrong thing; use `wow-director` to pressure-test the concept instead.
- Internal tools measured on task speed — the Awwwards rubric optimizes for memory and craft, which is the wrong ruler; run a usability pass via `ux-narrative`.
- When the user wants encouragement or brainstorming — this skill is structurally incapable of being nice first.
- Re-litigating a locked creative direction — judge execution against the direction, not the direction itself.

## Workflow
0. **Calibrate before you judge.** Blind-score one scoring anchor from `fixtures/` — do not look at its published band first. Compare your weighted total to the anchor's published band: off by more than 0.5 = recalibrate (re-read the band descriptions in `../../references/awwwards-scoring.md`, rescore the anchor, name what you misweighted) before touching the real build. No scoring anchor shipped yet = declare the skip in the verdict; an invented calibration is worse than none. A judge that can't reproduce a known band is measuring its mood, not the work.
1. **Collect evidence. No scoring until the pack is complete.** Run the evidence script first:
   - `node scripts/judge-evidence.mjs --url <url>` — captures the scriptable half of the pack (full-page + per-section screenshots at desktop 1440 / tablet 768 / mobile 375, the reduced-motion pass, Lighthouse mobile, axe) and writes `evidence/LEDGER.md`: one row per artifact, each labeled MEASURED / EMULATED / HUMAN per `../../references/honest-evidence.md`.
   - The signature moment recorded as discrete states: before → trigger → mid → settled. Screenshot each state; a video/GIF if motion is the point. Enters the ledger as a HUMAN row, pending until done.
   - DevTools Performance recording of the full hero + scroll journey at 4× CPU throttle; note every long task > 50ms. A HUMAN row until a person runs it — the recorded numbers then stand as EMULATED (captured under throttle).
2. **Self-audit the pack** — read `evidence/LEDGER.md` against *The evidence ledger* below. A missing row = that area scores as "UNSCORED — evidence missing," never a guessed number. A HUMAN row still pending is different — honest-null, not a hole: score the affected axis provisionally, mark it "(provisional — HUMAN pending: <row>)", and name what unpends it. Provisional axes count toward the weighted total but can never carry a SHIP.
3. **Score the four axes** 1–10 per `../../references/awwwards-scoring.md`, one sentence of evidence per score citing a specific screenshot or recording ("Design 7: section-3@1440 shows a real type voice, but mobile@375 hero crops the display face"). Weighted total = D×0.4 + U×0.3 + C×0.2 + Co×0.1.
4. **Run the slop checklist** — every ban in `../../references/motion-canon.md` plus the generic-AI tells in the scoring rubric. ANY confirmed hit caps Design at 6, whatever it scored in step 3. Cite the screenshot that shows the hit.
5. **Run the two BLOCKED-level gates.** Performance gate: compare recorded numbers against every table in `../../references/performance-budgets.md`. Accessibility gate: execute the audit ritual in `../../references/accessibility-motion.md` (keyboard-blind tab-through, Lighthouse a11y ≥ 95, axe zero critical, reduced-motion screenshots on file). **Any gate failure = verdict BLOCKED, regardless of axis scores.** An 8.4 that stutters is a 0 that looks expensive. Gates stay hard only on MEASURED/EMULATED rows — a gate fed by a HUMAN-pending row reads PENDING, not PASS, and any PENDING gate downgrades the run to DEGRADED-JUDGE (see the quick-judge section).
6. **Run the memory test.** Close the tab. Do five minutes of unrelated work. Write down everything you remember about the site — sections, the signature moment, the type, one phrase of copy. What survives IS the site. Nothing specific survived = memory gate FAIL. A failed memory test caps the weighted verdict at 7.4 — below the SOTD band — and MUST be written as the most damaging weakness. Performance and accessibility remain the only BLOCKED-level gates: memory caps, it never BLOCKs.
7. **Deliver the verdict** in the fixed format: score table → the single most damaging weakness → three highest-leverage fixes ranked by score-impact-per-effort → the protect-list (what must NOT be touched). Then append the verdict to `design/TASTE.md` as a verdict.json block per `../../references/taste-memory.md` — the ledger, not chat history, is where verdicts live.
8. **Re-judge after fixes** with the delta protocol: read the previous verdict block from `design/TASTE.md` (never ask for old scores to be hand-pasted), re-collect evidence ONLY for touched areas, re-score only affected axes, re-run only the failed gate. State old → new per changed score. Never silently re-run the whole judgment — drift in untouched scores means the first judgment was noise. Append the re-judge as its own block.

## Technique library

**The evidence ledger.** `evidence/LEDGER.md`, written by `scripts/judge-evidence.mjs`, is the live version of this table — every row carries a MEASURED / EMULATED / HUMAN label per `../../references/honest-evidence.md`. Before scoring, confirm it covers all six rows and refuse to proceed with holes:

| Evidence | Status |
|---|---|
| Section screenshots × 3 widths | ✅ / ❌ |
| Signature moment states (before/trigger/mid/settled) | ✅ / ❌ / HUMAN-pending |
| Performance recording @ 4× throttle | ✅ / ❌ / HUMAN-pending |
| Lighthouse mobile (numbers recorded) | ✅ / ❌ |
| axe run (violations recorded) | ✅ / ❌ |
| Reduced-motion screenshots | ✅ / ❌ |

Self-application is the point: the judge audits its own evidence before auditing the work. **No screenshot = no score.** A pending HUMAN row is declared, not papered over. "I looked at the code and the animation should be smooth" is banned phrasing — the word "should" in a verdict means the verification didn't happen.

**Evidence capture, scripted.** Screenshotting three widths by hand is where evidence packs die. Run the suite's script:

```
node scripts/judge-evidence.mjs --url <url> [--out evidence/] [--sections "sel1,sel2"]
```

It automates the scriptable half — full-page and per-section screenshots at all three widths, the reduced-motion pass, Lighthouse mobile, axe — and writes `evidence/LEDGER.md`, one labeled row per artifact. The signature-moment states and the performance recording stay manual — they require judgment about WHERE the moment lives, and a script can't feel a dropped frame. They sit in the ledger as HUMAN rows, pending until a person runs them.

**Honest-null scoring (HUMAN-pending rows).** A pending HUMAN row is never faked and never zero-scored — it is honest-null. The axis it feeds gets a provisional score, marked in the verdict ("U 7 — provisional, HUMAN pending: signature states"). Gates stay hard only on MEASURED/EMULATED data: a gate waiting on a HUMAN row reads PENDING, not PASS. Any PENDING gate or provisional axis makes the run a DEGRADED-JUDGE — real information, never shippable clearance. The honest sentence is "7.4 provisional, pending the throttle recording" — not a confident number wearing borrowed evidence.

**Calibration anchors.** Scoring anchors live in `fixtures/` with published bands (distinct from the canon-audit violation/fix pairs that share the directory). Step 0 exists because judges drift — generous on familiar work, harsh after a bad day. Blind-score the anchor, then compare: within 0.5 weighted = calibrated. Beyond 0.5, the delta names the bias (anchor scored 8.1 against a published 7.0–7.4 band = Design inflation this session); recalibrate before the real verdict, and note in the verdict that recalibration happened. If the suite ships no scoring anchor yet, say exactly that — never stand in a made-up one.

**State-slicing the signature moment.** Capture four states, each with a job: *before* (does the trigger read as inviting, or invisible?), *trigger* (first visual response — measure it, budget is < 100ms), *mid* (freeze mid-animation; this is where slop hides — tearing, layout shift, an easing with no personality, text momentarily unreadable), *settled* (did it resolve somewhere better than it started, or just move?). A signature moment that only looks good in motion-blur is hiding something; the mid-state screenshot is the interrogation.

**Adversarial framing.** Open every judgment by completing the sentence: "This loses because ______." If you cannot complete it, your evidence pack is too thin — a jury always can. Praise appears only in the protect-list, and only for strengths a well-meaning fix could destroy ("the 240ms nav timing is why the site feels calm — do not 'snappy it up'").

**Score-evidence discipline.** One sentence per axis score, citing a named screen. Bans: "feels polished," "generally good," "modern look," any adjective without a screenshot behind it. A score you can't evidence in one sentence is a score you made up.

**The slop sweep.** Walk the section screenshots top to bottom against two lists: motion-canon bans (`transition: all`, fade-in-up on everything, bounce on product UI, parallax on body text, autoplay loops near text, >1.5s skeleton shimmer) and the generic-AI tells (purple-blue gradient on dark, glassmorphism over mesh, emoji section icons, Inter display type on a craft claim, identical three-column icon-title-blurb grids, uniform section heights). One hit = Design capped at 6. Two or more tells = write "reads as template" in the weakness line — juries template-blind instantly. Also ban the empty descriptors in any design rationale you're handed: "modern", "clean", "minimal", "premium", "sleek", "elegant", "professional" describe every site, so they defend every site — a rationale built on them is scored as no rationale.

**Pixel-probe escalation.** When the same dimension scores below 7 twice in a row and the builder disputes it, stop arguing adjectives: crop both the build and the stated reference to the disputed region and compare measured numbers (thresholded luma-peak counts, cluster bounding boxes, saturated-pixel ratios). "Reference has 13 bright peaks here, the build has 0" ends debates that "it feels flat" never will. Forensics measure structure, not feel — use them exactly when the argument is about structure wearing a feel costume.

**Gate math, not gate vibes.** The gates take recorded numbers only — ledger rows labeled MEASURED or EMULATED; a HUMAN-pending row is not a number yet: LCP < 2.5s, CLS < 0.05, INP < 200ms, zero long tasks > 50ms during motion, 60fps sustained (30fps floor mobile for WebGL), Lighthouse a11y ≥ 95, axe zero critical. Report each as `measured / budget / PASS|FAIL|PENDING`. A number you didn't measure is a FAIL with extra steps. Memory is the third gate and the odd one out — a cap, not a blocker: a failed memory test caps the weighted verdict at 7.4 — below the SOTD band — and MUST be written as the most damaging weakness. Performance and accessibility remain the only BLOCKED-level gates.

**The memory test, honestly run.** The 5-minute gap is mandatory — immediate recall tests short-term buffer, not memory. Write the recall BEFORE re-opening the tab, then compare. If your recall is "dark site, big type, some scroll animations," that sentence describes 10,000 sites: the signature moment did not land. That is a memory-gate FAIL — the weighted verdict caps at 7.4 and the failure leads the verdict as the most damaging weakness. No amount of Design polish buys back a memory void.

**Leverage-ranked fixes.** Exactly three, ranked by score-impact-per-effort, each in the form: *fix → affected axis → estimated delta → effort (S/M/L)*. "Rebuild the hero" is not a fix, it's a wish. "Replace the six fade-in-up sections with static layouts and spend the motion budget on the cart-add interaction → Design +1 (uncaps), Creativity +1 → M" is a fix.

**The protect-list.** Name 2–4 things that must NOT be touched during fixes, with why. Fixing teams destroy strengths at a shocking rate — a protect-list is cheaper than a second re-judge. If nothing is worth protecting, say that too; it is itself a verdict.

**BLOCKED, said plainly.** A BLOCKED verdict names the failed gate, the measured number, the budget it missed, and the single condition that unblocks ("BLOCKED — perf gate: INP 340ms vs 200ms budget, long tasks from the scroll listener; unblocks when a 4×-throttle recording shows INP < 200ms"). BLOCKED is not an insult and not negotiable by axis scores — it is the difference between a site that competes and a site that stutters in front of a jury.

**Judge failure modes (audit yourself for these).**
- *Halo scoring* — one gorgeous hero pulling Usability and Content up with it. Score each axis against its own evidence, never against your overall impression.
- *Fixing while judging* — the judge writes verdicts, not patches. The moment you start editing code you have switched sides; hand fixes to the building skill and re-judge its output.
- *Effort grading* — "they clearly worked hard on this" is worth exactly 0 points. Juries see the pixels, not the commits.
- *Severity inflation on re-judge* — finding NEW nits in untouched areas after fixes land. If it survived judgment one, it doesn't become a defect in judgment two.

**The 15-minute quick-judge** (mid-build checkpoints, not pre-ship):
1. Hero screenshot at 375 and 1440 + signature moment states only (4 min).
2. One Performance recording of hero + first scroll at 4× throttle (4 min).
3. Slop sweep on what exists (3 min).
4. Output: top risk + one fix + "on track for ≥ 7.5 weighted: yes/no" (4 min).
No axis scores, no gates, no memory test — those need a finished build. Label the output QUICK-JUDGE so nobody mistakes it for shippable clearance.

**DEGRADED-JUDGE is the same honesty class.** A full judgment forced to run with HUMAN rows still pending (nobody available for the throttle recording, no device for the signature states) is labeled DEGRADED-JUDGE: provisional axis marks stay visible, PENDING gates stay PENDING, and — like QUICK-JUDGE — it is never shippable clearance. Unlike QUICK-JUDGE, it DOES append to `design/TASTE.md`, with the `provisional` field set, so the re-judge has its numbers — but a block with `provisional` present can never read SHIP. The distance between a DEGRADED-JUDGE and a verdict is a person doing the pending rows, nothing else.

**Verdict format** (fixed — deviation makes verdicts uncomparable across re-judges):

```
VERDICT: SHIP / FIX-THEN-RESHIP / BLOCKED (gate: <which>)
Weighted: <n.n>  (D <n> · U <n> · C <n> · Co <n>)   Slop cap applied: yes/no · Memory cap applied: yes/no
Gates: perf <PASS|FAIL|PENDING: metric measured/budget> · a11y <PASS|FAIL|PENDING: detail> · memory <PASS|FAIL — FAIL caps weighted at 7.4>
Provisional axes: <none | axis (HUMAN pending: row)>
Memory test: <what survived, verbatim>
Most damaging weakness: <one sentence, one screen cited — when the memory gate failed, this line IS the memory failure>
Fixes (impact/effort ranked): 1. … 2. … 3. …
Protect: <2–4 items + why>
Ledger: appended to design/TASTE.md as verdict.json (per taste-memory.md)
```

## Quality gates
This skill IS the suite's gate; it enforces the canon rather than being checked by it.
- `../../references/awwwards-scoring.md` — the four axes, the weights, the calibration bands, the slop cap, the memory cap, the verdict format. The judge adds nothing to this rubric and skips nothing in it.
- `../../references/honest-evidence.md` — the MEASURED / EMULATED / HUMAN label on every ledger row; HUMAN-pending = honest-null: provisional axis scores, PENDING gates, DEGRADED-JUDGE labeling.
- `../../references/taste-memory.md` — every verdict appends a verdict.json block to `design/TASTE.md`; re-judges read the previous block from there, never from hand-pasted chat.
- `../../references/project-scaffolding.md` — a build with no canon-audit guard, no motion tokens, or no reduced-motion utility gets a WARN in the verdict: unscaffolded craft erodes; note it even when today's screenshots pass.
- `../../references/motion-canon.md` — the ban list is the slop checklist's first half; reduced-motion parity feeds the a11y gate.
- `../../references/performance-budgets.md` — every number in the performance gate, plus the test ritual (4× throttle, real-device pass, recorded numbers or it didn't happen).
- `../../references/accessibility-motion.md` — the audit ritual executed verbatim in step 5; vestibular and flash rules are BLOCKED-severity, not deductions.

## Deliverables
- **Evidence pack**: `evidence/LEDGER.md` from `scripts/judge-evidence.mjs` + screenshot set (3 widths × all sections + signature states), performance recording notes, Lighthouse + axe numbers, reduced-motion screenshots — filed with the project, not pasted and lost.
- **Verdict document** in the fixed format above, including the evidence ledger with its labels and ✅/❌/pending column.
- **TASTE.md append**: the verdict.json block in `design/TASTE.md` per `../../references/taste-memory.md` (QUICK-JUDGE runs never append; DEGRADED-JUDGE blocks append with `provisional` set and can never be SHIP).
- **Re-judge delta note** after fixes: changed scores old → new (old read from TASTE.md), gate re-run results, protect-list compliance check.
- **Quick-judge / degraded-judge note** (when run mid-build or with pending HUMAN rows): top risk, one fix, on-track call, pending rows named.

## Related skills
- `wow-director` — orchestrates the pipeline and calls this skill before any ship decision; the director proposes, the judge disposes.
- `signature-interactions` / `motion-choreography` / `webgl-shader-fx` — produce the work the slop sweep and performance gate bite hardest.
- `design-dna-forge` — where a "reads as template" verdict gets fixed at the root.
- `ux-narrative` — the right ruler when the memory test is the wrong one.
- `video-motion-studio` — its exports face the same gates when embedded (poster, ≤ 4MB above-fold, pause control).
