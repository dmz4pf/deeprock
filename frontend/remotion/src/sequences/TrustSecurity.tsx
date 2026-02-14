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
import { FadeIn } from "../components/FadeIn";
import { TextReveal } from "../components/TextReveal";
import { FONT_SERIF, FONT_SANS } from "../lib/fonts";
import { COLORS } from "../lib/theme";

export const TrustSecurity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* ── Phase 1: Seal verification ── */
  const sealScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const sealOpacity = interpolate(frame, [50, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const checkOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const verifiedTextOpacity = interpolate(frame, [145, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ── Phase 1→2 crossfade ── */
  const phase1Opacity = interpolate(frame, [300, 350], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2Opacity = interpolate(frame, [340, 380], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(212,175,55,0.04), transparent 60%)",
        }}
      />

      {/* ── Phase 1: On-Chain Seal Verification ── */}
      <Sequence from={0} durationInFrames={380} premountFor={15}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
            opacity: phase1Opacity,
          }}
        >
          {/* Section label */}
          <FadeIn delay={10} duration={20} direction="none">
            <div
              style={{
                fontSize: 12,
                fontFamily: FONT_SANS,
                fontWeight: 600,
                color: COLORS.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              Document Verification
            </div>
          </FadeIn>

          {/* Seal ring */}
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: `3px solid ${COLORS.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              backgroundColor: "rgba(10,14,26,0.9)",
              transform: `scale(${sealScale})`,
              opacity: sealOpacity,
              boxShadow: `0 0 40px ${COLORS.goldDim}, inset 0 0 20px ${COLORS.goldDim}`,
            }}
          >
            <div style={{ fontSize: 48, opacity: checkOpacity }}>✓</div>
            <div
              style={{
                fontSize: 14,
                fontFamily: FONT_SANS,
                fontWeight: 600,
                color: COLORS.gold,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: 8,
                opacity: checkOpacity,
              }}
            >
              Verified
            </div>
          </div>

          {/* Explanation text */}
          <div style={{ opacity: verifiedTextOpacity, maxWidth: 600, textAlign: "center" }}>
            <div
              style={{
                fontSize: 24,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                marginBottom: 12,
              }}
            >
              Cryptographic Proof on Avalanche
            </div>
            <div
              style={{
                fontSize: 16,
                fontFamily: FONT_SANS,
                color: COLORS.textSecondary,
                lineHeight: 1.6,
              }}
            >
              Every document is sealed with a hash anyone can verify. Immutable,
              transparent, tamper-proof.
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Phase 2: Biometric / Passkey Security ── */}
      <Sequence from={340} durationInFrames={420} premountFor={30}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            opacity: phase2Opacity,
          }}
        >
          {/* Fingerprint icon */}
          <FadeIn delay={0} duration={25}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 30,
                background: `linear-gradient(135deg, ${COLORS.accent}20, ${COLORS.accent2}20)`,
                border: `1px solid ${COLORS.accent}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 60,
              }}
            >
              🔐
            </div>
          </FadeIn>

          <FadeIn delay={20} duration={25}>
            <div
              style={{
                fontSize: 32,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textAlign: "center",
              }}
            >
              Non-Custodial by Design
            </div>
          </FadeIn>

          <Sequence from={40} durationInFrames={300} layout="none" premountFor={10}>
            <TextReveal
              text="Keys are secured biometrically through passkeys — no seed phrases, no extensions."
              startFrame={0}
              framesPerWord={4}
              fontSize={20}
              color={COLORS.textSecondary}
              maxWidth={700}
            />
          </Sequence>

          {/* Trust badges */}
          <Sequence from={120} durationInFrames={300} layout="none" premountFor={10}>
            <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
              {["On-Chain Proofs", "Biometric Auth", "Account Abstraction"].map(
                (badge, i) => {
                  const badgeProgress = interpolate(
                    frame - 340,
                    [120 + i * 18, 145 + i * 18],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  );
                  const badgeY = interpolate(
                    frame - 340,
                    [120 + i * 18, 145 + i * 18],
                    [10, 0],
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
                        padding: "10px 20px",
                        borderRadius: 8,
                        border: `1px solid ${COLORS.accent}30`,
                        backgroundColor: `${COLORS.accent}10`,
                        color: COLORS.accent,
                        fontSize: 14,
                        fontFamily: FONT_SANS,
                        fontWeight: 600,
                        opacity: badgeProgress,
                        transform: `translateY(${badgeY}px)`,
                      }}
                    >
                      {badge}
                    </div>
                  );
                }
              )}
            </div>
          </Sequence>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
