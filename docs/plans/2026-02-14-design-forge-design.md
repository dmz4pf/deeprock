# Design Forge — Ultimate Frontend Design Skill

**Date**: 2026-02-14
**Status**: Design Complete — Awaiting Implementation
**Replaces**: `design-superagent` skill

---

## Executive Summary

Design Forge is a single Claude Code skill that takes ANY starting point (an idea, a blank folder, an existing codebase, or a Figma file) and produces agency-level, deployed frontend UIs using every free AI tool available. It integrates 9+ free MCP tools, generates AI mockups before coding, creates custom visual assets, implements with senior-level code quality, and refines through a multi-persona critique system.

It is the most comprehensive frontend design skill possible — combining research intelligence, AI image generation, design system creation, visual mastery (image blending, parallax, masking), micro-interaction libraries, dark mode architecture, competitive analysis, and iterative refinement into one orchestrated pipeline.

---

## Vision

The skill operates like a world-class design agency compressed into a single command:
1. A **Creative Director** researches trends and competitors
2. A **Visual Designer** generates mockups and mood boards with AI
3. An **Art Director** creates custom assets and imagery
4. **5 Senior Designers** each produce a radically different variation
5. A **Design Technologist** implements pixel-perfect in Next.js
6. A **QA Lead** refines across 10 dimensions
7. A **Brand Strategist** audits the entire app for coherence

---

## The Pipeline (10 Phases)

```
Phase 0:  Detect & Route        → Starting point? Which MCPs available? Auto-install missing ones
Phase 1:  Research & Inspire    → Gemini analysis + design showcase sites + competitor teardown + user portfolio study
Phase 2:  Design System         → Generate tokens, font pairings, color psychology, theme architecture
Phase 3:  AI Mockups            → Nano Banana/Fal.ai visual concepts for approval BEFORE coding
Phase 4:  AI Asset Generation   → Custom hero images, textures, icons, backgrounds
Phase 5:  Design Variations     → 5 parallel agents create HTML prototypes with visual mastery techniques
Phase 6:  Preview & Select      → Screenshot each, user picks winner/hybrid
Phase 7:  Implement             → Next.js + React + Tailwind v4 with senior-level code
Phase 8:  Refine                → 10-step senior dev refinement loop
Phase 9:  Deploy & Verify       → Vercel deploy + before/after + competitive scorecard
Phase 10: Scale-Up Audit        → Full-app coherence check with multi-persona critique
```

---

## Free Tool Integration

| Tool | MCP Server | Free? | Role in Pipeline |
|------|-----------|-------|-----------------|
| **Gemini** | `@rlabs-inc/gemini-mcp` | Yes (free tier) | Competitor analysis, design critique, visual understanding |
| **Nano Banana** | `@nanana-ai/mcp-server-nano-banana` | Yes (free tier) | AI mockup generation, concept art |
| **Fal.ai** | `fal-ai-mcp-server` | Yes (free tier) | 600+ AI models, image/video generation, asset creation |
| **Figma** | Official Figma MCP | Yes (free tier) | Design token extraction, component specs |
| **Penpot** | `penpot-mcp-server` | Yes (100% free) | Open-source design tool, Figma alternative |
| **Excalidraw** | `excalidraw-mcp-server` | Yes (100% free) | Wireframes, diagrams, quick sketches |
| **Stable Diffusion** | `sd-webui-mcp` | Yes (100% free, local) | Local AI image generation |
| **ComfyUI** | `claude-comfyui-mcp` | Yes (100% free, local) | Advanced local image workflows |
| **Playwright** | Already installed | Yes | Browser screenshots, interaction testing |
| **Chrome DevTools** | Already installed | Yes | Page snapshots, performance traces |
| **Vercel** | Already installed | Yes (free tier) | Deployment pipeline |
| **Context7** | Already installed | Yes | Up-to-date framework documentation |

**Fallback chain**: Every tool has a fallback. The skill ALWAYS works, even with zero MCPs connected (falls back to Claude's own capabilities + web research).

---

## Phase 0: Detect & Route

### Step 0A: Detect Starting Point

```markdown
Check 1: Is there a package.json? → Existing project
Check 2: Is there a Next.js app directory? → Existing Next.js project
Check 3: Is the directory empty? → Scaffold from scratch
Check 4: Did user provide a Figma URL? → Extract tokens first
Check 5: Did user just describe an idea? → Start from concept
```

**Routing table:**

| Starting Point | Actions |
|---------------|---------|
| Idea only | Scaffold Next.js → Full pipeline (Phases 0-10) |
| Blank folder | Scaffold Next.js → Full pipeline (Phases 0-10) |
| Existing Next.js project | Read architecture → Phases 1-10 |
| Existing other framework | Read architecture → Adapt pipeline to framework |
| Figma URL | Extract tokens → Phases 1-10 with Figma context |

### Step 0B: Detect Available MCPs

Check which MCP servers are connected:

```bash
# Test each MCP by attempting a minimal call
# If it responds → available
# If it errors → not connected
```

Build an `availableTools` map:
```markdown
- gemini: connected | not connected
- nanoBanana: connected | not connected
- falAi: connected | not connected
- figma: connected | not connected
- penpot: connected | not connected
- excalidraw: connected | not connected
- stableDiffusion: connected | not connected
- comfyui: connected | not connected
```

### Step 0C: Auto-Install Missing MCPs

For each missing MCP, offer to install:

```markdown
"I detected these tools are NOT connected:
- ❌ Gemini (enables AI competitor analysis)
- ❌ Nano Banana (enables AI mockup generation)
- ✅ Figma (already connected)
- ✅ Playwright (already connected)

Want me to install the missing ones? Each is free."
```

If user approves, run installation commands:

```bash
# Gemini — Get free API key from https://aistudio.google.com/
claude mcp add gemini -s user -- npx -y @rlabs-inc/gemini-mcp

# Nano Banana — Free tier at https://nanobanana.ai
claude mcp add nano-banana -s user -- npx -y @nanana-ai/mcp-server-nano-banana

# Fal.ai — Free tier at https://fal.ai
claude mcp add fal -s user -- npx -y fal-ai-mcp-server

# Penpot — 100% free at https://penpot.app
claude mcp add penpot -s user -- npx -y penpot-mcp-server

# Excalidraw — 100% free
claude mcp add excalidraw -s user -- npx -y excalidraw-mcp-server
```

### Step 0D: Scaffold (If Blank Folder)

If starting from scratch, scaffold a complete Next.js project:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install --legacy-peer-deps
npx shadcn@latest init
```

Configure Tailwind v4 (CSS-first):
- Set up `@theme` block in globals.css
- Configure font variables in layout.tsx
- Set up CSS custom properties architecture

### Step 0E: Present Pipeline

```markdown
"Here's what I'll do:

Starting point: [detected]
Available tools: [list]
Pipeline: [adapted phases based on what's available]

Estimated phases: [X]
Shall I proceed?"
```

---

## Phase 1: Research & Inspire

### Step 1A: Design Showcase Research

Research the best current frontend designs from curated galleries:

**Sites to research** (via Gemini + Web Search):
- **Awwwards.com** — Award-winning sites in the user's industry
- **Godly.website** — Best landing pages, sorted by category
- **Dribbble.com** — UI/UX design trends for [project type]
- **Landbook.com** — Landing page patterns and layouts
- **One Page Love** — Single-page design excellence
- **CSS Design Awards** — Technical CSS innovation
- **SaaS Landing Page Examples** — Industry-specific patterns
- **Mobbin.com** — Mobile design patterns
- **Screenlane.com** — UI interaction recordings

**Research prompt template for Gemini:**
```
"Analyze the top 10 [industry] landing pages from Awwwards and Godly.website in 2025-2026.
For each, identify:
1. The ONE design technique that makes it memorable
2. Color palette strategy (extract approximate hex values)
3. Typography approach (font pairing, scale, weight usage)
4. Hero section pattern (layout, image treatment, CTA placement)
5. Animation/motion strategy (what moves, what doesn't)
6. Image integration technique (how images blend with the design)
7. Mobile adaptation strategy
Output as a structured comparison table."
```

### Step 1B: Learn From User's Portfolio

Read the user's existing projects to understand their style DNA and quality bar. This is a **concrete algorithm**, not vibes.

**Step 1: Locate the portfolio project**
```markdown
Ask: "Which of your existing projects represents your best design work?"
Or: Check parent directories for Next.js/React projects with custom styling.
```

**Step 2: Read these specific files (in this order)**
```markdown
1. globals.css (or equivalent) → Extract:
   - Color palette (hex values, CSS custom properties)
   - Font families used
   - Animation durations and easing curves
   - Shadow styles
   - Border-radius patterns

2. layout.tsx → Extract:
   - Font imports (which fonts, what weights)
   - Metadata patterns
   - Theme setup

3. tailwind.config.ts / @theme block → Extract:
   - Custom colors defined
   - Extended spacing/typography
   - Plugin usage

4. The main landing page (page.tsx or equivalent) → Extract:
   - Hero pattern (split? centered? image-heavy?)
   - Section rhythm (consistent spacing? alternating layouts?)
   - CTA placement and styling
   - Image usage (AI-generated? stock? none?)

5. 2-3 key components (cards, buttons, navigation) → Extract:
   - Border treatments (rounded? sharp? mixed?)
   - Hover effects (what animates on hover?)
   - Spacing philosophy (dense dashboard? airy marketing?)
```

**Step 3: Build a Style DNA Profile**
```markdown
## Style DNA: [Project Name]

### Colors
- Primary palette: [hex values]
- Accent: [hex]
- Dark mode: Yes/No
- Color mood: [warm/cool/neutral]

### Typography
- Display: [font name] at [weight]
- Body: [font name] at [weight]
- Scale approach: [fluid/fixed/responsive]

### Layout
- Grid: [12-col? flex? irregular?]
- Whitespace: [generous/moderate/dense]
- Max-width: [value]

### Motion
- Animation style: [subtle/moderate/kinetic]
- Typical duration: [fast 150ms / normal 300ms / slow 500ms+]
- Easing: [linear/ease-out/spring/custom]

### Signature Moves
- [The ONE thing that makes this project visually distinct]
- [Second notable pattern]

### Quality Ceiling
- Weakest: [specific area]
- Strongest: [specific area]
- Overall tier: [amateur / mid / polished / agency]
```

**Step 4: Set the bar**
```markdown
"I studied your [Project] project. Your style DNA:
- Colors: [X palette, mood]
- Typography: [Y fonts, Z approach]
- Signature: [distinctive element]
- Quality tier: [assessed tier]

I'll use your [strongest element] as a floor and push everything
else up to [tier+1]. Specifically, I'll improve [weakest area]
by [specific technique]."
```

**IMPORTANT:** The portfolio is a FLOOR, never a ceiling. The skill should always exceed it.

### Step 1C: Competitor Analysis (Gemini-Powered)

If Gemini MCP is connected:

```markdown
1. User provides competitor URLs (or skill suggests based on industry)
2. Gemini visits each URL and analyzes:
   - Layout structure (grid system, section rhythm)
   - Color palette (exact hex values, usage patterns)
   - Typography (font families, scale, weight)
   - Image treatment (how images are integrated)
   - Animation approach (scroll reveals, hovers, transitions)
   - The ONE design choice that elevates it
3. Output: Competitive design intelligence report
```

If Gemini is NOT connected, fall back to:
- Web Search for competitor screenshots
- Claude's own analysis of described design patterns
- Context7 for framework-specific best practices

### Step 1D: Content Inventory

Pull ALL text content, stats, CTAs, and data that must appear in every variation:

```markdown
- **Headlines & copy**: Every piece of text, exact wording
- **Stats/metrics**: Numbers, labels, formatting
- **CTAs**: Button text + destination routes/callbacks
- **Features/benefits**: Cards, lists, descriptions
- **Trust signals**: Partner logos, certifications, audit badges
- **Media**: Images, icons, SVGs with paths
- **Navigation items**: Menu links, footer links
- **Social/external links**: URLs
```

**CRITICAL**: Each parallel agent in Phase 5 has ZERO shared context. The content inventory must be COMPLETE.

### Step 1E: Technical Constraints

```markdown
- Tailwind version: v4 (CSS-first) or v3?
- Fonts already configured in layout.tsx
- globals.css structure (existing @theme blocks, @layer declarations)
- App shell constraints (overflow, sidebar, z-index layers)
- Deployment target (Vercel domain, alias)
- Environment variables needed
```

### Step 1F: Screenshot Baseline

Use Playwright/Chrome DevTools to capture "before" state:
- Desktop (1440x900)
- Tablet (768x1024)
- Mobile (390x844)
- Save to `screenshots/[page]-before-[viewport].png`

---

## Phase 2: Design System Generation

### Step 2A: Color Psychology Engine

Choose colors based on the **emotional job** of the page:

| Industry | Primary | Accent | Emotion |
|----------|---------|--------|---------|
| Finance/Banking | Navy (#0A1628) | Gold (#C4A265) | Trust + Premium |
| DeFi/Crypto | Deep Purple (#1A0A2E) | Neon Cyan (#00F0FF) | Innovation + Bold |
| Health/Wellness | Teal (#0D9488) | Warm White (#FAF7F2) | Calm + Clean |
| SaaS/Productivity | Slate (#0F172A) | Blue (#3B82F6) | Professional + Modern |
| E-commerce | Charcoal (#1C1917) | Amber (#F59E0B) | Luxury + Warmth |
| Developer Tools | Near-Black (#09090B) | Green (#22C55E) | Technical + Precise |
| Creative/Agency | Off-White (#FAFAF9) | Vermillion (#EF4444) | Bold + Energetic |
| Education | Deep Blue (#1E3A5F) | Orange (#FB923C) | Trustworthy + Engaging |

**Process:**
1. Identify the industry/domain
2. Select base palette from the psychology table
3. Generate 5 shade levels for each color (50-950)
4. Create semantic aliases: `--color-background`, `--color-surface`, `--color-text-primary`, `--color-accent`, `--color-accent-hover`, `--color-border`, `--color-muted`
5. Generate dark mode variants automatically

### Step 2B: Font Pairing Intelligence

**Before selecting fonts, check what already exists:**
```markdown
1. Read layout.tsx → Are fonts already imported via next/font/google?
2. If yes → PREFER keeping existing fonts unless they're clearly wrong for the design
3. If changing fonts → limit to MAX 2 font families (performance budget: <100KB font weight)
4. Check Google Fonts load impact: each weight adds ~20-40KB
```

**Pairing rules by personality:**

| Personality | Display Font | Body Font | Example Pairing |
|-------------|-------------|-----------|-----------------|
| Luxury/Editorial | Serif (Playfair Display, Cormorant) | Sans (Inter, Outfit) | Playfair + Inter |
| Modern/Clean | Geometric Sans (Outfit, Plus Jakarta Sans) | Humanist Sans (Inter, DM Sans) | Outfit + DM Sans |
| Technical/Developer | Monospace (JetBrains Mono, Fira Code) | Sans (Inter, Geist Sans) | JetBrains Mono + Inter |
| Bold/Statement | Display Sans (Clash Display, Cabinet Grotesk) | Neutral Sans (Inter, Satoshi) | Clash Display + Satoshi |
| Warm/Approachable | Rounded Sans (Nunito, Quicksand) | Soft Serif (Lora, Source Serif) | Nunito + Source Serif |
| Swiss/Minimal | Grotesk (Helvetica Neue, Neue Haas) | Same family different weight | Inter 700 + Inter 400 |

**Font selection logic:**
```markdown
1. Does the project already have fonts? → Use them if they match the personality
2. If not, or if they're generic (system fonts) → Select from the pairing table
3. Match palette mood: warm colors → warm fonts, cool colors → geometric fonts
4. Load ONLY the weights you need: typically 400 (body) + 600 or 700 (display)
5. Use `font-display: swap` always (prevent FOIT)
6. Verify contrast: display font must be visually distinct from body font
```

**Type scale (fluid):**
```css
--text-display: clamp(3rem, 6vw, 6rem);
--text-h1: clamp(2.25rem, 4.5vw, 4rem);
--text-h2: clamp(1.75rem, 3vw, 2.5rem);
--text-h3: clamp(1.25rem, 2vw, 1.75rem);
--text-body: clamp(1rem, 1.2vw, 1.125rem);
--text-small: clamp(0.875rem, 1vw, 0.9375rem);
--text-caption: clamp(0.75rem, 0.8vw, 0.8125rem);
```

### Step 2C: Spacing & Layout Tokens

```css
/* Base unit: 4px */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-24: 6rem;    /* 96px */
--space-32: 8rem;    /* 128px */
--space-48: 12rem;   /* 192px — section spacing */
--space-64: 16rem;   /* 256px — hero spacing */

/* Layout */
--max-width-content: 1280px;
--max-width-text: 720px;  /* ~65ch */
--max-width-wide: 1440px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
--shadow-glow: 0 0 20px rgba(var(--accent-rgb), 0.3);

/* Border radius */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-2xl: 1.5rem;
--radius-full: 9999px;

/* Animation durations */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 700ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Step 2D: Dark Mode Architecture

Dark mode is NOT just "swap background and text colors." It's a complete visual treatment with different shadows, reduced image brightness, adjusted accent intensities, and altered depth perception. Generate both themes simultaneously:

**Color tokens:**
```css
:root {
  /* Light theme (default) */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-tertiary: #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --border-default: #E2E8F0;
  --border-subtle: #F1F5F9;
  --accent: var(--color-accent);
  --accent-hover: var(--color-accent-hover);
}

[data-theme="dark"] {
  --bg-primary: #09090B;
  --bg-secondary: #18181B;
  --bg-tertiary: #27272A;
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-muted: #71717A;
  --border-default: #27272A;
  --border-subtle: #18181B;
  --accent: var(--color-accent);
  --accent-hover: var(--color-accent-hover);
}
```

**Beyond colors — what MUST change between themes:**

```css
/* 1. SHADOWS: Light uses box-shadow, dark uses subtle light-edge glow */
:root {
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-elevated: 0 10px 25px rgba(0,0,0,0.1);
}
[data-theme="dark"] {
  --shadow-card: 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03);
  --shadow-elevated: 0 10px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
}

/* 2. IMAGE TREATMENT: Dark mode reduces brightness, adds subtle overlay */
[data-theme="dark"] img:not([data-no-dim]) {
  filter: brightness(0.85) contrast(1.05);
}
[data-theme="dark"] .hero-bg {
  opacity: 0.7; /* Background images fade in dark mode */
}

/* 3. ACCENT INTENSITY: Bump saturation/lightness in dark mode for pop */
[data-theme="dark"] {
  --accent: hsl(from var(--color-accent) h calc(s + 10%) calc(l + 8%));
}

/* 4. GRADIENTS: Light uses subtle, dark uses more dramatic */
:root { --gradient-hero: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%); }
[data-theme="dark"] { --gradient-hero: linear-gradient(135deg, #09090B 0%, #1a1a2e 50%, #16213e 100%); }

/* 5. GLASSMORPHISM: Different blur + bg-opacity per theme */
:root { --glass-bg: rgba(255,255,255,0.7); --glass-blur: 12px; --glass-border: rgba(255,255,255,0.3); }
[data-theme="dark"] { --glass-bg: rgba(0,0,0,0.4); --glass-blur: 16px; --glass-border: rgba(255,255,255,0.08); }

/* 6. DEPTH PERCEPTION: Dark mode uses elevation via lighter backgrounds (not shadows) */
/* Each z-level gets slightly lighter in dark mode */
[data-theme="dark"] .z-1 { background: #18181B; }
[data-theme="dark"] .z-2 { background: #1f1f23; }
[data-theme="dark"] .z-3 { background: #27272A; }
```

**Dark mode checklist (verify before marking Phase 2 complete):**
- [ ] Shadows differ between themes (not just color swapped)
- [ ] Images have brightness reduction in dark mode
- [ ] Accent color has enough contrast on dark backgrounds
- [ ] Gradients are designed separately for each theme
- [ ] Glass effects adjust opacity/blur per theme
- [ ] Depth uses elevation (lighter bg) in dark, shadows in light

---

## Phase 3: AI Mockup Generation (NEW)

Generate visual mockups BEFORE writing any code. Like a real design agency.

### Step 3A: Create Mockup Prompts

From the design brief and research, create 5 distinct mockup prompts:

```markdown
Mockup A: "[Industry] landing page, dark theme, serif typography, gold accents,
           full-screen hero with gradient mesh background, minimal layout,
           luxury aesthetic, 1440x900"

Mockup B: "[Industry] landing page, light theme, sans-serif, blue accents,
           dashboard-style hero showing product UI, data-rich,
           modern SaaS aesthetic, 1440x900"

Mockup C: "[Industry] landing page, split layout, editorial style,
           asymmetric columns, vermillion accent, magazine-inspired,
           bold typography, 1440x900"

Mockup D: "[Industry] landing page, immersive hero with background image,
           gradient overlay blending to content, cinematic feel,
           parallax depth, 1440x900"

Mockup E: "[Industry] landing page, brutalist/raw aesthetic, monospace type,
           high contrast, visible grid, counter-culture energy, 1440x900"
```

### Step 3B: Generate Mockups

**If Nano Banana connected:**
```
Use nano-banana MCP to generate each mockup image
Save to: mockups/mockup-[letter].png
```

**If Fal.ai connected:**
```
Use fal MCP with flux-schnell or stable-diffusion model
Save to: mockups/mockup-[letter].png
```

**If neither connected:**
```
Skip visual mockups, proceed directly to HTML variations (Phase 5)
Note: "AI mockup generation skipped — no image generation MCP connected"
```

### Step 3C: Present Mockups to User

Show all 5 mockup images with descriptions:

```markdown
## Mockup Preview

### A: "Swiss Vault" — Luxury Minimal
[mockup-a.png]
Dark theme, serif display font, gold accents, gradient mesh hero

### B: "Data Prime" — Dashboard Landing
[mockup-b.png]
Light theme, product UI showcase, data-rich, modern SaaS

### C: "Editorial Bold" — Magazine Layout
[mockup-c.png]
Asymmetric columns, vermillion accent, editorial typography

### D: "Cinematic" — Image-Led
[mockup-d.png]
Full-screen background image, gradient overlay, immersive depth

### E: "Raw Code" — Brutalist
[mockup-e.png]
Monospace, high contrast, visible grid, counter-culture

Which direction(s) resonate? Pick 1-3 to develop into full HTML prototypes.
```

---

## Phase 4: AI Asset Generation (NEW)

Generate custom visual assets for the chosen direction(s).

### Step 4A: Identify Needed Assets

Based on chosen mockup direction:

```markdown
- [ ] Hero background image/texture (1920x1080)
- [ ] Section divider pattern (tileable)
- [ ] Noise/grain texture overlay (512x512, tileable)
- [ ] Gradient mesh background (1920x1080)
- [ ] Feature section illustrations (if applicable)
- [ ] Abstract decorative elements (geometric shapes, blobs, lines)
- [ ] OG image / social share card (1200x630)
```

### Step 4B: Generate Assets

**Prompt patterns for image generation:**

```markdown
# Hero backgrounds
"Abstract gradient mesh, [color1] to [color2], subtle noise texture,
dark atmosphere, 1920x1080, digital art, high quality"

# Textures
"Seamless noise texture, very subtle, monochrome, 512x512, tileable pattern"

# Geometric decorations
"Minimal geometric lines, [accent color] on transparent,
thin strokes, constellation pattern, wide aspect ratio"

# Mesh gradients
"Soft mesh gradient, [colors from design system], organic blob shapes,
out of focus, bokeh effect, 1920x1080"
```

### Step 4C: Optimize Assets

```bash
# Convert to WebP for optimal performance
npx sharp-cli --input mockups/*.png --output public/assets/ --format webp --quality 85

# Generate responsive sizes
# hero-bg-2560.webp (retina)
# hero-bg-1920.webp (desktop)
# hero-bg-1280.webp (tablet)
# hero-bg-640.webp (mobile)

# Create blur placeholder (LQIP)
# hero-bg-placeholder.webp (20px wide, heavily blurred)
```

### Step 4D: Save to Project

```
public/
  assets/
    hero-bg.webp
    hero-bg-mobile.webp
    hero-bg-placeholder.webp
    noise-texture.webp
    gradient-mesh.webp
    section-pattern.webp
    og-image.webp
```

---

## Phase 5: Design Variations (5 Parallel Agents)

### Technique Selection Logic

**Don't use every technique. Pick 3-5 that match the project.** Use this table:

| Industry/Type | Recommended Techniques | Avoid |
|---|---|---|
| **Finance/DeFi** | Glassmorphism, noise overlay, gradient blending, counter animation, card lift | Parallax (feels unserious), cursor glow |
| **SaaS/Productivity** | Clean gradients, subtle scroll reveals, card tilt, stagger children | Heavy image blending, parallax, Ken Burns |
| **E-commerce/Luxury** | Ken Burns hero, image masking, color grading, magnetic buttons | Brutalist textures, noise |
| **Creative/Agency** | Parallax, cursor glow, clip-path masks, blend modes, 3D tilt | Minimal approaches, standard shadows |
| **Developer Tools** | Minimal motion, code-style animations, monospace counters, subtle glow | Heavy imagery, parallax, Ken Burns |
| **Health/Education** | Soft gradients, gentle scroll fades, warm overlays, rounded cards | Dark glassmorphism, aggressive motion |
| **Portfolio/Personal** | Hero image blending, parallax, magnetic hover, scroll progress | Cookie-cutter patterns |

**Selection algorithm:**
```markdown
1. Identify industry from Phase 1 research
2. Look up recommended techniques from table above
3. Cross-reference with user's portfolio DNA (from Step 1B):
   - If user's style is kinetic → allow more animation
   - If user's style is minimal → reduce techniques to 2-3
4. Each variation agent gets a DIFFERENT subset of 3-5 techniques
   - Variation 1: techniques A, B, C
   - Variation 2: techniques D, E, F
   - This ensures real diversity between variations
```

### Visual Mastery Techniques Library

Each variation agent has access to these advanced image integration techniques:

#### Background Image Blending
```css
/* Gradient + Image layering */
.hero {
  background:
    linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.9) 100%),
    url('/assets/hero-bg.webp') center/cover no-repeat;
}

/* Blend modes */
.hero-blend {
  background-image: url('/assets/hero-bg.webp');
  background-blend-mode: overlay; /* or: multiply, screen, luminosity, soft-light */
  background-color: var(--bg-primary);
}

/* Duotone effect */
.duotone {
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
    mix-blend-mode: color;
  }
}
```

#### Image Masking & Clipping
```css
/* Gradient mask — image fades to transparent */
.masked-image {
  mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
}

/* Clip-path reveals */
.clip-reveal {
  clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
}

/* Animated clip-path on scroll */
.clip-animate {
  clip-path: circle(0% at 50% 50%);
  transition: clip-path 1.2s var(--ease-out);
}
.clip-animate.visible {
  clip-path: circle(100% at 50% 50%);
}

/* Text filled with image */
.text-image-fill {
  background: url('/assets/gradient-mesh.webp') center/cover;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### Parallax & Depth
```css
/* CSS-only parallax */
.parallax-container {
  perspective: 1px;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100vh;
}

.parallax-bg {
  transform: translateZ(-2px) scale(3);
  position: absolute;
  inset: 0;
  z-index: -1;
}

/* Ken Burns (slow zoom) */
@keyframes ken-burns {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

.ken-burns-bg {
  animation: ken-burns 20s ease-out forwards;
  background: url('/assets/hero-bg.webp') center/cover;
}
```

#### Texture & Atmosphere
```css
/* Grain/noise overlay */
.noise-overlay::after {
  content: '';
  position: fixed;
  inset: 0;
  background: url('/assets/noise-texture.webp');
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
}

/* Glassmorphism over image */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Mesh gradient background */
.mesh-gradient {
  background:
    radial-gradient(at 20% 80%, var(--color-1) 0%, transparent 50%),
    radial-gradient(at 80% 20%, var(--color-2) 0%, transparent 50%),
    radial-gradient(at 50% 50%, var(--color-3) 0%, transparent 50%),
    var(--bg-primary);
}

/* Light leak effect */
.light-leak {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(var(--accent-rgb), 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(var(--accent-rgb), 0.1) 0%, transparent 50%);
}
```

#### Color Grading
```css
/* CSS filter chain for color grading */
.graded-image {
  filter: brightness(0.9) contrast(1.1) saturate(0.8) sepia(0.1);
}

/* SVG color matrix for precise control */
<svg style="display:none">
  <filter id="brand-grade">
    <feColorMatrix type="matrix" values="
      1.1 0   0   0 0
      0   0.9 0   0 0
      0   0   1.2 0 0
      0   0   0   1 0
    "/>
  </filter>
</svg>

.brand-graded { filter: url(#brand-grade); }
```

### Micro-Interaction Library

Each variation agent can deploy these interactions:

**Button Interactions:**
```css
/* Magnetic hover */
.btn-magnetic { transition: transform 0.3s var(--ease-out); }

/* Glow on hover */
.btn-glow:hover { box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.4); }

/* Ripple effect */
.btn-ripple { overflow: hidden; position: relative; }
.btn-ripple::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  transform: scale(0);
  animation: ripple 0.6s ease-out;
}

/* Slide fill */
.btn-slide {
  background: linear-gradient(90deg, var(--accent) 50%, transparent 50%);
  background-size: 200% 100%;
  background-position: 100% 0;
  transition: background-position 0.4s var(--ease-out);
}
.btn-slide:hover { background-position: 0 0; }

/* Border draw */
.btn-border-draw {
  background: transparent;
  border: 2px solid transparent;
  background-image: linear-gradient(var(--bg), var(--bg)),
                    linear-gradient(90deg, var(--accent), var(--accent-2));
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
```

**Card Interactions:**
```css
/* Lift + shadow deepen */
.card-lift {
  transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out);
}
.card-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* Subtle tilt (3D) */
.card-tilt {
  transition: transform 0.5s var(--ease-out);
  transform-style: preserve-3d;
}
/* Controlled via JS IntersectionObserver + mousemove */

/* Border glow */
.card-glow {
  border: 1px solid var(--border-default);
  transition: border-color 0.3s, box-shadow 0.3s;
}
.card-glow:hover {
  border-color: var(--accent);
  box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.15);
}

/* Reveal overlay */
.card-reveal .overlay {
  opacity: 0;
  transition: opacity 0.3s;
}
.card-reveal:hover .overlay { opacity: 1; }
```

**Input Interactions:**
```css
/* Label float */
.input-float:focus + label,
.input-float:not(:placeholder-shown) + label {
  transform: translateY(-100%) scale(0.85);
  color: var(--accent);
}

/* Border glow on focus */
.input-glow:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
  outline: none;
}

/* Shake on error */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.input-error { animation: shake 0.4s ease-out; }
```

**Scroll Interactions:**
```css
/* Fade up on scroll */
.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out);
}
.scroll-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered children */
.stagger-children > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out);
}
.stagger-children.visible > *:nth-child(1) { transition-delay: 0ms; }
.stagger-children.visible > *:nth-child(2) { transition-delay: 100ms; }
.stagger-children.visible > *:nth-child(3) { transition-delay: 200ms; }
.stagger-children.visible > * { opacity: 1; transform: translateY(0); }

/* Progress bar on scroll */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  transform-origin: 0 0;
  z-index: 9999;
  /* Width controlled by JS: scrollY / (docHeight - viewportHeight) */
}

/* Number counter animation */
/* Controlled via JS requestAnimationFrame */
```

### Variation Brief Template (Enhanced)

Each of the 5 variations must specify its image integration strategy:

```markdown
### Variation [Letter]: "[Codename]" — [3-Word Philosophy]

**Philosophy**: [1-2 sentences]
**Inspiration**: [2-3 real sites — from Phase 1 research]
**Typography**: [Specific Google Font pairing from Phase 2B]
**Color Palette**: [From Phase 2A color psychology]
**Image Strategy**: [CRITICAL — how images integrate with the design]
  - Hero: [gradient overlay on photo | mesh gradient | solid color | video bg]
  - Sections: [alternating image-text | full-bleed images | masked reveals]
  - Textures: [noise overlay | grain | subtle pattern | none]
  - Depth: [parallax | layered z-index | flat | glassmorphism]
  - Color Treatment: [duotone | graded | natural | monochrome]
**Layout**: [Grid structure, max-width, section spacing]
**Animation Strategy**: [Which micro-interactions to use]
**Unique Element**: [ONE signature technique]
**Micro-interactions**: [Which ones from the library to deploy]
```

### Agent Prompt Template

(Same comprehensive HTML generation prompt as design-superagent, PLUS the visual mastery techniques library and micro-interaction library above are included in each agent's prompt)

### Spawning: All 5 agents in ONE message for true parallelism

---

## Phase 6: Preview & Select

(Same as design-superagent Phase 3 — screenshot each variation with Playwright, present to user, support hybrid/iterate/reject)

---

## Phase 7: Implement (Next.js + React + Tailwind v4)

### Senior-Level Code Standards

The implementation phase follows senior frontend developer standards:

```markdown
1. **Component architecture**: Single responsibility, composable, typed props
2. **Performance**: Dynamic imports for below-fold, responsive images with next/image
3. **Accessibility**: Semantic HTML, ARIA labels, keyboard nav, focus management
4. **CSS architecture**: Scoped with unique prefix, CSS custom properties, no !important
5. **Image optimization**: WebP, srcset, blur placeholders, lazy loading
6. **Animation**: CSS-only, GPU-composited (transform + opacity), prefers-reduced-motion
7. **Responsive**: Mobile-first, fluid typography (clamp), container queries where useful
8. **Type safety**: Full TypeScript, no `any`, explicit interfaces
```

### Image Integration in React

```tsx
// Responsive hero with gradient overlay
<div className="relative h-screen overflow-hidden">
  {/* Background image with blur placeholder */}
  <Image
    src="/assets/hero-bg.webp"
    alt=""
    fill
    priority
    placeholder="blur"
    blurDataURL="/assets/hero-bg-placeholder.webp"
    className="object-cover"
    sizes="100vw"
  />
  {/* Gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/90" />
  {/* Content */}
  <div className="relative z-10 flex items-center justify-center h-full">
    {/* ... */}
  </div>
</div>

// Masked image reveal
<div className="[mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
  <Image src="/assets/section-bg.webp" alt="" fill className="object-cover" />
</div>

// Noise texture overlay (global)
<div className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.03]"
     style={{ backgroundImage: "url('/assets/noise-texture.webp')" }} />
```

### Implementation steps remain same as design-superagent Phase 4
(Read target file, plan conversion, scope CSS, convert Tailwind, add to globals.css, update layout.tsx for fonts, verify)

---

## Phase 8: Refine (NEW — Senior Dev Refinement Loop)

This phase is what separates "generated" from "crafted". The skill acts as a senior frontend developer reviewing their own work.

### Step 8A: Visual QA (5 breakpoints)

```markdown
Screenshot at:
1. 1440px (desktop)
2. 1024px (small desktop/tablet landscape)
3. 768px (tablet portrait)
4. 390px (mobile)
5. 320px (small mobile)

For each breakpoint, check:
- [ ] No horizontal overflow
- [ ] No text truncation that shouldn't be there
- [ ] Images scale correctly
- [ ] Cards don't break layout
- [ ] CTAs remain visible above the fold
- [ ] Navigation adapts correctly
```

### Step 8B: Animation Timing Review

```markdown
For every transition/animation:
- [ ] Duration feels intentional (not too fast, not too slow)
- [ ] Easing curve matches the motion type (ease-out for entrances, ease-in for exits)
- [ ] No animation conflicts or jank
- [ ] Stagger delays create a natural rhythm (80-120ms between siblings)
- [ ] Total animation budget per viewport: max 3 entrance animations
- [ ] prefers-reduced-motion is respected
```

### Step 8C: Typography Polish

```markdown
- [ ] Line length: 45-75 characters for body text
- [ ] Line height: 1.1 display, 1.3 headings, 1.6 body
- [ ] No orphans (single word on last line of paragraph)
- [ ] Heading hierarchy is visually clear (size steps are large enough)
- [ ] Letter-spacing: tight for display (-0.02em), normal for body (0)
- [ ] Font weights: at least 2 weights used (e.g., 400 + 700)
- [ ] Fluid type scaling works at all viewports (no too-small or too-large)
```

### Step 8D: Color Harmony Validation

```markdown
- [ ] WCAG AA contrast: 4.5:1 body text, 3:1 large text (24px+)
- [ ] Accent color used consistently (same hue everywhere)
- [ ] No more than 3 colors dominating any viewport
- [ ] Dark mode tested (if applicable)
- [ ] Color blind safe (check with Chrome DevTools emulation)
```

### Step 8E: Image Optimization

```markdown
- [ ] All images in WebP format
- [ ] Responsive srcset for hero images (640, 1280, 1920, 2560)
- [ ] Blur placeholder (LQIP) for above-fold images
- [ ] Lazy loading for below-fold images
- [ ] Total image weight < 500KB (above fold)
- [ ] next/image used for all <img> (automatic optimization)
- [ ] alt text for meaningful images, alt="" for decorative
```

### Step 8F: Performance Audit

```markdown
Using Chrome DevTools performance trace OR Lighthouse:
- [ ] LCP < 2.5s (Largest Contentful Paint)
- [ ] CLS < 0.1 (Cumulative Layout Shift)
- [ ] FID < 100ms (First Input Delay)
- [ ] Total JS bundle < 200KB (gzipped)
- [ ] Total CSS < 50KB (gzipped)
- [ ] No render-blocking resources
- [ ] Font display: swap for all web fonts

If any metric fails: identify the cause, fix it, re-measure.
```

### Step 8G: Accessibility Audit

```markdown
- [ ] Semantic HTML (header, main, nav, section, footer)
- [ ] Heading hierarchy (h1 → h2 → h3, no skips)
- [ ] All interactive elements keyboard-focusable
- [ ] Focus indicators visible (outline or ring)
- [ ] ARIA labels on icon-only buttons
- [ ] Skip-to-content link (hidden, visible on focus)
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] No auto-playing animations without user control
```

### Step 8H: Cross-Browser Check

```markdown
- [ ] CSS features have fallbacks for Safari (@supports)
- [ ] backdrop-filter has -webkit- prefix
- [ ] mask-image has -webkit- prefix
- [ ] Scroll behavior: smooth has fallback
- [ ] CSS container queries have @supports guard
- [ ] No CSS nesting in production (not yet universal)
```

### Step 8I: Code Quality Review

```markdown
- [ ] No dead CSS (unused classes)
- [ ] No duplicate styles
- [ ] CSS custom properties used (no hardcoded hex values)
- [ ] Component files < 300 lines
- [ ] No inline styles except for dynamic values (animation-delay, transform)
- [ ] All data in arrays/objects, not hardcoded in JSX
- [ ] TypeScript strict mode passes
```

### Step 8J: The Squint Test

```markdown
View the page from arm's length (or blur your eyes):
- [ ] The visual hierarchy is clear (you can tell what's most important)
- [ ] The layout has rhythm (even spacing between sections)
- [ ] There's a clear focal point per viewport
- [ ] The page doesn't feel "heavy" or "cluttered"
- [ ] The color balance feels right (not too much accent, not too muted)
```

**Each step that fails:** The skill fixes the issue automatically, then re-runs that specific check. Loop until all 10 steps pass.

---

## Phase 9: Deploy & Verify

### Step 9A: Git Commit + Vercel Deploy

(Same as design-superagent Phase 5)

### Step 9B: Before/After Comparison

Present desktop + mobile screenshots side by side:
```markdown
## Before → After
[before-desktop.png] → [after-desktop.png]
[before-mobile.png] → [after-mobile.png]
```

### Step 9C: Competitive Visual Scorecard (NEW)

After deploying, generate a competitive comparison using **Playwright** (always available — no MCP dependency):

**Step 1: Screenshot competitors with Playwright**
```markdown
For each competitor URL (provided in Phase 1 or by user):
1. Navigate to URL with Playwright
2. Screenshot at desktop (1440x900) and mobile (390x844)
3. Scroll-capture the full page in increments
4. Save to screenshots/competitors/[domain]-[viewport].png
```

**Step 2: Analyze with Claude's vision**
```markdown
Present YOUR screenshots alongside competitor screenshots to Claude:
"Compare these two sites across these 7 dimensions. Rate each 1-5."
```

**Step 3: Generate the scorecard**
```markdown
## Competitive Scorecard

| Dimension | Your Site | [Competitor 1] | [Competitor 2] | Gap |
|-----------|:---------:|:--------------:|:--------------:|:---:|
| Visual Impact (first impression) | X/5 | X/5 | X/5 | +/- |
| Typography (hierarchy + pairing) | X/5 | X/5 | X/5 | +/- |
| Animation (purposeful motion) | X/5 | X/5 | X/5 | +/- |
| Image Integration (blending + quality) | X/5 | X/5 | X/5 | +/- |
| Mobile (responsive + thumb-friendly) | X/5 | X/5 | X/5 | +/- |
| Performance (load speed + smoothness) | X/5 | X/5 | X/5 | +/- |
| Accessibility (contrast + keyboard + sr) | X/5 | X/5 | X/5 | +/- |

### Gap Analysis
- Your biggest gap: [specific dimension vs best competitor]
- Quick win: [smallest effort, biggest improvement]
- Recommended next improvement: [specific action]
- Overall position: [X] out of [Y] in competitive set
```

**Tool dependency:** Playwright (always installed) + Claude's own visual analysis. No Gemini needed.

---

## Phase 10: Scale-Up Audit (Multi-Persona Critique)

### Audit with 3 Focused Personas

After deploying a page, audit the ENTIRE app from 3 perspectives in parallel. 3 personas (not 5) to minimize token usage while covering all critical angles:

**Agent 1: The Design Critic** (merges Designer + Brand Strategist)
```markdown
Focus: Visual hierarchy, whitespace, typography, color harmony, layout rhythm,
       brand emotion, trust signals, premium feel, visual consistency across pages.
Questions:
  - "Does the eye flow correctly through every page?"
  - "Would the target audience feel this was built specifically for them?"
  - "Is there a consistent design language across all pages?"
Rate each page: A (exceptional) / B (solid) / C (needs work) / F (redesign)
Output: CRITICAL/HIGH/MEDIUM/LOW issues with specific CSS/layout fixes.
```

**Agent 2: The Technical Reviewer** (merges Developer + Accessibility Expert)
```markdown
Focus: Code quality, performance, bundle size, CSS architecture, maintainability,
       WCAG compliance, keyboard nav, screen readers, color contrast, focus management.
Questions:
  - "Would a staff engineer approve this code?"
  - "Can someone with a disability use every feature?"
  - "Does performance meet the budget (JS<200KB, CSS<50KB, LCP<2.5s)?"
Rate each page: A/B/C/F
Output: CRITICAL/HIGH/MEDIUM/LOW issues with specific code/ARIA fixes.
```

**Agent 3: The User** (the most important perspective — kept standalone)
```markdown
Focus: CTA findability (3-second test), navigation intuition, information hierarchy,
       form usability, mobile thumb-friendliness, error state clarity.
Questions:
  - "Can a first-time visitor accomplish their goal without confusion?"
  - "Is the most important action obvious at every scroll depth?"
  - "Does the mobile experience feel native, not shrunk-desktop?"
Rate each page: A/B/C/F
Output: CRITICAL/HIGH/MEDIUM/LOW issues with specific UX fixes.
```

Each persona produces a critique with CRITICAL/HIGH/MEDIUM/LOW issues and **specific actionable fixes** (not vague suggestions).

### Audit → Redesign Loop

If the audit reveals a page that needs fundamental redesign:
1. Identify weakest page (lowest average rating)
2. Feed audit findings into Phase 1 as constraints
3. Run Phases 3-9 for that page only
4. Re-audit to confirm improvement

**Loop until every page scores B or above across all 3 personas.**

---

## Operating Principle: Full Restructuring Authority

**CRITICAL**: This skill is authorized to restructure existing frontend code — not just add to it. If the current file structure, component architecture, or CSS approach doesn't serve the design, the skill can:

- Reorganize the `app/` directory structure
- Split or merge components
- Replace an entire page component (not patch it)
- Refactor the CSS architecture (move from CSS modules to Tailwind, restructure globals.css)
- Change the routing structure if needed
- Replace utility functions, hooks, or shared components that don't meet quality standards

The goal is the BEST possible output. Legacy code doesn't get grandfather'd in — it gets elevated or replaced.

---

## Variation Philosophy Library

Reference these when creating variation briefs. Mix, match, and customize per project.

### Swiss Vault Editorial
- Typography-driven, massive display text, thin horizontal rules
- Near-black + cream + single gold accent
- Zero entrance animation, subtle hover states only
- Image strategy: Minimal — text IS the visual. If images used, desaturated + masked
- Feels like: Financial Times feature article
- Best for: Finance, institutional, luxury

### Dark Kinetic Gradient
- Animated gradient mesh backgrounds, glass-morphism cards
- Deep black + rose-gold/lavender/violet gradients at low opacity
- CSS @property gradient angle animation, scroll parallax
- Image strategy: Mesh gradients as primary visual. Photos rare, heavily graded if used
- Feels like: Bloomberg terminal with a soul
- Best for: DeFi, crypto, data platforms

### Editorial Magazine
- Asymmetric newspaper columns, pull quotes, sidebar data
- Charcoal + off-white + single vermillion accent
- Print-inspired stagger animations
- Image strategy: Full-bleed photography with duotone treatment, text overlay
- Feels like: Bloomberg Businessweek cover story
- Best for: Content-heavy, storytelling, reports

### Data Dashboard Landing
- Page looks like a simplified product dashboard
- Deep navy + cyan + rose-gold accents
- Animated counters, SVG sparklines, pulsing live indicators
- Image strategy: No photography. Charts, data viz, and UI screenshots ARE the visuals
- Feels like: Users can almost USE the landing page
- Best for: Analytics, trading, monitoring tools

### Luxury Minimal
- Single-column, centered, max-width 800px, 200px+ section spacing
- True black + warm white + iridescent gradient on CTA only
- One sentence, one number, one button per viewport
- Image strategy: One hero image, full-bleed, heavily masked with gradient fade-out
- Feels like: "We don't need to sell you." Apple product page energy
- Best for: Premium products, exclusive access, high-end SaaS

### Brutalist Raw
- Oversized type, visible grid lines, raw HTML aesthetic
- Stark contrast, monospace type, zero decoration
- Intentionally "undesigned" — the rawness IS the design
- Image strategy: Raw, unprocessed photos. No filters. Or no images at all — just type
- Feels like: Underground gallery exhibition
- Best for: Developer tools, experimental, counter-culture brands

### Organic Flow
- Blob shapes, rounded everything, natural color palette
- Warm earth tones or ocean blues, soft shadows
- Smooth morphing animations, fluid scroll behavior
- Image strategy: Soft illustrations, hand-drawn elements, watercolor textures
- Feels like: Calm.com meets fintech
- Best for: Wellness, sustainability, approachable platforms

### Retro-Futurist
- Scanline effects, CRT glow, pixel grid patterns
- Neon on dark, terminal green, amber phosphor
- Typewriter text reveal, flickering elements
- Image strategy: Glitch effects, pixel art, CRT scan overlays on photos
- Feels like: Blade Runner UI design
- Best for: Gaming, cyberpunk aesthetic, hacker tools

### Neomorphic Glass
- Soft raised/inset surfaces, frosted glass layers
- Light gray + subtle shadows + vibrant accent peeking through
- Depth through shadow layers, not borders
- Image strategy: Background images visible through frosted glass layers (backdrop-filter)
- Feels like: Physical buttons on a glass table
- Best for: Settings pages, dashboards, tool interfaces

### Cinematic Hero
- Full-viewport hero with video/image background, overlay text
- Minimal content per section, dramatic transitions between sections
- Parallax depth, fade-through-black section transitions
- Image strategy: Full-bleed photography/video, gradient overlays, Ken Burns zoom, parallax
- Feels like: Movie landing page or product launch
- Best for: Product launches, events, immersive experiences

### Photographic Immersive (NEW)
- Full-bleed photography as primary design element
- Gradient overlays blend images seamlessly into layout
- Parallax depth on scroll, Ken Burns on hero
- Duotone treatment maps photos to brand colors
- Image strategy: Every section has a background image, all blended with CSS blend modes
- Feels like: National Geographic meets fintech
- Best for: Products with strong visual identity, travel, lifestyle

### Layered Glass (NEW)
- Multiple semi-transparent layers with backdrop-blur
- Background image visible through frosted glass cards
- Depth through z-index stacking, not just shadows
- Color accents bleed through glass layers
- Image strategy: One dramatic background image, everything else floats on glass above it
- Feels like: iOS Control Center as a website
- Best for: Dashboards, settings, data-rich pages

### Cinematic Split (NEW)
- Split-screen layouts with image on one side, content on other
- Images use CSS filters for cinematic color grading
- Horizontal scroll sections for feature showcases
- Image strategy: 50/50 split — large photos take half the viewport, text takes the other
- Feels like: A film festival website
- Best for: Portfolio, agency, product showcase

---

## Phase 5 Addendum: Full Agent Prompt Template

Each parallel variation agent receives this COMPLETE prompt (customized per variation):

````markdown
You are a world-class frontend designer-developer. Create a single self-contained HTML file
that implements this design variation. The file must be production-quality — no shortcuts,
no placeholders, no "...". Every section fully implemented.

## Design Specification

[PASTE FULL VARIATION BRIEF — including image strategy and micro-interactions]

## Content — INCLUDE ALL OF THIS EXACTLY

[PASTE COMPLETE CONTENT INVENTORY FROM PHASE 1]
[Every stat, heading, CTA, feature, trust signal, nav item]
[Include AI-generated asset URLs from Phase 4 if available]

## Design System Tokens

[PASTE CSS CUSTOM PROPERTIES FROM PHASE 2]
[All colors, type scale, spacing, shadows, animation timing]

## Technical Requirements

### HTML Structure
- Single self-contained HTML file
- Tailwind CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Configure custom colors/fonts in inline Tailwind config
- Google Fonts via `<link>` tags
- ALL CSS in a single `<style>` block
- ALL JS in a single `<script>` block at end of body
- Target: 400-900 lines total

### Component Structure Comments
```html
<!-- COMPONENT: HeroSection -->
<section class="...">...</section>
<!-- END: HeroSection -->
```

### Image Integration (CRITICAL)
Use the image strategy from the variation brief. Apply these CSS techniques:

1. **Background blending**: `background-blend-mode` with gradient overlays
2. **Image masking**: `mask-image` with gradients for fade effects
3. **Parallax**: CSS `perspective` or JS `IntersectionObserver` for depth
4. **Glassmorphism**: `backdrop-filter: blur()` over background images
5. **Color grading**: CSS `filter` chains for cinematic color
6. **Noise overlay**: SVG noise texture at low opacity
7. **Responsive images**: `srcset` with mobile/desktop variants
8. **Blur placeholders**: Low-res placeholder while main image loads

Include at least 3 of these techniques per variation.

### Dark Mode
Include both themes using `[data-theme]` attribute:
```html
<script>
  const theme = localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
</script>
```
All colors must use CSS custom properties. The `[data-theme="light"]` selector overrides.

### Micro-Interactions
Include at least 5 micro-interactions from:
- Button hover states (glow, scale, ripple, slide-fill)
- Card hover (lift, border-glow, reveal-overlay)
- Scroll reveals (fade-up, stagger-children, scale-in)
- Loading states (skeleton shimmer, pulse dots)
- Number counter animation (requestAnimationFrame)
- Scroll progress bar

### Animation Rules — CSS ONLY
- `@keyframes` for entrance animations
- `transition` for hover/interaction states
- `IntersectionObserver` in vanilla JS for scroll-triggered
- `requestAnimationFrame` for animated counters
- Performance: ONLY animate `transform` and `opacity`
- MUST include `prefers-reduced-motion` media query
- NO Framer Motion, GSAP, or animation libraries

### Responsive (Mobile-First)
- Base styles = mobile (< 640px)
- `sm:` = 640px, `md:` = 768px, `lg:` = 1024px, `xl:` = 1440px
- Navigation collapses to hamburger on mobile
- Touch targets minimum 44x44px on mobile
- Images scale with viewport

### Accessibility
- WCAG AA contrast (4.5:1 body, 3:1 large text)
- Focus indicators visible
- Semantic HTML (header, main, nav, section, footer)
- Alt text on meaningful images, aria-hidden on decorative

## Output
A single, complete, self-contained HTML file that:
- Looks like a shipped production website when opened in a browser
- Supports dark and light mode
- Is responsive across all breakpoints
- Has smooth, purposeful animations
- Integrates images using advanced CSS techniques
- Every section from the content inventory is present
- Includes at least 5 micro-interactions
````

---

## Phase 6: Preview & Select (Full Workflow)

### Step 6A: Serve HTML Files

```bash
cd [project-root] && python3 -m http.server 8888 &
```

Verify: `curl -s http://localhost:8888/design-variations/ | head -20`

### Step 6B: Screenshot Each Variation

Use Playwright or Chrome DevTools to capture each variation:

For each variation file:
1. Navigate to `http://localhost:8888/design-variations/variation-[letter]-[codename].html`
2. **Desktop screenshot** (1440x900 viewport)
3. Scroll down in increments to capture below-the-fold sections
4. **Mobile screenshot** (390x844 viewport)
5. **Dark mode screenshot** — toggle `data-theme="dark"` via JS, re-screenshot
6. **Light mode screenshot** — toggle `data-theme="light"` via JS, re-screenshot
7. Save all screenshots:
   - `screenshots/variation-a-desktop-dark.png`
   - `screenshots/variation-a-desktop-light.png`
   - `screenshots/variation-a-mobile-dark.png`
   - `screenshots/variation-a-mobile-light.png`

**IMPORTANT**: Screenshot by scrolling incrementally, NOT using fullPage mode — fullPage misses fixed/sticky elements and IntersectionObserver-triggered animations.

### Step 6C: Present to User

Show all screenshots (desktop + mobile, dark + light for each variation) and present options:

**Decision Point — Ask user**:
1. **"Pick a winner"** — "I want Variation C" → proceed to Phase 7
2. **"Hybrid"** — "I want C's layout with A's typography and D's color scheme"
   → Generate a new hybrid variation HTML, re-preview, confirm
3. **"Iterate"** — "Make Variation B more minimal" or "Variation D but darker"
   → Re-spawn single agent with adjusted brief, re-preview
4. **"Reject all"** — "None of these. Try [new direction]"
   → Return to Phase 5 with new briefs informed by what didn't work
5. **"Pick two"** — "A/B test between C and E"
   → Implement both, deploy both, let user test in production

### Step 6D: Hybrid Generation (if requested)

When user wants elements from multiple variations:

1. Read the source HTML files for each referenced variation
2. Create a new brief that combines:
   - Layout from Variation X
   - Typography from Variation Y
   - Color palette from Variation Z
   - Image treatment from Variation W
   - Animation approach from Variation V
3. Spawn a single agent with the hybrid brief + all source HTML as context
4. Preview the hybrid, confirm with user

### Phase 6 Verification Checklist

- [ ] All variations screenshotted at desktop + mobile
- [ ] Both dark and light modes captured
- [ ] Screenshots show full page content (scroll-captured)
- [ ] User has seen all options and made a selection
- [ ] If hybrid: new variation generated and approved

---

## Optional Tool: Excalidraw MCP

Excalidraw (`excalidraw-mcp-server`) can create quick wireframes and component diagrams if connected, but is NOT required. The skill works fine without it — use ASCII diagrams or skip visual wireframes entirely.

**If connected, use for:**
- Phase 0: Quick page layout wireframes before designing
- Phase 2: Visual design system map (color palette, type scale)
- Phase 7: Component tree diagram before implementing

**If not connected:** Skip. Describe layouts verbally in variation briefs.

---

## Micro-Interaction Library: JS-Powered Interactions (Gap Fill)

The CSS-only micro-interactions are in Phase 5. These are the JS-powered ones:

### Magnetic Hover (Button)

```javascript
// Buttons subtly follow the cursor when hovering nearby
function initMagneticButtons() {
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    btn.addEventListener('mouseenter', () => {
      btn.style.transition = 'none';
    });
  });
}
```

### 3D Card Tilt

```javascript
// Cards tilt toward the cursor on hover
function initTiltCards() {
  document.querySelectorAll('.card-tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
    });
  });
}
```

### Cursor Glow Effect

```javascript
// A soft radial gradient follows the cursor across the page
function initCursorGlow() {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.style.cssText = `
    position: fixed;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(var(--accent-rgb), 0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9998;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
  `;
  document.body.appendChild(glow);

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}
```

### Animated Number Counter

```javascript
// Numbers count up from 0 to target when scrolled into view
function initCounters() {
  const counters = document.querySelectorAll('[data-count-to]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.countTo);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// Usage: <span data-count-to="1200000000" data-prefix="$" data-decimals="0">$0</span>
```

### Scroll Progress Bar

```javascript
// Thin progress bar at top of page showing scroll position
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress-bar';
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--color-accent, #C4A265);
    z-index: 99999;
    transform-origin: 0 0;
    transform: scaleX(0);
    transition: transform 0.1s linear;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    bar.style.transform = `scaleX(${progress})`;
  }, { passive: true });
}
```

### Scroll-Triggered Class Toggle (IntersectionObserver)

```javascript
// Generic: Adds .visible class when element enters viewport
function initScrollReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve — allows re-trigger if you want
        // observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.scroll-reveal, .scroll-fade-up, .scroll-scale, .stagger-children')
    .forEach(el => observer.observe(el));
}
```

### Parallax on Scroll

```javascript
// Elements move at different speeds relative to scroll
function initParallax() {
  const elements = document.querySelectorAll('[data-parallax]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    elements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.3;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + scrollY) * speed - scrollY * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
  }, { passive: true });
}

// Usage: <div data-parallax="0.3">Moves at 30% scroll speed</div>
```

### Init All Interactions

```javascript
// Call this on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveals();
  initCounters();
  initScrollProgress();
  initMagneticButtons();
  initTiltCards();
  initCursorGlow();
  initParallax();
});
```

**Total micro-interactions: 30+**
- CSS: Skeleton shimmer, pulse dots, spinner, toast, checkmark, gradient text, float, gradient rotate, typewriter, blink caret, btn-glow, btn-underline, btn-arrow, btn-ripple, card-lift, card-glow, card-reveal, card-slide, input-float, input-highlight, input-shake, nav-indicator, hamburger-morph, scroll-fade-up, scroll-scale, stagger-children
- JS: Magnetic hover, 3D tilt, cursor glow, counter animation, scroll progress bar, scroll reveals, parallax

---

## Phase-Level Error Recovery & Escape Hatches

**Every phase can fail.** The skill must handle failures gracefully, not silently or catastrophically.

### Global Escape Commands
```markdown
At ANY point during the pipeline, the user can say:
- "skip this phase" → Jump to the next phase, note what was skipped
- "restart from Phase [X]" → Reset to that phase, keep work from earlier phases
- "abort" → Stop the pipeline, commit what's done, report status
- "pause" → Save current state, explain where we are, wait for instructions
```

### Per-Phase Error Handling

| Phase | Common Failure | Recovery Action |
|-------|---------------|-----------------|
| 0 (Detect) | MCP install fails | Skip that tool, proceed with fallbacks. Log which tool failed. |
| 1 (Research) | Gemini quota exceeded | Fall back to web search + Claude analysis. Never block on a single tool. |
| 1 (Research) | No portfolio project found | Skip portfolio learning, proceed with industry defaults. |
| 2 (Design System) | User rejects color palette | Regenerate with different industry-emotion mapping. Max 3 attempts, then ask for specific hex values. |
| 3 (Mockups) | Nano Banana / Fal.ai down | Try the other AI tool. If both down, skip mockups → proceed to HTML variations (Phase 5). |
| 4 (Assets) | AI generates low-quality images | Use CSS-only alternatives (gradients, noise, blend modes). AI images are nice-to-have, not blockers. |
| 5 (Variations) | Agent produces broken HTML | Discard that variation, spawn a replacement. If 3+ agents fail, reduce to 3 variations total. |
| 6 (Preview) | Screenshots fail | Try different viewport. If Playwright fails, use Chrome DevTools. If both fail, serve HTML and ask user to view manually. |
| 7 (Implement) | TypeScript errors | Fix them. Run `npx tsc --noEmit` repeatedly. If stuck after 3 attempts on the same error, ask user. |
| 8 (Refine) | Lighthouse score below target | Focus on the worst metric first. If LCP > 4s, lazy-load images and reduce hero complexity. |
| 9 (Deploy) | Vercel build fails | Read build log, fix the error. Common: missing env vars, SSR errors, import issues. If stuck, deploy static export. |
| 10 (Audit) | Audit finds F-grade page | Feed back into Phase 1 for that page only. Don't re-audit the entire app. |

### State Preservation
```markdown
At the end of each phase, save a checkpoint:
"Phase [X] complete. Status: [summary]. Next: Phase [X+1]."

If the conversation context gets large (>80% window), save state to a file:
→ Save to: docs/context/design-forge-checkpoint.md
→ Include: current phase, decisions made, files created, settings
→ This allows a new conversation to resume from the checkpoint
```

---

## Design Decision Log

Track every significant design decision through the pipeline. This prevents "why did we do that?" confusion and enables iteration.

### Format
```markdown
## Design Decision Log

### Phase [X] — [Phase Name]
| # | Decision | Options Considered | Chosen | Reason |
|---|----------|-------------------|--------|--------|
| 1 | Color palette | Navy+Gold, Purple+Cyan, Teal+White | Navy+Gold | Finance domain → trust + premium emotion |
| 2 | Hero pattern | Split (text+image), Centered, Full-screen image | Split | Content inventory has strong headline + hero image |
| 3 | Font pairing | Playfair+Inter, Outfit+DM Sans | Outfit+DM Sans | Existing project uses sans-serif, keeping consistency |
```

### What to Log
- Phase 1: Industry classification, competitor insights, portfolio DNA findings
- Phase 2: Color palette choice, font pairing choice, spacing approach
- Phase 3: Which mockup direction the user picked and why
- Phase 5: Which techniques each variation uses, which philosophies assigned
- Phase 6: Which variation won and what the user liked about it
- Phase 7: Any deviations from the HTML prototype during implementation
- Phase 8: Which refinement steps required the most iteration
- Phase 10: Audit scores per persona, priority of fixes

### Where to Store
Save to project root as `docs/design-decisions.md`. Update after each phase.

---

## Validation Plan: Testing the Skill

Before considering the skill production-ready, test the complete pipeline on a real project.

### Test Scenario 1: Build from Scratch (Full Pipeline)
```markdown
Input: "Design forge a landing page for a DeFi yield aggregator called VaultMax"
Expected behavior:
- Phase 0: Detects empty directory, scaffolds Next.js, checks MCPs
- Phase 1: Researches DeFi landing pages, uses crypto color psychology
- Phase 2: Generates dark mode design system with DeFi palette
- Phase 3: Creates 5 AI mockup directions (if MCPs available)
- Phase 4: Generates hero background, noise textures
- Phase 5: 5 HTML variations with different philosophies + techniques
- Phase 6: Screenshots all, presents to user
- Phase 7: Implements winner in Next.js with typed components
- Phase 8: Refinement loop passes all 10 checks
- Phase 9: Deploys to Vercel, generates competitive scorecard
- Phase 10: Audit with 3 personas, all pages score B+

Pass criteria:
- [ ] Pipeline completes without fatal errors
- [ ] At least 3 of 5 variations are visually distinct
- [ ] Final implementation passes typecheck
- [ ] Lighthouse performance score > 80
- [ ] No accessibility errors (axe-core clean)
- [ ] Dark mode works correctly
- [ ] Mobile responsive at 390px
```

### Test Scenario 2: Existing Project Redesign
```markdown
Input: "Design forge the dashboard page" (in a project with existing code)
Expected behavior:
- Phase 0: Detects existing Next.js project, reads architecture
- Phase 1: Studies existing design, identifies improvement areas
- Phase 7: Implements WITHOUT breaking other pages
- Full Restructuring Authority used responsibly (change only the target page)

Pass criteria:
- [ ] Other pages still work after implementation
- [ ] Existing navigation/layout preserved
- [ ] No broken imports or missing dependencies
```

### Test Scenario 3: Partial Pipeline
```markdown
Input: "Generate mockups for a fitness app landing page"
Expected behavior:
- Only runs Phases 0-3
- Does NOT proceed to variations or implementation
- Presents mockups and waits

Pass criteria:
- [ ] Stops at the right phase
- [ ] Doesn't over-execute
```

### Test Scenario 4: Error Recovery
```markdown
Test: Start pipeline with NO MCPs connected
Expected behavior:
- Phase 0: Detects missing tools, offers to install
- If user declines: proceeds with Claude-only fallbacks
- Mockup phase skipped gracefully
- Variations still generated (just without AI images)

Pass criteria:
- [ ] No crashes or unhandled errors
- [ ] Clear messaging about what's skipped and why
- [ ] Final output is still functional and well-designed
```

---

## Skill File Architecture (Split Strategy)

The skill is too large for a single file (~5000 lines would eat the entire context window when loaded). Split into a main file + reference files that are loaded on-demand.

### File Structure
```
~/.claude/skills/design-forge/
├── SKILL.md                    (~1,200 lines) — Main skill: pipeline orchestration, triggers, phases
├── reference/
│   ├── techniques.md           (~600 lines)  — Visual mastery CSS/JS library
│   ├── micro-interactions.md   (~400 lines)  — All 30+ micro-interaction code snippets
│   ├── philosophies.md         (~300 lines)  — 13 variation philosophies + briefs
│   └── personas.md             (~150 lines)  — 3 audit persona prompts
```

### How It Works
- **SKILL.md** is the only file Claude loads automatically on trigger
- It contains the full 10-phase pipeline, decision logic, escape hatches, and all instructions
- When a phase needs reference content (e.g., Phase 5 needs techniques), SKILL.md says:
  ```markdown
  **Load reference:** Read `~/.claude/skills/design-forge/reference/techniques.md`
  and include the relevant techniques in each agent's prompt.
  ```
- This way, the techniques library only enters the context when Phase 5 runs — not on every invocation
- Same for micro-interactions (Phase 5), philosophies (Phase 5), and personas (Phase 10)

### What Goes Where

**SKILL.md (main — always loaded):**
- Frontmatter + triggers
- Pipeline overview (10 phases)
- MCP tool table + auto-install commands
- Phase 0-10 orchestration logic (WHAT to do, not the code libraries)
- Error recovery table
- Technique selection logic (the TABLE, not the CSS)
- Design decision log format
- Quick reference
- Technical notes

**reference/techniques.md (loaded on-demand in Phase 5):**
- Background image blending CSS
- Image masking & clipping CSS
- Parallax & depth CSS
- Texture & atmosphere CSS
- Color grading CSS + SVG

**reference/micro-interactions.md (loaded on-demand in Phase 5):**
- All CSS-only animations
- All JS-powered interactions
- Init function

**reference/philosophies.md (loaded on-demand in Phase 5):**
- 13 variation philosophies with full descriptions

**reference/personas.md (loaded on-demand in Phase 10):**
- 3 persona prompt templates

---

## Quick Reference

### Trigger → Action

| User Says | Do This |
|---|---|
| "design forge [page/idea]" | Full pipeline Phase 0-10 |
| "build me a [type] from scratch" | Phase 0 (scaffold) → Full pipeline |
| "generate mockups for [idea]" | Phase 0-3 only (research + mockups) |
| "design variations for [page]" | Phase 0-6 (research + variations + preview) |
| "implement variation [X]" | Phase 7-10 (implement + refine + deploy + audit) |
| "refine the [page]" | Phase 8 only (refinement loop) |
| "audit the app" | Phase 10 only (multi-persona audit) |
| "competitive scorecard" | Phase 9C only |
| "install design tools" | Phase 0B-0C only (MCP installation) |

---

## Technical Notes

### Stack
- **Framework**: Next.js (latest) + React 19
- **Styling**: Tailwind v4 (CSS-first config via `@theme`)
- **Animations**: Pure CSS only (`@keyframes`, `transition`, `@property`)
- **Images**: next/image, WebP, blur placeholders, responsive srcset
- **Fonts**: Google Fonts via `next/font/google`
- **Design System**: CSS custom properties + scoped class prefixes
- **Build**: Turbopack (`npm run dev -- --turbopack`)
- **Deploy**: Vercel (free tier)

### Frontend Restructuring Authority
The skill has FULL authority to restructure the frontend project when implementing designs:
- Reorganize folder structure (move components, create new directories)
- Refactor existing components to fit the new design system
- Replace or remove components that conflict with the new design
- Change routing structure if the design demands it
- Update or replace the CSS architecture (globals.css, theme files)
- Modify layout.tsx, page.tsx, and any wrapper components
- Add/remove/update dependencies as needed

The skill treats the frontend as a canvas, not a constraint. If the existing structure gets in the way of a better design, change the structure.

### Key Lessons
1. Scope ALL custom CSS with unique prefix (e.g., `sv-`, `mx-`)
2. Check body overflow — landing pages may need `position: fixed; inset: 0; overflow-y: auto`
3. Read layout.tsx before adding fonts — they may already exist
4. Each parallel agent has ZERO shared context — include EVERYTHING in the prompt
5. Screenshot by scrolling incrementally, not fullPage mode
6. Tailwind v4 uses `@theme` blocks in CSS, NOT tailwind.config.js
7. `background-attachment: fixed` for persistent gradient backgrounds
8. Always include `prefers-reduced-motion` media query
9. WebP for all images, blur placeholders for above-fold
10. Performance budget: JS < 200KB, CSS < 50KB, LCP < 2.5s
