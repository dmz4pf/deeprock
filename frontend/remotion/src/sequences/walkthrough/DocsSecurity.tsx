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
import { ScreenTransition } from "../../components/ScreenTransition";
import { FadeIn } from "../../components/FadeIn";
import { FONT_SANS } from "../../lib/fonts";
import { COLORS } from "../../lib/theme";

export const DocsSecurity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* Cross-fade from documents to settings/passkeys */
  const docsOpacity = interpolate(frame, [250, 290], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const passkeysOpacity = interpolate(frame, [280, 310], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Phase 1: Documents page with seal verification */}
      <Sequence from={0} durationInFrames={310} premountFor={15}>
        <AbsoluteFill style={{ opacity: docsOpacity }}>
          <ScreenTransition
            from={{ scale: 1, x: 0, y: 0 }}
            to={{ scale: 1.08, x: -60, y: -40 }}
            startFrame={30}
            duration={100}
          >
            <AppFrame screenshot="screenshots/documents.png">
              <Sequence from={50} durationInFrames={240} layout="none" premountFor={10}>
                <FadeIn delay={0} direction="up" duration={20}>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 80,
                      left: 80,
                      padding: "12px 20px",
                      borderRadius: 8,
                      backgroundColor: `${COLORS.gold}15`,
                      border: `1px solid ${COLORS.gold}30`,
                      color: COLORS.gold,
                      fontSize: 14,
                      fontFamily: FONT_SANS,
                      fontWeight: 500,
                    }}
                  >
                    Cryptographic seals anyone can verify
                  </div>
                </FadeIn>
              </Sequence>
            </AppFrame>
          </ScreenTransition>
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2: Passkey management */}
      <Sequence from={280} durationInFrames={180} premountFor={15}>
        <AbsoluteFill style={{ opacity: passkeysOpacity }}>
          <ScreenTransition
            from={{ scale: 0.95, x: 0, y: 10 }}
            to={{ scale: 1, x: 0, y: 0 }}
            duration={25}
          >
            <AppFrame screenshot="screenshots/settings-passkeys.png">
              <Sequence from={30} durationInFrames={150} layout="none" premountFor={10}>
                <FadeIn delay={0} direction="right" duration={20}>
                  <div
                    style={{
                      position: "absolute",
                      top: 80,
                      right: 60,
                      padding: "12px 20px",
                      borderRadius: 8,
                      backgroundColor: `${COLORS.accent}12`,
                      border: `1px solid ${COLORS.accent}25`,
                      color: COLORS.accent,
                      fontSize: 14,
                      fontFamily: FONT_SANS,
                      fontWeight: 500,
                    }}
                  >
                    Biometric key management
                  </div>
                </FadeIn>
              </Sequence>
            </AppFrame>
          </ScreenTransition>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
