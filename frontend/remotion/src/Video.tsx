import React from "react";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
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
 * Audio files must be placed in frontend/remotion/public/audio/:
 * - voiceover.mp3 (ElevenLabs or equivalent)
 * - music.mp3 (royalty-free ambient track, 2:30+ or loopable)
 *
 * Set ENABLE_AUDIO=true in the composition props or
 * rename the files to enable audio playback.
 */
const AUDIO_ENABLED = false;

export const DeepRockDemo: React.FC = () => {
  const transition = linearTiming({ durationInFrames: ACT_TRANSITION });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        {/* Act I: Brand Reveal */}
        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.I}>
          <BrandReveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        {/* Act II: Context */}
        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.II}>
          <Context />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        {/* Act III: Platform Walkthrough */}
        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.III}>
          <PlatformWalkthrough />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        {/* Act IV: Trust & Security */}
        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.IV}>
          <TrustSecurity />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />

        {/* Act V: Closing */}
        <TransitionSeries.Sequence durationInFrames={ACT_FRAMES.V}>
          <Closing />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Audio layers — enable when MP3 files are placed in public/audio/ */}
      {AUDIO_ENABLED && (
        <>
          {/* Voiceover */}
          <Audio src={staticFile("audio/voiceover.mp3")} volume={1} />

          {/* Background music — low volume, fade in/out */}
          <Audio
            src={staticFile("audio/music.mp3")}
            volume={(f) => {
              const fadeIn = interpolate(f, [0, 90], [0, 0.15], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const fadeOut = interpolate(f, [4350, 4500], [0.15, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return Math.min(fadeIn, fadeOut);
            }}
            loop
          />
        </>
      )}
    </AbsoluteFill>
  );
};
