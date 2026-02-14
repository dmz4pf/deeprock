import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

type ScreenTransitionProps = {
  children: React.ReactNode;
  from?: { scale: number; x: number; y: number };
  to?: { scale: number; x: number; y: number };
  startFrame?: number;
  duration?: number;
};

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  from = { scale: 1, x: 0, y: 0 },
  to = { scale: 1, x: 0, y: 0 },
  startFrame = 0,
  duration = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 200 },
    durationInFrames: duration,
  });

  const scale = interpolate(progress, [0, 1], [from.scale, to.scale]);
  const x = interpolate(progress, [0, 1], [from.x, to.x]);
  const y = interpolate(progress, [0, 1], [from.y, to.y]);

  return (
    <div
      style={{
        transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        transformOrigin: "center center",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
};
