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
  { text: "Treasury Bills", color: COLORS.copper },
  { text: "Real Estate", color: COLORS.roseGold },
  { text: "Private Credit", color: COLORS.teal },
  { text: "Corporate Bonds", color: COLORS.gold },
  { text: "Commodities", color: COLORS.copperBright },
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
            "radial-gradient(ellipse at center, rgba(201,160,220,0.05), transparent 70%)",
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
          gap: 48,
        }}
      >
        {/* Keywords */}
        <Sequence from={0} durationInFrames={200} layout="none" premountFor={10}>
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
                [i * 10, i * 10 + 18],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const kwScale = interpolate(
                frame,
                [i * 10, i * 10 + 18],
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
                    padding: "16px 36px",
                    borderRadius: 14,
                    border: `1px solid ${kw.color}33`,
                    backgroundColor: `${kw.color}0A`,
                    color: kw.color,
                    fontSize: 28,
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
        <Sequence from={60} durationInFrames={140} layout="none" premountFor={15}>
          <TextReveal
            text="Traditionally difficult to access, slow to settle, and opaque."
            startFrame={0}
            framesPerWord={4}
            fontSize={38}
            color={COLORS.textSecondary}
          />
        </Sequence>

        {/* Solution statement */}
        <Sequence from={110} durationInFrames={100} layout="none" premountFor={15}>
          <FadeIn delay={0} duration={22} direction="up">
            <div
              style={{
                fontSize: 56,
                fontFamily: FONT_SERIF,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              DeepRock makes them{" "}
              <span style={{ color: COLORS.copper }}>composable</span>,{" "}
              <span style={{ color: COLORS.teal }}>instant</span>, and{" "}
              <span style={{ color: COLORS.roseGold }}>transparent</span>.
            </div>
          </FadeIn>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
