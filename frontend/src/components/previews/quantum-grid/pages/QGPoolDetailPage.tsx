"use client";

import React, { useMemo, useState } from "react";
import { QGPanel } from "../primitives/QGPanel";
import { QGChart } from "../primitives/QGChart";
import { QGProgressBar } from "../primitives/QGProgressBar";
import { QGScrollReveal } from "../primitives/QGScrollReveal";
import { QGBadge } from "../primitives/QGBadge";
import { QGButton } from "../primitives/QGButton";
import { QGInput } from "../primitives/QGInput";
import { QGTable } from "../primitives/QGTable";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

// -- Seeded PRNG (deterministic across server/client) -------------------------
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// -- Mock Data ----------------------------------------------------------------

const POOL = {
  name: "US Treasury Bills Fund",
  ticker: "USTB",
  category: "Treasuries",
  tvl: 2100000,
  apy: 5.4,
  maturity: "90 days",
  risk: "Low",
  riskColor: "#10B981",
  minInvestment: 1000,
  maxCapacity: 5000000,
  currentCapacity: 2100000,
  investors: 234,
  inception: "Jan 15, 2026",
  lastYieldDate: "Feb 7, 2026",
  yieldFrequency: "Weekly",
  managementFee: "0.5%",
  performanceFee: "10%",
  custodian: "Fireblocks",
  auditor: "Deloitte",
  tokenAddress: "0x1234...5678",
};

function generateYieldHistory() {
  const rng = seededRandom(77);
  const points: { label: number; value: number }[] = [];
  let v = 4.8;
  for (let i = 0; i < 30; i++) {
    v += (rng() - 0.45) * 0.3;
    v = Math.max(4.2, Math.min(5.8, v));
    points.push({ label: i + 1, value: v });
  }
  return points;
}

const RECENT_TRANSACTIONS = [
  { date: "Feb 7", type: "Yield", amount: "+$1,247", status: "Confirmed" },
  { date: "Feb 5", type: "Deposit", amount: "$25,000", status: "Confirmed" },
  { date: "Feb 3", type: "Yield", amount: "+$1,180", status: "Confirmed" },
  { date: "Jan 30", type: "Withdrawal", amount: "-$10,000", status: "Confirmed" },
  { date: "Jan 28", type: "Yield", amount: "+$1,156", status: "Confirmed" },
];

// -- Main Page ----------------------------------------------------------------

export function QGPoolDetailPage() {
  const yieldHistory = useMemo(() => generateYieldHistory(), []);
  const animatedTvl = useAnimatedValue(POOL.tvl, 2000);
  const [investAmount, setInvestAmount] = useState("");
  const capacityPct = (POOL.currentCapacity / POOL.maxCapacity) * 100;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--qg-gap)", alignItems: "start" }}>
      {/* Left: Main Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
        {/* Pool Header */}
        <QGScrollReveal>
          <QGPanel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", margin: 0 }}>{POOL.name}</h2>
                  <QGBadge color="#10B981" variant="dot" pulse>{POOL.risk} Risk</QGBadge>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {POOL.ticker} · {POOL.category} · Since {POOL.inception}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                  {POOL.apy}%
                </div>
                <div style={{ fontSize: 10, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>CURRENT APY</div>
              </div>
            </div>
          </QGPanel>
        </QGScrollReveal>

        {/* Stats Grid */}
        <QGScrollReveal staggerIndex={1}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--qg-gap)" }}>
            {[
              { label: "TVL", value: `$${(animatedTvl / 1e6).toFixed(2)}M`, color: "#fff" },
              { label: "INVESTORS", value: POOL.investors.toString(), color: "var(--qg-primary)" },
              { label: "YIELD FREQ", value: POOL.yieldFrequency, color: "#10B981" },
              { label: "MATURITY", value: POOL.maturity, color: "#F59E0B" },
            ].map(s => (
              <QGPanel key={s.label}>
                <div style={{ fontSize: 9, color: "var(--qg-text-muted)", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              </QGPanel>
            ))}
          </div>
        </QGScrollReveal>

        {/* Yield Chart */}
        <QGScrollReveal staggerIndex={2}>
          <QGPanel label="Yield History (30D)">
            <QGChart data={yieldHistory} height={200} gradientId="yield-chart" />
          </QGPanel>
        </QGScrollReveal>

        {/* Pool Info */}
        <QGScrollReveal staggerIndex={3}>
          <QGPanel label="Pool Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              {[
                { label: "Management Fee", value: POOL.managementFee },
                { label: "Performance Fee", value: POOL.performanceFee },
                { label: "Custodian", value: POOL.custodian },
                { label: "Auditor", value: POOL.auditor },
                { label: "Min Investment", value: `$${POOL.minInvestment.toLocaleString()}` },
                { label: "Token Address", value: POOL.tokenAddress },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(var(--qg-primary-rgb),0.04)" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </QGPanel>
        </QGScrollReveal>

        {/* Recent Transactions */}
        <QGScrollReveal staggerIndex={4}>
          <QGPanel label="Recent Activity">
            <QGTable
              columns={[
                { key: "date", label: "Date" },
                { key: "type", label: "Type", render: (v: string) => (
                  <QGBadge color={v === "Yield" ? "#10B981" : v === "Deposit" ? "var(--qg-primary)" : "#F59E0B"} variant="outline">{v}</QGBadge>
                )},
                { key: "amount", label: "Amount", align: "right" },
                { key: "status", label: "Status", align: "right", render: (v: string) => (
                  <span style={{ fontSize: 10, color: "#10B981" }}>{v}</span>
                )},
              ]}
              data={RECENT_TRANSACTIONS}
            />
          </QGPanel>
        </QGScrollReveal>
      </div>

      {/* Right: Sticky Investment Panel */}
      <div style={{ position: "sticky", top: 60 }}>
        <QGPanel label="Invest">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Capacity */}
            <div>
              <QGProgressBar label="Pool Capacity" value={capacityPct} color="var(--qg-primary)" height={6} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>${(POOL.currentCapacity / 1e6).toFixed(1)}M filled</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>${(POOL.maxCapacity / 1e6).toFixed(0)}M max</span>
              </div>
            </div>

            {/* Amount Input */}
            <QGInput
              label="Investment Amount"
              placeholder="Enter amount in USDC"
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
            />

            {/* Quick Amount Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {["$1K", "$5K", "$10K", "$25K"].map(amt => (
                <button
                  key={amt}
                  onClick={() => setInvestAmount(amt.replace(/[$K]/g, "000").replace("000000", "000"))}
                  style={{
                    padding: "6px", borderRadius: 6,
                    background: "rgba(var(--qg-primary-rgb),0.05)",
                    border: "1px solid rgba(var(--qg-primary-rgb),0.1)",
                    color: "var(--qg-text-muted)", fontSize: 10,
                    cursor: "pointer",
                  }}
                >{amt}</button>
              ))}
            </div>

            {/* Expected Return */}
            <QGPanel style={{ background: "rgba(var(--qg-primary-rgb),0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Expected Annual Yield</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>
                  {investAmount ? `$${(parseFloat(investAmount) * POOL.apy / 100).toFixed(0)}` : "$0"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Weekly Distribution</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--qg-primary)" }}>
                  {investAmount ? `$${(parseFloat(investAmount) * POOL.apy / 100 / 52).toFixed(2)}` : "$0.00"}
                </span>
              </div>
            </QGPanel>

            <QGButton variant="primary" fullWidth>Invest Now</QGButton>
            <QGButton variant="ghost" fullWidth>View Documentation</QGButton>
          </div>
        </QGPanel>
      </div>
    </div>
  );
}
