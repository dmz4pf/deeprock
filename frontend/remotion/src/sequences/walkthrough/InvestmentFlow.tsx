import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";
import { AppFrame } from "../../components/AppFrame";
import { ScreenTransition } from "../../components/ScreenTransition";
import { FadeIn } from "../../components/FadeIn";
import { FONT_SERIF, FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

export const InvestmentFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* Phase transitions */
  const detailOpacity = interpolate(frame, [150, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const successOpacity = interpolate(frame, [170, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const checkScale = spring({
    frame: frame - 220,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Phase 1: Pool detail page (0-180) */}
      <Sequence from={0} durationInFrames={200} premountFor={15}>
        <AbsoluteFill style={{ opacity: detailOpacity }}>
          <ScreenTransition
            from={{ scale: 1, x: 0, y: 0 }}
            to={{ scale: 1.1, x: 100, y: 0 }}
            startFrame={40}
            duration={80}
          >
            <AppFrame screenshot="screenshots/pool-detail.png">
              {/* Highlight "Invest Now" button area */}
              <Sequence from={60} durationInFrames={120} layout="none" premountFor={10}>
                <FadeIn delay={0} direction="left" duration={15}>
                  <div
                    style={{
                      position: "absolute",
                      right: 80,
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "16px 32px",
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${COLORS.accent}20, ${COLORS.accent2}20)`,
                      border: `2px solid ${COLORS.accent}50`,
                      color: COLORS.textPrimary,
                      fontSize: 18,
                      fontFamily: FONT_SANS,
                      fontWeight: 700,
                      boxShadow: `0 0 20px ${COLORS.accent}30`,
                    }}
                  >
                    Invest Now →
                  </div>
                </FadeIn>
              </Sequence>
            </AppFrame>
          </ScreenTransition>
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2: Success state (170-360) */}
      <Sequence from={170} durationInFrames={190} premountFor={15}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            opacity: successOpacity,
          }}
        >
          {/* Success check */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: `${COLORS.green}15`,
              border: `2px solid ${COLORS.green}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              transform: `scale(${checkScale})`,
              boxShadow: `0 0 30px ${COLORS.green}20`,
            }}
          >
            ✓
          </div>

          <FadeIn delay={40} duration={20}>
            <div
              style={{
                fontSize: 28,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.green,
              }}
            >
              Investment Confirmed
            </div>
          </FadeIn>

          <FadeIn delay={55} duration={20}>
            <div
              style={{
                fontSize: 16,
                fontFamily: FONT_SANS,
                color: COLORS.textSecondary,
                textAlign: "center",
              }}
            >
              Sub-second finality on Avalanche. No T+2 delays.
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
