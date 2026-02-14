import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { TextReveal } from "../components/TextReveal";
import { FadeIn } from "../components/FadeIn";
import { FONT_SERIF, FONT_SANS } from "../lib/fonts";
import { COLORS } from "../lib/theme";

const KEYWORDS = [
  { text: "Treasury Bills", color: "#E8B4B8" },
  { text: "Real Estate", color: "#C9A0DC" },
  { text: "Private Credit", color: "#F5E6D3" },
  { text: "Corporate Bonds", color: "#B8A99A" },
  { text: "Commodities", color: "#6FCF97" },
];

export const Context: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,0.06), transparent 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 200px",
          gap: 50,
        }}
      >
        {/* Keywords */}
        <Sequence from={0} durationInFrames={180} premountFor={10}>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {KEYWORDS.map((kw, i) => {
              const kwOpacity = interpolate(
                frame,
                [i * 15, i * 15 + 20],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }
              );
              const kwScale = interpolate(
                frame,
                [i * 15, i * 15 + 20],
                [0.8, 1],
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
                    padding: "12px 28px",
                    borderRadius: 12,
                    border: `1px solid ${kw.color}33`,
                    backgroundColor: `${kw.color}0A`,
                    color: kw.color,
                    fontSize: 20,
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    opacity: kwOpacity,
                    transform: `scale(${kwScale})`,
                  }}
                >
                  {kw.text}
                </div>
              );
            })}
          </div>
        </Sequence>

        {/* Problem statement */}
        <Sequence from={100} durationInFrames={350} premountFor={30}>
          <TextReveal
            text="Traditionally difficult to access, slow to settle, and opaque."
            startFrame={0}
            framesPerWord={5}
            fontSize={28}
            color={COLORS.textSecondary}
          />
        </Sequence>

        {/* Solution statement */}
        <Sequence from={220} durationInFrames={240} premountFor={30}>
          <FadeIn delay={0} duration={30} direction="up">
            <div
              style={{
                fontSize: 42,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              DeepRock makes them{" "}
              <span style={{ color: COLORS.accent }}>composable</span>,{" "}
              <span style={{ color: COLORS.teal }}>instant</span>, and{" "}
              <span style={{ color: COLORS.accent2 }}>transparent</span>.
            </div>
          </FadeIn>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
