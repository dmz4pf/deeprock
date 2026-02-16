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

  const phase1Opacity = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2Opacity = interpolate(frame, [110, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const checkScale = spring({
    frame: frame - 130,
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
            "radial-gradient(ellipse at center, rgba(232,180,184,0.05), transparent 60%)",
        }}
      />

      {/* Phase 1: Invest flow steps */}
      <Sequence from={0} durationInFrames={130} premountFor={5}>
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
          <FadeIn delay={0} duration={18} direction="up" distance={20}>
            <div
              style={{
                fontSize: 60,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textAlign: "center",
              }}
            >
              Three Steps. Instant Settlement.
            </div>
          </FadeIn>

          <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
            {[
              { num: "1", label: "Select Pool" },
              { num: "2", label: "Enter Amount" },
              { num: "3", label: "Confirm" },
            ].map((step, i) => {
              const stepScale = spring({
                frame: frame - 25 - i * 12,
                fps,
                config: { damping: 14, stiffness: 120 },
              });
              const stepOpacity = interpolate(
                frame,
                [25 + i * 12, 35 + i * 12],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );

              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div
                      style={{
                        width: 48,
                        height: 2,
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
                      gap: 14,
                      opacity: stepOpacity,
                      transform: `scale(${stepScale})`,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        border: `2px solid ${COLORS.copper}40`,
                        backgroundColor: `${COLORS.copper}10`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 30,
                        fontFamily: FONT_SANS,
                        fontWeight: 700,
                        color: COLORS.copper,
                      }}
                    >
                      {step.num}
                    </div>
                    <div
                      style={{
                        fontSize: 24,
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
      <Sequence from={110} durationInFrames={100} premountFor={10}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            opacity: phase2Opacity,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: `${COLORS.green}15`,
              border: `2px solid ${COLORS.green}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 60,
              transform: `scale(${checkScale})`,
              boxShadow: `0 0 40px ${COLORS.green}20`,
              color: COLORS.green,
            }}
          >
            ✓
          </div>

          <FadeIn delay={20} duration={15}>
            <div
              style={{
                fontSize: 48,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.green,
              }}
            >
              Investment Confirmed
            </div>
          </FadeIn>

          <FadeIn delay={30} duration={15}>
            <div
              style={{
                fontSize: 28,
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
