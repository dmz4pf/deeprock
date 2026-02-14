import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { FONT_SANS } from "../lib/fonts";
import { COLORS } from "../lib/theme";

type TextRevealProps = {
  text: string;
  startFrame?: number;
  framesPerWord?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  maxWidth?: number;
  textAlign?: "left" | "center" | "right";
};

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  startFrame = 0,
  framesPerWord = 4,
  fontSize = 32,
  color = COLORS.textPrimary,
  fontFamily = FONT_SANS,
  fontWeight = 400,
  lineHeight = 1.5,
  maxWidth = 1200,
  textAlign = "center",
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <div
      style={{
        fontSize,
        color,
        fontFamily,
        fontWeight,
        lineHeight,
        maxWidth,
        textAlign,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: textAlign === "center" ? "center" : "flex-start",
        gap: `0 ${fontSize * 0.3}px`,
      }}
    >
      {words.map((word, i) => {
        const wordStart = startFrame + i * framesPerWord;
        const opacity = interpolate(
          frame,
          [wordStart, wordStart + framesPerWord],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          }
        );
        const y = interpolate(
          frame,
          [wordStart, wordStart + framesPerWord],
          [12, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          }
        );

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
