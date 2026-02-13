"use client";

import { useEffect, useState, useRef, useMemo } from "react";

// =============================================================================
// CITADEL COMMAND DASHBOARD
// NASA mission control meets hedge fund war room. Dense, cinematic, alive.
// =============================================================================

interface Asset {
  id: string;
  name: string;
  ticker: string;
  value: number;
  apy: number;
  allocation: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  color: string;
  radarAngle: number;
  radarDistance: number;
}

interface IntelEvent {
  id: number;
  timestamp: string;
  type: string;
  message: string;
}

const ASSETS: Asset[] = [
  { id: "1", name: "Treasuries", ticker: "USTF", value: 875000, apy: 5.2, allocation: 35, riskLevel: "low", color: "#06B6D4", radarAngle: 45, radarDistance: 0.25 },
  { id: "2", name: "Real Estate", ticker: "REPR", value: 650000, apy: 7.8, allocation: 26, riskLevel: "medium", color: "#8B5CF6", radarAngle: 150, radarDistance: 0.52 },
  { id: "3", name: "Credit", ticker: "PCPL", value: 600000, apy: 9.4, allocation: 24, riskLevel: "medium", color: "#10B981", radarAngle: 230, radarDistance: 0.55 },
  { id: "4", name: "Commodities", ticker: "CMDX", value: 375000, apy: 3.8, allocation: 15, riskLevel: "high", color: "#F59E0B", radarAngle: 310, radarDistance: 0.78 },
];

const THREAT_MATRIX: Record<string, Record<string, "low" | "medium" | "high">> = {
  Market:         { Treasuries: "low",    "Real Estate": "medium", Credit: "medium", Commodities: "high" },
  Liquidity:      { Treasuries: "low",    "Real Estate": "high",   Credit: "medium", Commodities: "medium" },
  "Smart Contract": { Treasuries: "low",  "Real Estate": "low",    Credit: "medium", Commodities: "low" },
  Regulatory:     { Treasuries: "low",    "Real Estate": "medium", Credit: "high",   Commodities: "medium" },
};

const RISK_COLORS: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
};

const INTEL_TEMPLATES: { type: string; messages: string[] }[] = [
  { type: "YIELD_ACCRUAL", messages: ["USTF pool +$1,247 accrued", "REPR yield distributed $892", "PCPL interest compounded +$1,033", "CMDX staking reward +$412"] },
  { type: "REBALANCE", messages: ["Portfolio drift 0.3% - within tolerance", "Auto-rebalance queued T+2", "REPR weight adjusted 26.1% -> 26.0%", "Allocation targets confirmed"] },
  { type: "ORACLE_UPDATE", messages: ["Chainlink AVAX/USD refreshed $38.42", "NAV oracle synced block #48291037", "Price feed latency 1.2s nominal", "Treasury rate feed updated 5.21%"] },
  { type: "POSITION_SYNC", messages: ["Vault positions reconciled", "Cross-chain bridge confirmed 3/3", "Collateral ratio healthy at 312%", "LP positions verified on-chain"] },
];

// =============================================================================
// HOOKS
// =============================================================================

function useAnimatedValue(target: number, duration = 2000, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setValue(target * eased);
        if (progress < 1) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    }, delay);

    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);

  return value;
}

function useMounted(delay = 0) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return mounted;
}

function useIntelFeed(): IntelEvent[] {
  const [events, setEvents] = useState<IntelEvent[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const generateEvent = (): IntelEvent => {
      const template = INTEL_TEMPLATES[Math.floor(Math.random() * INTEL_TEMPLATES.length)];
      const message = template.messages[Math.floor(Math.random() * template.messages.length)];
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      counterRef.current += 1;
      return { id: counterRef.current, timestamp: ts, type: template.type, message };
    };

    const initial = Array.from({ length: 8 }, () => generateEvent());
    setEvents(initial);

    const interval = setInterval(() => {
      setEvents(prev => [generateEvent(), ...prev].slice(0, 10));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return events;
}

// =============================================================================
// PORTFOLIO DATA GENERATION
// =============================================================================

function generatePortfolioData(): { day: number; value: number }[] {
  const data: { day: number; value: number }[] = [];
  let value = 1800000;
  for (let i = 0; i <= 90; i++) {
    const trend = 7777;
    const noise = (Math.random() - 0.45) * 30000;
    const cyclical = Math.sin(i / 12) * 15000;
    value = Math.max(value + trend + noise + cyclical, 1600000);
    data.push({ day: i, value: Math.min(value, 2600000) });
  }
  data[90] = { day: 90, value: 2500000 };
  return data;
}

// =============================================================================
// COMMAND BAR
// =============================================================================

function CommandBar() {
  const show = useMounted(100);

  return (
    <div
      className="relative px-6 py-3 flex items-center justify-between"
      style={{
        background: "rgba(6,182,212,0.04)",
        borderBottom: "1px solid rgba(6,182,212,0.1)",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(-10px)",
        transition: "all 0.6s ease-out",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-sm font-bold tracking-[0.25em] text-cyan-300"
          style={{ fontFamily: "monospace", textShadow: "0 0 20px rgba(6,182,212,0.5)" }}
        >
          CITADEL COMMAND
        </span>
      </div>

      <div className="flex items-center gap-1 text-cyan-500/30">
        <span>&#x2022;</span><span>&#x2022;</span><span>&#x2022;</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="citadel-blink-light"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10B981",
            display: "inline-block",
            boxShadow: "0 0 8px #10B981",
          }}
        />
        <span className="text-xs tracking-[0.2em] text-cyan-400/70" style={{ fontFamily: "monospace" }}>
          STATUS: OPERATIONAL
        </span>
      </div>

      {/* Scan line */}
      <div
        className="absolute bottom-0 left-0 h-[1px] citadel-scanline-bar"
        style={{ background: "linear-gradient(90deg, transparent, #06B6D4, transparent)", width: "30%" }}
      />
    </div>
  );
}

// =============================================================================
// RADAR SWEEP
// =============================================================================

function RadarSweep() {
  const show = useMounted(300);
  const svgSize = 230;
  const center = svgSize / 2;
  const maxRadius = 100;
  const rings = [0.25, 0.5, 0.75, 1.0];
  const ringLabels = ["LOW", "MED", "HIGH", "CRIT"];

  return (
    <div
      className="flex flex-col items-center justify-center p-3"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.8)",
        transition: "all 0.8s ease-out",
      }}
    >
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <defs>
          {/* Sweep trail gradient */}
          <linearGradient id="citadel-sweep-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.7" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="citadel-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="citadel-glow-strong">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx={center} cy={center} r={maxRadius + 4} fill="rgba(6,182,212,0.02)" stroke="rgba(6,182,212,0.06)" strokeWidth="1" />

        {/* Concentric rings */}
        {rings.map((r, i) => (
          <circle key={i} cx={center} cy={center} r={maxRadius * r} fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5" />
        ))}

        {/* Cross-hair lines */}
        <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="rgba(6,182,212,0.1)" strokeWidth="0.5" />
        <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="rgba(6,182,212,0.1)" strokeWidth="0.5" />

        {/* Ring labels */}
        {rings.map((r, i) => (
          <text
            key={i}
            x={center + 4}
            y={center - maxRadius * r + 10}
            fill="rgba(6,182,212,0.35)"
            fontSize="7"
            fontFamily="monospace"
          >
            {ringLabels[i]}
          </text>
        ))}

        {/* Sweep group - rotates */}
        <g style={{ transformOrigin: `${center}px ${center}px`, animation: "citadelRadarSweep 4s linear infinite" }}>
          {/* Sweep trail arc */}
          <path
            d={`M ${center} ${center} L ${center + maxRadius} ${center} A ${maxRadius} ${maxRadius} 0 0 0 ${center + maxRadius * Math.cos(-Math.PI / 6)} ${center + maxRadius * Math.sin(-Math.PI / 6)} Z`}
            fill="url(#citadel-sweep-cone)"
            opacity="0.15"
          />
          {/* Sweep line */}
          <line
            x1={center}
            y1={center}
            x2={center + maxRadius}
            y2={center}
            stroke="#06B6D4"
            strokeWidth="1.5"
            filter="url(#citadel-glow)"
            opacity="0.8"
          />
        </g>

        {/* Conic gradient for sweep trail (approximated with a path) */}
        <defs>
          <radialGradient id="citadel-sweep-cone" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* Asset blips */}
        {ASSETS.map((asset) => {
          const angle = (asset.radarAngle * Math.PI) / 180;
          const dist = asset.radarDistance * maxRadius;
          const bx = center + Math.cos(angle) * dist;
          const by = center - Math.sin(angle) * dist;
          return (
            <g key={asset.id}>
              <circle cx={bx} cy={by} r="6" fill={asset.color} opacity="0.15" className="citadel-blip-pulse" />
              <circle cx={bx} cy={by} r="3" fill={asset.color} filter="url(#citadel-glow)" opacity="0.9" />
              <text x={bx + 8} y={by + 3} fill={asset.color} fontSize="7" fontFamily="monospace" opacity="0.7">
                {asset.ticker}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text x={center} y={center + 3} fill="rgba(6,182,212,0.5)" fontSize="7" fontFamily="monospace" textAnchor="middle">
          RISK MONITOR
        </text>
      </svg>
    </div>
  );
}

// =============================================================================
// PORTFOLIO TERRAIN CHART
// =============================================================================

function PortfolioTerrain() {
  const show = useMounted(400);
  const data = useMemo(() => generatePortfolioData(), []);
  const [drawProgress, setDrawProgress] = useState(0);

  useEffect(() => {
    if (!show) return;
    const startTime = performance.now();
    const duration = 2500;
    let raf: number;
    const animate = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      setDrawProgress(p);
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  const width = 580;
  const height = 220;
  const padLeft = 50;
  const padRight = 10;
  const padTop = 30;
  const padBottom = 30;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minVal = 1600000;
  const maxVal = 2600000;

  const pointsVisible = Math.floor(drawProgress * data.length);

  const pathPoints = data.slice(0, Math.max(pointsVisible, 1)).map((d, i) => {
    const x = padLeft + (i / 90) * chartW;
    const y = padTop + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH;
    return { x, y };
  });

  const linePath = pathPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${pathPoints[pathPoints.length - 1]?.x.toFixed(1)} ${padTop + chartH} L ${padLeft} ${padTop + chartH} Z`;

  const currentValue = data[Math.min(pointsVisible, 90)]?.value ?? data[90].value;

  const yTicks = [1800000, 2000000, 2200000, 2400000, 2600000];

  return (
    <div
      className="relative flex flex-col"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease-out",
      }}
    >
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-[9px] tracking-[0.2em] text-cyan-400/50 uppercase" style={{ fontFamily: "monospace" }}>
          Portfolio Terrain - 90D
        </span>
        <span
          className="text-lg font-light text-white tabular-nums"
          style={{ fontFamily: "monospace", textShadow: "0 0 20px rgba(6,182,212,0.6)" }}
        >
          ${(currentValue / 1000000).toFixed(2)}M
        </span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="citadel-terrain-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#0E7490" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#020810" stopOpacity="0.02" />
          </linearGradient>
          <filter id="citadel-line-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padTop + chartH - ((tick - minVal) / (maxVal - minVal)) * chartH;
          return (
            <g key={tick}>
              <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="rgba(6,182,212,0.06)" strokeWidth="0.5" />
              <text x={padLeft - 5} y={y + 3} fill="rgba(6,182,212,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">
                ${(tick / 1000000).toFixed(1)}M
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 30, 60, 90].map((day) => (
          <text
            key={day}
            x={padLeft + (day / 90) * chartW}
            y={padTop + chartH + 16}
            fill="rgba(6,182,212,0.25)"
            fontSize="8"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {day === 0 ? "90d ago" : day === 90 ? "Today" : `${90 - day}d`}
          </text>
        ))}

        {/* Area fill */}
        {pointsVisible > 1 && (
          <path d={areaPath} fill="url(#citadel-terrain-fill)" />
        )}

        {/* Line */}
        {pointsVisible > 1 && (
          <path d={linePath} fill="none" stroke="#06B6D4" strokeWidth="1.5" filter="url(#citadel-line-glow)" />
        )}

        {/* Current point */}
        {pointsVisible > 1 && (
          <circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r="3"
            fill="#06B6D4"
            filter="url(#citadel-line-glow)"
            className="citadel-blip-pulse"
          />
        )}
      </svg>
    </div>
  );
}

// =============================================================================
// ASSET READOUT GAUGES
// =============================================================================

function AssetGauges() {
  const show = useMounted(500);

  return (
    <div
      className="flex gap-3 items-end justify-center h-full px-3 py-4"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateX(0)" : "translateX(20px)",
        transition: "all 0.8s ease-out 0.2s",
      }}
    >
      {ASSETS.map((asset, i) => (
        <SingleGauge key={asset.id} asset={asset} delay={i * 150} />
      ))}
    </div>
  );
}

function SingleGauge({ asset, delay }: { asset: Asset; delay: number }) {
  const fillHeight = useAnimatedValue(asset.allocation, 1800, 600 + delay);

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 40 }}>
      {/* Blinking indicator */}
      <div
        className="citadel-blink-light"
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: asset.color,
          boxShadow: `0 0 6px ${asset.color}`,
        }}
      />

      {/* Value */}
      <span className="text-[8px] text-white/80 tabular-nums" style={{ fontFamily: "monospace" }}>
        ${(asset.value / 1000).toFixed(0)}K
      </span>

      {/* Gauge bar */}
      <div
        className="relative w-5 rounded-sm overflow-hidden"
        style={{
          height: 120,
          background: "rgba(6,182,212,0.04)",
          border: `1px solid ${asset.color}20`,
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-sm"
          style={{
            height: `${fillHeight}%`,
            background: `linear-gradient(to top, ${asset.color}40, ${asset.color}90)`,
            boxShadow: `inset 0 0 10px ${asset.color}30, 0 0 8px ${asset.color}20`,
            transition: "none",
          }}
        />
        {/* Percentage label */}
        <span
          className="absolute left-1/2 text-[7px] text-white/70 tabular-nums"
          style={{
            fontFamily: "monospace",
            bottom: `${Math.max(fillHeight - 8, 2)}%`,
            transform: "translateX(-50%)",
          }}
        >
          {Math.round(fillHeight)}%
        </span>
      </div>

      {/* Asset name */}
      <span className="text-[7px] tracking-wider text-cyan-400/50 uppercase" style={{ fontFamily: "monospace" }}>
        {asset.ticker}
      </span>
    </div>
  );
}

// =============================================================================
// THREAT MATRIX
// =============================================================================

function ThreatMatrix() {
  const show = useMounted(600);
  const rows = Object.keys(THREAT_MATRIX);
  const cols = ["Treasuries", "Real Estate", "Credit", "Commodities"];

  return (
    <div
      className="flex flex-col gap-2 p-3 h-full"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease-out",
      }}
    >
      <span className="text-[9px] tracking-[0.2em] text-cyan-400/50 uppercase mb-1" style={{ fontFamily: "monospace" }}>
        Threat Assessment
      </span>

      {/* Column headers */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${cols.length}, 1fr)` }}>
        <div />
        {cols.map((col) => (
          <span key={col} className="text-[7px] text-cyan-400/40 text-center truncate" style={{ fontFamily: "monospace" }}>
            {col.slice(0, 5).toUpperCase()}
          </span>
        ))}
      </div>

      {/* Grid rows */}
      {rows.map((row, ri) => (
        <div key={row} className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${cols.length}, 1fr)` }}>
          <span className="text-[7px] text-cyan-400/40 flex items-center" style={{ fontFamily: "monospace" }}>
            {row.toUpperCase()}
          </span>
          {cols.map((col, ci) => {
            const risk = THREAT_MATRIX[row][col];
            const color = RISK_COLORS[risk];
            const staggerDelay = (ri * cols.length + ci) * 80;
            return (
              <ThreatCell key={col} color={color} risk={risk} delay={staggerDelay + 700} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ThreatCell({ color, risk, delay }: { color: string; risk: string; delay: number }) {
  const show = useMounted(delay);

  return (
    <div
      className="rounded-sm flex items-center justify-center citadel-threat-pulse"
      style={{
        height: 28,
        background: show ? `${color}18` : "transparent",
        border: show ? `1px solid ${color}30` : "1px solid transparent",
        boxShadow: show ? `0 0 8px ${color}15` : "none",
        transition: "all 0.4s ease-out",
        ["--pulse-color" as string]: `${color}25`,
      }}
    >
      {show && (
        <span className="text-[7px] uppercase" style={{ fontFamily: "monospace", color: `${color}CC` }}>
          {risk}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// YIELD OPERATIONS
// =============================================================================

function YieldOperations() {
  const show = useMounted(700);

  return (
    <div
      className="flex flex-col gap-2 p-3 h-full"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease-out",
      }}
    >
      <span className="text-[9px] tracking-[0.2em] text-cyan-400/50 uppercase mb-1" style={{ fontFamily: "monospace" }}>
        Yield Operations
      </span>

      <div className="flex flex-col gap-2 flex-1 justify-center">
        {ASSETS.map((asset, i) => (
          <YieldBar key={asset.id} asset={asset} delay={i * 200 + 800} />
        ))}
      </div>
    </div>
  );
}

function YieldBar({ asset, delay }: { asset: Asset; delay: number }) {
  const barWidth = useAnimatedValue(asset.apy * 10, 1500, delay);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] text-cyan-400/50 w-8 text-right" style={{ fontFamily: "monospace" }}>
        {asset.ticker}
      </span>
      <div className="flex-1 relative h-4 rounded-sm overflow-hidden" style={{ background: "rgba(6,182,212,0.04)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-sm citadel-bar-pulse"
          style={{
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${asset.color}50, ${asset.color}90)`,
            boxShadow: `0 0 10px ${asset.color}20`,
            ["--bar-color" as string]: asset.color,
          }}
        />
      </div>
      <span className="text-[8px] text-white/70 w-10 tabular-nums" style={{ fontFamily: "monospace" }}>
        {asset.apy}% APY
      </span>
    </div>
  );
}

// =============================================================================
// CAPITAL FLOW
// =============================================================================

function CapitalFlow() {
  const show = useMounted(800);
  const svgW = 260;
  const svgH = 170;

  const totalAlloc = ASSETS.reduce((s, a) => s + a.allocation, 0);
  const channelGap = 6;
  const availableH = svgH - 40 - (ASSETS.length - 1) * channelGap;

  let yOffset = 20;
  const channels = ASSETS.map((asset) => {
    const h = Math.max((asset.allocation / totalAlloc) * availableH, 8);
    const channel = { asset, y: yOffset, h };
    yOffset += h + channelGap;
    return channel;
  });

  return (
    <div
      className="flex flex-col p-3 h-full"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease-out",
      }}
    >
      <span className="text-[9px] tracking-[0.2em] text-cyan-400/50 uppercase mb-2" style={{ fontFamily: "monospace" }}>
        Capital Flow
      </span>

      <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
        {/* Source label */}
        <text x="8" y="14" fill="rgba(6,182,212,0.4)" fontSize="8" fontFamily="monospace">DEPOSITS</text>
        {/* Destination label */}
        <text x={svgW - 8} y="14" fill="rgba(6,182,212,0.4)" fontSize="8" fontFamily="monospace" textAnchor="end">YIELD</text>

        {/* Source box */}
        <rect x="5" y="18" width="30" height={svgH - 38} rx="2" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.1)" strokeWidth="0.5" />

        {/* Destination box */}
        <rect x={svgW - 35} y="18" width="30" height={svgH - 38} rx="2" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.1)" strokeWidth="0.5" />

        {/* Flow channels */}
        {channels.map(({ asset, y, h }) => {
          const srcX = 35;
          const dstX = svgW - 35;
          const midX1 = srcX + 40;
          const midX2 = dstX - 40;

          return (
            <g key={asset.id}>
              {/* Channel background */}
              <path
                d={`M ${srcX} ${y} C ${midX1} ${y}, ${midX2} ${y}, ${dstX} ${y} L ${dstX} ${y + h} C ${midX2} ${y + h}, ${midX1} ${y + h}, ${srcX} ${y + h} Z`}
                fill={`${asset.color}12`}
                stroke={`${asset.color}30`}
                strokeWidth="0.5"
              />

              {/* Animated flow dashes */}
              <line
                x1={srcX}
                y1={y + h / 2}
                x2={dstX}
                y2={y + h / 2}
                stroke={asset.color}
                strokeWidth="1"
                strokeDasharray="4 8"
                opacity="0.5"
                className="citadel-flow-dash"
              />

              {/* Asset label */}
              <text
                x={svgW / 2}
                y={y + h / 2 + 3}
                fill={`${asset.color}90`}
                fontSize="7"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {asset.ticker}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// =============================================================================
// INTEL FEED
// =============================================================================

function IntelFeed() {
  const show = useMounted(900);
  const events = useIntelFeed();

  const typeColors: Record<string, string> = {
    YIELD_ACCRUAL: "#10B981",
    REBALANCE: "#06B6D4",
    ORACLE_UPDATE: "#8B5CF6",
    POSITION_SYNC: "#F59E0B",
  };

  return (
    <div
      className="flex flex-col p-3 h-full overflow-hidden"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease-out",
      }}
    >
      <span className="text-[9px] tracking-[0.2em] text-cyan-400/50 uppercase mb-2" style={{ fontFamily: "monospace" }}>
        Intel Feed
      </span>

      <div
        className="flex-1 overflow-hidden flex flex-col gap-[2px]"
        style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "6px 8px" }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="citadel-intel-entry"
            style={{ fontFamily: "monospace", fontSize: 8, lineHeight: "14px" }}
          >
            <span style={{ color: "rgba(6,182,212,0.35)" }}>[{event.timestamp}]</span>{" "}
            <span style={{ color: typeColors[event.type] ?? "#06B6D4" }}>{event.type}</span>{" "}
            <span style={{ color: "rgba(16,185,129,0.7)" }}>{event.message}</span>
          </div>
        ))}

        {/* Terminal cursor */}
        <div className="mt-1" style={{ fontFamily: "monospace", fontSize: 8 }}>
          <span style={{ color: "rgba(6,182,212,0.4)" }}>{">"}</span>
          <span className="citadel-cursor" style={{ color: "#06B6D4" }}>_</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PANEL WRAPPER
// =============================================================================

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "rgba(6,182,212,0.02)",
        border: "1px solid rgba(6,182,212,0.08)",
        borderRadius: 6,
        boxShadow: "inset 0 1px 0 rgba(6,182,212,0.04), 0 0 20px rgba(6,182,212,0.02)",
      }}
    >
      {/* Corner accent - top left */}
      <div
        className="absolute top-0 left-0 w-3 h-3"
        style={{
          borderTop: "1px solid rgba(6,182,212,0.2)",
          borderLeft: "1px solid rgba(6,182,212,0.2)",
          borderRadius: "6px 0 0 0",
        }}
      />
      {/* Corner accent - top right */}
      <div
        className="absolute top-0 right-0 w-3 h-3"
        style={{
          borderTop: "1px solid rgba(6,182,212,0.2)",
          borderRight: "1px solid rgba(6,182,212,0.2)",
          borderRadius: "0 6px 0 0",
        }}
      />
      {children}
    </div>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function CitadelCommandDashboard() {
  return (
    <div className="min-h-screen w-full" style={{ background: "#020810", color: "white" }}>
      <style>{`
        @keyframes citadelRadarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes citadelScanline {
          from { left: -30%; }
          to { left: 100%; }
        }
        @keyframes citadelBlinkLight {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes citadelFlowDash {
          to { stroke-dashoffset: -24; }
        }
        @keyframes citadelCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes citadelThreatPulse {
          0%, 100% { box-shadow: 0 0 4px var(--pulse-color, transparent); }
          50% { box-shadow: 0 0 12px var(--pulse-color, transparent); }
        }
        @keyframes citadelBarPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes citadelIntelSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .citadel-scanline-bar {
          animation: citadelScanline 6s ease-in-out infinite;
        }
        .citadel-blink-light {
          animation: citadelBlinkLight 2s ease-in-out infinite;
        }
        .citadel-blip-pulse {
          animation: citadelBlinkLight 3s ease-in-out infinite;
        }
        .citadel-flow-dash {
          animation: citadelFlowDash 1.5s linear infinite;
        }
        .citadel-cursor {
          animation: citadelCursor 1s step-end infinite;
        }
        .citadel-threat-pulse {
          animation: citadelThreatPulse 4s ease-in-out infinite;
        }
        .citadel-bar-pulse {
          animation: citadelBarPulse 3s ease-in-out infinite;
        }
        .citadel-intel-entry {
          animation: citadelIntelSlide 0.3s ease-out;
        }
      `}</style>

      {/* Command Bar */}
      <CommandBar />

      {/* Main Grid */}
      <div className="p-3 grid gap-3" style={{ gridTemplateColumns: "250px 1fr 180px", gridTemplateRows: "260px 220px" }}>
        {/* Row 1: Radar | Terrain | Gauges */}
        <Panel>
          <RadarSweep />
        </Panel>

        <Panel>
          <PortfolioTerrain />
        </Panel>

        <Panel>
          <AssetGauges />
        </Panel>

        {/* Row 2: Threat | Yield | Flow | Intel */}
        <Panel>
          <ThreatMatrix />
        </Panel>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Panel>
            <YieldOperations />
          </Panel>
          <Panel>
            <CapitalFlow />
          </Panel>
        </div>

        <Panel>
          <IntelFeed />
        </Panel>
      </div>
    </div>
  );
}
