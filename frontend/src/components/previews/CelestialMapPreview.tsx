"use client";

import { useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const C = {
  bg: "#050510",
  surface: "#0A0A1F",
  surfaceElevated: "#10102A",
  purple: "#7C3AED",
  teal: "#14B8A6",
  starWhite: "#F8FAFC",
  starWarm: "#FDE68A",
  starCool: "#93C5FD",
  nebulaPink: "#F472B6",
  text: "#E2E8F0",
  textSecondary: "#64748B",
  textDim: "#334155",
  border: "rgba(124,58,237,0.08)",
  starGlow: "rgba(248,250,252,0.15)",
};

const HEADING_FONT = "'Sora', system-ui, sans-serif";
const BODY_FONT = "'Inter', system-ui, sans-serif";
const MONO_FONT = "'JetBrains Mono', 'SF Mono', monospace";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useCountUp(end: number, duration: number = 2200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let frame: number;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return count;
}

function useStaggeredVisible(count: number, baseDelay: number = 120) {
  const [visible, setVisible] = useState<boolean[]>(new Array(count).fill(false));

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, baseDelay * i)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [count, baseDelay]);

  return visible;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CHART_DATA = [
  32, 35, 34, 38, 42, 40, 45, 48, 46, 52,
  55, 53, 58, 62, 60, 65, 68, 66, 72, 75,
  73, 78, 82, 80, 85, 88, 86, 91, 93, 96,
];

const CONSTELLATION_NODES = [
  { id: "usdc", label: "USDC Vault", value: 486200, x: 22, y: 28, radius: 22, color: C.teal, type: "treasury" },
  { id: "tbill", label: "T-Bill Fund", value: 412800, x: 58, y: 18, radius: 20, color: C.teal, type: "treasury" },
  { id: "credit", label: "Credit Pool", value: 356400, x: 82, y: 35, radius: 18, color: C.purple, type: "credit" },
  { id: "rwa", label: "Real Estate", value: 298600, x: 40, y: 52, radius: 16, color: C.starWarm, type: "real-estate" },
  { id: "equity", label: "Equity Fund", value: 245200, x: 70, y: 58, radius: 15, color: C.nebulaPink, type: "equity" },
  { id: "infra", label: "Infra Debt", value: 178400, x: 18, y: 65, radius: 13, color: C.purple, type: "credit" },
  { id: "gold", label: "Gold Token", value: 112500, x: 52, y: 78, radius: 11, color: C.starWarm, type: "commodity" },
  { id: "bridge", label: "Bridge Yield", value: 66240, x: 85, y: 72, radius: 9, color: C.starCool, type: "defi" },
];

const CONSTELLATION_EDGES: [string, string, number][] = [
  ["usdc", "tbill", 0.8],
  ["usdc", "rwa", 0.5],
  ["tbill", "credit", 0.7],
  ["tbill", "rwa", 0.4],
  ["credit", "equity", 0.6],
  ["rwa", "equity", 0.3],
  ["rwa", "infra", 0.5],
  ["infra", "gold", 0.4],
  ["gold", "bridge", 0.3],
  ["equity", "bridge", 0.5],
  ["usdc", "infra", 0.6],
  ["credit", "bridge", 0.4],
];

const STAT_CARDS = [
  { label: "Total Yield", value: "$18,420", sub: "30d earned", color: C.teal, icon: "◆" },
  { label: "Avg APY", value: "7.84%", sub: "weighted", color: C.purple, icon: "✦" },
  { label: "Active Pools", value: "8", sub: "positions", color: C.starWarm, icon: "⬡" },
  { label: "Risk Score", value: "92", sub: "low risk", color: C.starCool, icon: "◇" },
];

const ASSET_TABLE = [
  { name: "USDC Vault", protocol: "Aave v3", value: "$486,200", apy: "5.24%", status: "active" as const, color: C.teal },
  { name: "T-Bill Fund", protocol: "Backed", value: "$412,800", apy: "4.89%", status: "active" as const, color: C.teal },
  { name: "Credit Pool", protocol: "Maple", value: "$356,400", apy: "9.12%", status: "active" as const, color: C.purple },
  { name: "Real Estate", protocol: "Centrifuge", value: "$298,600", apy: "11.40%", status: "maturing" as const, color: C.starWarm },
  { name: "Equity Fund", protocol: "Ondo", value: "$245,200", apy: "8.65%", status: "active" as const, color: C.nebulaPink },
  { name: "Bridge Yield", protocol: "Stargate", value: "$66,240", apy: "12.80%", status: "pending" as const, color: C.starCool },
];

const BOTTOM_METRICS = [
  { label: "Portfolio Health", value: 92, max: 100, color: C.teal },
  { label: "Diversification", value: 78, max: 100, color: C.purple },
  { label: "Yield Efficiency", value: 85, max: 100, color: C.starWarm },
];

// ---------------------------------------------------------------------------
// Star Field Background
// ---------------------------------------------------------------------------

function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        twinkle: i < 8,
        twinkleDuration: 2 + Math.random() * 3,
        twinkleDelay: Math.random() * 5,
      })),
    []
  );

  return (
    <>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: C.starWhite,
            opacity: s.opacity,
            pointerEvents: "none",
            animation: s.twinkle
              ? `celestialTwinkle ${s.twinkleDuration}s ease-in-out ${s.twinkleDelay}s infinite`
              : undefined,
          }}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Nebula Blobs
// ---------------------------------------------------------------------------

function NebulaBlobs() {
  const blobs = useMemo(
    () => [
      { x: 15, y: 20, size: 420, color: C.purple, opacity: 0.05, drift: 30, duration: 25 },
      { x: 70, y: 15, size: 380, color: C.teal, opacity: 0.04, drift: 25, duration: 30 },
      { x: 50, y: 65, size: 450, color: C.nebulaPink, opacity: 0.04, drift: 35, duration: 28 },
      { x: 85, y: 75, size: 340, color: C.purple, opacity: 0.05, drift: 20, duration: 22 },
    ],
    []
  );

  return (
    <>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            opacity: b.opacity,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            animation: `nebulaDrift${i} ${b.duration}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes nebulaDrift0 {
          0%, 100% { transform: translate(-50%, -50%) translate(0px, 0px); }
          33% { transform: translate(-50%, -50%) translate(30px, -20px); }
          66% { transform: translate(-50%, -50%) translate(-20px, 15px); }
        }
        @keyframes nebulaDrift1 {
          0%, 100% { transform: translate(-50%, -50%) translate(0px, 0px); }
          33% { transform: translate(-50%, -50%) translate(-25px, 20px); }
          66% { transform: translate(-50%, -50%) translate(15px, -25px); }
        }
        @keyframes nebulaDrift2 {
          0%, 100% { transform: translate(-50%, -50%) translate(0px, 0px); }
          33% { transform: translate(-50%, -50%) translate(35px, 15px); }
          66% { transform: translate(-50%, -50%) translate(-30px, -20px); }
        }
        @keyframes nebulaDrift3 {
          0%, 100% { transform: translate(-50%, -50%) translate(0px, 0px); }
          33% { transform: translate(-50%, -50%) translate(-20px, -25px); }
          66% { transform: translate(-50%, -50%) translate(25px, 20px); }
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// Glass Card
// ---------------------------------------------------------------------------

function GlassCard({
  children,
  style,
  visible = true,
  hoverable = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  visible?: boolean;
  hoverable?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={hoverable ? () => setHovered(true) : undefined}
      onMouseLeave={hoverable ? () => setHovered(false) : undefined}
      style={{
        position: "relative",
        background: "rgba(10,10,31,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 16,
        border: `1px solid ${hovered ? "rgba(124,58,237,0.25)" : C.border}`,
        boxShadow: hovered
          ? "0 8px 32px rgba(124,58,237,0.18), 0 0 40px rgba(248,250,252,0.04)"
          : "0 8px 32px rgba(124,58,237,0.1)",
        padding: 24,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.5)",
        transition: `all 600ms ${EASE_OUT}`,
        ...style,
      }}
    >
      {/* Top highlight bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${C.starWhite}, transparent)`,
          opacity: 0.06,
        }}
      />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constellation Map (Hero SVG)
// ---------------------------------------------------------------------------

function ConstellationMap() {
  const nodeMap = useMemo(() => {
    const map: Record<string, (typeof CONSTELLATION_NODES)[0]> = {};
    for (const n of CONSTELLATION_NODES) map[n.id] = n;
    return map;
  }, []);

  const [lineProgress, setLineProgress] = useState(0);

  useEffect(() => {
    let frame: number;
    let start: number;
    const duration = 1800;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setLineProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) frame = requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 400);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  const svgWidth = 720;
  const svgHeight = 340;

  function nodeX(n: (typeof CONSTELLATION_NODES)[0]) {
    return (n.x / 100) * svgWidth;
  }
  function nodeY(n: (typeof CONSTELLATION_NODES)[0]) {
    return (n.y / 100) * svgHeight;
  }

  function edgeLength(a: (typeof CONSTELLATION_NODES)[0], b: (typeof CONSTELLATION_NODES)[0]) {
    const dx = nodeX(a) - nodeX(b);
    const dy = nodeY(a) - nodeY(b);
    return Math.sqrt(dx * dx + dy * dy);
  }

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <filter id="celestialGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="celestialGlowStrong">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={C.starWhite} stopOpacity="0.15" />
          <stop offset="50%" stopColor={C.starWhite} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.starWhite} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Constellation edges */}
      {CONSTELLATION_EDGES.map(([fromId, toId, correlation], i) => {
        const a = nodeMap[fromId];
        const b = nodeMap[toId];
        if (!a || !b) return null;
        const len = edgeLength(a, b);
        const dashLen = len;
        const dashOffset = dashLen * (1 - lineProgress);

        return (
          <line
            key={`edge-${i}`}
            x1={nodeX(a)}
            y1={nodeY(a)}
            x2={nodeX(b)}
            y2={nodeY(b)}
            stroke={C.starWhite}
            strokeWidth={1}
            strokeOpacity={correlation * 0.2}
            strokeDasharray={dashLen}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 100ms linear" }}
          />
        );
      })}

      {/* Constellation nodes */}
      {CONSTELLATION_NODES.map((n) => {
        const cx = nodeX(n);
        const cy = nodeY(n);

        return (
          <g key={n.id}>
            {/* Outer glow */}
            <circle
              cx={cx}
              cy={cy}
              r={n.radius + 6}
              fill={n.color}
              opacity={0.08}
              filter="url(#celestialGlowStrong)"
            >
              <animate
                attributeName="opacity"
                values="0.06;0.12;0.06"
                dur="4s"
                repeatCount="indefinite"
                begin={`${Math.random() * 2}s`}
              />
            </circle>

            {/* Main node */}
            <circle
              cx={cx}
              cy={cy}
              r={n.radius}
              fill={n.color}
              opacity={0.2}
              filter="url(#celestialGlow)"
            />
            <circle
              cx={cx}
              cy={cy}
              r={n.radius * 0.5}
              fill={n.color}
              opacity={0.6}
            />
            <circle
              cx={cx}
              cy={cy}
              r={n.radius * 0.25}
              fill={C.starWhite}
              opacity={0.9}
            >
              <animate
                attributeName="r"
                values={`${n.radius * 0.22};${n.radius * 0.28};${n.radius * 0.22}`}
                dur="3s"
                repeatCount="indefinite"
                begin={`${Math.random() * 3}s`}
              />
            </circle>

            {/* Label */}
            <text
              x={cx}
              y={cy - n.radius - 10}
              textAnchor="middle"
              fill={C.text}
              fontSize="10"
              fontFamily={BODY_FONT}
              fontWeight="500"
              opacity="0.8"
            >
              {n.label}
            </text>

            {/* Value */}
            <text
              x={cx}
              y={cy - n.radius - 1}
              textAnchor="middle"
              fill={C.textSecondary}
              fontSize="8"
              fontFamily={MONO_FONT}
              opacity="0.6"
            >
              ${(n.value / 1000).toFixed(0)}K
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Performance Chart (Nebula Area)
// ---------------------------------------------------------------------------

function NebulaChart() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number;
    let start: number;
    const duration = 1600;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) frame = requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 600);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  const w = 640;
  const h = 200;
  const padX = 40;
  const padY = 20;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const min = Math.min(...CHART_DATA);
  const max = Math.max(...CHART_DATA);
  const range = max - min || 1;

  const points = CHART_DATA.map((v, i) => {
    const x = padX + (i / (CHART_DATA.length - 1)) * plotW;
    const y = padY + plotH - ((v - min) / range) * plotH;
    return { x, y, value: v };
  });

  const visibleCount = Math.ceil(progress * points.length);
  const visiblePoints = points.slice(0, visibleCount);

  const linePath = visiblePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = visiblePoints.length > 1
    ? `${linePath} L ${visiblePoints[visiblePoints.length - 1].x} ${padY + plotH} L ${visiblePoints[0].x} ${padY + plotH} Z`
    : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => padY + plotH * (1 - pct));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="nebulaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.purple} stopOpacity="0.3" />
          <stop offset="50%" stopColor={C.teal} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C.teal} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nebulaStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.purple} />
          <stop offset="100%" stopColor={C.teal} />
        </linearGradient>
        <filter id="dotGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {gridLines.map((y, i) => (
        <line key={i} x1={padX} y1={y} x2={w - padX} y2={y} stroke={C.textDim} strokeWidth="0.5" strokeOpacity="0.3" />
      ))}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#nebulaFill)" />}

      {/* Line */}
      {linePath && <path d={linePath} fill="none" stroke="url(#nebulaStroke)" strokeWidth="2" strokeLinecap="round" />}

      {/* Data points as stars */}
      {visiblePoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={i > visiblePoints.length * 0.5 ? C.teal : C.purple} opacity={0.3} filter="url(#dotGlow)" />
          <circle cx={p.x} cy={p.y} r={2} fill={C.starWhite} opacity={0.9} />
        </g>
      ))}

      {/* X-axis labels */}
      {[0, 7, 14, 21, 29].map((idx) => (
        <text
          key={idx}
          x={padX + (idx / (CHART_DATA.length - 1)) * plotW}
          y={h - 4}
          textAnchor="middle"
          fill={C.textDim}
          fontSize="9"
          fontFamily={MONO_FONT}
        >
          {idx === 0 ? "Jan 10" : idx === 7 ? "Jan 17" : idx === 14 ? "Jan 24" : idx === 21 ? "Jan 31" : "Feb 07"}
        </text>
      ))}

      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <text
          key={i}
          x={padX - 6}
          y={padY + plotH * (1 - pct) + 3}
          textAnchor="end"
          fill={C.textDim}
          fontSize="8"
          fontFamily={MONO_FONT}
        >
          {(min + range * pct).toFixed(0)}%
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Progress Ring
// ---------------------------------------------------------------------------

function ProgressRing({
  value,
  max,
  color,
  size = 64,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const percent = animatedValue / max;
  const offset = circumference * (1 - percent);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id={`ring-${color.replace("#", "")}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={C.purple} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={C.textDim}
        strokeWidth={strokeWidth}
        strokeOpacity={0.15}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#ring-${color.replace("#", "")})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: `stroke-dashoffset 1.2s ${EASE_OUT}` }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Status Indicator
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: "active" | "maturing" | "pending" }) {
  const statusConfig = {
    active: { color: C.teal, label: "Active", animate: true },
    maturing: { color: C.starWarm, label: "Maturing", animate: false },
    pending: { color: C.textDim, label: "Pending", animate: false },
  };

  const cfg = statusConfig[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontFamily: BODY_FONT,
        fontWeight: 500,
        color: cfg.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.color,
          boxShadow: cfg.animate ? `0 0 8px ${cfg.color}` : undefined,
          animation: cfg.animate ? "celestialTwinkle 2s ease-in-out infinite" : undefined,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Decorative Constellation (small, for hero section)
// ---------------------------------------------------------------------------

function MiniConstellation() {
  const pts = [
    { x: 10, y: 30 },
    { x: 35, y: 10 },
    { x: 55, y: 38 },
    { x: 75, y: 15 },
    { x: 90, y: 35 },
  ];

  const lines: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [1, 3],
  ];

  return (
    <svg viewBox="0 0 100 48" style={{ width: 100, height: 48, opacity: 0.4 }}>
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={pts[a].x}
          y1={pts[a].y}
          x2={pts[b].x}
          y2={pts[b].y}
          stroke={C.starWhite}
          strokeWidth="0.6"
          strokeOpacity="0.3"
        />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={C.starWhite} opacity={0.7} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CelestialMapPreview() {
  const portfolioValue = useCountUp(2156340, 2400);
  const cardVisible = useStaggeredVisible(4, 150);
  const tableVisible = useStaggeredVisible(6, 100);
  const [activeNav, setActiveNav] = useState(0);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const navItems = ["Overview", "Positions", "Analytics", "Yield", "Settings"];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: BODY_FONT,
        overflow: "hidden",
      }}
    >
      {/* Global keyframes */}
      <style>{`
        @keyframes celestialTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
        @keyframes celestialMaterialize {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes celestialSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes celestialPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
          50% { box-shadow: 0 0 20px 4px rgba(124,58,237,0.15); }
        }
        @keyframes celestialGlowText {
          0%, 100% { text-shadow: 0 0 20px rgba(248,250,252,0.1); }
          50% { text-shadow: 0 0 40px rgba(248,250,252,0.2), 0 0 80px rgba(124,58,237,0.1); }
        }
      `}</style>

      {/* Star field background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <StarField />
        <NebulaBlobs />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
        {/* ---- Header ---- */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 0",
            borderBottom: `1px solid ${C.border}`,
            animation: `celestialSlideUp 800ms ${EASE_OUT} both`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: HEADING_FONT,
                fontSize: 18,
                fontWeight: 200,
                letterSpacing: "0.2em",
                color: C.starWhite,
              }}
            >
              <span style={{ color: C.purple, marginRight: 6, fontSize: 14 }}>✦</span>
              CELESTIAL
            </span>
          </div>

          <nav style={{ display: "flex", gap: 28 }}>
            {navItems.map((item, i) => (
              <button
                key={item}
                onClick={() => setActiveNav(i)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: BODY_FONT,
                  fontSize: 13,
                  fontWeight: 400,
                  color: activeNav === i ? C.starWhite : C.textSecondary,
                  padding: "4px 0",
                  position: "relative",
                  transition: "color 300ms ease",
                }}
              >
                {item}
                {activeNav === i && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: C.purple,
                      boxShadow: `0 0 8px ${C.purple}`,
                    }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.purple}, ${C.teal})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: C.starWhite,
              fontFamily: HEADING_FONT,
            }}
          >
            DM
          </div>
        </header>

        {/* ---- Hero Section ---- */}
        <section
          style={{
            padding: "48px 0 32px",
            animation: `celestialSlideUp 800ms ${EASE_OUT} 200ms both`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 8,
                }}
              >
                Total Portfolio Value
              </p>
              <p
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 48,
                  fontWeight: 300,
                  color: C.starWhite,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  textShadow: "0 0 30px rgba(248,250,252,0.12), 0 0 60px rgba(124,58,237,0.08)",
                  animation: "celestialGlowText 4s ease-in-out infinite",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${portfolioValue.toLocaleString()}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <span
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.teal,
                  }}
                >
                  +$42,180 (2.00%)
                </span>
                <span style={{ fontSize: 11, color: C.textDim, fontFamily: BODY_FONT }}>
                  past 30 days
                </span>
              </div>
            </div>
            <MiniConstellation />
          </div>
        </section>

        {/* ---- Star Map Section (Hero Visual) ---- */}
        <section style={{ marginBottom: 32 }}>
          <GlassCard
            style={{
              padding: 28,
              animation: `celestialMaterialize 800ms ${EASE_OUT} 400ms both`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 14,
                    fontWeight: 400,
                    color: C.text,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Portfolio Constellation
                </p>
                <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                  Asset positions mapped by value and correlation
                </p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { color: C.teal, label: "Treasury" },
                  { color: C.purple, label: "Credit" },
                  { color: C.starWarm, label: "Real Assets" },
                  { color: C.nebulaPink, label: "Equity" },
                  { color: C.starCool, label: "DeFi" },
                ].map((leg) => (
                  <span
                    key={leg.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      color: C.textSecondary,
                      fontFamily: BODY_FONT,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: leg.color,
                        boxShadow: `0 0 6px ${leg.color}`,
                      }}
                    />
                    {leg.label}
                  </span>
                ))}
              </div>
            </div>
            <ConstellationMap />
          </GlassCard>
        </section>

        {/* ---- Stat Cards ---- */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {STAT_CARDS.map((card, i) => (
            <GlassCard
              key={card.label}
              visible={cardVisible[i]}
              hoverable
              style={{ padding: 20, textAlign: "center" }}
            >
              <span
                style={{
                  fontSize: 18,
                  color: card.color,
                  display: "block",
                  marginBottom: 10,
                  filter: `drop-shadow(0 0 6px ${card.color})`,
                }}
              >
                {card.icon}
              </span>
              <p
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 24,
                  fontWeight: 500,
                  color: C.starWhite,
                  textShadow: `0 0 16px ${C.starGlow}`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {card.value}
              </p>
              <p style={{ fontFamily: BODY_FONT, fontSize: 11, color: C.textDim, marginTop: 4 }}>
                {card.sub}
              </p>
            </GlassCard>
          ))}
        </section>

        {/* ---- Performance Chart ---- */}
        <section style={{ marginBottom: 32 }}>
          <GlassCard
            style={{
              padding: 28,
              animation: `celestialMaterialize 800ms ${EASE_OUT} 800ms both`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: 14,
                    fontWeight: 400,
                    color: C.text,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Performance Trajectory
                </p>
                <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                  30-day yield accumulation
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["1W", "1M", "3M", "1Y"].map((period, i) => (
                  <button
                    key={period}
                    style={{
                      background: i === 1 ? "rgba(124,58,237,0.15)" : "transparent",
                      border: `1px solid ${i === 1 ? "rgba(124,58,237,0.3)" : "transparent"}`,
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontFamily: MONO_FONT,
                      fontSize: 10,
                      fontWeight: 500,
                      color: i === 1 ? C.purple : C.textDim,
                      cursor: "pointer",
                      transition: "all 200ms ease",
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <NebulaChart />
          </GlassCard>
        </section>

        {/* ---- Asset Table ---- */}
        <section style={{ marginBottom: 32 }}>
          <GlassCard
            style={{
              padding: 0,
              animation: `celestialMaterialize 800ms ${EASE_OUT} 1000ms both`,
            }}
          >
            <div style={{ padding: "20px 24px 12px" }}>
              <p
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: 14,
                  fontWeight: 400,
                  color: C.text,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Active Positions
              </p>
            </div>

            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 0.8fr",
                padding: "8px 24px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {["Asset", "Protocol", "Value", "APY", "Status"].map((col) => (
                <p
                  key={col}
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 10,
                    fontWeight: 500,
                    color: C.textDim,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {col}
                </p>
              ))}
            </div>

            {/* Table rows */}
            {ASSET_TABLE.map((row, i) => (
              <div
                key={row.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr 0.8fr",
                  padding: "14px 24px",
                  alignItems: "center",
                  borderBottom: i < ASSET_TABLE.length - 1 ? `1px solid ${C.border}` : undefined,
                  opacity: tableVisible[i] ? 1 : 0,
                  transform: tableVisible[i] ? "translateX(0)" : "translateX(-12px)",
                  transition: `all 500ms ${EASE_OUT}`,
                }}
              >
                {/* Asset name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: row.color,
                      boxShadow: `0 0 8px ${row.color}`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: BODY_FONT,
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.text,
                    }}
                  >
                    {row.name}
                  </span>
                </div>

                {/* Protocol */}
                <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.textSecondary }}>
                  {row.protocol}
                </span>

                {/* Value */}
                <span
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.starWhite,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.value}
                </span>

                {/* APY */}
                <span
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.teal,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.apy}
                </span>

                {/* Status */}
                <StatusDot status={row.status} />
              </div>
            ))}
          </GlassCard>
        </section>

        {/* ---- Bottom Metrics with Progress Rings ---- */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 48,
            animation: `celestialSlideUp 800ms ${EASE_OUT} 1200ms both`,
          }}
        >
          {BOTTOM_METRICS.map((metric) => (
            <GlassCard key={metric.label} hoverable style={{ padding: 24, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <ProgressRing value={metric.value} max={metric.max} color={metric.color} />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: MONO_FONT,
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.starWhite,
                    }}
                  >
                    {metric.value}
                  </span>
                </div>
              </div>
              <p
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {metric.label}
              </p>
            </GlassCard>
          ))}
        </section>

        {/* ---- Footer ---- */}
        <footer
          style={{
            padding: "24px 0 32px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: `celestialSlideUp 800ms ${EASE_OUT} 1400ms both`,
          }}
        >
          <span
            style={{
              fontFamily: HEADING_FONT,
              fontSize: 11,
              fontWeight: 200,
              letterSpacing: "0.15em",
              color: C.textDim,
            }}
          >
            <span style={{ color: C.purple, marginRight: 4, fontSize: 9 }}>✦</span>
            CELESTIAL PROTOCOL
          </span>
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 10,
              color: C.textDim,
            }}
          >
            Navigate your financial universe
          </span>
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 10,
              color: C.textDim,
            }}
          >
            Block #18,492,741
          </span>
        </footer>
      </div>
    </div>
  );
}
