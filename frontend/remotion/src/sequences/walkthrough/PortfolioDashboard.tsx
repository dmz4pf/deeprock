import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { AppFrame } from "../../components/AppFrame";
import { ScreenTransition } from "../../components/ScreenTransition";
import { AnimatedStat } from "../../components/AnimatedStat";
import { FadeIn } from "../../components/FadeIn";
import { FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

export const PortfolioDashboard: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Screenshot with gentle zoom into the balance area */}
      <ScreenTransition
        from={{ scale: 1, x: 0, y: 0 }}
        to={{ scale: 1.15, x: -50, y: -80 }}
        startFrame={60}
        duration={120}
      >
        <AppFrame screenshot="screenshots/portfolio.png">
          {/* Stat overlay: animated counters */}
          <Sequence from={30} durationInFrames={480} layout="none" premountFor={15}>
            <div
              style={{
                position: "absolute",
                top: 80,
                left: 80,
                display: "flex",
                gap: 40,
              }}
            >
              <FadeIn delay={0} duration={15} direction="up">
                <AnimatedStat
                  value={2.47}
                  prefix="$"
                  suffix="M"
                  decimals={2}
                  startFrame={5}
                  duration={60}
                  fontSize={36}
                  color={COLORS.textPrimary}
                  label="Total Balance"
                />
              </FadeIn>
              <FadeIn delay={15} duration={15} direction="up">
                <AnimatedStat
                  value={7.2}
                  suffix="%"
                  decimals={1}
                  startFrame={20}
                  duration={45}
                  fontSize={36}
                  color={COLORS.green}
                  label="30d Return"
                />
              </FadeIn>
            </div>
          </Sequence>

          {/* Callout: real-time tracking */}
          <Sequence from={200} durationInFrames={340} layout="none" premountFor={15}>
            <FadeIn delay={0} direction="left" duration={20}>
              <div
                style={{
                  position: "absolute",
                  bottom: 60,
                  left: 60,
                  padding: "12px 20px",
                  borderRadius: 8,
                  backgroundColor: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: COLORS.textPrimary,
                  fontSize: 14,
                  fontFamily: FONT_SANS,
                  fontWeight: 500,
                }}
              >
                Real-time allocation, yield, and risk scoring
              </div>
            </FadeIn>
          </Sequence>
        </AppFrame>
      </ScreenTransition>
    </AbsoluteFill>
  );
};
