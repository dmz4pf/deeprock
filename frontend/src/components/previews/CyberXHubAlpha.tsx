"use client";

import { useEffect, useState, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// CYBERX HUB ALPHA
// Command center with central hub and orbital asset nodes connected by
// animated flowing data lines. The signature feature is the SVG bezier paths
// with stroke-dashoffset animations flowing toward the center.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED VALUE HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useAnimatedValue(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    return () => {
      startTime.current = null;
    };
  }, [target, duration]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface AssetData {
  label: string;
  value: number;
  apy: number;
  color: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYFRAME STYLES
// ─────────────────────────────────────────────────────────────────────────────
function AnimationStyles() {
  return (
    <style>{`
      @keyframes flowToCenter {
        to { stroke-dashoffset: -40; }
      }
      @keyframes flowToCenterSlow {
        to { stroke-dashoffset: -60; }
      }
      @keyframes rotateRing {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes hubPulse {
        0%, 100% { opacity: 0.15; transform: scale(1); }
        50% { opacity: 0.25; transform: scale(1.03); }
      }
      @keyframes subtleGlow {
        0%, 100% { filter: drop-shadow(0 0 8px rgba(6,182,212,0.2)); }
        50% { filter: drop-shadow(0 0 16px rgba(6,182,212,0.35)); }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .flow-line-1 { animation: flowToCenter 2s linear infinite; }
      .flow-line-2 { animation: flowToCenter 2.5s linear infinite; }
      .flow-line-3 { animation: flowToCenter 3s linear infinite; }
      .flow-line-4 { animation: flowToCenter 3.5s linear infinite; }
      .flow-line-1-deep { animation: flowToCenterSlow 3s linear infinite; }
      .flow-line-2-deep { animation: flowToCenterSlow 3.5s linear infinite; }
      .flow-line-3-deep { animation: flowToCenterSlow 4s linear infinite; }
      .flow-line-4-deep { animation: flowToCenterSlow 4.5s linear infinite; }
      .rotate-ring { animation: rotateRing 30s linear infinite; }
      .hub-pulse { animation: hubPulse 4s ease-in-out infinite; }
      .subtle-glow { animation: subtleGlow 3s ease-in-out infinite; }
      .fade-in-up {
        animation: fadeInUp 0.6s ease-out both;
      }
      .fade-in-up-1 { animation-delay: 0.1s; }
      .fade-in-up-2 { animation-delay: 0.2s; }
      .fade-in-up-3 { animation-delay: 0.3s; }
      .fade-in-up-4 { animation-delay: 0.4s; }
      .fade-in-up-5 { animation-delay: 0.5s; }
    `}</style>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  change,
  delayClass,
}: {
  label: string;
  value: string;
  change?: { value: number; label: string };
  delayClass: string;
}) {
  return (
    <div
      className={`flex-1 px-5 py-4 rounded-lg fade-in-up ${delayClass}`}
      style={{
        background: "rgba(6,182,212,0.03)",
        border: "1px solid rgba(6,182,212,0.08)",
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-light text-[#EDF2FC] tabular-nums">
          {value}
        </span>
        {change && (
          <span
            className={`text-xs tabular-nums ${change.value >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {change.value >= 0 ? "+" : ""}
            {change.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA FLOW LINES - SVG bezier paths with dash animation
// ─────────────────────────────────────────────────────────────────────────────
function DataFlowLines({
  assets,
  centerX,
  centerY,
  nodePositions,
}: {
  assets: AssetData[];
  centerX: number;
  centerY: number;
  nodePositions: { x: number; y: number }[];
}) {
  const paths = useMemo(() => {
    return nodePositions.map((pos, i) => {
      const dx = centerX - pos.x;
      const dy = centerY - pos.y;

      // Control point: offset perpendicular to the line for a nice curve
      const cx1 = pos.x + dx * 0.4 + dy * 0.15;
      const cy1 = pos.y + dy * 0.2 - dx * 0.08;
      const cx2 = pos.x + dx * 0.7 - dy * 0.1;
      const cy2 = pos.y + dy * 0.8 + dx * 0.05;

      return `M ${pos.x} ${pos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${centerX} ${centerY}`;
    });
  }, [centerX, centerY, nodePositions]);

  return (
    <g>
      {paths.map((d, i) => (
        <g key={i}>
          {/* Static faint path for visibility */}
          <path
            d={d}
            fill="none"
            stroke={assets[i].color}
            strokeWidth="1"
            strokeOpacity="0.08"
          />

          {/* Primary animated flow */}
          <path
            d={d}
            fill="none"
            stroke={assets[i].color}
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="8 12"
            strokeLinecap="round"
            className={`flow-line-${i + 1}`}
          />

          {/* Deeper layer: larger dash pattern for depth */}
          <path
            d={d}
            fill="none"
            stroke={assets[i].color}
            strokeWidth="1"
            strokeOpacity="0.12"
            strokeDasharray="16 24"
            strokeLinecap="round"
            className={`flow-line-${i + 1}-deep`}
          />
        </g>
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL HUB - Concentric rings with value display
// ─────────────────────────────────────────────────────────────────────────────
function CentralHub({ value }: { value: number }) {
  const animatedValue = useAnimatedValue(value, 2500);
  const formatted = `$${(animatedValue / 1_000_000).toFixed(2)}M`;
  const r = 120;

  return (
    <g>
      {/* Hub gradient definitions */}
      <defs>
        <radialGradient id="hubCenterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(6,182,212,0.12)" />
          <stop offset="60%" stopColor="rgba(6,182,212,0.04)" />
          <stop offset="100%" stopColor="rgba(3,6,20,0.95)" />
        </radialGradient>
        <linearGradient id="dashRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
          <stop offset="30%" stopColor="#06B6D4" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
        <filter id="hubGlow">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outermost pulse ring */}
      <circle
        cx="0"
        cy="0"
        r={r + 8}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="1"
        className="hub-pulse"
      />

      {/* Outer dashed ring - rotating */}
      <g className="rotate-ring" style={{ transformOrigin: "0 0" }}>
        <circle
          cx="0"
          cy="0"
          r={r}
          fill="none"
          stroke="url(#dashRingGrad)"
          strokeWidth="1.5"
          strokeDasharray="6 14"
        />
      </g>

      {/* Middle solid ring */}
      <circle
        cx="0"
        cy="0"
        r={r - 16}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="0.5"
        strokeOpacity="0.25"
      />

      {/* Inner filled circle */}
      <circle
        cx="0"
        cy="0"
        r={r - 24}
        fill="url(#hubCenterGrad)"
        stroke="#06B6D4"
        strokeWidth="0.5"
        strokeOpacity="0.2"
        filter="url(#hubGlow)"
      />

      {/* Text: label */}
      <text
        x="0"
        y="-14"
        textAnchor="middle"
        fill="#06B6D4"
        fillOpacity="0.6"
        fontSize="10"
        fontFamily="sans-serif"
        letterSpacing="0.2em"
        style={{ textTransform: "uppercase" }}
      >
        TOTAL VALUE
      </text>

      {/* Text: value */}
      <text
        x="0"
        y="16"
        textAnchor="middle"
        fill="#EDF2FC"
        fontSize="28"
        fontFamily="sans-serif"
        fontWeight="300"
        className="subtle-glow"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatted}
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSET NODE - Glassmorphic card positioned around the hub
// ─────────────────────────────────────────────────────────────────────────────
function AssetNode({
  asset,
  x,
  y,
}: {
  asset: AssetData;
  x: number;
  y: number;
}) {
  const w = 170;
  const h = 90;

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      {/* Card background */}
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        rx="10"
        ry="10"
        fill="#0A1428"
        fillOpacity="0.85"
        stroke={asset.color}
        strokeWidth="0.8"
        strokeOpacity="0.2"
      />

      {/* Subtle inner glow */}
      <rect
        x="1"
        y="1"
        width={w - 2}
        height={h - 2}
        rx="9"
        ry="9"
        fill={`${asset.color}`}
        fillOpacity="0.03"
      />

      {/* Colored dot */}
      <circle cx="18" cy="22" r="4" fill={asset.color} fillOpacity="0.9">
        <animate
          attributeName="fill-opacity"
          values="0.6;1;0.6"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Asset name */}
      <text
        x="30"
        y="26"
        fill="#94A8C8"
        fontSize="10"
        fontFamily="sans-serif"
        letterSpacing="0.1em"
        style={{ textTransform: "uppercase" }}
      >
        {asset.label}
      </text>

      {/* Dollar value */}
      <text
        x="18"
        y="52"
        fill="#EDF2FC"
        fontSize="18"
        fontFamily="sans-serif"
        fontWeight="500"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        ${(asset.value / 1000).toFixed(0)}K
      </text>

      {/* APY */}
      <text
        x="18"
        y="74"
        fill={asset.color}
        fontSize="12"
        fontFamily="sans-serif"
      >
        {asset.apy}% APY
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM STATUS ROW
// ─────────────────────────────────────────────────────────────────────────────
function StatusRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
            style={{
              backgroundColor: color,
              animationDuration: "3s",
            }}
          />
        </div>
        <span className="text-sm text-[#94A8C8]">{label}</span>
      </div>
      <span className="text-sm font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function CyberXHubAlpha() {
  const svgRef = useRef<SVGSVGElement>(null);

  const assets: AssetData[] = useMemo(
    () => [
      { label: "Treasuries", value: 875000, apy: 5.2, color: "#06B6D4" },
      { label: "Real Estate", value: 650000, apy: 7.8, color: "#8B5CF6" },
      { label: "Credit", value: 600000, apy: 9.4, color: "#10B981" },
      { label: "Commodities", value: 375000, apy: 3.8, color: "#F59E0B" },
    ],
    [],
  );

  // SVG viewBox dimensions
  const vw = 800;
  const vh = 520;
  const cx = vw / 2;
  const cy = vh / 2;

  // Asset node positions: top-left, top-right, bottom-left, bottom-right
  const nodePositions = useMemo(
    () => [
      { x: 130, y: 110 },
      { x: vw - 130, y: 110 },
      { x: 130, y: vh - 110 },
      { x: vw - 130, y: vh - 110 },
    ],
    [vw, vh],
  );

  return (
    <div className="min-h-screen bg-[#030614] text-white font-sans">
      <AnimationStyles />

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(6,182,212,0.04) 0%, transparent 55%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-8 py-6">
        {/* ── TOP BAR ── */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400/80 font-medium">
                System Online
              </span>
            </div>
          </div>

          <span className="text-lg font-medium text-[#EDF2FC] tracking-wide">
            Deeprock Command Center
          </span>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 text-xs text-[#5A6F8E]">
              <span className="tabular-nums">Block: 19,247,831</span>
              <span>|</span>
              <span className="tabular-nums">Gas: 24 gwei</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08]">
              <span className="text-xs font-mono text-[#94A8C8]">
                0x7f3a...8b2c
              </span>
            </div>
          </div>
        </header>

        {/* ── STAT CARDS ROW ── */}
        <div className="flex gap-3 mb-6">
          <StatCard
            label="Total Value"
            value="$2.50M"
            change={{ value: 12.4, label: "12.4%" }}
            delayClass="fade-in-up-1"
          />
          <StatCard
            label="Cost Basis"
            value="$2.22M"
            delayClass="fade-in-up-2"
          />
          <StatCard
            label="Unrealized P&L"
            value="+$280K"
            change={{ value: 12.6, label: "12.6%" }}
            delayClass="fade-in-up-3"
          />
          <StatCard
            label="APY Yield"
            value="6.4%"
            delayClass="fade-in-up-4"
          />
          <StatCard
            label="Positions"
            value="4"
            delayClass="fade-in-up-5"
          />
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex gap-6">
          {/* Left: Hub Visualization */}
          <div
            className="flex-[2] rounded-xl overflow-hidden relative"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(3,6,20,0.9) 100%)",
              border: "1px solid rgba(6,182,212,0.08)",
            }}
          >
            {/* Background grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
                opacity: 0.03,
              }}
            />

            <svg
              ref={svgRef}
              viewBox={`0 0 ${vw} ${vh}`}
              className="w-full h-auto relative"
              style={{ minHeight: 480 }}
            >
              {/* Data flow lines */}
              <DataFlowLines
                assets={assets}
                centerX={cx}
                centerY={cy}
                nodePositions={nodePositions}
              />

              {/* Central hub */}
              <g transform={`translate(${cx}, ${cy})`}>
                <CentralHub value={2_500_000} />
              </g>

              {/* Asset nodes */}
              {assets.map((asset, i) => (
                <AssetNode
                  key={asset.label}
                  asset={asset}
                  x={nodePositions[i].x}
                  y={nodePositions[i].y}
                />
              ))}
            </svg>
          </div>

          {/* Right: System Status + Wallet */}
          <div className="flex-1 space-y-5 min-w-[280px] max-w-[340px]">
            {/* System Status */}
            <div
              className="p-5 rounded-xl fade-in-up fade-in-up-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(3,6,20,0.9) 100%)",
                border: "1px solid rgba(6,182,212,0.08)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 mb-3">
                System Status
              </p>
              <StatusRow
                label="Blockchain"
                value="Avalanche"
                color="#06B6D4"
              />
              <StatusRow
                label="Oracle Feed"
                value="Chainlink"
                color="#06B6D4"
              />
              <StatusRow
                label="Yield Sync"
                value="12 sec"
                color="#06B6D4"
              />
              <StatusRow
                label="KYC Status"
                value="Verified"
                color="#10B981"
              />
            </div>

            {/* Wallet Balance */}
            <div
              className="p-5 rounded-xl fade-in-up fade-in-up-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(3,6,20,0.9) 100%)",
                border: "1px solid rgba(6,182,212,0.08)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 mb-3">
                Wallet Balance
              </p>
              <p className="text-3xl font-light text-[#EDF2FC] tabular-nums mb-1">
                $10,000.00
              </p>
              <p className="text-xs text-[#5A6F8E] mb-5">USDC Available</p>
              <button
                className="w-full py-3 rounded-lg text-sm font-medium text-cyan-400 transition-all duration-200 hover:bg-cyan-400/10 active:scale-[0.98]"
                style={{
                  border: "1px solid rgba(6,182,212,0.3)",
                  boxShadow: "0 0 20px rgba(6,182,212,0.08)",
                }}
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
