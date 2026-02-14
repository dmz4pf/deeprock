"use client";

import React from "react";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

interface QGGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function QGGauge({
  value,
  max = 100,
  size = 160,
  strokeWidth = 10,
  label = "HEALTH",
}: QGGaugeProps) {
  const safeValue = isNaN(value) ? 0 : value;
  const isEmpty = safeValue === 0;
  const animatedScore = useAnimatedValue(safeValue, 2000);
  const cx = size / 2, cy = size / 2, r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = animatedScore / max;

  const gaugeColor = ratio > 0.8 ? "#E8B4B8" : ratio > 0.6 ? "#6FCF97" : ratio > 0.4 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="qg-gauge-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#6FCF97" />
          <stop offset="100%" stopColor="#E8B4B8" />
        </linearGradient>
        <filter id="qg-gauge-glow"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {/* Background ring — pulses when empty */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(232,180,184,0.06)" strokeWidth={strokeWidth}
        style={isEmpty ? { animation: "vaultBreathe 2s ease-in-out infinite" } : undefined}
      />
      {!isEmpty && (
        <>
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={gaugeColor} strokeWidth={strokeWidth + 4}
            strokeDasharray={`${circumference * ratio} ${circumference * (1 - ratio)}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
            filter="url(#qg-gauge-glow)" opacity="0.25"
          />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="url(#qg-gauge-grad)" strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * ratio} ${circumference * (1 - ratio)}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 2s ease-out" }}
          />
        </>
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" fill={isEmpty ? "#5A5347" : "#F0EBE0"} fontSize="28" fontWeight="700">
        {isEmpty ? "--" : Math.round(animatedScore)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#5A5347" fontSize="8" letterSpacing="0.2em">
        {label}
      </text>
    </svg>
  );
}
