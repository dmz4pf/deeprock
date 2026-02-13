"use client";

import { useEffect, useState, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// NEXUS FLOW DASHBOARD
// Pure CyberX aesthetic - flowing data streams, cyber precision, dark authority
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
// ANIMATED DATA STREAM - The signature flowing lines
// ─────────────────────────────────────────────────────────────────────────────
function DataStream({
  path,
  color,
  delay = 0,
  duration = 3
}: {
  path: string;
  color: string;
  delay?: number;
  duration?: number;
}) {
  const id = `stream-${delay}-${color.replace('#', '')}`;

  return (
    <g>
      {/* Base path - faint static line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.08"
      />

      {/* Animated particle stream */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="2"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="1000"
          to="0"
          dur={`${duration}s`}
          repeatCount="indefinite"
          begin={`${delay}s`}
        />
      </path>

      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="20%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="80%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXUS CORE - Central hub with pulsing rings
// ─────────────────────────────────────────────────────────────────────────────
function NexusCore({ value }: { value: number }) {
  const animatedValue = useAnimatedValue(value, 2500);

  return (
    <div className="relative">
      {/* Outer pulse rings */}
      <div className="absolute -inset-8">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: '1px solid rgba(6,182,212,0.1)',
            animationDuration: '3s'
          }}
        />
      </div>
      <div className="absolute -inset-4">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: '1px solid rgba(6,182,212,0.15)',
            animationDuration: '2.5s',
            animationDelay: '0.5s'
          }}
        />
      </div>

      {/* Core */}
      <div
        className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(6,182,212,0.15) 0%, rgba(6,20,40,0.98) 70%)',
          boxShadow: '0 0 100px rgba(6,182,212,0.2), inset 0 0 60px rgba(6,182,212,0.08)',
          border: '1px solid rgba(6,182,212,0.2)'
        }}
      >
        {/* Rotating ring */}
        <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '30s' }}>
          <circle
            cx="104"
            cy="104"
            r="100"
            fill="none"
            stroke="url(#nexusRing)"
            strokeWidth="2"
            strokeDasharray="10 30 50 30"
          />
          <defs>
            <linearGradient id="nexusRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/50 mb-2">Portfolio Value</span>
        <span
          className="text-4xl font-extralight text-white tabular-nums tracking-tight"
          style={{ textShadow: '0 0 40px rgba(6,182,212,0.5)' }}
        >
          ${(animatedValue / 1000000).toFixed(2)}M
        </span>
        <span className="text-sm text-emerald-400 mt-2 font-medium">+12.47%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSET TERMINAL - Data terminal style asset display
// ─────────────────────────────────────────────────────────────────────────────
function AssetTerminal({
  name,
  value,
  apy,
  allocation,
  color,
  isActive = true
}: {
  name: string;
  value: number;
  apy: number;
  allocation: number;
  color: string;
  isActive?: boolean;
}) {
  return (
    <div
      className="group relative p-4 rounded-lg transition-all duration-300 hover:translate-x-1"
      style={{
        background: `linear-gradient(135deg, ${color}06 0%, rgba(6,20,40,0.9) 100%)`,
        border: `1px solid ${color}15`,
        boxShadow: `0 0 30px ${color}08`
      }}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`}>
          {isActive && <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
        </div>
      </div>

      {/* Asset name */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-6 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}
        />
        <span className="text-sm font-medium text-white">{name}</span>
      </div>

      {/* Value */}
      <p className="text-2xl font-light text-white tabular-nums mb-1">
        ${(value / 1000).toFixed(0)}K
      </p>

      {/* Metrics row */}
      <div className="flex items-center gap-4 text-xs">
        <span style={{ color }}>{apy}% APY</span>
        <span className="text-white/30">|</span>
        <span className="text-white/40">{allocation}% allocation</span>
      </div>

      {/* Hover accent */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM METRICS BAR
// ─────────────────────────────────────────────────────────────────────────────
function SystemMetric({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="text-center px-6">
      <p className="text-[9px] uppercase tracking-[0.25em] text-cyan-400/40 mb-1">{label}</p>
      <p className="text-lg font-light text-white tabular-nums">{value}</p>
      {sublabel && <p className="text-[10px] text-white/20 mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE FEED
// ─────────────────────────────────────────────────────────────────────────────
function LiveFeed() {
  const events = [
    { time: '14:32:18', type: 'YIELD', message: 'Treasury Fund distributed $847.32', status: 'success' },
    { time: '14:30:00', type: 'SYNC', message: 'Oracle price feed updated', status: 'info' },
    { time: '14:28:45', type: 'TX', message: 'Deposit confirmed: $50,000 USDC', status: 'success' },
    { time: '14:25:12', type: 'YIELD', message: 'Credit Pool accrued $124.58', status: 'success' },
  ];

  return (
    <div className="space-y-1">
      {events.map((event, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2 px-3 rounded font-mono text-xs hover:bg-cyan-400/5 transition-colors"
        >
          <span className="text-cyan-400/40 w-14">{event.time}</span>
          <span className={`w-12 ${
            event.type === 'YIELD' ? 'text-emerald-400' :
            event.type === 'TX' ? 'text-blue-400' :
            'text-cyan-400/60'
          }`}>{event.type}</span>
          <span className="text-white/50 flex-1">{event.message}</span>
          <span className={`w-2 h-2 rounded-full ${
            event.status === 'success' ? 'bg-emerald-400' : 'bg-cyan-400'
          }`} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function NexusFlowDashboard() {
  const assets = [
    { name: 'US Treasury Fund', value: 875000, apy: 5.2, allocation: 35, color: '#06B6D4' },
    { name: 'Real Estate Partners', value: 700000, apy: 7.8, allocation: 28, color: '#8B5CF6' },
    { name: 'Private Credit Pool', value: 550000, apy: 9.4, allocation: 22, color: '#10B981' },
    { name: 'Commodity Index', value: 375000, apy: 3.8, allocation: 15, color: '#F59E0B' },
  ];

  // SVG flow paths - elegant curves connecting to center
  const flowPaths = [
    { path: 'M 80 150 Q 200 150 280 250', color: '#06B6D4', delay: 0 },
    { path: 'M 80 280 Q 200 280 280 250', color: '#8B5CF6', delay: 0.75 },
    { path: 'M 80 410 Q 200 350 280 280', color: '#10B981', delay: 1.5 },
    { path: 'M 80 540 Q 200 450 280 300', color: '#F59E0B', delay: 2.25 },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #020608 0%, #040A10 50%, #020608 100%)' }}
    >
      {/* Subtle ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.05) 0%, transparent 60%)',
            filter: 'blur(100px)'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-50" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.3em] text-cyan-400/80 font-medium">Connected</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="text-xl font-light text-white tracking-wide">Nexus Flow</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[11px] text-white/30 font-mono">
              <span>AVAX C-Chain</span>
              <span className="text-white/10">|</span>
              <span>Block 48,291,847</span>
            </div>
            <div
              className="px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(6,182,212,0.05)',
                border: '1px solid rgba(6,182,212,0.15)'
              }}
            >
              <span className="text-xs font-mono text-white/60">0x7f3a...8b2c</span>
            </div>
          </div>
        </header>

        {/* System Metrics */}
        <div
          className="flex items-center justify-between py-4 px-2 rounded-xl mb-10"
          style={{
            background: 'linear-gradient(90deg, rgba(6,182,212,0.03) 0%, transparent 50%, rgba(6,182,212,0.03) 100%)',
            borderTop: '1px solid rgba(6,182,212,0.08)',
            borderBottom: '1px solid rgba(6,182,212,0.08)'
          }}
        >
          <SystemMetric label="Total Value Locked" value="$2.50M" />
          <div className="h-8 w-px bg-white/5" />
          <SystemMetric label="Cost Basis" value="$2.22M" />
          <div className="h-8 w-px bg-white/5" />
          <SystemMetric label="Unrealized P&L" value="+$280K" sublabel="+12.6%" />
          <div className="h-8 w-px bg-white/5" />
          <SystemMetric label="Weighted APY" value="6.4%" />
          <div className="h-8 w-px bg-white/5" />
          <SystemMetric label="Active Positions" value="4" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left - Asset List */}
          <div className="col-span-4 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">Asset Terminals</p>
            {assets.map((asset, i) => (
              <AssetTerminal key={i} {...asset} isActive={i !== 3} />
            ))}
          </div>

          {/* Center - Nexus Visualization */}
          <div
            className="col-span-5 relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(6,20,40,0.6) 100%)',
              border: '1px solid rgba(6,182,212,0.06)'
            }}
          >
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6,182,212,1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px'
              }}
            />

            {/* Data streams SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 600" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g filter="url(#glow)">
                {flowPaths.map((flow, i) => (
                  <DataStream key={i} {...flow} duration={2.5} />
                ))}
              </g>
            </svg>

            {/* Central Nexus */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-x-6">
              <NexusCore value={2500000} />
            </div>
          </div>

          {/* Right - Live Feed & Actions */}
          <div className="col-span-3 space-y-6">
            {/* Quick Actions */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(6,182,212,0.02)',
                border: '1px solid rgba(6,182,212,0.08)'
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/40 mb-3">Quick Actions</p>
              <div className="space-y-2">
                <button
                  className="w-full py-3 rounded-lg text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-400/10"
                  style={{ border: '1px solid rgba(6,182,212,0.3)' }}
                >
                  Deposit USDC
                </button>
                <button
                  className="w-full py-3 rounded-lg text-sm font-medium text-white/40 transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Withdraw Funds
                </button>
              </div>
            </div>

            {/* Live Feed */}
            <div
              className="p-4 rounded-xl flex-1"
              style={{
                background: 'rgba(6,182,212,0.02)',
                border: '1px solid rgba(6,182,212,0.08)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/40">Live Feed</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400/60">LIVE</span>
                </div>
              </div>
              <LiveFeed />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/[0.03] flex items-center justify-between">
          <span className="text-[10px] text-white/20 tracking-wider">DEEPROCK · INSTITUTIONAL-GRADE TOKENIZED ASSETS</span>
          <span className="text-[10px] text-white/10">Built on Avalanche</span>
        </footer>
      </div>
    </div>
  );
}
