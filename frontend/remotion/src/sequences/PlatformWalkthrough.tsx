import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ACT_III_FRAMES } from "../lib/timings";
import { COLORS } from "../lib/theme";
import { LandingFlythrough } from "./walkthrough/LandingFlythrough";
import { AuthMoment } from "./walkthrough/AuthMoment";
import { PortfolioDashboard } from "./walkthrough/PortfolioDashboard";
import { PoolBrowsing } from "./walkthrough/PoolBrowsing";
import { InvestmentFlow } from "./walkthrough/InvestmentFlow";
import { QuickMontage } from "./walkthrough/QuickMontage";
import { DocsSecurity } from "./walkthrough/DocsSecurity";

export const PlatformWalkthrough: React.FC = () => {
  const F = ACT_III_FRAMES;

  /* Cumulative start frames */
  const starts = {
    landing: 0,
    auth: F.landing,
    portfolio: F.landing + F.auth,
    poolBrowsing: F.landing + F.auth + F.portfolio,
    investFlow: F.landing + F.auth + F.portfolio + F.poolBrowsing,
    montage: F.landing + F.auth + F.portfolio + F.poolBrowsing + F.investFlow,
    docsSecurity:
      F.landing +
      F.auth +
      F.portfolio +
      F.poolBrowsing +
      F.investFlow +
      F.montage,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence
        from={starts.landing}
        durationInFrames={F.landing}
        premountFor={15}
      >
        <LandingFlythrough />
      </Sequence>

      <Sequence
        from={starts.auth}
        durationInFrames={F.auth}
        premountFor={15}
      >
        <AuthMoment />
      </Sequence>

      <Sequence
        from={starts.portfolio}
        durationInFrames={F.portfolio}
        premountFor={15}
      >
        <PortfolioDashboard />
      </Sequence>

      <Sequence
        from={starts.poolBrowsing}
        durationInFrames={F.poolBrowsing}
        premountFor={15}
      >
        <PoolBrowsing />
      </Sequence>

      <Sequence
        from={starts.investFlow}
        durationInFrames={F.investFlow}
        premountFor={15}
      >
        <InvestmentFlow />
      </Sequence>

      <Sequence
        from={starts.montage}
        durationInFrames={F.montage}
        premountFor={15}
      >
        <QuickMontage />
      </Sequence>

      <Sequence
        from={starts.docsSecurity}
        durationInFrames={F.docsSecurity}
        premountFor={15}
      >
        <DocsSecurity />
      </Sequence>
    </AbsoluteFill>
  );
};
