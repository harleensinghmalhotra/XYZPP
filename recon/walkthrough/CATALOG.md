# ALTERNATIVINC.COM — Walkthrough Screenshot Reference Library

**Source:** `ALTERNATIVINC.COM Walkthrough.mp4` (project root)  
**Video:** 3:14.61 · 1920×1032 · ~36.7 fps (60 tbr) · h264/aac. Capture includes Brave browser chrome (~top 100px); the site itself starts just below the toolbar.

## Method
- **Pass A — raw extraction:** ffmpeg @ 3 fps → `_raw/` = **584 frames** (permanent archive, never deleted).
- **Pass B — intelligent dedup:** each frame downscaled to 48×27 greyscale (sharp), mean-absolute-pixel-diff vs the last *kept* frame (accumulates slow drift so gradual animations still register). Threshold 1.5 → **162 kept**, 422 dropped. Consecutive-diff percentiles: p50 0.06, p75 1.83, p90 11.68, p99 48.55, max 184.7.
- **Classification:** every kept frame was viewed (contact sheets + full-res on transitions) and copied from `_raw/` into the folders below. `03-hero-scroll` is deliberately *denser* — it holds **every** raw frame across the exit→rise→burst→bleed window (raw #228–252), not just deduped ones.
- Frames are named `NN_tMM-SS.jpg` (sequence index + video timestamp) so order and video position are always recoverable. Each folder has a `_frames.json` manifest.

## Folder tree
```
recon/walkthrough/
  _raw/                 584  (archive — do not delete)
  _kept/                162  (deduped, sequential)
  _sheets/                   (contact sheets for review)
  01-loading/             8  Loading / preloader
  02-hero-resting/       13  Hero at rest
  03-hero-scroll/        25  Hero scroll choreography
  04-services/           24  Services
  05-portfolio/          36  Portfolio — "Some of our creations"
  06-certifications/     37  Certifications
  07-story-about/        24  About — "What sets us apart" + "A story to tell"
  08-footer-contact/      8  Footer / contact
  09-interactions/        0  Interactions
  10-mobile/              0  Mobile / responsive
```

## ⚑ Hero phase-transition frames (exact)
| Phase transition | Frame | Video time | Evidence |
|---|---|---|---|
| Rest (last) | `03-hero-scroll/000_t01-15.jpg` | 01:15 | Headline + tagline present, book low |
| **Text starts exiting** | `03-hero-scroll/001_t01-16.jpg` | 01:16 | "PRINTING STORIES" gone, book still low |
| **Book starts rising** | `03-hero-scroll/004_t01-17.jpg` | 01:17 | Book translates up; faded bleed text appears behind |
| **First element appears** | `03-hero-scroll/009_t01-18.jpg` | 01:18 | Tiny characters born at scale≈0 on the pages |
| **Burst peak** | `03-hero-scroll/015_t01-20.jpg` | 01:20 | Full illustrated scene bursting from the book |
| **Bleed crosses into Services** | `03-hero-scroll/022_t01-23.jpg` | 01:23 | Book crossfades out, "PRINTING SERVICES" rises |

## 01-loading — Loading / preloader
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t00-09.jpg` | 00:09 | #30 | First load — blank deep-navy page, browser chrome only (page assets loading). |
| 1 | `001_t00-20.jpg` | 00:20 | #61 | Still loading — blank navy, no content painted yet. |
| 2 | `002_t00-57.jpg` | 00:57 | #173 | PRELOADER SEAL — "alt." wordmark (green dot) ringed by rotating "printing stories" text, centred on navy gradient. |
| 3 | `003_t00-57.jpg` | 00:57 | #174 | Seal begins to clear / fade before first paint. |
| 4 | `004_t00-58.jpg` | 00:58 | #175 | FIRST PAINT — "PRINTING STORIES" hero fades up faintly from the dark. |
| 5 | `005_t02-13.jpg` | 02:13 | #401 | SECOND LOAD (mid-walkthrough reload) — page blanks back to navy. |
| 6 | `006_t02-24.jpg` | 02:24 | #434 | Second preloader — the "alt." rotating seal shows again. |
| 7 | `007_t02-25.jpg` | 02:25 | #438 | Second load resolving — coloured section filter pills peek in at top as the seal clears. |

## 02-hero-resting — Hero at rest
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t00-00.jpg` | 00:00 | #1 | Initial capture — hero fully at rest (pre-reload): nav, "PRINTING STORIES", book peeking at bottom. |
| 1 | `001_t00-58.jpg` | 00:58 | #176 | Hero settling in after first paint — headline still muted. |
| 2 | `002_t00-58.jpg` | 00:58 | #177 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 3 | `003_t00-59.jpg` | 00:59 | #178 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 4 | `004_t00-59.jpg` | 00:59 | #179 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 5 | `005_t00-59.jpg` | 00:59 | #180 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 6 | `006_t01-00.jpg` | 01:00 | #181 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 7 | `007_t01-00.jpg` | 01:00 | #183 | Full rest — nav (alternativ · Our expertise / Our approach / About us / Ask for a quote · En · MENU), circular "printing stories" mark in the "O". |
| 8 | `008_t01-05.jpg` | 01:05 | #198 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 9 | `009_t01-07.jpg` | 01:07 | #204 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 10 | `010_t01-12.jpg` | 01:12 | #219 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 11 | `011_t01-15.jpg` | 01:15 | #227 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |
| 12 | `012_t01-15.jpg` | 01:15 | #228 | Hero at rest — "PRINTING STORIES" headline, tagline, CTA, SCROLL button, sleeping book at bottom. |

## 03-hero-scroll — Hero scroll choreography
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t01-15.jpg` | 01:15 | #228 | REST (reference) — headline + tagline present, book low at bottom. |
| 1 | `001_t01-16.jpg` | 01:16 | #229 | ▶ TEXT EXIT — "PRINTING STORIES" has left; empty navy, book still low. |
| 2 | `002_t01-16.jpg` | 01:16 | #230 | Text gone, book still at rest position (pre-rise hold). |
| 3 | `003_t01-16.jpg` | 01:16 | #231 | Text gone, book still low. |
| 4 | `004_t01-17.jpg` | 01:17 | #232 | ▶ BOOK RISE BEGINS — open book starts translating up; giant faded "PRINTING STORIES" bleed text appears behind it. |
| 5 | `005_t01-17.jpg` | 01:17 | #233 | Book rising, bleed text stronger behind. |
| 6 | `006_t01-17.jpg` | 01:17 | #234 | Book rising further up the viewport. |
| 7 | `007_t01-18.jpg` | 01:18 | #235 | Hero scroll frame 7 — book/element choreography in flight. |
| 8 | `008_t01-18.jpg` | 01:18 | #236 | Book risen; faded PRINTING/STORIES bleed fills background. |
| 9 | `009_t01-18.jpg` | 01:18 | #237 | ▶ FIRST ELEMENTS — tiny characters appear on the pages at scale≈0 (a figure, a pink blob). |
| 10 | `010_t01-19.jpg` | 01:19 | #238 | Elements growing — more characters scaling in, staggered. |
| 11 | `011_t01-19.jpg` | 01:19 | #239 | Elements larger, rotation visible as they scale up. |
| 12 | `012_t01-19.jpg` | 01:19 | #240 | Burst building — chef w/ speech bubble, girl in bed, monsters emerging. |
| 13 | `013_t01-20.jpg` | 01:20 | #241 | Burst — Asterix/Obelix, pink & teal monsters, dessert cart scaling toward full size. |
| 14 | `014_t01-20.jpg` | 01:20 | #242 | Burst near peak — most creatures at full scale, sparkle stars on right. |
| 15 | `015_t01-20.jpg` | 01:20 | #243 | ▶ BURST PEAK — full illustrated scene bursting from the open book. |
| 16 | `016_t01-21.jpg` | 01:21 | #244 | Peak burst held — all characters full-size on the spread. |
| 17 | `017_t01-21.jpg` | 01:21 | #245 | Peak burst, elements at rest on the book. |
| 18 | `018_t01-21.jpg` | 01:21 | #246 | Burst fully settled on the spread. |
| 19 | `019_t01-22.jpg` | 01:22 | #247 | Scene settled; scroll about to advance past the book. |
| 20 | `020_t01-22.jpg` | 01:22 | #248 | Book scene fully formed, beginning to move off. |
| 21 | `021_t01-22.jpg` | 01:22 | #249 | Book/elements starting to recede upward. |
| 22 | `022_t01-23.jpg` | 01:23 | #250 | ▶ BLEED / CROSSFADE — book fades out; "PRINTING SERVICES" heading rises into view (section handoff). |
| 23 | `023_t01-23.jpg` | 01:23 | #251 | Crossfade — "PRINTING" visible, services layout forming underneath. |
| 24 | `024_t01-23.jpg` | 01:23 | #252 | "PRINTING SERVICES" heading resolved — hero hands off to Services. |

## 04-services — Services
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t01-23.jpg` | 01:23 | #251 | Handoff from hero — book/elements sliding off, "PRINTING" heading crossfading in. |
| 1 | `001_t01-23.jpg` | 01:23 | #252 | "PRINTING SERVICES" heading appears with intro copy. |
| 2 | `002_t01-24.jpg` | 01:24 | #253 | Services — "PRINTING SERVICES" heading + product category grid. |
| 3 | `003_t01-24.jpg` | 01:24 | #254 | Services — "PRINTING SERVICES" heading + product category grid. |
| 4 | `004_t01-24.jpg` | 01:24 | #255 | Services — "PRINTING SERVICES" heading + product category grid. |
| 5 | `005_t01-25.jpg` | 01:25 | #256 | "PRINTING SERVICES" + paragraph; first product photos slide up. |
| 6 | `006_t01-25.jpg` | 01:25 | #257 | Services — "PRINTING SERVICES" heading + product category grid. |
| 7 | `007_t01-25.jpg` | 01:25 | #258 | Services — "PRINTING SERVICES" heading + product category grid. |
| 8 | `008_t01-26.jpg` | 01:26 | #259 | Services — "PRINTING SERVICES" heading + product category grid. |
| 9 | `009_t01-26.jpg` | 01:26 | #261 | Services — "PRINTING SERVICES" heading + product category grid. |
| 10 | `010_t01-27.jpg` | 01:27 | #262 | Category grid forming — Book Printing / Bag Printing / Packaging Printing / Toys. |
| 11 | `011_t01-28.jpg` | 01:28 | #265 | Services — "PRINTING SERVICES" heading + product category grid. |
| 12 | `012_t01-28.jpg` | 01:28 | #266 | Services — "PRINTING SERVICES" heading + product category grid. |
| 13 | `013_t01-29.jpg` | 01:29 | #269 | Services — "PRINTING SERVICES" heading + product category grid. |
| 14 | `014_t01-30.jpg` | 01:30 | #271 | Services — "PRINTING SERVICES" heading + product category grid. |
| 15 | `015_t01-30.jpg` | 01:30 | #273 | Four category columns with product photography (books, printed bags, boxes, plush toy). |
| 16 | `016_t01-31.jpg` | 01:31 | #275 | Services — "PRINTING SERVICES" heading + product category grid. |
| 17 | `017_t01-31.jpg` | 01:31 | #276 | Services — "PRINTING SERVICES" heading + product category grid. |
| 18 | `018_t01-32.jpg` | 01:32 | #277 | Services — "PRINTING SERVICES" heading + product category grid. |
| 19 | `019_t01-32.jpg` | 01:32 | #278 | Services — "PRINTING SERVICES" heading + product category grid. |
| 20 | `020_t01-33.jpg` | 01:33 | #280 | Services — "PRINTING SERVICES" heading + product category grid. |
| 21 | `021_t01-33.jpg` | 01:33 | #281 | Services — "PRINTING SERVICES" heading + product category grid. |
| 22 | `022_t01-34.jpg` | 01:34 | #284 | Services — "PRINTING SERVICES" heading + product category grid. |
| 23 | `023_t01-35.jpg` | 01:35 | #286 | Services grid fully settled — 4 labelled categories with imagery. |

## 05-portfolio — Portfolio — "Some of our creations"
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t01-35.jpg` | 01:35 | #287 | Section handoff — "Some of our creations" heading rises in. |
| 1 | `001_t01-36.jpg` | 01:36 | #289 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 2 | `002_t01-36.jpg` | 01:36 | #290 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 3 | `003_t01-37.jpg` | 01:37 | #293 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 4 | `004_t01-38.jpg` | 01:38 | #296 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 5 | `005_t01-38.jpg` | 01:38 | #297 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 6 | `006_t01-39.jpg` | 01:39 | #300 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 7 | `007_t01-40.jpg` | 01:40 | #303 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 8 | `008_t01-41.jpg` | 01:41 | #304 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 9 | `009_t01-42.jpg` | 01:42 | #307 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 10 | `010_t01-42.jpg` | 01:42 | #308 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 11 | `011_t01-42.jpg` | 01:42 | #309 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 12 | `012_t01-43.jpg` | 01:43 | #310 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 13 | `013_t01-44.jpg` | 01:44 | #313 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 14 | `014_t01-46.jpg` | 01:46 | #319 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 15 | `015_t01-47.jpg` | 01:47 | #323 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 16 | `016_t01-48.jpg` | 01:48 | #325 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 17 | `017_t01-49.jpg` | 01:49 | #329 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 18 | `018_t01-53.jpg` | 01:53 | #342 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 19 | `019_t01-55.jpg` | 01:55 | #347 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 20 | `020_t01-59.jpg` | 01:59 | #360 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 21 | `021_t02-00.jpg` | 02:00 | #361 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 22 | `022_t02-00.jpg` | 02:00 | #362 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 23 | `023_t02-00.jpg` | 02:00 | #363 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 24 | `024_t02-01.jpg` | 02:01 | #364 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 25 | `025_t02-01.jpg` | 02:01 | #365 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 26 | `026_t02-01.jpg` | 02:01 | #366 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 27 | `027_t02-03.jpg` | 02:03 | #370 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 28 | `028_t02-03.jpg` | 02:03 | #371 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 29 | `029_t02-04.jpg` | 02:04 | #373 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 30 | `030_t02-04.jpg` | 02:04 | #375 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 31 | `031_t02-05.jpg` | 02:05 | #376 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 32 | `032_t02-06.jpg` | 02:06 | #379 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 33 | `033_t02-06.jpg` | 02:06 | #381 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 34 | `034_t02-07.jpg` | 02:07 | #382 | "Some of our creations" — colourful portfolio grid of printed projects. |
| 35 | `035_t02-07.jpg` | 02:07 | #383 | End of portfolio — last creation cards before Certifications. |

## 06-certifications — Certifications
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t02-07.jpg` | 02:07 | #384 | Entry — coloured filter pills at top; "Certifications: a guarantee of excellence" heading appears on cream. |
| 1 | `001_t02-08.jpg` | 02:08 | #386 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 2 | `002_t02-09.jpg` | 02:09 | #388 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 3 | `003_t02-26.jpg` | 02:26 | #439 | Brief dark wipe as the (reloaded) certifications section resolves. |
| 4 | `004_t02-26.jpg` | 02:26 | #440 | "Certifications: a guarantee of excellence" heading + intro + rotating seal (top-right). |
| 5 | `005_t02-26.jpg` | 02:26 | #441 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 6 | `006_t02-27.jpg` | 02:27 | #442 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 7 | `007_t02-27.jpg` | 02:27 | #443 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 8 | `008_t02-28.jpg` | 02:28 | #445 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 9 | `009_t02-30.jpg` | 02:30 | #451 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 10 | `010_t02-30.jpg` | 02:30 | #452 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 11 | `011_t02-30.jpg` | 02:30 | #453 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 12 | `012_t02-31.jpg` | 02:31 | #454 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 13 | `013_t02-31.jpg` | 02:31 | #455 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 14 | `014_t02-31.jpg` | 02:31 | #456 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 15 | `015_t02-32.jpg` | 02:32 | #457 | Scrolling bodies — FSC (Forest Stewardship Council) / PEFC logos + paragraphs. |
| 16 | `016_t02-32.jpg` | 02:32 | #459 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 17 | `017_t02-34.jpg` | 02:34 | #463 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 18 | `018_t02-34.jpg` | 02:34 | #464 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 19 | `019_t02-34.jpg` | 02:34 | #465 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 20 | `020_t02-35.jpg` | 02:35 | #467 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 21 | `021_t02-35.jpg` | 02:35 | #468 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 22 | `022_t02-36.jpg` | 02:36 | #469 | Disney (The Walt Disney Company) + SMETA / Sedex certifications. |
| 23 | `023_t02-37.jpg` | 02:37 | #473 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 24 | `024_t02-37.jpg` | 02:37 | #474 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 25 | `025_t02-38.jpg` | 02:38 | #476 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 26 | `026_t02-38.jpg` | 02:38 | #477 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 27 | `027_t02-39.jpg` | 02:39 | #479 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 28 | `028_t02-39.jpg` | 02:39 | #480 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 29 | `029_t02-40.jpg` | 02:40 | #481 | Ethical Printing program + further bodies, carousel dots at bottom. |
| 30 | `030_t02-40.jpg` | 02:40 | #482 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 31 | `031_t02-40.jpg` | 02:40 | #483 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 32 | `032_t02-41.jpg` | 02:41 | #484 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 33 | `033_t02-43.jpg` | 02:43 | #492 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 34 | `034_t02-44.jpg` | 02:44 | #493 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 35 | `035_t02-44.jpg` | 02:44 | #494 | Certifications — cream section, logos + descriptive text, rotating seal. |
| 36 | `036_t02-44.jpg` | 02:44 | #495 | ISO + final certification bodies before the next section. |

## 07-story-about — About — "What sets us apart" + "A story to tell"
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t02-45.jpg` | 02:45 | #496 | 7A transition — cream certifications below, dark "WHAT SETS US APART" section rising with a curved top edge. |
| 1 | `001_t02-45.jpg` | 02:45 | #498 | About narrative. |
| 2 | `002_t02-46.jpg` | 02:46 | #499 | 7A "WHAT SETS US APART" heading emerges on dark navy (curved reveal). |
| 3 | `003_t02-46.jpg` | 02:46 | #500 | About narrative. |
| 4 | `004_t02-46.jpg` | 02:46 | #501 | About narrative. |
| 5 | `005_t02-47.jpg` | 02:47 | #502 | 7A value cards building — Turnkey service / Effective communication. |
| 6 | `006_t02-47.jpg` | 02:47 | #503 | About narrative. |
| 7 | `007_t02-47.jpg` | 02:47 | #504 | About narrative. |
| 8 | `008_t02-48.jpg` | 02:48 | #506 | About narrative. |
| 9 | `009_t02-54.jpg` | 02:54 | #525 | 7A four value cards: Turnkey service, Effective communication, Fair price, Social responsibility (icons + copy). |
| 10 | `010_t02-55.jpg` | 02:55 | #526 | About narrative. |
| 11 | `011_t02-55.jpg` | 02:55 | #527 | About narrative. |
| 12 | `012_t02-55.jpg` | 02:55 | #528 | 7A fully settled, green pill CTA at bottom. |
| 13 | `013_t02-57.jpg` | 02:57 | #533 | ▶ 7B "ALTERNATIV: A STORY TO TELL" begins — dark section, image of printing work on left. |
| 14 | `014_t02-57.jpg` | 02:57 | #534 | About narrative. |
| 15 | `015_t02-58.jpg` | 02:58 | #535 | 7B story section — heading + paragraph, photo of hands working with prints. |
| 16 | `016_t02-58.jpg` | 02:58 | #536 | About narrative. |
| 17 | `017_t02-58.jpg` | 02:58 | #537 | About narrative. |
| 18 | `018_t02-59.jpg` | 02:59 | #538 | About narrative. |
| 19 | `019_t02-59.jpg` | 02:59 | #539 | About narrative. |
| 20 | `020_t02-59.jpg` | 02:59 | #540 | 7B "A STORY TO TELL" with "Learn more about us" link, fully settled. |
| 21 | `021_t03-00.jpg` | 03:00 | #541 | About narrative. |
| 22 | `022_t03-00.jpg` | 03:00 | #542 | About narrative. |
| 23 | `023_t03-00.jpg` | 03:00 | #543 | 7B end — story section holds before footer. |

## 08-footer-contact — Footer / contact
| # | Frame | Time | raw | Description |
|---|---|---|---|---|
| 0 | `000_t03-01.jpg` | 03:01 | #544 | Footer transition — dark section curves, footer content forming. |
| 1 | `001_t03-01.jpg` | 03:01 | #545 | Footer / contact. |
| 2 | `002_t03-01.jpg` | 03:01 | #546 | Footer / contact. |
| 3 | `003_t03-02.jpg` | 03:02 | #547 | Footer / contact. |
| 4 | `004_t03-04.jpg` | 03:04 | #553 | FOOTER — info@alternativinc.com, Sitemap / Services / International Printing Services columns, newsletter form. |
| 5 | `005_t03-04.jpg` | 03:04 | #554 | Footer full — "Subscribe to our newsletter" (First name / Last name / e-mail) + certification logo row. |
| 6 | `006_t03-09.jpg` | 03:09 | #568 | Footer / contact. |
| 7 | `007_t03-10.jpg` | 03:10 | #572 | Footer at rest (end of walkthrough) — full contact + newsletter + certifications strip. |

## 09-interactions — Interactions
_No discrete interactions (menu-open, hover, modal, click) were captured — this walkthrough is a continuous top-to-bottom scroll-through. The `MENU` button and nav hovers exist in the resting hero (see 02) but were never actuated on camera._

## 10-mobile — Mobile / responsive
_No mobile/responsive views appear in the recording — the entire walkthrough is the 1920-wide desktop layout._


## STEP 5 — Cross-check vs the DOM/console blueprint

The console probes claimed: (1) book rise = **two images crossfading** in a wrapper **translating up ~334px**; (2) elements **born from `scale(0)`/`opacity(0)`** at staged `3/5/7vw` offsets with **±9–15° rotations**; (3) engine is **pure Webflow CSS transforms** — no GSAP / canvas / video. Verdict against the frames:

| Claim | Verdict | Frame evidence |
|---|---|---|
| Book **translates upward** (~334px) on scroll | ✅ Confirmed | `03-hero-scroll/001→008` (t01:16→01:18): the open book climbs from the resting low position up through the viewport across the sequence. Motion is a vertical translate, not a scale/zoom — the book keeps constant width while its top edge rises. |
| Book rise is a **two-image crossfade** | ⚠️ Consistent, not provable from pixels | The pages go from the closed/low "sleeping" book to a fully-open white spread (`004→008`). A crossfade between two stills would look exactly like this at 3 fps; nothing contradicts it, but frame sampling can't isolate two overlapping layers. Treat as *consistent*. |
| Faded **bleed text behind** the book | ✅ Confirmed (and important) | Giant low-opacity "PRINTING / STORIES" appears *behind* the risen book starting `004_t01-17` and persists through the burst (`_raw/f_0236`, `f_0245`). This is the "bleed crosses the boundary" effect — the hero headline becomes a background wash rather than exiting entirely. |
| Elements **born from scale(0)/opacity(0)**, staggered | ✅ Confirmed | `009_t01-18` shows characters at scale≈0 (specks on the pages); `010→015` shows them scaling up **staggered** (not all at once) to full size. Classic transform-origin scale-in. |
| Elements carry **±9–15° rotation** | ✅ Confirmed | In `_raw/f_0245` the chef, the girl-in-bed card, Asterix/Obelix and the monsters each sit at slight independent tilts — consistent with per-element rotation offsets rather than upright placement. |
| Staged **3/5/7vw depth offsets** | ⚠️ Plausible | Elements clearly emerge at different depths/positions and finish at different scales (foreground chef & old-man larger, back monsters smaller), consistent with staggered vw offsets; exact 3/5/7vw values aren't measurable from pixels. |
| Engine = **pure Webflow CSS transforms**, no GSAP/canvas/video | ✅ Consistent | The whole sequence is scroll-position-driven (a fast user scroll blows through rest→burst in ~1s of video; a slow scroll dwells) and reversible-looking — the signature of scroll-linked CSS transforms / Webflow Interactions, not a timeline-locked video or canvas render. No video scrubbing artifacts or canvas aliasing are visible. |

**Corrections / additions to the blueprint from the footage:**
- The headline does **not** simply exit — it **exits as foreground text and re-enters as a giant faded background wash** ("bleed"). Any rebuild must render that low-opacity headline layer behind the book.
- The recording contains **two full page-loads** (t00:57 and again t02:24), each with the rotating **"alt." preloader seal** — so the preloader is a real, repeatable component, not a one-off (see `01-loading`).
- Section order top-to-bottom: **Hero → Printing Services → Some of our creations (portfolio) → Certifications → What sets us apart → A story to tell → Footer.** The "What sets us apart" values block sits between Certifications and the About/story block (filed under `07-story-about` as sub-section 7A).

## The 5 frames to look at yourself
1. `03-hero-scroll/000_t01-15.jpg` — the hero at rest, the baseline everything animates from.
2. `03-hero-scroll/004_t01-17.jpg` — book mid-rise with the faded "PRINTING STORIES" bleed appearing behind it (the key mechanic).
3. `03-hero-scroll/015_t01-20.jpg` — the burst peak: full illustrated scene exploding from the open book.
4. `01-loading/002_t00-57.jpg` — the "alt." rotating preloader seal (the load identity).
5. `07-story-about/009_t02-54.jpg` — "What sets us apart" 4-card values layout (the cleanest non-hero section).
