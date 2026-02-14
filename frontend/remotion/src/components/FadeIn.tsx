import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  style?: React.CSSProperties;
};

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 20,
  direction = "up",
  distance = 30,
  style,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const translateMap = {
    up: { x: 0, y: distance * (1 - progress) },
    down: { x: 0, y: -distance * (1 - progress) },
    left: { x: distance * (1 - progress), y: 0 },
    right: { x: -distance * (1 - progress), y: 0 },
    none: { x: 0, y: 0 },
  };

  const { x, y } = translateMap[direction];

  return (
    <div
      style={{
        opacity: progress,
        transform: `translate(${x}px, ${y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
