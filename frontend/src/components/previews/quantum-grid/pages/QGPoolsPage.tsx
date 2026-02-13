"use client";

import React from "react";
import { QGPanel } from "../primitives/QGPanel";
import { QGSparkline } from "../primitives/QGSparkline";
import { QGBadge } from "../primitives/QGBadge";
import { QGScrollReveal } from "../primitives/QGScrollReveal";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

// -- Mock Data ----------------------------------------------------------------

const CATEGORIES = [
  { name: "Treasuries", slug: "treasuries", icon: "\u{1F3DB}", pools: 3, tvl: 4200000, avgApy: 5.2, color: "#06B6D4", trend: [40,42,44,43,46,48,50,52,54,53,55,58,60,62] },
  { name: "Real Estate", slug: "real-estate", icon: "\u{1F3E2}", pools: 2, tvl: 3100000, avgApy: 7.8, color: "#8B5CF6", trend: [30,32,31,35,38,40,42,44,43,45,48,50,52,55] },
  { name: "Private Credit", slug: "credit", icon: "\u{1F4B3}", pools: 4, tvl: 2800000, avgApy: 9.4, color: "#10B981", trend: [25,28,30,32,35,33,36,38,40,42,45,48,50,52] },
  { name: "Commodities", slug: "commodities", icon: "\u{26CF}", pools: 2, tvl: 1500000, avgApy: 3.8, color: "#F59E0B", trend: [50,48,46,45,44,46,48,50,49,48,50,52,51,53] },
  { name: "Infrastructure", slug: "infrastructure", icon: "\u{1F310}", pools: 1, tvl: 800000, avgApy: 6.1, color: "#EC4899", trend: [20,22,24,26,25,28,30,32,34,36,38,40,42,45] },
];

const TOTAL_TVL = CATEGORIES.reduce((s, c) => s + c.tvl, 0);

// -- Main Page ----------------------------------------------------------------

export function QGPoolsPage() {
  const animatedTvl = useAnimatedValue(TOTAL_TVL, 2500);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
      {/* Hero Banner */}
      <QGScrollReveal>
        <QGPanel>
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, margin: "0 auto 16px",
              background: "linear-gradient(135deg, rgba(var(--qg-primary-rgb),0.15), rgba(var(--qg-secondary-rgb),0.15))",
              border: "1px solid rgba(var(--qg-primary-rgb),0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>{"\u25C9"}</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Investment Pools</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
              Institutional-grade access to tokenized real-world assets
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                  ${(animatedTvl / 1e6).toFixed(1)}M
                </div>
                <div style={{ fontSize: 9, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>TOTAL TVL</div>
              </div>
              <div style={{ width: 1, background: "var(--qg-panel-border)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--qg-primary)" }}>12</div>
                <div style={{ fontSize: 9, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>ACTIVE POOLS</div>
              </div>
              <div style={{ width: 1, background: "var(--qg-panel-border)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#10B981" }}>3.8-9.4%</div>
                <div style={{ fontSize: 9, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>APY RANGE</div>
              </div>
            </div>
          </div>
        </QGPanel>
      </QGScrollReveal>

      {/* Category Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--qg-gap)" }}>
        {CATEGORIES.map((cat, i) => (
          <QGScrollReveal key={cat.slug} staggerIndex={i}>
            <QGPanel hover>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${cat.color}15`, border: `1px solid ${cat.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>{cat.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{cat.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{cat.pools} pools</div>
                  </div>
                </div>
                <QGBadge color={cat.color}>{cat.avgApy}% APY</QGBadge>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--qg-text-muted)", letterSpacing: "0.1em", marginBottom: 2 }}>TVL</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                    ${(cat.tvl / 1e6).toFixed(1)}M
                  </div>
                </div>
                <QGSparkline data={cat.trend} color={cat.color} width={80} height={28} />
              </div>

              {/* TVL share bar */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.03)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${(cat.tvl / TOTAL_TVL) * 100}%`,
                  background: cat.color, borderRadius: 2,
                  boxShadow: `0 0 8px ${cat.color}44`,
                }} />
              </div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", textAlign: "right", marginTop: 3 }}>
                {((cat.tvl / TOTAL_TVL) * 100).toFixed(1)}% of total
              </div>
            </QGPanel>
          </QGScrollReveal>
        ))}
      </div>

      {/* Bottom Stat Ticker */}
      <QGScrollReveal staggerIndex={6}>
        <div style={{
          display: "flex", justifyContent: "center", gap: 24,
          padding: "12px 0",
          borderTop: "1px solid var(--qg-panel-border)",
          borderBottom: "1px solid var(--qg-panel-border)",
        }}>
          {[
            { label: "24H VOLUME", value: "$342.5K" },
            { label: "NEW DEPOSITS", value: "$125.0K" },
            { label: "YIELD PAID (7D)", value: "$18.4K" },
            { label: "AVG MATURITY", value: "182 days" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </QGScrollReveal>
    </div>
  );
}
