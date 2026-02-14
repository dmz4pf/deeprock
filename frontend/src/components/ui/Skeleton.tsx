"use client";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const ROUND_MAP = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-[14px]",
  full: "rounded-full",
} as const;

/**
 * Shimmer-animated skeleton placeholder.
 * Uses the `.skeleton` class from globals.css for the gradient animation.
 */
export function Skeleton({
  className = "",
  width,
  height,
  rounded = "md",
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${ROUND_MAP[rounded]} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}
