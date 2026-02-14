# Design Forge Skill — Implementation Plan (v2 — Post-Critique)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the ultimate frontend design skill ("Design Forge") that replaces design-superagent and integrates 8+ free AI tools into a 10-phase pipeline.

**Architecture:** Split skill — main `SKILL.md` (~1,200 lines) in `~/.claude/skills/design-forge/` plus 4 reference files in `reference/` loaded on-demand. Main file handles pipeline orchestration; reference files contain code libraries and prompt templates.

**Tech Stack:** Claude Code skill (Markdown), MCP integrations (Gemini, Nano Banana, Fal.ai, Figma, Penpot, Excalidraw, Stable Diffusion, ComfyUI), Next.js + React + Tailwind v4

**Design Doc:** `docs/plans/2026-02-14-design-forge-design.md`

**Changes from v1:** MCP names corrected, Canva removed (no npm package), split file architecture, 3 audit personas (not 5), real dark mode, technique selection logic, error recovery, portfolio learning algorithm, design decision log, validation plan, smarter font pairing.

---

### Task 1: Create Skill Directory Structure + Frontmatter

**Files:**
- Create: `~/.claude/skills/design-forge/SKILL.md`
- Create: `~/.claude/skills/design-forge/reference/` (empty directory)

**Step 1: Create directories**

```bash
mkdir -p /Users/MAC/.claude/skills/design-forge/reference
```

**Step 2: Write the SKILL.md frontmatter + overview section**

Write the skill frontmatter (name, description, trigger phrases) and the overview section.

**Content to include:**
- Frontmatter with name `design-forge` and comprehensive trigger phrases
- Overview paragraph (what it is, how it works)
- 10-phase pipeline diagram (ASCII)
- Stack assumptions (Next.js, React 19, Tailwind v4, CSS-only animations, Google Fonts)
- Free tool integration table (8 tools — NO Canva):
  - Gemini: `@rlabs-inc/gemini-mcp`
  - Nano Banana: `@nanana-ai/mcp-server-nano-banana`
  - Fal.ai: `fal-ai-mcp-server`
  - Figma: Official Figma MCP
  - Penpot: `penpot-mcp-server`
  - Excalidraw: `excalidraw-mcp-server` (optional)
  - Stable Diffusion: `sd-webui-mcp` (local)
  - ComfyUI: `claude-comfyui-mcp` (local)
  - + Playwright, Chrome DevTools, Vercel, Context7 (already installed)
- Fallback chain explanation
- Split file architecture note: "Reference files are loaded on-demand per phase"

**Step 3: Verify skill loads**

```bash
# Restart Claude Code or check that the skill appears in /skills list
```

**Step 4: Commit**

```bash
git add /Users/MAC/.claude/skills/design-forge/SKILL.md
git commit -m "feat(skill): design-forge — frontmatter + overview"
```

---

### Task 2: Write Phase 0 — Detect & Route + Auto-Install

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 0 content**

From design doc:
- Step 0A: Detect Starting Point (5 checks)
- Step 0B: Detect Available MCPs (test each — NO canva in the list)
- Step 0C: Auto-Install Missing MCPs (corrected package names: `fal-ai-mcp-server`, `excalidraw-mcp-server`)
- Step 0D: Scaffold (if blank folder)
- Step 0E: Present Pipeline
- Phase 0 Verification Checklist

**Step 2: Commit**

```bash
git add SKILL.md
git commit -m "feat(skill): design-forge Phase 0 — detect & route + auto-install"
```

---

### Task 3: Write Phase 1 — Research & Inspire

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 1 content**

- Step 1A: Design Showcase Research (Awwwards, Godly, Dribbble, etc. + Gemini prompt template)
- Step 1B: Learn From User's Portfolio — **use the concrete 4-step algorithm**:
  1. Locate portfolio project
  2. Read specific files (globals.css, layout.tsx, tailwind config, landing page, 2-3 components)
  3. Build Style DNA Profile (colors, typography, layout, motion, signature moves, quality ceiling)
  4. Set the bar (present findings + target tier+1)
- Step 1C: Competitor Analysis (Gemini-powered with fallback)
- Step 1D: Content Inventory
- Step 1E: Technical Constraints
- Step 1F: Screenshot Baseline
- Phase 1 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 1 — research & inspire"
```

---

### Task 4: Write Phase 2 — Design System Generation

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 2 content**

- Step 2A: Color Psychology Engine (industry → palette table, 5 shades, semantic aliases)
- Step 2B: Font Pairing Intelligence — **smarter version**:
  - Check existing fonts first (layout.tsx)
  - Max 2 font families (performance: <100KB)
  - Selection logic: existing fonts → personality table → palette mood match
- Step 2C: Spacing & Layout Tokens
- Step 2D: Dark Mode Architecture — **real dark mode** with 6 beyond-colors changes:
  - Shadows differ (light uses shadow, dark uses light-edge glow)
  - Image brightness reduction
  - Accent intensity bump
  - Theme-specific gradients
  - Glassmorphism adjustments
  - Depth via elevation (lighter bg in dark) vs shadows (in light)
- Dark mode checklist (6 items)
- Phase 2 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 2 — design system generation"
```

---

### Task 5: Write Phase 3 — AI Mockup Generation

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 3 content**

- Step 3A: Create Mockup Prompts
- Step 3B: Generate Mockups (Nano Banana → Fal.ai → skip)
- Step 3C: Present to User
- Phase 3 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 3 — AI mockup generation"
```

---

### Task 6: Write Phase 4 — AI Asset Generation

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 4 content**

- Step 4A: Identify Needed Assets
- Step 4B: Generate Assets (prompt patterns)
- Step 4C: Optimize Assets
- Step 4D: Save to Project
- Phase 4 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 4 — AI asset generation"
```

---

### Task 7: Write Phase 5 — Design Variations (Orchestration Only)

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**IMPORTANT:** Phase 5 orchestration goes in SKILL.md, but the actual code libraries go in reference files (Tasks 15-17). SKILL.md should contain:

- **Technique Selection Logic** (the industry → technique table + algorithm)
- Enhanced Variation Brief Template (with image strategy + micro-interactions)
- Variation Diversity Checklist (6 axes)
- Agent Spawn Pattern (all 5 in ONE message)
- Instructions to "Load `reference/techniques.md` and `reference/micro-interactions.md` into each agent prompt"
- Instructions to "Load `reference/philosophies.md` for philosophy assignment"
- Phase 5 Verification Checklist
- Error Recovery for agent failures

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 5 — variation orchestration"
```

---

### Task 8: Write Phase 6 — Preview & Select

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 6 content**

- Step 6A: Serve HTML Files
- Step 6B: Screenshot Each Variation (dark + light modes)
- Step 6C: Present to User (5 decision options)
- Step 6D: Hybrid Generation
- Phase 6 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 6 — preview & select"
```

---

### Task 9: Write Phase 7 — Implement (Next.js)

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 7 content**

- Senior-Level Code Standards
- Steps 7A-7J (read everything → plan → scope CSS → Tailwind v4 → scroll fix → React structure → images → globals.css → layout.tsx → verify)
- Phase 7 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 7 — implement in Next.js"
```

---

### Task 10: Write Phase 8 — Refine (Senior Dev Loop)

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 8 content**

- 10-step refinement loop (8A-8J)
- Loop instruction: fix → re-check → loop until all pass

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 8 — senior dev refinement loop"
```

---

### Task 11: Write Phase 9 — Deploy + Competitive Scorecard

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 9 content**

- Step 9A: Git Commit + Vercel Deploy
- Step 9B: Before/After Comparison
- Step 9C: Competitive Visual Scorecard — **uses Playwright** (not Gemini):
  1. Screenshot competitors with Playwright at desktop + mobile
  2. Analyze with Claude's vision (compare screenshots)
  3. Generate 7-dimension scorecard + gap analysis
- Error Recovery
- Phase 9 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 9 — deploy + competitive scorecard"
```

---

### Task 12: Write Phase 10 — Scale-Up Audit (3 Personas)

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write Phase 10 content**

- Phase 10a: Discovery
- Phase 10b: Screenshot Sweep
- Phase 10c: 3-Persona Parallel Critique (NOT 5):
  - Agent 1: The Design Critic (Designer + Brand Strategist merged)
  - Agent 2: The Technical Reviewer (Developer + Accessibility merged)
  - Agent 3: The User (standalone — most important perspective)
  - Instructions to "Load `reference/personas.md` for full prompt templates"
- Phase 10d: Synthesis
- Phase 10e: Prioritize
- Phase 10f: Present & Decide
- Audit → Redesign Loop (loop until all pages score B+)
- Phase 10 Verification Checklist

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge Phase 10 — 3-persona scale-up audit"
```

---

### Task 13: Write Error Recovery + Decision Log + Quick Reference

**Files:**
- Modify: `~/.claude/skills/design-forge/SKILL.md`

**Step 1: Write cross-cutting sections**

- **Error Recovery & Escape Hatches** (from design doc):
  - Global escape commands (skip, restart, abort, pause)
  - Per-phase error handling table (11 rows)
  - State preservation / checkpoint strategy
- **Design Decision Log** format and instructions
- **Quick Reference** trigger → action table
- **Key Lessons** (10 rules)
- **Technical Notes** (stack, restructuring authority, build commands)

**Step 2: Commit**

```bash
git commit -m "feat(skill): design-forge — error recovery, decision log, quick reference"
```

---

### Task 14: Write reference/techniques.md

**Files:**
- Create: `~/.claude/skills/design-forge/reference/techniques.md`

**Step 1: Write the full Visual Mastery Techniques Library**

Pull from design doc — all CSS code snippets:
- Background Image Blending (gradient+image, blend modes, duotone)
- Image Masking & Clipping (gradient mask, clip-path, animated clip-path, text-image-fill)
- Parallax & Depth (CSS parallax, Ken Burns)
- Texture & Atmosphere (noise overlay, glassmorphism, mesh gradient, light leak)
- Color Grading (CSS filter chains, SVG color matrix)

**Step 2: Commit**

```bash
git add reference/techniques.md
git commit -m "feat(skill): design-forge reference — visual mastery techniques"
```

---

### Task 15: Write reference/micro-interactions.md

**Files:**
- Create: `~/.claude/skills/design-forge/reference/micro-interactions.md`

**Step 1: Write all 30+ micro-interactions**

Pull from design doc:
- CSS-only: All 26 CSS animations (button, card, input, scroll, nav, loading)
- JS-powered: All 7 JS interactions (magnetic hover, 3D tilt, cursor glow, counter, scroll progress, scroll reveals, parallax)
- Init function

**Step 2: Commit**

```bash
git add reference/micro-interactions.md
git commit -m "feat(skill): design-forge reference — micro-interactions library"
```

---

### Task 16: Write reference/philosophies.md

**Files:**
- Create: `~/.claude/skills/design-forge/reference/philosophies.md`

**Step 1: Write all 13 variation philosophies**

Pull from design doc:
Swiss Vault, Dark Kinetic, Editorial Magazine, Data Dashboard, Luxury Minimal, Brutalist Raw, Organic Flow, Retro-Futurist, Neomorphic Glass, Cinematic Hero, Photographic Immersive, Layered Glass, Cinematic Split

Each with: name, core idea, key techniques, font approach, color approach, image approach.

**Step 2: Commit**

```bash
git add reference/philosophies.md
git commit -m "feat(skill): design-forge reference — 13 variation philosophies"
```

---

### Task 17: Write reference/personas.md

**Files:**
- Create: `~/.claude/skills/design-forge/reference/personas.md`

**Step 1: Write 3 audit persona prompts**

Pull from design doc:
- The Design Critic (Designer + Brand Strategist merged)
- The Technical Reviewer (Developer + Accessibility merged)
- The User

Each with: full prompt template, focus areas, questions to answer, rating scale, output format.

**Step 2: Commit**

```bash
git add reference/personas.md
git commit -m "feat(skill): design-forge reference — 3 audit personas"
```

---

### Task 18: Remove Old design-superagent + Final Verification

**Files:**
- Delete: `~/.claude/skills/design-superagent/SKILL.md`
- Delete: `~/.claude/skills/design-superagent/` (directory)

**Step 1: Verify Design Forge is complete**

Read the full SKILL.md and all reference files. Verify:
- [ ] All 10 phases present in SKILL.md
- [ ] Frontmatter has correct trigger phrases
- [ ] MCP integration table (8 tools, corrected names, NO Canva)
- [ ] Auto-install commands with correct package names
- [ ] Technique selection logic (industry → technique table)
- [ ] Error recovery + escape hatches
- [ ] Design decision log format
- [ ] Real dark mode (6 beyond-colors changes)
- [ ] Smarter font pairing (check existing, performance budget)
- [ ] Concrete portfolio learning algorithm (4 steps)
- [ ] 3 audit personas (not 5)
- [ ] Competitive scorecard uses Playwright (not Gemini)
- [ ] Reference files load on-demand instructions present
- [ ] All 4 reference files exist and are complete
- [ ] Fallback chains for every MCP

**Step 2: Run validation test**

Test the skill loads:
```bash
# Restart Claude Code
# Say "design forge" and verify skill activates
```

**Step 3: Remove old skill**

```bash
rm -rf /Users/MAC/.claude/skills/design-superagent
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(skill): design-forge complete — ultimate frontend design skill

Replaces design-superagent with comprehensive 10-phase pipeline.
Integrates 8+ free AI tools (Gemini, Nano Banana, Fal.ai, Figma, Penpot, etc.)
Split architecture: main SKILL.md + 4 on-demand reference files.
Adds: AI mockups, asset generation, design system generator, visual mastery library,
micro-interaction library, senior refinement loop, 3-persona audit, competitive scorecard,
error recovery, design decision log, portfolio learning algorithm."
```

---

## Implementation Notes

- **Total estimated skill size**: ~2,650 lines across 5 files
  - SKILL.md: ~1,200 lines (pipeline orchestration)
  - reference/techniques.md: ~600 lines
  - reference/micro-interactions.md: ~400 lines
  - reference/philosophies.md: ~300 lines
  - reference/personas.md: ~150 lines
- **Tasks**: 18 (sequential — each builds on the previous)
- **The design doc** at `docs/plans/2026-02-14-design-forge-design.md` contains the full content for each phase.
- **No code to test** — this is a skill file (Markdown), not application code. Testing = verifying the skill loads and trigger phrases work.
- **The skill itself IS the deliverable** — when complete, invoking `/design-forge` or saying "design forge" triggers the full pipeline.
- **v2 changes from v1**: Split architecture, corrected MCP names, removed Canva, 3 personas, real dark mode, technique selection, error recovery, decision log, validation plan, smarter font pairing, concrete portfolio algorithm.
