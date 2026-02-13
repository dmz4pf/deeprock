export type QGVariation = "cyan" | "violet" | "emerald" | "blue" | "indigo";

export interface QGVariationConfig {
  name: string;
  label: string;
  primary: string;
  primaryRGB: string;
  secondary: string;
  secondaryRGB: string;
  background: string;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
  accentGlow: string;
  animationSpeed: "normal" | "slow" | "fast";
  density: "normal" | "spacious" | "compact";
  specialEffect: "none" | "iridescent" | "scanline";
}

export const variations: Record<QGVariation, QGVariationConfig> = {
  cyan: {
    name: "Quantum Cyan",
    label: "Bloomberg Institutional",
    primary: "#06B6D4",
    primaryRGB: "6,182,212",
    secondary: "#8B5CF6",
    secondaryRGB: "139,92,246",
    background: "#030614",
    panelBg: "rgba(6,182,212,0.02)",
    panelBorder: "rgba(6,182,212,0.06)",
    textMuted: "rgba(6,182,212,0.5)",
    accentGlow: "rgba(6,182,212,0.3)",
    animationSpeed: "normal",
    density: "normal",
    specialEffect: "none",
  },
  violet: {
    name: "Quantum Violet",
    label: "Luxury Premium",
    primary: "#8B5CF6",
    primaryRGB: "139,92,246",
    secondary: "#EC4899",
    secondaryRGB: "236,72,153",
    background: "#050318",
    panelBg: "rgba(139,92,246,0.02)",
    panelBorder: "rgba(139,92,246,0.06)",
    textMuted: "rgba(139,92,246,0.5)",
    accentGlow: "rgba(139,92,246,0.3)",
    animationSpeed: "slow",
    density: "spacious",
    specialEffect: "iridescent",
  },
  emerald: {
    name: "Quantum Emerald",
    label: "Hacker Terminal",
    primary: "#6FCF97",
    primaryRGB: "111,207,151",
    secondary: "#06B6D4",
    secondaryRGB: "6,182,212",
    background: "#010A06",
    panelBg: "rgba(111,207,151,0.02)",
    panelBorder: "rgba(111,207,151,0.06)",
    textMuted: "rgba(111,207,151,0.5)",
    accentGlow: "rgba(111,207,151,0.3)",
    animationSpeed: "fast",
    density: "compact",
    specialEffect: "scanline",
  },
  blue: {
    name: "Quantum Blue",
    label: "Institutional Premium",
    primary: "#E8B4B8",
    primaryRGB: "232,180,184",
    secondary: "#C9A0DC",
    secondaryRGB: "201,160,220",
    background: "#0B0E14",
    panelBg: "#141720",
    panelBorder: "rgba(255,255,255,0.06)",
    textMuted: "#64748B",
    accentGlow: "rgba(232,180,184,0.25)",
    animationSpeed: "normal",
    density: "normal",
    specialEffect: "none",
  },
  indigo: {
    name: "Quantum Indigo",
    label: "Modern Institutional",
    primary: "#C9A0DC",
    primaryRGB: "201,160,220",
    secondary: "#E8B4B8",
    secondaryRGB: "232,180,184",
    background: "#0B0D15",
    panelBg: "#131520",
    panelBorder: "rgba(255,255,255,0.06)",
    textMuted: "#64748B",
    accentGlow: "rgba(201,160,220,0.25)",
    animationSpeed: "normal",
    density: "normal",
    specialEffect: "none",
  },
};

export const variationList = Object.entries(variations).map(([key, config]) => ({
  id: key as QGVariation,
  ...config,
}));
