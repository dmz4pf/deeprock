# DeepRock Demo Video — Design Document
**Date:** 2026-02-14

## Overview

A 1:15 cinematic product demo built in Remotion (React). Hybrid format — brand opening, then animated walkthrough with AI voiceover and ambient electronic background music.

- **Output:** 1920x1080 @ 30fps, MP4 (2250 frames, 75 seconds)
- **Voice:** AI-generated female (ElevenLabs), confident institutional tone
- **Music:** Ambient electronic/cinematic, royalty-free
- **Purpose:** Social media + project submission / pitch

---

## Video Structure (5 Acts)

| Act | Frames | Time | Content | Visual Treatment |
|-----|--------|------|---------|-----------------|
| **I. Brand Reveal** | 180 | 0:00–0:06 | Logo + tagline | Dark void, copper particles converge into logo. Tagline fades in with iridescent line. |
| **II. Context** | 210 | 0:05–0:12 | What DeepRock solves | Asset class keyword pills animate in, problem text reveals word-by-word, solution statement fades up. |
| **III. The Platform** | 1350 | 0:12–0:57 | Animated walkthrough | 6 sub-scenes with hard cuts: Landing, Auth, Portfolio, Pools, Invest, Montage. |
| **IV. Trust & Security** | 360 | 0:56–1:08 | Documents + passkeys | Phase 1: Verification seal + cryptographic proof. Phase 2: Passkey lock + trust badges. |
| **V. Close** | 210 | 1:08–1:15 | Logo lockup | "DeepRock" + iridescent line + "Now live on testnet." |

*Note: 15-frame fade transitions between acts create ~0.5s overlaps.*

---

## Act III Breakdown (45 seconds, 1350 frames)

| Sub-scene | Frames | Duration | On-Screen Content |
|-----------|--------|----------|-------------------|
| **Landing** | 210 | 7s | "Five Asset Classes. One Platform." + 5 asset class cards + transparency tagline |
| **Auth** | 180 | 6s | Fingerprint icon springs in → "Authenticated" + "Smart wallet from your fingerprint" → word-by-word reveal |
| **Portfolio** | 300 | 10s | "Real-Time Position Tracking" + animated stats ($2.47M, 7.2%, 12) + allocation bars (Treasury 45%, RE 25%, Credit 18%, Bonds 12%) + "All on-chain. All verifiable." |
| **Pool Browsing** | 240 | 8s | "Browse Investment Pools" + 4 pool cards with APY/risk/capacity + transparency tagline |
| **Invest Flow** | 210 | 7s | "Three Steps. Instant Settlement." + step circles 1-2-3 → ✓ "Investment Confirmed" + "Sub-second finality" |
| **Montage** | 210 | 7s | "Built for Performance" + 4 feature cards (Sub-Second Finality, Full Transparency, Global Access, Institutional Grade) |

---

## Voiceover Script (~140 words, 75s with visual breathing room)

> **[0:00 — Act I: Logo forming. Particles converge, "DeepRock" appears.]**
> "DeepRock. Tokenized real-world assets on Avalanche."
>
> **[0:06 — Act II: Asset class keywords appear, then problem/solution text.]**
> "Treasury bills, real estate, private credit — traditionally difficult to access, slow to settle, and opaque. DeepRock makes them composable, instant, and transparent."
>
> **[0:12 — Landing: Five asset class cards animate in.]**
> "Five asset classes. A growing directory of investment pools — each independently audited with live transparency."
>
> **[0:19 — Auth: Fingerprint icon, "Authenticated" glow.]**
> "One biometric scan creates a smart wallet. No seed phrases. No extensions."
>
> **[0:25 — Portfolio: Stats count up, allocation bars fill.]**
> "The portfolio dashboard tracks every position in real time — balance, returns, allocation breakdowns. All on-chain. All verifiable."
>
> **[0:35 — Pools: Four pool cards with APY and risk data.]**
> "Each pool shows APY, risk rating, lockup terms, and remaining capacity — all visible before you invest."
>
> **[0:43 — Invest Flow: 1-2-3 steps, then success checkmark.]**
> "Select a pool. Enter an amount. Confirm. Sub-second finality — no T-plus-two delays."
>
> **[0:50 — Montage: Feature cards. Music only, no narration.]**
> *(visual breathing room — let the feature cards speak)*
>
> **[0:57 — Act IV: Verification seal, then passkey lock + badges.]**
> "Documents are sealed on-chain with cryptographic proofs anyone can verify. Keys are secured biometrically — non-custodial by design."
>
> **[1:08 — Act V: Logo + line + closing.]**
> "DeepRock. Now live on testnet."

---

## Technical Architecture

```
frontend/
  remotion/
    remotion.config.ts
    src/
      Root.tsx                    # Composition entry
      Video.tsx                   # Master composition (1:15, 30fps, 2250 frames)
      sequences/
        BrandReveal.tsx           # Act I — logo + particles
        Context.tsx               # Act II — problem statement
        PlatformWalkthrough.tsx   # Act III — orchestrates sub-sequences
        TrustSecurity.tsx         # Act IV
        Closing.tsx               # Act V
      components/
        AppFrame.tsx              # Browser chrome wrapper
        AnimatedStat.tsx          # Counter animations
        TextReveal.tsx            # Word-by-word text reveal
        GoldParticles.tsx         # Particle system for logo
        ScreenTransition.tsx      # Zoom/pan between views
      assets/
        screenshots/              # High-res app screenshots
        audio/
          voiceover.mp3
          music.mp3
      styles/
        video.css
```

## Screenshots Approach

Pre-capture every key screen at 2x resolution using Playwright:
- Landing page (hero, stats, features, trust, CTA, footer)
- Login page (default, authenticating, success states)
- Portfolio (full dashboard with data)
- Pools main page (all 5 categories)
- Treasury category page (pool cards)
- Pool detail page (overview tab, documents tab, fees tab)
- Investment drawer (empty, filled, confirming, success)
- Documents page (verify card, seal card, timeline)
- Settings page (identity card, security panel)
- Mobile views of key screens

## Production Pipeline

1. **Set up Remotion** — Install, configure, create composition structure
2. **Capture screenshots** — Playwright at 2880x1800 (2x retina)
3. **Write script** — Finalize voiceover text (approved above)
4. **Generate voiceover** — ElevenLabs API, female confident voice
5. **Source music** — Ambient electronic track, royalty-free
6. **Build Act I** — Logo reveal with particle animation
7. **Build Act II** — Typography + keyword sequence
8. **Build Act III** — App walkthrough with screen transitions
9. **Build Act IV** — Trust/security sequence
10. **Build Act V** — Closing with logo lockup
11. **Sync audio** — Align voiceover + music to visual beats
12. **Render** — 1920x1080 MP4 @ 30fps
13. **Polish** — Timing, color grade, final adjustments

## Design Decisions

- **Screenshots over live recording** — Pixel-perfect, no loading states, no jitter, can animate individual elements
- **No testnet stats in voiceover** — Focus on features and capabilities, not mock data
- **Passkey explanation** — "Avalanche's account abstraction" explained as "smart wallet from your fingerprint"
- **Honest close** — "Now live on testnet" — confident, not apologetic
- **Ambient electronic music** — Matches dark luxury design language
- **AI voiceover** — Fast iteration, regenerate on script changes
