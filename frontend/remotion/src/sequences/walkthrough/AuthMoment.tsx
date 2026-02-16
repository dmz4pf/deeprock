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
import { TextReveal } from "../../components/TextReveal";
import { FONT_SERIF, FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

export const AuthMoment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fpScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const fpOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const authGlow = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const authTextOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(201,160,220,0.06), transparent 60%)",
        }}
      />

      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 36,
          background: `linear-gradient(135deg, ${COLORS.copper}15, ${COLORS.roseGold}15)`,
          border: `2px solid ${COLORS.copper}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 80,
          transform: `scale(${fpScale})`,
          opacity: fpOpacity,
          boxShadow:
            authGlow > 0
              ? `0 0 ${50 * authGlow}px ${COLORS.copper}${Math.round(30 * authGlow).toString(16).padStart(2, "0")}`
              : "none",
        }}
      >
        👆
      </div>

      <div
        style={{
          opacity: authTextOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            color: COLORS.copper,
            letterSpacing: "0.05em",
          }}
        >
          Authenticated
        </div>
        <div
          style={{
            fontSize: 28,
            fontFamily: FONT_SANS,
            color: COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          Smart wallet created from your fingerprint
        </div>
      </div>

      <Sequence from={80} durationInFrames={100} layout="none" premountFor={5}>
        <TextReveal
          text="No seed phrases. No extensions. One biometric scan."
          startFrame={0}
          framesPerWord={4}
          fontSize={30}
          color={COLORS.textSecondary}
          maxWidth={700}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
