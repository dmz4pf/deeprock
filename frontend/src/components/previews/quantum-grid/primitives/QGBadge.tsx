"use client";

import React from "react";

interface QGBadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: "default" | "outline" | "dot";
  pulse?: boolean;
}

export function QGBadge({ children, color = "#E8B4B8", variant = "default", pulse }: QGBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.05em] rounded-md
        ${variant === "outline" ? "px-2 py-0.5 bg-transparent" : "px-2.5 py-1"}
      `}
      style={{
        color,
        background: variant === "outline" ? "transparent" : `${color}15`,
        border: variant === "outline" ? `1px solid ${color}40` : "none",
      }}
    >
      {variant === "dot" && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            boxShadow: pulse ? `0 0 8px ${color}` : undefined,
            animation: pulse ? "qg-pulse-glow 2s ease-in-out infinite" : undefined,
          }}
        />
      )}
      {children}
    </span>
  );
}
