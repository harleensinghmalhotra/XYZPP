---
name: design-dna-forge
description: Extracts a reference site's design DNA — measurable tokens, perceived style, and named visual techniques — into a versionable three-layer JSON, then forces a divergence step so you regenerate an ORIGINAL design that keeps the feeling and none of the copying. USE WHEN: "make a site that feels like this reference", "extract this site's design system", "reverse-engineer these design tokens", "clone the vibe, not the site", "what makes this site feel premium", "turn this reference URL into a Tailwind theme", "font and color audit of this page", "design DNA", "build something in the style of X but original", "convert this screenshot into design tokens", "why does their type feel better than ours", "moodboard to tokens", "rebrand using this site as inspiration", "capture the motion timing of this site".
license: MIT
metadata:
  suite: award-grade
  version: "1.4.0"
---

# Design DNA Forge — measure the feeling, then rebuild it as something new

## Mission
Great references are for dissection, not duplication. This skill turns "I want it to feel like that" into numbers you can version — color roles, type ratios, spacing rhythm, motion timing — plus a named vocabulary for the un-measurable, then forces divergence so what ships is yours. Copying a site is theft with extra steps; extracting its DNA is how agencies actually learn.

## Ethics — read this before you capture anything
This is the loud section because it is the one that protects you.

- **Public pages only.** Never capture behind logins, paywalls, or preview links you weren't given.
- **Never exact-copy** text, logos, illustrations, photography, icon sets, or any proprietary asset. Not "as placeholder", not "temporarily" — placeholders become production.
- **Public code without a license = learning material only.** Read it, understand the technique, close the tab. Never redeploy, re-minify, or lightly rename it.
- **Shipping requires the divergence step (Workflow step 3) plus an originality pass by `award-judge`.** DNA without divergence is a clone with a JSON alibi.
- **Credit the lineage.** Design-DNA extraction is a known community pattern (style-extraction prompts and token-census scripts have circulated in agent-skill and design-engineering communities for years). This skill systematizes it and adds the anti-plagiarism engine; it did not invent it.

## When NOT to use
- **You have a brand book or design system already.** Extract from your own source of truth, not someone else's website.
- **The client wants "exactly like [competitor]".** That is a legal and taste problem; push back before you tokenize anything.
- **Greenfield concepts with no reference.** Go straight to `wow-director` and invent; DNA extraction of a random site will anchor you to mediocrity.
- **One-off visuals** (a single social image, a slide). The overhead of a token pipeline isn't worth it below page scale.
- **The reference is itself template slop.** Extracting DNA from a generic theme gives you tokens of nothing. Check it against the AI-tells list in `../../references/awwwards-scoring.md` first.

## Workflow
1. **Capture** — open the reference at 1440 / 768 / 390px. Screenshot each (full page + hero). Run the computed-style census (Technique 2) at each width. Record scroll behavior and 2–3 key interactions (hover a card, open the nav) as notes or a short recording. Save everything to `capture/` with the URL and date. Verified numbers only — if you couldn't measure it, it goes in as `TODO`, never as a guess.
2. **Distill** into the three-layer DNA JSON (schema below): `design_system` = what you measured; `design_style` = what you perceived, in words a director could brief from; `visual_effects` = the techniques that create the feeling, **named, not copied**.
3. **Diverge (REQUIRED — the anti-plagiarism engine).** Apply the divergence matrix (Technique 7). Minimum mandatory changes: type families, palette hues, imagery language. Keep only structural rhythm and interaction grammar. Fill the `divergence` block in the JSON; all three booleans must be `true` before anything downstream may consume this file.
4. **Emit tokens** — generate `tokens.css` as Tailwind v4 `@theme` / CSS custom properties from the DIVERGED values (never the raw capture). Emit only observed-then-diverged values; unknown fields stay as `/* TODO */` comments. A fabricated token is worse than a missing one — missing gets filled, fabricated gets trusted.
5. **Hand off** — write the regeneration brief (Deliverables) and pass it to `wow-director`, which routes motion to `motion-choreography`, hero effects to `webgl-shader-fx` / `signature-interactions`, and the final gate to `award-judge`.

## Technique library

**1. Triple-viewport capture.** 1440/768/390 is the minimum honest set — award-grade sites change composition across breakpoints, not just scale. If the mobile layout is a squashed desktop, record that: it is a finding ("no responsive art direction"), not an omission.

**2. Computed-style census.** Counting beats eyeballing. Run in the page console; the top-N values by frequency are the real tokens, the long tail is noise or one-off art direction (record notable one-offs under `visual_effects` instead):

```js
const census = { fonts: {}, colors: {}, radii: {} };
for (const el of document.querySelectorAll('body *')) {
  const s = getComputedStyle(el);
  if (el.innerText?.trim()) {
    const key = `${s.fontFamily.split(',')[0]} ${s.fontWeight} ${s.fontSize}/${s.lineHeight}`;
    census.fonts[key] = (census.fonts[key] ?? 0) + 1;
  }
  for (const c of [s.color, s.backgroundColor])
    if (c && c !== 'rgba(0, 0, 0, 0)') census.colors[c] = (census.colors[c] ?? 0) + 1;
  if (s.borderRadius !== '0px') census.radii[s.borderRadius] = (census.radii[s.borderRadius] ?? 0) + 1;
}
Object.entries(census.colors).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(r => console.log(r));
```

**3. Type-scale reverse engineering.** Sort the distinct observed font sizes descending, compute each adjacent ratio, and snap to a named scale (1.2, 1.25, 1.333, 1.414, 1.5, 1.618) only if within ~2% — otherwise record the raw sizes and note "hand-tuned scale". The ratio is DNA; the exact pixel values are theirs. Also record the display-vs-body contrast method: weight jump, size jump, family switch, or case change — that choice is most of a site's typographic voice.

**4. Spacing-rhythm detection.** Take the mode of observed margins/paddings/gaps; find the base unit that divides ≥80% of them (usually 4 or 8px). Record section vertical padding separately — whitespace philosophy lives in section gaps, not component gaps. A site whose sections breathe at 160px tells a different story than one at 64px, even with identical components.

**5. Motion fingerprinting.** Read `transition-duration` / `transition-timing-function` / `animation-*` from computed styles, then verify by interacting — declared styles lie when JS libraries drive the motion. Map findings to the nearest token in `../../references/motion-canon.md` (e.g. observed 220ms ease-out → `--duration-base` + `--ease-out-quart`). Record the stagger interval and whether enters/exits differ. You are extracting the timing *personality*, not the keyframes.

**6. Effect naming, not effect copying.** For each signature technique, write a `visual_effects` entry: what it's called, where it appears, how it works generically, and what you'd recreate it with ("masked line-reveal on headlines — clip-path + translateY per line, GSAP stagger 40ms" / "film-grain overlay — tiling noise texture, `mix-blend-mode: overlay`, 4% opacity"). Named techniques are transferable knowledge; copied keyframes are evidence.

**7. The divergence matrix.** The line between influence and plagiarism, stated as rules:

| MUST change | MAY keep | MUST NOT keep |
|---|---|---|
| Type families (change classification if possible: their grotesk → your serif) | Spacing rhythm + base unit | Any copy, headlines, or microcopy |
| Palette hues (rotate ≥60° on the hue wheel, or invert temperature; keep only the *contrast structure*) | Structural grid + composition strategy | Logos, illustrations, photos, icons |
| Imagery language (their 3D renders → your photography; their duotone → your natural color) | Interaction grammar (hover reveals, scroll pacing) | The hero composition recognizably theirs |
| At least one `visual_effects` technique swapped for a different technique with the same job | Motion timing personality (mapped to canon tokens) | Distinctive named effects reproduced verbatim |

The test: put your regenerated design next to the reference and show both to someone who knows the reference. "Same league" = pass. "Same site" = fail, diverge again.

**8. Honest token emission.** Tailwind v4 `@theme` starter — every value traces to a census line or a divergence decision, cited in a comment:

```css
@theme {
  /* Emit ONLY observed-then-diverged values. Unknown = TODO, never invented. */
  --color-bg: oklch(0.18 0.01 260);        /* census #12121a ×1,204 → hue-rotated +70° */
  --color-accent: oklch(0.72 0.19 45);     /* diverged: their cool blue → warm amber */
  --font-display: "TODO";                  /* divergence pending — pick a different classification */
  --text-base: 1.0625rem;                  /* census: 17px body ×842 */
  --spacing: 0.5rem;                       /* rhythm: 8px base, 87% of observed gaps */
  --radius-md: 0.75rem;                    /* census: 12px ×96 */
  --duration-base: 240ms;                  /* observed 220ms → snapped to motion-canon */
  --ease-out: cubic-bezier(0.25, 1, 0.5, 1);
}
```

## DNA JSON schema (compact)
```json
{
  "meta": { "source_url": "", "captured_at": "", "viewports": [1440, 768, 390], "public_page": true },
  "design_system": {
    "color": { "bg": "", "surface": "", "text": "", "text_muted": "", "accent": "", "accent_contrast": "" },
    "type": { "display_family": "", "body_family": "", "base_px": null, "scale_ratio": null, "weights": [], "contrast_method": "" },
    "space": { "base_px": null, "section_padding_px": null, "rhythm": [] },
    "radius": {}, "elevation": [],
    "motion": { "duration_base_ms": null, "easing": "", "stagger_ms": null, "enter_exit_differ": null }
  },
  "design_style": { "mood": [], "composition": "", "whitespace": "", "hierarchy_method": "", "density": "" },
  "visual_effects": [ { "name": "", "where": "", "technique": "", "recreate_with": "" } ],
  "divergence": { "type_changed": false, "palette_changed": false, "imagery_changed": false, "kept": [], "notes": "" }
}
```
Every measurable field is either an observed value or `null`/`TODO`. The `divergence` block gates downstream use.

## Quality gates
- `../../references/awwwards-scoring.md` — the Creativity one-sentence test is the divergence proof: if your regenerated design's describing sentence equals the reference's, you copied. The generic-AI-tells list also disqualifies references worth extracting from, and any tell in your OUTPUT caps Design at 6.
- `../../references/motion-canon.md` — extracted timings must map to canon tokens ("one system, one personality"); never import the reference's mixed easings as-is.
- `../../references/performance-budgets.md` — the ≤2 families / ≤5 weights font budget binds your diverged type choices; a reference using 4 families is a finding, not a permission slip.
- `../../references/accessibility-motion.md` — hue rotation changes contrast: re-verify ≥4.5:1 body / 3:1 display on the DIVERGED palette with a contrast checker and record the ratios. The reference passing proves nothing about your version.

## Deliverables
- `capture/` — screenshots (3 viewports), census console output, interaction notes. Raw evidence, dated and URL-stamped.
- `dna.json` — the three-layer DNA file, divergence block completed.
- `tokens.css` — Tailwind v4 `@theme` / custom-properties starter, every value comment-cited, gaps as TODO.
- `divergence-checklist.md` — the matrix from Technique 7 with each row marked changed/kept/removed and one line of proof each. Unsigned checklist = nothing ships.
- Regeneration brief — one page for `wow-director`: mood words, composition strategy, whitespace philosophy, the diverged token file, and the ONE candidate signature moment (own idea, inspired job, different technique).

## Related skills
- `wow-director` — receives the regeneration brief and orchestrates the build.
- `signature-interactions` / `motion-choreography` — consume the interaction grammar and motion fingerprint.
- `webgl-shader-fx` — when a `visual_effects` entry names shader/3D work to recreate differently.
- `ux-narrative` — pairs the extracted composition strategy with content that is actually yours.
- `award-judge` — runs the originality pass; no divergence sign-off, no ship.
