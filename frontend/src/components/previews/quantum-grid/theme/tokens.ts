import { QGVariationConfig } from "./variations";

export function getThemeCSS(config: QGVariationConfig): Record<string, string> {
  const speedMultiplier = config.animationSpeed === "slow" ? 1.5 : config.animationSpeed === "fast" ? 0.6 : 1;
  const spacing = config.density === "spacious" ? 1.25 : config.density === "compact" ? 0.8 : 1;

  return {
    "--qg-primary": config.primary,
    "--qg-primary-rgb": config.primaryRGB,
    "--qg-secondary": config.secondary,
    "--qg-secondary-rgb": config.secondaryRGB,
    "--qg-bg": config.background,
    "--qg-panel-bg": config.panelBg,
    "--qg-panel-border": config.panelBorder,
    "--qg-text-muted": config.textMuted,
    "--qg-accent-glow": config.accentGlow,
    "--qg-speed": `${speedMultiplier}`,
    "--qg-spacing": `${spacing}`,
    "--qg-gap": `${Math.round(12 * spacing)}px`,
    "--qg-panel-padding": `${Math.round(16 * spacing)}px`,
    "--qg-panel-radius": "12px",
    "--qg-anim-duration": `${Math.round(300 * speedMultiplier)}ms`,
    "--qg-stagger-delay": `${Math.round(80 * speedMultiplier)}ms`,
  };
}
