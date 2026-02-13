"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// NEXUS FLOW ENHANCED DASHBOARD
// Institutional-grade wealth visualization with advanced data flow animations
// Premium CyberX aesthetic - precision engineering meets financial authority
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  name: string;
  ticker: string;
  value: number;
  costBasis: number;
  apy: number;
  allocation: number;
  color: string;
  status: "active" | "pending" | "paused";
  riskLevel: "low" | "medium" | "high";
  sparklineData: number[];
  lastUpdate: Date;
  dailyChange: number;
  weeklyChange: number;
}

interface LiveEvent {
  id: string;
  time: string;
  type: "YIELD" | "TX" | "SYNC" | "ALERT" | "REBALANCE";
  message: string;
  status: "success" | "info" | "warning" | "error";
  amount?: number;
}

interface PortfolioMetrics {
  totalValue: number;
  costBasis: number;
  unrealizedPnL: number;
  pnlPercentage: number;
  weightedApy: number;
  activePositions: number;
  pendingRewards: number;
  dailyYield: number;
  riskScore: number;
  healthScore: number;
}

interface NexusFlowEnhancedProps {
  assets?: Asset[];
  metrics?: PortfolioMetrics;
  events?: LiveEvent[];
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useAnimatedValue(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(0);

  useEffect(() => {
    startValue.current = value;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Quartic ease out for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(startValue.current + (target - startValue.current) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

function useRotation(speed = 30) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const animate = (timestamp: number) => {
      const delta = timestamp - lastTime;
      lastTime = timestamp;
      setRotation((prev) => (prev + (360 / speed / 1000) * delta) % 360);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [speed]);

  return rotation;
}

function useParticleSystem(count: number, bounds: { width: number; height: number }) {
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; vx: number; vy: number; life: number; id: number }>
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        // Add new particles
        const newParticles = [...prev];
        if (newParticles.length < count) {
          newParticles.push({
            id: Date.now() + Math.random(),
            x: bounds.width / 2,
            y: bounds.height / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
          });
        }

        // Update existing particles
        return newParticles
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.01,
          }))
          .filter((p) => p.life > 0);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [count, bounds]);

  return particles;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED DATA STREAM - Multi-type flowing connections
// ─────────────────────────────────────────────────────────────────────────────

interface DataStreamProps {
  path: string;
  color: string;
  delay?: number;
  duration?: number;
  type?: "default" | "pulse" | "particle" | "wave";
  intensity?: number;
}

function DataStream({
  path,
  color,
  delay = 0,
  duration = 3,
  type = "default",
  intensity = 1,
}: DataStreamProps) {
  const id = `stream-${delay}-${color.replace("#", "")}-${type}`;

  const renderStream = () => {
    switch (type) {
      case "pulse":
        return (
          <>
            {/* Base glow */}
            <path d={path} fill="none" stroke={color} strokeWidth="3" strokeOpacity={0.05 * intensity} />
            {/* Pulsing stream */}
            <path d={path} fill="none" stroke={`url(#${id}-pulse)`} strokeWidth="4" strokeLinecap="round">
              <animate
                attributeName="stroke-dashoffset"
                from="800"
                to="0"
                dur={`${duration}s`}
                repeatCount="indefinite"
                begin={`${delay}s`}
              />
              <animate
                attributeName="stroke-width"
                values="2;4;2"
                dur={`${duration * 0.5}s`}
                repeatCount="indefinite"
              />
            </path>
          </>
        );

      case "particle":
        return (
          <>
            <path d={path} fill="none" stroke={color} strokeWidth="1" strokeOpacity={0.04 * intensity} />
            {/* Multiple particle trails */}
            {[0, 0.33, 0.66].map((offset, i) => (
              <circle key={i} r="3" fill={color}>
                <animateMotion
                  path={path}
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                  begin={`${delay + offset * duration}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                  begin={`${delay + offset * duration}s`}
                />
                <animate
                  attributeName="r"
                  values="2;4;2"
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                  begin={`${delay + offset * duration}s`}
                />
              </circle>
            ))}
          </>
        );

      case "wave":
        return (
          <>
            <path d={path} fill="none" stroke={color} strokeWidth="1" strokeOpacity={0.06 * intensity} />
            {/* Wave effect with multiple phases */}
            {[0, 0.2, 0.4].map((phase, i) => (
              <path
                key={i}
                d={path}
                fill="none"
                stroke={`url(#${id}-wave)`}
                strokeWidth={3 - i}
                strokeLinecap="round"
                strokeOpacity={0.8 - i * 0.2}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="600"
                  to="0"
                  dur={`${duration}s`}
                  repeatCount="indefinite"
                  begin={`${delay + phase}s`}
                />
              </path>
            ))}
          </>
        );

      default:
        return (
          <>
            {/* Base path - static background */}
            <path d={path} fill="none" stroke={color} strokeWidth="1" strokeOpacity={0.08 * intensity} />
            {/* Animated stream */}
            <path
              d={path}
              fill="none"
              stroke={`url(#${id})`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="100 400"
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
          </>
        );
    }
  };

  return (
    <g>
      {renderStream()}
      <defs>
        {/* Default gradient */}
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="30%" stopColor={color} stopOpacity="0.6" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="70%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        {/* Pulse gradient */}
        <linearGradient id={`${id}-pulse`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="40%" stopColor={color} stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        {/* Wave gradient */}
        <linearGradient id={`${id}-wave`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="20%" stopColor={color} stopOpacity="0.4" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="80%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXUS CORE - Enhanced central hub with multiple layers
// ─────────────────────────────────────────────────────────────────────────────

interface NexusCoreProps {
  value: number;
  pnlPercentage: number;
  healthScore: number;
  size?: "default" | "large";
}

function NexusCore({ value, pnlPercentage, healthScore, size = "default" }: NexusCoreProps) {
  const animatedValue = useAnimatedValue(value, 2500);
  const rotation1 = useRotation(40);
  const rotation2 = useRotation(60);
  const rotation3 = useRotation(25);

  const coreSize = size === "large" ? 280 : 220;
  const halfSize = coreSize / 2;

  // Health color gradient
  const healthColor =
    healthScore >= 80 ? "#10B981" : healthScore >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative" style={{ width: coreSize, height: coreSize }}>
      {/* Outermost ambient glow */}
      <div
        className="absolute -inset-20 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${healthColor}20 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Outer pulse rings */}
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="absolute rounded-full animate-ping"
          style={{
            inset: -8 * ring,
            border: `1px solid rgba(6,182,212,${0.05 + ring * 0.02})`,
            animationDuration: `${3 + ring * 0.5}s`,
            animationDelay: `${ring * 0.3}s`,
          }}
        />
      ))}

      {/* Rotating orbital rings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${coreSize} ${coreSize}`}
        style={{ transform: `rotate(${rotation1}deg)` }}
      >
        <defs>
          <linearGradient id="orbitalGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="30%" stopColor="#06B6D4" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="1" />
            <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle
          cx={halfSize}
          cy={halfSize}
          r={halfSize - 8}
          fill="none"
          stroke="url(#orbitalGradient1)"
          strokeWidth="1.5"
          strokeDasharray="8 16 32 16"
        />
      </svg>

      {/* Second orbital ring - counter rotation */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${coreSize} ${coreSize}`}
        style={{ transform: `rotate(-${rotation2}deg)` }}
      >
        <circle
          cx={halfSize}
          cy={halfSize}
          r={halfSize - 20}
          fill="none"
          stroke="rgba(139,92,246,0.3)"
          strokeWidth="1"
          strokeDasharray="4 20 8 20"
        />
      </svg>

      {/* Third orbital - data nodes */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${coreSize} ${coreSize}`}
        style={{ transform: `rotate(${rotation3}deg)` }}
      >
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const r = halfSize - 32;
          const x = halfSize + Math.cos(rad) * r;
          const y = halfSize + Math.sin(rad) * r;
          return (
            <g key={angle}>
              <circle cx={x} cy={y} r="3" fill="#06B6D4" opacity="0.6" />
              <circle cx={x} cy={y} r="6" fill="none" stroke="#06B6D4" strokeWidth="0.5" opacity="0.3" />
            </g>
          );
        })}
      </svg>

      {/* Health score arc */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${coreSize} ${coreSize}`}>
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <circle
          cx={halfSize}
          cy={halfSize}
          r={halfSize - 45}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
          strokeDasharray={`${Math.PI * 2 * (halfSize - 45) * 0.75}`}
          strokeDashoffset={Math.PI * 2 * (halfSize - 45) * 0.125}
          strokeLinecap="round"
          transform={`rotate(-225 ${halfSize} ${halfSize})`}
        />
        {/* Health arc */}
        <circle
          cx={halfSize}
          cy={halfSize}
          r={halfSize - 45}
          fill="none"
          stroke={healthColor}
          strokeWidth="4"
          strokeDasharray={`${Math.PI * 2 * (halfSize - 45) * 0.75 * (healthScore / 100)} 1000`}
          strokeLinecap="round"
          transform={`rotate(-225 ${halfSize} ${halfSize})`}
          style={{
            filter: `drop-shadow(0 0 8px ${healthColor})`,
            transition: "stroke-dasharray 1s ease-out",
          }}
        />
      </svg>

      {/* Inner core container */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center"
        style={{
          inset: 40,
          background: "radial-gradient(circle at 30% 30%, rgba(6,182,212,0.12) 0%, rgba(6,20,40,0.98) 70%)",
          boxShadow: `
            0 0 80px rgba(6,182,212,0.15),
            0 0 160px rgba(6,182,212,0.05),
            inset 0 0 60px rgba(6,182,212,0.06),
            inset 0 2px 4px rgba(255,255,255,0.03)
          `,
          border: "1px solid rgba(6,182,212,0.15)",
        }}
      >
        {/* Label */}
        <span className="text-[9px] uppercase tracking-[0.3em] text-cyan-400/40 mb-1">
          Portfolio Value
        </span>

        {/* Value */}
        <span
          className="text-3xl font-extralight text-white tabular-nums tracking-tight"
          style={{ textShadow: "0 0 40px rgba(6,182,212,0.4)" }}
        >
          ${(animatedValue / 1000000).toFixed(2)}M
        </span>

        {/* PnL */}
        <div className="flex items-center gap-1 mt-1.5">
          <span
            className={`text-sm font-medium ${
              pnlPercentage >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {pnlPercentage >= 0 ? "+" : ""}
            {pnlPercentage.toFixed(2)}%
          </span>
          <svg
            className={`w-3 h-3 ${pnlPercentage >= 0 ? "text-emerald-400" : "text-red-400 rotate-180"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
          </svg>
        </div>

        {/* Health indicator */}
        <div className="flex items-center gap-1 mt-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: healthColor, boxShadow: `0 0 8px ${healthColor}` }}
          />
          <span className="text-[10px] text-white/40">{healthScore}% Health</span>
        </div>
      </div>

      {/* Cardinal direction indicators */}
      {["N", "E", "S", "W"].map((dir, i) => {
        const angle = i * 90 - 90;
        const rad = (angle * Math.PI) / 180;
        const r = halfSize + 10;
        const x = halfSize + Math.cos(rad) * r;
        const y = halfSize + Math.sin(rad) * r;
        return (
          <div
            key={dir}
            className="absolute text-[8px] text-cyan-400/20 font-mono"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            {dir}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 80,
  height = 24,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon points={areaPoints} fill={`url(#sparkline-${color})`} />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={color}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED ASSET NODE
// ─────────────────────────────────────────────────────────────────────────────

interface AssetNodeProps {
  asset: Asset;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

function AssetNode({ asset, isSelected, onSelect }: AssetNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    active: "#10B981",
    pending: "#F59E0B",
    paused: "#6B7280",
  };

  const riskBadge = {
    low: { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    high: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  };

  return (
    <div
      className={`group relative p-4 rounded-xl transition-all duration-300 cursor-pointer ${
        isSelected ? "translate-x-2" : ""
      }`}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${asset.color}12 0%, rgba(6,20,40,0.95) 100%)`
          : `linear-gradient(135deg, ${asset.color}06 0%, rgba(6,20,40,0.9) 100%)`,
        border: `1px solid ${isSelected ? `${asset.color}30` : `${asset.color}12`}`,
        boxShadow: isSelected ? `0 0 40px ${asset.color}15, inset 0 1px 0 rgba(255,255,255,0.03)` : "none",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(asset.id)}
    >
      {/* Connection indicator */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r transition-all duration-300"
        style={{
          backgroundColor: isSelected ? asset.color : `${asset.color}40`,
          boxShadow: isSelected ? `0 0 12px ${asset.color}60` : "none",
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-6 rounded-full"
            style={{ backgroundColor: asset.color, boxShadow: `0 0 12px ${asset.color}60` }}
          />
          <div>
            <span className="text-sm font-medium text-white block">{asset.name}</span>
            <span className="text-[10px] text-white/30 font-mono">{asset.ticker}</span>
          </div>
        </div>

        {/* Status + Risk */}
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
            style={{
              color: riskBadge[asset.riskLevel].color,
              backgroundColor: riskBadge[asset.riskLevel].bg,
            }}
          >
            {asset.riskLevel}
          </span>
          <div className="relative">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColors[asset.status] }}
            />
            {asset.status === "active" && (
              <div
                className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: statusColors[asset.status] }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-light text-white tabular-nums">
            ${(asset.value / 1000).toFixed(0)}K
          </p>
          <p className="text-[10px] text-white/30">
            Cost: ${(asset.costBasis / 1000).toFixed(0)}K
          </p>
        </div>

        {/* Sparkline */}
        <div className="opacity-60 group-hover:opacity-100 transition-opacity">
          <Sparkline data={asset.sparklineData} color={asset.color} />
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center justify-between text-xs border-t border-white/[0.04] pt-3">
        <div className="flex items-center gap-3">
          <span style={{ color: asset.color }}>{asset.apy}% APY</span>
          <span className="text-white/20">|</span>
          <span className="text-white/40">{asset.allocation}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={asset.dailyChange >= 0 ? "text-emerald-400" : "text-red-400"}>
            {asset.dailyChange >= 0 ? "+" : ""}
            {asset.dailyChange.toFixed(2)}%
          </span>
          <span className="text-white/20 text-[10px]">24h</span>
        </div>
      </div>

      {/* Hover detail panel */}
      <div
        className={`absolute left-full top-0 ml-4 w-48 p-3 rounded-lg transition-all duration-300 z-20 ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(10,16,36,0.95), rgba(6,11,26,0.98))",
          border: `1px solid ${asset.color}20`,
          boxShadow: `0 0 30px ${asset.color}10, 0 20px 40px rgba(0,0,0,0.4)`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Performance</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/50">24h Change</span>
            <span className={asset.dailyChange >= 0 ? "text-emerald-400" : "text-red-400"}>
              {asset.dailyChange >= 0 ? "+" : ""}
              {asset.dailyChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/50">7d Change</span>
            <span className={asset.weeklyChange >= 0 ? "text-emerald-400" : "text-red-400"}>
              {asset.weeklyChange >= 0 ? "+" : ""}
              {asset.weeklyChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/50">Unrealized P&L</span>
            <span className={asset.value - asset.costBasis >= 0 ? "text-emerald-400" : "text-red-400"}>
              ${((asset.value - asset.costBasis) / 1000).toFixed(1)}K
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/[0.05]">
          <p className="text-[9px] text-white/30">
            Last updated: {asset.lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${asset.color}40, transparent)` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM METRICS BAR - Enhanced with more data
// ─────────────────────────────────────────────────────────────────────────────

interface SystemMetricProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

function SystemMetric({ label, value, sublabel, trend, color }: SystemMetricProps) {
  const trendColors = {
    up: "#10B981",
    down: "#EF4444",
    neutral: "#6B7280",
  };

  return (
    <div className="text-center px-4 relative group">
      <p className="text-[8px] uppercase tracking-[0.25em] text-cyan-400/40 mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1.5">
        <p
          className="text-lg font-light text-white tabular-nums"
          style={{ color: color || "white", textShadow: color ? `0 0 20px ${color}40` : "none" }}
        >
          {value}
        </p>
        {trend && (
          <svg
            className={`w-3 h-3 ${trend === "down" ? "rotate-180" : ""}`}
            style={{ color: trendColors[trend] }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {trend !== "neutral" ? (
              <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
            ) : (
              <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
            )}
          </svg>
        )}
      </div>
      {sublabel && <p className="text-[10px] text-white/20 mt-0.5">{sublabel}</p>}

      {/* Hover glow effect */}
      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg bg-gradient-to-b from-cyan-400/5 to-transparent" />
    </div>
  );
}

function MetricsDivider() {
  return (
    <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED LIVE FEED
// ─────────────────────────────────────────────────────────────────────────────

function LiveFeed({ events }: { events: LiveEvent[] }) {
  const typeStyles = {
    YIELD: { color: "#10B981", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    TX: { color: "#3B82F6", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    SYNC: { color: "#06B6D4", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
    ALERT: { color: "#F59E0B", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    REBALANCE: { color: "#8B5CF6", icon: "M4 4v5h.582m0 0a8.001 8.001 0 0115.356 2M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  };

  const statusColors = {
    success: "#10B981",
    info: "#06B6D4",
    warning: "#F59E0B",
    error: "#EF4444",
  };

  return (
    <div className="space-y-0.5">
      {events.map((event, i) => {
        const style = typeStyles[event.type];
        return (
          <div
            key={event.id || i}
            className="flex items-center gap-2 py-2 px-2 rounded-lg font-mono text-[11px] hover:bg-cyan-400/5 transition-all duration-200 group cursor-pointer"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Time */}
            <span className="text-cyan-400/30 w-12 shrink-0">{event.time}</span>

            {/* Type icon */}
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${style.color}15` }}
            >
              <svg
                className="w-3 h-3"
                style={{ color: style.color }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
              </svg>
            </div>

            {/* Message */}
            <span className="text-white/50 flex-1 truncate group-hover:text-white/70 transition-colors">
              {event.message}
            </span>

            {/* Amount if present */}
            {event.amount && (
              <span className="text-white/30 shrink-0">
                ${event.amount.toLocaleString()}
              </span>
            )}

            {/* Status dot */}
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: statusColors[event.status] }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLOCATION CHART - Donut visualization
// ─────────────────────────────────────────────────────────────────────────────

function AllocationChart({ assets }: { assets: Asset[] }) {
  const total = assets.reduce((sum, a) => sum + a.value, 0);
  let currentAngle = -90;

  return (
    <div className="relative w-full aspect-square max-w-[160px] mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {assets.map((asset, i) => {
          const percentage = (asset.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          // Calculate arc path
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = ((startAngle + angle) * Math.PI) / 180;
          const x1 = 50 + 35 * Math.cos(startRad);
          const y1 = 50 + 35 * Math.sin(startRad);
          const x2 = 50 + 35 * Math.cos(endRad);
          const y2 = 50 + 35 * Math.sin(endRad);
          const largeArc = angle > 180 ? 1 : 0;

          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={asset.color}
              opacity="0.8"
              className="hover:opacity-100 transition-opacity cursor-pointer"
              style={{ filter: `drop-shadow(0 0 4px ${asset.color}40)` }}
            />
          );
        })}
        {/* Center cutout */}
        <circle cx="50" cy="50" r="22" fill="#030614" />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] uppercase tracking-wider text-white/30">Assets</span>
        <span className="text-lg font-light text-white">{assets.length}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK GAUGE
// ─────────────────────────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const color =
    normalizedScore <= 30 ? "#10B981" : normalizedScore <= 60 ? "#F59E0B" : "#EF4444";
  const rotation = (normalizedScore / 100) * 180 - 90;

  return (
    <div className="relative w-full max-w-[140px] mx-auto">
      <svg viewBox="0 0 100 60" className="w-full">
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(normalizedScore / 100) * 125.6} 200`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Needle */}
        <line
          x1="50"
          y1="55"
          x2="50"
          y2="25"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${rotation} 50 55)`}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))" }}
        />
        {/* Center dot */}
        <circle cx="50" cy="55" r="4" fill="white" />
      </svg>
      <div className="text-center mt-1">
        <span className="text-lg font-light text-white">{normalizedScore}</span>
        <span className="text-[10px] text-white/30 ml-1">/ 100</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────

interface QuickActionProps {
  label: string;
  icon: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

function QuickAction({ label, icon, variant = "secondary", onClick }: QuickActionProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
        isPrimary
          ? "text-cyan-400 hover:bg-cyan-400/10 active:bg-cyan-400/15"
          : "text-white/50 hover:bg-white/5 hover:text-white/70 active:bg-white/8"
      }`}
      style={{
        border: `1px solid ${isPrimary ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: isPrimary ? "0 0 20px rgba(6,182,212,0.05)" : "none",
      }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
      </svg>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function NexusFlowEnhanced({
  assets: propAssets,
  metrics: propMetrics,
  events: propEvents,
  className,
}: NexusFlowEnhancedProps) {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Default data
  const assets: Asset[] = propAssets || [
    {
      id: "1",
      name: "US Treasury Fund",
      ticker: "USTF",
      value: 875000,
      costBasis: 820000,
      apy: 5.2,
      allocation: 35,
      color: "#06B6D4",
      status: "active",
      riskLevel: "low",
      sparklineData: [100, 102, 101, 105, 103, 106, 108, 107, 110, 112],
      lastUpdate: new Date(),
      dailyChange: 0.34,
      weeklyChange: 1.82,
    },
    {
      id: "2",
      name: "Real Estate Partners",
      ticker: "REPR",
      value: 700000,
      costBasis: 650000,
      apy: 7.8,
      allocation: 28,
      color: "#8B5CF6",
      status: "active",
      riskLevel: "medium",
      sparklineData: [100, 98, 102, 99, 104, 106, 103, 108, 110, 107],
      lastUpdate: new Date(),
      dailyChange: -0.21,
      weeklyChange: 2.45,
    },
    {
      id: "3",
      name: "Private Credit Pool",
      ticker: "PCPL",
      value: 550000,
      costBasis: 500000,
      apy: 9.4,
      allocation: 22,
      color: "#10B981",
      status: "active",
      riskLevel: "medium",
      sparklineData: [100, 101, 103, 102, 105, 107, 109, 108, 111, 114],
      lastUpdate: new Date(),
      dailyChange: 0.67,
      weeklyChange: 3.21,
    },
    {
      id: "4",
      name: "Commodity Index",
      ticker: "CMDX",
      value: 375000,
      costBasis: 380000,
      apy: 3.8,
      allocation: 15,
      color: "#F59E0B",
      status: "pending",
      riskLevel: "high",
      sparklineData: [100, 97, 95, 98, 96, 99, 97, 100, 98, 99],
      lastUpdate: new Date(),
      dailyChange: -0.45,
      weeklyChange: -0.89,
    },
  ];

  const metrics: PortfolioMetrics = propMetrics || {
    totalValue: 2500000,
    costBasis: 2350000,
    unrealizedPnL: 150000,
    pnlPercentage: 6.38,
    weightedApy: 6.4,
    activePositions: 4,
    pendingRewards: 1247.83,
    dailyYield: 438.52,
    riskScore: 42,
    healthScore: 87,
  };

  const events: LiveEvent[] = propEvents || [
    { id: "1", time: "14:32:18", type: "YIELD", message: "Treasury Fund distributed $847.32", status: "success", amount: 847.32 },
    { id: "2", time: "14:30:00", type: "SYNC", message: "Oracle price feed updated - 12 assets", status: "info" },
    { id: "3", time: "14:28:45", type: "TX", message: "Deposit confirmed: USDC", status: "success", amount: 50000 },
    { id: "4", time: "14:25:12", type: "YIELD", message: "Credit Pool accrued yield", status: "success", amount: 124.58 },
    { id: "5", time: "14:20:00", type: "REBALANCE", message: "Auto-rebalance executed", status: "info" },
    { id: "6", time: "14:15:33", type: "ALERT", message: "Large position detected in REPR", status: "warning" },
  ];

  // SVG flow paths - connecting assets to nexus core
  const flowPaths = [
    { path: "M 60 100 Q 180 100 260 220", color: "#06B6D4", delay: 0, type: "default" as const },
    { path: "M 60 220 Q 180 220 260 240", color: "#8B5CF6", delay: 0.6, type: "pulse" as const },
    { path: "M 60 340 Q 180 300 260 260", color: "#10B981", delay: 1.2, type: "particle" as const },
    { path: "M 60 460 Q 180 400 260 280", color: "#F59E0B", delay: 1.8, type: "wave" as const },
  ];

  return (
    <div
      className={`min-h-screen ${className || ""}`}
      style={{ background: "linear-gradient(180deg, #020608 0%, #040A10 50%, #020608 100%)" }}
    >
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1200px] h-[800px]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(6,182,212,0.04) 0%, transparent 60%)",
            filter: "blur(100px)",
          }}
        />
        {/* Secondary accent */}
        <div
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] animate-float2"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.03) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6,182,212,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-6">
        {/* ═══════════════════════════════════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════════════════════════════════ */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* Status indicator */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-40" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/70 font-medium">
                System Online
              </span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Title */}
            <div>
              <h1 className="text-xl font-light text-white tracking-wide">Nexus Flow</h1>
              <p className="text-[10px] text-white/30 font-mono mt-0.5">v2.0 Enhanced</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Network info */}
            <div className="flex items-center gap-4 text-[10px] text-white/30 font-mono">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>AVAX C-Chain</span>
              </div>
              <span className="text-white/10">|</span>
              <span>Block 48,291,847</span>
              <span className="text-white/10">|</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>

            {/* Wallet */}
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{
                background: "rgba(6,182,212,0.05)",
                border: "1px solid rgba(6,182,212,0.12)",
              }}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500" />
              <span className="text-xs font-mono text-white/60">0x7f3a...8b2c</span>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════════
            SYSTEM METRICS BAR
            ═══════════════════════════════════════════════════════════════════════ */}
        <div
          className="flex items-center justify-between py-4 rounded-xl mb-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(90deg, rgba(6,182,212,0.02) 0%, transparent 50%, rgba(6,182,212,0.02) 100%)",
            borderTop: "1px solid rgba(6,182,212,0.06)",
            borderBottom: "1px solid rgba(6,182,212,0.06)",
          }}
        >
          {/* Animated scanning line */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.05), transparent)",
              animation: "shimmer 4s infinite",
              backgroundSize: "200% 100%",
            }}
          />

          <SystemMetric label="Total Value" value={`$${(metrics.totalValue / 1000000).toFixed(2)}M`} trend="up" />
          <MetricsDivider />
          <SystemMetric label="Cost Basis" value={`$${(metrics.costBasis / 1000000).toFixed(2)}M`} />
          <MetricsDivider />
          <SystemMetric
            label="Unrealized P&L"
            value={`+$${(metrics.unrealizedPnL / 1000).toFixed(0)}K`}
            sublabel={`+${metrics.pnlPercentage.toFixed(1)}%`}
            color="#10B981"
            trend="up"
          />
          <MetricsDivider />
          <SystemMetric label="Weighted APY" value={`${metrics.weightedApy}%`} color="#06B6D4" />
          <MetricsDivider />
          <SystemMetric label="Daily Yield" value={`$${metrics.dailyYield.toFixed(0)}`} color="#10B981" trend="up" />
          <MetricsDivider />
          <SystemMetric label="Pending Rewards" value={`$${metrics.pendingRewards.toFixed(0)}`} />
          <MetricsDivider />
          <SystemMetric label="Active Positions" value={metrics.activePositions.toString()} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN CONTENT GRID
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-6">
          {/* ─────────────────────────────────────────────────────────────────────
              LEFT COLUMN - Asset Nodes
              ───────────────────────────────────────────────────────────────────── */}
          <div className="col-span-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">Asset Terminals</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/20">{assets.length} connected</span>
                <div className="w-1 h-1 rounded-full bg-cyan-400" />
              </div>
            </div>

            {assets.map((asset) => (
              <AssetNode
                key={asset.id}
                asset={asset}
                isSelected={selectedAsset === asset.id}
                onSelect={setSelectedAsset}
              />
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              CENTER COLUMN - Nexus Visualization
              ───────────────────────────────────────────────────────────────────── */}
          <div
            className="col-span-5 relative rounded-2xl overflow-hidden min-h-[560px]"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.02) 0%, rgba(6,20,40,0.5) 100%)",
              border: "1px solid rgba(6,182,212,0.05)",
            }}
          >
            {/* Corner accents */}
            {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
              <div
                key={pos}
                className={`absolute w-8 h-8 ${pos.includes("top") ? "top-0" : "bottom-0"} ${
                  pos.includes("left") ? "left-0" : "right-0"
                }`}
                style={{
                  borderTop: pos.includes("top") ? "1px solid rgba(6,182,212,0.2)" : "none",
                  borderBottom: pos.includes("bottom") ? "1px solid rgba(6,182,212,0.2)" : "none",
                  borderLeft: pos.includes("left") ? "1px solid rgba(6,182,212,0.2)" : "none",
                  borderRight: pos.includes("right") ? "1px solid rgba(6,182,212,0.2)" : "none",
                }}
              />
            ))}

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6,182,212,1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Data streams SVG */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 500 560"
              preserveAspectRatio="xMidYMid meet"
            >
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
                  <DataStream key={i} {...flow} duration={3} />
                ))}
              </g>
            </svg>

            {/* Central Nexus Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-x-4">
              <NexusCore
                value={metrics.totalValue}
                pnlPercentage={metrics.pnlPercentage}
                healthScore={metrics.healthScore}
              />
            </div>

            {/* Bottom data ticker */}
            <div
              className="absolute bottom-0 left-0 right-0 py-2 px-4 flex items-center justify-between text-[10px] font-mono"
              style={{
                background: "linear-gradient(to top, rgba(6,20,40,0.8), transparent)",
                borderTop: "1px solid rgba(6,182,212,0.05)",
              }}
            >
              <span className="text-cyan-400/40">FLOW_RATE: 847.32 USD/h</span>
              <span className="text-white/20">|</span>
              <span className="text-cyan-400/40">SYNC: 100%</span>
              <span className="text-white/20">|</span>
              <span className="text-cyan-400/40">LATENCY: 12ms</span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              RIGHT COLUMN - Panels
              ───────────────────────────────────────────────────────────────────── */}
          <div className="col-span-3 space-y-4">
            {/* Quick Actions */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: "rgba(6,182,212,0.02)",
                border: "1px solid rgba(6,182,212,0.06)",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/40 mb-3">
                Quick Actions
              </p>
              <div className="space-y-2">
                <QuickAction
                  label="Deposit USDC"
                  icon="M12 4v16m8-8H4"
                  variant="primary"
                />
                <QuickAction
                  label="Withdraw Funds"
                  icon="M4 12h16M12 4l-8 8 8 8"
                  variant="secondary"
                />
                <QuickAction
                  label="Rebalance Portfolio"
                  icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  variant="secondary"
                />
              </div>
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Allocation */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(6,182,212,0.02)",
                  border: "1px solid rgba(6,182,212,0.06)",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/40 mb-3 text-center">
                  Allocation
                </p>
                <AllocationChart assets={assets} />
              </div>

              {/* Risk */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(6,182,212,0.02)",
                  border: "1px solid rgba(6,182,212,0.06)",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/40 mb-3 text-center">
                  Risk Score
                </p>
                <RiskGauge score={metrics.riskScore} />
              </div>
            </div>

            {/* Live Feed */}
            <div
              className="p-4 rounded-xl flex-1"
              style={{
                background: "rgba(6,182,212,0.02)",
                border: "1px solid rgba(6,182,212,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/40">
                  Activity Feed
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400/60">LIVE</span>
                </div>
              </div>
              <LiveFeed events={events} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════════════════════ */}
        <footer className="mt-10 pt-6 border-t border-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/20 tracking-wider">
              DEEPROCK
            </span>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-[10px] text-white/15">
              Institutional-Grade Tokenized Assets
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/15">Powered by Avalanche</span>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-cyan-400/30"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default NexusFlowEnhanced;
