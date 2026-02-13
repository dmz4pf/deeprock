"use client";

import React, { useMemo } from "react";

interface QGSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export function QGSparkline({
  data,
  width = 100,
  height = 32,
  color = "#E8B4B8",
  strokeWidth = 1.5,
}: QGSparklineProps) {
  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const rangeV = maxV - minV || 1;

  const path = useMemo(
    () => data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - minV) / rangeV) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" "),
    [data, width, height, minV, rangeV]
  );

  return (
    <svg width={width} height={height}>
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
