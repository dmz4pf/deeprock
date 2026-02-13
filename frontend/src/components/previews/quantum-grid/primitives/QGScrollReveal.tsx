"use client";

import React from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

type RevealDirection = "up" | "left" | "right" | "scale";

const DIRECTION_CLASS: Record<RevealDirection, string> = {
  up: "qg-reveal",
  left: "qg-reveal-left",
  right: "qg-reveal-right",
  scale: "qg-reveal-scale",
};

interface QGScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  staggerIndex?: number;
  repeat?: boolean;
  direction?: RevealDirection;
}

export function QGScrollReveal({
  children, className = "", style, staggerIndex = 0, repeat = true, direction = "up"
}: QGScrollRevealProps) {
  const ref = useScrollReveal({ repeat });

  return (
    <div
      ref={ref}
      className={`${DIRECTION_CLASS[direction]} ${className}`}
      style={{
        transitionDelay: `${staggerIndex * 100}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
