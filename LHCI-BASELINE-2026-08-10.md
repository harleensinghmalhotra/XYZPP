# Lighthouse CI — Local Regression Gate (baseline 2026-08-10)

A permanent, local-only regression gate. One command — `pnpm audit:lhci` — builds the production bundle, serves the preview, runs Lighthouse **3× per URL** (mobile, throttled), and **fails the command (exit 1)** if any page regresses below today's numbers. No CI server, no GitHub Actions, no dashboards.

**Committed in this change (exactly four files):** `lighthouserc.json`, the `audit:lhci` script in `package.json`, the `@lhci/cli` devDependency (+ `pnpm-lock.yaml`), and this report.

- **Tool:** `@lhci/cli` **0.15.1** (bundles Lighthouse **12.6.1**), system **Chrome 151.0.7922.76**.
- **Gate is GREEN on the current `phase2-routing` code** — verified on two clean runs (exit 0). The tripwire test below proves it goes RED on a real regression.

---

## Emulation & throttling (exact settings)

Lighthouse's **default mobile** configuration — no overrides in the config — read from each run's `configSettings`:

| Setting | Value |
|---|---|
| `formFactor` | **mobile** |
| `screenEmulation` | **412 × 823, deviceScaleFactor 1.75, mobile: true** |
| `throttlingMethod` | **`simulate`** (Lantern) |
| network throttling | **rttMs 150, downlink 1,474.56 Kbps, uplink 675 Kbps, requestLatency 562.5 ms** (Lighthouse "mobile Slow-4G") |
| **`cpuSlowdownMultiplier`** | **4** |

> Note: this is the *real* Lighthouse mobile preset with **4× CPU throttling**, so scores here run **lower** than the Unlighthouse sweep from earlier today (which used a custom profile with `cpuSlowdownMultiplier: 1`). The two are not directly comparable — this gate's baseline is captured from LHCI's own runs, below.

**How the baseline was captured:** first ran LHCI with **no assertions** to record today's medians, then set every threshold from those actual numbers (never from aspirations).

---

## Runtime & the URL cut

A full run over the **8** requested URLs took **748 s (~12.5 min)** — over the ~10-minute budget. Per the runtime rule, the gate list was **halved to the 4 heaviest pages by measured payload**. A 4-URL run takes **~420–460 s (~7–7.7 min)**.

**Ranking by total byte weight (median), heaviest first — the top 4 are gated:**

| Rank | URL | Bytes (KiB) | Gated? |
|--:|---|--:|:--:|
| 1 | `/` | 2,614 | ✅ |
| 2 | `/fulfilment` | 2,404 | ✅ |
| 3 | `/infrastructure` | 1,765 | ✅ |
| 4 | `/contact` | 944 | ✅ |
| 5 | `/about` | 844 | — (measured, not gated) |
| 6 | `/newsroom` | 703 | — |
| 7 | `/global-markets` | 556 | — |
| 8 | `/print-on-demand` | 556 | — |

The four heaviest also happen to be the four slowest (worst LCP/Speed-Index), so the gate watches the pages most likely to regress. Legal pages and newsroom articles were already excluded by scope (low churn).

---

## Baseline numbers (median of 3 runs) — all 8 measured, 4 gated

Captured from the no-assertions baseline run. Scores are 0–100; CWV are the median metric values.

| URL | Perf | A11y | BP | SEO | LCP | CLS | TBT | FCP | Speed Idx | Bytes | **Gated** |
|---|:--:|:--:|:--:|:--:|--:|--:|--:|--:|--:|--:|:--:|
| `/` | **50** | 100 | 100 | 100 | 10,996 ms | 0 | 352 ms | 4,624 ms | 8,260 ms | 2,614 KiB | ✅ |
| `/fulfilment` | **58** | 100 | 100 | 100 | 8,344 ms | 0 | 139 ms | 4,421 ms | 7,641 ms | 2,404 KiB | ✅ |
| `/infrastructure` | **61** | 98 | 100 | 100 | 8,261 ms | 0 | 68 ms | 4,427 ms | 6,467 ms | 1,765 KiB | ✅ |
| `/contact` | **65** | 100 | 100 | 100 | 5,469 ms | 0 | 124 ms | 4,411 ms | 5,941 ms | 944 KiB | ✅ |
| `/about` | 65 | 100 | 100 | 100 | 5,373 ms | 0 | 138 ms | 4,555 ms | 5,803 ms | 844 KiB | — |
| `/newsroom` | 69 | 98 | 100 | 100 | 5,068 ms | 0 | 22 ms | 4,412 ms | 5,525 ms | 703 KiB | — |
| `/global-markets` | 71 | 100 | 100 | 100 | 4,557 ms | 0 | 81 ms | 4,483 ms | 5,152 ms | 556 KiB | — |
| `/print-on-demand` | 69 | 96 | 100 | 100 | 4,552 ms | 0 | 136 ms | 4,490 ms | 5,765 ms | 556 KiB | — |

**Two facts that shaped the hard assertions:** every gated URL has **CLS = 0** and **Best-Practices / SEO = 100** today, and the `viewport` + `target-size` (tap-target) audits **pass (score 1)** on every run. So the "must never regress" gates below all start comfortably green. (Run-to-run drift is small: a confirmation run reproduced `/` 51, `/fulfilment` 56, `/infrastructure` 60, `/contact` 62 — all still above their gates.)

---

## The assertions (the gate) — every threshold and its reasoning

Set in `lighthouserc.json` via `assert.assertMatrix` (per-URL). **All assertions use `aggregationMethod: "median"`** — a page fails only if the *median* of its 3 runs crosses the line, so single-run noise never cries wolf; it takes a genuine regression (≥2 of 3 runs) to trip.

### Per-URL category minimums (set a few points below today's median)

| URL | Perf median → gate | A11y median → gate | BP → gate | SEO → gate |
|---|---|---|---|---|
| `/` | 50 → **0.42** (−8; noisiest page) | 100 → **0.95** | 100 → 0.95 | 100 → 0.95 |
| `/fulfilment` | 58 → **0.50** (−8) | 100 → **0.95** | 100 → 0.95 | 100 → 0.95 |
| `/infrastructure` | 61 → **0.54** (−7) | 98 → **0.93** | 100 → 0.95 | 100 → 0.95 |
| `/contact` | 65 → **0.58** (−7) | 100 → **0.95** | 100 → 0.95 | 100 → 0.95 |

Reasoning: performance is the only category that moves with throttling variance, so it gets the widest buffer (~7–8 points ≈ ~12%). Accessibility/BP/SEO are deterministic (no run-to-run variance), so a −5-point buffer is plenty; `/infrastructure` is gated at 0.93 because its median is 98 (a stable `heading-order` warning keeps it under 100 — see the Pa11y/Unlighthouse reports).

### Hard assertions on things we specifically fixed and must never regress (every gated URL)

| Assertion (audit) | Gate | Today's baseline | Reasoning |
|---|---|---|---|
| `cumulative-layout-shift` | **maxNumericValue 0.02** | 0 on all 4 | The CLS work must hold. Median 0 today; a regression to the newsroom-article-style 0.29 shift would trip it. |
| `viewport` | **minScore 1** | 1 on all 4 | "No viewport errors" — the responsive `<meta viewport>` must stay valid. |
| `target-size` (tap targets) | **minScore 1** | 1 (binary pass) on all 4 | The tap-target audit must keep passing on mobile. |
| `total-byte-weight` **(`/` only)** | **maxNumericValue 2,944,536 bytes** | median 2,676,851 bytes | **The lazy-globe / lazy-video work must not quietly unravel.** Gate = today's `/` median **+10%**. If the 1.9 MB globe chunk or the 6 MB hero video ever load eagerly again, `/` weight blows past this and the gate goes red. |

*(The `/` byte-weight gate is the tripwire for the media-weight lane specifically: today the homepage cold-loads 2,614 KiB with the globe/video deferred; +10% headroom = 2,875 KiB absorbs normal image churn but not a re-introduced multi-MB eager asset.)*

---

## Tripwire test — proof the gate actually blocks a regression

**What I broke (scratch edit, never committed):** added a synthetic 1-second main-thread block at app startup in `src/main.jsx`:

```js
// SCRATCH TRIPWIRE — synthetic 1s main-thread block to prove the LHCI gate FAILS. REVERT BEFORE COMMIT.
{ const __st = Date.now(); while (Date.now() - __st < 1000) { /* block main thread */ } }
```

**What failed:** `pnpm audit:lhci` exited **1**. LHCI's report:

```
Checking assertions against 4 URL(s), 12 total run(s)
1 result(s) for http://127.0.0.1:4319/contact :
  ×  categories.performance failure for minScore assertion
        expected: >=0.58
           found: 0.43
      all values: 0.34, 0.43, 0.64
Assertion failed. Exiting with status code 1.
```

The 1 s block spiked TBT and delayed FCP, dropping `/contact`'s **median performance from 0.65 → 0.43**, below its **0.58** gate → the command failed exactly as designed. *(An earlier 2.5 s block was so aggressive it errored the Lighthouse run itself — also a non-zero exit, but the 1 s version gives the clean "score below threshold" demonstration.)*

**Proof of revert:** the scratch edit was removed and `src/main.jsx` is **byte-identical to HEAD** (`git hash-object` matches `git rev-parse HEAD:src/main.jsx`); `git status src/` shows **no** modified source files. The post-revert run of `pnpm audit:lhci` was **GREEN (exit 0)** again. The tripwire edit exists in **no commit**.

---

## How to run it & how to read a failure (for Harry)

```
pnpm audit:lhci
```

1. **Green (exit 0)** = every gated page is within tolerance of the 2026-08-10 baseline — safe to ship. **Red (exit 1)** = a metric regressed; the command name prints the culprit.
2. On red, read the printed line: it names the **URL**, the **assertion** (e.g. `categories.performance minScore`), `expected: >=0.58` vs `found: 0.43`, and `all values:` (the 3 runs). That tells you *which page* and *which metric* slipped.
3. Open the full HTML report LHCI wrote under **`.lighthouseci/`** (path printed at the end of the run) to see *why* the score dropped, fix it, and re-run until green. To intentionally move the baseline, edit the thresholds in `lighthouserc.json`.

---

## `.gitignore` — one line needed (could not edit; not in the allowed file set)

Running the gate creates a **`.lighthouseci/`** directory (Lighthouse's working results + the filesystem `upload` target). It should be ignored. `.gitignore` was **not** in the set of files this task may edit, so it was left untouched — **please add this line**:

```
.lighthouseci/
```

Until then, `.lighthouseci/` shows as untracked after each run; it was **deliberately not staged** in this commit (and removed before committing so the commit contains only the four intended files).

---

## git status before the commit & the commit SHA

**`git status --porcelain` immediately before committing** — only `package.json` + `pnpm-lock.yaml` are modified (the `@lhci/cli` devDep + the `audit:lhci` script), plus the two new untracked files this task creates. **No source file is touched** (the tripwire revert is confirmed clean). Everything else listed is pre-existing untracked scratch from prior audits and is **not** staged.

```
 M package.json
 M pnpm-lock.yaml
?? LHCI-BASELINE-2026-08-10.md   <- committed
?? lighthouserc.json            <- committed
?? UNLIGHTHOUSE-AUDIT-2026-08-10.md   (pre-existing, not committed)
?? PA11Y-AUDIT-2026-08-10.md          (pre-existing, not committed)
?? MOBILE-RECON-2026-08-09.md / MOBILE-UX-RECON-2026-08-09.md / RECON-2026-08-09.md   (pre-existing)
?? _lane1..7/ _recon/ _recon2/ _recon3/ _assets-in/ _assets-in2/   (pre-existing)
?? "FINAL ASSETS ARE HERE.zip" / "NEW QFP AV.mp4" / drive-download-*.zip / *.jpeg / "THE FINAL DESKTOP WEBSITE CHANGE/"   (pre-existing)
```

**The commit stages exactly four paths:** `package.json`, `pnpm-lock.yaml`, `lighthouserc.json`, `LHCI-BASELINE-2026-08-10.md` — on branch `phase2-routing`.

**Final commit SHA:** recorded in the delivery message and retrievable via `git log -1 --format=%H` (it is this commit, HEAD of `phase2-routing`). A file cannot contain its own commit hash, so it is reported alongside this commit rather than embedded above.
