import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { AppFrame } from "../../components/AppFrame";
import { COLORS } from "../../lib/theme";

const MONTAGE_SCREENS = [
  { screenshot: "screenshots/pools-real-estate.png", duration: 50 },
  { screenshot: "screenshots/pools-private-credit.png", duration: 50 },
  { screenshot: "screenshots/settings.png", duration: 50 },
  { screenshot: "screenshots/pools-commodities.png", duration: 50 },
];

export const QuickMontage: React.FC = () => {
  const frame = useCurrentFrame();

  let offset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {MONTAGE_SCREENS.map((screen, i) => {
        const from = offset;
        offset += screen.duration;

        const fadeIn = interpolate(frame, [from, from + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(
          frame,
          [from + screen.duration - 8, from + screen.duration],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const scale = interpolate(frame, [from, from + screen.duration], [1.02, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        });

        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={screen.duration}
            premountFor={10}
          >
            <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                }}
              >
                <AppFrame screenshot={screen.screenshot} />
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
