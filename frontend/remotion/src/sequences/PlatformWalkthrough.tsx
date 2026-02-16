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

export const PlatformWalkthrough: React.FC = () => {
  const F = ACT_III_FRAMES;

  const starts = {
    landing: 0,
    auth: F.landing,
    portfolio: F.landing + F.auth,
    poolBrowsing: F.landing + F.auth + F.portfolio,
    investFlow: F.landing + F.auth + F.portfolio + F.poolBrowsing,
    montage:
      F.landing + F.auth + F.portfolio + F.poolBrowsing + F.investFlow,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence from={starts.landing} durationInFrames={F.landing} premountFor={10}>
        <LandingFlythrough />
      </Sequence>

      <Sequence from={starts.auth} durationInFrames={F.auth} premountFor={10}>
        <AuthMoment />
      </Sequence>

      <Sequence from={starts.portfolio} durationInFrames={F.portfolio} premountFor={10}>
        <PortfolioDashboard />
      </Sequence>

      <Sequence from={starts.poolBrowsing} durationInFrames={F.poolBrowsing} premountFor={10}>
        <PoolBrowsing />
      </Sequence>

      <Sequence from={starts.investFlow} durationInFrames={F.investFlow} premountFor={10}>
        <InvestmentFlow />
      </Sequence>

      <Sequence from={starts.montage} durationInFrames={F.montage} premountFor={10}>
        <QuickMontage />
      </Sequence>
    </AbsoluteFill>
  );
};
