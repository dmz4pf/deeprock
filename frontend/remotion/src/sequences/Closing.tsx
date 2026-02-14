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
import { COLORS } from "../lib/theme";

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 15,
  });

  const logoOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(frame, [60, 90], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const urlOpacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [90, 140], [0, 160], {
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
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.06), transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 80,
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
            height: 1,
            backgroundColor: COLORS.gold,
            boxShadow: `0 0 10px ${COLORS.goldDim}`,
          }}
        />

        <div
          style={{
            fontSize: 28,
            fontFamily: FONT_SANS,
            fontWeight: 400,
            color: COLORS.textSecondary,
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          Now live on testnet.
        </div>

        <div
          style={{
            fontSize: 16,
            fontFamily: FONT_SANS,
            fontWeight: 300,
            color: COLORS.textDim,
            letterSpacing: "0.1em",
            opacity: urlOpacity,
          }}
        >
          deeprock.finance
        </div>
      </div>
    </AbsoluteFill>
  );
};
