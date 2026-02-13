"use client";

import React from "react";
import { QGPanel } from "../primitives/QGPanel";
import { QGSparkline } from "../primitives/QGSparkline";
import { QGBadge } from "../primitives/QGBadge";
import { QGProgressBar } from "../primitives/QGProgressBar";
import { QGScrollReveal } from "../primitives/QGScrollReveal";
import { QGButton } from "../primitives/QGButton";

// -- Mock Data ----------------------------------------------------------------

const CATEGORY = {
  name: "Treasuries",
  description: "US Government-backed fixed income instruments tokenized on Avalanche",
  icon: "\u{1F3DB}",
  color: "#06B6D4",
  totalTvl: 4200000,
  avgApy: 5.2,
  poolCount: 3,
};

const POOLS = [
  {
    name: "US Treasury Bills Fund",
    ticker: "USTB",
    tvl: 2100000,
    apy: 5.4,
    maturity: "90 days",
    risk: "Low",
    riskColor: "#10B981",
    utilization: 78,
    trend: [40,42,44,43,46,48,50,52,54,53,55,58,60,62],
    minInvestment: "$1,000",
    investors: 234,
  },
  {
    name: "Treasury Notes 2-Year",
    ticker: "T2YR",
    tvl: 1400000,
    apy: 5.1,
    maturity: "2 years",
    risk: "Low",
    riskColor: "#10B981",
    utilization: 65,
    trend: [30,32,34,33,35,37,38,40,42,41,43,45,47,48],
    minInvestment: "$5,000",
    investors: 156,
  },
  {
    name: "Treasury Inflation Protected",
    ticker: "TIPS",
    tvl: 700000,
    apy: 4.8,
    maturity: "5 years",
    risk: "Medium",
    riskColor: "#F59E0B",
    utilization: 42,
    trend: [20,22,21,23,25,24,26,28,30,29,31,33,35,34],
    minInvestment: "$10,000",
    investors: 89,
  },
];

// -- Main Page ----------------------------------------------------------------

export function QGCategoryPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
      {/* Category Header */}
      <QGScrollReveal>
        <QGPanel>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${CATEGORY.color}15`, border: `1px solid ${CATEGORY.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>{CATEGORY.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>{CATEGORY.name}</h2>
                <QGBadge color={CATEGORY.color}>{CATEGORY.avgApy}% AVG APY</QGBadge>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
                {CATEGORY.description}
              </p>
            </div>
            <div style={{ display: "flex", gap: 20, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>${(CATEGORY.totalTvl / 1e6).toFixed(1)}M</div>
                <div style={{ fontSize: 8, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>TOTAL TVL</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--qg-primary)" }}>{CATEGORY.poolCount}</div>
                <div style={{ fontSize: 8, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>POOLS</div>
              </div>
            </div>
          </div>
        </QGPanel>
      </QGScrollReveal>

      {/* Pool Cards (3-column grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--qg-gap)" }}>
        {POOLS.map((pool, i) => (
          <QGScrollReveal key={pool.ticker} staggerIndex={i}>
            <QGPanel hover style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{pool.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{pool.ticker}</div>
                </div>
                <QGBadge color={CATEGORY.color}>{pool.apy}% APY</QGBadge>
              </div>

              {/* TVL + Sparkline */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>TVL</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                    ${(pool.tvl / 1e6).toFixed(1)}M
                  </div>
                </div>
                <QGSparkline data={pool.trend} color={CATEGORY.color} width={80} height={28} />
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--qg-text-muted)" }}>Maturity</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{pool.maturity}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--qg-text-muted)" }}>Risk</div>
                  <div style={{ fontSize: 11, color: pool.riskColor, fontWeight: 500 }}>{pool.risk}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--qg-text-muted)" }}>Min Investment</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{pool.minInvestment}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--qg-text-muted)" }}>Investors</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{pool.investors}</div>
                </div>
              </div>

              {/* Utilization bar */}
              <QGProgressBar
                label="Utilization"
                value={pool.utilization}
                color={CATEGORY.color}
                height={4}
              />

              {/* CTA */}
              <QGButton variant="secondary" fullWidth>{"View Pool \u2192"}</QGButton>
            </QGPanel>
          </QGScrollReveal>
        ))}
      </div>
    </div>
  );
}
