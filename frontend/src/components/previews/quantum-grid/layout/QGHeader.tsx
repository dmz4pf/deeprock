"use client";

import React from "react";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

interface QGHeaderProps {
  title?: string;
  subtitle?: string;
}

export function QGHeader({ title = "DEEPROCK", subtitle = "INSTITUTIONAL DASHBOARD" }: QGHeaderProps) {
  const animatedTotal = useAnimatedValue(2500000, 2500);
  const animatedApy = useAnimatedValue(6.4, 2000);

  const metrics = [
    { label: "AUM", value: `$${(animatedTotal / 1e6).toFixed(2)}M`, color: "#fff" },
    { label: "W.APY", value: `${animatedApy.toFixed(1)}%`, color: "var(--qg-primary)" },
    { label: "24H VOL", value: "$142.5K", color: "rgba(255,255,255,0.5)" },
    { label: "ASSETS", value: "4", color: "rgba(255,255,255,0.5)" },
    { label: "HEALTH", value: "92/100", color: "#10B981" },
    { label: "CHAIN", value: "AVAX", color: "#E84142" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px",
      borderBottom: "1px solid var(--qg-panel-border)",
      background: "rgba(var(--qg-primary-rgb),0.01)",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "0.05em" }}>{title}</div>
        <div style={{ fontSize: 9, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ textAlign: "right" }}>
            <div style={{ fontSize: 8, color: "var(--qg-text-muted)", letterSpacing: "0.1em", marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
