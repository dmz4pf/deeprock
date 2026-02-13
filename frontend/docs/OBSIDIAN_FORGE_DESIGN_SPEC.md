# Obsidian Forge -- Complete Page Design Specification

**Version:** 1.0
**Date:** 2026-02-10
**Design System:** Obsidian Forge
**Platform:** RWA Gateway -- Institutional Real-World Asset Investment Platform

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Global Design Tokens](#2-global-design-tokens)
3. [Shared Component Patterns](#3-shared-component-patterns)
4. [Page 1: Portfolio Dashboard](#4-portfolio-dashboard)
5. [Page 2: Pools Listing](#5-pools-listing)
6. [Page 3: Pool Detail](#6-pool-detail)
7. [Page 4: Documents](#7-documents)
8. [Page 5: Settings](#8-settings)
9. [Responsive Strategy](#9-responsive-strategy)
10. [Animation & Motion System](#10-animation--motion-system)
11. [Accessibility](#11-accessibility)

---

## 1. Design Philosophy

### Visual References

The Obsidian Forge design language draws from three distinct worlds:

**Bloomberg Terminal** -- Information density done right. Bloomberg conceals complexity behind layers of progressive disclosure. Every pixel serves a purpose. The Terminal's evolution to modern web technologies (Chromium, HTML5, CSS3) while retaining its data-first philosophy is our north star for how we present financial data.

**Apple Design** -- Obsessive attention to typography, whitespace, and micro-interactions. The way Apple layers glass surfaces over depth-rich backgrounds. The way a number counter animates instead of snapping. The way a card lifts with a shadow bloom on hover. That feeling of *quality* before you even read a word.

**Luxury Watch Brands (A. Lange & Sohne, Audemars Piguet)** -- Dark backgrounds that make metallic accents sing. The warmth of rose gold against obsidian. Surfaces that feel like they have weight. Typography that whispers rather than shouts. Marketing pages that sell a $50,000 watch with nothing more than a photograph, a serif headline, and negative space.

### Core Principles

1. **Data clarity is non-negotiable.** Every number, every chart, every indicator must be instantly readable. Beauty serves comprehension.
2. **Warmth over coldness.** This is not a crypto app with neon blues and greens. This is copper, rose gold, and candlelight on dark stone. The palette evokes a private bank's executive lounge, not a trading floor.
3. **Progressive disclosure.** Show what matters first. Reveal detail on interaction. Never overwhelm.
4. **Motion with purpose.** Every animation communicates something -- a value changing, a state transitioning, an element becoming relevant. No animation exists purely for decoration.
5. **Institutional confidence.** The design should make someone managing $10M feel the same sense of trust as someone managing $100M.

---

## 2. Global Design Tokens

### Color System

```
Background Layer
  --forge-bg:               #060504     Obsidian black. The void from which surfaces emerge.
  --forge-surface:          #110F0C     Card/panel backgrounds. Warm charcoal.
  --forge-surface-elevated: #1A1612     Hover states, active elements. Subtle lift.

Accent Palette
  --forge-copper:           #CD7F32     Primary accent. Hero values, active indicators.
  --forge-copper-bright:    #E8A065     Hover/bright state of copper.
  --forge-rose-gold:        #B76E79     Secondary accent. Allocation, categories.
  --forge-violet:           #7C3AED     Tertiary accent. Charts, alternative indicators.
  --forge-teal:             #14B8A6     Quaternary accent. Success, positive values.
  --forge-bronze:           #8B6914     Deep metallic. Commodity accent, subtle backgrounds.

Text Hierarchy
  --forge-text-primary:     #EDE5D8     Warm off-white. Headings, values, primary content.
  --forge-text-secondary:   #9B8B78     Warm gray. Labels, descriptions, secondary content.
  --forge-text-dim:         #5E5248     Dark warm gray. Timestamps, hints, tertiary content.

Semantic Colors
  --forge-success:          #14B8A6     Positive returns, active status, unlocked.
  --forge-danger:           #C45B4A     Negative returns, errors, high risk.
  --forge-warning:          #D4A853     Warnings, medium risk, pending states.

Borders & Surfaces
  --forge-border:           rgba(205,127,50,0.08)    Default card borders.
  --forge-border-hover:     rgba(183,110,121,0.30)   Hover state borders.
  --forge-border-subtle:    rgba(205,127,50,0.04)    Table row dividers.
  --forge-border-strong:    rgba(205,127,50,0.16)    Emphasized borders.
```

### Gradient System

```css
/* Iridescent -- The signature gradient. Used for text, edges, CTAs. */
--forge-iridescent: linear-gradient(135deg, #CD7F32, #B76E79, #7C3AED, #14B8A6, #CD7F32);
/* Requires: background-size: 300% 300%; animation: forgeGradientShift 10s linear infinite; */

/* Iridescent Text -- Same gradient, applied with background-clip. */
--forge-iridescent-text: linear-gradient(135deg, #CD7F32 0%, #B76E79 30%, #7C3AED 55%, #14B8A6 80%, #CD7F32 100%);
/* Requires: -webkit-background-clip: text; -webkit-text-fill-color: transparent; */

/* Metal -- Warmer, copper-dominant. Used for buttons and emphasis. */
--forge-metal: linear-gradient(135deg, #CD7F32, #E8A065, #B76E79, #8B6914, #CD7F32);

/* Chart Area Fill -- Vertical fade for chart backgrounds. */
forge-chart-area: linear-gradient(180deg, rgba(205,127,50,0.18), rgba(183,110,121,0.08), rgba(124,58,237,0.04), transparent);
```

### Typography

```
Font Stack
  Headings:  font-family: 'Playfair Display', Georgia, serif;
  Body:      font-family: 'Outfit', system-ui, -apple-system, sans-serif;

Type Scale (Desktop)
  Hero Value:      52px / Playfair Display 700 / tabular-nums / iridescent text
  Page Title:      28px / Playfair Display 600 / text-primary
  Section Label:   11px / Outfit 600 / text-dim / uppercase / letter-spacing: 0.12em
  Card Title:      14px / Outfit 600 / text-primary
  Body:            14px / Outfit 400 / text-secondary
  Caption:         12px / Outfit 400 / text-dim
  Stat Value:      24px / Outfit 700 / tabular-nums / copper or iridescent
  Table Header:    11px / Outfit 600 / text-dim / uppercase / letter-spacing: 0.08em
  Table Cell:      13px / Outfit 400 / text-primary / tabular-nums (for numbers)
  Badge:           11px / Outfit 600 / uppercase / letter-spacing: 0.06em

Type Scale (Mobile)
  Hero Value:      36px
  Page Title:      22px
  Everything else scales proportionally, minimum 12px for readability.
```

### Spacing System

```
Base unit: 4px

Spacing Scale
  xs:   4px     Inline element gaps
  sm:   8px     Compact element spacing
  md:   12px    Default inner padding
  lg:   16px    Card padding, section gaps
  xl:   24px    Section padding
  2xl:  32px    Major section breaks
  3xl:  48px    Page hero padding

Panel Padding
  Desktop:  20px 24px
  Mobile:   16px 16px

Gap System (between cards/panels)
  Default:  12px (maps to var(--qg-gap) in current system)
  Compact:  8px
  Wide:     16px
```

### Elevation & Shadows

```css
/* Level 0 -- Flat surface, no elevation */
.forge-flat {
  box-shadow: none;
}

/* Level 1 -- Default card. Subtle depth. */
.forge-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
}

/* Level 2 -- Hovered card. Lifted with warm glow. */
.forge-card:hover {
  box-shadow:
    0 16px 48px rgba(205,127,50,0.06),
    0 4px 20px rgba(124,58,237,0.04);
}

/* Level 3 -- Modal/dialog overlay. Deep shadow. */
.forge-modal {
  box-shadow: 0 25px 80px rgba(0,0,0,0.6);
}

/* Level 4 -- Toast/notification. Crisp accent shadow. */
.forge-toast {
  box-shadow:
    0 8px 32px rgba(0,0,0,0.4),
    0 0 20px rgba(205,127,50,0.08);
}
```

---

## 3. Shared Component Patterns

### 3.1 Forge Card (Primary Surface)

The Forge Card is the atomic building block of every page. Every panel, every section, every data container is a Forge Card.

```css
.forge-card {
  background: var(--forge-surface);           /* #110F0C */
  border: 1px solid var(--forge-border);      /* rgba(205,127,50,0.08) */
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease;
}

/* Iridescent top edge -- 1px gradient bar */
.forge-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--forge-iridescent);
  background-size: 300% 100%;
  animation: forgeGradientShift 10s linear infinite;
  opacity: 0.3;
  pointer-events: none;
}

/* Shimmer hover effect -- diagonal iridescent sweep */
.forge-card::after {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(205,127,50,0.06) 40%,
    rgba(183,110,121,0.08) 45%,
    rgba(124,58,237,0.06) 50%,
    rgba(20,184,166,0.08) 55%,
    rgba(205,127,50,0.06) 60%,
    transparent 70%
  );
  transform: translateX(-100%) translateY(-100%);
  transition: transform 0.8s ease;
  pointer-events: none;
  z-index: 2;
}

.forge-card:hover::after {
  transform: translateX(30%) translateY(30%);
}

.forge-card:hover {
  border-color: rgba(183,110,121,0.25);
  box-shadow: 0 16px 48px rgba(205,127,50,0.06), 0 4px 20px rgba(124,58,237,0.04);
  transform: translateY(-2px);
}
```

**Card Variants:**

| Variant | Background | Border | Edge | Hover |
|---------|-----------|--------|------|-------|
| Default | `--forge-surface` | `--forge-border` | Iridescent 0.3 | Full shimmer + lift |
| Static | `--forge-surface` | `--forge-border` | Iridescent 0.3 | None (data panels) |
| Interactive | `--forge-surface` | `--forge-border` | Iridescent 0.35 | Shimmer + lift + border glow |
| Elevated | `--forge-surface-elevated` | `--forge-border-strong` | Iridescent 0.4 | Subtle glow only |
| Hero | `--forge-surface` | None | Full iridescent border (animated) | Breathing glow |

### 3.2 Panel Label

Every panel with a section title uses this label pattern:

```css
.forge-panel-label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--forge-text-dim);         /* #5E5248 */
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--forge-border-subtle);
  margin-bottom: 16px;
}
```

### 3.3 Badge

```css
.forge-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Color variants use 10% opacity background + full opacity text */
.forge-badge-copper  { background: rgba(205,127,50,0.10); color: #CD7F32; }
.forge-badge-teal    { background: rgba(20,184,166,0.10);  color: #14B8A6; }
.forge-badge-violet  { background: rgba(124,58,237,0.10);  color: #7C3AED; }
.forge-badge-rose    { background: rgba(183,110,121,0.10); color: #B76E79; }
.forge-badge-warning { background: rgba(212,168,83,0.10);  color: #D4A853; }
.forge-badge-danger  { background: rgba(196,91,74,0.10);   color: #C45B4A; }
```

### 3.4 Button System

```css
/* Primary -- Iridescent gradient, white text */
.forge-btn-primary {
  background: var(--forge-iridescent);
  background-size: 300% 300%;
  animation: forgeGradientShift 10s linear infinite;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.3s ease;
}

.forge-btn-primary:hover {
  opacity: 0.9;
  box-shadow: 0 0 24px rgba(205,127,50,0.2), 0 0 8px rgba(124,58,237,0.1);
  transform: translateY(-1px);
}

.forge-btn-primary:active {
  transform: translateY(0) scale(0.98);
}

/* Secondary -- Obsidian surface, copper border */
.forge-btn-secondary {
  background: rgba(205,127,50,0.06);
  border: 1px solid rgba(205,127,50,0.12);
  color: #CD7F32;
  font-weight: 500;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.forge-btn-secondary:hover {
  background: rgba(205,127,50,0.10);
  border-color: rgba(205,127,50,0.20);
  box-shadow: 0 0 20px rgba(205,127,50,0.1);
}

/* Ghost -- Transparent, copper text */
.forge-btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: #9B8B78;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.forge-btn-ghost:hover {
  background: rgba(205,127,50,0.04);
  color: #EDE5D8;
}
```

### 3.5 Input / Form Field

```css
.forge-input {
  background: var(--forge-surface-elevated);  /* #1A1612 */
  border: 1px solid var(--forge-border);
  border-radius: 8px;
  padding: 12px 16px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: var(--forge-text-primary);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.forge-input::placeholder {
  color: var(--forge-text-dim);
}

.forge-input:focus {
  outline: none;
  border-color: rgba(205,127,50,0.5);
  box-shadow:
    0 0 0 3px rgba(205,127,50,0.15),
    0 0 20px rgba(205,127,50,0.2);
}

/* Input Label */
.forge-input-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--forge-text-dim);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}
```

### 3.6 Toggle Switch

```css
.forge-toggle {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: rgba(205,127,50,0.1);
  position: relative;
  cursor: pointer;
  transition: background 200ms ease;
  border: none;
}

.forge-toggle[data-active="true"] {
  background: #CD7F32;
}

.forge-toggle-knob {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #EDE5D8;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: left 200ms ease;
}

.forge-toggle[data-active="true"] .forge-toggle-knob {
  left: 21px;
}
```

### 3.7 Table

```css
/* Table Header Row */
.forge-table-header {
  display: grid;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--forge-border-subtle);
}

.forge-table-header-cell {
  font-size: 11px;
  font-weight: 600;
  color: var(--forge-text-dim);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Table Data Row */
.forge-table-row {
  display: grid;
  padding: 10px 0;
  border-bottom: 1px solid rgba(205,127,50,0.03);
  align-items: center;
  transition: background 0.25s ease;
}

.forge-table-row:hover {
  background: var(--forge-surface-elevated);
}

.forge-table-cell {
  font-size: 13px;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
}
```

### 3.8 Skeleton / Loading State

```css
.forge-skeleton {
  background: rgba(205,127,50,0.03);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.forge-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(205,127,50,0.04),
    transparent
  );
  transform: translateX(-100%);
  animation: forgeShimmerSweep 2s infinite;
}

@keyframes forgeShimmerSweep {
  100% { transform: translateX(100%); }
}
```

---

## 4. Portfolio Dashboard

### 4.0 Design Intent

The Portfolio Dashboard is the nerve center. It should feel like sitting at a Bloomberg Terminal designed by Jony Ive -- every piece of data is instantly accessible, beautifully presented, and laid out with the visual hierarchy of a magazine spread. The eye should move naturally from the hero value (top-left) to the allocation ring (center) to the yield matrix (right), then down through the active investments table, asset cards, and live feed.

### 4.1 Layout Grid

```
Desktop (1200px+)
+------------------------------------------------------------------+
| HEADER (fixed, 56px)                                             |
+--------+---------------------------------------------------------+
| SIDEBAR|  CONTENT AREA (12-column grid, max-width: 1400px)      |
| (240px)|  Padding: 24px                                          |
|        |  Gap: 12px between rows                                  |
|        |                                                          |
|        | Row 1: [Portfolio Chart 5col] [Allocation 3col] [Yield Matrix 4col]
|        | Row 2: [Active Investments -------full 12col---------]  |
|        | Row 3: [Asset Cards ----------8col] [Risk Radar----4col]|
|        | Row 4: [Live Feed -----------8col] [30d Returns---4col] |
+--------+---------------------------------------------------------+

Tablet (768px-1199px)
  Row 1: [Chart 6col] [Allocation 6col]
  Row 2: [Yield Matrix ---full 12col---]
  Row 3: [Active Investments ---12col--]
  Row 4: [Asset Cards ------12col-----]
  Row 5: [Risk Radar 6col] [Returns 6col]
  Row 6: [Live Feed ---full 12col------]

Mobile (< 768px)
  Single column stack. Each panel takes full width.
  Row 1: [Portfolio Value (hero)]
  Row 2: [Allocation Ring]
  Row 3: [Yield Matrix (horizontal scroll)]
  Row 4: [Active Investments (horizontal scroll)]
  Row 5: [Asset Cards (2-col grid)]
  Row 6: [Risk Radar]
  Row 7: [Live Feed]
  Row 8: [30d Returns]
```

### 4.2 Component Hierarchy & Specifications

#### 4.2.1 Portfolio Hero Value (inside Portfolio Chart panel)

**Position:** Absolute top-right of chart panel.
**Z-index:** 1 (above chart canvas).

```
Layout:
  +----------------------------------------------------+
  | PORTFOLIO VALUE              $2,847,392.50          |
  | [section label]              [hero value, right]    |
  |                              +12.47% (30d)          |
  |                              [change indicator]      |
  | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~      |
  | [    SVG Performance Line Chart fills panel    ]    |
  | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~      |
  +----------------------------------------------------+
```

**Hero Value Styling:**
```css
.portfolio-hero-value {
  font-family: 'Playfair Display', serif;
  font-size: 28px;        /* Constrained to fit within panel overlay */
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  /* Apply iridescent text treatment */
  background: var(--forge-iridescent-text);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: forgeGradientShift 10s linear infinite, forgeHeroGlow 4s ease-in-out infinite;
}

/* Animated counter: value ticks up from 0 to final value over 2500ms */
/* Use requestAnimationFrame with easeOutExpo for natural deceleration */
```

**Change Indicator:**
```css
.portfolio-change {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
}
.portfolio-change--positive { color: var(--forge-success); } /* #14B8A6 */
.portfolio-change--negative { color: var(--forge-danger); }  /* #C45B4A */
```

#### 4.2.2 Performance Line Chart

**Type:** SVG-based line chart with gradient area fill.
**Size:** Fills parent panel below the hero value overlay.
**Height:** 200px desktop, 160px mobile.

```
Chart Elements:
  - Grid lines: horizontal only, dashed, color: rgba(94,82,72,0.12)
  - Y-axis labels: font: Outfit 11px, color: --forge-text-dim, left-aligned
  - X-axis labels: font: Outfit 11px, color: --forge-text-dim
  - Line stroke: 2px, gradient copper -> rose-gold -> violet
  - Area fill: vertical gradient (forge-chart-area)
  - Endpoint: Pulsing copper dot (6px radius)
    - Inner dot: solid #CD7F32
    - Outer ring: expanding, fading ring (animation: obsidianPulseRing 2.5s infinite)
  - Tooltip on hover: forge-elevated card with value + date

Time Range Tabs (above chart or in panel header):
  [7D] [30D] [90D] [1Y] [ALL]
  - Active: copper text + copper underline (2px)
  - Inactive: text-dim, hover: text-secondary
  - Font: Outfit 12px, 600 weight, uppercase
  - Tab container: 4px gap, no background
```

**Line Animation on Mount:**
```css
.forge-chart-line {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: obsidianLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
}

.forge-chart-area {
  opacity: 0;
  animation: obsidianAreaReveal 1s ease 1.4s forwards;
}
```

#### 4.2.3 Allocation Donut Ring

**Type:** SVG donut chart with animated arcs.
**Outer radius:** 80px. **Inner radius:** 55px. **Stroke width:** 25px.

```
Layout:
  +-------------------------------+
  | ALLOCATION                    |
  |                               |
  |        ___________            |
  |      /   $2.85M   \          |
  |     |    TOTAL      |         |
  |      \___________/            |
  |                               |
  | [Legend items below ring]     |
  |  ● Treasuries    42%  $1.2M  |
  |  ● Real Estate   28%  $798K  |
  |  ● Private Credit 18% $513K  |
  |  ● Corp. Bonds    8%  $228K  |
  |  ● Commodities    4%  $114K  |
  +-------------------------------+
```

**Ring Segments:**
```
Color mapping (same as asset class):
  Treasury:       #CD7F32 (copper)
  Real Estate:    #B76E79 (rose gold)
  Private Credit: #7C3AED (violet)
  Corporate Bonds:#14B8A6 (teal)
  Commodities:    #8B6914 (bronze)

Gap between segments: 3px (transparent gap via stroke-dasharray)
Segment animation: obsidianRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) staggered by 0.1s per segment
```

**Center Label:**
```css
.donut-center-value {
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
}

.donut-center-label {
  font-family: 'Outfit', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--forge-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}
```

**Legend Items:**
```css
.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.donut-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.donut-legend-label {
  font-size: 12px;
  color: var(--forge-text-secondary);
  flex: 1;
}

.donut-legend-value {
  font-size: 12px;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
}
```

#### 4.2.4 Yield Matrix Heatmap

**Type:** Grid heatmap (asset classes x days of week).
**Dimensions:** Rows = unique asset classes held. Columns = 7 days (Mon-Sun).

```
Layout:
  +---------------------------------------------+
  | YIELD MATRIX (7-DAY)                        |
  |                                              |
  |      Mon  Tue  Wed  Thu  Fri  Sat  Sun      |
  | TRES [3.2] [4.1] [2.8] [5.5] [3.7] [2.1] [4.8] |
  | REAL [2.4] [3.3] [4.5] [2.9] [3.8] [5.1] [3.2] |
  | CRED [5.2] [4.8] [3.1] [4.6] [5.9] [3.4] [4.2] |
  | BOND [1.8] [2.5] [3.2] [2.1] [2.8] [1.5] [3.1] |
  | COMM [4.1] [3.6] [5.0] [3.8] [4.3] [2.7] [3.9] |
  +---------------------------------------------+
```

**Cell Styling:**
```css
.heatmap-cell {
  border-radius: 3px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  transition: all 0.4s ease-out;
  /* Cell entrance: scale from 0.5 to 1, opacity 0 to 1, staggered by (row*7 + col) * 30ms */
}

/* Color scale: HSL-based warm tones */
/* Low yield (0-0.4):   hsl(25, 50-65%, 10-26%)  -- dark copper */
/* Med yield (0.4-0.7): hsl(28, 65-75%, 26-35%)  -- warm amber */
/* High yield (0.7-1.0):hsl(30, 75-80%, 35-50%)  -- bright gold */

/* Hover: tooltip shows exact yield value + 24h change */
```

**Column Headers:**
```
Font: Outfit 11px, color: --forge-text-dim, centered, padding-bottom: 4px
```

**Row Labels:**
```
Font: Outfit 11px, color: asset-class-color at 70% opacity
Content: First 4 characters of asset/pool name, uppercase
```

#### 4.2.5 Active Investments Table

**Type:** Full-width data table with 6 columns.
**Grid template:** `2fr 1fr 1fr 1fr 1fr 100px`

```
+-----------------------------------------------------------------------+
| ACTIVE INVESTMENTS                                                     |
|                                                                        |
| POOL              VALUE       APY     LOCK PERIOD  STATUS    ACTION    |
| --------------------------------------------------------------------------|
| ● US Treasury     $1,200,000  5.3%    90d          Unlocked  [Redeem]  |
| ● Real Estate LP  $798,000    7.8%    180d         45d left  [Locked]  |
| ● Credit Pool III $513,200    12.1%   365d         Unlocked  [Redeem]  |
| ● Corp Bond AAA   $228,000    4.2%    30d          12d left  [Locked]  |
| ● Gold Trust      $114,500    3.8%    None         Unlocked  [Redeem]  |
+-----------------------------------------------------------------------+
```

**Row Specifications:**
```
Pool Name Column:
  - Left: 8px colored dot (asset class color)
  - Name: Outfit 13px, 500 weight, text-primary
  - Subtitle: Outfit 11px, text-dim (asset class label)

Value Column:
  - Outfit 13px, 500 weight, text-primary
  - tabular-nums for alignment

APY Column:
  - Outfit 13px, color: --forge-success (#14B8A6)
  - tabular-nums

Lock Period Column:
  - If > 0: Outfit 12px, text-primary, "{days}d"
  - If 0: Outfit 12px, text-dim, "None"

Status Column:
  - Unlocked: forge-badge-teal "Unlocked"
  - Locked: forge-badge-warning "{days}d left"

Action Column:
  - Unlocked: forge-btn-secondary "Redeem" (clickable, navigates to pool)
  - Locked: ghost button "Locked" (disabled, muted styling)
```

**Row Hover:**
```css
background: var(--forge-surface-elevated);
transition: background 0.25s ease;
```

**Mobile:** Horizontal scroll with fixed first column (pool name), or convert to card layout.

#### 4.2.6 Asset Cards Grid

**Type:** Responsive grid of individual holding cards.
**Grid:** `repeat(4, 1fr)` on desktop, `repeat(2, 1fr)` on mobile.
**Gap:** 10px.

```
Single Asset Card:
  +------------------------------------+
  | [●] Pool Name                      |
  |     [Asset Class Badge]            |
  |                                    |
  | $1,200,000        [~~sparkline~~]  |
  | +12.47%  5.3% APY                 |
  |                                    |
  | [======allocation bar=====] 42.1%  |
  +------------------------------------+
```

**Card Styling:**
```css
.asset-card {
  background: rgba(205,127,50,0.02);
  border: 1px solid {asset-color}15;   /* 15 = ~8% opacity */
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  /* Entrance: slide-up animation, staggered by index * 120ms */
}

.asset-card:hover {
  border-color: {asset-color}30;
  background: rgba(205,127,50,0.04);
  transform: translateY(-2px);
}
```

**Sparkline:**
```
Size: 60px wide, 24px tall
Stroke: 1.5px, color: asset class color
Rounded line caps
Data: 14 points of generated price history
```

**Allocation Bar:**
```css
.allocation-bar-track {
  height: 2px;
  background: rgba(205,127,50,0.04);
  border-radius: 1px;
  overflow: hidden;
}

.allocation-bar-fill {
  height: 100%;
  background: {asset-color};
  border-radius: 1px;
  box-shadow: 0 0 8px {asset-color}66;
  /* Animated width from 0% to final%, duration: 1.5s, ease-out, delay: 0.5s + index * 150ms */
}
```

#### 4.2.7 Risk Radar Gauge

**Type:** Semi-circular SVG gauge with indicator needle.
**Size:** 160px diameter.

```
Layout:
  +-------------------------------+
  | RISK RADAR                    |
  |                               |
  |        [Semi-arc gauge]       |
  |           72                  |
  |          HEALTH               |
  |                               |
  | Low         Medium       High |
  | Volatility  Liquidity  Exposure|
  +-------------------------------+
```

**Gauge Specifications:**
```
SVG viewBox: 0 0 160 100
Arc: 180-degree semi-circle
Radius: 60px
Stroke width: 10px
Track: rgba(205,127,50,0.06)
Fill gradient (based on score):
  0-40:  #C45B4A (danger red)
  41-70: #D4A853 (warning gold)
  71-100:#14B8A6 (success teal)

Center value: Outfit 28px, 700 weight, text-primary
Center label: Outfit 10px, 600 weight, text-dim, uppercase, tracking 0.15em

Arc animation: obsidianRingReveal 1.4s, stroke-dashoffset animates from 300 to calculated value
```

**Risk Indicators (below gauge):**
```
3 columns, centered:
  Value: Outfit 12px, 600 weight, semantic color
  Label: Outfit 11px, text-dim, margin-top: 2px
  Gap: 16px between columns
```

#### 4.2.8 Live Transaction Feed

**Type:** Scrollable list of recent events, auto-updating feel.

```
Layout:
  +-------------------------------+
  | LIVE FEED                     |
  |                               |
  | 14:32:08 YIELD                |
  | Treasuries yield distributed  |
  |                      +$1,247  |
  | ─────────────────────         |
  | 14:31:55 TX                   |
  | Credit pool rebalance         |
  |                      $45,000  |
  | ─────────────────────         |
  | ... (scrollable, max 8 items) |
  +-------------------------------+
```

**Feed Item Styling:**
```css
.feed-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--forge-border-subtle);
  /* Entrance: fade-in from right, stagger 60ms per item */
}

.feed-timestamp {
  font-family: monospace;
  font-size: 11px;
  color: var(--forge-text-dim);
}

.feed-type-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-left: 8px;
}

/* Type colors */
.feed-type-YIELD  { color: #14B8A6; }
.feed-type-TX     { color: #CD7F32; }
.feed-type-SYNC   { color: #7C3AED; }
.feed-type-ALERT  { color: #D4A853; }

.feed-message {
  font-size: 13px;
  color: var(--forge-text-secondary);
  margin-top: 2px;
}

.feed-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
```

#### 4.2.9 Return Bars (30-Day Return)

**Type:** Horizontal bar chart showing returns by asset class.

```
Layout:
  +-------------------------------+
  | 30-DAY RETURN                 |
  |                               |
  | Treasuries                    |
  | [==========] 8.2%            |
  |                               |
  | Real Estate                   |
  | [===============] 12.5%      |
  |                               |
  | Private Credit                |
  | [==================] 15.1%   |
  |                               |
  | Corp. Bonds                   |
  | [=======] 6.8%               |
  +-------------------------------+
```

**Progress Bar Styling:**
```css
.return-bar-label {
  font-size: 12px;
  color: var(--forge-text-secondary);
  margin-bottom: 4px;
}

.return-bar-track {
  height: 6px;
  background: rgba(205,127,50,0.06);
  border-radius: 3px;
  overflow: hidden;
}

.return-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--forge-iridescent);
  background-size: 300% 100%;
  /* Width animated from 0% to value%, delay: 0.3s + index * 150ms */
  transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.return-bar-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
  text-align: right;
  margin-top: 2px;
}
```

### 4.3 Portfolio Dashboard -- Animation Choreography

```
Entrance sequence (all elements use obsidianFadeIn):

t=0ms:     Row 1 container fades in
t=0ms:     Portfolio Chart panel (delay 0)
t=70ms:    Allocation panel (delay 1)
t=140ms:   Yield Matrix panel (delay 2)
t=300ms:   Chart line begins drawing (obsidianLineReveal, 2s)
t=500ms:   Donut segments begin revealing (staggered 100ms each)
t=500ms:   Heatmap cells begin scaling in (staggered 30ms each)
t=700ms:   Row 2 (Active Investments) fades in
t=1300ms:  Chart area fill fades in
t=1400ms:  Row 3 (Asset Cards + Risk Radar) fades in
t=1500ms:  Hero value counter begins animating (2500ms)
t=1600ms:  Asset card allocation bars begin filling
t=2100ms:  Row 4 (Live Feed + Returns) fades in
t=2200ms:  Risk gauge arc begins drawing
t=2500ms:  Return bars begin filling
```

---

## 5. Pools Listing

### 5.0 Design Intent

The Pools Listing is the marketplace. It should feel like walking into a curated gallery of investment opportunities -- each category card is a "room" you can enter, and the full pool list below is the comprehensive catalog. The design borrows from premium e-commerce (think Net-A-Porter's category pages) while maintaining the information density of a Bloomberg screener.

### 5.1 Layout Grid

```
Desktop (1200px+)
+------------------------------------------------------------------+
| Row 0: Hero Panel (full width)                                    |
|   [Page Title + Description]     [TVL] [Pools Count] [Avg APY]  |
+------------------------------------------------------------------+
| Row 1: Category Cards (auto-fill grid)                            |
|   [Treasury] [Real Estate] [Private Credit] [Corp Bonds] [Commodities] |
+------------------------------------------------------------------+
| Row 2: All Pools Header                                           |
|   "ALL POOLS (24)" -- section label                              |
+------------------------------------------------------------------+
| Row 3: Pool Rows (stacked cards)                                  |
|   [Pool Row 1]                                                    |
|   [Pool Row 2]                                                    |
|   [Pool Row 3]                                                    |
|   ...                                                             |
+------------------------------------------------------------------+

Category grid: repeat(auto-fill, minmax(280px, 1fr))
Pool rows: full width, 8px gap

Tablet: Category cards become 2 columns
Mobile: Category cards single column, pool rows become compact cards
```

### 5.2 Component Specifications

#### 5.2.1 Hero Panel

```
Layout:
  +------------------------------------------------------------------+
  | Investment Pools                    TOTAL TVL    POOLS   AVG APY  |
  | Real-world assets tokenized         $14.2M       24     7.3%     |
  | on Avalanche                                                      |
  +------------------------------------------------------------------+
```

**Title:** Playfair Display 28px, 700 weight, text-primary.
**Subtitle:** Outfit 14px, text-secondary.
**Stat Blocks (right side):**
```css
.pools-stat-value {
  font-family: 'Outfit', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
  /* TVL stat: animated counter from 0 to final over 2000ms */
  /* APY stat: color --forge-success (#14B8A6) */
}

.pools-stat-label {
  font-size: 12px;
  color: var(--forge-text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

#### 5.2.2 Category Card

```
Layout:
  +------------------------------------+
  | [Icon]  Treasury          ~~spark~~ |
  |         3 pools                     |
  |                                     |
  | TVL                                 |
  | $4,200,000           [5.3% APY]    |
  +------------------------------------+
```

**Card:** forge-card interactive variant.
**Icon Container:**
```css
.category-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba({category-rgb}, 0.1);
}

.category-icon {
  width: 24px;
  height: 24px;
  color: rgb({category-rgb});
}
```

**Category Name:** Outfit 14px, 600 weight, text-primary.
**Pool Count:** Outfit 12px, text-dim.
**TVL Label:** Outfit 12px, text-dim, letter-spacing 0.1em.
**TVL Value:** Outfit 28px, 700 weight, text-primary, tabular-nums. Apply `forge-glow-copper` text shadow.
**APY Badge:** forge-badge with category color.

**Sparkline:** 80px wide, 28px tall, category color, positioned top-right.

**Hover:** Full shimmer sweep + lift + border glow to `rgba({category-rgb}, 0.20)`.

#### 5.2.3 Pool Row

Each pool is displayed as a row within a forge-card.

```
Grid template: 2.5fr 1fr 1fr 1fr 1fr
Columns: [Pool Name + Class] [TVL] [APY] [Lock Period] [Risk]
```

**Pool Name:** Outfit 14px, 500 weight, text-primary.
**Asset Class:** Outfit 12px, text-dim.
**TVL:** Outfit 14px, text-primary, tabular-nums.
**APY:** Outfit 14px, 600 weight, --forge-success.
**Lock Period:** Outfit 13px, text-dim. `{days}d` or `None`.
**Risk Badge:** forge-badge with semantic color (low=teal, medium=warning, high=danger).

**Row Hover:** Background shifts to `var(--forge-surface-elevated)`.
**Click:** Navigates to Pool Detail page.

**Mobile Pool Card (< 768px):**
Convert to stacked card layout:
```
+------------------------------------+
| Pool Name              [Risk Badge]|
| Asset Class                        |
| ────────────────────────           |
| TVL: $4.2M    APY: 5.3%           |
| Lock: 90d     [Invest -->]        |
+------------------------------------+
```

---

## 6. Pool Detail

### 6.0 Design Intent

The Pool Detail page is where conviction meets action. The top section builds confidence (performance data, composition, metrics) and the right side or bottom provides the action (investment form). Think of it as a securities prospectus condensed into a single, beautiful page. The investment form should feel as trustworthy as entering a wire transfer at a private bank.

### 6.1 Layout Grid

```
Desktop (1200px+)
+------------------------------------------------------------------+
| Row 0: Back Navigation                                            |
|   [< Back to Pools]                                              |
+------------------------------------------------------------------+
| Row 1: Pool Hero (full width)                                     |
|   [Pool Name + Description]    [APY] [TVL] [Lock] [Risk]        |
+------------------------------------------------------------------+
| Row 2: [Performance Chart --------8col] [Invest Form ----4col]   |
+------------------------------------------------------------------+
| Row 3: [Pool Composition --6col] [Pool Stats ----------6col]     |
+------------------------------------------------------------------+
| Row 4: [Historical Returns -------full 12col---------]           |
+------------------------------------------------------------------+

Mobile: Everything stacks. Investment form becomes a sticky bottom sheet/CTA.
```

### 6.2 Component Specifications

#### 6.2.1 Back Navigation

```css
.pool-detail-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--forge-text-dim);
  text-decoration: none;
  padding: 8px 0;
  transition: color 0.2s ease;
}

.pool-detail-back:hover {
  color: var(--forge-text-primary);
}

/* Left arrow icon: Lucide ArrowLeft, 16px */
```

#### 6.2.2 Pool Hero Panel

```
Layout:
  +------------------------------------------------------------------+
  |                                                                    |
  | US Treasury Fund                 APY          TVL                  |
  | Short-term US Treasury bills     5.25%        $10.0M              |
  | providing stable returns         [iridescent] [stat]              |
  |                                                                    |
  | [Low Risk Badge]  [90d Lock]     LOCK PERIOD  MIN INVEST          |
  |                                  90 days      $100                 |
  +------------------------------------------------------------------+
```

**Pool Name:** Playfair Display 28px (desktop) / 22px (mobile), 600 weight, text-primary.
**Description:** Outfit 14px, text-secondary, max 2 lines.
**APY Value:** Outfit 32px, 700 weight, iridescent text treatment. The visual anchor.
**APY Label:** Outfit 11px, text-dim, uppercase.

**Stat Blocks (4 across on desktop, 2x2 on mobile):**
```
| APY       | TVL        | Lock Period | Min Investment |
| 5.25%     | $10.0M     | 90 days     | $100           |
| iridescent| text-primary| text-primary| text-primary   |
```

**Risk Badge:** Large forge-badge, positioned below pool name.
**Lock Badge:** forge-badge-warning if lockup > 0, forge-badge-teal if 0.

#### 6.2.3 Performance Chart

Same specifications as Portfolio Chart (Section 4.2.2) but showing yield rate history.

**Y-axis:** Yield percentage (e.g., 4.0% - 6.0%)
**X-axis:** 30 days
**Data:** Historical yield rate fluctuation

#### 6.2.4 Investment Form

```
Layout (right column panel):
  +----------------------------------+
  | INVEST                           |
  |                                  |
  | [Deposit] [Withdraw]  (tab toggle)|
  |                                  |
  | Amount                           |
  | [______________ USDC] [MAX]      |
  |                                  |
  | Quick amounts:                   |
  | [$100] [$500] [$1000] [$5000]   |
  |                                  |
  | ──────────────────               |
  | You receive:     ~189.47 tokens  |
  | Current APY:     5.25%           |
  | Lock period:     90 days         |
  | Min investment:  $100.00         |
  | ──────────────────               |
  |                                  |
  | [====== Invest Now ======]       |
  | (iridescent gradient button)     |
  |                                  |
  +----------------------------------+
```

**Tab Toggle (Deposit/Withdraw):**
```css
.invest-tab-group {
  display: flex;
  background: var(--forge-surface-elevated);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.invest-tab {
  flex: 1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--forge-text-dim);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.invest-tab--active {
  background: var(--forge-surface);
  color: var(--forge-text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
```

**Amount Input:**
```css
.invest-amount-input {
  background: var(--forge-surface-elevated);
  border: 1px solid var(--forge-border);
  border-radius: 10px;
  padding: 16px;
  font-size: 24px;
  font-weight: 700;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
  text-align: left;
  width: 100%;
}

.invest-amount-input:focus {
  border-color: rgba(205,127,50,0.5);
  box-shadow: 0 0 0 3px rgba(205,127,50,0.15);
}

/* Token suffix ("USDC") positioned absolute right */
.invest-token-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--forge-text-dim);
}

/* MAX button */
.invest-max-btn {
  font-size: 11px;
  font-weight: 700;
  color: #CD7F32;
  background: rgba(205,127,50,0.08);
  border: 1px solid rgba(205,127,50,0.15);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
}
```

**Quick Amount Buttons:**
```css
.quick-amount-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--forge-text-secondary);
  background: rgba(205,127,50,0.04);
  border: 1px solid var(--forge-border);
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-amount-btn:hover {
  background: rgba(205,127,50,0.08);
  border-color: rgba(205,127,50,0.15);
  color: var(--forge-text-primary);
}

.quick-amount-btn--active {
  background: rgba(205,127,50,0.12);
  border-color: rgba(205,127,50,0.25);
  color: #CD7F32;
}
```

**Summary Rows:**
```css
.invest-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.invest-summary-label {
  font-size: 13px;
  color: var(--forge-text-dim);
}

.invest-summary-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
}
```

**Submit Button:**
```css
/* Full-width forge-btn-primary */
.invest-submit {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 700;
  /* Inherits iridescent gradient from forge-btn-primary */
}

.invest-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  animation: none;
  background: rgba(205,127,50,0.06);
  color: var(--forge-text-dim);
}
```

#### 6.2.5 Pool Composition

```
Layout:
  +----------------------------------+
  | POOL COMPOSITION                 |
  |                                  |
  | Underlying Assets                |
  | ● US Treasury Bills    65%       |
  | [====================] (bar)     |
  | ● Treasury Notes       25%       |
  | [=============] (bar)            |
  | ● Cash Reserves        10%       |
  | [=====] (bar)                    |
  |                                  |
  | Strategy: Buy & Hold             |
  | Rebalancing: Monthly             |
  | Custodian: Qualified Custodian   |
  +----------------------------------+
```

**Composition Bars:**
```css
.composition-item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.composition-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: {asset-color};
}

.composition-name {
  font-size: 13px;
  color: var(--forge-text-secondary);
  flex: 1;
}

.composition-pct {
  font-size: 13px;
  font-weight: 600;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
}

.composition-bar-track {
  height: 4px;
  background: rgba(205,127,50,0.04);
  border-radius: 2px;
  margin-bottom: 12px;
}

.composition-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: {asset-color};
  transition: width 1s ease-out;
}
```

#### 6.2.6 Pool Stats Grid

```
Layout (2x3 or 3x2 grid):
  +------------------------------------+
  | POOL DETAILS                       |
  |                                    |
  | Total Value       Available        |
  | $10,000,000       $7,500,000       |
  |                                    |
  | Utilization       Inception        |
  | 25%               Jan 15, 2026    |
  |                                    |
  | Investors         Status           |
  | 142               [Active]         |
  +------------------------------------+
```

Each stat:
```css
.pool-stat-item {
  padding: 12px 0;
}

.pool-stat-label {
  font-size: 11px;
  color: var(--forge-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.pool-stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--forge-text-primary);
  font-variant-numeric: tabular-nums;
}
```

---

## 7. Documents

### 7.0 Design Intent

The Documents page handles on-chain document verification and sealing -- a compliance-critical feature. The design should feel secure and authoritative, like a digital notary's office. Clean, minimal, with clear status indicators. The monospace hash displays should feel technical but not intimidating.

### 7.1 Layout Grid

```
Desktop: Single column, max-width: 800px, centered.
+------------------------------------------------------------------+
| Row 0: Header                                                     |
|   Documents                                                       |
|   Verify and seal documents on-chain                             |
+------------------------------------------------------------------+
| Row 1: Tab Buttons                                                |
|   [Verify] [Seal]                                                |
+------------------------------------------------------------------+
| Row 2: Tab Content (varies)                                       |
|   Verify: Input + Button + Result                                |
|   Seal: Input fields + Button (disabled until wallet connected)  |
+------------------------------------------------------------------+
| Row 3: Recent Documents Table                                     |
|   Hash | Metadata | Sealed At | TX                               |
+------------------------------------------------------------------+
```

### 7.2 Component Specifications

#### 7.2.1 Page Header

```
Title: Playfair Display 22px, 600 weight, text-primary
Subtitle: Outfit 14px, text-dim, margin-top: 4px
Container: forge-card
```

#### 7.2.2 Tab Buttons

```css
/* Tab group: horizontal flex, 8px gap */
.doc-tab {
  /* When active: forge-btn-primary (iridescent) */
  /* When inactive: forge-btn-ghost */
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
}
```

#### 7.2.3 Verify Section

```
+----------------------------------+
| Document Hash                     |
| [Enter document hash to verify...] |
|                                   |
| [===== Verify Document =====]    |
+----------------------------------+

Result (if found):
+----------------------------------+
| VERIFICATION RESULT              |
|                                   |
| Status         [Sealed] (badge)  |
| Sealer         0x1234...5678     |
| Sealed At      Feb 10, 2026     |
| Metadata       KYC Document     |
+----------------------------------+

Result (if not found):
+----------------------------------+
|         [Not Found] (badge)      |
| Document not found or            |
| verification failed.             |
+----------------------------------+
```

**Verification Result Rows:**
```css
.verify-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.verify-result-label {
  font-size: 12px;
  color: var(--forge-text-dim);
}

.verify-result-value {
  font-size: 14px;
  color: var(--forge-text-primary);
}

/* Hash values get monospace treatment */
.verify-hash {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  letter-spacing: 0.02em;
}
```

#### 7.2.4 Recent Documents Table

```
Grid template: 2fr 1.5fr 1.5fr 1fr
Columns: [Hash] [Metadata] [Sealed At] [TX Hash]
```

All hash values displayed in monospace with truncation: `0x1234...5678`.
Table follows standard forge-table styling (Section 3.7).

---

## 8. Settings

### 8.0 Design Intent

Settings is personal. It should feel like opening the back of a fine watch -- intimate, precise, and well-organized. Maximum width: 600px, left-aligned. Each section is a distinct panel with clear purpose. The design should convey trust and control.

### 8.1 Layout Grid

```
Desktop: Single column, max-width: 600px, left-aligned.
+------------------------------------------------------------------+
| Row 0: Page Title                                                 |
|   Settings                                                        |
+------------------------------------------------------------------+
| Row 1: Profile Panel                                              |
|   [Avatar] Name, Email, Auth Provider                            |
+------------------------------------------------------------------+
| Row 2: Wallet Panel                                               |
|   Address, Copy button                                           |
+------------------------------------------------------------------+
| Row 3: Security Panel                                             |
|   Passkey status, Manage link                                    |
+------------------------------------------------------------------+
| Row 4: Notifications Panel                                        |
|   Toggle switches for email, alerts, yields                     |
+------------------------------------------------------------------+
```

### 8.2 Component Specifications

#### 8.2.1 Profile Panel

```
Layout:
  +----------------------------------+
  | PROFILE                          |
  |                                  |
  | [D]  Dami Oladipo              |
  |      dami@example.com           |
  |      [Email] (badge)            |
  +----------------------------------+
```

**Avatar:**
```css
.settings-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, {provider-color}40, {provider-color}20);
  border: 1px solid {provider-color}40;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: {provider-color};
  flex-shrink: 0;
}

/* Hover: copper glow bloom */
.settings-avatar:hover {
  box-shadow: 0 0 20px rgba(205,127,50,0.15);
}
```

**Display Name:** Outfit 18px, 600 weight, text-primary.
**Email:** Outfit 14px, text-dim.
**Provider Badge:** forge-badge-copper.

#### 8.2.2 Wallet Panel

```
Layout:
  +----------------------------------+
  | WALLET                           |
  |                                  |
  | 0x1234...5678          [Copy]   |
  | Smart Account                    |
  +----------------------------------+
```

**Address:** Monospace 14px, text-primary.
**Label:** Outfit 12px, text-dim.
**Copy Button:** forge-btn-ghost, small size. Shows "Copied" with teal color for 2s.

#### 8.2.3 Security Panel

```
Layout:
  +----------------------------------+
  | SECURITY                         |
  |                                  |
  | Passkey / Biometrics  [Enabled] |
  |                       (or [Not Set Up]) |
  |                                  |
  | [===== Manage Passkeys =====]   |
  +----------------------------------+
```

**Status Badge:**
- Enabled: forge-badge-teal with pulsing dot.
- Not Set Up: forge-badge-danger.

**Manage Button:** forge-btn-secondary, full width.

#### 8.2.4 Notification Toggles

```
Layout:
  +----------------------------------+
  | NOTIFICATIONS                    |
  |                                  |
  | Email Notifications      [ON ]  |
  | Investment Alerts        [ON ]  |
  | Yield Updates            [OFF]  |
  +----------------------------------+
```

Each row: flex, space-between, 14px gap.
**Label:** Outfit 14px, text-secondary.
**Toggle:** Forge toggle (Section 3.6).

---

## 9. Responsive Strategy

### Breakpoints

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm  -- Tablet portrait */ }
@media (min-width: 768px)  { /* md  -- Tablet landscape */ }
@media (min-width: 1024px) { /* lg  -- Desktop small */ }
@media (min-width: 1280px) { /* xl  -- Desktop standard */ }
@media (min-width: 1536px) { /* 2xl -- Desktop wide */ }
```

### Grid Behavior by Breakpoint

| Component | Mobile (<640) | Tablet (640-1023) | Desktop (1024+) |
|-----------|--------------|-------------------|-----------------|
| Portfolio Row 1 | Stack vertical | 2+1 columns | 5+3+4 columns |
| Portfolio Row 3 | Stack vertical | Stack vertical | 8+4 columns |
| Category Cards | 1 column | 2 columns | Auto-fill min(280px) |
| Pool Rows | Card layout | Table (scrollable) | Full table |
| Pool Detail | Stack + sticky CTA | 8+4 columns | 8+4 columns |
| Settings | Full width | 600px max | 600px max |
| Documents | Full width | 800px max | 800px max |

### Mobile-Specific Patterns

**Bottom Navigation:**
```css
.forge-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--forge-surface);
  border-top: 1px solid var(--forge-border);
  display: flex;
  z-index: 50;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Iridescent top edge */
.forge-bottom-nav::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--forge-iridescent);
  background-size: 300% 100%;
  animation: forgeGradientShift 10s linear infinite;
  opacity: 0.2;
}
```

**Horizontal Scroll Containers (tables on mobile):**
```css
.forge-scroll-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.forge-scroll-container::-webkit-scrollbar {
  display: none;
}
```

**Sticky Investment CTA (Pool Detail mobile):**
```css
.invest-cta-sticky {
  position: fixed;
  bottom: 64px; /* Above bottom nav */
  left: 0; right: 0;
  padding: 12px 16px;
  background: var(--forge-surface);
  border-top: 1px solid var(--forge-border);
  z-index: 40;
}
```

### Touch Targets

All interactive elements have a minimum touch target of 44x44px on mobile. This includes:
- Buttons: min-height 44px
- Table rows: min-height 48px
- Toggle switches: 44px touch area (even if visually 40x22)
- Tab buttons: min-height 44px, min-width 44px
- Badge/chip elements: 32px height (but wrapped in 44px tap area)

---

## 10. Animation & Motion System

### Core Animations

```css
/* 1. Entrance -- Cards, panels, sections */
@keyframes obsidianFadeIn {
  from { opacity: 0; transform: translateY(14px); filter: brightness(0.8); }
  to   { opacity: 1; transform: translateY(0); filter: brightness(1); }
}
/* Duration: 600ms | Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94) */

/* 2. Stagger -- Sibling elements */
/* Delay: 70ms between each child */

/* 3. Border Cycle -- Card border color rotation */
@keyframes forgeBorderCycle {
  0%   { border-color: rgba(205,127,50,0.15); }
  25%  { border-color: rgba(183,110,121,0.15); }
  50%  { border-color: rgba(124,58,237,0.12); }
  75%  { border-color: rgba(20,184,166,0.12); }
  100% { border-color: rgba(205,127,50,0.15); }
}
/* Duration: 12s | Iteration: infinite | Only on hero/featured cards */

/* 4. Gradient Shift -- Iridescent gradient position */
@keyframes forgeGradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
/* Duration: 10s | Iteration: infinite | On edges, text, buttons */

/* 5. Chart Line Reveal */
@keyframes obsidianLineReveal {
  from { stroke-dashoffset: 2000; }
  to   { stroke-dashoffset: 0; }
}
/* Duration: 2s | Easing: cubic-bezier(0.16, 1, 0.3, 1) */

/* 6. Chart Area Reveal */
@keyframes obsidianAreaReveal {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Duration: 1s | Delay: 1.4s (after line) */

/* 7. Gauge Ring Reveal */
@keyframes obsidianRingReveal {
  from { stroke-dashoffset: 300; }
  to   { stroke-dashoffset: {calculated}; }
}
/* Duration: 1.4s | Easing: cubic-bezier(0.16, 1, 0.3, 1) */

/* 8. Pulse Dot (chart endpoint) */
@keyframes obsidianPulse {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1; }
}
/* Duration: 2.5s | Iteration: infinite */

/* 9. Pulse Ring (expanding circle) */
@keyframes obsidianPulseRing {
  0%   { r: 4; opacity: 0.4; }
  100% { r: 18; opacity: 0; }
}
/* Duration: 2.5s | Iteration: infinite */

/* 10. Hero Glow Breathing */
@keyframes forgeHeroGlow {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(205,127,50,0.1)); }
  50%      { filter: drop-shadow(0 0 24px rgba(205,127,50,0.2)); }
}
/* Duration: 4s | Iteration: infinite */

/* 11. Value Counter */
/* Implemented via requestAnimationFrame in JS */
/* Duration: 2500ms | Easing: easeOutExpo */
/* Counts from 0 to target value with deceleration */
```

### Hover Micro-interactions

```
Card Hover (400ms ease):
  - border-color: transitions to --forge-border-hover
  - transform: translateY(-2px)
  - box-shadow: warm glow appears
  - ::after shimmer: sweeps diagonally across surface

Button Hover (200ms ease):
  - Primary: opacity 0.9, glow shadow appears, translateY(-1px)
  - Secondary: background intensifies, border brightens
  - Ghost: background appears, text color brightens

Table Row Hover (250ms ease):
  - background: shifts to --forge-surface-elevated

Input Focus (300ms ease):
  - border: copper at 50% opacity
  - box-shadow: 3px copper ring at 15% + 20px copper glow

Toggle Click (200ms ease):
  - knob slides 18px
  - background color transitions

Badge Hover:
  - No hover effect (badges are informational, not interactive)
```

### Scroll Reveal

```css
.forge-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
}

.forge-reveal.forge-revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Triggered by IntersectionObserver when element enters viewport */
/* threshold: 0.1 (triggers when 10% visible) */
/* rootMargin: "0px 0px -50px 0px" (triggers slightly before fully visible) */
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

When reduced motion is preferred:
- All entrances are instant (no fade, no slide)
- Gradient shifts are frozen at position 0%
- Border cycles are frozen at copper
- Shimmer hovers are disabled
- Value counters snap to final value
- Charts render immediately without line reveal

---

## 11. Accessibility

### Color Contrast Ratios

All text meets WCAG AA standards:

| Text Type | Color | Background | Ratio | Status |
|-----------|-------|-----------|-------|--------|
| Primary on Surface | #EDE5D8 on #110F0C | 11.8:1 | AAA |
| Secondary on Surface | #9B8B78 on #110F0C | 4.9:1 | AA |
| Dim on Surface | #5E5248 on #110F0C | 2.7:1 | *Decorative only* |
| Copper on Surface | #CD7F32 on #110F0C | 5.2:1 | AA |
| Teal on Surface | #14B8A6 on #110F0C | 6.3:1 | AA |
| Danger on Surface | #C45B4A on #110F0C | 4.1:1 | AA (large) |
| Primary on Bg | #EDE5D8 on #060504 | 14.2:1 | AAA |

**Note:** `--forge-text-dim` (#5E5248) is used only for decorative labels, timestamps, and supplementary information -- never for primary content. When dim text carries critical meaning, it is paired with an icon or semantic color.

### Focus Management

```css
/* All interactive elements use the forge focus ring */
:focus-visible {
  outline: none;
  border-color: rgba(205,127,50,0.5);
  box-shadow:
    0 0 0 3px rgba(205,127,50,0.15),
    0 0 20px rgba(205,127,50,0.2);
}

/* Skip to content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--forge-copper);
  color: white;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 0;
}
```

### Keyboard Navigation

- **Tab order** follows visual layout (left-to-right, top-to-bottom)
- **Arrow keys** navigate within tab groups, chart time ranges, and toggle switches
- **Enter/Space** activates buttons, toggles, and links
- **Escape** closes modals and drawers
- Charts provide `role="img"` with descriptive `aria-label`
- Tables use proper `<table>` semantics or `role="grid"` with `aria-colcount`/`aria-rowcount`

### Screen Reader Support

- Portfolio hero value: `aria-label="Portfolio total value: $2,847,392.50, up 12.47% over 30 days"`
- Donut chart: `role="img" aria-label="Portfolio allocation: 42% Treasuries, 28% Real Estate, ..."`
- Gauge: `role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="72" aria-label="Portfolio health score: 72 out of 100"`
- Live feed: `role="log" aria-live="polite"` for new entries
- Status badges: Include `aria-label` with full status text

---

## Appendix A: Asset Class Color Map

| Asset Class | Slug | Hex | RGB | Usage |
|-------------|------|-----|-----|-------|
| Treasuries | `treasury` | #CD7F32 | 205,127,50 | Primary accent, most prominent |
| Real Estate | `real-estate` | #B76E79 | 183,110,121 | Rose gold warmth |
| Private Credit | `private-credit` | #7C3AED | 124,58,237 | Violet contrast |
| Corporate Bonds | `corporate-bonds` | #14B8A6 | 20,184,166 | Teal freshness |
| Commodities | `commodities` | #8B6914 | 139,105,20 | Deep bronze |

## Appendix B: Chart Color Presets

| Chart Type | Stroke | Fill | Grid | Label |
|-----------|--------|------|------|-------|
| Performance | Iridescent gradient | forge-chart-area gradient | rgba(94,82,72,0.12) dashed | text-dim |
| Yield History | Copper #CD7F32 | rgba(205,127,50,0.08) | Same | Same |
| Sparkline | Asset class color | None | None | None |
| Donut Ring | Per-segment class color | Per-segment class color | None | text-secondary |
| Gauge Arc | Semantic color | None | None | text-dim |
| Heatmap | N/A | HSL warm scale | N/A | text-dim (headers) |
| Return Bars | N/A | Iridescent gradient | rgba(205,127,50,0.06) track | text-secondary |

## Appendix C: Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | 0 | Page content, cards |
| Overlay | 1 | Chart overlays, hero values |
| Shimmer | 2 | Card shimmer pseudo-elements |
| Sticky | 10 | Sticky headers, investment CTA |
| Sidebar | 30 | Desktop sidebar |
| Drawer | 40 | Slide drawers, mobile sidebar |
| Bottom Nav | 50 | Mobile bottom navigation |
| Modal Backdrop | 60 | Dialog/modal overlays |
| Modal | 70 | Dialog/modal content |
| Toast | 80 | Notification toasts |
| Skip Link | 100 | Accessibility skip link |

## Appendix D: Icon Library

Uses Lucide React throughout. Key icons per page:

**Portfolio:** Wallet, TrendingUp, PiggyBank, ArrowUpRight, ArrowDownRight, Activity, Shield
**Pools:** Landmark (Treasury), Building2 (Real Estate), Handshake (Credit), Briefcase (Bonds), Gem (Commodities)
**Pool Detail:** ArrowLeft (back), Lock, Unlock, Clock, DollarSign, BarChart3
**Documents:** FileCheck, FileLock, Search, ShieldCheck
**Settings:** User, Wallet2, Shield, Bell, Key, Copy, Check

---

## Research Sources

This design specification was informed by:

- [Fintech design guide with patterns that build trust](https://www.eleken.co/blog-posts/modern-fintech-design-guide) -- Trust patterns for financial interfaces
- [How Bloomberg Terminal UX designers conceal complexity](https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity/) -- Progressive disclosure in data-dense UIs
- [Innovating a modern icon: How Bloomberg keeps the Terminal cutting-edge](https://www.bloomberg.com/company/stories/innovating-a-modern-icon-how-bloomberg-keeps-the-terminal-cutting-edge/) -- Modernizing financial interfaces
- [Dark Glassmorphism: The Aesthetic That Will Define UI in 2026](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) -- Dark mode glass surface techniques
- [Top Financial Data Visualization Techniques for 2025](https://chartswatcher.com/pages/blog/top-financial-data-visualization-techniques-for-2025) -- Financial chart best practices
- [J.P. Morgan Heatmap Analysis](https://am.jpmorgan.com/us/en/asset-management/adv/tools/portfolio-tools/heatmap-analysis/) -- Institutional heatmap patterns
- [RWA.xyz Tokenized Real-World Asset Analytics](https://rwa.xyz/) -- RWA platform design reference
- [Maple Finance](https://maple.finance/) -- Institutional DeFi lending UI
- [25 Best Fintech Website Designs](https://www.ballisticdesignstudio.com/post/fintech-website-designs) -- Contemporary fintech design patterns

---

*Obsidian Forge Design System v1.0 -- RWA Gateway*
*Crafted for institutional-grade real-world asset investment.*
