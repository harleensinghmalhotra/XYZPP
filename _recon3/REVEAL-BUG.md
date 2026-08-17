# REVEAL-BUG — Awards & Certifications render as a blank band

**Date:** 2026-07-29 · **Scope:** read-only recon. Nothing in `src/` or `public/` was modified. All artifacts (scripts, screenshots, JSON) live in `./_recon3/`. Analysis used a throwaway `vite` dev server (port 5199) and a `vite preview` production build (port 4173); the other lane's server on 5173 was left untouched.

---

## VERDICT (read this first)

- **The stated hypothesis — "heavy assets shift the layout, ScrollTrigger positions go stale, the reveal never fires" — is DISPROVED.** It is not the cause. When the band is blank, the layout is fully settled, the trigger positions are correct, and network throttling does not change anything.
- **Actual root cause — CONFIRMED with evidence:** the homepage's Lenis `SmoothScrollProvider` runs `ScrollTrigger.killAll()` in its unmount cleanup. When you clientside‑navigate **from the homepage** to `/about` or `/infrastructure`, the destination page's `Awards` and `Certifications` create their reveal triggers (and hide themselves with `autoAlpha: 0`) during React's layout phase, and then the *outgoing* homepage provider's cleanup fires `killAll()` a moment later and destroys those brand‑new triggers **before they can ever run**. The elements are stranded at `opacity:0; visibility:hidden` forever → blank band.
- **Measured failure rate (production build):** **10 / 10** blank on `/about`, **10 / 10** blank on `/infrastructure` when navigated to from the homepage. **36 / 36** across all conditions (normal + Slow 3G). From any *non‑homepage* page: **0 / 11**. On the dev server: **0 / 32** (dev hides the bug — see §Why dev looked fine).
- **One‑line recommendation:** Ship **Option A tonight** — delete the hide‑first reveal effect from both components so the elements are never hidden (guaranteed fix, costs only the scroll‑in fade). If you want to keep motion, **Option B2** (IntersectionObserver + visible‑by‑default, the pattern the rest of the site already uses) is equally safe. Do **not** ship a fix that keeps `autoAlpha:0` + GSAP and merely "tidies the timing."

---

## TASK 1 — The animation map

Two components, identical reveal pattern. Both register `gsap` + `ScrollTrigger`.

### `src/sections/Awards.jsx` (reveal at lines 66–78)
- **Initial state (hidden):** `gsap.set('.aw-head', {autoAlpha:0, y:16})` and `gsap.set('.plq', {autoAlpha:0, y:28})`. `autoAlpha:0` = **`opacity:0` + `visibility:hidden`**.
- **ScrollTrigger:** `{ trigger: root.current /* the #awards section */, start: 'top 72%', once: true }`. No `end`, no explicit `toggleActions`, **no markers**. The timeline fades/rises the header, then the 11 plaque cards with a 0.12s stagger; `.plq` gets `clearProps:'transform,opacity,visibility'` on completion (hands cards back to CSS for hover), `.aw-head` does not.
- **reduced‑motion:** `if (reduced) return` at the top of the effect → **nothing is ever hidden**; elements stay in their natural (visible) state.

### `src/sections/Certifications.jsx` (reveal at lines 167–180)
- **Initial state (hidden):** `gsap.set('.certs-title, .certs-sub, .certs-seal', {autoAlpha:0, y:18})` and `gsap.set('.cert-card', {autoAlpha:0, y:28})`.
- **ScrollTrigger:** `{ trigger: root.current /* #certifications */, start: 'top 68%', once: true }`. No `end`, no `toggleActions`, no markers. Timeline reveals seal → title → sub → the 5 cards (0.1s stagger); `.cert-card` gets `clearProps`.
- **reduced‑motion:** `if (reduced) return` → never hidden.

### `ScrollTrigger.refresh()`
- Called in **exactly one place**: `src/lib/smooth-scroll.jsx:38`, and **only inside the `prefersReduced()` branch**. Under normal motion it is **never called** after Lenis/images/fonts/globe/3D settle. There is no refresh after any async asset loads.

### Lazy / code‑split / Suspense
- Neither component is lazy‑loaded, code‑split, or Suspense‑wrapped. They are imported statically by every page that uses them.

### Per‑page differences
Same reveal code on every page. The only differences are decorative props and the scroll engine:

| Page | Order | Props | Scroll engine |
|------|-------|-------|---------------|
| Home (`Home.jsx`) | `<Certifications flatBottom />` … `<Awards />` | Certs: `flatBottom` | **Lenis** (`SmoothScrollProvider` wraps the whole route) |
| About (`OurStory.jsx`) | `<Awards />` `<Certifications flatTop />` | Certs: `flatTop` | native |
| Infrastructure (`InfrastructurePage.jsx`) | `<Certifications flatTop />` `<Awards />` | Certs: `flatTop` | native |

`flatTop`/`flatBottom` only toggle the cream/navy sweep‑arc SVGs — they have **no effect on the animation**. The reveal setup is byte‑identical across pages.

---

## TASK 2 — Reproduction (headed Chromium, 1536×743, DPR 1.25, normal motion)

Harness: `_recon3/repro.mjs` (dev) and `_recon3/repro2.mjs` (production). New browser context per iteration (cold cache), `Network.setCacheDisabled`, `reducedMotion:'no-preference'`. On each failure I read the computed style of the reveal targets.

### The decisive early finding: hard load self‑heals, soft nav does not
A `page.goto('/about')` (a **hard** load, = Ctrl+R) **never** fails, because ScrollTrigger auto‑refreshes on the window `load` event and there is no homepage provider unmounting alongside it. The bug only appears on a **client‑side (SPA) navigation** — which is why **Ctrl+R "fixes" it**. So the meaningful test is: load the homepage, then click a `<Link>` to `/about` (no reload).

### Results — production build (`vite preview`), homepage → target via the footer link

| Condition | Awards blank | Certs blank |
|-----------|-------------|-------------|
| `/about`, normal network, ×10 | **10 / 10** | **10 / 10** |
| `/infrastructure`, normal network, ×10 | **10 / 10** | **10 / 10** |
| `/about`, **Slow 3G**, ×8 | **8 / 8** | **8 / 8** |
| `/infrastructure`, **Slow 3G**, ×8 | **8 / 8** | **8 / 8** |
| **Total** | **36 / 36** | **36 / 36** |

### (d) Throttling — does slower loading make it worse?
**No.** Normal = 100%, Slow 3G = 100%. If the cause were slow layout settling, throttling would move the rate. It does not. This is direct evidence **against** the layout‑shift hypothesis.

### (e) Scroll speed — fast vs slow
No effect. The elements are already `opacity:0` before any scrolling; scrolling fast or slow to the section never reveals them because the trigger that would reveal them no longer exists.

### Computed style on a failure (production, `/about` from homepage)
Every reveal target **exists in the DOM with real box dimensions** but is fully hidden:

| Element | exists | opacity | visibility | box |
|---------|--------|---------|-----------|-----|
| `#awards .aw-head` | yes | **0** | **hidden** | 1060×87 |
| `#awards .plq` (card) | yes | **0** | **hidden** | 241×473 |
| `#certifications .certs-title` | yes | **0** | **hidden** | 1409×35 |
| `#certifications .cert-card` | yes | **0** | **hidden** | 267×280 |

This is the single data point the brief asked for: **the nodes are present and laid out; they are hidden by the animation's initial `autoAlpha:0`, not missing from the DOM.** So it is not a data‑fetch or render problem. (Screenshots: `_recon3/v2_about-footerBottom-normal_0_awards_HIDDEN.png` — a blank navy band with its corner light‑beams and bottom gold hairline but no cards; and `…_certifications_HIDDEN.png` — a blank cream band.)

### Dev server, same soft‑nav: 0 / 32
On the `vite` dev server the identical soft‑navigation produced **0 failures in 32 iterations** (`_recon3/repro-run.log`). Dev masks the bug (see §Why dev looked fine). This is worth flagging: a quick `pnpm dev` sanity check will look healthy while production is broken.

---

## TASK 3 — Instrumentation

Measured by reading `ScrollTrigger.getAll()` (via the already‑loaded module singleton) plus a per‑frame probe of section `offsetTop` and document height.

### Trigger start "at mount" vs the section's settled offsetTop → they MATCH
On the dev build (where I could read ST internals), immediately after the section mounts:

| Page | Trigger | start (computed) | section settled offsetTop | consistent? |
|------|---------|------------------|---------------------------|-------------|
| /about | `#awards` | 5528 | 6063 | 6063 − 5528 = 535 = 0.72 × 743 ✓ |
| /about | `#certifications` | 6263 | 6768 | 6768 − 6263 = 505 = 0.68 × 743 ✓ |
| /infra | `#awards` | 4489 | 5024 | 5024 − 4489 = 535 = 0.72 × 743 ✓ |
| /infra | `#certifications` | 3848 | 4354 | 4354 − 3848 = 506 ≈ 0.68 × 743 ✓ |

**The trigger start does not diverge from the section's real position — it is exact.** The premise of the hypothesis (stale, wrong start positions) is false here. The reveal math is correct; the reveal simply never gets to run.

### Document height at mount vs loaded
The document does grow massively during load — **743px (first paint) → 8894px (/about settled)**, **743 → 7620 (/infra)**. But the reveal triggers are created *after* this settles (or, on hard load, refreshed by the `load` event), so the positions come out correct anyway. The height change is real but is **not** the mechanism of this bug.

### The mechanism, captured
On the production build, the instant the destination section mounts (before any scroll), the probe shows: `scrollY=0`, `awardsOffsetTop=6063`, `docHeight=8894` — i.e. **fully settled** — yet the reveal targets already read `opacity:0/visibility:hidden` **and `ScrollTrigger.getAll()` no longer contains the `#awards`/`#certifications` triggers.** They were created and then destroyed. A stale‑position bug would leave the trigger *present* with `progress:0`; instead it is *absent*. That absence is the fingerprint of `killAll()`.

---

## TASK 4 — Other suspects, ruled in/out with evidence

- **Async data / data‑fetch problem — RULED OUT.** i18n is fully synchronous (`src/i18n.js` eager‑bundles every locale via `import.meta.glob({eager:true})` and inits with `resources` inline); the card lists are hardcoded arrays. The DOM nodes are always present (proven: `exists:true` with real dimensions on every failure). Award photos / cert logos are lazy `<img>`, but the card frames, text, seal and title are static and are the things going blank.
- **Overflow / transform / will‑change containing block — RULED OUT.** ScrollTrigger's computed start equals the section's real offsetTop to the pixel (Task 3 table). If an ancestor transform were distorting measurement, the numbers would not line up. They line up exactly.
- **A pinned ScrollTrigger above the sections — RULED OUT.** The About page's "Press Run" timeline (`JourneyTimeline.jsx`) is `position:sticky` (CSS), not a GSAP pin, and it exists **only on About**. The Infrastructure page has no such timeline yet fails at the identical 10/10 rate. A pinned‑trigger interaction cannot explain a bug that is present without the pin.
- **Homepage vs About/Infrastructure — this is the differentiator.** The bug is **referrer‑dependent**, not page‑dependent. Control run (`_recon3/repro3-control.mjs`, production):

  | Navigation | Blank |
  |------------|-------|
  | **`/` (homepage) → /about** | **4 / 4** |
  | `/contact` → /about | 0 / 4 |
  | `/infrastructure` → /about | 0 / 3 |
  | `/about` → /infrastructure | 0 / 3 |

  Only navigation **from the homepage** fails. The homepage is the only route that mounts `SmoothScrollProvider`, whose unmount cleanup calls `killAll()`. The **sections on the homepage itself are fine** (the provider stays mounted while you're on `/`; `killAll` only fires when you *leave*). So: not a "homepage version of the section" bug — it's a "leaving the homepage nukes the next page's triggers" bug.
- **More than one browser?** Only Chromium is installed in this environment (no Firefox/WebKit binaries). I did not install them for a tonight‑deploy. However, the mechanism is pure React effect‑ordering + the GSAP JS API — there is no browser‑specific rendering involved — so it will reproduce identically on every engine. The client already sees it on both Vercel and Hostinger, consistent with an engine‑independent code bug.

---

## Why hard‑reload fixes it, and why dev looked fine

- **Ctrl+R / hard load works** because loading `/about` directly does not unmount a `SmoothScrollProvider` alongside it — nothing calls `killAll()` after the triggers are created (and the window `load` event also refreshes ScrollTrigger). No race, no kill.
- **The dev server hides the bug** because of **React StrictMode** (`src/main.jsx`, dev‑only double‑invoke of effects). In dev, `Awards`/`Certifications` run their mount effect twice — create trigger, revert, **create again** — and the second creation lands *after* the homepage provider's `killAll()` has already fired, so the surviving trigger reveals normally. Production React does not double‑invoke, so the single set of triggers is killed. This is why it reproduces on Vercel/Hostinger (production) but a local `pnpm dev` looks clean.
- **Why "frequently," not "always":** it is **100% deterministic for the homepage → About/Infrastructure soft‑navigation path**, but users also arrive by direct URL, hard refresh, or by moving between inner pages — none of which trigger it. So in day‑to‑day use it shows up "often" rather than "every time."

### The precise sequence (React commit order)
1. Click a `<Link>` from `/` to `/about`. React commits the route swap.
2. **Layout‑effect phase (synchronous):** `Awards`/`Certifications` `useLayoutEffect` runs → `gsap.set(..., autoAlpha:0)` hides the elements and `ScrollTrigger.create(...)` registers the reveal triggers.
3. Browser paints — the sections are momentarily hidden (as intended, pre‑reveal).
4. **Passive‑effect phase (after paint):** the unmounting homepage `SmoothScrollProvider`'s `useEffect` cleanup runs → **`ScrollTrigger.killAll()`** (`smooth-scroll.jsx:62`) destroys every trigger, including the two just created.
5. Nothing is left to cross `start:'top 72%'`/`'top 68%'`. The elements stay `autoAlpha:0`. **Blank band, permanently.**

Because step 2 is a layout effect (runs first) and step 4 is a passive effect (runs after), the kill reliably lands *after* the create — hence 100% on that path.

---

## TASK 5 — Recommendation

**Root cause:** `src/lib/smooth-scroll.jsx:62` — the homepage Lenis provider's unmount cleanup calls the **global** `ScrollTrigger.killAll()`, which also kills the reveal triggers the incoming `/about` or `/infrastructure` page created moments earlier in the same SPA transition. Combined with the components' **hide‑first** design (`autoAlpha:0` set before the trigger runs), a killed trigger leaves the content invisible with no way back. The "heavy assets shift the layout" theory is not involved.

There are two independent places a fix can live: the **components** (what the brief asked about) or the **upstream `killAll`**. Both are given.

### OPTION A — the safe one: remove the reveal from both components
**Change:** In `Awards.jsx` delete the entire reveal `useLayoutEffect` (lines 66–78). In `Certifications.jsx` delete the reveal `useLayoutEffect` (lines 167–180). Nothing else changes; the JSX, CSS, cards and hover all stay.

**What is lost:** only the motion — the header + cards fading/rising in as you scroll to them. They will simply be present (exactly as they already render for `prefers-reduced-motion` users today, which is a shipping, approved state).

**Does it remove the failure mode completely?** **Yes — guaranteed, not "less likely."** The band is blank *only* because `gsap.set(autoAlpha:0)` hides the elements and the killed trigger never clears it. If nothing ever hides them, there is no hidden state for a killed/absent/mis‑timed trigger to strand. There is no timing left to lose. (Proven in principle by the reduced‑motion path and by every non‑homepage navigation already rendering these sections correctly.)

### OPTION B — the animated one: keep the reveal, make it robust
Keeping `autoAlpha:0` + a GSAP ScrollTrigger and merely "fixing the timing" is **not something I can guarantee** — any hide‑first reveal whose trigger can be killed, mis‑ordered, double‑mounted, or created against an unsettled layout is inherently fail‑*hidden*. I would not ship that for a same‑night deploy. Two ways to keep motion that I *can* stand behind:

- **B1 — fix the upstream kill (keeps the current GSAP reveal, one‑line change, not in these components):** in `smooth-scroll.jsx` stop calling the **global** `ScrollTrigger.killAll()` on unmount. Each homepage section already reverts its own `gsap.context` on unmount (the file's own comment says so), so the global kill is a "backstop" that is doing net harm. Removing it (or scoping it to only the homepage's own triggers) makes `/contact→/about` and `/`→`/about` behave the same — and the control run shows the reveal works fine when nothing kills it. **Caveat, stated honestly:** this fixes *this* cause, but the components remain hide‑first, so they stay theoretically vulnerable to any *future* global kill or effect‑ordering change. It also touches the homepage scroll engine (shared, higher‑blast‑radius) rather than the two components.

- **B2 — make the reveal fail‑safe (recommended if you want motion):** convert both reveals to the site's **existing** `[data-reveal]` pattern (`src/lib/alive.js`): the element is **visible by default in CSS**, an `IntersectionObserver` adds an `is-in` class to animate it in, and the observer is re‑armed on every route change by `SiteLayout`. This is **guaranteed fail‑safe** for the same reason as Option A — if the observer never runs (killed, mis‑timed, JS error), the content is still visible; the JS only *adds* motion, it never *removes* it. IntersectionObserver also doesn't cache scroll positions, so it is immune to the layout‑shift fragility as a bonus. This is more work than A (re‑expressing the stagger in CSS) but keeps the animation and matches how the rest of the site already reveals content.

### Blunt bottom line
- **Option A**: guaranteed, ~2‑line deletion per component, loses the scroll‑in motion. **Best for tonight.**
- **Option B1**: guaranteed for this cause, one line in the homepage engine, keeps the motion, but leaves the components fail‑hidden in principle and touches shared code.
- **Option B2**: guaranteed and keeps the motion, but is real work (port to IntersectionObserver + CSS). Best for after tonight.
- **Anything that keeps `autoAlpha:0` + GSAP and only "reorders/refreshes"**: still timing‑dependent, **not guaranteed** — do not ship it as the fix.

Given "I would rather lose an animation than ship an intermittent bug": **ship Option A now; schedule Option B2 if the motion is wanted back.**

---

## Evidence index (`_recon3/`)
- `repro.mjs`, `repro-run.log` — dev‑server matrix (0/32; shows hard‑load self‑heal + correct trigger positions).
- `repro2.mjs`, `repro2-run.log`, `repro2-results.json` — production build, homepage→inner soft‑nav (36/36 blank; exact computed styles).
- `repro3-control.mjs`, `repro3-run.log`, `repro3-control.json` — referrer control (homepage 4/4 blank; contact/inner 0/10 visible).
- `v2_*_HIDDEN.png` — screenshots of the blank navy Awards band and blank cream Certifications band.
