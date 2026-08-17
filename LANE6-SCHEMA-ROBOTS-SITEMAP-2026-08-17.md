# SEO Lane 6/7 — Schema Depth, Robots, Sitemap

Branch: `phase2-routing`. Commits: `6c9daa7`, `ad59797`, `ed4037e`.

## Summary

Fixed the Organization NAP mismatch (schema carried the registered/legal Vashi
office; every visible address on the site shows the Sanpada Head Office), added
`sameAs` to the site's live social accounts, added `Service` entities for the
site's named print capabilities, added the missing `BreadcrumbList` on newsroom
articles, declared real dimensions on the `NewsArticle` publisher logo, and
replaced the hand-edited `sitemap.xml` with a build-time generator that pulls
real `lastmod` dates from git history and the live Sanity dataset. `robots.txt`
was already fully compliant with this lane's own requirement — confirmed, not
changed. Zero deprecated schema types were in use — confirmed, nothing to swap.

## NAP — before / after

| | Before | After |
|---|---|---|
| Organization schema address | `Office No 1207, Plot No 4 & 6, Sector 30A, Cyber One IT Park, Vashi, Navi Mumbai, Maharashtra 400703` (registered/legal office) | `Plot No. 31, Sector 22, Sanpada, Navi Mumbai, Maharashtra 400703` (Head Office) |
| Matches visible NAP? | No — real mismatch, flagged by `SEO-RECON-2026-08-15.md` §9 and independently by the claude-seo audit's `seo-local` pass | **Yes — verified character-for-character** against `CTAFooter.jsx`'s visible address block (script-compared, not eyeballed) |
| Registered office | Vashi, in the footer's statutory entity line (CIN `U74999MH2020PTC337494`) | **Unchanged** — `CTAFooter.jsx` untouched, confirmed via `git diff` |
| `geo` | absent | **Still absent, deliberately.** The only coordinates in the repo (`GlobeFlyTo.jsx` map markers) are decorative, low-precision (3–4 decimals, short of the 5-decimal bar the claude-seo audit itself sets), and — checked directly — labelled for **Vashi**, not Sanpada. Inventing a geo value for the Sanpada address was ruled out rather than risked. |
| `telephone` | `+91-82-9199-9922` | **Unchanged** — this is the same number displayed on `/contact`, already valid, nothing to add or invent |

## `sameAs` and `@id`

Added to the one canonical `Organization` node (`Home.jsx`), read straight from
`CTAFooter.jsx`'s own `socials` array — not invented:
```json
"sameAs": [
  "https://www.instagram.com/quarterfold_printabilities/",
  "https://www.youtube.com/@quarterfoldprintabilities6000"
]
```
Both fetched live during verification: **200 OK** on both. LinkedIn and Facebook
are absent from the footer (the code comment there says so explicitly: *"LinkedIn +
Facebook removed per client"*) and are correspondingly absent here.

Also gave `Organization` a stable `@id`
(`https://quarterfoldltd.com/#organization`) and changed `WebSite.publisher`
from a second, disconnected `{"@type":"Organization","name":"..."}` stub to a
reference against that `@id` — lets Google merge the two into one entity
instead of two unlinked ones.

## Service/Product entities

Ten `Service` entities on the homepage, one per `WhatWePrint.jsx` category
("Content is LAW" per that file's own comment) — name/description read live
via the `homeWwp` i18n namespace (same pattern `Contact.jsx`'s `FAQPage` block
already uses, so the schema always matches whichever language is on screen),
plus one dedicated `Service` each on `/print-on-demand` and `/fulfilment`,
sourced from those pages' own SEO copy:

| Route | Service name | serviceType |
|---|---|---|
| `/` | Educational Book Printing, Children's Books, General Books, Trade Books, Learning Activity Kits, Counterbook and Stationery, Corporate/Banks/MNCs, Print on Demand, Religious Books, Packaging and Gifting | Book printing and manufacturing |
| `/print-on-demand` | Print on Demand | Print on demand book printing |
| `/fulfilment` | Warehousing & Fulfilment | Book warehousing, kitting and fulfilment |

No invented claims anywhere in these: no `areaServed` beyond what a category's
own line already states, no pricing (a quote-based B2B business has none to
declare), `serviceType` limited to the plain, obviously-true category of
business the whole site already describes itself as.

## FAQPage — confirmed unchanged

`/contact` carries `FAQPage` with **16/16** `Question`/`acceptedAnswer` pairs,
byte-identical in structure to before this lane. Per the claude-seo audit's
correction to our own prior recon (Google retired FAQ rich results entirely,
for all sites, on 2026-05-07 — a stricter, more recent supersession of the
Aug-2023 gov/health restriction our own earlier recon cited): **left as-is, no
new FAQPage added anywhere.**

## Deprecated schema types

**Confirmed independently, not just cited from the earlier audit.** Every
distinct `@type` currently in use, grepped directly from source:

```
Answer, BreadcrumbList, ContactPoint, FAQPage, ImageObject, ListItem,
NewsArticle, Organization, PostalAddress, Question, Service, WebSite
```

Cross-checked against claude-seo's deprecated list (`HowTo`,
`SpecialAnnouncement`, `CourseInfo`, `EstimatedSalary`, `LearningVideo`,
`ClaimReview`, `VehicleListing`, `Book Actions`, `Practice Problem`): **zero
overlap. Nothing to swap.**

## Article schema — gaps found and fixed

`author`, `publisher`, `datePublished`, and `dateModified` were already present
and correctly sourced from Sanity (`datePublished` from `publishedAt`,
`dateModified` from Sanity's own `_updatedAt` system field) — confirmed via the
prerendered output, e.g. `dateModified: "2026-07-22T16:27:51Z"`. Two real gaps
fixed:

- **No `BreadcrumbList`** on `/newsroom/<slug>` — the only route type on the
  site without one. Added `Home → Newsroom → <article title>`, reusing the
  exact `seo.breadcrumb.home`/`.newsroom` strings `Newsroom.jsx`'s own
  breadcrumb already renders (same `newsroom` i18n namespace) rather than new
  copy; position 3 is the article's own real, already-fetched title.
- **`publisher.logo` had no `width`/`height`.** Added the real, on-disk
  dimensions of `public/qfp/brand/qfp-logo.png` — `747×175` (confirmed via
  `sharp`'s own metadata read, not guessed). This is not Google's separately
  preferred 60×600 lockup ratio; no such alternate asset exists in the repo,
  and creating one was out of scope. Declaring the real file's actual size
  accurately is what "no invented facts" means here.

## BreadcrumbList — site-wide

Every route now carries a `BreadcrumbList` matching the real site hierarchy,
except the homepage itself (correctly omitted — it *is* position 1) and
`/legal/*`, `/about`, `/global-markets`, `/infrastructure`, `/newsroom`,
`/fulfilment`, `/contact`, `/print-on-demand`, which already had a correct
2-level `Home → Page` breadcrumb before this lane (verified, not re-touched).
The one gap — newsroom articles — is fixed above.

## `robots.txt` — already compliant, confirmed, unchanged

GPTBot, ClaudeBot, and PerplexityBot (this lane's three named examples) each
already have their own explicit `User-agent` block with `Allow: /`, alongside
13 other AI/answer-engine crawlers, the sitemap is declared, and every existing
rule is untouched. This already matches the lane's own stated requirement
("default to allowing all of them... declare the sitemap, keep the existing
rules") exactly — verified by direct re-read, no diff needed:

```
# Quarterfold Printabilities — https://quarterfoldltd.com
# All crawlers are welcome, including AI assistants and answer engines.

User-agent: *
Allow: /

# AI assistants and answer engines (explicitly welcomed)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: DuckAssistBot
Allow: /

Sitemap: https://quarterfoldltd.com/sitemap.xml
```

Confirmed reachable: `dist/robots.txt` present (copied verbatim from
`public/`), sitemap URL declared and — see below — that exact file exists and
is well-formed.

## Sitemap generation approach

New `scripts/generate-sitemap.mjs`, wired into `package.json`'s `build` script
the same unconditional way `prerender.mjs` already is:
```
"build": "vite build && node scripts/prerender.mjs && node scripts/generate-sitemap.mjs"
```
Writes `dist/sitemap.xml` directly (same pattern as `prerender.mjs` writing
into `dist/`), overwriting whatever `vite build` copied from `public/`.
`public/sitemap.xml` is left in place, unregenerated, purely as a `pnpm dev`
fallback — production only ever serves the build-time-generated
`dist/sitemap.xml`.

**`lastmod` — real, from two sources, never hand-typed:**
- Static/legal routes: the last real `git log` commit date on that route's own
  source file(s) (e.g. `/about` → `src/pages/OurStory.jsx`). The four
  `/legal/*` routes share one template (`LegalPage.jsx`) and one combined
  locale file (`legal.json`) keyed by `doc` — there's no separate
  per-document file to point at, so all four currently carry the same date
  (whichever of the two shared files was touched more recently). Stated as a
  known granularity limit, not hidden.
- Newsroom articles: Sanity's own `_updatedAt` field — the exact same field
  `NewsroomArticle.jsx`'s own `dateModified` JSON-LD already uses, so the
  sitemap and each article's structured data agree by construction.

**Sync guarantee for new articles:** `ARTICLE_QUERY` in the new script is the
identical visibility guard (`published == true && publishedAt <= now()`) as
`Newsroom.jsx`'s own index query and `prerender.mjs`'s
`discoverArticleRoutes()` — a live fetch against the same production Sanity
dataset both of those already prove correct, not a cached or hand-maintained
list. A newly published post appears in the very next `pnpm build` with zero
manual step, argued from the query matching two already-proven call sites
rather than by creating and deleting a disposable document in the live
production dataset (see the memory note on Newsroom Sanity prod state — this
queries real client content, not a sandbox).

**Generated `dist/sitemap.xml` (this build)** — 18 URLs, all canonical apex,
every one carries a real `lastmod`:

| URL | lastmod | Source |
|---|---|---|
| `/` | 2026-08-16 | git: `Home.jsx` |
| `/about` | 2026-08-14 | git: `OurStory.jsx` |
| `/global-markets` | 2026-08-12 | git: `GlobalMarkets.jsx` |
| `/print-on-demand` | 2026-07-29 | git: `PrintOnDemand.jsx` |
| `/contact` | 2026-08-09 | git: `Contact.jsx` |
| `/infrastructure` | 2026-07-30 | git: `InfrastructurePage.jsx` |
| `/fulfilment` | 2026-07-30 | git: `Fulfilment.jsx` |
| `/newsroom` | 2026-08-11 | git: `Newsroom.jsx` |
| `/legal/privacy`, `/cookies`, `/terms`, `/accessibility` | 2026-07-29 | git: `LegalPage.jsx` + `legal.json` (shared) |
| 6× `/newsroom/<slug>` | 2026-07-22 | Sanity `_updatedAt` (identical across all 6 — a real, independently-confirmed fact: the old sitemap's one batch date and each article's own `dateModified` JSON-LD already showed this same date, consistent with a bulk content migration on that day, not a bug in this script) |

## Verification

**JSON-LD dumped from the prerendered static HTML** (not the live DOM) for
every route, structurally validated (8-point checklist: `@context`,
non-deprecated `@type`, no placeholder text, absolute URLs, ISO 8601 dates,
plus per-type required-property checks and the NAP string compared
programmatically, not eyeballed):

```
Routes checked: 18 / Nodes checked: 38 / Errors: 0
```

Per-route types present:

| Route | JSON-LD types |
|---|---|
| `/` | Organization, WebSite, Service ×10 |
| `/about` | BreadcrumbList |
| `/global-markets` | BreadcrumbList |
| `/print-on-demand` | BreadcrumbList, Service |
| `/infrastructure` | BreadcrumbList |
| `/newsroom` | BreadcrumbList |
| `/fulfilment` | BreadcrumbList, Service |
| `/contact` | BreadcrumbList, FAQPage (16 Q&A) |
| `/legal/privacy`, `/cookies`, `/terms`, `/accessibility` | BreadcrumbList |
| 6× `/newsroom/<slug>` | NewsArticle, BreadcrumbList |
| `404.html` | (none — expected; NotFound emits no structured data) |

**`sameAs` URLs resolve:** Instagram `200`, YouTube `200` (fetched live).

**NAP match:** verified programmatically — schema `PostalAddress` fields
recomposed and string-compared against `CTAFooter.jsx`'s literal visible
address text. Exact match.

**Sitemap vs. route list:** 18 sitemap URLs vs. 18 prerendered routes — exact
1:1 match, zero missing, zero extra, all canonical apex (`https://quarterfoldltd.com/...`,
no `www`), zero missing `lastmod`.

**All 18 routes prerender correctly with schema intact:** full `pnpm build`
run after every commit — `18/18 routes prerendered successfully` each time,
confirmed by re-dumping and re-validating JSON-LD from the actual output files
each time, not assumed from the log line alone.

**No visual change:** every edit is confined to JSON-LD object literals (a
value passed to `<Seo jsonLd={...}>`, which only ever writes
`<script type="application/ld+json">` into `<head>`) plus two build scripts
and one `package.json` line. Confirmed directly — diffed every touched page
file and grepped out every line that wasn't a JSON-LD property, a comment, or
build tooling; zero JSX markup, className, or visible text changed in any of
`Home.jsx`, `PrintOnDemand.jsx`, `Fulfilment.jsx`, or `NewsroomArticle.jsx`.

**`pnpm audit:lhci`:** the Chrome-launcher issue flagged as a possibility in
this lane's own instructions did occur —
`Runtime error: CHROME_INTERSTITIAL_ERROR`, every audit category failing with
the same caught exception. Substituted with the direct checks above (the
structural JSON-LD validator, live `sameAs` fetches, and the git+Sanity
`lastmod` cross-checks), which is the fallback this lane explicitly
authorized.

## Files changed

- `src/pages/Home.jsx` — Organization NAP fix, `@id`, `sameAs`,
  `WebSite.publisher` `@id` reference, 10 `Service` entities.
- `src/pages/PrintOnDemand.jsx` — one `Service` entity.
- `src/pages/Fulfilment.jsx` — one `Service` entity.
- `src/pages/NewsroomArticle.jsx` — `BreadcrumbList`, `publisher.logo`
  width/height.
- `scripts/generate-sitemap.mjs` (new) — build-time sitemap generator.
- `package.json` — sitemap generator wired into the `build` script.
- `.gitignore` — carved out the same shipping exception already given to
  `prerender.mjs` for the new script (`scripts/*` is otherwise ignored).

Not touched, by design: `public/robots.txt` (already compliant),
`src/pages/Contact.jsx`'s FAQPage (left exactly as-is per this lane's own
instruction), `src/sections/CTAFooter.jsx` (registered-office legal strip —
confirmed untouched via `git diff`).

## Git status

```
6c9daa7 Fix Organization NAP mismatch; add sameAs, @id, and Service entities
ad59797 Add BreadcrumbList to newsroom articles; declare publisher.logo size
ed4037e Generate sitemap.xml at build time with real lastmod dates
```

Working tree clean apart from pre-existing, unrelated uncommitted changes
(`Contact.jsx`, `OurStory.css`, `PrintOnDemand.jsx` — present before this lane
started, untouched by this work — `PrintOnDemand.jsx` specifically needed a
one-line surgical revert-then-restore around the middle commit so that
pre-existing, unrelated `replyto: req.email` form-payload line didn't leak
into a schema commit; verified restored to its exact original state
afterward) and untracked files predating this lane.
