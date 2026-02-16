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
import { COLORS, GRADIENTS } from "../lib/theme";

export const TrustSecurity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sealScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const sealOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const checkOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const verifiedTextOpacity = interpolate(frame, [70, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const phase1Opacity = interpolate(frame, [150, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2Opacity = interpolate(frame, [170, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(232,180,184,0.04), transparent 60%)",
        }}
      />

      {/* Phase 1: On-Chain Seal */}
      <Sequence from={0} durationInFrames={200} premountFor={10}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
            opacity: phase1Opacity,
          }}
        >
          <FadeIn delay={5} duration={18} direction="none">
            <div
              style={{
                fontSize: 24,
                fontFamily: FONT_SANS,
                fontWeight: 600,
                color: COLORS.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.25em",
              }}
            >
              Document Verification
            </div>
          </FadeIn>

          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: `3px solid ${COLORS.copper}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              backgroundColor: COLORS.surface,
              transform: `scale(${sealScale})`,
              opacity: sealOpacity,
              boxShadow: `0 0 50px ${COLORS.copper}30, inset 0 0 25px ${COLORS.copper}15`,
            }}
          >
            <div style={{ fontSize: 64, opacity: checkOpacity, color: COLORS.copper }}>✓</div>
            <div
              style={{
                fontSize: 22,
                fontFamily: FONT_SANS,
                fontWeight: 600,
                color: COLORS.copper,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: 8,
                opacity: checkOpacity,
              }}
            >
              Verified
            </div>
          </div>

          <div style={{ opacity: verifiedTextOpacity, maxWidth: 800, textAlign: "center" }}>
            <div
              style={{
                fontSize: 44,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                marginBottom: 14,
              }}
            >
              Cryptographic Proof on Avalanche
            </div>
            <div
              style={{
                fontSize: 28,
                fontFamily: FONT_SANS,
                color: COLORS.textSecondary,
                lineHeight: 1.6,
              }}
            >
              Every document sealed with a hash anyone can verify.
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2: Passkey Security */}
      <Sequence from={170} durationInFrames={190} premountFor={15}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            opacity: phase2Opacity,
          }}
        >
          <FadeIn delay={0} duration={22}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 32,
                background: `linear-gradient(135deg, ${COLORS.copper}20, ${COLORS.roseGold}20)`,
                border: `1px solid ${COLORS.copper}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 70,
              }}
            >
              🔐
            </div>
          </FadeIn>

          <FadeIn delay={18} duration={22}>
            <div
              style={{
                fontSize: 52,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textAlign: "center",
              }}
            >
              Non-Custodial by Design
            </div>
          </FadeIn>

          <Sequence from={40} durationInFrames={120} layout="none" premountFor={10}>
            <TextReveal
              text="Keys secured biometrically through passkeys. Your keys, your assets."
              startFrame={0}
              framesPerWord={4}
              fontSize={32}
              color={COLORS.textSecondary}
              maxWidth={800}
            />
          </Sequence>

          <Sequence from={80} durationInFrames={110} layout="none" premountFor={10}>
            <div style={{ display: "flex", gap: 20 }}>
              {["On-Chain Proofs", "Biometric Auth", "Account Abstraction"].map(
                (badge, i) => {
                  const badgeProgress = interpolate(
                    frame - 170,
                    [80 + i * 12, 98 + i * 12],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  );
                  const badgeY = interpolate(
                    frame - 170,
                    [80 + i * 12, 98 + i * 12],
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
                        padding: "14px 28px",
                        borderRadius: 10,
                        border: `1px solid ${COLORS.copper}30`,
                        backgroundColor: `${COLORS.copper}10`,
                        color: COLORS.copper,
                        fontSize: 24,
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
