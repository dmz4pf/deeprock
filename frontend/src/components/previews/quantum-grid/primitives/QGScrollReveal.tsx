"use client";

import React from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface QGScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  staggerIndex?: number;
  repeat?: boolean;
}

export function QGScrollReveal({
  children, className = "", style, staggerIndex = 0, repeat = true
}: QGScrollRevealProps) {
  const ref = useScrollReveal({ repeat });

  return (
    <div
      ref={ref}
      className={`qg-reveal ${className}`}
      style={{
        transitionDelay: `${staggerIndex * 100}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
