import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { FadeIn } from "../../components/FadeIn";
import { FONT_SERIF, FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

const FEATURES = [
  {
    icon: "⚡",
    title: "Sub-Second Finality",
    desc: "Avalanche C-Chain consensus",
    color: COLORS.accent,
  },
  {
    icon: "🔍",
    title: "Full Transparency",
    desc: "On-chain audit trail",
    color: COLORS.accent2,
  },
  {
    icon: "🌐",
    title: "Global Access",
    desc: "24/7 markets, no borders",
    color: COLORS.teal,
  },
  {
    icon: "🛡",
    title: "Institutional Grade",
    desc: "Compliance-ready infrastructure",
    color: COLORS.gold,
  },
];

export const QuickMontage: React.FC = () => {
  const frame = useCurrentFrame();

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
            "radial-gradient(ellipse at center, rgba(212,175,55,0.04), transparent 60%)",
        }}
      />

      <Sequence from={0} durationInFrames={200} layout="none" premountFor={10}>
        <FadeIn delay={0} duration={25} direction="up">
          <div
            style={{
              fontSize: 36,
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

      <Sequence from={25} durationInFrames={185} layout="none" premountFor={15}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            maxWidth: 700,
          }}
        >
          {FEATURES.map((feat, i) => {
            const delay = i * 15;
            const opacity = interpolate(
              frame - 25,
              [delay, delay + 18],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const y = interpolate(
              frame - 25,
              [delay, delay + 18],
              [20, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: `1px solid ${feat.color}15`,
                  backgroundColor: COLORS.surface,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div style={{ fontSize: 32, flexShrink: 0 }}>{feat.icon}</div>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontFamily: FONT_SANS,
                      fontWeight: 600,
                      color: feat.color,
                    }}
                  >
                    {feat.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
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
