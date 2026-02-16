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
  { value: 12, prefix: "", suffix: "", decimals: 0, label: "Active Positions", color: COLORS.copper },
];

const BREAKDOWN = [
  { label: "Treasury", pct: 45, color: COLORS.copper },
  { label: "Real Estate", pct: 25, color: COLORS.roseGold },
  { label: "Private Credit", pct: 18, color: COLORS.copperBright },
  { label: "Bonds", pct: 12, color: COLORS.teal },
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

      <Sequence from={5} durationInFrames={295} layout="none" premountFor={5}>
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
            Real-Time Position Tracking
          </div>
        </FadeIn>
      </Sequence>

      <Sequence from={25} durationInFrames={275} layout="none" premountFor={10}>
        <div style={{ display: "flex", gap: 60, justifyContent: "center" }}>
          {STATS.map((stat, i) => (
            <FadeIn key={i} delay={i * 10} duration={15} direction="up" distance={20}>
              <AnimatedStat
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
                startFrame={i * 10 + 5}
                duration={35}
                fontSize={60}
                color={stat.color}
                label={stat.label}
              />
            </FadeIn>
          ))}
        </div>
      </Sequence>

      <Sequence from={80} durationInFrames={220} layout="none" premountFor={10}>
        <div style={{ width: 700, display: "flex", flexDirection: "column", gap: 20 }}>
          {BREAKDOWN.map((item, i) => {
            const barWidth = interpolate(
              frame - 80,
              [i * 12, i * 12 + 25],
              [0, item.pct],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );
            const rowOpacity = interpolate(
              frame - 80,
              [i * 12, i * 12 + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div key={i} style={{ opacity: rowOpacity }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    fontFamily: FONT_SANS,
                    fontSize: 22,
                  }}
                >
                  <span style={{ color: COLORS.textSecondary }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.pct}%</span>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: COLORS.elevated,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth}%`,
                      borderRadius: 5,
                      backgroundColor: item.color,
                      boxShadow: `0 0 12px ${item.color}40`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Sequence>

      <Sequence from={180} durationInFrames={120} layout="none" premountFor={5}>
        <FadeIn delay={0} duration={18} direction="up" distance={12}>
          <div
            style={{
              fontSize: 28,
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
