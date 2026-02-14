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

const POOLS = [
  { name: "US Treasury 6-Month", apy: "5.2%", risk: "Low", capacity: "$24M / $50M", color: "#3B82F6" },
  { name: "Manhattan REIT Fund", apy: "8.7%", risk: "Medium", capacity: "$12M / $30M", color: "#6366F1" },
  { name: "SME Credit Pool", apy: "11.4%", risk: "Medium-High", capacity: "$8M / $20M", color: "#7C3AED" },
  { name: "Gold-Backed Token", apy: "3.1%", risk: "Low", capacity: "$18M / $40M", color: "#D4AF37" },
];

export const PoolBrowsing: React.FC = () => {
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
            "radial-gradient(ellipse at center, rgba(99,102,241,0.06), transparent 70%)",
        }}
      />

      {/* Section label */}
      <Sequence from={0} durationInFrames={430} layout="none" premountFor={10}>
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
            Pool Explorer
          </div>
        </FadeIn>
      </Sequence>

      {/* Headline */}
      <Sequence from={10} durationInFrames={420} layout="none" premountFor={10}>
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
            Browse Investment Pools
          </div>
        </FadeIn>
      </Sequence>

      {/* Pool cards */}
      <Sequence from={50} durationInFrames={400} layout="none" premountFor={15}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            maxWidth: 800,
          }}
        >
          {POOLS.map((pool, i) => {
            const cardDelay = i * 18;
            const cardOpacity = interpolate(
              frame - 50,
              [cardDelay, cardDelay + 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const cardScale = interpolate(
              frame - 50,
              [cardDelay, cardDelay + 20],
              [0.95, 1],
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
                  padding: "24px",
                  borderRadius: 16,
                  border: `1px solid ${pool.color}20`,
                  backgroundColor: COLORS.surface,
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    marginBottom: 16,
                  }}
                >
                  {pool.name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div
                      style={{
                        fontSize: 28,
                        fontFamily: FONT_SANS,
                        fontWeight: 700,
                        color: pool.color,
                      }}
                    >
                      {pool.apy}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
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
                        fontSize: 13,
                        fontFamily: FONT_SANS,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {pool.risk}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: FONT_SANS,
                        color: COLORS.textDim,
                        marginTop: 4,
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

      {/* Subtitle */}
      <Sequence from={160} durationInFrames={290} layout="none" premountFor={10}>
        <FadeIn delay={0} duration={25} direction="up">
          <div
            style={{
              fontSize: 16,
              fontFamily: FONT_SANS,
              color: COLORS.textSecondary,
              textAlign: "center",
              maxWidth: 550,
            }}
          >
            APY, lockup terms, risk rating, and remaining capacity — all visible
            before you invest.
          </div>
        </FadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
