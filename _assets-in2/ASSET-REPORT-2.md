# ASSET REPORT 2 — Final Client Assets (read-only recon)

**Date:** 2026-07-29
**Scope:** read-only. Nothing in `src/` or `public/` was touched. All extraction/analysis output lives in `./_assets-in2/`.
**Tools used:** Python 3.12 + Pillow 12.2 (images); ffmpeg 7.1 via `imageio-ffmpeg` (video probe, frame extraction, audio level detection). No ImageMagick/ffprobe were present, so `imageio-ffmpeg` was installed into the Python environment only — nothing was added to the repo.

---

## Headline findings (read these first)

1. **The process-video translation problem is NOT solved — it is arguably worse.** The new process animation still has burnt-in **English** step labels: `01 PAPER SELECTION`, `02 PRINTING`, `03 BINDING & FINISHING`, `04 QUALITY CHECKS`, `05 PACKAGING`, `06 SHIPPED`, `07 DELIVERED`, plus a "QF" logo watermark top-right. It is the **same animation already on the site**, re-exported at a higher bitrate with an added audio track. Shipping it will not make "Paper Selection" translate.
2. **The corporate AV "no audio" complaint IS fixed.** `NEW QFP AV.mp4` has a real, non-silent stereo AAC track (mean −22.9 dB across the whole 2:15). It is the **same edit** as the current `facilities.mp4`, now with its sound restored.
3. **But `NEW QFP AV.mp4` is 70 MB — 5× the current largest file in the repo (13.8 MB).** It must be re-compressed before it can ship. It is also only **848×480 (SD)** — the same low resolution as now; the audio is fixed but the picture is not upgraded.
4. **"Binding Image.png" is actually two photos in one** (a side-by-side diptych), not a single image. That needs a layout decision before it drops into the facility book.
5. Both PNGs carry a **fully-opaque, therefore useless, alpha channel** that just inflates their size.
6. The zip contained **exactly** the three files the client described, at the stated sizes. Nothing missing, nothing extra.

---

## TASK 1 — Extract & inventory

### `FINAL ASSETS ARE HERE.zip` (13,561,679 B on disk)
Extracted to `./_assets-in2/`. Contents match the client's description exactly:

| File | Ext | Bytes | ≈ | Client said |
|------|-----|-------|---|-------------|
| `Binding Image.png` | .png | 2,113,104 | 2.11 MB | "2 MB" ✅ |
| `Finishing.png` | .png | 2,905,191 | 2.91 MB | "2.8 MB" ✅ |
| `final Animated video for OUr processes.mp4` | .mp4 | 8,540,669 | 8.54 MB | "8.1 MB" ✅ |

### Loose file
| File | Ext | Bytes | ≈ |
|------|-----|-------|---|
| `NEW QFP AV.mp4` (in the project folder, not in the zip) | .mp4 | 70,051,547 | 70.05 MB |

### Image detail
| File | Pixels | Aspect | Orientation | Mode | Alpha | Colour | Web-usable as-is? |
|------|--------|--------|-------------|------|-------|--------|-------------------|
| `Binding Image.png` | 1544 × 1177 | 1.312 | landscape | RGBA | present but **100% opaque** (min=max=255) | no ICC → sRGB, 96 dpi | No — PNG at 2.1 MB, redundant alpha; must become WebP |
| `Finishing.png` | 2033 × 1148 | 1.771 | landscape | RGBA | present but **100% opaque** | no ICC → sRGB, 96 dpi | No — same |

### Video detail
| File | Duration | Resolution | FPS | Video codec | **Audio track?** | Bitrate | Size |
|------|----------|-----------|-----|-------------|-------------------|---------|------|
| `final Animated…processes.mp4` | 10.07 s | 1920×1080 | 30 | H.264 High, yuv420p, bt709 | **Yes** — AAC LC, 48 kHz, **stereo**, 253 kb/s | 6,787 kb/s | 8.54 MB |
| `NEW QFP AV.mp4` | 2:15.70 | **848×480 (SD)** | 30 | H.264 Main, yuv420p, smpte170m | **Yes** — AAC LC, 48 kHz, **stereo**, 317 kb/s (eng) | 4,129 kb/s | 70.05 MB |

**Not web-optimal as-is:**
- Both PNGs → convert to **WebP, flatten to RGB** (drop the pointless alpha), resize to repo width.
- `final Animated…mp4` → the muted homepage slot doesn't use audio; **strip the audio track** and match the current bitrate (see Task 4). *Content* problem (burnt-in English) is separate and unresolved.
- `NEW QFP AV.mp4` → **must be re-compressed** (70 MB is far too large for the web); keep the audio.

---

## TASK 2 — What the images actually show (opened, not inferred)

### `Binding Image.png` — **a two-panel diptych** (⚠️ not one photo)
A single canvas split down the middle by a thin white gutter, holding **two** factory photographs.
- **Left panel:** a long blue-and-white perfect-binding / sewing line running away from camera in a steel-clad hall, with printed sheets hung to dry above it and a "QF"-style gold logo on the machine skirt.
- **Right panel:** a numbered gathering / finishing machine (a "1" plate on the head) loaded with brightly printed children's book covers, an operator control panel with red/green/blue buttons in the foreground.

Both halves are genuine binding-hall photography and on-topic. Orientation of the **whole canvas** is landscape (1.31), but each half reads portrait-ish.

- **Belongs in:** the facility book → **"Binding and Finishing"** section (facility `03`, the green spine). Same subject family as the existing `binding-01…11` set.
- **Matches existing binding images?** Subject: yes. Format: partly — the existing set are **single** photos, this is a **diptych**. Its 1.31 aspect is between the set's near-square (`binding-04` 1.04) and 16:9 (`binding-03` 1.78) members.
- **Decision required:** keep it as one double-page spread, **or split it into two single images**. The book's layout engine (`FacilityBook.jsx`) sizes by aspect ratio, so a diptych at 1.31 will behave differently from a normal single shot.
- **Conversion:** PNG→WebP, RGB, 1600 px wide, q≈80. (See Task 4.)

### `Finishing.png` — single landscape photo of a book trimmer
One wide shot of a large blue-and-white industrial three-knife trimmer branded **"bindwel trimit# > 30C"**, with green-covered booklets riding the conveyor through the trim head, a worker at the left, and pallets of stacked finished books in the background. Slight cool/fluorescent white balance; a touch dark on the machine body.

- **Belongs in:** the same **"Binding and Finishing"** section (facility `03`). Fits cleanly as another `binding-NN` photo.
- **Matches existing binding images?** Yes — single landscape photo, 1.77 ≈ the set's 16:9 members (`binding-03` 1.778, `binding-10` 1.772). This is the better-behaved of the two new images.
- **Conversion:** PNG→WebP, RGB, 1600 px wide, q≈80; optional minor warm/white-balance nudge to sit with the neutral tone of the existing set (not blocking).

**Context note:** the client says both images replace a "redundant divider page that just repeats the section title." There is no such text-divider page in the code — the binding section is a straight photo sequence (`binding-01…11`). So in practice these two become **new photos in that sequence** (e.g. `binding-12`, `binding-13`), or they overwrite two of the weaker existing slots. Which slot they take is a content call for whoever owns the book.

---

## TASK 3 — Both videos

### Current slot files (for comparison)
All under `public/site-assets/homepage/video/`:
| File | Duration | Resolution | Audio | Size | Role |
|------|----------|-----------|-------|------|------|
| `how-we-work.mp4` | 10.07 s | 1920×1080 | **none** | 6.43 MB | Homepage "How We Work" process band |
| `how-we-work-poster.jpg` | — | 1920×1070 | — | 0.11 MB | its poster |
| `facilities.mp4` | 2:15.70 | 848×480 | **none** | 14.44 MB | Homepage Infrastructure walkthrough (the corporate AV) |
| `facilities-poster.jpg` | — | 1920×1080 | — | 0.077 MB | AV poster |
| `facilities-thumb.webp` | — | 1600×900 | — | 0.064 MB | thumb behind the play button |
| `facilities.vtt` | — | — | — | 307 B | AV captions |

### (a) Process video — `final Animated…processes.mp4` → replaces `how-we-work.mp4`

Wired at [ProcessVideo.jsx:22](src/sections/ProcessVideo.jsx#L22) (`VIDEO = '/site-assets/homepage/video/how-we-work.mp4'`), played `muted loop autoPlay playsInline aria-hidden` — i.e. **silent, decorative**.

- **Current file:** 10.07 s, 1920×1080, 30 fps, 6.43 MB, no audio.
- **New file:** 10.07 s, 1920×1080, 30 fps, 8.54 MB, **with** a stereo AAC track.

**BURNT-IN TEXT CHECK — the critical one:** the new video **still has English text baked into the footage**, the exact reason "PAPER SELECTION" never translated. Frame-by-frame, on-screen text reads:

| ~time | Burnt-in text |
|-------|---------------|
| ~0–1 s | `01` **PAPER SELECTION** |
| ~2–3 s | `02` **PRINTING** |
| ~3–4 s | `03` **BINDING & FINISHING** |
| ~4–5 s | `04` **QUALITY CHECKS** |
| ~6–7 s | `05` **PACKAGING** |
| ~7–8 s | `06` **SHIPPED** |
| ~8–10 s | `07` **DELIVERED** (over a QUARTERFOLD PRINTABILITIES delivery truck) |
| throughout | small **"QF"** logo watermark, top-right |

I also pulled the same moment from the **current** `how-we-work.mp4`: identical `01 PAPER SELECTION`, identical world-map background, identical QF watermark. **This is the same animation already live**, re-rendered at a higher bitrate with an audio track added.

**Verdict:** the long-standing translation problem is **still with us.** Nothing about this file makes the step labels translatable — they are pixels in the video, in English, in all three languages. To fix it properly you need one of: (i) a **clean, text-free render** of this animation from the animator, so the step labels can be HTML/i18n captions overlaid in CSS (best); (ii) **three localized renders** (EN/FR/ES) with the text baked per language; or (iii) accept English-only baked text and stop trying to translate it. This is a **content/source problem, not a conversion problem.**

### (b) Corporate AV — `NEW QFP AV.mp4` → replaces `facilities.mp4`

**AUDIO CHECK — the critical one:** **Yes, it has real, non-silent audio.**
- Codec: AAC LC, 48 kHz, **stereo (2 ch)**, 317 kb/s.
- Level (ffmpeg volumedetect over the full file): **mean −22.9 dB, max −2.4 dB**, across all 13,027,328 samples ≈ the full 2:15. A truly silent track would read ≈ −91 dB / −inf. This is genuine sustained sound (voiceover/music), not a dead track. **The client's "no audio" complaint is resolved.**

**What it shows:** a complete corporate film — intro logo, a triptych of hands selecting paper stock, a Komori **Lithrone** offset press running, binding/gathering machinery with printed sheets, product B-roll with **burnt-in English captions** ("SPECIALIZED NOTEBOOK & STATIONERY PRINTING", etc.), closing on the QUARTERFOLD PRINTABILITIES logo and tagline **"Powering Global Education — Through print excellence."** I confirmed the outro frame is pixel-identical to the current `facilities.mp4` at 2:15 — **same edit**, so the existing `facilities-poster.jpg`, `facilities-thumb.webp` and `facilities.vtt` should still line up (verify caption timing once, but duration is identical). Note the AV's own English captions are baked in — but they already are in the live `facilities.mp4`, so that's pre-existing, not a regression.

**Does an AV slot still exist? — honest answer: it depends where.**
- **/infrastructure PAGE** ([InfrastructurePage.jsx:34-35](src/pages/InfrastructurePage.jsx#L34)): the single Corporate-AV film slot was **replaced by `<YouTubeChannel />`** (a live grid driven by `src/data/youtube.js`). So on the dedicated page there is **no single-video AV slot anymore.**
- **Homepage Infrastructure SECTION** ([Infrastructure.jsx:24](src/sections/Infrastructure.jsx#L24), mounted at [Home.jsx:208](src/pages/Home.jsx#L208)): **still live.** `VIDEO_READY = true`; a play button opens a dialog `<video src="/site-assets/homepage/video/facilities.mp4" poster="…facilities-poster.jpg">` with the `.vtt` captions. **This is the slot `NEW QFP AV.mp4` would fill** (overwrite `facilities.mp4`, keep the filename).

So: **yes, an AV video slot still exists — on the homepage Infrastructure section — and that is where this file goes.** The `/infrastructure` page now uses YouTube instead.

---

## TASK 4 — Conversion plan

### `Finishing.png` → `binding-NN.webp`
- Format: **WebP**, flatten **RGBA→RGB** (alpha is 100% opaque — drop it).
- Size: **1600 px wide** (repo standard) → 1600×903. This is a **downscale** from 2033 → no quality loss.
- Quality: q≈80. **Expected output ≈ 120–230 KB**, in line with the existing set (52–279 KB).
- Colour: optional slight warm/WB nudge to match the neutral set tone; otherwise fine.

### `Binding Image.png` → `binding-NN.webp` (after the split/keep decision)
- Format: **WebP**, RGBA→RGB.
- If kept whole: 1600×1220 (marginal 3.6% upscale from 1544 — negligible). If split: two images, each ~770 px source width → keep near native, don't upscale hard.
- Quality: q≈80. **Expected ≈ 150–260 KB** (or 2× if split).
- **Blocker:** decide single-spread vs split (Task 2) before converting.

### `final Animated…mp4` → `how-we-work.mp4`
- Container/codec: keep **H.264 MP4, 1920×1080, 30 fps**.
- **Strip the audio track** (`-an`) — the slot is muted; 253 kb/s of audio is dead weight.
- Match current bitrate (~5,100 kb/s) → **expected ≈ 6–6.5 MB**, i.e. on par with today's 6.43 MB.
- Regenerate `how-we-work-poster.jpg` only if frame-0 differs (it looks the same).
- **Content blocker unchanged:** burnt-in English (see Task 3a). Converting it ships the same untranslatable text at a slightly larger size for **no visible benefit**. Recommend **not shipping** until a text-free or localized render is supplied.

### `NEW QFP AV.mp4` → `facilities.mp4`
- Container/codec: **H.264 MP4, 848×480, 30 fps** (match source; can't add real detail beyond 480p).
- **Keep audio** (that's the fix) but transcode down to **~96–128 kb/s AAC**.
- Re-compress video to **~900–1,300 kb/s**. At 848×480 that's plenty.
- **Target size ≈ 15–20 MB** (vs the incoming **70 MB**). It will land a little **above** today's 14.4 MB *because we are adding the audio track that was missing* — that's expected and acceptable.
- Reuse existing `facilities-poster.jpg`, `facilities-thumb.webp`, `facilities.vtt` (same edit); spot-check caption timing once.
- **Flag:** the master is only **848×480 SD** — this fixes the audio, **not** the picture quality. If the client expected an HD upgrade, that needs a higher-resolution master.

### Size / repo-weight verdict (Task 4 explicit ask)
The existing `facilities.mp4` (13.8 MB) is today's largest repo file.
- **Process video:** as delivered it's **worse** (8.5 MB vs 6.4 MB) purely from the added audio + higher bitrate. After stripping audio it's **neutral** (~6 MB). Either way it doesn't beat the 13.8 MB file.
- **AV video:** as delivered it's **dramatically worse** — 70 MB, 5× the current biggest file. After the mandatory re-compression (~15–20 MB) it will be **marginally worse** than today (because audio is now included), and will retake the "largest file in the repo" title by a few MB. That is the cost of fixing the audio complaint, and it's reasonable — but the 70 MB original must **never** ship raw.

---

## TASK 5 — Verdict lists

### ✅ READY TO USE (asset is good; needs only a standard conversion)
- **`Finishing.png`** — convert to `binding-NN.webp`, RGBA→RGB, 1600 px wide, q≈80 (≈120–230 KB). Optional minor WB nudge.
- **`NEW QFP AV.mp4`** — the audio fix is delivered and real. Convert: **re-compress to ~15–20 MB** (H.264 848×480 @ ~1,000–1,300 kb/s video + ~96–128 kb/s AAC), keep filename `facilities.mp4`, reuse existing poster/thumb/vtt. *Must not ship at 70 MB.*

### ⚠️ NEEDS WORK BEFORE USE
- **`final Animated…processes.mp4` (process video)** — **burnt-in English step labels (01–07) are unchanged**; it's the same animation already live, so it does **not** solve the translation problem and adds a useless audio track + weight. Needs a **text-free/clean render** (preferred) or **three localized renders** from the animator before it's worth shipping. Do not treat this as "the fix."
- **`Binding Image.png`** — it's a **diptych** (two photos). Decide **single double-page spread vs split into two** before converting; then WebP, RGBA→RGB, 1600 px wide (optional WB nudge).

### ❓ MISSING / UNEXPECTED
- **Translation problem is NOT fixed** in the new process video (client may have believed it was) — still burnt-in English.
- **New AV is only 848×480 (SD)** — same low resolution as before; audio fixed, picture not upgraded (unexpected if an HD upgrade was assumed).
- **New AV is 70 MB** — unexpectedly huge; unusable until re-compressed.
- **"Binding Image.png" is actually two images**, not one — needs a layout decision.
- **Both PNGs carry a redundant 100%-opaque alpha channel** inflating their size.
- **No new posters/captions** were supplied for either video — the existing `*-poster.jpg` / `.vtt` / `-thumb.webp` are reused (fine, since the AV is the same edit).
- **The corporate-AV single-film slot no longer exists on the `/infrastructure` page** (replaced by the YouTube grid). The live slot for the AV is the **homepage Infrastructure section** (`facilities.mp4`).
- **Nothing missing from the zip** — all three promised files present and matching the stated sizes; no surprise extras.

---

*Analysis artifacts (extracted frames, previews) are in `./_assets-in2/` and the session scratchpad. No repo files were modified.*
