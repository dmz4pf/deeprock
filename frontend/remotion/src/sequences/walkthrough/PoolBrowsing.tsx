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

const POOLS = [
  { name: "US Treasury 6-Month", apy: "5.2%", risk: "Low", capacity: "$24M / $50M", color: COLORS.copper },
  { name: "Manhattan REIT Fund", apy: "8.7%", risk: "Medium", capacity: "$12M / $30M", color: COLORS.roseGold },
  { name: "SME Credit Pool", apy: "11.4%", risk: "Med-High", capacity: "$8M / $20M", color: COLORS.copperBright },
  { name: "Gold-Backed Token", apy: "3.1%", risk: "Low", capacity: "$18M / $40M", color: COLORS.gold },
];

export const PoolBrowsing: React.FC = () => {
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
            "radial-gradient(ellipse at center, rgba(232,180,184,0.06), transparent 70%)",
        }}
      />

      <Sequence from={5} durationInFrames={235} layout="none" premountFor={5}>
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
            Browse Investment Pools
          </div>
        </FadeIn>
      </Sequence>

      <Sequence from={25} durationInFrames={215} layout="none" premountFor={10}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            maxWidth: 900,
          }}
        >
          {POOLS.map((pool, i) => {
            const s = spring({
              frame: frame - 25 - i * 8,
              fps,
              config: { damping: 14, stiffness: 100 },
            });
            const cardOpacity = interpolate(
              frame - 25,
              [i * 8, i * 8 + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  padding: "28px",
                  borderRadius: 16,
                  border: `1px solid ${pool.color}20`,
                  backgroundColor: COLORS.surface,
                  opacity: cardOpacity,
                  transform: `scale(${s})`,
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    marginBottom: 18,
                  }}
                >
                  {pool.name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div
                      style={{
                        fontSize: 40,
                        fontFamily: FONT_SANS,
                        fontWeight: 700,
                        color: pool.color,
                      }}
                    >
                      {pool.apy}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontFamily: FONT_SANS,
                        color: COLORS.textDim,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      APY
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontFamily: FONT_SANS,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {pool.risk}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontFamily: FONT_SANS,
                        color: COLORS.textDim,
                        marginTop: 6,
                      }}
                    >
                      {pool.capacity}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Sequence>

      <Sequence from={110} durationInFrames={130} layout="none" premountFor={5}>
        <FadeIn delay={0} duration={18} direction="up" distance={12}>
          <div
            style={{
              fontSize: 28,
              fontFamily: FONT_SANS,
              color: COLORS.textSecondary,
              textAlign: "center",
              maxWidth: 650,
            }}
          >
            APY, lockup terms, risk rating, and capacity — all visible before
            you invest.
          </div>
        </FadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
