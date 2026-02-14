"use client";

import { useEffect, useState, useRef } from "react";

interface UseAnimatedValueOptions {
  duration?: number;
  delay?: number;
  easing?: "quartic" | "spring";
}

/**
 * Animates a number from its previous value to a new target.
 * Supports spring and quartic easing, optional delay, and
 * respects prefers-reduced-motion (snaps instantly).
 */
export function useAnimatedValue(
  target: number,
  durationOrOptions?: number | UseAnimatedValueOptions
) {
  const opts: UseAnimatedValueOptions =
    typeof durationOrOptions === "number"
      ? { duration: durationOrOptions }
      : durationOrOptions ?? {};

  const { duration = 2000, delay = 0, easing = "spring" } = opts;

  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mq?.matches) {
      setValue(target);
      return;
    }

    const from = prevTarget.current;
    prevTarget.current = target;
    const delta = target - from;

    if (delta === 0) return;

    const timeoutId = setTimeout(() => {
      const startTime = performance.now();

      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        let eased: number;

        if (easing === "spring") {
          // Critically-damped spring approximation
          eased = 1 - (1 + 8 * t) * Math.exp(-8 * t);
          // Clamp to prevent overshoot at very end
          if (t > 0.99) eased = 1;
        } else {
          // Quartic ease-out
          eased = 1 - Math.pow(1 - t, 4);
        }

        setValue(from + delta * eased);
        if (t < 1) rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay, easing]);

  return value;
}
