"use client";

import React, { useMemo } from "react";
import { QGPanel } from "../primitives/QGPanel";
import { QGChart } from "../primitives/QGChart";
import { QGDonutRing } from "../primitives/QGDonutRing";
import { QGSparkline } from "../primitives/QGSparkline";
import { QGGauge } from "../primitives/QGGauge";
import { QGFeed } from "../primitives/QGFeed";
import { QGProgressBar } from "../primitives/QGProgressBar";
import { QGScrollReveal } from "../primitives/QGScrollReveal";
import { useAnimatedValue } from "../hooks/useAnimatedValue";
import { useMounted } from "../hooks/useMounted";

// -- Seeded PRNG (deterministic across server/client) -------------------------
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// -- Mock Data ----------------------------------------------------------------

const ASSETS = [
  { name: "Treasuries", ticker: "USTF", value: 875000, apy: 5.2, allocation: 35, color: "#06B6D4" },
  { name: "Real Estate", ticker: "REPR", value: 650000, apy: 7.8, allocation: 26, color: "#8B5CF6" },
  { name: "Credit", ticker: "PCPL", value: 600000, apy: 9.4, allocation: 24, color: "#10B981" },
  { name: "Commodities", ticker: "CMDX", value: 375000, apy: 3.8, allocation: 15, color: "#F59E0B" },
];

const FEED_EVENTS = [
  { id: 1, time: "14:32:08", type: "YIELD", message: "Treasuries yield distributed", amount: "+$1,247" },
  { id: 2, time: "14:31:55", type: "TX", message: "Credit pool rebalance executed", amount: "$45,000" },
  { id: 3, time: "14:31:42", type: "SYNC", message: "NAV oracle price update", amount: "$2.50M" },
  { id: 4, time: "14:31:30", type: "ALERT", message: "Volatility threshold normal", amount: "0.8%" },
  { id: 5, time: "14:31:18", type: "YIELD", message: "Real Estate rent accrual", amount: "+$892" },
  { id: 6, time: "14:31:05", type: "TX", message: "New deposit processed", amount: "$25,000" },
  { id: 7, time: "14:30:52", type: "SYNC", message: "Blockchain state synchronized", amount: "Block #4,291" },
  { id: 8, time: "14:30:40", type: "YIELD", message: "Commodities futures settled", amount: "+$340" },
];

function generatePortfolioData() {
  const rng = seededRandom(42);
  const points: { label: number; value: number }[] = [];
  let v = 2100000;
  for (let i = 0; i < 30; i++) {
    v += (rng() - 0.35) * 25000;
    v = Math.max(2050000, Math.min(2550000, v));
    points.push({ label: i + 1, value: v });
  }
  points[29] = { label: 30, value: 2500000 };
  return points;
}

function generateSparkline(seed: number) {
  const rng = seededRandom(seed * 100 + 7);
  const data: number[] = [];
  let v = 50 + seed * 10;
  for (let i = 0; i < 14; i++) {
    v += (rng() - 0.4) * 8;
    v = Math.max(20, Math.min(90, v));
    data.push(v);
  }
  return data;
}

function generateHeatmap() {
  const rng = seededRandom(999);
  return ASSETS.map((_, ai) =>
    Array.from({ length: 7 }, () =>
      Math.round((0.3 + rng() * 0.7 + ai * 0.05) * 100) / 100
    )
  );
}

// -- Sub-components -----------------------------------------------------------

function YieldMatrix({ data }: { data: number[][] }) {
  const mounted = useMounted();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <QGPanel label="Yield Matrix (7-Day)">
      <div style={{ display: "grid", gridTemplateColumns: "72px repeat(7, 1fr)", gap: 2 }}>
        <div />
        {days.map(d => (
          <div key={d} style={{ fontSize: 9, color: "var(--qg-text-muted)", textAlign: "center", paddingBottom: 4 }}>{d}</div>
        ))}
        {ASSETS.map((asset, ai) => (
          <React.Fragment key={ai}>
            <div style={{ fontSize: 10, color: asset.color, display: "flex", alignItems: "center", opacity: 0.7 }}>
              {asset.ticker}
            </div>
            {data[ai].map((val, di) => {
              const h = val > 0.7 ? 170 : val > 0.4 ? 160 : 150;
              const l = 10 + val * 40;
              const s = 50 + val * 30;
              return (
                <div
                  key={`${ai}-${di}`}
                  style={{
                    background: `hsl(${h}, ${s}%, ${l}%)`,
                    borderRadius: 3, height: 28,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "scale(1)" : "scale(0.5)",
                    transition: `all 0.4s ease-out ${(ai * 7 + di) * 0.03}s`,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: val > 0.6 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {(val * 10).toFixed(1)}%
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </QGPanel>
  );
}

function AssetCards() {
  const mounted = useMounted();
  const sparklines = useMemo(() => ASSETS.map((_, i) => generateSparkline(i)), []);

  return (
    <QGPanel label="Asset Overview">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {ASSETS.map((asset, i) => (
          <div
            key={asset.ticker}
            className="qg-animate-slide-up qg-hover-lift"
            style={{
              background: "rgba(var(--qg-primary-rgb),0.03)",
              border: `1px solid ${asset.color}15`,
              borderRadius: 10, padding: 12,
              animationDelay: `${i * 0.12}s`,
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: `${asset.color}20`, border: `1px solid ${asset.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: asset.color, fontWeight: 600,
              }}>{asset.ticker[0]}</div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{asset.name}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{asset.ticker}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                  ${(asset.value / 1000).toFixed(0)}K
                </div>
                <div style={{ fontSize: 9, color: asset.color }}>{asset.apy}% APY</div>
              </div>
              <QGSparkline data={sparklines[i]} color={asset.color} />
            </div>
            <div style={{ height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: mounted ? `${asset.allocation}%` : "0%",
                background: asset.color,
                borderRadius: 1,
                transition: `width 1.5s ease-out ${0.5 + i * 0.15}s`,
                boxShadow: `0 0 8px ${asset.color}66`,
              }} />
            </div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", textAlign: "right", marginTop: 3 }}>
              {asset.allocation}% allocation
            </div>
          </div>
        ))}
      </div>
    </QGPanel>
  );
}

function RiskSection() {
  const indicators = [
    { label: "Volatility", value: "Low", color: "#10B981" },
    { label: "Liquidity", value: "High", color: "#06B6D4" },
    { label: "Exposure", value: "Balanced", color: "#F59E0B" },
  ];

  return (
    <QGPanel label="Risk Radar">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <QGGauge value={92} label="HEALTH" />
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {indicators.map(ind => (
            <div key={ind.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: ind.color }}>{ind.value}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{ind.label}</div>
            </div>
          ))}
        </div>
      </div>
    </QGPanel>
  );
}

function ReturnBars() {
  const returns = [
    { name: "Treasuries", ret: 4.1, color: "#06B6D4" },
    { name: "Real Estate", ret: 6.5, color: "#8B5CF6" },
    { name: "Credit", ret: 8.2, color: "#10B981" },
    { name: "Commodities", ret: 2.3, color: "#F59E0B" },
  ];
  const maxRet = Math.max(...returns.map(r => r.ret));

  return (
    <QGPanel label="30-Day Return">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {returns.map((r, i) => (
          <QGProgressBar
            key={r.name}
            label={r.name}
            value={r.ret}
            max={maxRet}
            color={r.color}
            delay={0.3 + i * 0.15}
          />
        ))}
      </div>
    </QGPanel>
  );
}

// -- Main Page ----------------------------------------------------------------

export function QGPortfolioPage() {
  const portfolioData = useMemo(() => generatePortfolioData(), []);
  const heatmapData = useMemo(() => generateHeatmap(), []);
  const animatedTotal = useAnimatedValue(2500000, 2500);

  const allocationSegments = ASSETS.map(a => ({
    label: a.name,
    value: a.allocation,
    color: a.color,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
      {/* Row 1: Portfolio Chart | Allocation Ring | Yield Matrix */}
      <QGScrollReveal>
        <div style={{ display: "grid", gridTemplateColumns: "5fr 3fr 4fr", gap: "var(--qg-gap)" }}>
          <QGPanel label="Portfolio Value">
            <div style={{ position: "absolute", top: 12, right: 16, textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", textShadow: "0 0 20px var(--qg-accent-glow)" }}>
                ${(animatedTotal / 1e6).toFixed(2)}M
              </div>
              <div style={{ fontSize: 10, color: "#10B981" }}>+19.05% (30d)</div>
            </div>
            <QGChart data={portfolioData} />
          </QGPanel>

          <QGPanel label="Allocation">
            <QGDonutRing segments={allocationSegments} centerValue="4" centerLabel="ASSETS" />
          </QGPanel>

          <YieldMatrix data={heatmapData} />
        </div>
      </QGScrollReveal>

      {/* Row 2: Asset Cards | Risk Radar */}
      <QGScrollReveal staggerIndex={1}>
        <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: "var(--qg-gap)" }}>
          <AssetCards />
          <RiskSection />
        </div>
      </QGScrollReveal>

      {/* Row 3: Live Feed | Performance */}
      <QGScrollReveal staggerIndex={2}>
        <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: "var(--qg-gap)" }}>
          <QGPanel label="Live Feed">
            <QGFeed items={FEED_EVENTS} />
          </QGPanel>
          <ReturnBars />
        </div>
      </QGScrollReveal>
    </div>
  );
}
