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

export const DocsSecurity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* Phase crossfade */
  const phase1Opacity = interpolate(frame, [260, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase2Opacity = interpolate(frame, [290, 320], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sealScale = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const checkOpacity = interpolate(frame, [90, 110], [0, 1], {
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
            "radial-gradient(ellipse at center, rgba(212,175,55,0.04), transparent 60%)",
        }}
      />

      {/* Phase 1: Document Verification */}
      <Sequence from={0} durationInFrames={320} premountFor={15}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            opacity: phase1Opacity,
          }}
        >
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
              Document Verification
            </div>
          </FadeIn>

          {/* Seal */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: `3px solid ${COLORS.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              backgroundColor: "rgba(10,14,26,0.9)",
              transform: `scale(${sealScale})`,
              boxShadow: `0 0 40px ${COLORS.goldDim}, inset 0 0 20px ${COLORS.goldDim}`,
            }}
          >
            <div style={{ fontSize: 44, opacity: checkOpacity }}>✓</div>
            <div
              style={{
                fontSize: 12,
                fontFamily: FONT_SANS,
                fontWeight: 600,
                color: COLORS.gold,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: 6,
                opacity: checkOpacity,
              }}
            >
              Verified
            </div>
          </div>

          <FadeIn delay={70} duration={25} direction="up">
            <div style={{ textAlign: "center", maxWidth: 550 }}>
              <div
                style={{
                  fontSize: 28,
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
                Every document sealed with a hash anyone can verify. Immutable,
                transparent, tamper-proof.
              </div>
            </div>
          </FadeIn>
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2: Passkey Security */}
      <Sequence from={290} durationInFrames={170} premountFor={15}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            opacity: phase2Opacity,
          }}
        >
          <FadeIn delay={0} duration={25}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 25,
                background: `linear-gradient(135deg, ${COLORS.accent}20, ${COLORS.accent2}20)`,
                border: `1px solid ${COLORS.accent}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 50,
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

          <Sequence from={40} durationInFrames={130} layout="none" premountFor={10}>
            <TextReveal
              text="Keys secured biometrically through passkeys. Your keys, your assets."
              startFrame={0}
              framesPerWord={4}
              fontSize={18}
              color={COLORS.textSecondary}
              maxWidth={600}
            />
          </Sequence>

          {/* Trust badges */}
          <Sequence from={80} durationInFrames={90} layout="none" premountFor={10}>
            <div style={{ display: "flex", gap: 16 }}>
              {["On-Chain Proofs", "Biometric Auth", "Account Abstraction"].map(
                (badge, i) => {
                  const badgeOpacity = interpolate(
                    frame - 370,
                    [i * 15, i * 15 + 18],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  );

                  return (
                    <div
                      key={i}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: `1px solid ${COLORS.accent}30`,
                        backgroundColor: `${COLORS.accent}10`,
                        color: COLORS.accent,
                        fontSize: 13,
                        fontFamily: FONT_SANS,
                        fontWeight: 600,
                        opacity: badgeOpacity,
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
