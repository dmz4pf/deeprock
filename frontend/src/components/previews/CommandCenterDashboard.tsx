"use client";

import { useEffect, useState, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND CENTER DASHBOARD
// CyberX-inspired with flowing data visualization. Serious. Technical. Precise.
// ═══════════════════════════════════════════════════════════════════════════════

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
    return () => { startTime.current = null; };
  }, [target, duration]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL HUB - The commanding visualization
// ─────────────────────────────────────────────────────────────────────────────
function CentralHub({ value }: { value: number }) {
  const animatedValue = useAnimatedValue(value, 2500);

  return (
    <div className="relative w-48 h-48">
      {/* Outer ring pulse */}
      <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '3s' }} />

      {/* Middle ring */}
      <div className="absolute inset-2 rounded-full border border-cyan-500/10" />

      {/* Inner content */}
      <div
        className="absolute inset-4 rounded-full flex flex-col items-center justify-center"
        style={{
          background: "radial-gradient(circle at center, rgba(6,182,212,0.08) 0%, rgba(10,20,40,0.95) 70%)",
          border: "1px solid rgba(6,182,212,0.2)",
          boxShadow: "0 0 60px rgba(6,182,212,0.15), inset 0 0 40px rgba(6,182,212,0.05)"
        }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/60 mb-1">Total Value</span>
        <span
          className="text-2xl font-light text-white tabular-nums"
          style={{ textShadow: "0 0 30px rgba(6,182,212,0.5)" }}
        >
          ${(animatedValue / 1000000).toFixed(2)}M
        </span>
      </div>

      {/* Rotating indicator */}
      <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
        <circle
          cx="96"
          cy="96"
          r="90"
          fill="none"
          stroke="url(#hubGradient)"
          strokeWidth="1"
          strokeDasharray="8 20"
          opacity="0.4"
        />
        <defs>
          <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="1" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOWING DATA LINE - SVG animated connection
// ─────────────────────────────────────────────────────────────────────────────
function FlowLine({
  startX, startY, endX, endY, color, delay = 0
}: {
  startX: number; startY: number; endX: number; endY: number; color: string; delay?: number;
}) {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const controlOffset = Math.abs(endY - startY) * 0.4;

  const path = `M ${startX} ${startY} Q ${midX} ${startY + controlOffset}, ${endX} ${endY}`;

  return (
    <>
      {/* Static path */}
      <path d={path} fill="none" stroke={`${color}15`} strokeWidth="1" />

      {/* Animated flow */}
      <path
        d={path}
        fill="none"
        stroke={`url(#flow-${delay})`}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient id={`flow-${delay}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent">
            <animate attributeName="offset" values="-0.3;1" dur="2s" repeatCount="indefinite" begin={`${delay}s`} />
          </stop>
          <stop offset="20%" stopColor={color}>
            <animate attributeName="offset" values="-0.1;1.2" dur="2s" repeatCount="indefinite" begin={`${delay}s`} />
          </stop>
          <stop offset="40%" stopColor="transparent">
            <animate attributeName="offset" values="0.1;1.4" dur="2s" repeatCount="indefinite" begin={`${delay}s`} />
          </stop>
        </linearGradient>
      </defs>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSET NODE - Endpoint in the flow visualization
// ─────────────────────────────────────────────────────────────────────────────
function AssetNode({
  label, value, apy, color, position
}: {
  label: string; value: number; apy: number; color: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const positionStyles = {
    "top-left": "top-8 left-8",
    "top-right": "top-8 right-8",
    "bottom-left": "bottom-8 left-8",
    "bottom-right": "bottom-8 right-8"
  };

  return (
    <div className={`absolute ${positionStyles[position]} w-40`}>
      <div
        className="p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]"
        style={{
          background: `linear-gradient(135deg, ${color}08 0%, rgba(10,20,40,0.9) 100%)`,
          border: `1px solid ${color}20`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${color}10`
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
          <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
        </div>
        <p className="text-lg font-medium text-white tabular-nums">${(value / 1000).toFixed(0)}K</p>
        <p className="text-xs mt-1" style={{ color }}>{apy}% APY</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS INDICATOR - System health display
// ─────────────────────────────────────────────────────────────────────────────
function StatusIndicator({ label, status, value }: { label: string; status: "online" | "syncing" | "offline"; value?: string }) {
  const statusColors = {
    online: { bg: "bg-emerald-500", text: "text-emerald-400" },
    syncing: { bg: "bg-amber-500", text: "text-amber-400" },
    offline: { bg: "bg-red-500", text: "text-red-400" }
  };

  const c = statusColors[status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${c.bg}`} />
          {status === "online" && (
            <div className={`absolute inset-0 w-2 h-2 rounded-full ${c.bg} animate-ping`} />
          )}
        </div>
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <span className={`text-sm font-mono ${c.text}`}>{value || status.toUpperCase()}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT BLOCK - Minimal stat display
// ─────────────────────────────────────────────────────────────────────────────
function StatBlock({ label, value, change }: { label: string; value: string; change?: number }) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1">{label}</p>
      <p className="text-xl font-light text-white tabular-nums">{value}</p>
      {change !== undefined && (
        <p className={`text-xs mt-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTION LOG - Real-time feed
// ─────────────────────────────────────────────────────────────────────────────
function TransactionLog() {
  const transactions = [
    { type: "DEPOSIT", asset: "Treasury Fund", amount: "+$50,000", time: "14:32:18", status: "confirmed" },
    { type: "YIELD", asset: "RE Partners", amount: "+$1,247", time: "09:00:00", status: "confirmed" },
    { type: "DEPOSIT", asset: "Credit Pool", amount: "+$25,000", time: "Yesterday", status: "confirmed" },
  ];

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-2 px-3 rounded-md hover:bg-white/[0.02] transition-colors font-mono text-xs"
        >
          <span className="text-cyan-400/60 w-16">{tx.time}</span>
          <span className="text-white/40 w-16">{tx.type}</span>
          <span className="text-white/60 flex-1 truncate">{tx.asset}</span>
          <span className="text-emerald-400 w-20 text-right">{tx.amount}</span>
          <span className="text-emerald-400/60 w-20 text-right uppercase text-[10px]">{tx.status}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function CommandCenterDashboard() {
  const assets = [
    { label: "Treasuries", value: 875000, apy: 5.2, color: "#06B6D4", position: "top-left" as const },
    { label: "Real Estate", value: 650000, apy: 7.8, color: "#8B5CF6", position: "top-right" as const },
    { label: "Credit", value: 525000, apy: 9.4, color: "#10B981", position: "bottom-left" as const },
    { label: "Commodities", value: 450000, apy: 3.8, color: "#F59E0B", position: "bottom-right" as const },
  ];

  // Calculate flow line coordinates based on center (400, 250) and asset positions
  const flowCoords = useMemo(() => [
    { startX: 130, startY: 120, endX: 320, endY: 200, color: "#06B6D4", delay: 0 },
    { startX: 670, startY: 120, endX: 480, endY: 200, color: "#8B5CF6", delay: 0.5 },
    { startX: 130, startY: 380, endX: 320, endY: 300, color: "#10B981", delay: 1 },
    { startX: 670, startY: 380, endX: 480, endY: 300, color: "#F59E0B", delay: 1.5 },
  ], []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #030810 0%, #061018 50%, #030810 100%)" }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(6,182,212,0.04) 0%, transparent 60%)",
            filter: "blur(80px)"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/70">System Online</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-lg font-medium text-white">Deeprock Command Center</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>Block: 18,247,931</span>
              <span>|</span>
              <span>Gas: 24 gwei</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-xs font-mono text-white/60">0x7f3a...8b2c</span>
            </div>
          </div>
        </header>

        {/* Stats Strip */}
        <div
          className="flex items-center justify-between px-8 py-4 rounded-lg mb-8"
          style={{
            background: "linear-gradient(90deg, rgba(6,182,212,0.03) 0%, rgba(10,20,40,0.5) 50%, rgba(6,182,212,0.03) 100%)",
            border: "1px solid rgba(6,182,212,0.1)"
          }}
        >
          <StatBlock label="Total Value" value="$2.50M" change={12.4} />
          <div className="w-px h-10 bg-white/5" />
          <StatBlock label="Cost Basis" value="$2.22M" />
          <div className="w-px h-10 bg-white/5" />
          <StatBlock label="Unrealized P&L" value="+$280K" change={12.6} />
          <div className="w-px h-10 bg-white/5" />
          <StatBlock label="Avg Yield" value="6.4%" />
          <div className="w-px h-10 bg-white/5" />
          <StatBlock label="Positions" value="4" />
        </div>

        {/* Main Visualization */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Flow Diagram */}
          <div
            className="col-span-2 relative h-[500px] rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(10,20,40,0.8) 100%)",
              border: "1px solid rgba(6,182,212,0.08)"
            }}
          >
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />

            {/* Flow lines */}
            <svg className="absolute inset-0 w-full h-full">
              {flowCoords.map((coords, i) => (
                <FlowLine key={i} {...coords} />
              ))}
            </svg>

            {/* Central hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <CentralHub value={2500000} />
            </div>

            {/* Asset nodes */}
            {assets.map((asset, i) => (
              <AssetNode key={i} {...asset} />
            ))}
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* System Status */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(10,20,40,0.8) 100%)",
                border: "1px solid rgba(6,182,212,0.08)"
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 mb-3">System Status</p>
              <StatusIndicator label="Blockchain" status="online" value="Avalanche" />
              <StatusIndicator label="Oracle Feed" status="online" value="Chainlink" />
              <StatusIndicator label="Yield Sync" status="syncing" value="12 sec" />
              <StatusIndicator label="KYC Status" status="online" value="Verified" />
            </div>

            {/* Wallet */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(10,20,40,0.8) 100%)",
                border: "1px solid rgba(6,182,212,0.08)"
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 mb-3">Wallet Balance</p>
              <p className="text-2xl font-light text-white mb-1">$10,000.00</p>
              <p className="text-xs text-white/30">USDC Available</p>
              <button
                className="w-full mt-4 py-2.5 rounded-md text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-400/10"
                style={{ border: "1px solid rgba(6,182,212,0.3)" }}
              >
                Deposit Funds
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Log */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(10,20,40,0.8) 100%)",
            border: "1px solid rgba(6,182,212,0.08)"
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/50">Transaction Log</p>
            <button className="text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors">View All →</button>
          </div>
          <TransactionLog />
        </div>
      </div>
    </div>
  );
}
