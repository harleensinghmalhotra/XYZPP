# Tech Inventory — alternativinc.com hero

Captured 2026-07-07 via Playwright/Chromium. Source of truth: `_tech-globals.json`, `_resources.json`.

## Platform
| Item | Finding |
|---|---|
| **CMS / builder** | **Webflow** (`window.Webflow` present; `html.w-mod-js.w-mod-ix`, `body.body-dark`; site id `632b67171587d4389caa1723`) |
| **Animation engine** | **Webflow Interactions 2.0 (IX2)** — scroll-scrubbed keyframes. **No GSAP, no ScrollTrigger.** |
| **Smooth scroll** | **None** (`window.Lenis` false). Native scroll — animations scrub directly to `scrollY`, no inertia/lag. |
| jQuery | 3.5.1 (Webflow dependency) |
| IntersectionObserver | Available (used by Webflow IX2 to arm "in-view" interactions) |
| **Three.js / WebGL** | **Absent** (`window.THREE` false; **0 `<canvas>`**) |
| **Lottie / bodymovin** | `window.lottie`/`window.bodymovin` false as globals, **BUT** a Lottie JSON ships and is rendered by Webflow's built-in Lottie renderer — see assets (`lottie_symbol-intro.json`). |
| **Video** | **0 `<video>` elements.** The hero is 100% images + CSS transforms. |
| Lightbox | Fancybox (`@fancyapps/ui`) — used by the portfolio further down, not the hero. |

## Scripts loaded
```
jquery-3.5.1.min…js                         (Webflow core dep, from cloudfront)
alternativ-inc.schunk.36b8fb49256177c8.js   ┐
alternativ-inc.schunk.8208d3e53b97e3c7.js   │ Webflow-exported chunked bundle
alternativ-inc.schunk.b8066dd42d067db8.js   │ (webflow.js + IX2 engine + site interactions)
alternativ-inc.804b2604.2a7216a584d65237.js ┘
@fancyapps/ui/dist/fancybox.umd.js          (portfolio lightbox)
gtag/js (G-7QY1SWWF5J), recaptcha, cloudflare turnstile   (analytics / forms — not hero)
```
> The hero choreography lives entirely inside the Webflow IX2 data embedded by the `alternativ-inc.schunk.*` bundle. There is **no hand-written GSAP timeline** to reverse — it is declarative IX2 (scroll-progress keyframes).

## Hero assets (with transferred sizes)
| Asset | Size | Role |
|---|---|---|
| `graph_book-hero-p-1600.webp` (1440×900) | **107.1 KB** | Open-book base image (`hero-section_graph_book`) |
| `graph_book-hero-(1)(1)-p-1600.webp` (1440×900) | **116.8 KB** | Second book layer (`…_book over` — the cover/over layer that fades out) |
| `graphs-wf_book-intro1-p-500.webp` (363×414) | 68.0 KB | Character sticker 1 (`graph-details1`) |
| `graphs-wf_book-intro2 2-p-500.webp` | 38.8 KB | Character sticker (`graph-details2`) |
| `graphs-wf_book-intro3-p-500.webp` | 31.4 KB | Character sticker |
| `graphs-wf_book-intro4-p-500.webp` | 68.0 KB | Character sticker |
| `graphs-wf_book-intro5.webp` (776×745) | 40.5 KB | Character sticker |
| `graphs-wf_book-intro6.webp` (711×796) | 45.8 KB | Character sticker |
| `graphs-wf_book-intro7-p-500.webp` | 27.3 KB | Character sticker |
| `graphs-wf_book-intro8.webp` (600×495) | 20.8 KB | Character sticker |
| `graph_detail-hero3.1-p-500.png` (363×555) | 30.6 KB | `bg-detail` faint pattern |
| `graph_detail-hero4.svg` (281×304) | (svg) | `bg-detail` faint pattern |
| `graph_services-divisor.svg` (1440 wide) | (svg) | **Curved dark→white "bleed" divider** at hero bottom |
| `graph_symbol-seal-color.svg` / `graph_seal-symbol.svg` | (svg) | The circular **"printing stories"** seal ring |
| **`lottie_symbol-intro.json`** | (json) | Preloader **"alt." symbol** animation (Lottie) |
| `logo_alternativ-invert.svg` (175×30) | (svg) | Navbar wordmark |

## Fonts (self-hosted OTF)
| Font | Size | Use |
|---|---|---|
| **Metrisch-Bold.otf** | 128.4 KB | The big **PRINTING / STORIES** display headline |
| Roobert-Regular / Medium / SemiBold / Bold .otf | ~61 KB each | Body, nav, buttons, subtitle |
| (Google `KFO7Cnq…woff2`) | 39.2 KB | fallback/analytics font |

## Brand palette (measured from captures)
- Background dark navy: ≈ `#0E2A47` (`body-dark`)
- Headline green: ≈ `#5FBB46` / `#63B84B`
- Headline white: `#FFFFFF`
- Accent dot (logo "i", "alt."): same green

## Structure summary (hero DOM)
```
div.hero-section-scroll-wrapper      static, height 2250px         ← scroll TRACK
  div.hero-section                   position:sticky; top:0; h900  ← PIN (sticky)
    div.navbar                       z500, willChange:opacity      ← fades out on scroll
    div.hero-section_content         z20, overflow:HIDDEN, wc:transform
      div.…_title-wrapper            (PRINTING/STORIES + seal) scales 1→3×, fades
        div.…_title-line _1          "PRINTING"  (splits left)
        div.…_title-line _2          "STORIES"   (splits right)
        img.…_title-line_seal        circular "printing stories" ring (stays opaque)
      p.…_content_p                  subtitle (fades out)
      div.button-box                 CTA pill + link (fades out)
    div.hero-section_graph-wrapper   z15, absolute, wc:transform   ← book, rises 405px
      img.…_graph_book               open-book base
      img.…_graph_book over          book cover layer (fades out to "open" the book)
      div.…_graph-details            container, opacity 0→1
        img.…_graph-details1..8      8 character stickers (pop/scale/fade in)
    img.…_bg-detail1 / bg-detail2    absolute, overflow:clip (faint pattern)
    div.hero-section_scroll-wrapper  z300 — "SCROLL" indicator + bouncing dot
div.site-content
  div.services-section-divisor-wrapper  overflow:hidden → graph_services-divisor.svg (curved bleed)
  div.services-section  "PRINTING SERVICES" …
```

## Preloader (`.load-frame`)
- `position:fixed; z-index:500; display:flex; body{overflow:hidden}` — **locks scroll**.
- Duration: stays up ~**12.2 s** (measured 12.21 / 12.26 / 12.28 / 12.29 s across 4 runs), then flips to `display:none`. Gated on asset/font load, not a fixed short timer.
- Contents: `load-frame_content_seal-letters` (rotating "printing stories" SVG ring) + `load-frame_content_seal-symbol` (the **"alt." Lottie**). A lighter-navy curtain wipes down as it hands off to the hero; the seal ring shrinks and re-parks beside the headline.
