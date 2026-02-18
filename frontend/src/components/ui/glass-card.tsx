import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   OBSIDIAN FORGE GLASS CARD COMPONENT
   Warm glassmorphism with iridescent edges and forge glow system
   ═══════════════════════════════════════════════════════════════════════════ */

type GlowColor = "blue" | "cyan" | "purple" | "green" | "orange" | "none";

const glowColorConfig: Record<GlowColor, { rgb: string; border: string; shadow: string }> = {
  blue: {
    rgb: "205,127,50",
    border: "rgba(232,180,184,0.25)",
    shadow: "0 0 35px rgba(232,180,184,0.18)",
  },
  cyan: {
    rgb: "183,110,121",
    border: "rgba(196,162,101,0.25)",
    shadow: "0 0 35px rgba(196,162,101,0.18)",
  },
  purple: {
    rgb: "232,180,184",
    border: "rgba(111,207,151,0.25)",
    shadow: "0 0 35px rgba(111,207,151,0.18)",
  },
  green: {
    rgb: "20,184,166",
    border: "rgba(111,207,151,0.25)",
    shadow: "0 0 35px rgba(111,207,151,0.18)",
  },
  orange: {
    rgb: "139,105,20",
    border: "rgba(139,105,20,0.25)",
    shadow: "0 0 35px rgba(139,105,20,0.18)",
  },
  none: {
    rgb: "237,229,216",
    border: "rgba(232,180,184,0.12)",
    shadow: "0 16px 40px rgba(0,0,0,0.35)",
  },
};

const glassCardVariants = cva(
  "relative overflow-hidden rounded-xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "glass",
        light: "glass-light",
        heavy: "glass-heavy",
        frosted: "glass-frosted",
        noise: "glass-noise",
        elevated: "glass-elevated",
        elevatedHigh: "glass-elevated-high",
        tintBlue: "glass-tint-blue",
        tintPurple: "glass-tint-purple",
        tintCyan: "glass-tint-cyan",
        tintGreen: "glass-tint-green",
      },
      edge: {
        none: "",
        frost: "glass-frost",
        frostGlow: "glass-frost-glow",
        iridescent: "glass-iridescent",
      },
      interactive: {
        true: "glass-interactive cursor-pointer",
        false: "",
      },
      innerGlow: {
        none: "",
        subtle: "glass-inner-glow",
        blue: "glass-inner-glow-blue",
        purple: "glass-inner-glow-purple",
      },
    },
    defaultVariants: {
      variant: "default",
      edge: "frost",
      interactive: false,
      innerGlow: "none",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  glowColor?: GlowColor;
  noPadding?: boolean;
  /** Show corner glow orb */
  cornerOrb?: boolean;
  /** Orb position */
  orbPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant,
      edge,
      interactive,
      innerGlow,
      glowColor = "blue",
      noPadding = false,
      cornerOrb = false,
      orbPosition = "top-right",
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = React.useState(false);
    const config = glowColorConfig[glowColor];

    const orbPositionClasses = {
      "top-right": "-top-12 -right-12",
      "top-left": "-top-12 -left-12",
      "bottom-right": "-bottom-12 -right-12",
      "bottom-left": "-bottom-12 -left-12",
    };

    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, edge, interactive, innerGlow }),
          !noPadding && "p-6",
          className
        )}
        style={{
          borderColor: hovered ? config.border : undefined,
          boxShadow: hovered && interactive ? config.shadow : undefined,
          ...style,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        {...props}
      >
        {/* Corner glow orb */}
        {cornerOrb && (
          <div
            className={cn(
              "absolute h-28 w-28 rounded-full transition-opacity duration-500 pointer-events-none",
              orbPositionClasses[orbPosition],
              hovered ? "opacity-60" : "opacity-30"
            )}
            style={{
              background: `radial-gradient(circle, rgba(${config.rgb},0.4) 0%, rgba(${config.rgb},0.15) 40%, transparent 70%)`,
              filter: "blur(20px)",
            }}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

/* ═══════════════════════════════════════════════════════════════════════════
   GLASS PANEL - For larger containers like sidebars, modals, sections
   ═══════════════════════════════════════════════════════════════════════════ */

const glassPanelVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: "glass-panel",
        modal: "glass-modal",
        sidebar: "glass-heavy",
      },
      rounded: {
        none: "",
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
        full: "rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "md",
    },
  }
);

export interface GlassPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassPanelVariants> {}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant, rounded, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassPanelVariants({ variant, rounded }), className)}
        {...props}
      >
        {/* Iridescent top edge highlight */}
        <div
          className="absolute top-0 left-[5%] right-[5%] h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, #E8B4B8, #C4A265, #6FCF97, #6FCF97, #E8B4B8)",
            backgroundSize: "300% 100%",
            animation: "forgeGradientShift 10s linear infinite",
          }}
        />
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

/* ═══════════════════════════════════════════════════════════════════════════
   GLASS BUTTON - Transparent glass-style button
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: GlowColor;
  size?: "sm" | "md" | "lg";
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, glowColor = "blue", size = "md", children, ...props }, ref) => {
    const config = glowColorConfig[glowColor];

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "glass-button rounded-lg font-medium text-[#F0EBE0]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-bg",
          "disabled:opacity-50 disabled:pointer-events-none",
          sizeClasses[size],
          className
        )}
        style={{
          ["--tw-ring-color" as string]: `rgba(${config.rgb},0.5)`,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";

/* ═══════════════════════════════════════════════════════════════════════════
   GLASS BADGE - Small label with glass effect
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  glowColor?: GlowColor;
  withDot?: boolean;
  dotPulse?: boolean;
}

const GlassBadge = React.forwardRef<HTMLSpanElement, GlassBadgeProps>(
  (
    {
      className,
      glowColor = "blue",
      withDot = false,
      dotPulse = false,
      children,
      ...props
    },
    ref
  ) => {
    const config = glowColorConfig[glowColor];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          "backdrop-blur-md transition-all duration-300",
          className
        )}
        style={{
          background: `linear-gradient(135deg, rgba(${config.rgb},0.15), rgba(${config.rgb},0.05))`,
          border: `1px solid rgba(${config.rgb},0.2)`,
          color: `rgb(${config.rgb})`,
          boxShadow: `0 0 15px rgba(${config.rgb},0.15)`,
        }}
        {...props}
      >
        {withDot && (
          <span className="relative flex h-2 w-2">
            {dotPulse && (
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: `rgb(${config.rgb})` }}
              />
            )}
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: `rgb(${config.rgb})` }}
            />
          </span>
        )}
        {children}
      </span>
    );
  }
);
GlassBadge.displayName = "GlassBadge";

/* ═══════════════════════════════════════════════════════════════════════════
   GLASS INPUT - Text input with glass styling
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  glowColor?: GlowColor;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, glowColor = "blue", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg px-4 py-2.5 text-sm placeholder:text-[#5A5347]",
          "border backdrop-blur-xl",
          "transition-all duration-300",
          "focus:outline-none",
          className
        )}
        style={{
          backgroundColor: "#1B1915",
          color: "#F0EBE0",
          borderColor: "rgba(232,180,184,0.08)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(232,180,184,0.3)";
          e.currentTarget.style.boxShadow =
            "inset 0 1px 2px rgba(0,0,0,0.2), 0 0 15px rgba(232,180,184,0.12)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(232,180,184,0.08)";
          e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.2)";
          props.onBlur?.(e);
        }}
        {...props}
      />
    );
  }
);
GlassInput.displayName = "GlassInput";

/* ═══════════════════════════════════════════════════════════════════════════
   GLASS DIVIDER - Subtle separator with glass aesthetic
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GlassDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  withGlow?: boolean;
}

const GlassDivider = React.forwardRef<HTMLDivElement, GlassDividerProps>(
  ({ className, orientation = "horizontal", withGlow = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          orientation === "horizontal" ? "w-full h-px" : "h-full w-px",
          className
        )}
        style={{
          background: withGlow
            ? "linear-gradient(90deg, transparent, rgba(232,180,184,0.2), rgba(196,162,101,0.12), rgba(232,180,184,0.2), transparent)"
            : "linear-gradient(90deg, transparent, rgba(232,180,184,0.08), transparent)",
        }}
        {...props}
      />
    );
  }
);
GlassDivider.displayName = "GlassDivider";

/* ═══════════════════════════════════════════════════════════════════════════
   GLASS SKELETON - Loading placeholder with shimmer
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GlassSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width (e.g., "100%", "200px") */
  width?: string;
  /** Height (e.g., "20px", "1rem") */
  height?: string;
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

const GlassSkeleton = React.forwardRef<HTMLDivElement, GlassSkeletonProps>(
  ({ className, width = "100%", height = "20px", rounded = "md", ...props }, ref) => {
    const roundedClasses = {
      none: "",
      sm: "rounded",
      md: "rounded-lg",
      lg: "rounded-xl",
      full: "rounded-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "forge-shimmer",
          roundedClasses[rounded],
          className
        )}
        style={{
          width,
          height,
          backgroundColor: "rgba(232,180,184,0.04)",
        }}
        {...props}
      />
    );
  }
);
GlassSkeleton.displayName = "GlassSkeleton";

export {
  GlassCard,
  GlassPanel,
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassDivider,
  GlassSkeleton,
  glassCardVariants,
  glassPanelVariants,
};
