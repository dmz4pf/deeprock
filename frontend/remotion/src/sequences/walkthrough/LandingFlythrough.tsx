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

export const LandingFlythrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Zoom in from overview to hero */}
      <ScreenTransition
        from={{ scale: 0.85, x: 0, y: 0 }}
        to={{ scale: 1, x: 0, y: 0 }}
        duration={45}
      >
        <AppFrame screenshot="screenshots/landing-hero.png">
          {/* Callout: Five asset classes */}
          <Sequence from={60} durationInFrames={200} layout="none" premountFor={15}>
            <FadeIn delay={0} direction="up" duration={20}>
              <div
                style={{
                  position: "absolute",
                  bottom: 80,
                  right: 60,
                  padding: "14px 24px",
                  borderRadius: 10,
                  backgroundColor: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: COLORS.textPrimary,
                  fontSize: 16,
                  fontFamily: FONT_SANS,
                  fontWeight: 500,
                  backdropFilter: "blur(8px)",
                }}
              >
                Five asset classes. One platform.
              </div>
            </FadeIn>
          </Sequence>
        </AppFrame>
      </ScreenTransition>
    </AbsoluteFill>
  );
};
