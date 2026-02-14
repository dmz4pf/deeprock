import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ACT_FRAMES, ACT_TRANSITION } from "./lib/timings";
import { BrandReveal } from "./sequences/BrandReveal";
import { Context } from "./sequences/Context";
import { PlatformWalkthrough } from "./sequences/PlatformWalkthrough";
import { TrustSecurity } from "./sequences/TrustSecurity";
import { Closing } from "./sequences/Closing";

export const DeepRockDemo: React.FC = () => {
  const transition = linearTiming({ durationInFrames: ACT_TRANSITION });

  return (
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
  );
};
