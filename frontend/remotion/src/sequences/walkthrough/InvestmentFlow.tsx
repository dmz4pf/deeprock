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
import { FadeIn } from "../../components/FadeIn";
import { FONT_SERIF, FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

export const InvestmentFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* Phase 1 → 2 crossfade */
  const phase1Opacity = interpolate(frame, [160, 190], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2Opacity = interpolate(frame, [180, 210], [0, 1], {
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.05), transparent 60%)",
        }}
      />

      {/* Phase 1: Invest flow steps */}
      <Sequence from={0} durationInFrames={200} premountFor={10}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            opacity: phase1Opacity,
          }}
        >
          <FadeIn delay={0} duration={20} direction="none">
            <div
              style={{
                fontSize: 12,
                fontFamily: FONT_SANS,
                fontWeight: 600,
                color: COLORS.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.25em",
              }}
            >
              Investment Flow
            </div>
          </FadeIn>

          <FadeIn delay={10} duration={25} direction="up">
            <div
              style={{
                fontSize: 44,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textAlign: "center",
              }}
            >
              Three Steps. Instant Settlement.
            </div>
          </FadeIn>

          {/* Steps */}
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {[
              { num: "1", label: "Select Pool" },
              { num: "2", label: "Enter Amount" },
              { num: "3", label: "Confirm" },
            ].map((step, i) => {
              const stepDelay = 40 + i * 25;
              const stepOpacity = interpolate(
                frame,
                [stepDelay, stepDelay + 20],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const stepY = interpolate(
                frame,
                [stepDelay, stepDelay + 20],
                [20, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.quad),
                }
              );

              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div
                      style={{
                        width: 40,
                        height: 1,
                        backgroundColor: COLORS.border,
                        opacity: stepOpacity,
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      opacity: stepOpacity,
                      transform: `translateY(${stepY}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        border: `2px solid ${COLORS.accent}40`,
                        backgroundColor: `${COLORS.accent}10`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontFamily: FONT_SANS,
                        fontWeight: 700,
                        color: COLORS.accent,
                      }}
                    >
                      {step.num}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontFamily: FONT_SANS,
                        fontWeight: 500,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2: Success state */}
      <Sequence from={180} durationInFrames={180} premountFor={15}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            opacity: phase2Opacity,
          }}
        >
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
                fontSize: 32,
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
                fontSize: 18,
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
