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
import { COLORS, GRADIENTS } from "../lib/theme";

export const BrandReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200 },
  });

  const logoOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [65, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [65, 95], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const lineWidth = interpolate(frame, [95, 135], [0, 280], {
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
            "radial-gradient(ellipse at center, rgba(232,180,184,0.06), transparent 60%)",
        }}
      />

      <Sequence from={0} durationInFrames={150} premountFor={10}>
        <GoldParticles count={80} convergeFrame={10} convergeDuration={50} />
      </Sequence>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontSize: 120,
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
            fontSize: 32,
            fontFamily: FONT_SANS,
            fontWeight: 300,
            color: COLORS.textSecondary,
            letterSpacing: "0.25em",
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
            height: 2,
            background: GRADIENTS.iridescent,
            marginTop: 12,
            boxShadow: `0 0 20px rgba(232,180,184,0.25)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
