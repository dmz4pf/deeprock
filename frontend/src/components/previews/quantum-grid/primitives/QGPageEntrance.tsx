"use client";

import React from "react";

interface QGPageEntranceProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  staggerIndex?: number;
}

export function QGPageEntrance({
  children, className = "", style, staggerIndex = 0
}: QGPageEntranceProps) {
  return (
    <div
      className={`qg-page-enter ${className}`}
      style={{ "--stagger-index": staggerIndex, ...style } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
