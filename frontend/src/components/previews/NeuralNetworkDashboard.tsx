"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL NETWORK DASHBOARD
// Living neural network visualization where assets are nodes and correlations
// are synaptic connections. The mesh breathes, pulses fire, everything is alive.
// ═══════════════════════════════════════════════════════════════════════════════

interface Asset {
  id: string;
  name: string;
  ticker: string;
  value: number;
  apy: number;
  allocation: number;
  color: string;
  sparkline: number[];
}

interface MeshDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface NeuralPulse {
  id: number;
  pathIndex: number;
  progress: number;
  speed: number;
  reverse: boolean;
}

const ASSETS: Asset[] = [
  {
    id: "treasuries",
    name: "Treasuries",
    ticker: "USTF",
    value: 875000,
    apy: 5.2,
    allocation: 35,
    color: "#06B6D4",
    sparkline: [42, 45, 43, 48, 46, 50, 52, 49, 53, 55, 54, 57, 56, 58, 60],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    ticker: "REPR",
    value: 650000,
    apy: 7.8,
    allocation: 26,
    color: "#8B5CF6",
    sparkline: [30, 32, 28, 35, 33, 38, 36, 40, 42, 39, 44, 43, 46, 48, 50],
  },
  {
    id: "credit",
    name: "Private Credit",
    ticker: "PCRD",
    value: 600000,
    apy: 9.4,
    allocation: 24,
    color: "#10B981",
    sparkline: [25, 28, 26, 30, 34, 32, 36, 38, 35, 40, 42, 44, 41, 46, 48],
  },
  {
    id: "commodities",
    name: "Commodities",
    ticker: "CMDX",
    value: 375000,
    apy: 3.8,
    allocation: 15,
    color: "#F59E0B",
    sparkline: [20, 18, 22, 19, 24, 21, 26, 23, 28, 25, 27, 30, 28, 32, 31],
  },
];

const TOTAL_VALUE = ASSETS.reduce((s, a) => s + a.value, 0);

const CORRELATION_STRENGTHS = [
  0.85, 0.62, 0.45, 0.73, 0.38, 0.56,
];

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useAnimatedValue(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    return () => {
      startRef.current = null;
    };
  }, [target, duration]);

  return value;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE POSITIONS (diamond layout in a 1200x500 viewBox)
// ─────────────────────────────────────────────────────────────────────────────

const NODE_POSITIONS = [
  { x: 600, y: 90 },   // Treasuries: center-top
  { x: 950, y: 250 },  // Real Estate: center-right
  { x: 600, y: 410 },  // Credit: center-bottom
  { x: 250, y: 250 },  // Commodities: center-left
];

const NODE_RADII = [48, 42, 40, 34];

function getConnectionPairs(): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
}

function buildCurvedPath(
  x1: number, y1: number,
  x2: number, y2: number,
  curvature = 0.2
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND MESH - the living neural tissue
// ─────────────────────────────────────────────────────────────────────────────

function BackgroundMesh({ width, height }: { width: number; height: number }) {
  const dotsRef = useRef<MeshDot[]>([]);
  const canvasRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number>(0);

  const initDots = useCallback(() => {
    const dots: MeshDot[] = [];
    for (let i = 0; i < 45; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 1.5,
      });
    }
    dotsRef.current = dots;
  }, [width, height]);

  useEffect(() => {
    initDots();

    const animate = () => {
      const dots = dotsRef.current;
      const g = canvasRef.current;
      if (!g) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      for (const dot of dots) {
        dot.x += dot.vx;
        dot.y += dot.vy;

        dot.vx += (Math.random() - 0.5) * 0.02;
        dot.vy += (Math.random() - 0.5) * 0.02;
        dot.vx *= 0.99;
        dot.vy *= 0.99;

        if (dot.x < 0) { dot.x = 0; dot.vx *= -1; }
        if (dot.x > width) { dot.x = width; dot.vx *= -1; }
        if (dot.y < 0) { dot.y = 0; dot.vy *= -1; }
        if (dot.y > height) { dot.y = height; dot.vy *= -1; }
      }

      const circles = g.querySelectorAll("circle");
      const lines = g.querySelectorAll("line");

      circles.forEach((c, i) => {
        if (dots[i]) {
          c.setAttribute("cx", dots[i].x.toFixed(1));
          c.setAttribute("cy", dots[i].y.toFixed(1));
        }
      });

      let lineIdx = 0;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && lineIdx < lines.length) {
            const line = lines[lineIdx];
            line.setAttribute("x1", dots[i].x.toFixed(1));
            line.setAttribute("y1", dots[i].y.toFixed(1));
            line.setAttribute("x2", dots[j].x.toFixed(1));
            line.setAttribute("y2", dots[j].y.toFixed(1));
            line.setAttribute("stroke-opacity", (0.04 * (1 - dist / 150)).toFixed(3));
            line.style.display = "";
            lineIdx++;
          }
        }
      }
      for (let k = lineIdx; k < lines.length; k++) {
        lines[k].style.display = "none";
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [initDots, width, height]);

  const maxLines = (45 * 44) / 2;

  return (
    <g ref={canvasRef}>
      {Array.from({ length: maxLines }, (_, i) => (
        <line
          key={`ml-${i}`}
          stroke="#06B6D4"
          strokeWidth="0.5"
          strokeOpacity="0"
          style={{ display: "none" }}
        />
      ))}
      {Array.from({ length: 45 }, (_, i) => (
        <circle
          key={`md-${i}`}
          r="1.5"
          fill="#06B6D4"
          fillOpacity="0.15"
        />
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEURAL PULSE - a bright dot that travels along a connection
// ─────────────────────────────────────────────────────────────────────────────

function NeuralPulseParticle({
  pathId,
  color,
  duration,
  delay,
}: {
  pathId: string;
  color: string;
  duration: number;
  delay: number;
}) {
  return (
    <circle r="3" fill={color} filter="url(#pulseGlow)">
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        keyPoints="0;1"
        keyTimes="0;1"
        calcMode="linear"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.1;0.9;1"
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      />
      <animate
        attributeName="r"
        values="2;4;3;2"
        keyTimes="0;0.1;0.9;1"
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      />
    </circle>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 120,
  height = 32,
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
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ") + ` L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APY ARC INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function ApyArc({ apy, color, size = 36 }: { apy: number; color: string; size?: number }) {
  const maxApy = 12;
  const fraction = Math.min(apy / maxApy, 1);
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const dashLen = circumference * fraction;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeOpacity="0.15"
        strokeWidth="2.5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={`${dashLen} ${circumference}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.5s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="8"
        fontWeight="600"
        fontFamily="monospace"
      >
        {apy}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSET DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────

function AssetPanel({ asset, index }: { asset: Asset; index: number }) {
  const animatedValue = useAnimatedValue(asset.value, 2500);
  const correlationSum = CORRELATION_STRENGTHS.reduce((s, v, i) => {
    const pairs = getConnectionPairs();
    const pair = pairs[i];
    return pair[0] === index || pair[1] === index ? s + v : s;
  }, 0);
  const avgCorrelation = (correlationSum / 3).toFixed(2);

  return (
    <div
      style={{
        background: "rgba(6,182,212,0.02)",
        border: `1px solid ${asset.color}15`,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${asset.color}, transparent)`,
          opacity: 0.4,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: asset.color,
              boxShadow: `0 0 8px ${asset.color}60`,
            }}
          />
          <span style={{ color: "#EDF2FC", fontSize: "13px", fontWeight: 600 }}>
            {asset.name}
          </span>
        </div>
        <span
          style={{
            color: asset.color,
            fontSize: "11px",
            fontFamily: "monospace",
            background: `${asset.color}15`,
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          {asset.ticker}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#EDF2FC", fontSize: "22px", fontWeight: 700, fontFamily: "monospace" }}>
          {formatCurrency(animatedValue)}
        </span>
        <ApyArc apy={asset.apy} color={asset.color} />
      </div>

      <Sparkline data={asset.sparkline} color={asset.color} />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ color: "#94A8C8", fontSize: "11px" }}>Allocation</span>
          <span style={{ color: "#EDF2FC", fontSize: "11px", fontFamily: "monospace" }}>
            {asset.allocation}%
          </span>
        </div>
        <div
          style={{
            height: "4px",
            background: "rgba(148,168,200,0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            className="nn-alloc-bar"
            style={{
              height: "100%",
              width: `${asset.allocation}%`,
              background: `linear-gradient(90deg, ${asset.color}80, ${asset.color})`,
              borderRadius: "2px",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ color: "#94A8C8", fontSize: "10px", display: "block" }}>Correlation</span>
          <span style={{ color: "#EDF2FC", fontSize: "13px", fontFamily: "monospace" }}>
            {avgCorrelation}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(16,185,129,0.1)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#10B981",
            }}
            className="nn-status-blink"
          />
          <span style={{ color: "#10B981", fontSize: "10px", fontWeight: 600 }}>SYNCED</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function NeuralNetworkDashboard() {
  const totalAnimated = useAnimatedValue(TOTAL_VALUE, 2500);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const connectionPairs = useMemo(() => getConnectionPairs(), []);

  const connectionPaths = useMemo(() => {
    const curvatures = [0.15, -0.12, 0.2, -0.18, 0.1, -0.14];
    return connectionPairs.map(([i, j], idx) => {
      const p1 = NODE_POSITIONS[i];
      const p2 = NODE_POSITIONS[j];
      return {
        id: `conn-${i}-${j}`,
        path: buildCurvedPath(p1.x, p1.y, p2.x, p2.y, curvatures[idx]),
        color1: ASSETS[i].color,
        color2: ASSETS[j].color,
        strength: CORRELATION_STRENGTHS[idx],
        fromIdx: i,
        toIdx: j,
      };
    });
  }, [connectionPairs]);

  const metricsBarRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030614",
        color: "#EDF2FC",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes nn-nodePulse {
          0%, 100% { filter: drop-shadow(0 0 8px var(--node-color)); }
          50% { filter: drop-shadow(0 0 24px var(--node-color)); }
        }
        @keyframes nn-electronOrbit {
          from { transform: rotate(0deg) translateX(var(--orbit-r)) rotate(0deg); }
          to { transform: rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg); }
        }
        @keyframes nn-centralGlow {
          0%, 100% { opacity: 0.4; r: 4; }
          50% { opacity: 0.8; r: 8; }
        }
        @keyframes nn-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes nn-fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nn-allocBar {
          from { width: 0%; }
        }
        .nn-alloc-bar {
          animation: nn-allocBar 1.5s ease-out;
        }
        .nn-status-blink {
          animation: nn-nodePulse 2s ease-in-out infinite;
          --node-color: #10B981;
        }
        .nn-panel-enter {
          animation: nn-fadeIn 0.6s ease-out both;
        }
        .nn-metrics-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 60px;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(6,182,212,0.08), transparent);
          animation: nn-sweep 4s ease-in-out infinite;
        }
      `}</style>

      {/* ── HEADER BAR ────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid rgba(6,182,212,0.06)",
          background: "rgba(3,6,20,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="6" r="3" fill="#06B6D4" fillOpacity="0.8" />
            <circle cx="6" cy="18" r="3" fill="#8B5CF6" fillOpacity="0.8" />
            <circle cx="18" cy="18" r="3" fill="#10B981" fillOpacity="0.8" />
            <line x1="12" y1="9" x2="6" y2="15" stroke="#06B6D4" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="12" y1="9" x2="18" y2="15" stroke="#10B981" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="6" y1="18" x2="18" y2="18" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.3" />
          </svg>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "#94A8C8",
            }}
          >
            NEURAL PORTFOLIO NETWORK
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "#EDF2FC",
            }}
          >
            {formatCurrency(totalAnimated)}
          </span>
          <span
            style={{
              color: "#10B981",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2L10 7H2L6 2Z" fill="#10B981" />
            </svg>
            +12.4%
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 8px #10B98180",
            }}
            className="nn-status-blink"
          />
          <span style={{ color: "#94A8C8", fontSize: "11px", fontWeight: 600, letterSpacing: "1px" }}>
            ALL SYSTEMS NOMINAL
          </span>
        </div>
      </header>

      {/* ── NEURAL NETWORK VISUALIZATION ──────────────────────────────── */}
      <div
        style={{
          width: "100%",
          padding: "0 16px",
          opacity: mounted ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      >
        <svg
          viewBox="0 0 1200 500"
          width="100%"
          style={{ maxHeight: "520px", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="pulseGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {connectionPaths.map((conn) => (
              <linearGradient key={`grad-${conn.id}`} id={`grad-${conn.id}`}>
                <stop offset="0%" stopColor={conn.color1} stopOpacity="0.6" />
                <stop offset="100%" stopColor={conn.color2} stopOpacity="0.6" />
              </linearGradient>
            ))}

            {ASSETS.map((asset) => (
              <radialGradient key={`ng-${asset.id}`} id={`ng-${asset.id}`}>
                <stop offset="0%" stopColor={asset.color} stopOpacity="0.4" />
                <stop offset="60%" stopColor={asset.color} stopOpacity="0.15" />
                <stop offset="100%" stopColor={asset.color} stopOpacity="0.05" />
              </radialGradient>
            ))}
          </defs>

          {/* Background mesh */}
          <BackgroundMesh width={1200} height={500} />

          {/* Connection lines */}
          {connectionPaths.map((conn) => (
            <g key={conn.id}>
              <path
                id={conn.id}
                d={conn.path}
                fill="none"
                stroke={`url(#grad-${conn.id})`}
                strokeWidth={1 + conn.strength * 2}
                strokeOpacity={0.15 + conn.strength * 0.15}
              />
              {/* Forward pulse */}
              <NeuralPulseParticle
                pathId={conn.id}
                color={conn.color1}
                duration={2.5 + Math.random() * 2}
                delay={Math.random() * 3}
              />
              {/* Reverse pulse (second layer) */}
              <NeuralPulseParticle
                pathId={conn.id}
                color={conn.color2}
                duration={3 + Math.random() * 2}
                delay={1.5 + Math.random() * 3}
              />
            </g>
          ))}

          {/* Central confluence point */}
          <g>
            <circle cx="600" cy="250" r="6" fill="#EDF2FC" fillOpacity="0.15" filter="url(#strongGlow)">
              <animate
                attributeName="r"
                values="4;8;4"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="fill-opacity"
                values="0.2;0.5;0.2"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              x="600"
              y="240"
              textAnchor="middle"
              fill="#EDF2FC"
              fontSize="11"
              fontWeight="700"
              fontFamily="monospace"
              fillOpacity="0.6"
            >
              {formatCurrency(TOTAL_VALUE)}
            </text>
          </g>

          {/* Primary asset nodes */}
          {ASSETS.map((asset, i) => {
            const pos = NODE_POSITIONS[i];
            const r = NODE_RADII[i];
            const orbitR = r + 14;

            return (
              <g key={asset.id}>
                {/* Outer glow ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + 6}
                  fill="none"
                  stroke={asset.color}
                  strokeWidth="1"
                  strokeOpacity="0.2"
                  style={{
                    // @ts-expect-error CSS custom property for animation
                    "--node-color": asset.color,
                    animation: "nn-nodePulse 3s ease-in-out infinite",
                    animationDelay: `${i * 0.5}s`,
                  }}
                />

                {/* Gradient fill */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={`url(#ng-${asset.id})`}
                  stroke={asset.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />

                {/* Inner bright core */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r * 0.35}
                  fill={asset.color}
                  fillOpacity="0.15"
                />

                {/* Ticker text */}
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#EDF2FC"
                  fontSize="14"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {asset.ticker}
                </text>

                {/* Value below node */}
                <text
                  x={pos.x}
                  y={pos.y + r + 18}
                  textAnchor="middle"
                  fill="#94A8C8"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {formatCurrency(asset.value)}
                </text>

                {/* Name above node */}
                <text
                  x={pos.x}
                  y={pos.y - r - 10}
                  textAnchor="middle"
                  fill={asset.color}
                  fontSize="10"
                  fontWeight="600"
                  letterSpacing="1"
                >
                  {asset.name.toUpperCase()}
                </text>

                {/* Orbiting electron */}
                <g
                  style={{
                    transformOrigin: `${pos.x}px ${pos.y}px`,
                    // @ts-expect-error CSS custom property for orbit radius
                    "--orbit-r": `${orbitR}px`,
                    animation: `nn-electronOrbit ${6 + i * 2}s linear infinite`,
                  }}
                >
                  <circle
                    cx={pos.x + orbitR}
                    cy={pos.y}
                    r="3"
                    fill={asset.color}
                    filter="url(#pulseGlow)"
                  >
                    <animate
                      attributeName="r"
                      values="2;4;2"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>

                {/* Orbit path (faint ring) */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={orbitR}
                  fill="none"
                  stroke={asset.color}
                  strokeWidth="0.5"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── ASSET DETAIL PANELS ───────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          padding: "8px 32px 24px",
        }}
      >
        {ASSETS.map((asset, i) => (
          <div
            key={asset.id}
            className="nn-panel-enter"
            style={{ animationDelay: `${0.3 + i * 0.15}s` }}
          >
            <AssetPanel asset={asset} index={i} />
          </div>
        ))}
      </div>

      {/* ── NETWORK METRICS BAR ───────────────────────────────────────── */}
      <div
        ref={metricsBarRef}
        className="nn-metrics-sweep"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
          padding: "14px 32px",
          borderTop: "1px solid rgba(6,182,212,0.06)",
          background: "rgba(6,182,212,0.015)",
          position: "relative",
          overflow: "hidden",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "NETWORK HEALTH", value: "98.2%", color: "#10B981" },
          { label: "TOTAL NODES", value: "4", color: "#06B6D4" },
          { label: "ACTIVE CONNECTIONS", value: "6", color: "#8B5CF6" },
          { label: "DATA THROUGHPUT", value: "1.2K/s", color: "#F59E0B" },
          { label: "SYNC LATENCY", value: "12ms", color: "#06B6D4" },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: metric.color,
                boxShadow: `0 0 6px ${metric.color}50`,
              }}
            />
            <span
              style={{
                color: "#94A8C8",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "1px",
              }}
            >
              {metric.label}
            </span>
            <span
              style={{
                color: "#EDF2FC",
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
