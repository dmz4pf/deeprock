"use client";

import React from "react";

interface PageEntranceProps {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
}

/**
 * Wraps direct children with staggered page-entrance animations on mount.
 * Each child fades up with an incremental delay for a WhaleVault-style effect.
 */
export function PageEntrance({ children, className = "", staggerMs = 100 }: PageEntranceProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        return (
          <div
            className="page-enter-up"
            style={{ animationDelay: `${i * staggerMs}ms` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
