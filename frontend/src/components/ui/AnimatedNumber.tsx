"use client";

import { useAnimatedValue } from "@/components/previews/quantum-grid/hooks/useAnimatedValue";

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
  delay?: number;
}

/**
 * Drop-in animated number display. Formats the value during animation
 * so numbers stay readable throughout the transition.
 *
 * Uses spring easing by default, tabular-nums for no width jitter.
 */
export function AnimatedNumber({
  value,
  format,
  prefix,
  suffix,
  className = "",
  duration = 2000,
  delay = 0,
}: AnimatedNumberProps) {
  const animated = useAnimatedValue(value, { duration, delay, easing: "spring" });

  const displayed = format ? format(animated) : animated.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`tabular-nums ${className}`} style={{ willChange: "contents" }}>
      {prefix}
      {displayed}
      {suffix}
    </span>
  );
}
