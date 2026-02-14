/** Arctic Silver design tokens — matching the main app */
export const COLORS = {
  bg: "#0A0E1A",
  surface: "#0F1424",
  elevated: "#151B30",
  accent: "#3B82F6",
  accent2: "#6366F1",
  accentHover: "#60A5FA",
  violet: "#7C3AED",
  teal: "#14B8A6",
  textPrimary: "#E2E8F0",
  textSecondary: "#7B8BA8",
  textDim: "#4A5568",
  glass: "rgba(15,20,36,0.65)",
  border: "rgba(59,130,246,0.08)",
  gold: "#D4AF37",
  goldDim: "rgba(212,175,55,0.3)",
  green: "#6FCF97",
  red: "#EB5757",
} as const;

export const GRADIENTS = {
  iridescent: "linear-gradient(135deg, #3B82F6, #6366F1, #818CF8, #3B82F6)",
  surface: "linear-gradient(135deg, #0F1424, #151B30)",
  glow: "radial-gradient(ellipse at center, rgba(59,130,246,0.15), transparent 70%)",
} as const;
