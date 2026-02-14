import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { AnimatedStat } from "../../components/AnimatedStat";
import { FadeIn } from "../../components/FadeIn";
import { FONT_SERIF, FONT_SANS } from "../../lib/fonts";
import { COLORS, GRADIENTS } from "../../lib/theme";

const STATS = [
  { value: 2.47, prefix: "$", suffix: "M", decimals: 2, label: "Total Balance", color: COLORS.textPrimary },
  { value: 7.2, prefix: "", suffix: "%", decimals: 1, label: "30d Return", color: COLORS.green },
  { value: 12, prefix: "", suffix: "", decimals: 0, label: "Active Positions", color: COLORS.accent },
];

const BREAKDOWN = [
  { label: "Treasury", pct: 45, color: "#3B82F6" },
  { label: "Real Estate", pct: 25, color: "#6366F1" },
  { label: "Private Credit", pct: 18, color: "#7C3AED" },
  { label: "Bonds", pct: 12, color: "#14B8A6" },
];

export const PortfolioDashboard: React.FC = () => {
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
          background: GRADIENTS.glow,
        }}
      />

      {/* Section label */}
      <Sequence from={0} durationInFrames={520} layout="none" premountFor={10}>
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
            Portfolio Dashboard
          </div>
        </FadeIn>
      </Sequence>

      {/* Headline */}
      <Sequence from={10} durationInFrames={510} layout="none" premountFor={10}>
        <FadeIn delay={0} duration={25} direction="up">
          <div
            style={{
              fontSize: 44,
              fontFamily: FONT_SERIF,
              fontWeight: 700,
              color: COLORS.textPrimary,
              textAlign: "center",
            }}
          >
            Real-Time Position Tracking
          </div>
        </FadeIn>
      </Sequence>

      {/* Animated stats row */}
      <Sequence from={40} durationInFrames={480} layout="none" premountFor={15}>
        <div style={{ display: "flex", gap: 60, justifyContent: "center" }}>
          {STATS.map((stat, i) => (
            <FadeIn key={i} delay={i * 15} duration={20} direction="up">
              <AnimatedStat
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
                startFrame={i * 15 + 10}
                duration={50}
                fontSize={48}
                color={stat.color}
                label={stat.label}
              />
            </FadeIn>
          ))}
        </div>
      </Sequence>

      {/* Allocation breakdown bars */}
      <Sequence from={150} durationInFrames={390} layout="none" premountFor={15}>
        <div style={{ width: 600, display: "flex", flexDirection: "column", gap: 16 }}>
          {BREAKDOWN.map((item, i) => {
            const barWidth = interpolate(
              frame - 150,
              [i * 20, i * 20 + 40],
              [0, item.pct],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );
            const rowOpacity = interpolate(
              frame - 150,
              [i * 20, i * 20 + 15],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div key={i} style={{ opacity: rowOpacity }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontFamily: FONT_SANS,
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: COLORS.textSecondary }}>{item.label}</span>
                  <span style={{ color: item.color }}>{item.pct}%</span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: COLORS.elevated,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth}%`,
                      borderRadius: 4,
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}40`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Sequence>

      {/* Tagline */}
      <Sequence from={280} durationInFrames={260} layout="none" premountFor={10}>
        <FadeIn delay={0} duration={25} direction="up">
          <div
            style={{
              fontSize: 16,
              fontFamily: FONT_SANS,
              color: COLORS.textDim,
              textAlign: "center",
            }}
          >
            All on-chain. All verifiable.
          </div>
        </FadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
