# 🧰 Jack Roberts Video Stack — Deep Research Addendum
### Everything from the video description, researched & verified
*Researched July 2026 · Companion file to claude-design-skills-arsenal.md*

---

## 🎙️ The Creator Connection

**Glaido** — https://glaido.com (built by Jack Roberts himself)
- His own product: macOS voice-to-text dictation. Press a hotkey, speak into any app (Gmail, Slack, Cursor, ChatGPT, Claude Code).
- AI auto-editing: removes filler words ("um", "uh"), fixes grammar/punctuation in real time, handles self-corrections, adapts tone per app.
- "Agent Mode" for AI-assisted workflows; 100+ languages; custom dictionaries; local storage for privacy.
- Pricing: Free (2,000 words/week, no credit card) → Pro $20/month (unlimited, priority processing).
- macOS-only for now (Windows/Linux "coming soon").
- Why it matters: this is how he dictates long, detailed prompts fast — voice is ~5x faster than typing for prompt-heavy Claude Code workflows.

**"ALL Systems" / Agentic OS (Level 7 link)** — bit.ly/4kol0y5
- His paid system/community product — the monetization layer of the video. Not a public tool; the free equivalents of what it teaches are all catalogued below and in the arsenal file.

---

## 🎨 NEW Level 3 Skills (not in the original arsenal)

**shadcn skill (OFFICIAL)** — shadcn-ui/ui `/skills/shadcn/` (~118k ⭐ repo, ~219K skill installs)
- shadcn's official agent skill, shipped with CLI v4 (March 2026). Lives in the main monorepo.
- Project-aware: on every interaction runs `shadcn info --json` to read your framework, Tailwind version, aliases, base library (Radix vs Base UI), icon library, and installed components — so code is correct on the first try.
- Covers: CLI usage + flags, presets (nova, vega, maia, lyra, mira, luma), registry authoring, forms (FieldGroup/Field/InputGroup), composition rules, semantic colors, dark mode, dry-run/diff smart merging of upstream updates.
- Multi-registry aware: @shadcn, @magicui, @tailark, community presets. You can prompt: *"find me a hero from tailark, add it to the homepage, animate the text using an animation from react-bits"* — Level 5 UI sniping built into a Level 3 skill.
- Install: `npx skills add shadcn/ui` (or `npx shadcn@latest mcp init` for the companion MCP)
- Docs: https://ui.shadcn.com/docs/skills · Repo: https://github.com/shadcn-ui/ui/tree/main/skills/shadcn
- Community companion: **mattbx/shadcn-skills** — discovers 1,500+ existing ecosystem components before building custom + post-hoc audits against shadcn patterns.

**GSAP Skills (OFFICIAL)** — greensock/gsap-skills (~10.9k ⭐)
- Official AI skills from the GreenSock team. Teach agents correct GSAP usage: core API (to/from/fromTo, easing, stagger, matchMedia), timelines, ScrollTrigger, plugins, React/Vue/Svelte/vanilla, and performance.
- Modular skills: gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-react, gsap-plugins, gsap-utils, gsap-performance (60fps rules: transforms/opacity only, avoid layout thrashing, gsap.quickTo()).
- HUGE context: GSAP is now 100% FREE including every formerly-paid Club plugin (SplitText, MorphSVG, ScrollSmoother, Draggable…) after Webflow's acquisition. Public npm, no auth tokens.
- Install: `npx skills add https://github.com/greensock/gsap-skills` or `/plugin marketplace add greensock/gsap-skills`
- Pairs perfectly with Taste Skill (which ships GSAP code skeletons).

**Awesome Design Skills** — bergside/awesome-design-skills (~1.4k ⭐)
- A curated REGISTRY (not just a list) of 67 design system skill files: glassmorphism, brutalism, minimal, dashboard, and more.
- Each skill = folder with SKILL.md (AI-agent instructions: tokens, component rules, WCAG 2.2 AA accessibility, quality gates) + DESIGN.md (human-readable design intent & rationale).
- Pull any skill with one command: `npx typeui.sh pull <slug>` (e.g. `npx typeui.sh pull glassmorphism`) · browse: `npx typeui.sh list`
- Preview all skills at typeui.sh/design-skills · Also available as TypeUI MCP for Claude/Cursor/Codex.
- Level 7 crossover: the same Bergside org ships **Chrome/Firefox/Edge extensions** (design-md-chrome etc.) that extract styles from any live website and generate DESIGN.md/SKILL.md — one-click design extraction, no terminal.
- Repo: https://github.com/bergside/awesome-design-skills

**Anthropic frontend-design** — (already in arsenal; video links the claude-code plugins path)
- Plugin path: https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design
- Install: `/plugin marketplace add anthropics/claude-code` → frontend-design

**UI/UX Pro Max** — (already in arsenal, see companion file)
- Repo: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

---

## 📸 Level 2 — Screenshots & References (complete gallery map)

| Site | URL | Best for |
|---|---|---|
| **Godly** | godly.website | Most visually impressive sites on the internet — exceptional animation, scroll effects, visual storytelling. Extremely high bar (3–5 new/week) |
| **Awwwards** | awwwards.com | Most prestigious award platform; jury-judged on design, usability, creativity, content. Cutting-edge, daily selections |
| **Land-book** | land-book.com | Curated gallery updated daily; strongest for landing pages |
| **Dribbble** | dribbble.com | Visual direction: palettes, typography, composition, illustration styles (less useful for UX patterns) |

Workflow: screenshot 3–5 references → drop into Claude Code as a mood board → "update the design using these as reference" (show, don't tell).

---

## 🎬 Level 4 — OpenArt (image & video assets)

- Hosted MCP server: `https://mcp.openart.ai/mcp` — add as custom connector in Claude (Settings → Connectors), OAuth sign-in, no API keys.
- Image models: Nano Banana 2 / Pro, GPT Image 2, Seedream 4.5 / 5 Lite. Video models: Kling 3 Omni, Grok Imagine 1.5, Seedance 2.0, Wan 2.7, PixVerse V6.
- Agent auto-picks the model via structured metadata (modality, task fit, cost, speed) or you name one. Async generation — results return to the chat + save to your OpenArt library.
- The video workflow he demos: generate a still frame → animate it into video (image-to-video) → embed the clip (e.g. rotating product shot) in the hero section.

---

## 🛍️ Level 5 — UI Sniping (component sources)

| Source | URL | What it is |
|---|---|---|
| **21st.dev** | 21st.dev | AI component platform + **Magic MCP** (`/ui` command): library-backed generation from a curated, pre-tested shadcn/Tailwind/Radix component library — doesn't hallucinate. Freemium (~$20/mo paid) |
| **Magic UI** | magicui.design | Open-source animated React + Tailwind component library (marquees, bento grids, shimmer buttons…). NOT the same as 21st.dev's Magic MCP. Now a shadcn registry (@magicui) — the official shadcn skill can pull from it directly |
| **CodePen** | codepen.io | Copy any public pen's HTML/CSS/JS, hand it to Claude for exact integration |
| **Mobbin** | mobbin.com | 600k+ real production screens & user flows from shipped apps — snipe UX patterns, not just visuals. Figma copy-paste |

---

## 🔥 Level 6 — Firecrawl (data & research)

- Official Claude plugin + MCP server. Six core tools: scrape, crawl, search, map, extract, agent (autonomous multi-source research).
- Turns any site into clean, LLM-ready markdown/JSON — JS rendering, anti-bot, proxy rotation built in. Up to ~80% token savings vs raw HTML.
- Install: `claude mcp add firecrawl -e FIRECRAWL_API_KEY=your-key -- npx -y firecrawl-mcp` (free tier: 10 scrapes/min, no card).
- His use case: "analyze the 10 most successful businesses in <niche> — extract their CTA placement, section order, and brand identity into a data-backed blueprint."

---

## 🚀 Core Software — Antigravity (the free harness)

**Google Antigravity** — antigravity.google (free public preview)
- Google's agent-first development platform: IDE (VS Code fork built by the ex-Windsurf team after Google's $2.4B deal) + CLI + SDK.
- Two views: **Editor** (normal IDE + agent sidebar) and **Manager/Mission Control** (dispatch multiple autonomous agents in parallel; each plans, codes, runs terminal commands, and drives a real Chrome browser to test its own work).
- Agents produce verifiable **Artifacts**: task lists, implementation plans, diffs, screenshots, browser recordings.
- Models: Gemini 3.x Pro/Flash default, plus Claude and GPT-OSS — switch per task.
- Supports the same Agent Skills ecosystem (progressive disclosure; global skills at `~/.gemini/config/skills/`). Every skill in the arsenal installs here too: `npx skills add <repo> --agent antigravity`.
- Why he lists it: the free alternative harness where the entire seven-level stack runs.

---

## ⌚️ The Video Structure (timestamps decoded)

| Time | Section | Stack used |
|---|---|---|
| 00:00 | Why Most Claude Sites Fail | — |
| 01:28 | L1: Grab And Go | naked prompt (≈3/100 quality) |
| 02:30 | L2: Screenshots & References | Godly, Awwwards, Land-book, Dribbble |
| 04:34 | L3: Design Skills (+result 07:23) | UI/UX Pro Max, frontend-design, shadcn, GSAP, awesome-design-skills |
| 08:43 | L4: Image & Video (OpenArt 08:54, frame→video 10:54) | OpenArt MCP |
| 12:35 | L5: UI Snapping | 21st.dev, Magic UI, CodePen, Mobbin |
| 14:40 | L6: Finding The Data (prompts 15:14) | Firecrawl |
| 17:25 | L7: Design Extraction (identity 18:22, rebuild 19:53, one-shot 20:32) | extractor + Claude Fable 5 |

---

## 🧠 Key Synthesis — The Levels Converge

The seven levels aren't separate tricks; they're one workflow with skills as the delivery format:
- **shadcn skill** bridges L3 ↔ L5 (a skill that snipes components from registries)
- **Bergside extensions** bridge L3 ↔ L7 (extraction that OUTPUTS a skill file)
- **GSAP skills** bridge L3 ↔ the motion layer (emil-design-eng, Taste Skill GSAP skeletons)
- **Firecrawl** feeds L7 (extraction needs scraped ground truth)
- **OpenArt MCP** feeds every level's asset gaps
- **Antigravity / Claude Code** are interchangeable harnesses — the skills travel

Full Level 3 catalog with the 20+ skill deep-dive lives in: **claude-design-skills-arsenal.md**
