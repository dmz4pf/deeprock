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
import { COLORS, GRADIENTS } from "../../lib/theme";

const ASSET_CLASSES = [
  { name: "Treasury Bills", icon: "🏛", color: "#3B82F6" },
  { name: "Real Estate", icon: "🏢", color: "#6366F1" },
  { name: "Private Credit", icon: "📄", color: "#7C3AED" },
  { name: "Corporate Bonds", icon: "💼", color: "#14B8A6" },
  { name: "Commodities", icon: "⛏", color: "#D4AF37" },
];

export const LandingFlythrough: React.FC = () => {
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

      <Sequence from={0} durationInFrames={280} layout="none" premountFor={10}>
        <FadeIn delay={0} duration={20} direction="none">
          <div
            style={{
              fontSize: 12,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              color: COLORS.textDim,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              textAlign: "center",
            }}
          >
            The Platform
          </div>
        </FadeIn>
      </Sequence>

      <Sequence from={15} durationInFrames={270} layout="none" premountFor={10}>
        <FadeIn delay={0} duration={25} direction="up">
          <div
            style={{
              fontSize: 52,
              fontFamily: FONT_SERIF,
              fontWeight: 700,
              color: COLORS.textPrimary,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            Five Asset Classes.{"\n"}One Platform.
          </div>
        </FadeIn>
      </Sequence>

      <Sequence from={60} durationInFrames={240} layout="none" premountFor={15}>
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
            maxWidth: 1100,
          }}
        >
          {ASSET_CLASSES.map((asset, i) => {
            const cardDelay = i * 12;
            const cardOpacity = interpolate(
              frame - 60,
              [cardDelay, cardDelay + 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const cardY = interpolate(
              frame - 60,
              [cardDelay, cardDelay + 20],
              [30, 0],
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
                  width: 180,
                  padding: "28px 20px",
                  borderRadius: 16,
                  border: `1px solid ${asset.color}25`,
                  backgroundColor: `${asset.color}08`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                }}
              >
                <div style={{ fontSize: 36 }}>{asset.icon}</div>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    color: asset.color,
                    textAlign: "center",
                  }}
                >
                  {asset.name}
                </div>
              </div>
            );
          })}
        </div>
      </Sequence>

      <Sequence from={140} durationInFrames={160} layout="none" premountFor={10}>
        <FadeIn delay={0} duration={25} direction="up">
          <div
            style={{
              fontSize: 18,
              fontFamily: FONT_SANS,
              color: COLORS.textSecondary,
              textAlign: "center",
              maxWidth: 650,
              lineHeight: 1.6,
            }}
          >
            Each pool independently audited with live capacity and fee
            transparency.
          </div>
        </FadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
