# DeepRock Demo Video — Design Document
**Date:** 2026-02-14

## Overview

A 2:30 cinematic product demo built in Remotion (React). Hybrid format — brand opening, then app walkthrough with AI voiceover, animated callouts, and ambient electronic background music.

- **Output:** 1920x1080 @ 30fps, MP4
- **Voice:** AI-generated female (ElevenLabs), confident institutional tone
- **Music:** Ambient electronic/cinematic, royalty-free
- **Purpose:** Social media + project submission / pitch

---

## Video Structure (5 Acts)

| Act | Time | Content | Visual Treatment |
|-----|------|---------|-----------------|
| **I. Brand Reveal** | 0:00–0:10 | Logo + tagline | Dark void, gold particles converge into logo. Tagline fades in. |
| **II. Context** | 0:10–0:25 | What DeepRock solves | Typography on dark bg. Quick keyword visuals. |
| **III. The Platform** | 0:25–1:50 | Full app walkthrough | Recreated app screens, smooth transitions, elements animate on cue. |
| **IV. Trust & Security** | 1:50–2:15 | Documents, passkeys, non-custodial | Seal animation, biometric visual, trust badges. |
| **V. Close** | 2:15–2:30 | CTA + logo lockup | Final tagline, URL. |

---

## Act III Breakdown (85 seconds)

1. **Landing page fly-through** (10s) — Hero with parallax watermark, features grid reveal
2. **Auth moment** (8s) — Passkey button → fingerprint → "Authenticated" gold glow → app transition
3. **Portfolio dashboard** (18s) — Balance counter, allocation donut, health gauge, live feed
4. **Pool browsing** (15s) — Category cards, Treasury detail, pool cards with capacity bars
5. **Investment flow** (12s) — Pool detail → "Invest Now" → drawer → confirm → success
6. **Quick montage** (7s) — Mobile view, documents, settings, different categories
7. **Documents & security** (15s) — Seal verification, passkey management

---

## Voiceover Script (~200 words, ~2:20 at narrator pace)

> [Act I — Logo forming.]
> "DeepRock. Tokenized real-world assets on Avalanche."
>
> [Act II — Brief context.]
> "Treasury bills, real estate, private credit — traditionally difficult to access, slow to settle, and opaque. DeepRock makes them composable, instant, and transparent."
>
> [Act III — Landing page.]
> "The platform is built around five asset classes and a growing directory of investment pools — each independently audited with live capacity and fee transparency."
>
> [Auth — fingerprint.]
> "Onboarding uses Avalanche's account abstraction. A smart wallet is created from your fingerprint — no seed phrases, no extensions. One biometric scan and you're authenticated."
>
> [Portfolio.]
> "The portfolio dashboard tracks every position in real time. Allocation breakdowns, yield distributions, risk scoring — all on-chain, all verifiable."
>
> [Pools browsing.]
> "Pools are organized by asset class — treasury, real estate, private credit, corporate bonds, and commodities. Each one shows APY, lockup terms, risk rating, and remaining capacity."
>
> [Investment flow.]
> "Investing is straightforward. Select a pool, enter an amount, confirm. Settlement is instant — Avalanche's sub-second finality means no T-plus-two delays."
>
> [Documents & security.]
> "Documents are sealed on-chain with cryptographic proofs anyone can verify. Keys are secured biometrically through passkeys — non-custodial by design."
>
> [Close — logo, URL.]
> "DeepRock. Now live on testnet."

---

## Technical Architecture

```
frontend/
  remotion/
    remotion.config.ts
    src/
      Root.tsx                    # Composition entry
      Video.tsx                   # Master composition (2:30, 30fps)
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
