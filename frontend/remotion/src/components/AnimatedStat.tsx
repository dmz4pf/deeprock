import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { FONT_SANS } from "../lib/fonts";
import { COLORS } from "../lib/theme";

type AnimatedStatProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  startFrame?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  label?: string;
};

export const AnimatedStat: React.FC<AnimatedStatProps> = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  startFrame = 0,
  duration = 45,
  fontSize = 48,
  color = COLORS.textPrimary,
  label,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );

  const displayValue = (value * progress).toFixed(decimals);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize,
          fontWeight: 700,
          fontFamily: FONT_SANS,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {prefix}
        {displayValue}
        {suffix}
      </div>
      {label && (
        <div
          style={{
            fontSize: 20,
            fontFamily: FONT_SANS,
            color: COLORS.textDim,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginTop: 8,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
