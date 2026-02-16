import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";
import { FONT_SERIF, FONT_SANS } from "../lib/fonts";
import { COLORS, GRADIENTS } from "../lib/theme";

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 10,
  });

  const logoOpacity = interpolate(frame, [8, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [45, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(frame, [45, 70], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });


  const lineWidth = interpolate(frame, [65, 105], [0, 240], {
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
            "radial-gradient(ellipse at center, rgba(232,180,184,0.05), transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 28,
        }}
      >
        <div
          style={{
            fontSize: 110,
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
            width: lineWidth,
            height: 2,
            background: GRADIENTS.iridescent,
            boxShadow: `0 0 20px ${COLORS.copper}40`,
          }}
        />

        <div
          style={{
            fontSize: 40,
            fontFamily: FONT_SANS,
            fontWeight: 400,
            color: COLORS.textSecondary,
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          Now live on testnet.
        </div>
      </div>
    </AbsoluteFill>
  );
};
