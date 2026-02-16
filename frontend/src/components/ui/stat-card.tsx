import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   OBSIDIAN FORGE STAT CARD COMPONENT
   Statistics display with warm forge glow and iridescent accents
   ═══════════════════════════════════════════════════════════════════════════ */

type GlowColor = "blue" | "cyan" | "purple" | "green" | "orange";

const glowConfig: Record<GlowColor, { rgb: string; text: string }> = {
  blue: { rgb: "205,127,50", text: "#E8B4B8" },
  cyan: { rgb: "183,110,121", text: "#C4A265" },
  purple: { rgb: "232,180,184", text: "#6FCF97" },
  green: { rgb: "20,184,166", text: "#6FCF97" },
  orange: { rgb: "139,105,20", text: "#5A5347" },
};

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  glowColor?: GlowColor;
  /** Glass variant */
  variant?: "default" | "elevated" | "tinted" | "frosted";
  /** Show iridescent top edge */
  iridescent?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      change,
      changeType = "neutral",
      icon: Icon,
      glowColor = "blue",
      variant = "default",
      iridescent = false,
      style,
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = React.useState(false);
    const config = glowConfig[glowColor];

    const changeColors = {
      positive: "#6FCF97",
      negative: "#EB5757",
      neutral: "#5A5347",
    };

    // Variant-specific glass classes
    const variantClasses = {
      default: "glass",
      elevated: "glass-elevated",
      tinted: `glass-tint-${glowColor}`,
      frosted: "glass-frosted glass-noise",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl p-6 transition-all duration-300",
          variantClasses[variant],
          iridescent && "glass-iridescent",
          className
        )}
        style={{
          backgroundColor: "#15121A",
          border: `1px solid ${hovered ? `rgba(${config.rgb},0.2)` : "rgba(232,180,184,0.08)"}`,
          boxShadow: hovered
            ? `0 0 35px rgba(${config.rgb},0.15), 0 16px 40px rgba(0,0,0,0.3)`
            : undefined,
          transform: hovered ? "translateY(-2px)" : undefined,
          ...style,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        {...props}
      >
        {/* Iridescent top edge */}
        <div
          className="absolute top-0 left-[5%] right-[5%] h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, #E8B4B8, #C4A265, #6FCF97, #6FCF97, #E8B4B8)",
            backgroundSize: "300% 100%",
            animation: "forgeGradientShift 10s linear infinite",
          }}
        />

        {/* Corner glow orb */}
        <div
          className={cn(
            "absolute -top-10 -right-10 h-32 w-32 rounded-full transition-opacity duration-500",
            hovered ? "opacity-50" : "opacity-25"
          )}
          style={{
            background: `radial-gradient(circle, rgba(${config.rgb},0.4) 0%, rgba(${config.rgb},0.12) 40%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />

        {/* Inner glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            boxShadow: `inset 0 1px 0 rgba(232,180,184,0.04), inset 0 0 20px rgba(${config.rgb},${hovered ? 0.06 : 0.03})`,
          }}
        />

        <div className="relative">
          {/* Header with icon */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: "#5A5347" }}>
              {title}
            </span>
            {Icon && (
              <div
                className="p-2 rounded-lg transition-all duration-300"
                style={{
                  backgroundColor: `rgba(${config.rgb},${hovered ? 0.15 : 0.1})`,
                  color: config.text,
                  boxShadow: hovered ? `0 0 15px rgba(${config.rgb},0.2)` : undefined,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Value with iridescent gradient text */}
          <div className="mb-2">
            <span
              className="text-2xl font-bold forge-iridescent-text transition-all duration-300"
            >
              {value}
            </span>
          </div>

          {/* Change indicator */}
          {change && (
            <div className="flex items-center gap-1">
              <span
                className="text-sm font-medium"
                style={{ color: changeColors[changeType] }}
              >
                {changeType === "positive" && "+"}
                {change}
              </span>
              <span className="text-xs" style={{ color: "#5A5347" }}>
                vs last period
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

/* ═══════════════════════════════════════════════════════════════════════════
   COMPACT STAT - Smaller inline stat display
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CompactStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  glowColor?: GlowColor;
}

const CompactStat = React.forwardRef<HTMLDivElement, CompactStatProps>(
  ({ className, label, value, glowColor = "blue", ...props }, ref) => {
    const config = glowConfig[glowColor];

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1", className)}
        {...props}
      >
        <span className="text-xs" style={{ color: "#5A5347" }}>{label}</span>
        <span
          className="text-lg font-semibold"
          style={{
            color: config.text,
            textShadow: `0 0 15px rgba(${config.rgb},0.4)`,
          }}
        >
          {value}
        </span>
      </div>
    );
  }
);
CompactStat.displayName = "CompactStat";

export { StatCard, CompactStat };
