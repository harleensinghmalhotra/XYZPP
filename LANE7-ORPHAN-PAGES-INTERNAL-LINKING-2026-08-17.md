# SEO Lane 7/7 — Orphan Pages + Internal Linking

Branch: `phase2-routing`. Commits: `e3db931` (Task 1), `a82cacf` (Task 2).

## Task 1 — Shippability verdict

**Both `/educational-books` and `/trade-books`: ship, unmodified content.**

Assessed before touching anything, per instruction — code read, git history
checked, both temporarily wired in and rendered at 1536×743 and 390×844
before any routing decision was made:

| Signal | EducationalBooks.jsx | TradeBooks.jsx |
|---|---|---|
| Last touched | 2026-07-28 — same "SEO: JSON-LD structured data across pages" commit that touched every currently-routed page | Same commit |
| Phase 3.3 unified skeleton | Yes (`u-hero`/`u-h1`/`u-btn`) | Yes, explicitly commented "unified skeleton, added Phase 3.3 so Trade Books opens on the same navy statement moment as every other page" |
| Uses `<Seo>` component | **No** — hand-rolled `document.title`/meta/script DOM manipulation, a leftover from before that component existed | Yes, correctly |
| Dedicated CSS | None needed — `.edu-*` classes already live in `src/index.css` (116 rules present) | Same, `.tb-*` |
| Rendered content | Full hero, 4-step process, 10-country impact grid with real figures, CAPEXIL award line, closing CTA, site footer | Full hero, category-switcher gallery, accordion (Craft/Materials/Options/Delivery), lifestyle image break, sibling-page cross-links (already built in), closing CTA, site footer |
| Broken images | 0 | 0 |
| Console/page errors | 0 | 0 |
| Mobile (390) | Clean, no overflow, correct stacking | Clean, swatch grid reflows to 2-column, no overflow |

Screenshots taken at both viewports for both pages before wiring anything in
(desktop hero, mobile hero, full-page scroll for each) — all clean. Neither
page needed content changes; the only real defects found were code-level, not
content-level (below).

## What was routed, what was left alone

**Routed** (both — no page failed the shippability check):
- `App.jsx`: `/educational-books` → `EducationalBooks` (lazy), `/trade-books`
  → `TradeBooks` (lazy) — replacing the old `<Navigate>` redirects to homepage
  anchors.
- `scripts/prerender.mjs`: both added to `STATIC_ROUTES`.
- `scripts/generate-sitemap.mjs`: both added to `STATIC_ROUTES` too — **verified,
  not assumed**, per the task's own instruction. The generator's route list is
  hardcoded, not derived from `App.jsx`; a newly-routed static page needs a
  manual entry here exactly as it needs one in `prerender.mjs`. Confirmed both
  now appear in `dist/sitemap.xml`.

**Fixed while reconnecting** (real defects found during the assessment, not
new work invented for its own sake):
- `EducationalBooks.jsx` converted to use `<Seo>` (title/description/canonical/
  OG/Twitter) instead of manual DOM manipulation, for Lane 6 consistency with
  every other route. Added a `Service` entity.
- `TradeBooks.jsx`'s existing `BreadcrumbList` had positions 2 and 3 both
  pointing at the page's own URL — a structural bug (two different names
  claiming the same item). Fixed to the plain 2-level `Home → Page` pattern
  every other route on the site already uses. Added a `Service` entity.

**Left alone**: page content, copy, and visual design on both pages —
unmodified. No client copy was needed for anything in Task 1.

## Linked from real places

- **WhatWePrint.jsx** (homepage): the "Educational Book Printing" and "Trade
  Books" cards now wrap their existing card markup in a `<Link>` instead of a
  plain `<article>`, pointing at the real page. Zero visual change — `.wwp-card`
  is class-scoped in `index.css`, not tag-scoped, confirmed by screenshot
  (pixel-identical to the other, still-non-linking cards).
- **CTAFooter.jsx**: both added to the Quick Links column, reusing each page's
  own already-translated title via a cross-namespace `t()` call (the exact
  same pattern the footer already uses for nav-namespace labels) — not new
  copy.
- **SiteNav.jsx**: the "Educational Book Printing" and "Trade Books" items in
  the What We Print dropdown now point at the real pages instead of the
  homepage anchors they used to (see Task 2 below — this is the same fix as
  the nav-dropdown-links-aren't-real problem, applied to these two items
  specifically).

Verified against a real preview server, not assumed: clicking the WWP card
and clicking the footer link both land on the correct page, at both
viewports, with zero console errors (screenshots captured for each).

## Task 2 — Internal linking

### 1. Nav dropdowns weren't real links

Both the "About Us" (3-item) and "What We Print" (9-item) dropdowns in
`SiteNav.jsx` rendered every item as `<button type="button" onClick={...}>`
calling `navigate()` programmatically — not a real `href`, which is what
Google's own guidance (cited in the recon) says it needs to discover and
follow a link. Converted every dropdown item (12 total across both menus) to
a real `<Link>`, which renders a genuine, crawlable `<a href="...">`.

Preserved exactly: hover/focus open, roving keyboard navigation (arrow
keys, Escape, focus-follows-highlight), and the one edge case a plain `Link`
can't handle on its own — re-clicking a homepage-anchor item you're already
sitting on (the hash doesn't change, so no navigation event fires, so the
page wouldn't otherwise re-scroll). `Link` now performs the actual navigation
itself; the click handler only runs that one side effect.

The two dropdown **triggers** ("About Us", "What We Print" themselves) stay
buttons — they're disclosure controls with their own ARIA semantics
(`aria-haspopup`, `aria-expanded`, `aria-controls`), not pure navigation
links, and their destinations are already linked elsewhere (the footer's own
"Products" entry already covers `/#what-we-print`; `/about` is directly
linked in `LINKS`/footer already) — so no page was exclusively exposed
through a trigger the way the dropdown *items* were.

Confirmed zero visual change: screenshot of the open WWP dropdown before and
after is pixel-identical.

### 2. Newsroom articles now link to money pages

Confirmed absence, per the recon's own finding: "the one article body checked
links only to other newsroom articles... and back to `/newsroom`." Added two
links to every article's footer — "About Us" and "Infrastructure" — reusing
the exact nav-namespace labels every other real link on the site already
uses. Not per-article content-curated: the only three article categories
(Awards, Press, Announcements) are too generic to map cleanly to a specific
money page without inventing editorial judgment that isn't mine to make, so
the same two links appear on every article rather than pretending to be
contextually chosen. Same `.nra-back` visual treatment as the existing "Back
to Newsroom" link, just forward-pointing (a genuinely dormant, already-defined
`<Arrow/>` component in the same file was reused for the icon — not a new
one).

### 3. Anchor text

The recon's own conclusion was blunt: "zero instances of bare 'click here' or
unqualified 'learn more' were found" across the 16 routes it checked. Verified
independently — grepped every `learnMore`/`readMore`/`seeMore`-style
translation key site-wide and checked each rendering site:

| Location | Verdict |
|---|---|
| `Fulfilment.jsx` "Learn more"/"Show less" | In-page expand/collapse toggle, not a cross-page link — nothing to describe a destination for. Left alone. |
| `OurStory.jsx` "See More" | Opens a lightbox gallery in-page, not a link. Left alone. |
| `Cases.jsx` "Read more" | `href="#"`, `onClick={preventDefault}`, `tabIndex={-1}`, `aria-hidden="true"` — a decorative dead link inside a section currently gated off entirely (`SHOW_CASE_STUDIES = false`). Not a live link at all. Left alone (out of this lane's scope — it's the original recon's separately-tracked item #10, not part of Task 2). |
| **`Awards.jsx` "See More" → `/newsroom`** | **Real gap.** A genuine cross-page link with generic text. Fixed. |

Changed to "Newsroom" — the destination's own real name, reused via the nav
namespace — matching the exact minimal-token pattern every other link on the
site already follows (the recon's own words: "every nav, footer, and CTA link
uses descriptive text ('Print on Demand,' 'Global Markets,'... )" — i.e. the
house style *is* "just the destination's name," not a full sentence).

**No client copy was needed for any of this** — every label reuses text that
already exists and is already translated EN/FR/ES.

## Click-depth table (before / after)

| Route(s) | Before | After |
|---|---:|---:|
| `/` | 0 | 0 |
| `/about`, `/global-markets`, `/print-on-demand`, `/infrastructure`, `/fulfilment`, `/newsroom`, `/contact`, 4× `/legal/*` | 1 | 1 (unchanged) |
| 6× `/newsroom/<slug>` | 2 | 2 (unchanged — only reachable via `/newsroom`'s article cards, as before; not in this lane's scope to change) |
| `/educational-books` | unreachable | **1** |
| `/trade-books` | unreachable | **1** |

**Orphan count: 2 → 0.**

## Anchor-text changes (individually)

| Location | Before | After |
|---|---|---|
| `WhatWePrint.jsx` "Educational Book Printing" card | not a link | `<Link to="/educational-books">`, card's own real name |
| `WhatWePrint.jsx` "Trade Books" card | not a link | `<Link to="/trade-books">`, card's own real name |
| `CTAFooter.jsx` Quick Links | — | + "Educational Books" → `/educational-books` |
| `CTAFooter.jsx` Quick Links | — | + "Trade Books" → `/trade-books` |
| `SiteNav.jsx` WWP dropdown, "Educational Book Printing" | `/#wwp-educational` (homepage anchor) | `/educational-books` (real page) |
| `SiteNav.jsx` WWP dropdown, "Trade Books" | `/#wwp-coffee` (homepage anchor) | `/trade-books` (real page) |
| `Awards.jsx` homepage CTA | "See More" → `/newsroom` | "Newsroom" → `/newsroom` |
| `NewsroomArticle.jsx` footer | (none) | + "About Us" → `/about` |
| `NewsroomArticle.jsx` footer | (none) | + "Infrastructure" → `/infrastructure` |

## Copy needed from the client

**None.** Every link added or changed in this lane reuses text that already
exists, in an already-translated locale namespace (EN/FR/ES).

## Verification

**All 20/20 routes prerender**, confirmed by full `pnpm build` output and by
re-checking the actual files on disk after each commit (not just the log
line). Route count: 18 → 20 (12 static/legal + 6 newsroom articles + 2
reconnected pages).

**Fetched prerendered HTML for both new routes**: real content, correct
canonical (`https://quarterfoldltd.com/educational-books`,
`.../trade-books`), correct titles ("Educational Book Printing | Quarterfold
Printabilities", "Trade Book Printing | Quarterfold Printabilities"), correct
schema (`BreadcrumbList` + `Service` on both, structurally validated with the
same checker built in Lane 6 — 0 errors, and specifically confirmed the old
duplicate-breadcrumb-URL bug is gone).

**Sitemap**: both new URLs present in `dist/sitemap.xml`, canonical apex,
real `lastmod` (`2026-07-28`, the actual last git-commit date on both page
files — accurate at the time of this build, matching the reconnection
commit's own date).

**Navigated from the homepage and the footer, both viewports** — screenshots
captured for the WWP card (before/after landing) and the footer link
(before/after landing) at 1536×743 and 390×844, all four confirmed landing on
the correct URL with the correct title, zero console errors.

**Mobile matrix** (360/390/412/440) on both new pages: zero horizontal
overflow at every width, zero elements extending past the viewport
(automated `getBoundingClientRect` scan), visually spot-checked at the two
extremes (360, 440) — clean, no cramping, consistent spacing with the rest of
the site.

**Three unrelated routes spot-checked** (`/legal/privacy`, `/global-markets`,
`/fulfilment`) for regressions from the shared-chrome changes (`SiteNav.jsx`,
`CTAFooter.jsx` are rendered on every route): correct titles, nav links
intact (`/about`, `/print-on-demand`, `/infrastructure` all present), footer
correctly carries the two new links site-wide as expected, 1 JSON-LD block
each, unchanged from Lane 6.

## Files changed

Task 1: `src/App.jsx`, `scripts/prerender.mjs`, `scripts/generate-sitemap.mjs`,
`src/pages/EducationalBooks.jsx`, `src/pages/TradeBooks.jsx`,
`src/sections/WhatWePrint.jsx`, `src/sections/CTAFooter.jsx`.

Task 2: `src/components/SiteNav.jsx`, `src/sections/Awards.jsx`,
`src/pages/NewsroomArticle.jsx`, `src/pages/NewsroomArticle.css`.

## Git status

```
e3db931 Reconnect /educational-books and /trade-books, the two orphan pages
a82cacf Internal linking: real nav-dropdown hrefs, newsroom links, anchor text
```

Working tree clean apart from pre-existing, unrelated uncommitted changes
(`Contact.jsx`, `OurStory.css`, `PrintOnDemand.jsx` — present before this
lane started, untouched by this work) and untracked files predating this
lane.

---

This closes SEO Lane 7/7, the last of the 7-lane series
(`SEO-RECON-2026-08-15.md` → `SEO-ARCH-RECON-2026-08-15.md` →
`CLAUDE-SEO-AUDIT-2026-08-15.md` → Lanes 1–7).
