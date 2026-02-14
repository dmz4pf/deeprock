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
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const fpOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const authGlow = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const authTextOpacity = interpolate(frame, [95, 115], [0, 1], {
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
        gap: 32,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,0.06), transparent 60%)",
        }}
      />

      {/* Section label */}
      <Sequence from={0} durationInFrames={230} layout="none" premountFor={10}>
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
            Onboarding
          </div>
        </FadeIn>
      </Sequence>

      {/* Fingerprint icon */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 35,
          background: `linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.accent2}15)`,
          border: `2px solid ${COLORS.accent}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          transform: `scale(${fpScale})`,
          opacity: fpOpacity,
          boxShadow:
            authGlow > 0
              ? `0 0 ${40 * authGlow}px rgba(212,175,55,${0.3 * authGlow})`
              : "none",
        }}
      >
        👆
      </div>

      {/* "Authenticated" text */}
      <div
        style={{
          opacity: authTextOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            color: COLORS.gold,
            letterSpacing: "0.05em",
          }}
        >
          Authenticated
        </div>
        <div
          style={{
            fontSize: 16,
            fontFamily: FONT_SANS,
            color: COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          Smart wallet created from your fingerprint
        </div>
      </div>

      {/* Explanation */}
      <Sequence from={120} durationInFrames={120} layout="none" premountFor={10}>
        <TextReveal
          text="No seed phrases. No extensions. One biometric scan."
          startFrame={0}
          framesPerWord={5}
          fontSize={20}
          color={COLORS.textSecondary}
          maxWidth={600}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
