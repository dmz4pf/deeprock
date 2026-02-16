import React from "react";
import { AbsoluteFill, Sequence, staticFile, interpolate } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio } from "@remotion/media";
import { ACT_FRAMES, ACT_TRANSITION } from "./lib/timings";
import { COLORS } from "./lib/theme";
import { BrandReveal } from "./sequences/BrandReveal";
import { Context } from "./sequences/Context";
import { PlatformWalkthrough } from "./sequences/PlatformWalkthrough";
import { TrustSecurity } from "./sequences/TrustSecurity";
import { Closing } from "./sequences/Closing";

/**
 * Per-section voiceover placement.
 * Each clip is positioned at an absolute frame in the 2250-frame timeline.
 * Clips are sequential with ~3-5 frame gaps — no overlaps.
 * A natural 4.5s silence sits over the Montage sub-scene (music only).
 */
const VO_SECTIONS = [
  { file: "01-brand.mp3",     from: 10,   duration: 155 },
  { file: "02-context.mp3",   from: 168,  duration: 227 },
  { file: "03-landing.mp3",   from: 398,  duration: 220 },
  { file: "04-auth.mp3",      from: 621,  duration: 191 },
  { file: "05-portfolio.mp3", from: 815,  duration: 323 },
  { file: "06-pools.mp3",     from: 1141, duration: 256 },
  { file: "07-invest.mp3",    from: 1400, duration: 227 },
  // [silence: frames 1627–1715 = Montage visual breathing room]
  { file: "08-trust.mp3",     from: 1715, duration: 309 },
  { file: "09-closing.mp3",   from: 2045, duration: 128 },
] as const;

export const DeepRockDemo: React.FC = () => {
  const transition = linearTiming({ durationInFrames: ACT_TRANSITION });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* === VISUALS === */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.I}>
          <BrandReveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.II}>
          <Context />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.III}>
          <PlatformWalkthrough />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.IV}>
          <TrustSecurity />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.V}>
          <Closing />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* === VOICEOVER — per-section clips at absolute frame positions === */}
      {VO_SECTIONS.map(({ file, from, duration }) => (
        <Sequence key={file} from={from} durationInFrames={duration}>
          <Audio src={staticFile(`audio/sections/${file}`)} volume={1} />
        </Sequence>
      ))}

    </AbsoluteFill>
  );
};
