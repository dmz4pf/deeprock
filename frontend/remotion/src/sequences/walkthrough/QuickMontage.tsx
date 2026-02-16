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

const FEATURES = [
  { icon: "⚡", title: "Sub-Second Finality", desc: "Avalanche C-Chain consensus", color: COLORS.copper },
  { icon: "🔍", title: "Full Transparency", desc: "On-chain audit trail", color: COLORS.roseGold },
  { icon: "🌐", title: "Global Access", desc: "24/7 markets, no borders", color: COLORS.teal },
  { icon: "🛡", title: "Institutional Grade", desc: "Compliance-ready infra", color: COLORS.copperBright },
];

export const QuickMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(232,180,184,0.04), transparent 60%)",
        }}
      />

      <Sequence from={0} durationInFrames={210} layout="none" premountFor={5}>
        <FadeIn delay={0} duration={18} direction="up" distance={20}>
          <div
            style={{
              fontSize: 56,
              fontFamily: FONT_SERIF,
              fontWeight: 700,
              color: COLORS.textPrimary,
              textAlign: "center",
            }}
          >
            Built for Performance
          </div>
        </FadeIn>
      </Sequence>

      <Sequence from={15} durationInFrames={195} layout="none" premountFor={10}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            maxWidth: 800,
          }}
        >
          {FEATURES.map((feat, i) => {
            const s = spring({
              frame: frame - 15 - i * 8,
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            const opacity = interpolate(
              frame - 15,
              [i * 8, i * 8 + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  padding: "24px 28px",
                  borderRadius: 14,
                  border: `1px solid ${feat.color}15`,
                  backgroundColor: COLORS.surface,
                  opacity,
                  transform: `scale(${s})`,
                }}
              >
                <div style={{ fontSize: 40, flexShrink: 0 }}>{feat.icon}</div>
                <div>
                  <div
                    style={{
                      fontSize: 26,
                      fontFamily: FONT_SANS,
                      fontWeight: 600,
                      color: feat.color,
                    }}
                  >
                    {feat.title}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontFamily: FONT_SANS,
                      color: COLORS.textDim,
                      marginTop: 4,
                    }}
                  >
                    {feat.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
