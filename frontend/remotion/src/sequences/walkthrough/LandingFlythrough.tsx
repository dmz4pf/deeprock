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
import { COLORS, GRADIENTS } from "../../lib/theme";

const ASSET_CLASSES = [
  { name: "Treasury Bills", icon: "🏛", color: COLORS.copper },
  { name: "Real Estate", icon: "🏢", color: COLORS.roseGold },
  { name: "Private Credit", icon: "📄", color: COLORS.copperBright },
  { name: "Corporate Bonds", icon: "💼", color: COLORS.teal },
  { name: "Commodities", icon: "⛏", color: COLORS.gold },
];

export const LandingFlythrough: React.FC = () => {
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
          background: GRADIENTS.glow,
        }}
      />

      <Sequence from={5} durationInFrames={205} layout="none" premountFor={5}>
        <FadeIn delay={0} duration={18} direction="up" distance={25}>
          <div
            style={{
              fontSize: 72,
              fontFamily: FONT_SERIF,
              fontWeight: 700,
              color: COLORS.textPrimary,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 1000,
            }}
          >
            Five Asset Classes.{"\n"}One Platform.
          </div>
        </FadeIn>
      </Sequence>

      <Sequence from={30} durationInFrames={180} layout="none" premountFor={10}>
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
            maxWidth: 1200,
          }}
        >
          {ASSET_CLASSES.map((asset, i) => {
            const s = spring({
              frame: frame - 30 - i * 6,
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            const cardOpacity = interpolate(
              frame - 30,
              [i * 6, i * 6 + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  width: 200,
                  padding: "32px 24px",
                  borderRadius: 18,
                  border: `1px solid ${asset.color}25`,
                  backgroundColor: COLORS.surface,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  opacity: cardOpacity,
                  transform: `scale(${s})`,
                }}
              >
                <div style={{ fontSize: 48 }}>{asset.icon}</div>
                <div
                  style={{
                    fontSize: 24,
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

      <Sequence from={90} durationInFrames={120} layout="none" premountFor={5}>
        <FadeIn delay={0} duration={18} direction="up" distance={15}>
          <div
            style={{
              fontSize: 28,
              fontFamily: FONT_SANS,
              color: COLORS.textSecondary,
              textAlign: "center",
              maxWidth: 750,
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
