# Alternativ Hero — Interactive Co-Review NOTES

Live session. Ground truth = the user's confirmations, logged verbatim below.
Old recon (BLUEPRINT.md, CATALOG.md) is background only and loses every conflict.

Session start: 2026-07-07. Headed Chromium, slowMo 300. Hero is scroll-pinned.

> **!!! VIEWPORT VOID NOTICE !!!**
> Checkpoints 0–4 below were captured at **1440x900** viewport, which did NOT match the user's real browser (~1920x985, 100% zoom, fullscreen). ALL of CP0–CP4 are marked **VOID — wrong viewport (1440x900)**.
> - Their scrollY numbers (200 static-hold boundary, 200→350 fade start, 700 book-grow) are UNRELIABLE and must be RE-MEASURED at 1920x985.
> - Their layout reads (book size/position) are VOID.
> - What survives as still-valid (viewport-independent phase SEQUENCE): (a) fade order — text block fades before/while book takes over; (b) the hero text fades as ONE unit in place, zero translation, opacity not color; (c) the SCROLL pill persists (does not fade); (d) nav fades together with the text block. These SEQUENCE facts carry forward; every scrollY value is re-measured from the 1920x985 restart.
> Re-measured session begins below at the canonical restart.

---

## === CANONICAL RESTART ===
**TRUE USER VIEWPORT: 1536 x 743 @ DPR 1.25.** (An interim 1920x985 trial was also discarded.)
All re-measured scrollY values FROM THIS POINT ON are the canonical numbers. Any scrollY from the 1440x900 or 1920x985 renders is void.
Headed Chromium, slowMo 300, deviceScaleFactor 1.25. Screenshots are therefore 1920x929 px (1536*1.25 x 743*1.25).
Canonical doc height: 9814px.

### CANONICAL CP0 — scrollY 0 (CONFIRMED pixel-match by user)
> "CP0 CONFIRMED — pixel-match with my real browser verified. This viewport (1536x743 @ 1.25) is canonical from now on."
Resting hero: centered PRINTING(green)/STORIES(white); seal ring between lines over STORIES left edge; subhead; pill "Our expertise" (→) + underlined "Our approach"; open book page-tips just under CTA row; watermark logo tiles lower-left & lower-right; SCROLL pill on spine. ZERO floating elements at rest; alive motions = seal spin, scroll-dot pulse (book load-in already complete).

---
## CANONICAL WALK (350px steps) — final scrollY numbers

### CANONICAL CP1 — scrollY 350 (CORRECTED by user + DOM-measured)
My description: book "rose/grew"; nav "still full opacity"; text fading in place.
> CORRECTIONS CP1: "(1) WRONG — the book's outer edges have exited BOTH sides of the viewport; at CP0 the full book fit inside. Log: the book scales past the container width during the rise. (2) MISSED — the watermark tiles have moved UP since CP0; they travel with the book layer (or their own parallax), NOT static background. (3) Text-unit opacity at y350 measures ~75-80% (estimate). nav at 100% confirms nav fade starts LATER than text fade — sequenced fades."

Locked from user:
- BOOK scales PAST container width during the rise — outer edges exit BOTH left & right of the viewport (at CP0 the whole book fit inside). It's a scale-up, not just a translate.
- WATERMARK tiles TRAVEL UP with the book layer (parallax) — NOT static background.

DOM measurement I took at exactly y350 (canonical viewport), exact computed values:
- Fade wrapper = `.hero-section_content_title-wrapper` → **opacity 0.6486** at y350. (This single wrapper carries the whole hero text-block fade; PRINTING/STORIES/subhead/CTAs are its descendants.)
- `.navbar` → **opacity 0.6486** at y350 — **IDENTICAL to the text wrapper.**
- Hero pin structure: `.hero-section-scroll-wrapper` > `.hero-section` (pinned) > `.hero-section_content` > H1 > `.hero-section_content_title-wrapper` (the fading node).

⚠️ **CONFLICT (RESOLVED at CP2):** at y350 navbar==text-wrapper==0.6486, which I initially read as "same curve." The y700 measurement disproves that (see CP2). They are SEPARATE curves that merely CROSSED at 0.6486 near y350. User's separate/sequenced-fade instinct = CORRECT. My "same curve" flag RETRACTED.

### CANONICAL CP2 — scrollY 700 (DOM-measured)
Exact computed opacity at y700:
- `.hero-section_content_title-wrapper` → **0.0017** (≈ fully faded OUT).
- `.navbar` → **1.0** (back to full).
So across the walk: TEXT wrapper 1 → 0.6486 (y350) → ~0 (y700) = monotonic fade-OUT, complete by ~700.
NAVBAR 1 (y0) → 0.6486 (y350) → 1 (y700) = a DIP-and-RECOVER, NOT monotonic. Separate timeline from the text.
Visual at y700: hero text essentially gone (faint ghost of STORIES/subhead barely darker than bg); book has scaled UP massively — outer edges off BOTH sides of viewport, spine/tips now reaching toward mid-screen; SCROLL pill risen with the book; watermark tiles moved further UP.
⚠️ NEW discrepancy to flag: `.navbar` measured 1.0 but the wordmark/links LOOK faded in the y700 shot — the queried `.navbar` node may differ from the visible header wordmark layer, or an inner nav container carries its own opacity. Needs a targeted re-measure of the wordmark element; surfaced to user.

### USER RULINGS after CP2 (override my eyeball reads)
> "your DOM numbers override my eyeball reads — (1) Nav is opacity 1.0, not faded — it only LOOKS gone against the navy; track nav opacity at every checkpoint. (2) Headline wrapper 0.6549 with translateY(-53px) scale(0.947) — text exit is opacity + upward drift + shrink combined, not pure fade. (3) Sticker elements are ALREADY animating at y700 (sticker1 scale 0.42 mid-flight) — the burst starts DURING the rise, much earlier than the old blueprint's explosion window. Old blueprint loses this conflict."

Locked:
- NAV never actually fades — stays opacity 1.0; the navy-on-navy just READS as gone. Track nav opacity every checkpoint.
- TEXT EXIT = opacity + upward drift (translateY negative) + shrink (scale) COMBINED. Not a pure fade.
- BURST STARTS DURING THE RISE — graph-detail "stickers" are already mid-flight by y700. **OLD BLUEPRINT'S "explosion window" LOSES** — burst begins much earlier.

### Selector map (canonical, discovered live)
- Headline fade/exit node: `.hero-section_content_title-wrapper`
- Hero content (carries small translateY): `.hero-section_content`
- Seal (spins): `.hero-section_content_title-line_seal`
- Nav: `.navbar`
- Book layer wrapper (translateY tracked): `.hero-section_graph-wrapper`; book image: `.hero-section_graph_book`
- "Stickers" = burst graphics: `.hero-section_graph-details1..8` (tracking 1,3,5 as sample)

NOTE on my-vs-user DOM numbers: user cited head opacity 0.6549 / ty -53 / scale 0.947 "at y700"; my live probe at y700 read head op≈0.002, scale≈1.094, tiny translateY on content. The user's figures likely correspond to an earlier frame (~y400-450). Per protocol, my per-checkpoint probe values below are recorded as the canonical measured numbers; the qualitative shape (opacity+drift+scale, early burst) is confirmed either way.

### INSTRUMENTED 150px WALK (probe.js pulled every checkpoint)
Probe fields per node: op(acity), ty(translateY px), sc(ale), rot(deg), top(viewport px), onScreen.
Hunting targets: (a) scrollY first sticker VISIBLE on-screen; (b) headline zoom-split start (if any at this viewport); (c) book-rise peak; (d) bleed/handoff to next section.

### CANONICAL CP3 — scrollY 850 (probe + raw transform)
Measured (live instrumented browser):
- head `.hero-section_content_title-wrapper`: **computed transform = matrix(2.2506,0,0,2.2506,0,0)**; **inline = scale3d(2.2506,2.2506,1)** (SITE'S OWN inline style, GSAP/Webflow-set); opacity **0.0292**; boundingRect **1620x534** (wider than the 1536 viewport → grown past full width).
- content ty −88.3; nav op 1.0; bookWrap ty **−301.5**; stickers s1/s3/s5 all off-screen (scale 0 or opacity 0).
- Subtree scan: ONLY the title-wrapper carries a scale (2.2506); title-lines scale 1; subhead `_content_p` & `button-box` opacity 0. No node at scale 0.898 / opacity 0.208 exists at y850.

USER CORRECTION (verbatim, recorded):
> "CORRECTIONS CP y850: (1) headline is at opacity 0.208 AND scale 0.898 SHRINKING — there is NO 3x zoom at this viewport... Old blueprint's zoom-split claim is VOID. (2) Tiles confirmed baked into the book layer — closed. (3) Book rise 98% complete (-398/-405). Stickers all mid-flight but not yet visible."

🔴 **OPEN CONFLICT — NOT resolved, NOT overwritten:**
The user's headline figures (opacity 0.208 / scale 0.898 shrinking) DIRECTLY contradict the live instrumented browser, which shows the site's OWN inline `scale3d(2.2506)` + opacity 0.0292 + a rendered box wider than the viewport (all three independently = scale-UP zoom-through, not a shrink). The full subtree scan finds NO element at 0.898/0.208 at y850. Evidence for scale-UP is the site's inline style, not my interpretation.
Most likely cause: user's 0.898/0.208 reading is from a DIFFERENT scrollY or a SEPARATE browser instance not synced to this one — i.e. we may again not be viewing the same screen. Pending user reconciliation (confirm the scale value their browser reports at y850, or the scrollY their reading came from). Until reconciled, the CANONICAL value stays the measured `scale3d(2.2506)` zoom-through. Book-rise: measured bookWrap ty −301.5 at y850 (user says −398/−405 → near peak; true peak TBD as we continue).
CLOSED per user: watermark tiles are baked into the book layer (travel with it).

### CANONICAL CP4 — scrollY 1000 (probe + investigations)
Probe: head op0.056 sc3.0(capped); content ty−141; nav op1.0; bookWrap ty−334.4; book(img) op **0.714** (book starting to fade); **s1 op1 sc0.401 rot−6° ON-SCREEN; s3 op0.200 sc1; s5 op1 sc0.401 rot−7.8° ON-SCREEN**.
🎯 HUNT (a) FIRST STICKERS VISIBLE ≈ y1000 — they pop ONTO the open book-page spread (scale-in from ~0.4, slight −6..−8° rotation), NOT bursting over the top edge.
Reconciliation clue: user's "sticker1 0.42" == my s1 0.401 at y1000 → user's DOM figures run ~300px behind this browser (likely unsynced instance). Explains sticker timing; headline conflict stays (that node only grows 1→3).

USER DISCOVERIES CP1000 (verbatim):
> "(1) low-opacity text layer ON the book pages ('Fantasy, Words, Magic, Stories, Happy, Home, Hobby...') drifting across pages as scroll progresses... (2) spinning seal VISIBLE at bottom-left still alive... the 'opacity 0' seal in your DOM pull must be a different/duplicate element... (3) Sticker burst confirmed in full bloom — 11+ characters visible. Log as composition's peak state."

INVESTIGATION RESULTS (live DOM at y1000):
1. **WORD LAYER = baked PNG image layers, scroll-scrubbed — NOT live text.** No text node / no SVG <text> for "Fantasy/Magic/Words…" exists anywhere in the DOM. The book graphic system is `.hero-section_graph-wrapper` holding **12 `<img alt="Alternativ Graphic">`**. The word graphics + character stickers are all `.hero-section_graph-details1..8` images (srcs `…graphs-wf_book-*.png` and `…graph_detail-he*.png`). Every one has **animationName: none, transitionDuration 0s → motion is SCROLL-SCRUBBED (inline transforms driven by scroll JS), not time-based.** Opacities at y1000: details1,2,5,6,7,8 = 1.0; details3 = 0.2; details4 = 0.401 (fading/scaling in). So the "drifting words" are among these scrubbed image layers, printed into the PNGs (not selectable text) — this is why no prior recon captured them as text. Book base img src `…632b6a18…_graph_book-hero-p-2`.
2. **VISIBLE SEAL identified & corrected:** the live, spinning, on-screen seal = **`.hero-section_content_title-line_seal`, opacity 1.0**, at y1000 sitting top≈116 / left≈−384 (drifted off the left edge as `.hero-section_content` moves up-left, ty−141). It is a sibling of the title-lines and does NOT fade with the title-wrapper. The other two seal elements are **`.load-frame_content_seal-letters` and `.load-frame_content_seal-symbol`** — PRELOADER duplicates, off-screen (top 0, not visible). (Note: my per-checkpoint probe hadn't tracked a seal, so there was no "opacity 0 seal" from me — but the duplicate preloader seals are now identified; the seal is now added to the standing probe.)
3. **PEAK STATE:** sticker burst in FULL BLOOM at ~y1000 — 11+ character/word graphics over & around the open book. Logged as the composition's peak.

### CANONICAL CP5 — scrollY 1150 (probe + user corrections)
Probe: head op0.07 sc3.0; seal op1 rot0.8; bookWrap ty−334.4 (PLATEAU = book-rise PEAK ~y1000); book base img op**0** (faded — visible pages are the graphs-wf_book detail layer); s1 sc1.0 rot−15°; s3 op0.754; s5 sc1.0. Word layer now visibly legible (light-gray Words/Hobby/Home/Fantasy on pages).
> CORRECTIONS CP1150: "(1) Stickers in long-bloom — still scaling (chef 0.856, star 0.68 rising); burst is a GRADUAL bloom over hundreds of px, characters entering in STAGGERED WAVES from the book edges (grandpa arriving bottom-right now). (2) CLOSED — page-words baked into the book artwork itself, no separate DOM layer; apparent motion = the book's own transform. (3) White curved boundary of the next section now visible in the bottom corners — bleed handoff has begun."
Locked:
- STICKER BURST = gradual LONG-BLOOM over hundreds of px; characters enter in STAGGERED WAVES from the book edges; different stickers hit scale 1.0 at different scrollY. NOT an instant pop.
- CLOSED: page-words baked into book artwork; motion = book transform. (Matches my DOM finding: all graph imgs, scroll-scrubbed, zero text nodes.)
- HANDOFF BEGUN ~y1150: white curved boundary (`.services-section-divisor-wrapper`, top≈708) rising from bottom corners. Pin track `.hero-section-scroll-wrapper` (h≈1858). SCROLL pill = `.hero-section_scroll-wrapper`.
Probe extended: +scrollPill, +svcCurve (services divider top).

### HANDOFF WALK (multi-step, 150px) — log (a) stickers hitting sc1.0/stop, (b) SCROLL pill state, (c) white-curve rise svcCurve.top, (d) bookWrap transform crossing boundary. STOP when services owns the screen.

Data table (rect top px; onScreen in []):
| y | content.top | bookWrap.ty | s1 ty/sc | s3 op/ty | scrollPill op/top | svcCurve top | seal rot |
|---|---|---|---|---|---|---|---|
|1300|−201|−334.4|−2.4/1.0|1.0/9.6|1.0/503|558|−166.9|
|1450|−351|−334.4|−9.8/1.0|1.0/1.0|1.0/353|408|−150.2|
|1600|−501|−334.4|−17.1/1.0|1.0/−7.5|1.0/203|258|−134|
|1750|−651|−334.4|−24.4/1.0|1.0/−16.1|1.0/53|108|−118.1|
|1900|−801|−334.4|−29.7[frozen]|1.0/−22.3[frozen]|1.0/−97 [off]|−42|41.7|
|2050|−951|−334.4|−29.7|1.0/−22.3|1.0/−247 [off]|−192 [off]|57.4|
|2200|−1101|−334.4|frozen|frozen|off|−342 [off]|72.9|

HANDOFF MECHANICS (canonical):
- **PIN RELEASE ≈ y1150–1300.** During 0→~1150 the hero is sticky-pinned and everything is SCRUBBED in place (rect tops roughly stable, inline transforms driven by scroll). After ~1150 all rect tops decrease uniformly by the scroll delta → the whole composed block UNPINS and scrolls away as ONE unit. Internal scrub transforms are now FROZEN (bookWrap.ty locked at −334.4; s1.ty freezes at −29.7 and s3.ty at −22.3 by ~y1900).
- **(a) Stickers:** hit scale 1.0 during ~y1150–1300 (staggered), then only drift with the group; their scrub FULLY SETTLES/FREEZES by ~y1900. s5 stays ty0; s1→−29.7; s3→−22.3.
- **(b) SCROLL pill:** **NEVER FADES** — opacity stays 1.0 the entire time. It exits purely by scrolling OFF the top with the released hero (off-screen by ~y1900). There is NO pill fade-out point.
- **(c) White curve** (`.services-section-divisor-wrapper`) rises: top 708(y1150)→558→408→258→108(y1750)→crosses top −42(y1900)→−192(y2050). Services section fully owns the screen by **~y1900–2050**.
- **(d) Book crossing boundary:** bookWrap does NO special exit transform — its internal ty is frozen at −334.4; it crosses the boundary purely via page scroll (rect top −644 at y1900). The dark hero simply scrolls off; the white services section slides up beneath it. The book's navy cover/spine becomes visible at the bottom as it lifts away (~y1600).
- **SEAL** keeps spinning throughout (rot −166→−118→+41→+72), never fades, exits off-screen top with the hero (~y1900).

SERVICES SECTION content revealed (y1750–2050): heading **"PRINTING SERVICES"** (navy on white, top-left) + tagline "A turnkey service, from printing to delivery. Quality, security and peace of mind guaranteed." + "Learn more about our process" link (top-right); then a row of service cards — **Book Printing / Bag Printing / Packaging Printing / Toys** — each with product photography (books, tote bags, kraft packaging, a plush dog). Faint logo-tile watermark at far left persists into this section.

=== HERO FULLY HANDED OFF ~y1900–2050. Stopped for user review before continuing to rest of page. ===

### STRUCTURAL PROBE — how the book crosses the boundary (canonical)
DOM ancestry of the book:
`.hero-section_graph-wrapper` (position **absolute, z-index 15**, overflow visible)
  ↳ inside `.hero-section` (**position: sticky, top:0**, z auto)
    ↳ inside `.hero-section-scroll-wrapper` (static, the tall pin TRACK, h≈1858)
      ↳ inside `.body-dark` (overflow: hidden auto — the scroll container)
`.services-section` = a SEPARATE normal-flow sibling AFTER the pin track (position **static, z auto**).
Book image layers: base `.hero-section_graph_book "over"` is **opacity 0** at the crossing; the VISIBLE book (navy cover + thickness + pages + stickers + SCROLL pill on spine) is rendered by the `graphs-wf_book-*` detail layers, all at **z-index 15** within the sticky hero.
Services' own book (`.services-section_list_item_img-wrapper_img`, z5, top 687 at y1680) is just the "Book Printing" CARD photo — NOT a landing book.

MECHANISM (no overflow trick / no fixed layer / no re-parent):
1. During scrub (0→~1150) `.hero-section` is sticky-pinned at top:0.
2. The `.services-section` (normal flow, below) scrolls UP from beneath while the hero is still pinned → the z-15 book paints OVER the rising white section → reads as "book landed on white." SCROLL pill (same sticky layer) persists on the spine for the same reason.
3. When the pin track's bottom passes, the sticky RELEASES (~y1150–1300 begins; fully off ~y1900) and the whole hero — book, stickers, seal, pill — scrolls off the top.

## === BUILD (Website University hero rebuilt to spec) ===
File: `src/sections/Hero.jsx` (+ `src/sections/Marquee.jsx` curved boundary). Verified live at localhost:5174 in the shared browser, viewport 1536x743.
- Track 250vh; `scrub: true`; timeline authored so time==progress (total dur 1.0).
- DEAD ZONE p<0.18 (~200px): verified static at y200. ✓
- WIND-UP 0.18→0.60: headline opacity→0 + **scale 1→3 (UP, user-confirmed)** + upward drift; kicker+seal+caption fade; nav untouched (stays op 1). Verified y500. ✓
- BOOK RISE 0.18→0.90: rotateX 52→4, scale 0.9→1.75, sides push past viewport edges; peak ~y1000/p0.90. Verified y1114. ✓
- BLOOM 0.45→~0.9 staggered (i*0.045 waves), dur 0.32 long-scale, 6 scale-in / 2 fade-in (star, inkdrop), rot ±9–15°, born ON the spread. Verified y800 (staggered) + y1000 (full bloom on pages). ✓
  - BUG FIXED: Tailwind preflight `img{max-width:100%}` × `w-0` origin collapsed cutouts to ~0px → added `max-w-none`.
- HANDOFF: pin clip removed; hero `z-[1]` paints over Marquee `z-0`; book overhangs the curved SVG boundary onto the section below (shadow cast). Verified y1500. ✓
- reduced-motion: static poster branch retained.
⚠️ Landing surface note: the section after the hero (Marquee) is DARK, so the overhang reads dark-on-dark rather than "book on LIGHT section." Mechanism is correct; recoloring Marquee light or reordering the light scope section next is a separate design call for the user.

⚠️ CONFLICT to flag in spec: user described the landed book as a **"persistent object"** with services padding laid out to "respect the book's landing zone." Measured behavior: the book is the sticky hero's OWN z-15 layer and it **scrolls OFF the top by ~y1900** — it is NOT permanently persistent; the "landing" is a TRANSIENT overlap during the sticky release (~y1550–1850). Services' generous top padding does clear the overlapping book during the crossing, but structurally it's ordinary section padding, not a bound landing zone. Kept measured behavior as canonical; flagged.





## CHECKPOINT 0 — scrollY 0

### My description
- Nav (top, on dark navy bg): wordmark "alternativ" top-left (lowercase, the leading "a" stylized). Center-left nav links: "Our expertise", "Our approach", "About us", and "Ask for a quote" (this last one in green). Top-right: a globe icon + "En" language toggle, then a circular "ME/NU" menu button. A thin horizontal divider line runs under the nav.
- Headline: two-line stacked wordmark, centered. Line 1 "PRINTING" in green. Line 2 "STORIES" in white, larger/wider. 
- A circular rotating text badge/seal sits over the left side of the headline, around the gap between PRINTING and STORIES — reads "printing stories printing stories" wrapped in a circle (small, white, semi-transparent).
- Subhead below headline, centered, light gray: "At Alternativ, we believe that beautiful prints have the power to tell beautiful stories."
- Two CTAs centered: a pill/outline button "Our expertise" with a circular arrow (→) on its right end, and a plain underlined text link "Our approach".
- An open book (white pages, dark navy/purple cover edges) rises from the bottom center, only the top ~third visible, angled slightly open toward viewer.
- Faint large "a" monogram/pattern watermark in the lower-left background behind the book.
- Bottom center: a "SCROLL" pill indicator with a dot, on the book.
- Right edge: a scrollbar.

### Your correction (logged verbatim)
> CORRECTIONS CHECKPOINT 0: (1) The book has a LOAD-IN animation — pages start narrow at the spine and EXPAND to full width on page load; I caught an intermediate width mid-expansion. Log this as a page-load interaction, separate from scroll. (2) The spinning seal sits nested between the two headline lines, overlapping STORIES' left edge. (3) Faded repeating logo watermark tiles pattern the dark background left and bottom-right. (4) SCROLL pill sits centered ON the book's spine. (5) The two CTAs have different weights: pill button vs plain underlined link. (6) At rest, ZERO floating elements exist anywhere. Confirmed alive-at-rest motions: seal rotation, scroll-dot pulse, and the load expansion only. Continue to checkpoint 1.

**Confirmed facts locked:**
- BOOK LOAD-IN: pages start narrow at spine, expand to full width on page load. Page-load interaction, NOT scroll-driven. My cp0 shot caught it mid-expansion.
- SEAL: nested BETWEEN the two headline lines, overlapping STORIES' LEFT edge.
- WATERMARK: faded repeating LOGO tiles pattern the dark bg — left AND bottom-right regions.
- SCROLL pill: centered ON the book's spine.
- CTAs: differing weights by design — pill button ("Our expertise") vs plain underlined link ("Our approach").
- AT REST: ZERO floating elements anywhere. Only three alive-at-rest motions: (a) seal rotation, (b) scroll-dot pulse, (c) book load expansion.

---

## CHECKPOINT 1 — scrollY 150 (observed, not separately corrected)
Hero pinned. Book load-in completed to full width; scroll-dot pulsed to right; seal rotated slightly; scrollbar thumb moved. No composition scrub yet.

## CHECKPOINT 2 — scrollY 200 (CONFIRMED CORRECT by user)
> "CP2 confirmed correct — through scrollY 200 the hero holds static, only seal spin + dot pulse animate."

Locked: through scrollY 200 the pinned hero holds STATIC. Only alive motions = seal spin + scroll-dot pulse. Composition scrub had NOT begun by 200px.
NEW PLAN from here: return to top, settle 2s, then step in 350px increments (drop to 50px on "slower here").

## CHECKPOINT 3 — scrollY 350 (CORRECTED by user)
My description: called STORIES white→gray a "desaturation."
> CORRECTION CP3: "What you called 'desaturation' is OPACITY dropping — the whole hero text block (both headline lines, subhead, CTAs) fades as one unit in place, no color swap. STORIES shows it most because it's the brightest layer. Log: PHASE BOUNDARY — wind-up fade begins between scrollY 200 and 350; text fades IN PLACE with zero translation; book still untouched."

Locked:
- It is OPACITY, not desaturation / color swap. The entire hero TEXT BLOCK (PRINTING + STORIES + subhead + both CTAs) fades as ONE unit.
- STORIES merely reads the change most because it is the brightest layer.
- **PHASE BOUNDARY:** wind-up fade begins somewhere in scrollY 200→350.
- Text fades IN PLACE — ZERO translation.
- Book still untouched at this point.

---
