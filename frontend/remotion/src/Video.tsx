import { AbsoluteFill } from "remotion";
import { FONT_SERIF, FONT_SANS } from "./lib/fonts";
import { COLORS } from "./lib/theme";

export const DeepRockDemo = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          color: COLORS.textPrimary,
          fontSize: 64,
          fontFamily: FONT_SERIF,
          fontWeight: 700,
        }}
      >
        DeepRock
      </div>
      <div
        style={{
          color: COLORS.textSecondary,
          fontSize: 24,
          fontFamily: FONT_SANS,
          fontWeight: 300,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Tokenized Real-World Assets on Avalanche
      </div>
    </AbsoluteFill>
  );
};
