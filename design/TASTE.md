# TASTE — verdict ledger

Append-only. Each block is one award-judge verdict per `.claude/skills/award-judge`.

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "Global Projects — 3 region cards (Aceternity Author-Card pattern)",
  "date": "2026-07-09",
  "weighted": 7.7,
  "score100": 82,
  "axes": { "design": 8, "usability": 8, "creativity": 7, "content": 8 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — suite ships no scoring anchor (fixtures/ absent); declared per skill rule.",
  "gates": {
    "perf": "PARTIAL — CLS 0.012/0.05 PASS (given); ~180-215fps mean / 7 long frames on 2.2s scrub (given, unthrottled emulated); LCP/INP + 4x-throttle recording PENDING",
    "a11y": "PARTIAL — axe 0 PASS (given); contrast REST gold 10.0 / title 17.4 / body 13.2, HOVER gold 9.0 / title 17.4 / body 13.2 all >>4.5 (given, real-pixel sampled); reduced-motion screenshots + Lighthouse a11y>=95 PENDING",
    "memory": "PASS"
  },
  "provisional": ["usability (Lighthouse mobile + 375-width title crop pending)", "perf (4x-throttle recording pending)"],
  "memoryTest": "Dark navy card row; braided child's head against a wall of classroom posters (Africa / largest export market); a print-QC hand over pallets (Asia); photos that BRIGHTEN and zoom when pointed at while text stays pinned. Signature moment landed.",
  "mostDamagingWeakness": "card-rest-0/card-hover-0: the Africa photo is a back-of-head shot, not the face-forward 'schoolgirls reading' the brief promises. It reads as classroom/education and stays on-brand, but withholds the eye-line + book that would let it out-punch the neighbours — it is the swappable weak plate in an otherwise premium set.",
  "fixes": [
    "Swap Africa photo for a face-forward/three-quarter child-reading frame at the same navy grade, keeping the moderate top scrim -> Creativity/Design +1 -> S",
    "Fix card-3 tag<->title seam: tag says 'AMERICAS & EUROPE' but title introduces 'Latin America'; align both to one region string -> Content +0.5 -> S",
    "Unify focal scale: replace the empty architectural library wide (no human/product) with a person handling books/stationery so 3 photos read as one authored set -> Creativity +0.5 -> M"
  ],
  "protect": [
    "navy-overlay .62->.30 + 1.06 photo scale over ~550ms with text held fixed — this IS the component; do not speed up or let the title move",
    "fixed bottom scrim (strong) + moderate top band — the reason both states pass contrast; non-negotiable if the Africa image is swapped",
    "DM Mono gold tag / Inter Tight 700 cream title / Inter 300 body hierarchy + gold country-list highlights — the scannable 'who we serve' read; do not restyle",
    "navy/gold/cream-only palette + verbatim region copy — do not trim to balance card heights"
  ],
  "evidence": {
    "sectionWidths": "shots/region-v2.png (1655, REST), shots/region-v2-hover.png (1655, HOVER-Africa); 768/375 crops PENDING",
    "signatureStates": "region-v2.png (before/rest, all dimmed) -> region-v2-hover.png (settled, Africa brightened+zoomed, neighbours dim); trigger/mid frames PENDING",
    "reducedMotion": "PENDING",
    "perf": "~180-215fps mean / 7 long frames / CLS 0.012 (given)",
    "axe": "0 violations (given); contrast real-pixel sampled both states (given)"
  }
}
```

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "What We Print (#services)",
  "date": "2026-07-08",
  "weighted": 7.4,
  "axes": { "design": 7, "usability": 8, "creativity": 7, "content": 8 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — suite ships no scoring anchor (fixtures/ absent); declared per skill rule.",
  "gates": {
    "perf": "PARTIAL — CLS 0.019/0.05 PASS (measured); scrub 292fps mean / 0 long frames / 7ms max (emulated, unthrottled); LCP/INP + 4x-throttle recording PENDING",
    "a11y": "PARTIAL — axe 0 critical PASS (measured); reduced-motion screenshots on file; Lighthouse a11y>=95 PENDING",
    "memory": "PASS"
  },
  "provisional": ["usability (Lighthouse mobile pending)", "perf (4x-throttle recording pending)"],
  "memoryTest": "Navy 'Built on Precision / Backed by Experience' headline, gold eyebrow+hairline, cream cards sliding left as you scroll, product-photo tiles popping over each card with a number badge + dash bullets.",
  "mostDamagingWeakness": "The pop mechanism is fed placeholder scene-JPEGs shown as small contained tiles (wwp-scrub-000): a rectangular photo chip with a soft shadow doesn't break the card frame the way a cut-out subject would, so the signature 'pop' reads muted. This is the known asset gap — transparent cutouts drop in later over the same filenames.",
  "fixes": [
    "Swap placeholder scene-JPEGs for transparent product cutouts on the same product-0N.webp names (already wired, zero code change) -> Design +1..1.5, Creativity +1 -> M",
    "Until cutouts land, unify the tiles: consistent internal crop/size + tighter rotate variance so 8 read as a set, not 8 stock photos -> Design +0.5 -> S",
    "Run the two pending gates (Lighthouse mobile + 4x CPU throttle recording) to convert provisional U/perf to MEASURED and clear DEGRADED-JUDGE -> S"
  ],
  "protect": [
    "0.32s quickTo scrub smoothing — why the horizontal feels eased, not stepped; do not snap or add scroll-snap",
    "CLS-free sticky mechanism (no position:fixed pin) — CLS 0.019; do not switch to ScrollTrigger pin:true",
    "Verbatim client content + 4 dash bullets per card — do not trim to 'balance' cards",
    "Reduced-motion + <=900px native-scroll fallback — do not force the pin onto touch"
  ],
  "evidence": {
    "sectionWidths": "shots/wwp-scrub-000.png (1536), shots/wwp-tablet.png (768), shots/wwp-mobile.png (375)",
    "signatureStates": "shots/wwp-scrub-entry.png (before) -> 000 (start) -> 050 (mid) -> 100 (settled) -> release",
    "reducedMotion": "shots/wwp-reduced.png, shots/wwp-reduced-end.png",
    "perf": "292fps mean / msP95 3.5 / msMax 7 / 0 long frames; CLS 0.019 (verify-wwp.mjs)",
    "axe": "0 violations on #services (verify-wwp-a11y.mjs)"
  }
}
```

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "What We Print (#services) — RE-JUDGE after Harry's cutouts",
  "date": "2026-07-08",
  "weighted": 7.6,
  "delta": "7.4 -> 7.6 (D 7->7 · U 8->8 · C 7->8 · Co 8->8)",
  "axes": { "design": 7, "usability": 8, "creativity": 8, "content": 8 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — no scoring anchor in fixtures/ (declared).",
  "cutoutQuality": "Harry delivered opaque WHITE-BG renders (700x560, no alpha), NOT transparent cutouts. Auto-matted via edge flood-fill (scripts/cutout-bg.mjs). Result per image: 01/02/05/06/07/08 clean & solid; 03 usable (mild banding on dark covers); 04 STRIPED (flat book-stack with pure-white page-edges open to bg — unrecoverable by white-keying). Flag 04 (and ideally 03) for true PNG-alpha re-export.",
  "gates": {
    "perf": "PARTIAL — CLS 0.0003/0.05 PASS (measured); 279fps mean / 0 long / 13.4ms max (emulated, unthrottled); LCP/INP + 4x-throttle recording PENDING",
    "a11y": "PARTIAL — axe 0 critical PASS (measured); reduced-motion on file; Lighthouse a11y>=95 PENDING",
    "memory": "PASS"
  },
  "provisional": ["perf (4x-throttle recording pending)", "usability (Lighthouse mobile pending)"],
  "memoryTest": "Cream cards sliding left, product-photo CUTOUTS (kids' books, stationery, travel books) bursting up over each card top with silhouette shadows, number badge + dash bullets, navy 'Built on Precision' headline.",
  "mostDamagingWeakness": "General Books (04) shows horizontal striping (wwp-cards.png / wwp-scrub-050): its source is a flat book-stack whose pure-white page-edges connect to the background, so white-keying cuts them into transparent stripes — one of eight cards reads as a rendering glitch. Needs Harry's true-alpha re-export.",
  "fixes": [
    "Harry re-export product-04 (and 03) as true PNG-alpha cutouts — flat-stack page-edges defeat auto-keying. Drop-in, same name -> Design +0.5 -> M",
    "Lift card/section contrast (cards read soft on cream2 beige) so every burst pops boldly -> Design +0.5 -> S",
    "Run pending gates (Lighthouse mobile + 4x CPU throttle recording) to clear DEGRADED-JUDGE -> S"
  ],
  "protect": [
    "filter: drop-shadow on cutouts (NOT box-shadow) — silhouette shadow is why they read as cutouts, not photos",
    "CSS bottom-fade mask on .wwp-img — dissolves matting base-shadow AND survives Harry's true cutouts; keep",
    "0.32s quickTo scrub + CLS-free sticky (CLS 0.0003)",
    "Verbatim content + 4 dash bullets per card"
  ],
  "evidence": {
    "cutoutProofs": "shots/wwp-cutout-checker.png, shots/wwp-cutout-cream.png, shots/wwp-one-{1,3,4,8}.png",
    "cardsCloseup": "shots/wwp-cards.png (cutouts breaking out of card tops)",
    "scrub": "shots/wwp-scrub-{entry,000,025,050,075,100,release}.png",
    "perf": "279fps mean / msP95 6.6 / msMax 13.4 / 0 long; CLS 0.0003 (verify-wwp.mjs)",
    "axe": "0 violations (verify-wwp-a11y.mjs)"
  }
}
```

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "What We Print (#services) — RE-JUDGE: v2 alpha + uniform 3-zone + real 3D pop",
  "date": "2026-07-08",
  "weighted": 8.0,
  "delta": "7.6 -> 8.0 (D 7->8 · U 8->8 · C 8->8 · Co 8->8)",
  "axes": { "design": 8, "usability": 8, "creativity": 8, "content": 8 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — no scoring anchor in fixtures/ (declared).",
  "whatChanged": "v2 true-alpha cutouts (no keying damage); fixed CSS-grid card 140/102/130 => all 8 EXACTLY 374px (variance 0); ONE pop geometry (uniform 700x560 canvas); overhang 30-31.5%; rotation ±7-9° (was ±2.5); grounded drop-shadow 0 10px 12px navy/.32 (was floating 0 16px 20px/.24); radius 22->34; bottom-fade mask removed; Corporate bullets 1&4 tightened (only sanctioned content edit).",
  "measured": {
    "cardHeights": "374 ×8, variance 0",
    "overhang": "114-118px = 30.4-31.5% of card H (04's SUBJECT overhangs less due to its short bbox — expected)",
    "rotation": "±7-9°", "radius": "34px", "shadow": "drop-shadow 0 10px 12px rgba(15,36,68,.32)"
  },
  "gates": {
    "perf": "PARTIAL — CLS 0.012/0.05 PASS (load-time, not pin); 133-294fps mean, 1 warmup long-frame ~20-23ms (0.1%); 4x-throttle + LCP/INP PENDING",
    "a11y": "PARTIAL — axe 0 critical PASS; reduced-motion on file; Lighthouse a11y>=95 PENDING",
    "memory": "PASS"
  },
  "provisional": ["perf (4x-throttle recording pending)", "usability (Lighthouse mobile pending)"],
  "memoryTest": "Tilted product-book CUTOUTS bursting up over uniform cream cards that scrub left, grounded shadows, number badge + dash bullets, navy 'Built on Precision. Backed by Experience.'",
  "mostDamagingWeakness": "Compositions are still busy multi-book clusters, not Alternativ's 3-5 bold hero objects (wwp-cards.png). The pop MECHANIC now matches the reference, but the subjects read busier; 04 General is the flattest (short wide bbox => subject overhangs least). A bolder upright re-shoot of the busiest subjects is the last step to full parity.",
  "fixes": [
    "Harry re-shoot 04 (opt. 01) as fewer/taller/UPRIGHT books -> Design +0.5, Creativity +0.5, lifts 04 overhang -> M",
    "Balance Zone C whitespace on 4-single-line-bullet cards (05/06) — vertical-center or min-height the body -> S",
    "Run pending gates (Lighthouse mobile + 4x throttle) to clear DEGRADED-JUDGE -> S"
  ],
  "protect": [
    "Fixed grid rows 140/102/130 => variance 0 — do NOT revert to natural flow",
    "Uniform pop geometry (one width/marginTop) enabled by uncropped 700x560 canvases — do NOT re-add trim/per-image tunes",
    "Grounded drop-shadow (10/12/.32) + ±7-9° tilt — the 3D read; do not soften back toward floating/±2.5°",
    "Verbatim content incl the sanctioned Corporate tighten; do not trim further"
  ],
  "evidence": {
    "cardsCloseup": "shots/wwp-cards.png",
    "scrub": "shots/wwp-scrub-{000,025,050,075,100}.png",
    "measurements": "scripts/recon-measure.mjs, recon-budget.mjs",
    "perf": "133-294fps mean / 1 warmup long-frame / CLS 0.012 (verify-wwp.mjs)",
    "axe": "0 violations (verify-wwp-a11y.mjs)"
  }
}
```

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "What We Print (#services) — RE-JUDGE: declutter + baselines + premium shadow/hover",
  "date": "2026-07-09",
  "weighted": 8.2,
  "delta": "8.0 -> 8.2 (D 8->8 · U 8->8 · C 8->9 · Co 8->8)",
  "axes": { "design": 8, "usability": 8, "creativity": 9, "content": 8 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — no scoring anchor in fixtures/ (declared).",
  "whatChanged": "Content model cut to Claude-Fable 3-item (cutout + name + ONE sentence); number badges, subtitles and 4-bullet lists deleted (element + CSS). Fixed grid 140/66/62 => card 268px ×8 (spread 0) and name top-Y 158 ×8 (spread 0) — headings share one baseline, asserted programmatically. Tight 18px img->name gap. Premium rest shadow 0 2px 12px navy/.07; hover (gated @media hover:hover): translateY(-8px) + shadow 0 20px 44px/.16 + cutout scale 1.06 + rotate*1.18, one 260ms ease-out GPU motion. Radius 34, pop geometry + tilt + grounded drop-shadow untouched.",
  "asserts": { "cardHeights": "268 ×8, spread 0", "nameTopY": "158 ×8, spread 0" },
  "gates": {
    "perf": "PARTIAL — CLS 0.012/0.05 PASS; 299.6fps mean / 0 long frames / msMax 6.6 (emulated, unthrottled — warmup hitch from prior round GONE); 4x-throttle + LCP/INP PENDING",
    "a11y": "PARTIAL — axe 0 critical PASS; reduced-motion static/native-scroll on file; Lighthouse a11y>=95 PENDING",
    "memory": "PASS"
  },
  "provisional": ["perf (4x-throttle recording pending)", "usability (Lighthouse mobile pending)"],
  "memoryTest": "Tilted book-cutouts bursting over clean cream cards, each just a name + one line, scrubbing sideways; cards lift on hover with a premium spring. Navy 'Built on Precision. Backed by Experience.'",
  "mostDamagingWeakness": "The only substantive gap left is the subject ART: compositions are still busy multi-book clusters rather than Alternativ's 3-5 bold hero objects; 04 General reads flattest. Content model, layout discipline and motion are now premium — a bolder upright re-shoot of the busiest cutouts is the last mile.",
  "fixes": [
    "Harry re-shoot 04 (opt. 01) as fewer/taller/UPRIGHT books -> Design +0.5 -> M",
    "Even Zone C bottom whitespace (2-line vs 3-line sentences) — vertical-center or auto row -> polish -> S",
    "Run pending gates (Lighthouse mobile + 4x throttle) to clear DEGRADED-JUDGE -> S"
  ],
  "protect": [
    "Fixed grid rows + locked baselines (heights 268 / name-Y 158, spread 0) — do NOT revert to flow",
    "3-item content model (cutout + name + one sentence) — do NOT re-add badges/subtitles/bullets",
    "Premium light rest shadow + hover:hover-gated GPU hover (translateY-8 + scale1.06 + rot*1.18, 260ms) — one coherent motion",
    "Cutout pop geometry (312w / -10 / ±7-9° / grounded drop-shadow) + radius 34"
  ],
  "evidence": {
    "rest": "shots/wwp-refined.png", "hover": "shots/wwp-hover.png", "cardsCloseup": "shots/wwp-refined-cards.png",
    "baselineAssert": "scripts/recon-baseline.mjs (heights spread 0, name-Y spread 0)",
    "scrub": "shots/wwp-scrub-{000,025,050,075,100}.png",
    "perf": "299.6fps mean / 0 long / msMax 6.6 / CLS 0.012 (verify-wwp.mjs)",
    "axe": "0 violations (verify-wwp-a11y.mjs)"
  }
}
```

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "Our Promise (#promise) — REBUILD: kinetic scrubbed word-reveal, monochrome",
  "date": "2026-07-09",
  "weighted": 8.1,
  "axes": { "design": 8, "usability": 8, "creativity": 8, "content": 8 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — no scoring anchor in fixtures/ (declared).",
  "whatChanged": "Replaced foil-stamp reveal with a Fluid-Motion scrubbed word-by-word reveal (rise + fade + blur→sharp, staggered L→R, ScrollTrigger scrub 0.6). Quote now fully MONOCHROME cream — gold removed from the quote (dropped gold climax, foil layers, reg-mark, gold hairline/glow); gold kept ONLY on eyebrow + attribution. Weight-only emphasis (light 300 / bold 700), static weights — only opacity/transform/filter animate. Quote clamp ~40→76px Inter Tight; attribution now DM Mono.",
  "measured": { "quoteFont": "76px", "innerFits": "523px in 743 viewport", "words": 13 },
  "gates": {
    "perf": "PARTIAL — CLS 0.0075/0.05 PASS; 299fps mean / 0 long frames / msMax 6.8 across the scrub (blur on 13 words held up); 4x-throttle + LCP/INP PENDING",
    "a11y": "PARTIAL — axe 0 critical PASS; reduced-motion = final state shown instantly (no anim); Lighthouse a11y>=95 PENDING",
    "memory": "PASS"
  },
  "provisional": ["perf (4x-throttle pending)", "usability (Lighthouse mobile pending)"],
  "memoryTest": "Big cream mission quote on deep navy revealing word-by-word as you scroll; weight-only emphasis; 'ensure nothing gets in its way'; small gold OUR PROMISE + Est. 2014 labels.",
  "mostDamagingWeakness": "The moment lives in MOTION — as a still it reads as a clean but quiet type slide, and the depth layer (dots + cream glow) is nearly invisible. That is largely intentional (restraint for ministry buyers), but the still-frame drama is modest vs a spectacle-driven jury.",
  "fixes": [
    "Let the depth layer breathe a touch more (slightly stronger drift/contrast) so it registers as intentional texture -> Design +0.3 -> S",
    "Optional: a hair more stagger overlap so mid-scrub always shows 2-3 words actively blooming (richer motion read) -> Creativity +0.3 -> S",
    "Run pending gates (Lighthouse mobile + 4x throttle) to clear DEGRADED-JUDGE -> S"
  ],
  "protect": [
    "Monochrome weight-only emphasis — do NOT reintroduce colour/gold on the quote",
    "Static font-weights + opacity/transform/filter-only reveal (no font-weight anim, no reflow, CLS 0.0075)",
    "Scrub 0.6 fluid timing — do not snap; gold confined to eyebrow + attribution",
    "Reduced-motion = instant final state"
  ],
  "evidence": {
    "scrub": "shots/promise-{000,033,066,100}.png", "reduced": "shots/promise-reduced.png",
    "perf": "299fps mean / 0 long / CLS 0.0075 (verify-promise.mjs)", "axe": "0 (verify-promise-a11y.mjs)",
    "boldAlone": "'mission is education. ensure nothing gets in its way.' ✓"
  }
}
```

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "One Continuous Process (#process) — REFINE: compact rail roller + numbers removed + self-drawing signature icons + 51.7vh",
  "date": "2026-07-09",
  "weighted": 8.1,
  "priorBand": "shipped ~8.5 (85/100) pre-refinement",
  "axes": { "design": 8, "usability": 9, "creativity": 7, "content": 8 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — no scoring anchor in fixtures/ (declared).",
  "whatChanged": "Print-head shrunk to compact gold impression roller, rail-locked +/-19px (0px^2 overlap vs every icon+label at scroll 0/25/50/75/100), fades past last node (no parked roller at rest); soft gold impression beam ~0.18 opacity pulses per crossed stage then fades. 01-06 index labels removed entirely (name-only). Generic icons replaced with custom 48px line-art (printer/seal/box/warehouse/truck/shield) that self-draw via stroke-dash synced to head x (navy->gold on completion). Height 61vh->51.7vh.",
  "measured": {
    "height": "51.7vh (target ~50)",
    "overlap": "max intersection 0px^2 at scroll 0/25/50/75/100 (programmatic, roller bbox vs every icon+label bbox)",
    "drawnCount": "0->1->3->4->6 across scrub; head x 421->710->1000 then fades",
    "cls": "0.012"
  },
  "gates": {
    "perf": "PENDING — 165fps+ mean / 0 long frames / CLS 0.012 given (EMULATED, unthrottled); 4x-throttle recording + LCP/INP NOT run in front of judge",
    "a11y": "PENDING — axe 0 (MEASURED); reduced-motion = fully printed + fully drawn, no roller (on file); Lighthouse mobile >=95 PENDING",
    "memory": "PASS"
  },
  "provisional": ["perf (4x-throttle recording pending)", "usability (Lighthouse mobile pending)"],
  "memoryTest": "Gold bead riding a rail, line-icons self-drawing as it passes, 'One Continuous Process', six print stages.",
  "mostDamagingWeakness": "The settled/rest frame (pressline-v2-100.png) has NO press signature — the roller has faded and the beam is invisible at 0.18 opacity, leaving generic outline icons on a dotted rail; the press metaphor now exists ONLY during scrub, and the icons (house=warehouse, shield=covered, truck) are stock line-icon vocabulary rather than the intended 'stars'. Shrinking the roller solved overlap but over-corrected into blandness at rest.",
  "fixes": [
    "Give the settled state a residual press mark (faint gold 'printed' ink-set / baseline under each drawn icon — the impression the beam left) so 100% reads as a finished press run not an empty rail -> Design +0.5, Creativity +0.5 -> S",
    "Push 2-3 icons off stock vocabulary toward QFP-specific marks (warehouse as racking/pallet not a house; 'covered' as a stamped seal not a generic shield) -> Creativity +1 -> M",
    "Run pending gates (Lighthouse mobile + 4x CPU throttle) to convert provisional perf/usability and clear DEGRADED-JUDGE -> S"
  ],
  "protect": [
    "0px^2 overlap solution (roller rail-locked +/-19px, fades past last node) — do NOT grow the roller back into stage content to restore presence; fix presence via residual print mark instead",
    "Numbers-removed name-only labels — do NOT re-add 01-06",
    "Stroke-dash self-draw synced to head x (navy->gold on completion), pure SVG+GSAP no library — the memorable beat; do not swap to opacity fades",
    "Reduced-motion = fully printed + fully drawn, no roller (pressline-v2-reduced.png) — correct parity"
  ],
  "evidence": {
    "iconCraft": "shots/pressline-v2-icons.png (all 6 drawn, close crop)",
    "signatureMid": "shots/icon-drawing.png (box icon ~52% mid stroke-draw, roller on rail above)",
    "scrub": "shots/pressline-v2-{050,075,100}.png",
    "reduced": "shots/pressline-v2-reduced.png",
    "given": "overlap 0px^2; drawn 0->1->3->4->6; head x 421->710->1000 then fades; 165fps+/0 long; CLS 0.012; axe 0"
  }
}
```

```json
{
  "verdict": "FIX-THEN-RESHIP",
  "judgeClass": "DEGRADED-JUDGE",
  "section": "Hero (#hero) — Alternativ->QFP asset swap (skin only, mechanics unchanged)",
  "date": "2026-07-10",
  "branch": "hero-qfp-swap",
  "weighted": 7.9,
  "axes": { "design": 8, "usability": 8, "creativity": 8, "content": 7 },
  "slopCap": false,
  "memoryCap": false,
  "calibration": "SKIPPED — award-judge shipped SKILL.md only (no fixtures/, no scripts/, no references/); declared per skill rule.",
  "whatChanged": "book_pages/book_cover -> qfp-book-pages/qfp-book-cover (both 2830x1770, same footprint, clip-path inset 19% kept => pixel-identical trust-strip junction, verified alpha profiles). 10 Alternativ stickers -> 6 QFP cutouts (2 kids peek over page top edges, 2 ground-level, bookstack + plane props) reusing the exact bloom scrub (scale-from-0, per-item 0.014 stagger, float loop). 4 speech bubbles (qfp-bubble) as single-transform wrappers with REAL HTML text (Inter, navy #0F2444, gold #C89A3C key figures, min 11px), pop 0.85->1 back.out 0.08 after each kid. Headline ported from strips-experiments: POWERING/GLOBAL/EDUCATION, recolored cream #FDFAF4 / cream / gold #C89A3C, pt-16vh; user subhead. Seal rebuilt as inline SVG (gold rings + 'QFP STORIES ·' x3 textPath, seal-spin). Corner watermark tiles removed (fought navy field). Scroll engine / pin / scrub timing untouched.",
  "gates": {
    "perf": "PASS — 160fps unthrottled; 51fps sustained @4x CPU throttle; 0 long tasks >50ms; worst frame 37ms (MEASURED). LCP/CLS/INP not isolated for hero (PENDING).",
    "a11y": "PENDING — axe #hero 0 violations (0 critical/serious, MEASURED) + reduced-motion headline sane (on file); Lighthouse a11y>=95 + keyboard tab-through NOT run.",
    "memory": "PASS"
  },
  "provisional": ["a11y (Lighthouse + keyboard pass pending)", "usability (mobile bubble legibility)"],
  "memoryTest": "Kids reading around a giant open book that blooms lettered pages (VISION/JOURNEY/WONDER), speaking in bubbles about '25 Million Books', '25+ Countries' and 'billions'; POWERING GLOBAL EDUCATION in cream + gold with a rotating gold seal. Specific — survived.",
  "mostDamagingWeakness": "Mobile 375 (resp-mobile-reveal.png): the 4 speech-bubble texts overflow the bubble art — the 6-cutout + 4-bubble spread is tuned for desktop vw and crowds on small screens (no mobile cull like the original had).",
  "fixes": [
    "Mobile <=640px: cull to 2 bubbles + shrink/relayout bubble text (reuse the original per-item mobile flag) so nothing overflows -> Usability +1, Design +0.5 -> M",
    "Bubble gold figures use #C89A3C (System B ON-NAVY accent) over a CREAM bubble — verify 4.5:1 or switch those figures to #836013 (AA gold-on-cream); user specified #C89A3C so flag for Harry -> a11y/Content -> S",
    "'read by billions of people' is an unsubstantiated marketing claim (brief substantiation law) — qualify or swap to a provable figure -> Content +1 -> S"
  ],
  "protect": [
    "Bloom window keyed to pinEnd=1.5*innerHeight (NOT progress fractions) — keeps the reveal aligned across viewport heights",
    "book clip-path inset(0 0 19% 0) — the pixel-identical trust-strip junction depends on it (QFP + orig both solid-bottom ~76%, shadow cut at 81%)",
    "Headline fade completes BEFORE bloom onset (~y852) — this is why bubbles never collide with the solid headline",
    "#C89A3C gold on the navy headline word EDUCATION — System B on-navy accent; do not flatten"
  ],
  "evidence": {
    "signatureStates": "shots/hero-swap/step-01-y0.png (before/rest) -> step-05/06 (book rising, blank cover) -> step-08-y1167/step-09-y1333 (settled full reveal) ; junction-y1750.png (crossing)",
    "responsive": "shots/hero-swap/resp-mobile-{rest,reveal}.png (375), resp-tablet-{rest,reveal}.png (768 — reveal captured pre-bloom)",
    "reducedMotion": "shots/hero-swap/reduced-motion.png (headline only, sane)",
    "perf": "160fps unthrottled / 51fps @4x throttle / 0 long tasks / worst frame 37ms",
    "axe": "0 violations on #hero (0 critical/serious)"
  }
}
```
