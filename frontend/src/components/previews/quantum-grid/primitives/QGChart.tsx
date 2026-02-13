"use client";

import React, { useMemo, useCallback } from "react";
import { useMounted } from "../hooks/useMounted";

interface QGChartProps {
  data: { label: string | number; value: number }[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  color?: string;
  gradientId?: string;
}

export function QGChart({
  data,
  width = 420,
  height = 180,
  showGrid = true,
  showDots = true,
  color,
  gradientId = "qg-chart-grad",
}: QGChartProps) {
  const mounted = useMounted();
  const px = 30, py = 20;
  const values = data.map(d => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const count = data.length;

  const toX = useCallback((i: number) => px + (i / (count - 1)) * (width - px * 2), [count, width]);
  const toY = useCallback((v: number) => py + (1 - (v - minV) / range) * (height - py * 2), [minV, range, height]);

  const linePath = useMemo(
    () => data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(" "),
    [data, toX, toY]
  );

  const areaPath = useMemo(
    () => linePath + ` L${toX(count - 1).toFixed(1)},${height - py} L${toX(0).toFixed(1)},${height - py} Z`,
    [linePath, toX, count, height]
  );

  const pathLength = 1200;
  const strokeColor = color || "#E8B4B8";

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
        <filter id={`${gradientId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {showGrid && [0, 0.25, 0.5, 0.75, 1].map(frac => {
        const yy = py + frac * (height - py * 2);
        const val = maxV - frac * range;
        return (
          <g key={frac}>
            <line x1={px} y1={yy} x2={width - px} y2={yy} stroke="rgba(232,180,184,0.06)" strokeWidth="1" />
            <text x={px - 4} y={yy + 3} textAnchor="end" fill="rgba(232,180,184,0.25)" fontSize="8">
              {val >= 1e6 ? `${(val / 1e6).toFixed(2)}M` : val >= 1e3 ? `${(val / 1e3).toFixed(0)}K` : val.toFixed(0)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill={`url(#${gradientId})`} opacity={mounted ? 1 : 0} style={{ transition: "opacity 1s" }} />
      <path
        d={linePath} fill="none" stroke={strokeColor} strokeWidth="3" opacity="0.3"
        filter={`url(#${gradientId}-glow)`}
        strokeDasharray={pathLength} strokeDashoffset={mounted ? 0 : pathLength}
        style={{ transition: "stroke-dashoffset 1.8s ease-out" }}
      />
      <path
        d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray={pathLength} strokeDashoffset={mounted ? 0 : pathLength}
        style={{ transition: "stroke-dashoffset 1.8s ease-out" }}
      />
      {showDots && mounted && data.filter((_, i) => i % 3 === 0 || i === count - 1).map((d, idx) => (
        <circle
          key={idx} cx={toX(data.indexOf(d))} cy={toY(d.value)} r="2" fill={strokeColor}
          opacity="0"
          style={{ animation: `obsidianFadeIn 0.3s ease-out ${2 + idx * 0.1}s forwards` }}
        />
      ))}
    </svg>
  );
}
