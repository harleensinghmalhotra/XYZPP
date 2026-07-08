# 🧨 INSTALL KIT 2 — The 3D Arsenal
### Every 3D web-design skill published on GitHub in the last 30 days (June 6 – July 6, 2026)
*Scanned directly via GitHub's API · Companion to MASTER-INSTALL-KIT.md*
*Mission: fix the "minus 78" — real 3D, real assets, agents that look at their own work*

---

## 🥇 OPTION A — One-Paste Install (run in Claude Code at project root)

```
Install the following agent skills into this project. Run each command, confirm success, skip and report any that fail, and give me a final report:

1. npx skills add gkren22/cinematic-3d-website
2. npx skills add gkren22/procedural-3d-realism
3. npx skills add kuuneruasobu/3d-scroll-website
4. npx skills add praveentewatia26/award-grade
5. npx skills add skinnye/3d-web-pack
6. npx skills add satishTheLegend/universal-designer
7. npx skills add majidmanzarpour/threejs-game-skills --skill '*'
8. npx skills add scottstts/Threejs-Awesome-Graphics-Agent-Skills
9. npx skills add linegel/threejs-complete-set-of-skill
10. npx skills add harshavarma02/zero-jank-scroll-agent-skill
11. npx skills add iart-ai/webgl-animation-skills
12. npx skills add iart-ai/web-animation-skills
13. npx skills add IPedrax/motion-ui
14. npx skills add fabiofranco85/design-agent-kb
15. npx skills add rgzn7/stunning-landing-page

Then junction anything that landed only in .agents\skills into .claude\skills (same fix as last time), and list the final skill count.
```

⚠️ Reminder from last session: on Windows the symlink step fails silently — the junction fix (`cmd /c mklink /J`) is required, Claude Code already knows the drill.

---

## 🏆 TIER 1 — Built for the Book Website (install these no matter what)

**cinematic-3d-website** — gkren22 (published July 2)
- Award-tier cinematic 3D scroll-driven websites — "sites where the WebGL/WebGPU world IS the site."
- Scroll scrubs a choreographed camera through the scene; GPU particles condense into figures and logos; godrays, bloom, film grain, per-section color grades; layered sound design.
- 9-step build order from empty repo → shipped experience. Lenis smoothed scroll + Theatre.js/GSAP master timeline. Quality bar reference: hashgraphvc.com.
- THIS is the soda-can experience packaged as a skill.
- `npx skills add gkren22/cinematic-3d-website`

**3d-scroll-website** — kuuneruasobu (June 16)
- Apple-style scroll-driven IMAGE SEQUENCE landing pages **from a video**: video → JPG frames (ffmpeg) → scroll scrubs the frames.
- Ships a single-file production template + usage guide (speed, captions, frame count).
- The exact pipeline for us: Nano Banana video of the XYZ book → frames → living 3D book on scroll. Zero WebGL risk, works everywhere.
- `npx skills add kuuneruasobu/3d-scroll-website`

**award-grade** — praveentewatia26 (July 2)
- "An award-grade AI design agency as composable Claude skills — with an adversarial judge that can REFUSE TO SHIP."
- 8 skills: wow-director (entry point / creative director), signature-interactions, motion-choreography, webgl-shader-fx, design-dna-forge (extract a reference's DNA then diverge into an original), video-motion-studio + more.
- Thesis: "wow is one loud idea, ten quiet perfect decisions, a 60fps floor."
- The judge = the anti-minus-78 machine.
- `npx skills add praveentewatia26/award-grade`

**3d-web-pack** — skinnye (June 14)
- "The Claude Code pack for building award-style 3D websites — end to end." 6 agents + 4 skills: architecture → scene code → shaders → motion → performance → assets.
- Three.js r160+, R3F, WebGPU, GSAP. The repo's own landing page is built with the pack (live demo: skinnye.github.io/3d-web-pack).
- `npx skills add skinnye/3d-web-pack`

**universal-designer** — satishTheLegend (June 22)
- Meta-skill: ONE entry point for all frontend design, animation & 3D. Detects your stack, sets direction, routes to 24 specialist skills.
- The traffic controller — pairs with find-skills from Kit 1.
- `npx skills add satishTheLegend/universal-designer`

---

## 🎖️ TIER 2 — Three.js Firepower (the "actually 3D" layer)

**threejs-game-skills** — majidmanzarpour · ⭐766 in 3 weeks (June 14)
- The biggest new skills repo of the month. Self-contained skills for polished Three.js experiences: `threejs-game-director` routes gameplay, AAA-style graphics, UI, asset generation, audio, debugging, release QA.
- Game-flavored, but the graphics/QA/asset-generation skills are elite and transfer to websites. 5 live playable demos prove the output quality.
- `npx skills add majidmanzarpour/threejs-game-skills --skill '*'`

**Threejs-Awesome-Graphics-Agent-Skills** — scottstts · ⭐242 (June 19)
- Pure graphics excellence: mesh design, lighting, PBR materials, shaders, TSL/WebGPU, GLSL, post-processing, realism, stylization, particles, color management, tone mapping.
- Explicitly "brings the sophistication of good graphics and eliminates cheap hacks." Also on npm.
- Directly fixes "there was nothing 3D about it."
- `npx skills add scottstts/Threejs-Awesome-Graphics-Agent-Skills`

**threejs-complete-set-of-skill** — linegel (July 4 — 2 days old)
- 25 expert skills for ambitious Three.js WebGPU/TSL scenes: procedural oceans, clouds, planets, water optics, camera rigs, post-processing.
- Killer feature: **screenshot-backed visual validation** — the agent renders, looks at its own screenshot, and fixes what's ugly.
- Install: `git clone https://github.com/linegel/threejs-complete-set-of-skill` → copy `threejs-*` folders into `.claude/skills/` (start broad requests with `threejs-choose-skills`)

**procedural-3d-realism** — gkren22 (June 28)
- Photorealistic real-time 3D: procedural planets/terrain/water/clouds, ACES tone mapping, key/fill/rim lighting rig, cinematic post (bloom, grain, vignette), "expensive" frame-rate-independent motion.
- No build step, vendored Three.js — runs the same on any machine. Companion to cinematic-3d-website.
- `npx skills add gkren22/procedural-3d-realism`

---

## 🧰 TIER 3 — The Specialists

**zero-jank-scroll-agent-skill** — harshavarma02 (July 2)
- Builds AND audits smooth sticky scroll, scrollytelling, parallax — "without fragile 400vh tracks or per-frame framework rerenders." Has a live before/after demo + architecture benchmark.
- `npx skills add harshavarma02/zero-jank-scroll-agent-skill`

**webgl-animation-skills** — iart-ai (June 22)
- Two skills: shader-glsl (gradients, noise/fbm, SDFs, domain warping, image transitions) + threejs-animation (scenes, camera moves, GLTF clips, scroll-linked 3D, R3F, leak-free GPU disposal).
- `npx skills add iart-ai/webgl-animation-skills`

**web-animation-skills** — iart-ai (June 22)
- The 2D sibling: GSAP, SVG, Lottie, micro-interactions, page transitions, 60fps performance.
- `npx skills add iart-ai/web-animation-skills`

**motion-ui** — IPedrax (June 29)
- Installs Framer Motion CORRECTLY (compatibility gate: detects React/Next/Vite/Remix/Astro + package manager), then builds animated components from 21st.dev — uses Magic MCP when connected, built-in 21st-style recipes when not.
- The Framer Motion wish, as a skill.
- `npx skills add IPedrax/motion-ui`

**design-agent-kb** — fabiofranco85 (June 13)
- "The agent's brain" for award-caliber design systems (Awwwards/FWA/CSSDA targets). Six visual archetypes incl. **immersive-3d** and brutalist-editorial — pick one and it cascades into type/color/spacing/motion specs. CREATE / RE-CREATE from live site / MODIFY.
- `npx skills add fabiofranco85/design-agent-kb`

**stunning-landing-page** — rgzn7 (June 11)
- Cinematic scroll-driven single-file landing pages. Judges brand mood first, then writes the page "script." Live example gallery (coffee brand, dark devtool, playful kids, photo journal) — inspect quality before trusting.
- `npx skills add rgzn7/stunning-landing-page`

---

## 📝 Honorable Mentions (niche but noted)

- **ashely-looki/smooth-scroll-storytelling-skill** (June 29) — solomei.ai-style elastic smooth-scroll storytelling, native HTML/CSS/GSAP, no build
- **menervatripolska/awwwards-scrollama-scrollytelling-skill** (June 18) — Scrollama-based editorial scrollytelling
- **ma-ching-tse/edge-flare-skill** (June 12) — scroll-driven WebGL edge-flare image distortion gallery, zero-dependency
- **ccediland/web-stack-skills** (June 17) — premium high-performance sites: Astro 6 + Tailwind tokens + motion/WebGL/Rive
- **CybertronianKelvin/gsap-frontend-skill** (June 10) — standalone GSAP frontend skill
- **xomno01/IMOL2o** (June 28) — Vietnamese "2026-standard beautiful websites" skill: aesthetics + cinematic 3D/WebGPU + motion

---

## ⚔️ Conflict Warning (generals fight, soldiers don't)

Same rule as Kit 1 — don't let multiple "directors" lead one build:
- **Directors (pick ONE per project):** award-grade's wow-director · universal-designer · cinematic-3d-website's build order
- **Always-on soldiers:** graphics skills, zero-jank-scroll, motion-ui, GSAP skills, screenshot validation
- **Judges/audits (run AFTER building):** award-grade judge · /impeccable critique · web-design-guidelines

---

## 🧠 The Pattern of the Month

Every top repo from the last 30 days shares ONE idea: **the agent must look at its own work.**
- linegel → screenshot-backed visual validation
- award-grade → adversarial judge that refuses to ship
- threejs-game-skills → release verification + QA skill
- zero-jank-scroll → audit mode + before/after benchmark

That feedback loop is exactly what the blind chat mockup lacked. On the laptop, with these installed, every build gets seen, judged, and fixed BEFORE it reaches your eyes.

---

## 🎯 XYZ Printabilities — Recommended Loadout

1. **Director:** cinematic-3d-website (the scroll-journey architecture)
2. **The book itself:** 3d-scroll-website (Nano Banana video → frame sequence) — with webgl-shader-fx as the ambitious upgrade path
3. **Graphics polish:** Threejs-Awesome-Graphics + procedural-3d-realism (lighting, post-processing)
4. **Scroll quality:** zero-jank-scroll (build + audit)
5. **UI feel:** motion-ui (Framer Motion, done right)
6. **Final gate:** award-grade judge → /impeccable critique → ship
