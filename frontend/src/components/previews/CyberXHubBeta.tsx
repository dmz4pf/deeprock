"use client";

import { useEffect, useState, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// CYBERX HUB BETA
// Space command center with orbital asset nodes, hexagonal hub, and animated
// data packets flowing along straight lines from nodes to center.
// Variation 2: Larger hub, true elliptical orbit, teal-blue color shift.
// ═══════════════════════════════════════════════════════════════════════════════

interface AssetNode {
  id: string;
  name: string;
  value: string;
  rawValue: number;
  apy: number;
  allocation: number;
  color: string;
  glowColor: string;
  position: "top" | "right" | "bottom" | "left";
}

const ASSETS: AssetNode[] = [
  {
    id: "treasuries",
    name: "Treasuries",
    value: "$875K",
    rawValue: 875000,
    apy: 5.2,
    allocation: 35,
    color: "#0891B2",
    glowColor: "rgba(8,145,178,0.6)",
    position: "top",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    value: "$650K",
    rawValue: 650000,
    apy: 7.8,
    allocation: 26,
    color: "#7C3AED",
    glowColor: "rgba(124,58,237,0.6)",
    position: "right",
  },
  {
    id: "credit",
    name: "Credit",
    value: "$600K",
    rawValue: 600000,
    apy: 9.4,
    allocation: 24,
    color: "#059669",
    glowColor: "rgba(5,150,105,0.6)",
    position: "bottom",
  },
  {
    id: "commodities",
    name: "Commodities",
    value: "$375K",
    rawValue: 375000,
    apy: 3.8,
    allocation: 15,
    color: "#D97706",
    glowColor: "rgba(217,119,6,0.6)",
    position: "left",
  },
];

const METRICS = [
  { label: "TVL", value: "$2.50M" },
  { label: "APY", value: "6.4%" },
  { label: "POSITIONS", value: "4" },
  { label: "RISK", value: "LOW" },
  { label: "HEALTH", value: "98.2%" },
  { label: "UPTIME", value: "99.9%" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated value hook — counts up on mount
// ─────────────────────────────────────────────────────────────────────────────
function useAnimatedValue(target: number, duration = 2500) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(target * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Particle field — drifting background dots
// ─────────────────────────────────────────────────────────────────────────────
function ParticleField() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 1.5,
      opacity: 0.05 + Math.random() * 0.1,
      duration: 20 + Math.random() * 40,
      delay: Math.random() * -30,
      dx: (Math.random() - 0.5) * 30,
      dy: (Math.random() - 0.5) * 30,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-teal-300"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `particleDrift ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            ["--drift-x" as string]: `${p.dx}px`,
            ["--drift-y" as string]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hexagonal grid background
// ─────────────────────────────────────────────────────────────────────────────
function HexGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.03 }}
    >
      <defs>
        <pattern
          id="hexPattern"
          width="56"
          height="100"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1.2)"
        >
          <path
            d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z"
            fill="none"
            stroke="#0891B2"
            strokeWidth="0.5"
          />
          <path
            d="M28 36 L56 52 L56 84 L28 100 L0 84 L0 52 Z"
            fill="none"
            stroke="#0891B2"
            strokeWidth="0.5"
            transform="translate(28, 0)"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexPattern)" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Node positions on the elliptical orbit
// ─────────────────────────────────────────────────────────────────────────────
function getNodePosition(
  position: AssetNode["position"],
  cx: number,
  cy: number,
  rx: number,
  ry: number
): { x: number; y: number } {
  switch (position) {
    case "top":
      return { x: cx, y: cy - ry };
    case "right":
      return { x: cx + rx, y: cy };
    case "bottom":
      return { x: cx, y: cy + ry };
    case "left":
      return { x: cx - rx, y: cy };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The central SVG hub visualization
// ─────────────────────────────────────────────────────────────────────────────
function HubVisualization() {
  const totalValue = useAnimatedValue(2500000, 2500);

  const svgWidth = 700;
  const svgHeight = 620;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const orbitRx = 280;
  const orbitRy = 200;
  const outerRingR = 140;
  const innerRingR = 100;

  // Hexagon points for the inner hub accent
  const hexPoints = useMemo(() => {
    const r = 70;
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
  }, [cx, cy]);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full max-w-[700px] mx-auto"
      style={{ filter: "drop-shadow(0 0 2px rgba(8,145,178,0.15))" }}
    >
      <defs>
        {/* Scanning sweep gradient */}
        <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0891B2" stopOpacity="0" />
          <stop offset="70%" stopColor="#0891B2" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
        </linearGradient>

        {/* Hexagonal hub fill gradient */}
        <radialGradient id="hexFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0891B2" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#020B18" stopOpacity="0.95" />
        </radialGradient>

        {/* Data line gradients per asset */}
        {ASSETS.map((asset) => (
          <linearGradient
            key={`grad-${asset.id}`}
            id={`lineGrad-${asset.id}`}
            gradientUnits="userSpaceOnUse"
            x1={getNodePosition(asset.position, cx, cy, orbitRx, orbitRy).x.toString()}
            y1={getNodePosition(asset.position, cx, cy, orbitRx, orbitRy).y.toString()}
            x2={cx.toString()}
            y2={cy.toString()}
          >
            <stop offset="0%" stopColor={asset.color} stopOpacity="0.7" />
            <stop offset="80%" stopColor={asset.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={asset.color} stopOpacity="0" />
          </linearGradient>
        ))}

        {/* Glow filter for data packets */}
        {ASSETS.map((asset) => (
          <filter key={`glow-${asset.id}`} id={`packetGlow-${asset.id}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={asset.color} floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glowColor" />
            <feMerge>
              <feMergeNode in="glowColor" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}

        {/* Hub center glow */}
        <filter id="hubGlow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feFlood floodColor="#0891B2" floodOpacity="0.25" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── PULSE RINGS expanding outward ── */}
      {[0, 1, 2].map((i) => (
        <circle
          key={`pulse-${i}`}
          cx={cx}
          cy={cy}
          r={outerRingR}
          fill="none"
          stroke="#0891B2"
          strokeWidth="1"
          opacity="0"
          className={`pulse-ring-${i}`}
        >
          <animate
            attributeName="r"
            from={outerRingR.toString()}
            to={(outerRingR + 80).toString()}
            dur="4s"
            begin={`${i * 1.33}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.25;0"
            dur="4s"
            begin={`${i * 1.33}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* ── ORBITAL ELLIPSE ── */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={orbitRx}
        ry={orbitRy}
        fill="none"
        stroke="#0891B2"
        strokeWidth="0.7"
        strokeDasharray="4 12"
        opacity="0.1"
      />

      {/* Orbital tick marks at cardinal points */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const mx = cx + orbitRx * Math.cos(rad);
        const my = cy + orbitRy * Math.sin(rad);
        const len = 6;
        const nx = Math.cos(rad);
        const ny = Math.sin(rad);
        return (
          <line
            key={`tick-${deg}`}
            x1={mx - nx * len}
            y1={my - ny * len}
            x2={mx + nx * len}
            y2={my + ny * len}
            stroke="#0891B2"
            strokeWidth="1"
            opacity="0.25"
          />
        );
      })}

      {/* ── DATA LINES from nodes to center ── */}
      {ASSETS.map((asset) => {
        const pos = getNodePosition(asset.position, cx, cy, orbitRx, orbitRy);
        const lineId = `dataLine-${asset.id}`;
        return (
          <g key={`line-group-${asset.id}`}>
            {/* The line itself */}
            <line
              x1={pos.x}
              y1={pos.y}
              x2={cx}
              y2={cy}
              stroke={`url(#lineGrad-${asset.id})`}
              strokeWidth="1"
              strokeDasharray="3 6"
              className="dataLineAnim"
            />

            {/* Path for animateMotion (line from node → center) */}
            <path
              id={lineId}
              d={`M${pos.x},${pos.y} L${cx},${cy}`}
              fill="none"
              stroke="none"
            />

            {/* Data packets traveling along the line */}
            {[0, 1, 2].map((pIdx) => (
              <circle
                key={`packet-${asset.id}-${pIdx}`}
                r="3"
                fill={asset.color}
                filter={`url(#packetGlow-${asset.id})`}
              >
                <animateMotion
                  dur="3.5s"
                  repeatCount="indefinite"
                  begin={`${pIdx * 1.17}s`}
                >
                  <mpath href={`#${lineId}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.85;1"
                  dur="3.5s"
                  repeatCount="indefinite"
                  begin={`${pIdx * 1.17}s`}
                />
                <animate
                  attributeName="r"
                  values="2;3.5;2"
                  dur="3.5s"
                  repeatCount="indefinite"
                  begin={`${pIdx * 1.17}s`}
                />
              </circle>
            ))}
          </g>
        );
      })}

      {/* ── OUTER RING — dashed, rotating clockwise ── */}
      <circle
        cx={cx}
        cy={cy}
        r={outerRingR}
        fill="none"
        stroke="#0891B2"
        strokeWidth="1"
        strokeDasharray="6 14"
        opacity="0.3"
        className="outerRingSpin"
      />

      {/* ── INNER RING — solid, subtle ── */}
      <circle
        cx={cx}
        cy={cy}
        r={innerRingR}
        fill="none"
        stroke="#0891B2"
        strokeWidth="0.8"
        opacity="0.15"
      />

      {/* ── HEXAGONAL ACCENT inside the hub ── */}
      <polygon
        points={hexPoints}
        fill="url(#hexFill)"
        stroke="#0891B2"
        strokeWidth="0.8"
        opacity="0.5"
        filter="url(#hubGlow)"
      />

      {/* ── SCANNING RADAR LINE ── */}
      <g className="radarSweep">
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - outerRingR}
          stroke="url(#sweepGrad)"
          strokeWidth="2"
          opacity="0.5"
        />
        {/* Scanning arc wedge */}
        <path
          d={`M${cx},${cy} L${cx},${cy - outerRingR} A${outerRingR},${outerRingR} 0 0,1 ${cx + outerRingR * Math.sin(Math.PI / 8)},${cy - outerRingR * Math.cos(Math.PI / 8)} Z`}
          fill="#0891B2"
          opacity="0.04"
        />
      </g>

      {/* ── HUB CENTER TEXT ── */}
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fill="#0891B2"
        fontSize="9"
        letterSpacing="0.2em"
        opacity="0.6"
        fontFamily="monospace"
      >
        TOTAL VALUE
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="white"
        fontSize="24"
        fontWeight="300"
        fontFamily="monospace"
      >
        ${(totalValue / 1_000_000).toFixed(2)}M
      </text>

      {/* ── ASSET NODE CARDS ── */}
      {ASSETS.map((asset) => {
        const pos = getNodePosition(asset.position, cx, cy, orbitRx, orbitRy);
        const cardW = 120;
        const cardH = 72;
        let anchorX = pos.x - cardW / 2;
        let anchorY = pos.y - cardH / 2;

        // Offset cards away from center so they don't overlap the orbit line
        if (asset.position === "top") anchorY = pos.y - cardH - 10;
        if (asset.position === "bottom") anchorY = pos.y + 10;
        if (asset.position === "left") anchorX = pos.x - cardW - 10;
        if (asset.position === "right") anchorX = pos.x + 10;

        return (
          <g key={`node-${asset.id}`} className="assetNodeFadeIn">
            {/* Outer glow behind card */}
            <rect
              x={anchorX - 2}
              y={anchorY - 2}
              width={cardW + 4}
              height={cardH + 4}
              rx="6"
              fill="none"
              stroke={asset.color}
              strokeWidth="1"
              opacity="0.2"
              filter={`url(#packetGlow-${asset.id})`}
            />

            {/* Card background */}
            <rect
              x={anchorX}
              y={anchorY}
              width={cardW}
              height={cardH}
              rx="5"
              fill="#0A1628"
              stroke={asset.color}
              strokeWidth="0.8"
              opacity="0.9"
            />

            {/* Hexagonal accent corner */}
            <polygon
              points={`${anchorX + 8},${anchorY + 3} ${anchorX + 14},${anchorY + 0} ${anchorX + 20},${anchorY + 3} ${anchorX + 20},${anchorY + 9} ${anchorX + 14},${anchorY + 12} ${anchorX + 8},${anchorY + 9}`}
              fill={asset.color}
              opacity="0.25"
            />

            {/* Asset name */}
            <text
              x={anchorX + 28}
              y={anchorY + 14}
              fill={asset.color}
              fontSize="10"
              fontWeight="600"
              fontFamily="monospace"
            >
              {asset.name}
            </text>

            {/* Value */}
            <text
              x={anchorX + 10}
              y={anchorY + 32}
              fill="white"
              fontSize="15"
              fontWeight="500"
              fontFamily="monospace"
            >
              {asset.value}
            </text>

            {/* APY + Allocation */}
            <text
              x={anchorX + 10}
              y={anchorY + 48}
              fill={asset.color}
              fontSize="9"
              fontFamily="monospace"
              opacity="0.8"
            >
              APY {asset.apy}%
            </text>
            <text
              x={anchorX + 10}
              y={anchorY + 62}
              fill="white"
              fontSize="9"
              fontFamily="monospace"
              opacity="0.5"
            >
              {asset.allocation}% allocated
            </text>

            {/* Allocation bar */}
            <rect
              x={anchorX + 76}
              y={anchorY + 42}
              width="34"
              height="3"
              rx="1.5"
              fill="#1a2744"
            />
            <rect
              x={anchorX + 76}
              y={anchorY + 42}
              width={34 * (asset.allocation / 100)}
              height="3"
              rx="1.5"
              fill={asset.color}
              opacity="0.7"
            />

            {/* Connection dot at the orbit intersection */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="4"
              fill="#020B18"
              stroke={asset.color}
              strokeWidth="1.5"
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r="1.5"
              fill={asset.color}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status indicator — pulsing dot
// ─────────────────────────────────────────────────────────────────────────────
function StatusIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className="w-2 h-2 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 8px rgba(52,211,153,0.6)" }}
        />
        <div
          className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping"
          style={{ animationDuration: "2s" }}
        />
      </div>
      <span
        className="text-xs tracking-widest text-emerald-400/70 uppercase"
        style={{ fontFamily: "monospace" }}
      >
        Systems Online
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom metrics bar
// ─────────────────────────────────────────────────────────────────────────────
function MetricsBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="border-t border-teal-500/10 px-6 py-3 flex items-center justify-center gap-0 flex-wrap"
      style={{ background: "rgba(2,11,24,0.9)" }}
    >
      {METRICS.map((m, i) => (
        <div
          key={m.label}
          className="flex items-center gap-2 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-20px)",
            transitionDelay: `${i * 120}ms`,
            fontFamily: "monospace",
          }}
        >
          <span className="text-xs text-teal-400/50 tracking-wider">
            {m.label}
          </span>
          <span className="text-xs text-white/90 font-medium">
            {m.value}
          </span>
          {i < METRICS.length - 1 && (
            <span className="text-teal-700/30 mx-3 select-none">|</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function CyberXHubBeta() {
  return (
    <div className="min-h-screen bg-[#020B18] text-white relative overflow-hidden flex flex-col">
      <style>{`
        /* Outer ring rotation — clockwise 30s */
        .outerRingSpin {
          transform-origin: 350px 310px;
          animation: spinCW 30s linear infinite;
        }
        @keyframes spinCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Radar sweep rotation — 8s */
        .radarSweep {
          transform-origin: 350px 310px;
          animation: spinCW 8s linear infinite;
        }

        /* Dashed data lines crawl */
        .dataLineAnim {
          animation: dashCrawl 2s linear infinite;
        }
        @keyframes dashCrawl {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -18; }
        }

        /* Particle drift */
        @keyframes particleDrift {
          from { transform: translate(0, 0); }
          to { transform: translate(var(--drift-x), var(--drift-y)); }
        }

        /* Asset node fade-in */
        .assetNodeFadeIn {
          animation: nodeFadeIn 1.2s ease-out both;
        }
        @keyframes nodeFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Hexagonal grid background */}
      <HexGrid />

      {/* Particle field */}
      <ParticleField />

      {/* Ambient glow from center */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          top: "45%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(ellipse at center, rgba(8,145,178,0.06) 0%, transparent 70%)",
        }}
      />

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-teal-500/10">
        <div className="flex items-center gap-3">
          {/* Hexagonal logo mark */}
          <svg width="24" height="28" viewBox="0 0 24 28">
            <polygon
              points="12,0 24,7 24,21 12,28 0,21 0,7"
              fill="none"
              stroke="#0891B2"
              strokeWidth="1.5"
              opacity="0.7"
            />
            <polygon
              points="12,4 20,9 20,19 12,24 4,19 4,9"
              fill="#0891B2"
              opacity="0.15"
            />
          </svg>
          <span
            className="text-sm tracking-[0.3em] text-white/80 uppercase font-medium"
            style={{ fontFamily: "monospace" }}
          >
            CyberX Hub
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded border border-teal-500/30 text-teal-400/60 tracking-wider"
            style={{ fontFamily: "monospace" }}
          >
            BETA
          </span>
        </div>
        <StatusIndicator />
      </div>

      {/* ── HUB VISUALIZATION ── */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-4 py-6">
        <HubVisualization />
      </div>

      {/* ── BOTTOM METRICS BAR ── */}
      <div className="relative z-10">
        <MetricsBar />
      </div>
    </div>
  );
}
