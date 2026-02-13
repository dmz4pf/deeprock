"use client";

import React from "react";
import { useMounted } from "../hooks/useMounted";

interface QGProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
  delay?: number;
}

export function QGProgressBar({
  value,
  max = 100,
  color = "#E8B4B8",
  height = 6,
  label,
  showValue = true,
  delay = 0.3,
}: QGProgressBarProps) {
  const mounted = useMounted();
  const pct = (value / max) * 100;

  return (
    <div>
      {(label || showValue) && (
        <div className="flex justify-between mb-0.5">
          {label && <span className="text-xs text-[#B8A99A]">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold tabular-nums" style={{ color }}>
              {typeof value === "number" && value % 1 !== 0 ? `${value.toFixed(1)}%` : `${value}%`}
            </span>
          )}
        </div>
      )}
      <div
        className="bg-[rgba(255,255,255,0.03)] overflow-hidden"
        style={{ height, borderRadius: height / 2 }}
      >
        <div
          style={{
            height: "100%",
            width: mounted ? `${pct}%` : "0%",
            background: `linear-gradient(90deg, ${color}CC, ${color})`,
            borderRadius: height / 2,
            transition: `width 1.2s ease-out ${delay}s`,
            boxShadow: `0 0 10px ${color}44`,
          }}
        />
      </div>
    </div>
  );
}
