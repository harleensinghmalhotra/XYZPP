# QFP Website — CHANGE REGISTER (client "Final Desktop" revisions)

- **Repo:** `harleensinghmalhotra/XYZPP` · branch `phase2-routing` · HEAD `85769b3`
- **Input folder:** `THE FINAL DESKTOP WEBSITE CHANGE/` (untracked, inside the working tree)
- **Method:** READ-ONLY. Nothing edited/created/deleted in the source tree. Outputs only in `./_recon2/`. Every target verified by reading code (file:line). `git status` shows only the untracked input folder + `_recon/` + `_recon2/`.
- **Verbatim client doc:** `_recon2/CLIENT-DOC.md` (extracted from `Website Revisions.docx`).

---

## SECTION 0 — INPUT FOLDER INVENTORY

### 0A. Files (recursive)
The folder is **untracked** (`git status`: `?? "THE FINAL DESKTOP WEBSITE CHANGE/"`), sitting inside the git working tree.

| File | Ext | Bytes | Dimensions | Modified | Web-usable? |
|---|---|---:|---|---|---|
| `Website Revisions.docx` | .docx | 22,265 | — | 2026-07-27 21:47 | (source doc) |
| `drive-download-…/1- Sheetfed8 Colour-8.png` | .png | 2,106,040 | 1537×1023 sRGB | 2026-07-27 09:00 | ✅ (optimize→webp) |
| `drive-download-…/Infrastructure reference image.png` | .png | 452,373 | 2000×1125 sRGB | 2026-07-27 08:52 | ✅ (it's a design mockup, not a shippable photo) |
| `drive-download-…/Remove this and replace with aster_.jpg` | .jpg | 516,315 | 1206×1607 sRGB | 2026-07-27 08:59 | ✅ (but it's the *current* image, to be removed) |
| `drive-download-…/Aster-Automatic.ARW` | .ARW | 61,901,824 | unreadable | 2026-07-17 01:33 | ❌ **Sony RAW — not web-usable** |

### 0B. Client document
Extracted verbatim to **`_recon2/CLIENT-DOC.md`** (154 paragraphs; page headings + every bullet preserved, no paraphrase). Pages: Homepage · What We Print · Global Market · Infrastructure · Corporate AV · Certified for Quality · One Continuous Process · Responsible by Practice · Footer · About Us · Our Team · Print on Demand (+ Build a Book/Paper/Binding/Finish) · Infrastructure (page) · Newsroom · Contact Us.

### 0C. Reference images (opened and viewed)
1. **`Remove this and replace with aster_.jpg`** — Two green vintage **manual/thread book-sewing machines** with white thread spools on top, a partially-sewn book block (printed map/charts) in the foreground machine, a "QUALITY PRECISION PERFORMANCE" sign and bookshelf behind. This is the **current** Infrastructure "Binding & Finishing" photo the client wants **removed** and replaced by the Aster Automatic. (Change: C19.)
2. **`Infrastructure reference image.png`** — A **design mockup** (not a photo): navy panel, "**Built for Scale.**" (white) / "**Engineered for Precision.**" (gold), body "Our integrated manufacturing production facilities Spans across 300,000 sq. ft., powered by 800+ skilled professionals…", and a 4-column stat strip with gold icons: **300,000 sq. ft.** (Manufacturing Footprint) · **3** (Integrated Production Facilities) · **800+** (Skilled Professionals) · **75 Million+** (Books Produced Annually). Specifies the new Infrastructure hero + highlights. (Change: C48.)
3. **`1- Sheetfed8 Colour-8.png`** — Real photo of a **Komori Lithrone G37P advance 8-colour sheetfed press** in a clean room with the Quarterfold logo on the wall and a stacked-paper pallet. The new "What Runs the Floor" image. Web-usable. (Change: C53.)
4. **`Aster-Automatic.ARW`** — cannot be opened by the image pipeline (RAW). See 0D.

### 0D. Non-web-usable asset (flag)
**`Aster-Automatic.ARW` is a Sony camera RAW file, 61.9 MB. It cannot be shipped to a browser and cannot be read by the build's image tooling (sharp: "unsupported image format").** It must be **converted + retouched** to an optimized web format (webp/jpg) before use. **We do NOT have a web-ready Aster asset** — none of the other three files is the Aster (one is the *old* manual-sewing photo to remove, one is a design mockup, one is the sheetfed press). C19 is therefore asset-blocked.

### 0E. Missing assets (referenced by the doc, not present in the folder)
- **Destination card images** (C9, "change the card images added to the Drive") — not in this folder.
- **Newsroom "Sir's image"** for the 400,000-books article (C59) — not present.
- **Corporate AV thumbnail** (C20, "a separate image can be shared") — not present (can be auto-derived from `facilities.mp4`; see C20).
- **Footer certification icons** (C30) — no cert icon assets exist in the repo footer today.
- **Web-ready Aster image** (C19) — only the RAW exists.
- **Full-bleed category JPEGs** (C6 Option B) — none present (current assets are transparent webp cutouts).

---

## SECTION 1 — INSTRUCTION → CODE MAP

Legend — Type: **C**=copy(locale) · **L**=layout/CSS · **S**=structural · **A**=asset. Locale keys are ×3 languages (en/fr/es) unless noted. Status: **RDY**=actionable now · **AST**=blocked on asset · **CLR**=blocked on clarification.

### Homepage (CLIENT-DOC 5–24) — Nilesh Sir
| ID | Instruction (trimmed) | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C1 | Add missing "An" to hero heading | `locales/en/home.json:9` `hero.headlineTop` (render `Hero.jsx:71`); opt. `:10` `&`→`and` | C | en 1 key (fr/es headlines are separate wordings) | trivial | RDY (see Q12) |
| C2 | Subline → "Engineering excellence in book manufacturing and seamless global fulfilment…" | `locales/*/home.json:14` `hero.subhead` (render `Hero.jsx:86`) — NOTE `hero.headlineSub` :11 is legacy/unrendered, don't touch | C | 3 keys | trivial(+FR/ES translate) | RDY |
| C3 | Remove the two hero buttons, put them **below the book** as earlier; rename "What We Print"→"Infrastructure" | Buttons `Hero.jsx:99-116` (`.hero-cta-pair`, above image; img `:121-128`); move after `:128`. Label `home.json:15` `hero.ctaPrint` (or reuse `nav.infrastructure`). href `#what-we-print`→retarget | S+C | 3 keys (or reuse nav) | moderate | RDY (see Q14 for destination) |
| C4 | Pull hero image slightly above | `Hero.jsx` headline block min-height `:56` (`min-h-[calc(100svh-87px-3.7vw)]`) / img `:121-128` (no margin) | L | none | trivial | RDY |
| C5 | Reorder WWP categories (9 listed) | `WhatWePrint.jsx:36-47` `CARDS` array (reorder only) — **also drives PoD Explore band** `PrintOnDemand.jsx:653` | S | none | moderate | RDY (see 2H + Q13) |
| C6 | Uniform book sizes OR full JPEG (remove PNG cutouts) | Assets `public/site-assets/what-we-print/*.webp` (10, transparent) + CSS `index.css:1279-1297` `.wwp-img`, per-card `rot` `WhatWePrint.jsx:37-46` | L (A if Option B) | none | A: moderate / B: heavy | Option A RDY · Option B AST |

### What We Print — see C5/C6 above (same page block).

### Global Market (CLIENT-DOC 26–43) — Patrick Sir / Ekta
| ID | Instruction | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C7 | "15 minutes from JNPT" → "45 minutes" | `locales/*/globalMarkets.json:12` (render `GlobalMarkets.jsx:63`) **and** `locales/*/home.json:48` `globeReach.subhead` (render `GlobeReach.jsx:23`) | C | 2 keys × 3 = 6 | trivial | RDY |
| C8 | "Our Promise": remove the subtext (printing, kitting…) | `locales/*/home.json:39` `promise.support` (render `Promise.jsx:31`) — also drop the `<p>` if key deleted | C/S | 3 | trivial | RDY (grouping note: Promise is a homepage section, not the GM page) |
| C9 | Destinations: change card images | `Projects.jsx:34-36` `REGIONS` img paths (`africa-1/asia-2/europe-2.jpg`) | A | none | low (once assets) | **AST** (images not supplied — Q5) |
| C10 | "Certified and audited": "Sedex membership"→"Sedex" | `globalMarkets.json:35` (render `GlobalMarkets.jsx:118`) **and** `homeProjects.json:19` (render `Projects.jsx:182`) | C | 2 files × 3 = 6 | trivial | RDY (also cross-refs C25) |
| C11 | Replace "Surge capacity" copy with 22 towers/6 sheetfed/10 binding/8 auto section/17 manual | `globalMarkets.json:43` (**still old**: "20 towers, 5 sheetfed, 17 folders, 6 auto thread sewing"). **`homeProjects.json:27` already carries the new copy** | C | globalMarkets 3 keys (home already done) | low-moderate | RDY (feeds 2B/2C) |
| C12 | "Dedicated account manager" → "for all our clients around the globe across all time zones" | `globalMarkets.json:46-47` (title+desc) **and** `homeProjects.json:30-31` | C | ~6–12 | low-moderate | RDY (placement decision) |

### Infrastructure — book/gallery (CLIENT-DOC 45–53) — Ekta/Nilesh. *These live inside `FacilityBook.jsx` (`homeInfraSection` namespace), shared with the homepage.*
| ID | Instruction | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C13 | Text too close to borders; add spacing/align (all text pages) | `FacilityBook.css` `.ib-facpage`:578, `.ib-facpage-intro`:612, `.ib-intro-left`:656, `.ib-intro-right`:700 | L | none | S | RDY |
| C14 | Replace binding "perfect binding" first-point body | `locales/*/homeInfraSection.json` `facilities.03.points[0]` (en :76-79) → new Bindwell copy | C | 1 point ×3 | S | RDY |
| C15 | Remove black borders + centre shadow on ALL image pages | `FacilityBook.css` `.ib-img-frame`:794, `.ib-imgpage`:786, :982, :1023; page frames `InfrastructurePage.css` `.inf-tri-frame`:172/174, `.inf-photo`:322, `.inf-gallery-photo`:311 | L | none | M | RDY |
| C16 | Binding & finishing images centred/misaligned; fix | `FacilityBook.css` `.ib-imgpage`/`.ib-img-frame` :775-794 (book id `03`) | L | none | S-M | RDY |
| C17 | Warehouse: warehouse images first, paper-stock after | `FacilityBook.jsx:61` book id `04` `images: seq('warehousing',6)` → explicit ordered array | S | none | S | RDY (needs to know which `warehousing-0N` are paper vs warehouse — visual) |
| C18 | Corporate HQ: align image; black border at top | `FacilityBook.jsx` book id `05` + `FacilityBook.css` frame rules (:786/:794 family) | L | none | S | RDY |
| C19 | Remove Manual Sewing Machine image → Aster Automatic (binding) | `FacilityBook.jsx:60` book id `03` `images: seq('binding',11)` (`binding-01..11.webp`); TALL set `:98-101` (`binding-04/09`). Image not identifiable from code — needs visual pick | A/S | none | M | **AST** (Aster is RAW — Q8) + contradicts 2B |

### Corporate AV (CLIENT-DOC 55–56)
| C20 | Video thumbnail → last slide of video | Homepage thumb `index.css:2564` `.infra-video-thumb--photo` bg `facilities-thumb.webp`; poster `Infrastructure.jsx:235` `facilities-poster.jpg` (also `InfrastructurePage.jsx:43/368/439`) | A | none | S | AST → **can auto-derive** last frame from `facilities.mp4` (on disk) — Q10 |

### Certified for Quality → "Certification" (CLIENT-DOC 58–62, 95–97). *`Certifications.jsx` is ONE shared component rendered on Home (`Home.jsx:168`), About (`OurStory.jsx:116`) AND Infrastructure (`InfrastructurePage.jsx:249`) — every edit hits all three; C36 needs no separate work.*
| ID | Instruction | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C21 | Heading "Certified for Quality" → "Certification" | `homeCerts.json:9` `title` (render `Certifications.jsx:206`) | C | 3 | trivial | RDY |
| C22 | Remove "Environment and Social Responsibility" button | Pills `Certifications.jsx:16-20` + render `:165-181`; labels `homeCerts.json:3-7`. **Actually TWO pills** (Environment + Social) — likely remove whole filter row | S+C | up to 4×3 | small | RDY (see Q6) |
| C23 | Star Export House: two stars, drop single icon star | `Certifications.jsx:224` `★` glyph; CSS `index.css:2962-2963` | L/S | none | trivial | RDY |
| C24 | Cards clickable to enlarge & show full body | `.cert-card` `Certifications.jsx:214-236`; body clamp `index.css:2983` (`line-clamp:3`); reuse drag-guard `moved` `:116` | S (feature) | 0–3 | **medium** (biggest cert item) | RDY |
| C25 | Sedex "Member"→"Sedex"; FSC drop "Chain of Custody" | Sedex title `homeCerts.json:33`; FSC title `:18`. **Keep licence code `TUVDC-COC-101258`** (`:30-32`, compliance) | C | 2 titles ×3 = 6 | trivial | RDY |
| C36 | About certs = same as homepage | Same shared component — **auto-covered by C21-C25** | — | none | none | RDY |

### One Continuous Process (CLIENT-DOC 64–66)
| C26 | Remove the process step-list text | `ProcessVideo.jsx:117-126` `<ol.pv-steps>` + `homeProcess.json:7-14` `steps` (6×{title,desc}) | S+C | 12/lang removed | S | RDY (repo has no "full payment" step — live differs slightly) |
| C27 | Keep only the strip below the video | Strip = `pv-badges` `ProcessVideo.jsx:168-181` (`homeProcess.badges`), **currently gated off by `SHOW_PROCESS_EXHIBIT=false` `:40`** — must surface it | S | badges exist ×3 | M | RDY (repo says "Zero **runaround**" vs client "turnaround"; band has 6 not ~3) |

### Responsible by Practice (CLIENT-DOC 68–69)
| C28 | Bold body phrases in olive green | `index.css:3250` `.sustain-item-lead` add `color:#6B7A2A` (leads in `Sustainability.jsx:157-171`) | L | none | XS | RDY |

### CTA + Footer (CLIENT-DOC 71–75)
| C29 | CTA "Let's Print Something That Matters" body copy | `footer.json:4` `cta.body` (render `CTAFooter.jsx:87`) | C | 3 | XS | RDY — **near-miss**: current "ten million" → client "millions of" |
| C30 | Footer: cert icons + names below logo, by social handles, no subtext | Certs are today a text-link column `CTAFooter.jsx:43-52`; logo col `:118-134`; socials `:176-186`. Move + add icons | S+A | minimal | M | RDY (needs cert icon assets — Q for Harry) |

### About Us (CLIENT-DOC 77–93)
| ID | Instruction | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C31 | Mission statement → new copy | `ourStory.json:51` `mission.desc` (render `OurStory.jsx:199`) | C | 3 | XS | RDY — **near-miss**: only "across 25+ countries"→"across the globe" |
| C32 | Our Story: body −1pt, centre-align | `OurStory.css:106-111` `.ab-lede-text` (font-size + `text-align:center` + `margin-inline:auto`) | L | none | XS | RDY |
| C33 | After MVV add "Our Team" then "Founder & CEO Profile"; change Nilesh quote | Order `OurStory.jsx:93-102` (today Founder `:99` → Team `:102`; client wants Team→Founder); quote `ourStory.json:66` `founder.quote` | S+C | 1 (+1 new heading)×3 | S-M | RDY (Q4 duplicate-Nilesh) |
| C34 | Team hierarchy order (8 people) | `OurStory.jsx:363` `TEAM_SLUGS` + `ourStory.json:78-114` `team.members` | S+C+A | reorder + adds | M | **CLR/AST** — see 2A (Milton missing; Nilesh card) |
| C35 | Team leadership card subtext | `.tm-invite` `OurStory.jsx:464-468` (`team.selectHint` `ourStory.json:72`) | C | 1×3 (+maybe new) | S | RDY |

### Print on Demand (CLIENT-DOC 99–125) — Patrick Sir. *All in `PrintOnDemand.jsx` + `printOnDemand.json`.*
| ID | Instruction | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C37 | Remove all hero subtext | `PrintOnDemand.jsx:296` `subline={t('hero.sub')}` (`:11`); also stat foot `hero.statFoot` `:300`/`:15`? | C/S | 1–2 ×3 | low | RDY (confirm statFoot too) |
| C38 | Build Your Book subtext → new | `build.lede` `printOnDemand.json:21` (render `:318-320`) | C | 3 | low | RDY |
| C39 | Remove entire "Included with every order" | `PrintOnDemand.jsx:469-485` block + `INCLUDED` const `:81-86`; `printOnDemand.json:68-74` | S | 9/lang removed | M | RDY |
| C40 | Remove spec-card footer note | `PrintOnDemand.jsx:587-589` `summary.note` (`:108`) incl. embedded contact link | C/S | 1×3 removed | low | RDY |
| C41 | Add upload-file button to spec form | Form `PrintOnDemand.jsx:517-581`; handler `:242-288` | S+infra | ~1-2 new | **high** | **CLR** — not deliverable on current free tier (2E, Q9) |
| C42 | Remove "Three steps to finished copies" | `PrintOnDemand.jsx:595-615` section + `HOW` const `:87-91`; `printOnDemand.json:111-117` | S | 11/lang removed | M | RDY |
| C43 | Format: Paperback + Hardcover only (drop Landscape) | `FORMATS` `:23`; `FMT_ICON.landscape` `:69`; `bookDims()` `:42-45`; grid `:400`; `options.format.landscape` `:37` | S+L+C | 1 group ×3 | low-M | RDY |
| C44 | Sizes: A5/B5/A4 (inches) | `SIZES` `:24`; `SIZE_RATIO` `:34`; **default `size:'6x9'` `:163` must repoint**; `options.size.*` `:39-44` | S+C | full size block ×3 | M | RDY (⚠ default repoint) |
| C45 | Paper: 70/80/100gsm White/Cream/Art | `PAPERS` `:25`; **`PAPER_EDGE` `:35-39` must add every new id (else crash `:351/:426`)**; default `paper:'cream'` `:162` repoint; `options.paper.*` `:45-49` | S+C | full paper block ×3 | M-H | RDY (⚠ crash risk + Q: weight×shade needs sub-selector) |
| C46 | Binding: perfect/section-sewn/saddle (drop Wiro) | `BINDINGS` `:26`; `BIND_ICON` `:71-75`; `options.binding.*` `:50-54` | S+C | swap 1 group ×3 | low-M | RDY |
| C47 | Finish: matt/gloss (drop Lay-Flat) | `FINISHES` `:27`; `FIN_ICON.layflat` `:79`; grid `:447`; `options.finish.layflat` `:55-59` | S+L+C | 1 group ×3 removed | low | RDY |

### Infrastructure PAGE (CLIENT-DOC 127–139) — Ekta. *`InfrastructurePage.jsx` + `infrastructurePage.json`.*
| ID | Instruction | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C48 | Hero → "Built for scale, engineered for precision" + new highlights (per reference) | `infrastructurePage.json:10` `hero.title`; `heroStats.items` `:20-25` → 300,000/3/800+/75M+; icon order `InfrastructurePage.jsx:81` | C(+L) | hero+4 stats ×3 | S-M | RDY (asset = mockup, copy only) |
| C49 | Remove arrow left of book stack | `FacilityBook.jsx:421-436` `spineArrows` + render `:454` (shared → affects homepage too) | S | none | S | RDY |
| C50 | Infra book = same as homepage book | Shared `FacilityBook.jsx` — auto | — | none | none | RDY |
| C51 | Premium Finishes to follow the book | Already `book :215-219 → Premium Finishing :224-241` | verify | none | none | RDY (**already satisfied**) |
| C52 | Add AV after Premium Finishes | Insert after `InfrastructurePage.jsx:241`; reuse `VIDEO_SRC/VTT/POSTER` `:40-43` + dialog `:425-450` | S | reuse/new | M | RDY — **do before C58** |
| C53 | "What Runs the Floor" image → 8-colour sheetfed | `InfrastructurePage.jsx:293` `facility-01.webp` → convert `1- Sheetfed8 Colour-8.png`→webp | A | none | S | RDY (asset supplied — Harry converts) |
| C54 | Add Photo Gallery (inside facilities); remove "a look across the floor" heading | Gallery already §7 (`gallery.eyebrow`="Inside the facilities"); remove h2 `InfrastructurePage.jsx:395` / `gallery.title:138` | C/L | 1×3 | S | RDY |
| C55 | Certificates (ordering) | `InfrastructurePage.jsx:249` `<Certifications>` reposition | S | none | S | RDY (re-tune flatTop/flatBottom curves) |
| C56 | Recognition/award/press (ordering) | `InfrastructurePage.jsx:387` `<Awards>` reposition | S | none | S | RDY |
| C57 | Remove "On the Press Floor" section | `InfrastructurePage.jsx:304-326` (§4 machine ledger) + `MACHINES` `:60-64`; `machines.*` `:61-78` | S | machines.* removable | S | RDY |
| C58 | Remove "Real Capacity" section | `InfrastructurePage.jsx:329-380` (§5, contains the video) + `STATS` `:72-77`; `results.*` | S | results.* | M | RDY — **relocate video (C52) first** |

### Newsroom (CLIENT-DOC 140–141)
| C59 | "400,000 books/year" article (15 Jan 2022): remove first workers image, add Sir's image top + card | **Sanity CMS content** (not repo locale/code) — `NewsroomArticle.jsx` renders Sanity; article slug `printweek-400000-books-a-day` | CMS + A | n/a | S | **AST** (Sir's image not supplied) + CMS edit (Q11) |

### Contact Us (CLIENT-DOC 143–168) — unattributed. *`Contact.jsx` + `contact.json` (+ `index.css` `.ctc-*`, `PageHero.css`).*
| ID | Instruction | Target file:line | Type | Locale | Effort | Status |
|---|---|---|---|---|---|---|
| C60 | Email instead of contact number in header, smaller font | Hero num `Contact.jsx:375` → `EMAIL_INFO` `:26`; font `PageHero.css:62-67`; labels `contact.json:15-17` | C+L | 0 req (≤9 if labels) | S-M | RDY (⚠ tension w/ C63 — Q) |
| C61 | Remove addresses from header section | Location strip `Contact.jsx:399-441` (addr lines `:412`,`:430`, hardcoded) | S | 0 (hardcoded) | S | RDY ("header section" = the location strip) |
| C62 | "We'd Love to Hear…" new heading+body, centred | `welcome.head` `:29` + `welcome.sub` `:30` (render `Contact.jsx:449-454`); centre `.ctc-welcome-*` `index.css:3863-3870` | C+L | 2×3=6 | S | RDY |
| C63 | Ways to Reach Us: 5 channels, smaller fonts | Already all 5 present `Contact.jsx:55-63`/`:458-481`; fonts `.ctc-cell-*` `index.css:3913-3924` | L | 0 | S | RDY (content already correct; ⚠ C60 tension) |
| C64 | Our Locations: 3 factories one row/one card, hours below, remove "hours to be confirmed" | 3 cards `Contact.jsx:503-542` → one card; units `.ctc-addr-units` `index.css:3978` col→row; delete flag `addr.hours.flag` `:48` | S+L+C | delete 1×3 | M | RDY |
| C65 | Careers title → blue | `.ctc-careers-title` `index.css:4008` color | L | 0 | S | RDY |
| C66 | "Open Opportunities" centred vs Careers | `.ctc-careers-blocks` `index.css:4014` align | L | 0 | S | RDY |
| C67+C68 | "Send an Inquiry"/"Tell Us About Your Project" subtext → new | **Same node** `form.lede` `contact.json:55` (render `Contact.jsx:596-598`) — one edit | C | 1×3 | S | RDY (C67 & C68 = one edit) |
| C69 | FAQ: reduce font to fit | `.ctc-faq-title/.ctc-qa-*` `index.css:4168-4199` | L | 0 | S | RDY |
| C70 | Remove "Prefer Email" section | `Contact.jsx:786-794` `.ctc-closer` + `closer.line` `:199`; CSS `:4224-4241` | S | delete 1×3 | S | RDY |

---

## SECTION 2 — CONFLICTS, CONTRADICTIONS & FOOTGUNS

**2A — TEAM HIERARCHY.** Current: **6 cards** in order Sameer Kazi · Charani Dhankani · Dhiresh Verlekar · Dilip Ramrakhyani · Patrick Carrapiett · Priyanka Rajpal (`TEAM_SLUGS` `OurStory.jsx:363` + `ourStory.json:78-114`). **Nilesh Dhankani is a SEPARATE "Founder" section** (`OurStory.jsx:216-242`), not a card. Client wants **8 cards**: Nilesh · Patrick · Dilip · Charani **Khekho** Dhankani · Sameer Kazi · **Milton** · Dhiresh · Priyanka.
- **Added:** (1) **Nilesh as card #1** — content mostly exists (founder photo/bio/role) but there's no team-folder slug/photo; and per C33 he *also* stays as the "Founder & CEO Profile" → he'd appear **twice** (confirm). (2) **Milton — entirely new: no photo (`about/team/` has none), no title, no bio, no quote, no surname.** All content missing.
- **Reordered:** the 5 existing members all shift; update `TEAM_SLUGS` + `team.members` together across en/fr/es.
- **Name change:** "Charani Dhankani" → "Charani **Khekho** Dhankani" (`team.members[].name` ×3; slug can stay).
- **Layout:** grid is a 3×2 six-card layout — 8 cards needs a layout check. Photos present: charani, dhiresh, dilip, patrick, priyanka, sameer. **Missing: milton, nilesh(team-crop).**

**2B — MANUAL SEWING MACHINES (direct contradiction — not resolved).**
- Global Market copy (C11, CLIENT-DOC:42) **keeps** manual sewing: *"…eight automatic section, sewing machines and **17 manual sewing machine**."* Renders at `homeProjects.json:27` (already live), and to be added to `globalMarkets.json:43`; also `homeInfraSection.json:85` ("17 manual stations").
- Infrastructure (C19, CLIENT-DOC:53) says **"Remove Manual Sewing Machine with Aster Automatic"** — targets the Binding & Finishing spec `infrastructurePage.json:75` ("…17 manual sewing machines") + the book image.
- Applying both → the site claims 17 manual sewing machines in the Global Reach credentials while removing them in Infrastructure. **Mutually inconsistent.** Also: **"Aster" appears nowhere in `src` yet.** → Q1.

**2C — MACHINE / STAT COUNTS.** New copy target set = **22 towers / 6 sheetfed / 10 binding lines / 8 auto section sewing / 17 manual**. Site is already consistent with this **except**:
- ❌ `globalMarkets.json:43` (×3) = "**20** towers, **5** sheetfed, 17 folders, **6** auto thread sewing" — the old values (C11 fixes).
- ❌ `homeInfraSection.json:192` = "**6** automatic **thread** sewing machines" — a stray old value C11 does **not** touch (separate fix needed).
- Independent inconsistencies (pre-existing, not from these edits): **headcount 800+ people (`infrastructurePage.json:24`) vs 600+ (`homeInfraSection.json:209`) vs 200+ (`:163/:166`)**; **warehouse 100,000 sq ft (fulfilment) vs 60,000 sq ft (`contact.json:181`)**. The C48 reference asserts **800+**. → Q7.
- Canonical figures found: 300,000 sq ft total; 100,000 sq ft warehouse; 75M books/yr; 25+ countries; 98% on-time; 800+ containers/yr.

**2D — JNPT DISTANCE.** Only two occurrences carry the literal "**15 minutes**" → both are C7 targets: `globalMarkets.json:12` and `home.json:48` (×3 each). All other JNPT mentions are number-free ("minutes from JNPT"): `fulfilment.json:69/96/114`, `homeInfraSection.json:111` (×3). No "15" is stranded elsewhere; confirm whether the vague Fulfilment ones should also say "45".

**2E — FILE UPLOAD ON PoD (C41) — NOT deliverable as-is.** Verbatim comment `Contact.jsx:558`: *"the enquiry form still posts to Web3Forms (its free tier does not accept file uploads)."* Both forms `fetch` Web3Forms as **JSON** (`Contact.jsx:303-319`, `PrintOnDemand.jsx:261-281`) with the same **public free-tier key** `4f37deec-…-9b46b4`. The existing product already routes CVs around this via `mailto:` (`Contact.jsx:575-580`). A working upload needs **both** a transport change (multipart `FormData`, not JSON) **and** infra: (1) upgrade Web3Forms to a paid plan; or (2) switch handler (Formspree/Basin paid); or (3) storage bucket (S3/R2/Supabase) + a Vercel serverless upload endpoint, POSTing only the file URL. A UI-only "upload button" that doesn't transmit would be misleading. → Q9.

**2F — CERTIFICATIONS / ISO 14001.** C21-C25 map cleanly (see Section 1). Crucial finding: **the "Environment" tab does NOT render ISO 14001** — the pills are category *filters*; the environment filter shows the FSC card. Removing the tab removes **no** ISO 14001. **ISO 14001 actually renders in only TWO user-facing places** — the "Certified and audited" credential strings at **`homeProjects.json:19`** (home Global Reach) and **`globalMarkets.json:35`** (Global Markets page). The `homeSustain.chips.iso` (`:13`) and `infrastructurePage.strip.certs.iso14001` (`:34`) are **dead/unrendered** code. The client is editing that same credential line for Sedex (C10) but says nothing about ISO 14001. → Q2.

**2G — HERO CTA HISTORY ("as they were earlier").** Current CTAs-above-image layout was introduced by commit **`9aba8a3`** ("Task 1: rebuild hero headline… artwork above fold"). The earlier "**CTAs below the book**" layout is commit **`f4cb85a`** ("Hero matches Ekta's mockup exactly — image full-bleed, CTAs under book only", 2026-07-16): two pill CTAs as an **absolutely-positioned overlay** in the white area directly under the book, centred side-by-side (`bottom: clamp(3.5%,6vh,10%)`), button 1 = text + arrow-in-circle, button 2 = text-only outline, both `h-[54px]`. So "below the book" = CTAs over the lower white ground of the hero art, not a flow block above it.

**2H — WHAT WE PRINT ORDER + FORMAT.** ⚠ **Key↔name mismatch in `CARDS`**: key `trade` renders "Counterbook and Stationery", key `coffee` renders "Trade Books" — reorder must be done by **display name**, not key. Target order (by key): `educational, children, general, coffee, kits, trade, corporate, pod, religious`. The doc lists **9** items — it **omits `packaging`** (Packaging and Gifting), which is a real 10th card today (**not** a truncated bullet) → decide keep-at-end vs remove (Q13). **Format:** all 10 category images are **WebP with alpha (transparent cutouts)** in `public/site-assets/what-we-print/` (151–301 KB); the doc's "PNGs" is colloquial. Option B (full JPEG) needs 9-10 new opaque source files.

**2I — DEAD LINKS after removals.** **None break.** All removal-affected sections are either kept-as-section (only inner text removed) or have no navigable anchor. Footer Quick Links (`CTAFooter.jsx:34-51`: `/#what-we-print`, `/#projects`, `/infrastructure`, `/#cases`, `/contact`, `/#certifications`) all survive. **Only watch-item:** keep `<section id="process">` (`ProcessVideo.jsx:91`) intact when trimming the One-Continuous-Process text (C26/C27), else `WhatWePrint.jsx:78`'s "See our process" (`#process`) link breaks. `App.jsx` routes are **not** touched by any client change.

---

## SECTION 3 — OUR OWN OUTSTANDING FINDINGS ("OURS"), re-verified on HEAD 85769b3

| # | Finding | Re-verify result | Fold into |
|---|---|---|---|
| O1 | Real domain serves an older build | ✅ real `index-DivhGlHt.js/l2ZIvrP1.css` ≠ Vercel/local `Bfqye-Oy/BumNzZDX` | Deploy lane |
| O2 | No `.htaccess` produced/stored | ✅ absent in repo/public/dist | Deploy lane |
| O3 | Founder page "Awaiting founder photo" placeholder | ✅ `Founder.jsx:79` (needs a real photo asset) | Lane F1 / asset |
| O4 | Global Markets "Our Global Team, details coming shortly" | ✅ `globalMarkets.json:52-53` | Lane B |
| O5 | Footer Company Profile PDF is 1-page ~60 KB stand-in | ✅ `company-profile.pdf` = 61,556 B | asset |
| O6 | Missing alt on award logos, About gallery, founder portrait | ✅ (11 award + 6 gallery + founder) | per-component |
| O7 | FR `infrastructurePage:dialog.captionsLabel` = "English" | ✅ `fr:155` "English" (EN also "English"; ES "Inglés") | Lane G |
| O8 | Preview `xyzpp.vercel.app/robots.txt` = `Allow: /` (indexable) | ✅ | Deploy lane (add noindex) |
| O9 | `SHOW_RESTRICTED_CLIENTS = true` while comments say false | ✅ `compliance.js:23` = true; stale comments in TrustStrips/Projects/Fulfilment | compliance cleanup |

---

## SECTION 4 — PROPOSED EXECUTION LANES (zero file overlap within a lane; hotspots serialised)

Each lane owns a disjoint set of **primary files**. Files touched by more than one lane are **collision hotspots** and must be **serialised** (one lane at a time, rebase between).

- **Lane A — Home hero & What We Print** — `Hero.jsx`, `WhatWePrint.jsx`, `home.json`(hero.* keys), `homeWwp.json`, `nav.json`. Covers **C1,C2,C3,C4,C5,C6**. *Feeds Lane D (CARDS order).*
- **Lane B — Global Markets & home Global Reach/Promise** — `GlobalMarkets.jsx`, `GlobeReach.jsx`, `Promise.jsx`, `Projects.jsx`, `globalMarkets.json`, `homeProjects.json`, `home.json`(globeReach/promise keys). Covers **C7,C8,C9,C10,C11,C12 + O4**.
- **Lane C — Certifications (shared component)** — `Certifications.jsx`, `homeCerts.json`. Covers **C21,C22,C23,C24,C25,C36**. *(Applies to Home/About/Infra automatically.)*
- **Lane D — Print on Demand** — `PrintOnDemand.jsx`, `printOnDemand.json`. Covers **C37–C47**. *Run after Lane A (Explore band consumes CARDS order).*
- **Lane E — Contact** — `Contact.jsx`, `contact.json`, `PageHero.css`. Covers **C60–C70**.
- **Lane F1 — About & Team** — `OurStory.jsx`, `OurStory.css`, `ourStory.json`, `Founder` section. Covers **C31,C32,C33,C34,C35 + O3**.
- **Lane F2 — Home process / sustainability / CTA-footer** — `ProcessVideo.jsx`, `Sustainability.jsx`, `CTAFooter.jsx`, `homeProcess.json`, `footer.json`. Covers **C26,C27,C28,C29,C30**.
- **Lane G — Infrastructure page + shared FacilityBook** — `InfrastructurePage.jsx`, `InfrastructurePage.css`, `FacilityBook.jsx`, `FacilityBook.css`, `Infrastructure.jsx`(home infra + C20 video), `infrastructurePage.json`, `homeInfraSection.json`. Covers **C13–C20, C48–C58 + O7**. *Internal interlock: **C52 before C58**.*
- **Lane H — Newsroom (Sanity CMS)** — no repo files; content edit in Sanity Studio. Covers **C59**.
- **Lane Z — Deploy / infra / compliance (no page overlap)** — `vercel.json`/`public/robots.txt`/`.htaccess` (new), `compliance.js` (+ stale comments), `company-profile.pdf` (asset), alt-text across components. Covers **O1,O2,O5,O6,O8,O9** + production redeploy.

**Collision hotspots (must be serialised — do NOT run two lanes on these at once):**
- **`src/index.css`** — the biggest: Lane A (`.hero-*`,`.wwp-*`), C (`.cert-*`), D (`.pod-*`), E (`.ctc-*`), F2 (`.sustain-*`,`.pv-*`,footer), G-adjacent. Selector blocks are distinct, but they share one file → serialise commits (or, optional refactor: split into per-section CSS files first).
- **`src/locales/*/home.json`** — Lane A (hero.*) **and** Lane B (globeReach.*, promise.*). Serialise.
- **Shared components already owned by one lane (no cross-lane edits allowed):** `Certifications.jsx`/`homeCerts.json` (Lane C — renders on 3 pages), `FacilityBook.jsx`/`homeInfraSection.json` (Lane G — renders on Home+Infra), `WhatWePrint.jsx`/`CARDS` (Lane A — consumed by Lane D), `CTAFooter.jsx` (Lane F2 — on every page).
- **`App.jsx` — NOT impacted** by any client change (no routes added/removed).

**Recommended order:** A → (B, C, E, F1, F2 in parallel where index.css/home.json are serialised) → D (after A) → G (largest; C52 before C58) → H (CMS, when asset arrives) → Z (deploy last, plus O-items throughout). Sequence Lane A first because its `CARDS` order feeds Lane D and its `home.json` hero keys must land before Lane B touches the same file.

---

## SECTION 5 — DISPOSITION LISTS

### 🔴 BLOCKED ON CLIENT (assets, content, or contradictions only they can settle)
- **C34 / Milton** — need full name, title, photo, bio, quote (nothing exists).
- **C34+C33 / Nilesh** — confirm he appears both as team card #1 *and* the Founder profile (would show twice).
- **2B sewing machines** — keep "17 manual sewing" (Global Reach) vs remove manual sewing (Infrastructure): reconcile.
- **2F ISO 14001** — keep or remove in the two "Certified and audited" credential lines after the Environment tab goes.
- **C9 destination images** — 3 card images not supplied.
- **C59 Newsroom "Sir's image"** — not supplied (also a CMS edit, not code).
- **C22** — remove both Environment + Social pills (whole filter row)? confirm.
- **2C / C48 headcount** — 800+ vs 600+ vs 200+ people: which is correct?
- **C6** — uniform cutouts (Option A) vs full JPEGs (Option B, needs new assets)?
- **C41** — product/infra decision (paid tier vs storage bucket) before any upload work.
- Minor confirms: **C1** ("An" + "&"→"and"), **C3/Q14** (Infrastructure button → section vs route), **C20** (auto-frame vs supplied image), **C37** (drop hero statFoot too?), **C60↔C63** (phone relocates from hero to tile — OK?).

### 🟠 BLOCKED ON HARRY (asset conversion/creation)
- **C19 Aster** — convert `Aster-Automatic.ARW` (Sony RAW 61.9 MB) → optimized webp/jpg + retouch; **and** identify which `binding-01..11.webp` is the manual-sewing photo to replace.
- **C53 sheetfed** — convert `1- Sheetfed8 Colour-8.png` (1537×1023) → optimized webp (then 1-line swap at `InfrastructurePage.jsx:293`).
- **C9 destinations** — once client supplies, optimize → webp into `homepage/destinations/`.
- **C20 corporate AV thumb** — extract last frame of `facilities.mp4` (ffmpeg) → `facilities-thumb.webp` + `facilities-poster.jpg` (if not waiting on client image).
- **C30 footer cert icons** — source/create 5 icon assets (FSC, ISO 9001, ISO 27001, Sedex, Star Export House).
- **C6 Option B** — produce 9-10 full-bleed category JPEGs (only if Option B chosen).
- **O3 founder photo** (for the /founder page placeholder) and **O5 real Company Profile PDF** (replace the 1-page stand-in).

### 🟢 READY TO BUILD (fully specified, assets present, no client decision needed)
- Homepage: **C1**(pending only the "&" confirm), **C2, C4, C5**(with 2H key-name caution + packaging Q), **C29**(near-miss copy).
- Global Markets: **C7, C8, C10, C11**(GM page; home already done), **C12**(placement).
- Certifications: **C21, C23, C24, C25** (and **C36** free).
- One-Continuous/Responsible: **C26, C27**(un-gate the badges strip), **C28**.
- About: **C31**(near-miss), **C32, C33, C35**.
- Print on Demand: **C37, C38, C39, C40, C42, C43, C44, C45, C46, C47** (mind the default-config repoint + `PAPER_EDGE` crash guard).
- Infrastructure page: **C13, C14, C15, C16, C17**(needs file-role note), **C18, C48, C49, C51**(already satisfied), **C52** (before C58), **C54, C55, C56, C57, C58, C50**.
- Contact: **C60–C70** (all specified; C63 content already correct; C67=C68 one edit).
- OURS: **O2**(.htaccess), **O7**(FR captionsLabel), **O8**(preview noindex), **O9**(compliance comment cleanup). **O1**(redeploy current build to Hostinger).

### ❓ OPEN QUESTIONS (send to Ekta verbatim)
1. The Global Market copy keeps "17 manual sewing machines," but the Infrastructure change says to remove the manual sewing machine (replace with Aster Automatic). Do we keep or remove manual sewing machines across the site?
2. After we remove the "Environment / Social responsibility" tab, "ISO 14001:2015" still appears in the "Certified and audited" lines on Global Markets and the homepage Global Reach — do you want ISO 14001 kept or removed in those lines?
3. For the team, please send Milton's full name, job title, photo, bio, and quote — we currently have nothing for him.
4. You've asked to add Nilesh as the first team card *and* keep a "Founder and CEO Profile" section — should he appear in both places, or only as the Founder profile?
5. The three "Destinations" card images to swap aren't in the shared folder — can you share them (Africa / Asia / Europe)?
6. The Certification section has two filter buttons, "Environment" and "Social responsibility" — should we remove both (the whole filter row), leaving all five certificates always visible?
7. The new Infrastructure reference says "800+ Skilled Professionals," but other parts of the site say "600+ people" and "200+ professionals" — which number is correct so we can make them all match?
8. The Aster Automatic photo is a 61.9 MB Sony RAW (.ARW) that browsers can't display — can you share a JPEG/PNG, or should Harry convert/retouch it?
9. A working "upload your file" button can't run on our current (free) form service — it needs a paid plan or a file-storage setup (extra cost/effort). Do you want us to proceed, and which route?
10. For the Corporate AV thumbnail, shall we auto-generate it from the video's last frame, or will you send a specific image?
11. Please share "Sir's image" for the "400,000 books a year" newsroom article — note the newsroom is managed in the CMS (Sanity), so this is a content edit, not a code change.
12. Please confirm the homepage headline "An integrated global book manufacturing and fulfilment partner." — and should the "&" become the word "and"?
13. What We Print lists 9 categories but the site has a 10th, "Packaging and Gifting" — keep it (at the end) or remove it?
14. Should the renamed "Infrastructure" hero button scroll to the homepage Infrastructure section, or open the full /infrastructure page?

---
*No repo source files were modified, staged, committed, or deployed. All outputs live under `./_recon2/`. Report only.*
