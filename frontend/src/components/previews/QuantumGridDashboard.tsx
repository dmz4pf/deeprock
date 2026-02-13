"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";

// =============================================================================
// QUANTUM GRID DASHBOARD
// Bloomberg Terminal meets holographic UI. Dense, rich, institutional-grade.
// Every panel has a visualization. Information density is the feature.
// =============================================================================

// -- Data Types ---------------------------------------------------------------

interface Asset {
  name: string;
  ticker: string;
  value: number;
  apy: number;
  allocation: number;
  color: string;
}

interface FeedEvent {
  id: number;
  time: string;
  type: "YIELD" | "TX" | "SYNC" | "ALERT";
  message: string;
  amount: string;
}

// -- Constants ----------------------------------------------------------------

const ASSETS: Asset[] = [
  { name: "Treasuries", ticker: "USTF", value: 875000, apy: 5.2, allocation: 35, color: "#06B6D4" },
  { name: "Real Estate", ticker: "REPR", value: 650000, apy: 7.8, allocation: 26, color: "#8B5CF6" },
  { name: "Credit", ticker: "PCPL", value: 600000, apy: 9.4, allocation: 24, color: "#10B981" },
  { name: "Commodities", ticker: "CMDX", value: 375000, apy: 3.8, allocation: 15, color: "#F59E0B" },
];

const TOTAL_VALUE = 2500000;
const WEIGHTED_APY = 6.4;
const HEALTH_SCORE = 92;

const PANEL_BG = "rgba(6,182,212,0.02)";
const PANEL_BORDER = "rgba(6,182,212,0.06)";

const FEED_EVENTS: FeedEvent[] = [
  { id: 1, time: "14:32:08", type: "YIELD", message: "Treasuries yield distributed", amount: "+$1,247" },
  { id: 2, time: "14:31:55", type: "TX", message: "Credit pool rebalance executed", amount: "$45,000" },
  { id: 3, time: "14:31:42", type: "SYNC", message: "NAV oracle price update", amount: "$2.50M" },
  { id: 4, time: "14:31:30", type: "ALERT", message: "Volatility threshold normal", amount: "0.8%" },
  { id: 5, time: "14:31:18", type: "YIELD", message: "Real Estate rent accrual", amount: "+$892" },
  { id: 6, time: "14:31:05", type: "TX", message: "New deposit processed", amount: "$25,000" },
  { id: 7, time: "14:30:52", type: "SYNC", message: "Blockchain state synchronized", amount: "Block #4,291" },
  { id: 8, time: "14:30:40", type: "YIELD", message: "Commodities futures settled", amount: "+$340" },
  { id: 9, time: "14:30:28", type: "TX", message: "Withdrawal request queued", amount: "$12,500" },
  { id: 10, time: "14:30:15", type: "ALERT", message: "Credit utilization optimal", amount: "72%" },
];

const FEED_COLORS: Record<FeedEvent["type"], string> = {
  YIELD: "#10B981",
  TX: "#06B6D4",
  SYNC: "#3B82F6",
  ALERT: "#F59E0B",
};

// -- Utility Hooks ------------------------------------------------------------

function useAnimatedValue(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(target * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

// -- Data Generation ----------------------------------------------------------

function generatePortfolioData(): { day: number; value: number }[] {
  const points: { day: number; value: number }[] = [];
  let v = 2100000;
  for (let i = 0; i < 30; i++) {
    v += (Math.random() - 0.35) * 25000;
    v = Math.max(2050000, Math.min(2550000, v));
    points.push({ day: i + 1, value: v });
  }
  points[29] = { day: 30, value: 2500000 };
  return points;
}

function generateSparklineData(seed: number): number[] {
  const data: number[] = [];
  let v = 50 + seed * 10;
  for (let i = 0; i < 14; i++) {
    v += (Math.random() - 0.4) * 8;
    v = Math.max(20, Math.min(90, v));
    data.push(v);
  }
  return data;
}

function generateHeatmapData(): number[][] {
  return ASSETS.map((_, ai) =>
    Array.from({ length: 7 }, () =>
      Math.round((0.3 + Math.random() * 0.7 + ai * 0.05) * 100) / 100
    )
  );
}

// -- Shared Styles ------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  background: PANEL_BG,
  border: `1px solid ${PANEL_BORDER}`,
  borderRadius: 12,
  padding: 16,
  position: "relative",
  overflow: "hidden",
};

const panelLabelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  color: "rgba(6,182,212,0.5)",
  marginBottom: 12,
  fontWeight: 500,
};

// -- Panel Components ---------------------------------------------------------

function PortfolioChart({ data }: { data: { day: number; value: number }[] }) {
  const mounted = useMounted();
  const w = 420, h = 180, px = 30, py = 20;
  const minV = Math.min(...data.map(d => d.value));
  const maxV = Math.max(...data.map(d => d.value));
  const range = maxV - minV || 1;

  const toX = useCallback((i: number) => px + (i / 29) * (w - px * 2), []);
  const toY = useCallback((v: number) => py + (1 - (v - minV) / range) * (h - py * 2), [minV, range]);

  const linePath = useMemo(() =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(" "),
    [data, toX, toY]
  );

  const areaPath = useMemo(() =>
    linePath + ` L${toX(29).toFixed(1)},${h - py} L${toX(0).toFixed(1)},${h - py} Z`,
    [linePath, toX, h]
  );

  const pathLength = 1200;

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>Portfolio Value</div>
      <div style={{ position: "absolute", top: 12, right: 16, textAlign: "right" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", textShadow: "0 0 20px rgba(6,182,212,0.4)" }}>
          $2.50M
        </div>
        <div style={{ fontSize: 10, color: "#10B981" }}>+19.05% (30d)</div>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="qg-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
          <filter id="qg-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const yy = py + frac * (h - py * 2);
          const val = maxV - frac * range;
          return (
            <g key={frac}>
              <line x1={px} y1={yy} x2={w - px} y2={yy} stroke="rgba(6,182,212,0.06)" strokeWidth="1" />
              <text x={px - 4} y={yy + 3} textAnchor="end" fill="rgba(6,182,212,0.25)" fontSize="8">
                {(val / 1e6).toFixed(2)}M
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="url(#qg-area-grad)" opacity={mounted ? 1 : 0} style={{ transition: "opacity 1s" }} />
        {/* Glowing line behind */}
        <path
          d={linePath}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="3"
          opacity="0.3"
          filter="url(#qg-glow)"
          strokeDasharray={pathLength}
          strokeDashoffset={mounted ? 0 : pathLength}
          style={{ transition: "stroke-dashoffset 2s ease-out" }}
        />
        {/* Main line */}
        <path
          d={linePath}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={mounted ? 0 : pathLength}
          style={{ transition: "stroke-dashoffset 2s ease-out" }}
        />
        {/* Data points */}
        {mounted && data.filter((_, i) => i % 3 === 0 || i === 29).map((d, i) => (
          <circle
            key={i}
            cx={toX(d.day - 1)}
            cy={toY(d.value)}
            r="2"
            fill="#06B6D4"
            className="qg-fade-in"
            style={{ animationDelay: `${2 + i * 0.1}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

function AllocationRing() {
  const mounted = useMounted();
  const cx = 90, cy = 90, r = 70, sw = 28;
  const circumference = 2 * Math.PI * r;

  const segments = useMemo(() => {
    let offset = 0;
    return ASSETS.map(asset => {
      const seg = { ...asset, offset, length: (asset.allocation / 100) * circumference };
      offset += seg.length;
      return seg;
    });
  }, [circumference]);

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>Allocation</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width={180} height={180} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
          <defs>
            {ASSETS.map((a, i) => (
              <filter key={i} id={`qg-seg-glow-${i}`}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(6,182,212,0.04)" strokeWidth={sw} />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw - 4}
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={mounted ? -seg.offset : circumference}
              strokeLinecap="butt"
              filter={`url(#qg-seg-glow-${i})`}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: `stroke-dashoffset 1.5s ease-out ${i * 0.15}s` }}
              opacity={0.85}
            />
          ))}
          {/* Center text */}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="600">4</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(6,182,212,0.5)" fontSize="8" letterSpacing="0.15em">ASSETS</text>
        </svg>
        {/* Legend */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginTop: 4 }}>
          {ASSETS.map(a => (
            <div key={a.ticker} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, boxShadow: `0 0 6px ${a.color}66` }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                {a.name} <span style={{ color: "rgba(255,255,255,0.3)" }}>{a.allocation}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function YieldMatrix({ data }: { data: number[][] }) {
  const mounted = useMounted();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const cellColor = useCallback((intensity: number) => {
    const h = intensity > 0.7 ? 170 : intensity > 0.4 ? 160 : 150;
    const l = 10 + intensity * 40;
    const s = 50 + intensity * 30;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, []);

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>Yield Matrix (7-Day)</div>
      <div style={{ display: "grid", gridTemplateColumns: "72px repeat(7, 1fr)", gap: 2 }}>
        {/* Header row */}
        <div />
        {days.map(d => (
          <div key={d} style={{ fontSize: 9, color: "rgba(6,182,212,0.35)", textAlign: "center", paddingBottom: 4 }}>{d}</div>
        ))}
        {/* Data rows */}
        {ASSETS.map((asset, ai) => (
          <React.Fragment key={ai}>
            <div style={{ fontSize: 10, color: asset.color, display: "flex", alignItems: "center", opacity: 0.7 }}>
              {asset.ticker}
            </div>
            {data[ai].map((val, di) => (
              <div
                key={`${ai}-${di}`}
                className="qg-heatmap-cell"
                style={{
                  background: cellColor(val),
                  borderRadius: 3,
                  height: 28,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "scale(1)" : "scale(0.5)",
                  transition: `all 0.4s ease-out ${(ai * 7 + di) * 0.03}s`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: val > 0.6 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                }}
              >
                {(val * 10).toFixed(1)}%
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function AssetCards() {
  const mounted = useMounted();
  const sparklines = useMemo(() => ASSETS.map((_, i) => generateSparklineData(i)), []);

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>Asset Overview</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {ASSETS.map((asset, i) => (
          <AssetCard key={asset.ticker} asset={asset} sparkData={sparklines[i]} index={i} visible={mounted} />
        ))}
      </div>
    </div>
  );
}

function AssetCard({ asset, sparkData, index, visible }: {
  asset: Asset; sparkData: number[]; index: number; visible: boolean;
}) {
  const animatedValue = useAnimatedValue(asset.value, 2000 + index * 300);
  const svgW = 100, svgH = 32;
  const minV = Math.min(...sparkData);
  const maxV = Math.max(...sparkData);
  const rangeV = maxV - minV || 1;

  const sparkPath = useMemo(() =>
    sparkData.map((v, i) => {
      const x = (i / 13) * svgW;
      const y = svgH - ((v - minV) / rangeV) * (svgH - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" "),
    [sparkData, minV, rangeV]
  );

  return (
    <div
      className="qg-fade-slide-up"
      style={{
        background: "rgba(6,182,212,0.03)",
        border: `1px solid ${asset.color}15`,
        borderRadius: 10,
        padding: 12,
        animationDelay: `${index * 0.12}s`,
        position: "relative",
        overflow: "hidden",
        opacity: visible ? undefined : 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: `${asset.color}20`, border: `1px solid ${asset.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: asset.color, fontWeight: 600,
        }}>
          {asset.ticker[0]}
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{asset.name}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{asset.ticker}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            ${(animatedValue / 1000).toFixed(0)}K
          </div>
          <div style={{ fontSize: 9, color: asset.color }}>{asset.apy}% APY</div>
        </div>
        <svg width={svgW} height={svgH}>
          <path d={sparkPath} fill="none" stroke={asset.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
      {/* Allocation bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: visible ? `${asset.allocation}%` : "0%",
            background: asset.color,
            borderRadius: 1,
            transition: `width 1.5s ease-out ${0.5 + index * 0.15}s`,
            boxShadow: `0 0 8px ${asset.color}66`,
          }}
        />
      </div>
      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", textAlign: "right", marginTop: 3 }}>
        {asset.allocation}% allocation
      </div>
    </div>
  );
}

function RiskRadar() {
  const mounted = useMounted();
  const animatedScore = useAnimatedValue(HEALTH_SCORE, 2000);
  const cx = 80, cy = 80, r = 60, sw = 10;
  const circumference = 2 * Math.PI * r;
  const scoreRatio = animatedScore / 100;

  const indicators = [
    { label: "Volatility", value: "Low", color: "#10B981" },
    { label: "Liquidity", value: "High", color: "#06B6D4" },
    { label: "Exposure", value: "Balanced", color: "#F59E0B" },
  ];

  const gaugeColor = scoreRatio > 0.8 ? "#06B6D4" : scoreRatio > 0.6 ? "#10B981" : scoreRatio > 0.4 ? "#F59E0B" : "#EF4444";

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>Risk Radar</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width={160} height={160} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
          <defs>
            <linearGradient id="qg-gauge-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="30%" stopColor="#F59E0B" />
              <stop offset="60%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <filter id="qg-gauge-glow">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(6,182,212,0.06)" strokeWidth={sw} />
          {/* Glow behind */}
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={gaugeColor} strokeWidth={sw + 4}
            strokeDasharray={`${circumference * scoreRatio} ${circumference * (1 - scoreRatio)}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            filter="url(#qg-gauge-glow)"
            opacity="0.25"
          />
          {/* Active arc */}
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="url(#qg-gauge-grad)" strokeWidth={sw}
            strokeDasharray={`${circumference * scoreRatio} ${circumference * (1 - scoreRatio)}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 2s ease-out" }}
          />
          {/* Center text */}
          <text x={cx} y={cy - 2} textAnchor="middle" fill="white" fontSize="28" fontWeight="700">
            {Math.round(animatedScore)}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(6,182,212,0.4)" fontSize="8" letterSpacing="0.2em">
            HEALTH
          </text>
        </svg>
        {/* Indicators */}
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {indicators.map(ind => (
            <div key={ind.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: ind.color }}>{ind.value}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{ind.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveFeed() {
  return (
    <div style={{ ...panelStyle, overflow: "hidden" }}>
      <div style={panelLabelStyle}>Live Feed</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 200, overflow: "hidden" }}>
        {FEED_EVENTS.map((event, i) => (
          <div
            key={event.id}
            className="qg-feed-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 8px",
              borderRadius: 6,
              background: i % 2 === 0 ? "rgba(6,182,212,0.015)" : "transparent",
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", minWidth: 60 }}>
              {event.time}
            </span>
            <span style={{
              fontSize: 8, fontWeight: 600, color: FEED_COLORS[event.type],
              background: `${FEED_COLORS[event.type]}15`,
              padding: "2px 6px", borderRadius: 3, minWidth: 36, textAlign: "center",
              letterSpacing: "0.05em",
            }}>
              {event.type}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", flex: 1 }}>
              {event.message}
            </span>
            <span style={{
              fontSize: 10, fontFamily: "monospace", fontWeight: 500,
              color: event.type === "YIELD" ? "#10B981" : "rgba(255,255,255,0.4)",
            }}>
              {event.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceBars() {
  const mounted = useMounted();
  const returns = [
    { ...ASSETS[0], ret: 4.1 },
    { ...ASSETS[1], ret: 6.5 },
    { ...ASSETS[2], ret: 8.2 },
    { ...ASSETS[3], ret: 2.3 },
  ];
  const maxRet = Math.max(...returns.map(r => r.ret));

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>30-Day Return</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {returns.map((r, i) => (
          <div key={r.ticker}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{r.name}</span>
              <span style={{ fontSize: 10, color: r.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                +{r.ret}%
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: mounted ? `${(r.ret / maxRet) * 100}%` : "0%",
                  background: `linear-gradient(90deg, ${r.color}CC, ${r.color})`,
                  borderRadius: 3,
                  transition: `width 1.2s ease-out ${0.3 + i * 0.15}s`,
                  boxShadow: `0 0 10px ${r.color}44`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderTicker() {
  const animatedTotal = useAnimatedValue(TOTAL_VALUE, 2500);
  const animatedApy = useAnimatedValue(WEIGHTED_APY, 2000);

  const metrics = [
    { label: "AUM", value: `$${(animatedTotal / 1e6).toFixed(2)}M`, color: "#fff" },
    { label: "W.APY", value: `${animatedApy.toFixed(1)}%`, color: "#06B6D4" },
    { label: "24H VOL", value: "$142.5K", color: "rgba(255,255,255,0.5)" },
    { label: "ASSETS", value: "4", color: "rgba(255,255,255,0.5)" },
    { label: "HEALTH", value: "92/100", color: "#10B981" },
    { label: "CHAIN", value: "AVAX", color: "#E84142" },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid rgba(6,182,212,0.06)",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Logo mark */}
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))",
          border: "1px solid rgba(6,182,212,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "#06B6D4",
        }}>
          Q
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "0.05em" }}>
            DEEPROCK QUANTUM GRID
          </div>
          <div style={{ fontSize: 9, color: "rgba(6,182,212,0.4)", letterSpacing: "0.1em" }}>
            INSTITUTIONAL DASHBOARD
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ textAlign: "right" }}>
            <div style={{ fontSize: 8, color: "rgba(6,182,212,0.35)", letterSpacing: "0.1em", marginBottom: 2 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: m.color, fontVariantNumeric: "tabular-nums" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main Component -----------------------------------------------------------

export function QuantumGridDashboard() {
  const portfolioData = useMemo(() => generatePortfolioData(), []);
  const heatmapData = useMemo(() => generateHeatmapData(), []);

  return (
    <div style={{ minHeight: "100vh", background: "#030614", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @keyframes qg-draw {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes qg-fade-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes qg-pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(6,182,212,0.3)); }
          50% { filter: drop-shadow(0 0 12px rgba(6,182,212,0.6)); }
        }
        @keyframes qg-feed-slide {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .qg-fade-in {
          opacity: 0;
          animation: qg-fade-slide-up 0.5s ease-out forwards;
        }
        .qg-fade-slide-up {
          animation: qg-fade-slide-up 0.6s ease-out both;
        }
        .qg-feed-item {
          animation: qg-feed-slide 0.5s ease-out both;
        }
        .qg-heatmap-cell:hover {
          filter: brightness(1.6) !important;
          transform: scale(1.08) !important;
          z-index: 2;
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px" }}>
        <HeaderTicker />

        {/* Row 1: Portfolio | Allocation | Yield Matrix */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "5fr 3fr 4fr",
          gap: 12,
          marginBottom: 12,
        }}>
          <PortfolioChart data={portfolioData} />
          <AllocationRing />
          <YieldMatrix data={heatmapData} />
        </div>

        {/* Row 2: Asset Cards | Risk Radar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "8fr 4fr",
          gap: 12,
          marginBottom: 12,
        }}>
          <AssetCards />
          <RiskRadar />
        </div>

        {/* Row 3: Live Feed | Performance */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "8fr 4fr",
          gap: 12,
        }}>
          <LiveFeed />
          <PerformanceBars />
        </div>
      </div>
    </div>
  );
}
