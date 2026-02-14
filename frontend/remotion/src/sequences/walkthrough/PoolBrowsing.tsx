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
import { FadeIn } from "../../components/FadeIn";
import { FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

export const PoolBrowsing: React.FC = () => {
  const frame = useCurrentFrame();

  /* Cross-fade from pools main to treasury category */
  const poolsMainOpacity = interpolate(frame, [180, 220], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const treasuryOpacity = interpolate(frame, [210, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Phase 1: Pools overview (0-220) */}
      <Sequence from={0} durationInFrames={250} premountFor={15}>
        <AbsoluteFill style={{ opacity: poolsMainOpacity }}>
          <ScreenTransition
            from={{ scale: 1, x: 0, y: 0 }}
            to={{ scale: 1.05, x: 0, y: -40 }}
            startFrame={30}
            duration={90}
          >
            <AppFrame screenshot="screenshots/pools-main.png">
              <Sequence from={40} durationInFrames={180} layout="none" premountFor={10}>
                <FadeIn delay={0} direction="up" duration={20}>
                  <div
                    style={{
                      position: "absolute",
                      top: 80,
                      right: 60,
                      padding: "12px 20px",
                      borderRadius: 8,
                      backgroundColor: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      color: COLORS.textPrimary,
                      fontSize: 14,
                      fontFamily: FONT_SANS,
                      fontWeight: 500,
                    }}
                  >
                    5 asset classes. 15+ pools.
                  </div>
                </FadeIn>
              </Sequence>
            </AppFrame>
          </ScreenTransition>
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2: Treasury category (210-450) */}
      <Sequence from={210} durationInFrames={240} premountFor={15}>
        <AbsoluteFill style={{ opacity: treasuryOpacity }}>
          <ScreenTransition
            from={{ scale: 0.95, x: 0, y: 20 }}
            to={{ scale: 1, x: 0, y: 0 }}
            duration={30}
          >
            <AppFrame screenshot="screenshots/pools-treasury.png">
              <Sequence from={40} durationInFrames={200} layout="none" premountFor={10}>
                <FadeIn delay={0} direction="right" duration={20}>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 60,
                      left: 60,
                      padding: "12px 20px",
                      borderRadius: 8,
                      backgroundColor: "rgba(232,180,184,0.12)",
                      border: "1px solid rgba(232,180,184,0.25)",
                      color: "#E8B4B8",
                      fontSize: 14,
                      fontFamily: FONT_SANS,
                      fontWeight: 500,
                    }}
                  >
                    APY, lockup terms, risk rating, remaining capacity
                  </div>
                </FadeIn>
              </Sequence>
            </AppFrame>
          </ScreenTransition>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
