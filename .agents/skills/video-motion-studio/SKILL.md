---
name: video-motion-studio
description: Produces programmatic video, motion graphics, and product film for the web — Remotion compositions, product teasers, kinetic-type captions baked into a rendered film, Lottie/Rive motion assets, polished screen-capture demos, and scroll-scrubbed video, all cut to web performance budgets. USE WHEN: "make a product teaser video", "create a launch video", "animate this demo recording", "build a video with Remotion", "kinetic-type captions for this video/teaser", "turn this screen recording into a polished demo", "should I use Lottie or Rive", "add a hero video to the site", "scroll-scrubbed video section", "render 15 and 30 second cuts", "captions for muted autoplay", "explainer animation for this feature", "app store preview video", "video is too heavy, fix it".
license: MIT
metadata:
  suite: award-grade
  version: "1.4.0"
---

# Video Motion Studio — video as code, cut for the web, watched before shipped.

## Mission
Treat video as a build artifact, not an export: composed in code, versioned in git, re-rendered when data changes, and budgeted like any other page weight. A product film that stutters on load or plays silent-and-captionless to 85% of viewers is not a film — it is a liability with a soundtrack. This skill makes video that earns its bytes.

## When NOT to use
- **A CSS/GSAP animation would do.** If the motion is UI responding to the user, it belongs in `motion-choreography` or `signature-interactions` — video is for authored, linear narrative.
- **One-off, never-revised, effects-heavy footage.** Live-action grading, particle sims, 3D camera work: a motion designer in a dedicated NLE beats programmatic video. Remotion wins when video is data-driven, versioned, or personalized — not always.
- **The page already has a signature moment.** Per `../../references/awwwards-scoring.md`, one memory per page. Autoplaying hero video next to a WebGL scene is two things screaming.
- **Background-texture video.** Looping "ambience" video that carries no information is 4MB of decoration competing with content — the motion canon bans autoplaying loops near text for a reason.

## Workflow
1. **Script on paper first.** Write the beat sheet: hook, 3–5 feature beats, end card. One sentence per beat, timestamp each. No timeline work until the beat sheet reads well aloud in under the target duration.
2. **Pick the production path**: Remotion (data-driven/versioned/multi-variant), screen-capture pipeline (product demo), Lottie/Rive (UI-embedded motion asset), or plain `<video>` craft (footage already exists). Say which and why in one line.
3. **Build the master composition** at the longest cut (60s). Structure every beat as a reusable component so shorter cuts are re-sequencing, not re-authoring.
4. **Author captions in parallel with picture** — kinetic-type captions are part of the composition, not a post step, because muted autoplay is the default viewing condition.
5. **Render all variants + poster set**, run the render-verification ritual (below), record file sizes and durations.
6. **Integrate on the page** with poster, `muted playsinline` autoplay rules, lazy loading, and the ≤4MB above-the-fold budget from `../../references/performance-budgets.md`.
7. **Gate through `award-judge`** before calling it done.

## Technique library

### Remotion fundamentals — React as timeline
Everything is a pure function of `useCurrentFrame()`. No hidden playhead state; a frame number in, pixels out. The three idioms that do 90% of the work:

```tsx
const frame = useCurrentFrame();
const { fps, durationInFrames } = useVideoConfig();

// 1. interpolate — the workhorse. ALWAYS clamp; unclamped extrapolation is the #1 Remotion bug.
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

// 2. spring — for entrances with weight. damping 200 = settle-no-bounce (product-safe).
const scale = spring({ frame, fps, config: { damping: 200 } });

// 3. Sequence — shifts child time so beats are self-contained components starting at frame 0.
<Sequence from={90} durationInFrames={150}><FeatureBeat n={1} /></Sequence>
```

Supporting cast: `<AbsoluteFill>` for layer stacking (every beat is layers, like a comp), `staticFile()` for assets, `<OffthreadVideo>` to embed real footage (screen captures, b-roll) inside a composition frame-accurately — this is how the capture pipeline and Remotion meet.

Register each cut as its own `<Composition>` (id `teaser-60`, `teaser-30`, `teaser-15`) sharing beat components — render with `npx remotion render <id>`. When programmatic beats After Effects: numbers change (pricing, stats, dates), variants multiply (per-locale, per-customer, per-length), or video must stay in lockstep with a product that ships weekly. When it doesn't: see "When NOT to use."

### Product-teaser grammar
The structure that survives a feed:
- **Hook < 2s.** The product's single most visual moment, first. No logo intro — logos open nothing, they close things. If frame 1 through frame 48 could belong to any product, restart.
- **Feature beats at 3–5s intervals.** One claim + one visual proof per beat. 60s ≈ 5 beats max. A beat that needs two sentences is two beats or zero.
- **Kinetic-type captions on every beat** — muted autoplay is the default; the film must work silent. Type IS the voiceover.
- **End card ≤ 3s**: product name, one-line value claim, CTA. Static and legible — it's the frame people screenshot.
- **One master, three cuts**: 60s (site/page), 30s (social), 15s (ads/hook test). The 15s cut = hook + best beat + end card, re-sequenced from the same components.

A beat sheet is a table, and it exists before any code:

| Time | Beat | Caption (the silent voiceover) | Visual proof |
|---|---|---|---|
| 0:00–0:02 | Hook | "Your reports, written while you sleep" | dashboard assembling itself |
| 0:02–0:06 | Beat 1 | "Connect once" | 3-click integration, zoomed |
| 0:06–0:10 | Beat 2 | "Ask in plain English" | query typed, chart appears |
| 0:10–0:13 | End card | name + claim + CTA | static, screenshot-ready |

If a cell is vague ("show the product"), the beat isn't ready to animate.

### Kinetic typography — baked into the rendered file, not the DOM
This is type animated as picture: frames rendered once and shipped as video, not a live page element (that's `signature-interactions`' "Text as interface" — same canon timing, different medium and different failure mode: a render mistake ships to everyone who ever watches the file).
- **Reveal by line, not by character.** Line-level reveals match reading rhythm; per-character animation on a sentence is decoration fighting comprehension. Per-char is allowed only for < 5 words — a logotype, a single punch word.
- Timing from `../../references/motion-canon.md`: enters on ease-out-quart, 240–400ms per line, 30–60ms stagger between lines, exits at ~70% of enter duration on ease-in.
- **Hold time = reading time × 1.5.** Roughly 180ms per word, minimum 1.2s per caption on screen. If a caption leaves before a slow reader finishes, the beat failed regardless of how it moved.
- Travel ≤ 0.5em. Type that flies in from offscreen reads as a 2012 slideshow. Small rise + fade, settle, hold, exit.
- Check every caption at 360p during verification — captions that alias into mush at feed resolution are captions you don't have.

### Lottie vs Rive — the decision
- **Lottie = designer-authored playback.** After Effects export, plays start-to-finish (or segments). Right for: logo animations, illustrated loops, decorative motion authored by a motion designer. Budget: **≤ 150KB JSON** per animation, `.lottie`/compressed where supported; an unoptimized export with hidden layers and giant precomps hits 2MB silently — audit the JSON.
- **Rive = interactive state machines.** Inputs (hover, pressed, progress) drive blended states at runtime. Right for: animated icons that respond, characters that react, anything with more than play/pause. Budget: **≤ 250KB** per `.riv`.
- Rule of thumb: if the motion needs an `if`, it's Rive. If it needs a play button, it's Lottie. If it's just transform+opacity on a few elements, it's neither — ship CSS/GSAP at a fraction of the runtime cost.
- Both: pause off-viewport via IntersectionObserver, honor `prefers-reduced-motion` with a static final frame — per `../../references/accessibility-motion.md`.

### Screen-capture polish pipeline
Raw screen recordings are evidence, not film. The pipeline that makes them cinematic:
1. **Capture at 2× the delivery resolution**, 60fps, in a clean profile (no bookmarks bar, no notifications, staged realistic data — never lorem ipsum in a product demo).
2. **Cursor smoothing**: real mouse movement is jittery; re-animate cursor travel as eased paths between click points (ease-in-out, 400–600ms per travel), or hide the cursor and let zoom direct attention.
3. **Zoom-pan choreography**: rest at full frame, push in to 1.5–2× on the interaction moment, hold, pull back. Camera moves on ease-in-out-quint, 600–800ms; never more than one camera move per beat. Zoom IS your narrator.
4. **Device frame** appropriate to context (browser chrome for web, device body for mobile) — consistent across every shot in the film.
5. **Cut on action**: trim every dead frame between click and response. Demos feel fast because editing removed the waiting, not because the product was rushed.

### Web-native video craft
- **Poster frame always** — chosen, not defaulted. It's the LCP candidate and what reduced-motion and save-data users may see forever. Preload it; pick a frame that composes as a still.
- **Autoplay = `muted` + `playsinline` + poster**, ≤ 4MB for above-the-fold clips (hard budget from `../../references/performance-budgets.md`), adaptive sources, lazy-load anything below the fold. Any clip > 5s gets a visible pause control (vestibular rule).
- **Delivery encode**: H.264 in `yuv420p` (the only universally-decodable pixel format — 4:4:4 renders black on many mobile players) with `-movflags +faststart` so playback starts before download finishes; offer AV1/HEVC as additional `<source>` entries for browsers that take them. Reserve layout with an `aspect-ratio` box — a late-arriving video that shoves the page is a CLS defect, not a loading state.
- **Scroll-scrubbed video, two honest options:**
  - `currentTime` scrubbing of a `<video>`: small payload, but seek latency depends on keyframe density — re-encode with all-keyframes (e.g., ffmpeg `-g 1`) or scrubbing stutters on long GOPs. Fine for short clips (< 5s) and simple motion.
  - Pre-transcoded frame sequence drawn to canvas: perfectly smooth bidirectional scrubbing, but N frames × size adds up fast — budget the full sequence like a hero WebGL payload (< 1.5MB where possible), serve WebP/AVIF frames, lazy-decode ahead of scroll direction.
  - Either way: drive from rAF-batched scroll position, never layout reads in the scroll handler; reduced-motion gets the poster or a static keyframe strip.

### Sound design notes
- Sites earn sound rarely. **User-initiated only, mute-first, always a visible control.** Autoplaying audio is an instant-close, and an instant credibility kill with juries.
- UI sounds (if the brand genuinely earns them): < 200ms, quiet (well under the OS notification level), interaction-triggered, with a global mute persisted to storage.
- In film: sound designed for the 15% who unmute — mix voiceover-forward, music −18dB under voice, and verify the silent experience carries 100% of the meaning first.

## Quality gates
- `../../references/motion-canon.md` — caption easing/duration tokens; the 1-second ceiling on blocking motion; the ban on autoplaying loops near text; reduced-motion parity (poster/static frame is the reduced experience, shipped with equal care).
- `../../references/performance-budgets.md` — ≤ 4MB above-fold video, poster + LCP < 2.5s, CLS < 0.05 (aspect-ratio box reserves the video's space), no scroll-handler layout reads for scrubbing, canvas/video paused off-viewport.
- `../../references/accessibility-motion.md` — pause control on > 5s autoplay, flash safety (≤ 3 flashes/sec — check strobe-y cuts), captions as content parity, contrast ≥ 4.5:1 for text over footage tested on the worst frame.
- `../../references/awwwards-scoring.md` — video competes for the ONE signature moment; if it isn't the signature, it must be quiet. Content axis: a teaser with weak copy scores as weak content no matter the render quality.

## Deliverables
- **Composition source** — Remotion project (or capture-pipeline project) with beats as components, variants as registered compositions, data as props.
- **Rendered variants** — 60/30/15s cuts at delivery resolutions, encode settings recorded (codec, bitrate, dimensions, file size per variant).
- **Captions file** — WebVTT (and/or SRT) matching the kinetic type, for players and platforms that ingest it.
- **Poster set** — chosen poster frame per variant plus 2–3 alternates, exported via `npx remotion still` or frame extraction.

**Render-verification ritual (mandatory, before any "done"):**
1. **[HUMAN]** Watch every rendered variant start-to-end at 1× — the rendered file, not the preview. The preview lies about frame drops, asset 404s, and font fallbacks; the file doesn't. This is a human-perception check (does it *feel* right, does anything look wrong at real playback speed) — an agent has no eyes on a moving image, so **request a human watch-through; do not report a skipped watch as done.**
2. **[MEASURED]** agent-runnable proxy when no human is available yet: `ffmpeg -i <file> -vf "fps=2" frame_%03d.png` (or similar, e.g. one frame per second) to extract a frame sequence, then run the legibility check (step 3 below) against the extracted frames. Disclose this as **sampling frames, not watching the film** — it catches static defects a still frame reveals (a caption that's mush, a frame with a dropped asset, a broken end card) but it CANNOT catch what only shows in motion: stutter, mistimed cuts, audio/caption drift, or a beat that reads wrong at speed. Label any claim from this proxy `[MEASURED via ffmpeg frame extraction]`, never `[HUMAN]`.
3. Frame-check text legibility at 360p on every caption — if a caption aliases into mush at feed resolution, fix the type size, don't hope.
4. Confirm poster, first frame, and end card each compose as standalone stills.
5. Verify captions file timing against picture on at least the 60s cut.
6. Record per-variant codec, dimensions, duration, and file size in the report. Claims without recorded numbers don't count as verification — a variant nobody watched end-to-end, or at minimum frame-sampled with the method disclosed, is not rendered, it is hoped.

## Related skills
- **wow-director** — orchestrates this skill; owns the call on whether the page's signature moment is video at all.
- **motion-choreography** — the same timing canon applied to UI motion; kinetic-type easing lives there first.
- **ux-narrative** — writes the beat sheet's copy; a teaser is a narrative before it is a render.
- **design-dna-forge** — type, color, and art direction the film must inherit; video is the brand at 24fps, not a separate brand.
- **webgl-shader-fx** — the competing hero medium; never ship both loud on one page.
- **award-judge** — gates the output against the scoring rubric and the slop list.
