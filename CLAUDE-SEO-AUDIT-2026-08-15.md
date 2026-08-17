# Claude SEO (AgricIDaniel/claude-seo) Independent Audit
**Date:** 2026-08-15 · **Branch:** phase2-routing (untouched — git status confirmed identical at both ends, bottom of report) · **Tool:** [AgricIDaniel/claude-seo](https://github.com/AgricIDaniel/claude-seo) v2.2.4, installed manually per its own Windows instructions. No commits, no fixes.

---

## Part 0 — Install

**Source inspected before installing.** Cloned to a scratch directory outside the repo and read the README, `install.ps1`, `requirements.txt`, and `PRIVACY.md` before running anything: MIT-licensed, 14,221 stars / 2,068 forks, CI badge, pinned dependency versions with CVE-fix notes, no obfuscated code, no default telemetry, no default third-party API calls beyond the site being audited. `install.ps1` only writes to `%USERPROFILE%\.claude\skills\*` and `%USERPROFILE%\.claude\agents\*`, clones to a `%TEMP%` scratch dir it cleans up itself, and pins to release tag `v2.2.4` rather than `main`. Judged safe to run.

**Install path (per the repo's own README, "Windows (PowerShell)" section):**
```powershell
git clone --depth 1 https://github.com/AgricIDaniel/claude-seo.git
powershell -ExecutionPolicy Bypass -File claude-seo\install.ps1
```
This is the manual/repository-user path, explicitly **user-level**, not inside this project repo:
- Skills: `C:\Users\Harleen\.claude\skills\seo\` (main orchestrator + `references/`, `scripts/`, `schema/`, `bin/claude-seo` launcher) and one directory per sub-skill, e.g. `C:\Users\Harleen\.claude\skills\seo-technical\`, `seo-schema\`, etc.
- Agents: 18 files copied into `C:\Users\Harleen\.claude\agents\*.md`.
- An isolated Python 3.12 virtual environment + Playwright Chromium, created under the skill directory — confirmed via `claude-seo doctor --json` → `{"browser_ready": true, "mode": "manual", "ready": true}`.

**Nothing was installed inside this repository.** `git status` on `phase2-routing` before and after the entire install + audit is identical (verified below) — the skill lives entirely outside the project tree, exactly as instructed.

**Optional paid extensions — not installed/configured, no API keys available, as instructed:**

| Sub-skill / extension | Needs | Status here |
|---|---|---|
| `seo-dataforseo` | DataForSEO API key | Skill files present on disk (installer copies all extension skill folders unconditionally), but functionally inert — no credentials configured, not invoked |
| `seo-firecrawl` | Firecrawl API key | Same — present, inert, not invoked |
| `seo-ahrefs` | Ahrefs MCP + API key | Same |
| `seo-seranking` | SE Ranking API key | Same |
| `seo-profound` | Profound API key | Same |
| `seo-bing` (Bing Webmaster/IndexNow) | Bing Webmaster API key | Same |
| `seo-image-gen` (Banana/Gemini) | Google Generative Language API key | Same |

Beyond the two extensions the task named, this also surfaced a broader gap worth reporting: the **Google SEO API tier system** (`seo-google` sub-skill: PageSpeed Insights, CrUX, CrUX History, Search Console, GA4, Indexing API, Keyword Planner) requires **at minimum a Google API key at "Tier 0,"** which this environment also does not have. Scripts gated on this and not runnable here: `pagespeed_check.py`, `crux_history.py`, `gsc_query.py`, `gsc_inspect.py`, `ga4_report.py`, `indexing_notify.py`, `keyword_planner.py`, `nlp_analyze.py`, `youtube_search.py`. This means the `seo-google` sub-skill is effectively unavailable too, on the same "no keys" basis as DataForSEO/Firecrawl, even though it wasn't named in the task. Backlink-API scripts (`moz_api.py`, `bing_webmaster.py`) are likewise unconfigured and unused.

**A real, undocumented-in-the-task operational constraint discovered during the audit:** claude-seo's own network-fetching scripts (`sitemap_discovery.py`, `render_page.py`, `agent_ux_check.py`, `fetch_page.py`, `gbp_deprecation_lint.py`) refuse to target `127.0.0.1`/`localhost` — a deliberate, hard-coded SSRF-protection gate in `scripts/url_safety.py` (`"claude-seo never needs credentials in audit URLs"`), not a bug and not configurable via any flag or environment variable found in the script. Confirmed directly: pointing `sitemap_discovery.py` at `http://127.0.0.1:4319` returns `{"error": "Target must be a public HTTP or HTTPS URL"}`. **Consequence:** claude-seo's own bundled network tools could only be run directly against the live, public site. For the local production build (the task's primary target), I applied the same tool's file/stdin-based scoring scripts (`content_quality.py`, `content_verify.py`) to content fetched from the local build via my own direct HTTP/Playwright requests, and applied the rest of claude-seo's documented methodology (from its `SKILL.md`/`references/*.md` files) by hand against the local build's actual markup and content. This is disclosed here plainly rather than silently working around it.

---

## Part 1 — Its findings, in its own structure

Per the task, sub-skills run: **seo-technical, seo-schema, seo-content (E-E-A-T), seo-geo (GEO/AEO), seo-local, seo-hreflang (international)**, plus one bonus dimension its orchestrator would normally spawn in a full audit (**Agent-UX**, part of `seo-technical`'s "Agent-Friendly Pages" section) that neither of our own recons had checked at all.

**Route list audited** (16, exactly as specified): `/`, `/about`, `/global-markets`, `/print-on-demand`, `/infrastructure`, `/newsroom`, two articles (`/newsroom/printweek-power-100-2026`, `/newsroom/business-connect-print-industry`), `/fulfilment`, `/contact`, all 4 `/legal/*` pages, and the two unreachable `/educational-books` / `/trade-books`.

### seo-technical

#### Technical Score: 58/100
*(Heuristic per this skill's own weighting; JS Rendering and Indexability are the categories dragging the score down — see below.)*

| Category | Status | Score |
|---|---|---|
| Crawlability | warn | 70/100 |
| Indexability | fail | 25/100 |
| Security | warn | 55/100 |
| URL Structure | pass | 90/100 |
| Mobile | pass | 85/100 |
| Core Web Vitals | fail | 30/100 |
| Structured Data | warn | 65/100 |
| JS Rendering | fail | 10/100 |
| IndexNow | fail (unverified) | n/a |

**Crawlability.** `sitemap_discovery.py` run live: sitemap correctly declared in `robots.txt`, valid `urlset`, reachable at `https://quarterfoldltd.com/sitemap.xml`. But the same run also probed common alternate sitemap paths — `sitemap_index.xml`, `sitemap-index.xml`, `wp-sitemap.xml` — and every one of them returned **HTTP 200 with a DOCTYPE-bearing HTML document** (`"error": "DOCTYPE is not allowed in sitemap XML"`), i.e. the SPA shell, not a 404. This is the tool's own crawler-facing evidence of the soft-404 pattern. AI crawler access in `robots.txt` is exemplary (see GEO section).

**Indexability — fail.** Canonical tags are JS-injected only (absent from raw HTML on every route, verified via `render_page.py --mode never`). No hreflang (single-URL i18n toggle — expected, see International section). Two routes (`/educational-books`, `/trade-books`) are thin/duplicate by construction — they redirect client-side to the homepage and serve the homepage's own canonical, title, and JSON-LD.

**Security — warn.** Live headers (`curl -I https://quarterfoldltd.com/`):
```
Content-Security-Policy: upgrade-insecure-requests
```
That is the **only** security header present. No `Strict-Transport-Security` (HSTS), no `X-Content-Type-Options`, no `X-Frame-Options`, no `Referrer-Policy`. Per this skill's own caveat, "HTTPS is a confirmed but lightweight signal (affects <~1% of queries) ... don't over-weight security headers" — flagged as a real gap, not oversold as a ranking issue.

**URL Structure — pass.** Clean, hyphenated, no query-string content URLs. No redirect chains found beyond the client-side `/educational-books`→`/#wwp-educational` pattern (not a real HTTP redirect at all — a client `Navigate`, already flagged in our own recons).

**Mobile — pass.** Viewport meta present and correct; LHCI baseline (reused from `SEO-RECON-2026-08-15.md`) shows accessibility scores of 1.0 on all 4 tested routes.

**Core Web Vitals — fail.** Reused the existing LHCI baseline per the task's earlier instruction to build a fresh Lighthouse baseline was out of scope here (`pagespeed_check.py`/`crux_history.py` need a Google API key we don't have — see Part 0). LCP 5.4-10.0s on all 4 tested routes, 2-4x over this skill's own stated 2.5s "Good" threshold.

**Structured Data — warn.** See Schema section below.

**JS Rendering — fail (the dominant finding).** `render_page.py --mode never` vs `--mode always` against the live homepage, independently, without reference to our own prior findings:
- Raw (`--mode never`): `"is_spa": true`, `"extracted_text": null`, `"structured_data": {"block_count": 0}` — empty shell, generic static title/description, matches our own recon's finding exactly.
- Rendered (`--mode always`): real extracted text, real JSON-LD blocks populate.

Per this skill's own December-2025-JS-SEO-guidance section: *"Best practice: Serve critical SEO elements (canonical, meta robots, structured data, title, meta description) in the initial server-rendered HTML rather than relying on JavaScript injection."* — a direct, independent restatement of `SEO-RECON-2026-08-15.md`'s §1 finding and `SEO-ARCH-RECON-2026-08-15.md`'s entire premise.

**IndexNow — unverified.** No key-file naming convention is discoverable without knowing the actual key string; no IndexNow submission code found anywhere in the codebase. Reporting as "not implemented, not independently confirmable" rather than a hard claim.

#### Agent-Friendly Pages / Agent-UX (bonus — not in either prior recon)
`agent_ux_check.py` against the live homepage:
```json
{
  "html_findings": {"real_buttons": 17, "real_anchors": 37, "div_onclick_widgets": 0,
                     "semantic_landmarks": 45, "inputs_without_aria": 0, "inputs_without_label": 0},
  "score": 100, "issues": []
}
```
**Agent-UX Score: 100/100.** Zero `<div onclick>` anti-pattern widgets; all interactive elements are real `<button>`/`<a>` with proper semantics. This is a genuinely new, positive data point — it does **not** contradict `SEO-RECON-2026-08-15.md`'s separate finding that the nav's About/What-We-Print dropdown items are `<button onClick>` rather than `<a href>`: those buttons *are* semantically real (good accessibility, this score), they simply carry no crawlable `href` (an SEO-specific gap, a different axis entirely). The accessibility-tree snapshot component of this check did not return data (`"tree_present": false"`) — a tool limitation on this run, not a site defect.

---

### seo-schema

**Detected (live and local, identical — confirmed via `render_page.py --mode always` against `/` and `/contact` on both):**

| Route | JSON-LD types | Status per claude-seo's schema-types.md (June 2026) |
|---|---|---|
| `/`, `/educational-books`, `/trade-books` | `Organization`, `WebSite` | Active — recommend freely |
| `/about`, `/global-markets`, `/print-on-demand`, `/infrastructure`, `/newsroom`, `/fulfilment`, all `/legal/*` | `BreadcrumbList` | Active |
| `/contact` | `BreadcrumbList`, `FAQPage` | See below |
| Both newsroom articles | `NewsArticle` | Active |

**Validation checklist** (from `schema-types.md`'s 8-point list) applied to every block found: `@context` is `https://schema.org` everywhere (not `http`) ✅; all `@type`s valid and non-deprecated ✅; no placeholder text found ✅; URLs absolute ✅; dates ISO 8601 ✅ (confirmed on the `NewsArticle` block: `datePublished: "2026-06-15T09:00:00.000Z"`). **No validation errors found in any block** — this matches `SEO-RECON-2026-08-15.md`'s own conclusion exactly.

**Deprecated schema types currently in use: none.** Cross-checked every type above against claude-seo's full deprecated list (`HowTo`, `SpecialAnnouncement`, `CourseInfo`, `EstimatedSalary`, `LearningVideo`, `ClaimReview`, `VehicleListing`, `Book Actions`, `Practice Problem`) — zero overlap. Direct answer to the task's specific ask: **there is nothing to fix here.**

**A dated correction to our own prior recon, surfaced by this tool's more current reference data:** `SEO-RECON-2026-08-15.md` §2 described FAQPage as restricted "to a narrow set of authoritative government/health domains" since August 2023 and said it "remains directly useful for AI answer engines parsing the page for grounded Q&A." claude-seo's `schema-types.md` (dated 2026-06-21) states Google **retired FAQ rich results entirely, for all sites, on May 7, 2026** — a stricter, more recent supersession of the Aug 2023 restriction — and explicitly instructs: *"do not claim it lifts AI-citation probability or is used for claim verification"* and *"FAQPage AI-citation benefit is unconfirmed."* **This tool is right and our prior recon is out of date on this specific point** — see the Comparison section below for the full reconciliation. claude-seo's guidance: flag existing FAQPage at **Info priority** (not Critical, not worth removing), and use **QAPage** instead for any future genuine user-submitted Q&A page.

**Gaps, consistent with and extending `SEO-RECON-2026-08-15.md` §2:**
- No `sameAs` on the `Organization` block (confirmed again, independently, against the live site).
- No `geo` (`GeoCoordinates`) on the `PostalAddress`. claude-seo's reference adds a specific, previously-unstated precision requirement: **minimum 5 decimal places** when this is added.
- `WebSite.publisher` is a disconnected stub `Organization` object rather than an `@id` reference to the main Organization node — same finding as before, now cross-confirmed.
- No `Service`/`Product` entities anywhere — same finding as before.
- `NewsArticle.publisher.logo` `ImageObject` has no `width`/`height` — same finding as before.

---

### seo-content (E-E-A-T)

Applying Google's "Who / How / Why" test first, per claude-seo's own required sequence, before scoring sub-factors:

| Question | Assessment |
|---|---|
| **Who** created it? | Weak-to-moderate. The About page names the founder (Nilesh Dhankani) and tells a real origin story; the newsroom cites named third-party outlets (PrintWeek, Business Connect, Forbes India, ASSOCHAM) covering him. But there is no author byline system for any first-party content, and no `Person` schema anywhere despite named individuals existing in the visible content (About page team section). |
| **How** was it created? | Not disclosed anywhere, and — correctly, per this skill's own guidance — that's only a problem if a reader would reasonably ask. For a B2B manufacturer's marketing site (not YMYL, not a blog claiming personal expertise), this is a low-stakes gap. |
| **Why** does it exist? | Passes cleanly. The content is unambiguously "to help a specific buyer (procurement officers, publishers) evaluate us as a manufacturing partner," not search-click bait. No niche-entry-without-expertise or word-count-padding signals detected. |

**E-E-A-T Breakdown** (claude-seo's own weighting: Trust 30, Expertise 25, Authoritativeness 25, Experience 20 — its own model, not an equal split, "ordered to reflect Google's stated hierarchy: trust is most important"):

| Factor | Score | Key Signals |
|---|---|---|
| Experience | 12/20 | Real facility photos and a named, dated origin story (About page) are genuine first-hand signals. Weakened by zero visible author/process disclosure for any first-party claim, and by `content_verify.py`'s finding (below) that the site's core scale claims carry no nearby citation. |
| Expertise | 14/25 | Certifications (ISO 9001:2015, ISO/IEC 27001:2022, FSC, Sedex) are strong, verifiable expertise/trust signals and are already schema-eligible content the site isn't using as such. No named technical staff credentials beyond the founder. |
| Authoritativeness | 19/25 | The newsroom is doing real work here: six real, dated, third-party press/award mentions (PrintWeek twice, Business Connect, Forbes India, ASSOCHAM) is a genuinely strong signal for a B2B manufacturer — better than most sites this size. |
| Trustworthiness | 20/30 | HTTPS present; privacy/cookies/terms/accessibility policies all present and unusually detailed for a B2B site (DPDP Act 2023, GDPR, PIPEDA, CCPA references); physical address and phone/email visible. Weakened by the NAP inconsistency already flagged in `SEO-RECON-2026-08-15.md` §9 (Sanpada "Head Office" vs. Vashi "Registered Office" mismatch between the schema and the visible Contact page) and by the missing security headers above. |

**Content Quality Score, per-route** (`content_quality.py`, run against each route's actual rendered body text — a local heuristic scorer, no network call, no API key needed):

| Route | Overall Quality | Flags |
|---|---:|---|
| `/` | 97/100 | none |
| `/about` | 97/100 | none |
| `/global-markets` | 93/100 | none |
| `/print-on-demand` | 92/100 | none |
| `/infrastructure` | 98/100 | none |
| `/newsroom` | 92/100 | none |
| `/newsroom/printweek-power-100-2026` | 92/100 | none |
| `/newsroom/business-connect-print-industry` | 92/100 | none |
| `/fulfilment` | 90/100 | none |
| `/contact` | 96/100 | none |
| `/legal/privacy` | 87/100 | none |
| `/legal/cookies` | 89/100 | none |
| `/legal/terms` | 90/100 | none |
| `/legal/accessibility` | 93/100 | none |
| `/educational-books` (orphan) | 97/100 | none |
| `/trade-books` (orphan) | 97/100 | none |

Uniformly high, zero thin-content or AI-generated-pattern flags anywhere — a genuinely clean, positive result this tool measured that neither of our prior recons checked for at all.

**`content_verify.py` (claim + citation-gap detector) — a real gap our prior recons did not check:**

| Route | Quantitative claims detected | Uncited ratio |
|---|---:|---:|
| `/` | 1 | 100% |
| `/about` | 5 | 100% |
| `/infrastructure` | 3 | 100% |
| `/fulfilment` | 4 | 100% |
| `/newsroom` | 4 | 100% |
| Both articles | 2-3 each | 100% |
| `/educational-books`, `/trade-books` | 1 each | 100% |
| `/contact`, `/global-markets`, `/print-on-demand`, all `/legal/*` | 0 | n/a |

Every quantitative claim the site makes about its own scale — "75 million books," "6.5 million books per month," "25+ countries," "3 facilities," "800+ professionals" — is detected as carrying **no nearby citation or source attribution**. These are exactly the numbers a procurement officer evaluating a tender partner would want to verify. This is a genuine, tool-surfaced E-E-A-T/Expertise gap that neither `SEO-RECON-2026-08-15.md` nor `SEO-ARCH-RECON-2026-08-15.md` identified, because neither checked for citation-adjacency around factual claims.

---

### seo-geo (GEO/AEO)

**GEO Readiness Score: 61/100**

**AI Crawler Access Status.** Best-in-class among the three reports produced so far: `robots.txt` explicitly `Allow`s GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Amazonbot, Bytespider, CCBot, Meta-ExternalAgent, cohere-ai, DuckAssistBot — every crawler this skill's own reference table names, plus several it doesn't even list. No blocking anywhere.

**llms.txt Status: present** (`https://quarterfoldltd.com/llms.txt` → 200). Per this skill's own primary-source-grounded guidance, this carries **zero Google Search weight** ("Google Search ignores them... won't harm nor help") and Mueller separately called the discovery use-case "a dead end" — its only possible value is for non-Google AI crawlers. Correctly, neither this report nor our prior ones treat it as a lever to pull.

**Brand Mention Analysis (presence on Wikipedia, Reddit, YouTube, LinkedIn):** No Wikipedia or Reddit presence found. YouTube channel exists and is linked from the site footer (`youtube.com/@quarterfoldprintabilities6000`) — already flagged in `SEO-RECON-2026-08-15.md` as linked on-page but missing from `Organization.sameAs`. Per this skill's own headline statistic, **brand mentions correlate ~3x more strongly with AI-citation likelihood than backlinks**, and YouTube mentions are the single strongest correlate (~0.737) of the platforms tracked — this makes the missing `sameAs` link (a near-zero-effort fix) disproportionately valuable relative to its cost.

**Server-Side Rendering Check:** fail — see JS Rendering above; this is the same underlying defect scored from a different angle (AI crawlers do not execute JavaScript at all, full stop, so this is arguably the most severe framing of the finding, not a softer one).

**Passage-Level Citability — the metric the task specifically asked for.** See the dedicated table in Part 3.

---

### seo-local

**Business type detected: Brick-and-mortar** (physical address visible on `/contact` with Google Maps links, "Head Office"/"Unit 1/2/3" language) — but flagged here, honestly, before scoring: **this skill's entire framework is built for consumer, near-me, map-pack businesses** (its own industry-vertical list is Restaurant / Healthcare / Legal / Home Services / Real Estate / Automotive; none fit). Quarterfold sells via B2B tenders to Ministries of Education, publishers, and donor-funded programmes — buyers who do not search "book printer near me" or use Google Maps proximity search to find a national-scale supplier. Applying this skill's dimension weights mechanically would materially overstate the importance of some findings (GBP posts/photos, review velocity, the "18-day review rule," voice-search "near me" behavior) and understate others this business actually needs. Scored below with that caveat carried through explicitly, per dimension.

**Local SEO Score: 34/100** *(mechanically low — see the caveat above; this number should not be read the way it would be for a dentist or plumber)*

| Dimension | Weight | Score | Note |
|---|---:|---:|---|
| GBP Signals | 25% | Low | No GBP embed, place ID, or reviews widget detected on-page. Given the buyer isn't discovering QFP via map-pack search, this weight is likely too high for this business — but a GBP listing still matters for the knowledge-panel/entity-verification purpose `SEO-RECON-2026-08-15.md` §9 already raised. |
| Reviews & Reputation | 20% | Low | No visible Google review count/rating anywhere on-site. Largely inapplicable — B2B tender buyers don't select suppliers by star rating — but zero reviews is also just... zero reviews, which costs nothing to note. |
| Local On-Page SEO | 20% | Partial | No city+service keyword pattern in title/H1 (not how this business's buyers search, so not a real gap); NAP is visible; dedicated "service pages" exist in spirit (`/print-on-demand`, `/infrastructure`, `/fulfilment`) even though this skill's checklist is written for "plumbing," "roofing," etc. |
| NAP Consistency & Citations | 15% | Low-Partial | **This is the one dimension where the generic framework and this business's real needs fully align.** Confirms, independently, the exact NAP mismatch `SEO-RECON-2026-08-15.md` §9 already found: the Organization JSON-LD address (Vashi, the registered/legal office) does not match the Contact page's visible "Head Office" address (Sanpada). No Tier-1 citation presence (Google Business Profile, Yelp, BBB, Facebook business page) detectable from the page. |
| Local Schema Markup | 10% | Partial | `Organization` present but missing `geo` (flagged above); no `LocalBusiness` subtype used at all, though none of this skill's industry-specific subtypes (Restaurant, MedicalClinic, LegalService, AutoDealer, etc.) fit a manufacturer either — plain `Organization` (as used) or a generic `LocalBusiness` layered with `geo`/`openingHoursSpecification` are the only two options that make sense here, exactly the judgment call `SEO-RECON-2026-08-15.md` §2 already flagged. |
| Local Link & Authority Signals | 10% | Partial | No Chamber of Commerce/BBB signals detected. The newsroom's real press/award coverage (PrintWeek, Forbes India, ASSOCHAM) is a genuine authority signal this dimension's checklist doesn't have a slot for, since it's written for "local news mentions," not national trade-press recognition — another instance of the framework not quite fitting this business.

**Limitations disclaimer** (this skill's own required output section, reproduced honestly): this analysis could not assess geo-grid ranking, Domain Authority, comprehensive backlinks, GBP Insights data, or real-time local-pack position (no DataForSEO/paid tools available). For this specific business, several of those gaps don't matter much even if the tools existed — a B2B tender-sales manufacturer isn't fighting for local-pack position in the first place.

---

### seo-hreflang (International)

**Hreflang Validation Report**

#### Summary
- Total pages scanned: 16
- Language variants detected via URL/hreflang: **0** (the site serves EN/FR/ES via an in-app `localStorage` toggle at a single URL per page — no separate URLs, no hreflang tags anywhere in source or rendered output, confirmed via `render_page.py`)
- Issues found: 0 Critical / 0 High / 0 Medium / 0 Low, because there is no hreflang implementation to have errors in

Per this skill's own error-handling table for exactly this scenario ("No hreflang tags found"): *"Report the absence. Check for other internationalization signals (subdirectories, subdomains, ccTLDs) and recommend the appropriate hreflang implementation method."* None of subdirectories/subdomains/ccTLDs are present either — confirming the single-URL-toggle architecture `SEO-ARCH-RECON-2026-08-15.md` §1 already fully characterized.

**A genuine scope difference worth naming plainly, not a factual disagreement:** this sub-skill's job is technical hreflang validation and generation — it does not carry a cost/benefit framework for *whether a business should adopt per-language URLs in the first place*. Left to its own defaults, its natural next step for this scenario is "recommend the appropriate hreflang implementation method." `SEO-ARCH-RECON-2026-08-15.md` §7 went further and did the actual trade-off analysis this site needs: a fresh crawl arrives with no stored language preference, so Google indexes the English default regardless of what hreflang infrastructure exists, meaning per-language URLs are a precondition for FR/ES organic visibility at all, not a small technical add-on. Both are correct on their own terms; ours is the more useful analysis for the actual decision on the table, because it's scoped to *this* site's architecture rather than to hreflang validation in general.

---

## Part 2 — Comparison

### What claude-seo found that our two recons missed

1. **The `www.quarterfoldltd.com` redirect status — this task resolved it, not claude-seo directly, but the audit process (running the tool's own network checks against the live domain, which the SSRF gate forced) is what prompted checking it.** `curl -I https://www.quarterfoldltd.com/` returns `200 OK` directly — **confirmed: there is no redirect to the apex domain.** Both `SEO-RECON-2026-08-15.md` and `SEO-ARCH-RECON-2026-08-15.md` had flagged this as "unverified" in their UNCERTAIN sections. It is now a confirmed, real duplicate-hostname/canonicalization risk, not a hypothetical one.
2. **Uncited quantitative claims** (`content_verify.py`): every scale claim on the site (75M books/year, 6.5M/month, 25+ countries, 3 facilities) is unaccompanied by a nearby citation or source, across every route where such a claim appears. A real Expertise/Trustworthiness gap neither prior recon checked for.
3. **Agent-UX / semantic-HTML score: 100/100** on the live homepage — a genuinely new, positive dimension (real buttons/anchors, zero `<div onclick>` anti-patterns) that neither prior recon measured at all.
4. **Missing security response headers** (no HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) — not checked in either prior recon.
5. **Soft-200 behavior on guessed sitemap paths** (`sitemap_index.xml`, `wp-sitemap.xml` etc. all return 200 with the SPA shell) — an independent, tool-generated data point corroborating (not duplicating) the soft-404 finding already central to `SEO-ARCH-RECON-2026-08-15.md`.
6. **The FAQPage rich-result timeline update** (full retirement May 7, 2026, not just the Aug 2023 gov/health restriction) — see the disagreement section below; this is a correction, and claude-seo's data is the more current of the two.
7. **The exact word-count deficit on the site's best citability candidate** (the Contact FAQ's "large printing projects" answer, at 86 words against a 134-167 target) — a specific, actionable number neither prior recon produced because neither was scoring against this metric.

### What our two recons found that claude-seo's own framework did not surface on its own

1. **The two fully-built, completely orphaned pages** (`EducationalBooks.jsx`, `TradeBooks.jsx` — 278 and 393 lines of real, unrouted, unlinked, SEO-instrumented code) — `SEO-RECON-2026-08-15.md` §3/§4's single strongest finding. claude-seo has no code-inspection capability at all; it only ever sees what a URL serves, so it could never discover dead code sitting in the source tree that no route or link exposes. This is a category of finding entirely outside its methodology, not something it checked and missed.
2. **The full prerendering/architecture decision work** in `SEO-ARCH-RECON-2026-08-15.md` — actually building and testing vite-react-ssg, a hand-rolled Playwright prerenderer, a packaged prerender plugin, route-based code-splitting, and a real Apache `.htaccess` verified against a real, temporarily-installed Apache server. claude-seo diagnoses "this is a JS-only SPA, fix it" (correctly, and independently, per Part 1 above) but has no equivalent to actually spiking and proving out *which* fix is viable for this specific codebase's specific constraints (GSAP ScrollTrigger at module scope, Sanity's `useEffect`-only fetch pattern, `Seo.jsx`'s imperative DOM-based head management). This is a depth difference, not a factual one: claude-seo correctly identifies the disease, our second recon did the surgery.
3. **The button-vs-anchor internal linking analysis** (`SiteNav.jsx`'s dropdown items being `<button onClick>` rather than `<a href>`, meaning they carry no crawlable link even though they render correctly) — `agent_ux_check.py` confirms the buttons are accessibility-correct (100/100) but has no check for "is this specific interactive element also supposed to be a crawlable hyperlink." Different question, same elements.
4. **Git-history and commit-provenance findings** — e.g., that the Contact page's FAQPage schema is committed (not part of the session's uncommitted diff), confirmed via `git show HEAD:...`. claude-seo has no git access at all; everything it reports is inferred from the live/rendered page alone.
5. **The precise heading-hierarchy inconsistency** (the same four-item trust-badge block rendered as H4 on the homepage but H3 on an identical block on `/global-markets`) — a cross-page structural comparison that requires diffing two pages' DOM trees against each other, which claude-seo's per-page analysis model doesn't do.

### Disagreements — resolved

| Point | `SEO-RECON-2026-08-15.md` said | claude-seo says | Verdict |
|---|---|---|---|
| FAQPage rich-result status | Restricted to gov/health domains since **Aug 2023**; "remains directly useful for AI answer engines parsing the page for grounded Q&A" | Retired **entirely, for all sites, May 7, 2026** (supersedes the Aug 2023 restriction); explicitly "do not claim it lifts AI-citation probability... unconfirmed" | **claude-seo is right; our prior recon is dated.** Its reference file carries an explicit update timestamp (2026-06-21) newer than the underlying fact it documents (2026-05-07), while our recon relied on the older, superseded restriction and stated the AI-citation benefit as more certain than Google's own current guidance supports. Practical impact is small either way (both agree: don't remove existing FAQPage, don't add new FAQPage for Google SERP benefit) — the correction is about *degree of confidence claimed*, not the recommended action. |
| `www` redirect | Flagged as unverified in both our recons | N/A directly, but the audit process resolved it | Not a disagreement — a gap both our recons correctly flagged as needing verification, now closed with evidence (see above). |
| International SEO recommendation depth | Full cost/benefit analysis of per-language URLs given this site's `localStorage`-based toggle | Generic "no hreflang found, here's how to implement it" | Not a factual disagreement — a scope difference. Ours is more useful for the decision this specific site actually faces. |

No point was found where the two genuinely contradict each other on a verifiable fact (the FAQPage item is a currency gap, not a contradiction — both were accurate as of when each was written).

---

## Part 3 — Citability scoring (134-167 word self-contained answer blocks)

Per `seo-geo`'s own criteria, scored against actual rendered page text (local build), reasoning through self-containment, quotability, and specific-fact density rather than word count alone:

| Route | Best candidate passage | Words | Verdict |
|---|---|---:|---|
| `/` | Hero line: "Quarterfold prints 75 million books every year... exports to 25+ countries" | ~40, wrapped in "Oh yes!... WOW!... What?... Yes!" framing | **Weak.** Real facts, unquotable style — an AI system extracting this would have to strip the exclamatory scaffolding, which is exactly the kind of passage the "weak signals: vague, general statements" / needs a plain-declarative rewrite category describes. Quick fix: a companion plain-prose sentence stating the same facts. |
| `/about` | Origin story opening ("In 2014, Quarterfold Printabilities began with a single order of 50,000 copies...") | ~45 | **Strong style, short of target length.** The single best-written passage on the site for citability — specific, attributed to a real year, self-contained. Needs ~90 more words of the same register to reach 134-167 and become a complete, standalone-citable block. |
| `/global-markets` | "From our facilities in Navi Mumbai, strategically located just 45 minutes from JNPT Port..." | ~40 | **Strong style, short.** Same pattern as About — good declarative facts, needs length. Constrained by this being the site's overall thinnest page (454 words). |
| `/print-on-demand` | No single declarative answer-block found; content is UI-configurator copy (step labels, option names) | n/a | **Weak — no citable passage exists.** This page needs a genuine descriptive paragraph, not just interface labels, to have anything an AI system could quote. |
| `/infrastructure` | Stat tiles ("300,000 sq. ft. / 3 facilities / 800+ professionals / 75M+ books/year") | n/a (fragment, not prose) | **Weak as rendered, strong as raw material.** Highly fact-dense but structured as UI stat-tiles, not sentences — text extraction returns space-separated fragments, not a quotable sentence. Converting these same four facts into one plain paragraph would likely be the single highest-value citability fix on the site, given the facts are already exactly right. |
| `/fulfilment` | "Print, pack, warehouse, ship: your books handled under one roof until they reach theirs." | ~15 | **Good tagline, too short and too abstract** to serve as an answer block on its own. |
| `/contact` (FAQ: "Can Quarterfold handle large printing projects?") | Full answer, quoted in `SEO-RECON-2026-08-15.md` §2 | **86** | **Closest to the target on the entire site.** Specific numbers (6.5M/month, 3 facilities, 75M+/year, 25+ countries), self-contained, direct-answer format — needs roughly 50 more words of the same register to land inside 134-167. This is the single most actionable, lowest-effort citability fix available: expand one existing, already well-written FAQ answer rather than writing new content from scratch. |
| `/contact` (FAQ: "Do you provide complete fulfillment...") | Second candidate | **58** | Same pattern, further from target, same fix. |
| `/newsroom/printweek-power-100-2026` | Opening two sentences ("...has been named to PrintWeek India's Power 100 for 2026... PrintWeek profiled the recognition as an 'education print scale-up.' In FY26 the company grew about 15%...") | ~65-70 | **Best style on the site** — third-party attribution ("PrintWeek profiled..."), specific figures ("grew about 15%," "INR 25 crore"), news-report directness. Needs modest expansion to hit the target range; the raw material is already excellent. |
| `/newsroom/business-connect-print-industry` | Similar opening, attributed to Business Connect India | ~60 | Same pattern as above. |
| All `/legal/*` pages | No candidate — and correctly so; these pages exist for compliance, not AI citation, and shouldn't be optimized for this metric | n/a | Not applicable by design. |
| `/educational-books`, `/trade-books` (orphans) | Same hero content as `/` | n/a | Moot until/unless these pages are relinked — see `SEO-RECON-2026-08-15.md` §3/§4. |

**Pattern across the whole site:** the underlying facts are consistently good (specific numbers, real dates, real third-party attribution) — the citability gap is almost entirely a **framing and length** problem, not a content-substance problem. The two highest-leverage, lowest-effort fixes: (1) expand the Contact FAQ's "large printing projects" answer from 86 to ~150 words, and (2) turn the Infrastructure page's four stat-tiles into one plain-prose paragraph carrying the same four numbers.

---

## Part 4 — Buckets

### (a) Fixable in code
- Convert the `/infrastructure` stat-tile facts into one plain-prose citable paragraph (Part 3).
- Expand the Contact FAQ's two strongest answers to the 134-167 word range (Part 3) — content edit, not a code change per se, but ships via the same file.
- Rewrite the homepage hero's factual claims (75M books/year, 25+ countries) into a plain declarative companion sentence alongside the existing "Oh yes!/WOW!" stylized copy, so both the marketing voice and a citable, quotable fact-block coexist.
- Add `sameAs` to the `Organization` JSON-LD (Instagram + YouTube) — already flagged in `SEO-RECON-2026-08-15.md`, reinforced here by the GEO finding that YouTube mentions are the single strongest brand-mention correlate with AI-citation likelihood of any platform this tool tracks.
- Add `geo` (GeoCoordinates, 5+ decimal places) to the address in `Organization`/whichever schema wins the NAP-consistency decision.
- Add basic security response headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) at the hosting/server-config layer.
- Everything already itemized in `SEO-RECON-2026-08-15.md` §10(a) and `SEO-ARCH-RECON-2026-08-15.md` §6 stands; this audit adds to that list rather than replacing it.

### (b) Needs client content
- Author credentials / named-staff expertise signals beyond the founder (Expertise sub-score gap).
- A citation or sourcing mechanism for the site's own scale claims (annual audited production figures, a linked case study, a client testimonial with specifics) — directly addresses the `content_verify.py` finding.
- A decision on which schema type (`Organization` vs. a `LocalBusiness`-family type) best represents the business, now that claude-seo's own reference confirms neither the generic nor any industry-specific `LocalBusiness` subtype cleanly fits a B2B manufacturer — this is a judgment call for the client/agency to make, not something either tool can resolve unilaterally.

### (c) Needs client off-site action
- **Confirm and fix the `www.quarterfoldltd.com` non-redirect** — now confirmed real, not hypothetical. This is a DNS/hosting-level fix (redirect `www` → apex, or vice versa, and pick one canonical form) that needs to happen at the Hostinger/DNS layer, outside this codebase.
- Resolve the security-header gap at the server/CDN configuration layer if not achievable via `.htaccess` alone.
- Everything already itemized in `SEO-RECON-2026-08-15.md` §10(c) and `SEO-ARCH-RECON-2026-08-15.md`'s recommendation section stands.

---

## Git status — start and end (identical, confirmed)
```
Branch: phase2-routing
HEAD: ad22c47e3bc5c8f5fe91770903b07c8180cd14d2 "Fix facility deck spec-list row alignment on mobile"

 M src/pages/Contact.jsx
 M src/pages/OurStory.css
 M src/pages/PrintOnDemand.jsx
?? .lighthouseci/  ?? CONTENT-RECON-2026-08-11.md  ?? "FINAL ASSETS ARE HERE.zip"  ?? FINAL-FIX-PLAN-2026-08-10.md
?? MOBILE-RECON-2026-08-09.md  ?? MOBILE-UX-RECON-2026-08-09.md  ?? "NEW QFP AV.mp4"  ?? PA11Y-AUDIT-2026-08-10.md
?? RECON-2026-08-09.md  ?? SEO-ARCH-RECON-2026-08-15.md  ?? SEO-RECON-2026-08-15.md
?? CLAUDE-SEO-AUDIT-2026-08-15.md   ← this report, new, uncommitted
?? "THE FINAL DESKTOP WEBSITE CHANGE/"  ?? UNLIGHTHOUSE-AUDIT-2026-08-10.md
?? "WhatsApp Image 2026-07-29 at 1.12.52 PM.jpeg"
?? _assets-in/ _assets-in2/ _lane1/…_lane7/ _recon/ _recon2/ _recon3/
?? drive-download-20260728T032950Z-1-001.zip  ?? site.zip
```
Confirmed identical to the state at the start of this task except for this one new file. No commits made. All temporary fetch/scoring scripts and intermediate JSON were written to the session scratchpad directory (outside the repo) and to the repo root only transiently, then deleted before this report was written — verified via `git status` showing no stray files.

**Machine state note:** claude-seo itself remains installed at `C:\Users\Harleen\.claude\skills\seo*` and `C:\Users\Harleen\.claude\agents\*` — this is the intended, requested outcome (a user-level Claude Code skill install, explicitly asked for, not scoped to this repo). It is fully removable at any time via the repo's own `uninstall.ps1` if no longer wanted; it was not asked to be removed, so it was left in place.

---

## UNCERTAIN
- Whether claude-seo's own orchestrator, run live via `/seo audit <url>` inside an interactive Claude Code session with slash-command support, would produce materially different output than this manual, script-by-script execution of the same underlying methodology — the parallel-subagent-delegation and automatic-PDF-report layers of its design were not exercised here, since this environment only exposed Bash/file-tool access to the installed skill files and scripts, not live `/seo` slash-command dispatch. The findings above come from actually running its bundled Python tools and applying its documented scoring frameworks by hand, which is a faithful but not identical execution path to its intended one.
- The Agent-UX and schema checks were run against the **live** (older-deploy) homepage/contact page only, on the reasoning that the underlying markup (SiteNav's button-based dropdown, the FAQPage schema) predates this session's own uncommitted changes and is very likely identical on the local build — but this was not independently re-verified against local for every single one of those specific checks, only for schema (which was independently re-confirmed local-vs-live and found identical).
- The E-E-A-T and Local SEO numeric scores (34/100, and the E-E-A-T sub-scores) are this report's own reasoned application of claude-seo's documented scoring rubric to known site content — not the output of a script, since no such script exists for these two dimensions (they're designed to be scored by an LLM reading the page against the checklist, which is what was done here) — treat the specific numbers as illustrative of severity/direction, not as a precise, independently reproducible measurement the way the `content_quality.py`/`content_verify.py` numbers are.
- Whether the live site's Sanity-fetched newsroom content and the local build's newsroom content are identical beyond the two articles spot-checked — not exhaustively diffed across all six published posts.
