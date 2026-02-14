import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
} from "remotion";
import { GoldParticles } from "../components/GoldParticles";
import { FONT_SERIF, FONT_SANS } from "../lib/fonts";
import { COLORS } from "../lib/theme";

export const BrandReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame: frame - 90,
    fps,
    config: { damping: 200 },
  });

  const logoOpacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [160, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [160, 200], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const lineWidth = interpolate(frame, [210, 260], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.08), transparent 60%)",
        }}
      />

      <Sequence from={0} durationInFrames={200} premountFor={10}>
        <GoldParticles count={80} convergeFrame={20} convergeDuration={80} />
      </Sequence>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            color: COLORS.textPrimary,
            letterSpacing: "0.08em",
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          DeepRock
        </div>

        <div
          style={{
            fontSize: 22,
            fontFamily: FONT_SANS,
            fontWeight: 300,
            color: COLORS.textSecondary,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Tokenized Real-World Assets on Avalanche
        </div>

        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: COLORS.gold,
            marginTop: 8,
            boxShadow: `0 0 10px ${COLORS.goldDim}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
