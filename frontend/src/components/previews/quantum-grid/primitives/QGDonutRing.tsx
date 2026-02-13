"use client";

import React, { useMemo } from "react";
import { useMounted } from "../hooks/useMounted";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface QGDonutRingProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function QGDonutRing({
  segments,
  size = 180,
  strokeWidth = 28,
  centerLabel,
  centerValue,
}: QGDonutRingProps) {
  const mounted = useMounted();
  const cx = size / 2, cy = size / 2, r = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcs = useMemo(() => {
    let offset = 0;
    return segments.map(seg => {
      const length = (seg.value / total) * circumference;
      const arc = { ...seg, offset, length };
      offset += length;
      return arc;
    });
  }, [segments, total, circumference]);

  return (
    <div className="fb-donut flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(232,180,184,0.04)" strokeWidth={strokeWidth} />
        {arcs.map((arc, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={strokeWidth - 4}
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={mounted ? -arc.offset : circumference}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: `stroke-dashoffset 1.5s ease-out ${i * 0.15}s` }}
            opacity={0.85}
          />
        ))}
        {centerValue && (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fill="#F0EBE0" fontSize="18" fontWeight="600">{centerValue}</text>
            {centerLabel && (
              <text x={cx} y={cy + 10} textAnchor="middle" fill="#5A5347" fontSize="8" letterSpacing="0.15em">{centerLabel}</text>
            )}
          </>
        )}
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}66` }}
            />
            <span className="text-[10px] text-[#B8A99A]">
              {seg.label} <span className="text-[#5A5347]">{Math.round(seg.value / total * 100)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
