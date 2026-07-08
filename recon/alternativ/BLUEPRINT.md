# HERO BLUEPRINT — alternativinc.com

**Goal:** a build-ready spec of the Alternativ hero choreography, using **measured numbers only** (Playwright DOM probes at scrollY 0 / 400 / 900 / 1500 / 2200 + 40-step scroll micrography at 60 px increments). All transforms are read from `getComputedStyle().transform` matrices and decomposed to `scale` / `translate`.

> One-line summary: A **`position:sticky` hero pinned for 1350 px** while Webflow IX2 scrubs a scroll-progress timeline — UI text fades out, the **PRINTING/STORIES** headline zooms to 3× and splits, an **open book rises and its cover fades to reveal 8 illustrated character stickers that pop in**, then the pin releases and a **curved SVG divider bleeds the dark hero into the white "Printing Services" section.**

---

## 0. Measured constants
| Constant | Value |
|---|---|
| Capture viewport | 1440 × 900 |
| Document height | 10 092 px |
| Hero scroll track (`.hero-section-scroll-wrapper`) | height **2250 px**, `position:static` |
| Hero panel (`.hero-section`) | height **900 px** (100vh), `position:sticky; top:0` |
| **Pin range** (hero rectTop = 0) | **scrollY 0 → 1350 px**  (= 2250 − 900) |
| Preloader duration | ~**12.2 s** (scroll locked, `body{overflow:hidden}`) |
| Scroll smoothing | **none** — native scroll, direct scrub (no Lenis/GSAP inertia) |

`heroSticky.rectTop` measured: `0` @0, `0` @400, `0` @900, `−150` @1500, `−850` @2200 → confirms unpin at exactly **1350 px** (1500−150, 2200−850 both = 1350).

---

## 1. Pin mechanism — `position: sticky` (NOT fixed, NOT transform)
```
.hero-section-scroll-wrapper { position: static; height: 2250px; }   /* the track */
  .hero-section              { position: sticky; top: 0; height: 100vh; }  /* the pin */
```
- The hero **sticks** the moment its top hits `scrollY=0` and **unsticks at scrollY=1350** (when the 2250 px wrapper's bottom reaches the 900 px panel's bottom).
- No `will-change` on `.hero-section` itself; the animated children carry `will-change:transform` (graph-wrapper, content, title-wrapper) or `will-change:opacity` (navbar).
- This is the entire "pin" — cheap, GPU-free, no JS scroll listener for the pin. All motion below is **Webflow IX2 keyframes scrubbed to scroll progress** `p = scrollY / 1350`.

---

## 2. Phase timeline (boundaries in scrollY)

| Phase | scrollY | What happens |
|---|---|---|
| **P0 — Rest** | 0 – ~150 | Full hero visible (headline, subtitle, CTA, book peeking, SCROLL indicator). |
| **P1 — Text exit** | **~0 – 900** | Navbar, subtitle, CTA, and the **headline opacity** all fade to 0. Content block drifts up 36 px. |
| **P2 — Headline zoom + book rise** | **~400 – 1350** | Title-wrapper scales **1 → 3×** and the two lines split apart (PRINTING←, STORIES→). Book (`graph-wrapper`) rises **−405 px**. |
| **P3 — Book opens + character burst** | **~900 – 1350** | Book "over" (cover) layer fades to 0 (opens the book); the 8 `graph-details` stickers **pop in** (scale 0→1 / opacity 0→1) with drift. |
| **P4 — Unpin + section bleed** | **1350 – 2250** | Sticky releases; whole hero translates up with scroll; the **curved `graph_services-divisor.svg` bleeds** the dark panel into the white "PRINTING SERVICES" section (fully in by ~1980). |

Two dominant keyframe windows drive everything: **Window A `p≈0.0–0.67` (y 0–900)** = fades + wind-up; **Window B `p≈0.67–1.0` (y 900–1350)** = zoom climax + burst.

---

## 3. Per-element transform / opacity deltas (measured)

Notation: `s()` = scale, `t()` = translate(px). Pin progress `p = y/1350`.

### UI text — fades, no transform
| Element | y=0 | y=400 (p.30) | y=900 (p.67) | y≥1350 |
|---|---|---|---|---|
| `.navbar` (opacity, `wc:opacity`) | **1.0** | 0.687 | **0.0** | 0 |
| `_content_p` subtitle (opacity) | 0.881* | 0.458 | **0.0** | 0 |
| `.button-box` CTA (opacity) | 0.881* | 0.458 | **0.0** (then h→0) | 0 |
\* subtitle/CTA read slightly <1 at y=0 because the intro fade-in was still finishing at capture.
→ **All chrome text is gone by ~900 px (p≈0.67).** Fade is ease-in (accelerates): navbar drops 0.31 in first 0.30p, 0.69 in next 0.37p.

### Headline — zoom + split (the signature move)
| Element | y=0 | y=400 | y=900 | y=1500 | y=2200 |
|---|---|---|---|---|---|
| `_title-wrapper` **scale** | 1.000 | 1.000 | **1.427** | **3.000** | 3.000 (frozen) |
| `_title-wrapper` **opacity** | 1.0 | 0.687 | **0.010** | 0.07 | 0.07 |
| `_title-line _1` ("PRINTING") **tx** | 0 | 0 | 0 | **−32** | **−95** |
| `_title-line _2` ("STORIES") **tx** | 0 | 0 | 0 | **+32** | **+95** |
| `_title-line_seal` (ring img) rect-h | 125 | 119 | 174 | 383 | 401 |

→ The headline **scales to 3×** (ease-in: +0.43 over p.30–.67, then +1.57 over p.67–1.0) while its **opacity is already ~0 by p.67** — you "fly through" a headline that has faded out. The two lines **split symmetrically ±95 px** (this split keeps progressing *after* unpin — it's scoped to the wrapper being in view, longer than the pin). The **seal ring scales with the wrapper (125→~400 px ≈ 3×) but stays opacity 1** — it's the one element that survives the zoom.

### Book — rise + open
| Element | y=0 | y=400 | y=900 | y=1500 | y=2200 |
|---|---|---|---|---|---|
| `_graph-wrapper` **ty** (`wc:transform`) | 0 | 0 | **−132** | **−405** | −405 (frozen) |
| `_graph_book over` (cover) **opacity** | 1 | 1 | 1 | **0** | 0 |
| `_graph-details` (container) **opacity** | 0.089 | 0.406 | 0.803 | **1.0** | 1.0 |
| `_content` block **ty** | 0 | 0 | −36 | −171 | −171 (frozen) |

→ Book **rises 405 px** (ease-in, starts moving after ~400 px). The **cover layer (`book over`) fades out between p.67–1.0 to "open" the book**, while the `graph-details` container fades in across the whole pin.

### Character stickers — the burst (all pop in Window B, p 0.67→1.0)
| Sticker | mechanism | y≤900 | y=1500 | y=2200 |
|---|---|---|---|---|
| `graph-details1` | **scale 0→1** + drift | s0 t(43,18) | s1 t(25,1) | s1 t(−12,−34) |
| `graph-details1-1` | scale 0→1 + drift | s0 t(72,−18) | s1 t(49,−1) | s1 t(3,34) |
| `graph-details2` | scale 0→1 + drift | s0 t(−72,18) | s1 t(−35,−11) | s1 t(38,−68) |
| `graph-details2-1` | scale 0→1 + drift | s0 t(−101,−18) | s1 t(−69,−1) | s1 t(−5,34) |
| `graph-details3` | **opacity 0→1** + drift | op0 t(43,36) | op1 t(20,16) | op1 t(−26,−24) |
| `graph-details4` | opacity 0→1 + rise | op0 t(0,63) | op1 t(0,32) | op1 t(0,−31) |
| `graph-details5` | scale 0→1 | s0 | s1 | s1 |
| `graph-details6` | scale 0→1 | s0 | s1 | s1 |
| `graph-details7` | scale 0→1 | s0 | s1 | s1 |
| `graph-details8` | scale 0→1 | s0 | s1 | s1 |

→ **Nothing bursts until p≈0.67 (y≈900).** Then all 8 stickers animate in over the last third of the pin — a **mix of scale-pop (0→1) and opacity-fade**, each with a small independent `translate` drift (parallax settle). This is the emotional payoff: the open book fills with characters.

### Idle / decorative
- `hero-section_scroll-dot`: `translateY` oscillates −4 / +1 / +5 px across probes → **time-based bounce loop**, independent of scroll (the "SCROLL" indicator).
- `hero-section_bg-detail1/2`: `transform:none`, `overflow:clip` — faint repeated "aaaa" pattern; purely rides the sticky panel, no own animation.

---

## 4. Easing behaviour — **eased scrub, not linear, no lag**
- **Scrub, not time:** every value maps monotonically to `scrollY` and is identical after a 500 ms settle → the timeline is **scroll-linked (scrubbed)**, driven by Webflow IX2, not autoplay.
- **No smoothing/lag:** `window.Lenis` is absent and there is no GSAP ScrollSmoother — scroll is **native**, so animation position == raw scroll position (1:1, no inertia catch-up).
- **Per-segment easing (ease-in dominant):** motion is *not* linear against scroll:
  - Book rise: 0 → −132 (first 0.67p) → −405 (last 0.33p) — accelerates.
  - Headline scale: +0.43 (p.30–.67) then +1.57 (p.67–1.0) — accelerates hard at the end.
  - Character stickers: flat 0 until p.67, then snap to 1 by p1.0 — a delayed keyframe start (`from ~67%`).
- Implication: each interaction has its **own keyframe window** inside the pin — Window A (fades/wind-up, ~0–67%) and Window B (zoom/burst, ~67–100%) — rather than one shared linear ramp.

---

## 5. z-index & overflow — the layering + section-bleed trick
```
navbar                 z 500   (fades out — highest but disappears)
scroll indicator       z 300
hero_content (text)    z  20   overflow: HIDDEN  ← clips the 3× headline to the text box
hero_graph-wrapper     z  15   (book + characters, BEHIND the text)
bg-detail1/2           z auto  overflow: clip    (faint pattern, furthest back)
```
- **`hero-section_content { overflow:hidden }`** is the key clip: as the headline scales to 3×, its overflow is **masked to the content box**, so the giant letters never spill over the navbar/edges — you get a clean "camera pushes through the type" look.
- **The book sits *behind* the text (z15 < z20)** at rest, so the fading text reveals the rising book underneath.
- **Section bleed:** the hero is `sticky` (not `fixed`), so once unpinned the whole panel scrolls up **in normal flow** and `.site-content` follows it. `.services-section-divisor-wrapper { overflow:hidden }` holds **`graph_services-divisor.svg`** — a full-width **curved shape** whose top edge is dark-navy (matching the hero) and body is white. As it rises it **wipes the dark hero into the white Printing-Services section** with a smooth concave curve. No blend modes, no canvas — just a curved SVG masked by an `overflow:hidden` wrapper.

---

## 6. Preloader → hero reveal (bonus capture set)
- `.load-frame` = `position:fixed; z-index:500; display:flex`, with `body{overflow:hidden}` → **scroll locked for ~12.2 s**.
- Contents: `load-frame_content_seal-letters` (rotating **"printing stories"** SVG ring) + `load-frame_content_seal-symbol` (the **"alt." Lottie**, `lottie_symbol-intro.json`).
- Handoff (see `reveal-00…10.png`): a **lighter-navy curtain wipes down from the top**, the seal ring **shrinks and re-parks beside the headline** (it becomes `_title-line_seal`), then `.load-frame` flips to `display:none`. The reveal is a hard `display` cut after the wipe, not a cross-fade.

---

## 7. Build recipe (to reproduce in our own stack)
1. **Track + pin:** wrapper `height: 2.5×100vh` (≈2250 px) containing a `position:sticky; top:0; height:100vh` hero. Pin length = `track − 100vh`. Tune the 1350 px pin to taste.
2. **Drive with scroll progress** `p = clamp(scrollY / pinLength, 0, 1)` (GSAP ScrollTrigger `scrub:true`, or a scroll listener). Native scroll — **no smooth-scroll library needed** to match this site.
3. **Two keyframe windows:**
   - `p 0→0.67`: fade navbar/subtitle/CTA opacity→0 (ease-in); headline opacity→0; book `translateY 0→−132`, content `translateY 0→−36`; details container opacity 0→0.8.
   - `p 0.67→1.0`: headline `scale →3` + lines `translateX ∓95`; book cover opacity→0; book `translateY →−405`; each of 8 stickers `scale 0→1` / `opacity 0→1` + small translate drift.
4. **Clip:** put the headline inside a `z:20; overflow:hidden` box; book layer at `z:15` behind it.
5. **Seal:** keep the circular ring at opacity 1 through the zoom (it scales with the headline wrapper); optionally a Lottie for the intro.
6. **Bleed-out:** end the section with a full-width **curved SVG divider** (dark top edge → white body) inside an `overflow:hidden` wrapper so it wipes into the next (light) section as the sticky releases.
7. **Assets:** 2 book webp layers (~110 KB each) + 8 character stickers (20–68 KB webp) + 1 curved divider SVG. Display font ≈ Metrisch-Bold for the headline; green `#63B84B` + white split.

---

### File index (this folder)
- `loading-01…06.png` — Fast-3G paint sequence (100/300/600/1000/2000/3000 ms) — shows the **preloader** assembling (it is the first-paint reality).
- `loading-sequence.webm` — video of the same throttled load.
- `reveal-00…10.png` — preloader → hero handoff (8–15.5 s).
- `rest-desktop.png` / `rest-mobile.png` — settled hero (post-preloader), 1440×900 and 375×812.
- `scroll-000…039.png` — 40-frame scroll micrography @ 60 px (0 → 2340 px).
- `dom-probe-{0,400,900,1500,2200}.json` — full computed-style dump of every hero descendant.
- `tech-inventory.md` — stack, scripts, assets, fonts, palette.
- `_tech-globals.json`, `_resources.json` — raw inventory data.
- `recon.cjs`, `recon2.cjs`, `diagnose.cjs`, `extract.cjs` — capture + analysis scripts.
