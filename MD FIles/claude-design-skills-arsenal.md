# 🎨 Claude Code Design Skills Arsenal
### Level 3 Deep Research — The Complete Catalog
*Researched July 2026 · GitHub + skills.sh + last-month releases*

---

## 0. The Meta-Skill: Find Skills (install this FIRST)

**find-skills** — by Vercel Labs
- The skill that finds all other skills. When you ask "how do I do X," it searches the open agent skills ecosystem (skills.sh leaderboard + CLI search) instead of reinventing the wheel.
- Verifies quality before recommending: install counts (prefers 1K+), source reputation (vercel-labs, anthropics, microsoft), and GitHub stars (skeptical of repos under 100 stars).
- Install: `npx skills add vercel-labs/skills --skill find-skills`
- Link: https://skills.sh/vercel-labs/skills/find-skills

---

## 1. The One From the Video

**UI/UX Pro Max** — nextlevelbuilder/ui-ux-pro-max-skill (~88.7k–100k ⭐)
- The world's most popular community design skill. A reasoning engine, not just instructions: analyzes your project and auto-generates a complete design system.
- Contents: 50–67 UI styles (glassmorphism, claymorphism, brutalism, neumorphism, Swiss, bento…), 161 color palettes aligned to product categories, 57 font pairings with Google Fonts imports, 99 UX guidelines, 25 chart types, up to 16 tech stacks.
- How it works: 5 parallel multi-domain searches → BM25-ranked reasoning engine → industry anti-pattern filtering → code generation → pre-delivery checks.
- Killer feature: `--design-system --persist` writes `design-system/MASTER.md` (global source of truth) + page-level override files.
- Recent: auto-registers in the Claude Code /skills marketplace (updated this month).
- Install: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`
  or `npm install -g ui-ux-pro-max-cli && uipro init --ai claude`
- Repo: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

---

## 2. The Generators (build beautiful from scratch)

**frontend-design** — anthropics/skills (277K+ installs, the canonical starting point)
- Anthropic's official anti-"AI slop" skill. Forces Claude to commit to a bold aesthetic direction (brutalist, editorial, maximalist, retro-futuristic, art deco) BEFORE writing code.
- Bans generic fonts: Inter, Roboto, Arial, Space Grotesk. Bans generic SaaS card grids and purple gradients.
- Install: `npx skills add anthropics/skills --skill frontend-design` or `/plugin marketplace add anthropics/claude-code` → frontend-design
- Link: https://skills.sh/anthropics/skills/frontend-design

**Taste Skill** — Leonxlnx/taste-skill (~31.7k ⭐, v2 actively iterating right now)
- "The Anti-Slop Frontend Framework." Suite of 11 specialized variants + 3 image-generation skills.
- The 3-dial equalizer system: DESIGN_VARIANCE (1–10), MOTION_INTENSITY (1–10), VISUAL_DENSITY (1–10).
- v2 reads your brief, infers the design language, tunes the dials; ships canonical GSAP skeletons + a redesign-audit protocol + strict pre-flight check.
- Notable sub-skills (installs): design-taste-frontend (102.8k), high-end-visual-design (87.4k), redesign-existing-projects (85.5k), minimalist-ui (80.1k), industrial-brutalist-ui (74.4k), gpt-taste (64.4k), image-to-code (53.3k), brandkit (51.5k).
- Install: `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`
- Site: https://www.tasteskill.dev · Repo: https://github.com/Leonxlnx/taste-skill

**Impeccable** — pbakaus/impeccable (by Paul Bakaus; v3.0 shipped recently)
- The most complete design *system* for AI harnesses. One skill, 23 commands: /impeccable audit, polish, critique, distill, animate, bolder, quieter, colorize, typeset, harden, optimize, extract, live, and more.
- `/impeccable init` interviews you and writes PRODUCT.md + DESIGN.md so every later command knows audience, voice, brand colors, anti-references.
- Unique idea: brand vs product "registers" — marketing pages and dashboards live by contradictory rules, so commands adapt their vocabulary.
- 45 deterministic detector rules (no LLM needed) + Chrome extension that highlights AI-slop anti-patterns on any live page + CI-ready CLI (`npx impeccable detect`).
- Install: `/plugin marketplace add pbakaus/impeccable` or `npx skills add pbakaus/impeccable`
- Site: https://impeccable.style · Repo: https://github.com/pbakaus/impeccable

**frontend-design (8 anchors)** — Ilm-Alan/frontend-design
- Eight aesthetic anchors, each locking palette, typefaces, and texture to specific CSS tokens. Picking an anchor commits to tokens, not a vibe — if rendered tokens drift, the anchor didn't hold.
- Install: `git clone https://github.com/Ilm-Alan/frontend-design.git ~/.claude/skills/frontend-design`

**distinctive-frontend** — Koomook/claude-frontend-skills
- Four-dimensional approach: extreme font weights (100–200 vs 800–900), color systems from cultural references (Cyberpunk, Brutalist, Vaporwave, Nordic), orchestrated staggered page-load animations, layered atmospheric backgrounds.
- Repo: https://github.com/Koomook/claude-frontend-skills

**awesome-claude-design** — rohitg00/awesome-claude-design (~704 ⭐)
- 9 distinct aesthetic families as ready-made DESIGN.md files, optimized for Claude Design; also works in Claude Code as an extra system prompt. Pick the closest to your project, paste, go.
- Repo: https://github.com/rohitg00/awesome-claude-design

**Bencium UX Designer skills** — (~273 ⭐)
- Two variants of the same skill: "Innovative UX Designer" (bold, experimental) vs "Controlled UX Designer" (consistency, standards). Pick per project mood.

---

## 3. The Taste & Motion Layer (make it FEEL expensive)

**emil-design-eng** — emilkowalski/skill 🔥 NEW (released days ago)
- Emil Kowalski (Sonner, Vaul, animations.dev) packaged his entire design-engineering philosophy into three skills: strict animation review criteria, a motion-vocabulary translator, and implementation rules.
- Hard rules: UI animations under 300ms; exits ~20% faster than entrances; never `transition: all`; entries from scale(0.95)+opacity, never scale(0); no animation on keyboard-triggered actions; disable motion on actions repeated 100+ times daily; `ease-out` over `ease-in`; hover animations gated behind `@media (hover: hover)`.
- Companion skill: review-animations (run it after building).
- Install: `npx skills add https://github.com/emilkowalski/skill --skill emil-design-eng`
- Site: https://emilkowal.ski/skill

**UI Skills collection** — ui-skills.com
- A whole family of focused design-engineering skills: `deslop` (fast spacing/hierarchy/typography cleanup), accessibility audit/fix, animation-performance audit (layout thrashing, compositor props, scroll-linked motion), CSS transition pattern library, interface-design (dashboards/admin/SaaS craft), premium landing pages, Lottie generation, plus a router skill that picks the smallest useful set per task.
- Start: `npx ui-skills start` · Site: https://www.ui-skills.com

**design-motion-principles**
- Motion expertise through three lenses (Emil Kowalski, Jakub Krehel, Jhey Tompkins). Two modes: build purposeful motion, or audit existing animations for AI-slop patterns (pulsing indicators, blur-everywhere entrances, motion on text that serves no purpose) — audit emits a branded HTML report with looping demos.

---

## 4. The Quality Gates (audit before you ship)

**web-design-guidelines** — vercel-labs/agent-skills (~19.5k ⭐)
- Audits UI code against Vercel's Web Interface Guidelines; fetches the latest rules from a remote source before every review so it never goes stale; outputs terse `file:line` findings.
- skills.sh's own framing: use this for *correctness*, use Impeccable-style skills for *taste*.
- Install: `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`

**vercel-composition-patterns** — vercel-labs/agent-skills
- Kills boolean-prop proliferation; teaches compound components, context providers, explicit variants, React 19 patterns. Keeps sniped/generated components architecturally clean.

**vercel-react-best-practices** — vercel-labs/agent-skills (185K installs)
- Dense React/Next.js rules pack: performance, data fetching, server components — each rule with bad/good examples for opinionated reviews.

**baseline-ui + fixing-accessibility pipeline**
- Three-skill sequence to run after generation: 1) /frontend-design generates → 2) /baseline-ui fixes spacing, typography, states → 3) /fixing-accessibility handles keyboard, labels, focus, semantics.

**Web performance skill pack** — by the Google web-performance author
- Five skills: Core Web Vitals (LCP, INP, CLS), accessibility (WCAG 2.1), SEO, best practices, plus an orchestrator for full-site audits. Framework-aware: Next.js, Vue/Nuxt, Svelte, plain HTML.

---

## 5. The Extraction Layer (Level 7 crossover — steal design DNA)

**extract-design-system** — arvindrk/extract-design-system
- Reverse-engineers design tokens (colors, typography, spacing, border radius, shadows) from any public website via Playwright → W3C-compatible tokens.json + tokens.css. Available as skill, CLI, and MCP server.
- Prompt: "Extract the design system from https://stripe.com and generate starter token files for this project."
- Repo: https://github.com/arvindrk/extract-design-system

**design-extract / designlang** — Manavarya09/design-extract (~3.4k ⭐)
- The beast. One command emits 17+ files: DTCG tokens, Tailwind v4 config, shadcn theme, Figma variables, motion tokens, component anatomy, brand voice, plus layout patterns, responsive behavior across 4 breakpoints, hover/focus/active states, WCAG contrast scoring.
- Site-wide crawl mode elects tokens by coverage across pages; fidelity mode pixel-diffs your clone against the original (visual + motion).
- Claude Code plugin with 5 slash commands: /extract, /grade, /battle, /remix, /pack.
- Repo: https://github.com/Manavarya09/design-extract

---

## 6. Workflow & Orchestration (honorable mentions)

**Superpowers** — obra/superpowers (~40.9k ⭐)
- The biggest community skill library. Full lifecycle chain: brainstorming → git worktree setup → implementation planning → subagent execution → TDD → code review before merge.

**7-skill professional design workflow**
- requirements gathering → design brief → information architecture → design tokens → task decomposition → frontend generation → review. The requirements skill stress-tests your input with 20+ minutes of questions before a single line of code — spec-first, like seniors work.

**Claude-Code-Frontend-Design-Toolkit** — wilwaldon (curated index)
- "Everything that actually makes Claude Code output better-looking frontends" — skills, plugins, MCP servers, CLAUDE.md tricks, organized by goal. Great discovery hub.
- Repo: https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit

**awesome-claude-skills** — travisvn/awesome-claude-skills (curated index)
- Broad curated list of skills + resources across the whole ecosystem.

---

## 🧠 The Stacking Strategy (how to combine)

Skills stack — but generators fight each other. The winning formula:

1. **ONE generator** — UI/UX Pro Max *or* Taste Skill *or* Impeccable (not all three)
2. **ONE taste/motion layer** — emil-design-eng (+ review-animations)
3. **ONE audit gate** — web-design-guidelines *or* /impeccable critique
4. **Extraction on demand** — design-extract when cloning a reference site's DNA
5. **find-skills on top** — so Claude discovers whatever ships next week

---

## 📅 What Moved in the Last Month (June–July 2026)

- **emil-design-eng** — brand new, released days ago
- **Taste Skill v2** — substantial rewrite, new default, actively iterating toward v2.0.0 stable
- **UI/UX Pro Max** — now auto-registers in the Claude Code /skills marketplace; i18n cleanup
- **Impeccable v3.0** — consolidated 18 standalone skills into one /impeccable with 23 commands + design hooks that auto-run the detector on UI file edits
