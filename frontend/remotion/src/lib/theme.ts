/** Obsidian Forge design tokens — matching the app's globals.css */
export const COLORS = {
  bg: "#0E0B10",
  surface: "#15121A",
  elevated: "#1C1822",
  copper: "#E8B4B8",
  copperBright: "#F0C8CC",
  roseGold: "#C9A0DC",
  teal: "#6FCF97",
  bronze: "#5A5347",
  textPrimary: "#F0EBE0",
  textSecondary: "#B8A99A",
  textDim: "#5A5347",
  glass: "rgba(21,18,26,0.65)",
  border: "rgba(232,180,184,0.08)",
  borderHover: "rgba(201,160,220,0.3)",
  green: "#6FCF97",
  red: "#EB5757",
  gold: "#F5E6D3",
} as const;

export const GRADIENTS = {
  iridescent:
    "linear-gradient(135deg, #E8B4B8, #C9A0DC, #6FCF97, #F5E6D3)",
  surface: "linear-gradient(135deg, #15121A, #1C1822)",
  glow: "radial-gradient(ellipse at center, rgba(232,180,184,0.06), transparent 70%)",
} as const;
