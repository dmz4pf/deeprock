import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glowBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300",
  {
    variants: {
      variant: {
        default: [
          "bg-[rgba(232,180,184,0.1)] text-[#E8B4B8] border border-[rgba(232,180,184,0.2)]",
          "shadow-[0_0_10px_rgba(232,180,184,0.2)]",
          "hover:shadow-[0_0_15px_rgba(232,180,184,0.3)]",
        ],
        success: [
          "bg-[rgba(111,207,151,0.1)] text-[#6FCF97] border border-[rgba(111,207,151,0.2)]",
          "shadow-[0_0_10px_rgba(111,207,151,0.2)]",
          "hover:shadow-[0_0_15px_rgba(111,207,151,0.3)]",
        ],
        warning: [
          "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]",
          "shadow-[0_0_10px_rgba(245,158,11,0.2)]",
          "hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]",
        ],
        danger: [
          "bg-[rgba(235,87,87,0.1)] text-[#EB5757] border border-[rgba(235,87,87,0.2)]",
          "shadow-[0_0_10px_rgba(235,87,87,0.2)]",
          "hover:shadow-[0_0_15px_rgba(235,87,87,0.3)]",
        ],
        cyan: [
          "bg-[rgba(196,162,101,0.1)] text-[#C4A265] border border-[rgba(196,162,101,0.2)]",
          "shadow-[0_0_10px_rgba(196,162,101,0.2)]",
          "hover:shadow-[0_0_15px_rgba(196,162,101,0.3)]",
        ],
        purple: [
          "bg-[rgba(111,207,151,0.1)] text-[#6FCF97] border border-[rgba(111,207,151,0.2)]",
          "shadow-[0_0_10px_rgba(111,207,151,0.2)]",
          "hover:shadow-[0_0_15px_rgba(111,207,151,0.3)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface GlowBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof glowBadgeVariants> {
  withDot?: boolean;
  dotPulse?: boolean;
}

const GlowBadge = React.forwardRef<HTMLSpanElement, GlowBadgeProps>(
  ({ className, variant, withDot = false, dotPulse = false, children, ...props }, ref) => {
    const dotColors: Record<string, string> = {
      default: "bg-[#E8B4B8]",
      success: "bg-[#6FCF97]",
      warning: "bg-[#F59E0B]",
      danger: "bg-[#EB5757]",
      cyan: "bg-[#C4A265]",
      purple: "bg-[#6FCF97]",
    };

    return (
      <span
        ref={ref}
        className={cn(glowBadgeVariants({ variant }), className)}
        {...props}
      >
        {withDot && (
          <span className="relative flex h-2 w-2">
            {dotPulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  dotColors[variant || "default"]
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                dotColors[variant || "default"]
              )}
            />
          </span>
        )}
        {children}
      </span>
    );
  }
);
GlowBadge.displayName = "GlowBadge";

export { GlowBadge, glowBadgeVariants };
