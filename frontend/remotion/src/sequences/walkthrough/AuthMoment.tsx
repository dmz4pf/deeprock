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
import { AppFrame } from "../../components/AppFrame";
import { FadeIn } from "../../components/FadeIn";
import { FONT_SERIF, FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

export const AuthMoment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* Phase 1: Login screen (0-80) */
  const loginOpacity = interpolate(frame, [70, 100], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Phase 2: Fingerprint authentication (80-160) */
  const fpScale = spring({
    frame: frame - 90,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const fpOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Phase 3: "Authenticated" glow (140-240) */
  const authGlow = interpolate(frame, [140, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const authTextOpacity = interpolate(frame, [155, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Phase 1: Login screen */}
      <Sequence from={0} durationInFrames={110} premountFor={15}>
        <AbsoluteFill style={{ opacity: loginOpacity }}>
          <AppFrame screenshot="screenshots/login.png" />
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2-3: Fingerprint + Authenticated */}
      <Sequence from={80} durationInFrames={160} premountFor={15}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
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
              boxShadow: authGlow > 0
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
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 28,
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
                fontSize: 14,
                fontFamily: FONT_SANS,
                color: COLORS.textSecondary,
              }}
            >
              Smart wallet created from your fingerprint
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
