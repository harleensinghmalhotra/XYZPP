# Homepage Coherence Audit — One Hand, One Site

Rhythm, type and spacing only — no colour, animation, or content. Homepage only
(inner pages untouched). Radius tokens from the last pass untouched. Verified headed
1536×743 @ DPR 1.25, EN + FR, zero console errors.

## 0 · Priority #1 — the Cases WTF fix
The earlier "match WWP height" set `.section-cases { min-height: 2160px }` and turned
the dark stage into a flex column that vertically **centered** the book inside all
that borrowed height → hundreds of dead px above and below the spread. **Killed the
min-height and the flex-center.** Cases now sizes to its content; the book keeps its
scaled-up size and simply sits in the standard section rhythm.

| | Cases section height @1536×743 |
|---|---|
| Before | **~2226px** (2160 min-height + bands) — book floated in a sea of navy |
| After | **1269px** — book snug in its room (≈**957px** of dead air removed) |

## 1 · Rhythm tokens (src/index.css :root)
```
--section-pad-y:   clamp(96px, 11vh, 128px);   /* ONE vertical breathing per section */
--content-max:     1280px;                       /* ONE content width */
--section-gap-head: 16px;                         /* eyebrow → heading rhythm unit */
--section-y : var(--section-pad-y)   --measure : var(--content-max)   (legacy aliases)
```
`--section-pad-y` chosen at **clamp(96px, 11vh, 128px)** — the median of the pre-audit
tops (64–96 min / 8–13 vh / 104–168 max), tightened at the ceiling so the site reads
snug, not sprawling. `--content-max` = **1280px** (the existing `--measure`, which the
inner pages already honour; the homepage had drifted to 1200/1360/1400/1440).

## 2 · Section padding — before / after (homepage)
| Section | Before (top / bottom) | After |
|---|---|---|
| Promise | clamp(64,8vh,104) both | **--section-pad-y** both |
| Projects | clamp(80,10vh,130) / clamp(80,10vh,120) | **--section-pad-y** both |
| Infrastructure | clamp(80,11vh,140) / clamp(170,20vh,240) | **--section-pad-y** / *240 kept* |
| Sustainability | clamp(80,11vh,150) both | **--section-pad-y** both |
| Awards (.aw-content) | 128 / 100 (sides 110) | **--section-pad-y** (sides 110 kept) |
| Cases stage | min-height 2160 + flex-center | **--section-pad-y**, min-height gone |
| **Certifications** | clamp(96,13vh,168) / clamp(140,15vh,190) | **UNCHANGED — structural** (dome arcs) |
| **Infra bottom** | clamp(170,20vh,240) | **UNCHANGED — structural** (People grid must clear the Certs dome) |

Content-max unified to `--content-max` (1280): WWP-inner 1400→1280, Infra-inner
1200→1280, Sustain-inner 1360→1280, Awards-inner 1440→1280, Projects-inner tokenised.

**Exempt (documented):** Hero + conveyor (pinned experiences / 3D scene), the
WhatWePrint scroll-jack (its extent is scroll-driven, not padding).

## 3 · Type scale — one hierarchy
H2 system = `--h2` clamp(38px,5vw,68px) @ **weight 500** (Inter Tight, Ekta medium).
| Element | Before | After |
|---|---|---|
| .infra-title | 700 · clamp(38,5vw,66) | **500 · var(--h2)** |
| .proj-title | *unset (→400)* · clamp(38,5vw,68) | **500 · var(--h2)** |
| .certs-title | 700 · clamp(40,5.2vw,64) | **500 · var(--h2)** |
| .aw-title | 700 · **fixed 60px** | **500 · var(--h2)** |
| .sustain-title | 700 · clamp(44,4.6vw,60) | **500 · var(--h2)** |
| .aw-eyebrow tracking | 0.3em | **var(--track-eyebrow)** (3px) |
| .gr-eyebrow tracking | 0.28em | **var(--track-eyebrow)** (3px) |
| eyebrow→heading gap (wwp/proj/infra/cases) | 12 / 18 / 16 / 14px | **var(--section-gap-head)** (16) |

*Note — the H2 weight unify (700→500 on 5 titles) is a one-line flip back per section
if Harry's eye prefers bold; the token says medium so the system now says medium.*
**Approved exceptions:** `.wwp-title` (one-line JS-fit size), `.gr-title` (full-viewport
display statement "Printed in India / Read by the World"), `.promise-quote` (light 300
pull-quote — a quote, not a section heading).

## 4 · Micro-consistency — hover lift (Ekta −4/−6)
Content cards unified to **−6px**: `.wwp-card` (−8→−6), `.proj-dest` (−8→−6),
`.infra-card` (−5→−6), `.infra-person` (−5→−6), `.cert-card` (−4→−6); `.u-card` already −6.

## Verify
Zero console errors EN + FR. All breathing sections now report identical 96px padding
at 1536×743; structural sections keep their curve/pin math; the seamless-melt boundary
and the Certs/Infra dome overlaps are visually intact; Awards + WWP re-checked at the
narrower 1280 width (4-up plaques well-proportioned, WWP head unaffected).

## Judge verdict
**Scroll top to bottom and it reads like one designer on one morning — same air between
every thought, same voice at every size, and the book finally sits snug in its room.**
