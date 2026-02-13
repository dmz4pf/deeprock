"use client";

import React from "react";

interface FeedItem {
  id: number | string;
  time: string;
  type: string;
  message: string;
  amount: string;
  typeColor?: string;
}

interface QGFeedProps {
  items: FeedItem[];
  maxHeight?: number;
  typeColors?: Record<string, string>;
}

const DEFAULT_TYPE_COLORS: Record<string, string> = {
  YIELD: "#6FCF97",
  TX: "#E8B4B8",
  SYNC: "#E8B4B8",
  ALERT: "#F59E0B",
};

export function QGFeed({ items, maxHeight = 200, typeColors = DEFAULT_TYPE_COLORS }: QGFeedProps) {
  return (
    <div className="flex flex-col gap-px overflow-hidden" style={{ maxHeight }}>
      {items.map((item, i) => {
        const color = item.typeColor || typeColors[item.type] || "#E8B4B8";
        return (
          <div
            key={item.id}
            className={`
              flex items-center gap-2.5 px-2 py-1.5 rounded-md row-hover
              ${i % 2 === 0 ? "bg-[rgba(232,180,184,0.015)]" : "bg-transparent"}
            `}
          >
            <span className="text-xs font-mono text-[rgba(240,235,224,0.2)] min-w-[60px]">
              {item.time}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm min-w-[36px] text-center tracking-[0.05em]"
              style={{ color, background: `${color}15` }}
            >
              {item.type}
            </span>
            <span className="text-xs text-[#B8A99A] flex-1">
              {item.message}
            </span>
            <span
              className="text-xs font-mono font-medium tabular-nums"
              style={{ color: item.type === "YIELD" ? "#6FCF97" : "#B8A99A" }}
            >
              {item.amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
