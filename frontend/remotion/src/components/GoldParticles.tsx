import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing, random } from "remotion";
import { COLORS } from "../lib/theme";

type GoldParticlesProps = {
  count?: number;
  convergeFrame?: number;
  convergeDuration?: number;
  seed?: string;
};

export const GoldParticles: React.FC<GoldParticlesProps> = ({
  count = 60,
  convergeFrame = 30,
  convergeDuration = 90,
  seed = "particles",
}) => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      startX: (random(`${seed}-x-${i}`) - 0.5) * 1920 * 1.5,
      startY: (random(`${seed}-y-${i}`) - 0.5) * 1080 * 1.5,
      size: 2 + random(`${seed}-s-${i}`) * 4,
      delay: random(`${seed}-d-${i}`) * 30,
      opacity: 0.3 + random(`${seed}-o-${i}`) * 0.7,
    }));
  }, [count, seed]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {particles.map((p, i) => {
        const progress = interpolate(
          frame,
          [
            convergeFrame + p.delay,
            convergeFrame + p.delay + convergeDuration,
          ],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }
        );

        const x = interpolate(progress, [0, 1], [p.startX, 0]);
        const y = interpolate(progress, [0, 1], [p.startY, 0]);
        const opacity = interpolate(
          progress,
          [0, 0.5, 1],
          [p.opacity, p.opacity, 0]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: COLORS.gold,
              boxShadow: `0 0 ${p.size * 2}px ${COLORS.gold}60`,
              transform: `translate(${x}px, ${y}px)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};
