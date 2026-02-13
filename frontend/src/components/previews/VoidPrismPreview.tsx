"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_HEADING = "'Outfit', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, -apple-system, sans-serif";

const PRISM_GRADIENT =
  "linear-gradient(135deg, #06B6D4, #8B5CF6, #EC4899, #F59E0B, #06B6D4)";

const CHART_DATA = [
  32, 35, 34, 38, 41, 39, 44, 48, 46, 52,
  55, 53, 58, 62, 59, 65, 68, 72, 70, 76,
  74, 79, 82, 86,
];

const ALLOCATIONS = [
  { label: "Stablecoins", pct: 32, hueOffset: 0 },
  { label: "Blue Chips", pct: 26, hueOffset: 60 },
  { label: "Real-World Assets", pct: 22, hueOffset: 150 },
  { label: "DeFi Yield", pct: 14, hueOffset: 210 },
  { label: "Liquid Staking", pct: 6, hueOffset: 290 },
];

const TABLE_ROWS = [
  { asset: "USDC Vault", protocol: "Aave V3", apy: "6.84%", value: "$412,800", status: "active" },
  { asset: "ETH Staking", protocol: "Lido", apy: "4.21%", value: "$346,714", status: "active" },
  { asset: "T-Bill Token", protocol: "OpenEden", apy: "5.12%", value: "$289,400", status: "active" },
  { asset: "BTC Yield", protocol: "Babylon", apy: "3.47%", value: "$201,553", status: "pending" },
  { asset: "AVAX LP", protocol: "Trader Joe", apy: "12.3%", value: "$154,290", status: "active" },
  { asset: "GLP Vault", protocol: "GMX", apy: "8.96%", value: "$98,100", status: "paused" },
];

const BOTTOM_METRICS = [
  { label: "Health Factor", value: "2.84", pct: 94 },
  { label: "Utilization", value: "67%", pct: 67 },
  { label: "Risk Score", value: "A+", pct: 96 },
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useCountUp(end: number, duration: number = 2400) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let frame: number;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setCount(Math.floor(eased * end));
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return count;
}

function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

function useStaggeredVisible(count: number, baseDelay: number = 60) {
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
// Background: Prismatic ambient blobs
// ---------------------------------------------------------------------------

function PrismBackground() {
  const blobs = useMemo(
    () => [
      { top: "-5%", left: "15%", size: 400, opacity: 0.035, speed: 12 },
      { top: "40%", left: "65%", size: 350, opacity: 0.025, speed: 18 },
      { top: "70%", left: "10%", size: 300, opacity: 0.03, speed: 24 },
    ],
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="void-blob"
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(139,92,246,${b.opacity}) 0%, rgba(6,182,212,${b.opacity * 0.5}) 40%, transparent 70%)`,
            filter: `blur(80px)`,
            animation: `voidBlobDrift 20s ease-in-out infinite, prismHueRotate ${b.speed}s linear infinite`,
            animationDelay: `${i * -4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function VoidHeader() {
  const navItems = ["Overview", "Positions", "Yield", "Analytics"];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 0 20px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <span
          style={{
            fontFamily: FONT_HEADING,
            fontSize: 20,
            fontWeight: 200,
            letterSpacing: "0.3em",
            color: "#FFFFFF",
          }}
        >
          VOID
        </span>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "void-nav-active" : "void-nav-item"}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 400,
                color: i === 0 ? "#FFFFFF" : "#666666",
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "color 0.3s ease",
              }}
            >
              {item}
            </span>
          ))}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: "#666666",
            letterSpacing: "0.05em",
          }}
        >
          0x7a3...f19d
        </span>
        <div
          className="void-iridescent-border"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0A0A0A",
          }}
        >
          <span style={{ fontFamily: FONT_HEADING, fontSize: 12, color: "#FFFFFF", fontWeight: 300 }}>
            VP
          </span>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Iridescent divider line
// ---------------------------------------------------------------------------

function IridescentLine({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="void-prism-line"
      style={{
        height: 1,
        background: PRISM_GRADIENT,
        backgroundSize: "300% 100%",
        animation: "prismGradientShift 12s linear infinite",
        opacity: 0.4,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Hero Value
// ---------------------------------------------------------------------------

function HeroValue({ value }: { value: string }) {
  return (
    <div
      className="void-fadeIn"
      style={{
        textAlign: "center",
        padding: "44px 0 48px",
      }}
    >
      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#666666",
          marginBottom: 16,
        }}
      >
        Portfolio Value
      </p>
      <p
        className="void-prism-text"
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 56,
          fontWeight: 300,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: 16,
          background: PRISM_GRADIENT,
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "prismGradientShift 12s linear infinite",
        }}
      >
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span
          className="void-accent-text"
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          +15.2% All Time
        </span>
        <span style={{ color: "#333333" }}>|</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#666666" }}>
          +$418,285 unrealized
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats Row
// ---------------------------------------------------------------------------

interface StatMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

const STATS: StatMetric[] = [
  { label: "APY", value: "7.84%", change: "+0.32%", positive: true },
  { label: "TVL", value: "$62.4M", change: "+$2.1M", positive: true },
  { label: "Positions", value: "14", change: "+2", positive: true },
  { label: "Monthly Yield", value: "$4,218", change: "-$180", positive: false },
];

function StatsRow({ visible }: { visible: boolean[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 0,
        padding: "24px 0",
        position: "relative",
      }}
    >
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          style={{
            padding: "0 24px",
            borderRight: i < STATS.length - 1 ? "1px solid" : "none",
            borderImage: i < STATS.length - 1 ? `${PRISM_GRADIENT} 1` : "none",
            borderImageSlice: 1,
            opacity: visible[i] ? 1 : 0,
            transform: visible[i] ? "translateY(0)" : "translateY(12px)",
            transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
            transitionDelay: `${i * 60}ms`,
          }}
        >
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#666666", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            {stat.label}
          </p>
          <p style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 400, color: "#FFFFFF", marginBottom: 4 }}>
            {stat.value}
          </p>
          <span
            className="void-accent-text"
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 500,
              opacity: stat.positive ? 1 : 0.6,
            }}
          >
            {stat.change}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area Chart
// ---------------------------------------------------------------------------

function PrismAreaChart({ visible }: { visible: boolean }) {
  const min = Math.min(...CHART_DATA);
  const max = Math.max(...CHART_DATA);
  const width = 600;
  const height = 220;
  const padY = 20;

  const points = CHART_DATA.map((v, i) => ({
    x: (i / (CHART_DATA.length - 1)) * width,
    y: padY + ((max - v) / (max - min)) * (height - padY * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const gridLines = [0.25, 0.5, 0.75];
  const labels = ["$86K", "$72K", "$58K", "$44K"];

  return (
    <div
      style={{
        padding: "28px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 400, color: "#FFFFFF", letterSpacing: "0.02em" }}>
          Performance
        </p>
        <div style={{ display: "flex", gap: 16 }}>
          {["1W", "1M", "3M", "1Y", "ALL"].map((period, i) => (
            <span
              key={period}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 11,
                color: i === 3 ? "#FFFFFF" : "#666666",
                cursor: "pointer",
                padding: "3px 8px",
                borderRadius: 4,
                background: i === 3 ? "rgba(255,255,255,0.06)" : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              {period}
            </span>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        {/* Y-axis labels */}
        <div style={{ position: "absolute", left: -44, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {labels.map((l) => (
            <span key={l} style={{ fontFamily: FONT_BODY, fontSize: 10, color: "#333333" }}>{l}</span>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", marginLeft: 4 }}>
          <defs>
            <linearGradient id="void-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="void-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="33%" stopColor="#8B5CF6" />
              <stop offset="66%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="void-line-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines.map((frac) => (
            <line
              key={frac}
              x1={0}
              y1={padY + frac * (height - padY * 2)}
              x2={width}
              y2={padY + frac * (height - padY * 2)}
              stroke="#111111"
              strokeDasharray="4 8"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#void-area-fill)" className="void-area-animate" />

          {/* Line with prism gradient */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#void-line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#void-line-glow)"
            className="void-line-animate"
          />

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill="#FFFFFF"
            className="void-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
            opacity="0.3"
            className="void-pulse-ring"
          />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Allocation Bar
// ---------------------------------------------------------------------------

function AllocationBar({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        padding: "28px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <p style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 400, color: "#FFFFFF", letterSpacing: "0.02em", marginBottom: 20 }}>
        Allocation
      </p>

      {/* Stacked horizontal bar */}
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {ALLOCATIONS.map((a) => (
          <div
            key={a.label}
            className="void-prism-segment"
            style={{
              width: `${a.pct}%`,
              background: PRISM_GRADIENT,
              backgroundSize: "300% 300%",
              animation: "prismGradientShift 12s linear infinite",
              filter: `hue-rotate(${a.hueOffset}deg)`,
              transition: "filter 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {ALLOCATIONS.map((a) => (
          <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              className="void-prism-segment"
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: PRISM_GRADIENT,
                backgroundSize: "300% 300%",
                animation: "prismGradientShift 12s linear infinite",
                filter: `hue-rotate(${a.hueOffset}deg)`,
              }}
            />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#666666" }}>
              {a.label}
            </span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#FFFFFF" }}>
              {a.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data Table
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: "#06B6D4",
    pending: "#F59E0B",
    paused: "#666666",
  };
  const color = colorMap[status] || "#666666";

  return (
    <span
      className="void-accent-dot"
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        boxShadow: status === "active" ? `0 0 8px ${color}40` : "none",
      }}
    />
  );
}

function DataTable({ visible }: { visible: boolean[] }) {
  return (
    <div style={{ padding: "28px 0" }}>
      <p style={{ fontFamily: FONT_HEADING, fontSize: 15, fontWeight: 400, color: "#FFFFFF", letterSpacing: "0.02em", marginBottom: 20 }}>
        Active Positions
      </p>

      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 0.6fr",
          padding: "0 0 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {["Asset", "Protocol", "APY", "Value", "Status"].map((h) => (
          <span key={h} style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#333333", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {TABLE_ROWS.map((row, i) => (
        <div
          key={row.asset}
          className="void-table-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 0.6fr",
            padding: "14px 0",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            opacity: visible[i] ? 1 : 0,
            transform: visible[i] ? "translateX(0)" : "translateX(-8px)",
            transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
            transitionDelay: `${i * 50}ms`,
          }}
        >
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>
            {row.asset}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#666666" }}>
            {row.protocol}
          </span>
          <span
            className="void-accent-text"
            style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500 }}
          >
            {row.apy}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
            {row.value}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusDot status={row.status} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#666666", textTransform: "capitalize" }}>
              {row.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress Ring with iridescent stroke
// ---------------------------------------------------------------------------

function PrismRing({
  pct,
  size = 56,
  strokeWidth = 4,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const gradientId = `void-ring-grad-${pct}`;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="33%" stopColor="#8B5CF6" />
          <stop offset="66%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="void-ring-animate"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Bottom Metrics
// ---------------------------------------------------------------------------

function BottomMetrics({ visible }: { visible: boolean[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 24,
        padding: "28px 0 40px",
      }}
    >
      {BOTTOM_METRICS.map((m, i) => (
        <div
          key={m.label}
          className="void-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "20px 24px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.04)",
            background: "#0A0A0A",
            opacity: visible[i] ? 1 : 0,
            transform: visible[i] ? "translateY(0)" : "translateY(12px)",
            transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
            transitionDelay: `${i * 80}ms`,
          }}
        >
          <PrismRing pct={m.pct} />
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#666666", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              {m.label}
            </p>
            <p style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 400, color: "#FFFFFF" }}>
              {m.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function VoidPrismPreview() {
  useFonts();
  const portfolioRaw = useCountUp(3142857, 2600);
  const staggered = useStaggeredVisible(18, 60);

  const portfolioFormatted = "$" + portfolioRaw.toLocaleString("en-US");

  return (
    <div
      style={{
        background: "#000000",
        minHeight: "100vh",
        fontFamily: FONT_BODY,
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        /* ------------------------------------------------------------ */
        /* Prism Shift Keyframes                                         */
        /* ------------------------------------------------------------ */

        @keyframes prismGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes prismHueRotate {
          0% { filter: hue-rotate(0deg) blur(80px); }
          100% { filter: hue-rotate(360deg) blur(80px); }
        }

        @keyframes voidFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes voidBlobDrift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(25px, -15px) scale(1.04); }
          66% { transform: translate(-15px, 20px) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes voidPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes voidPulseRing {
          0% { r: 4; opacity: 0.4; }
          100% { r: 18; opacity: 0; }
        }

        @keyframes voidLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes voidAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes voidRingReveal {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: inherit; }
        }

        @keyframes voidAccentCycle {
          0% { color: #06B6D4; }
          25% { color: #EC4899; }
          50% { color: #F59E0B; }
          75% { color: #8B5CF6; }
          100% { color: #06B6D4; }
        }

        @keyframes voidBorderIridescent {
          0% { border-color: rgba(6,182,212,0.2); }
          25% { border-color: rgba(236,72,153,0.2); }
          50% { border-color: rgba(245,158,11,0.2); }
          75% { border-color: rgba(139,92,246,0.2); }
          100% { border-color: rgba(6,182,212,0.2); }
        }

        @keyframes voidGlowPulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(139,92,246,0);
          }
          50% {
            box-shadow: 0 0 30px rgba(139,92,246,0.06);
          }
        }

        /* ------------------------------------------------------------ */
        /* Element Styles                                                */
        /* ------------------------------------------------------------ */

        .void-fadeIn {
          animation: voidFadeIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .void-accent-text {
          animation: voidAccentCycle 12s linear infinite;
        }

        .void-accent-dot {
          animation: voidAccentCycle 12s linear infinite;
        }

        .void-prism-text {
          display: inline-block;
        }

        .void-prism-line {
          border: none;
        }

        .void-nav-item:hover {
          color: #FFFFFF !important;
        }

        .void-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: voidBorderIridescent 12s linear infinite;
        }

        .void-card:hover {
          border-color: rgba(139,92,246,0.15) !important;
          box-shadow:
            0 0 40px rgba(139,92,246,0.06),
            0 0 80px rgba(6,182,212,0.03),
            inset 0 1px 0 rgba(255,255,255,0.03);
          background: #111111 !important;
        }

        .void-iridescent-border {
          border: 1px solid rgba(255,255,255,0.08);
          animation: voidBorderIridescent 12s linear infinite;
          transition: all 0.3s ease;
        }

        .void-iridescent-border:hover {
          border-color: rgba(139,92,246,0.3) !important;
          box-shadow: 0 0 20px rgba(139,92,246,0.1);
        }

        .void-table-row {
          transition: background 0.2s ease;
        }

        .void-table-row:hover {
          background: rgba(255,255,255,0.02);
        }

        .void-pulse-dot {
          animation: voidPulse 2s ease-in-out infinite;
        }

        .void-pulse-ring {
          animation: voidPulseRing 2s ease-out infinite;
        }

        .void-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: voidLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .void-area-animate {
          opacity: 0;
          animation: voidAreaReveal 1s ease 1.4s forwards;
        }

        .void-ring-animate {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: voidRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        .void-prism-segment {
          position: relative;
        }

        .void-prism-segment + .void-prism-segment {
          border-left: 1px solid rgba(0,0,0,0.3);
        }

        /* Scrollbar styling */
        .void-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .void-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .void-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
        }
      `}</style>

      {/* Background */}
      <PrismBackground />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        {/* Header */}
        <VoidHeader />
        <IridescentLine />

        {/* Hero */}
        <HeroValue value={portfolioFormatted} />
        <IridescentLine style={{ opacity: 0.15 }} />

        {/* Stats */}
        <StatsRow visible={[staggered[0], staggered[1], staggered[2], staggered[3]]} />
        <IridescentLine style={{ opacity: 0.15 }} />

        {/* Chart */}
        <PrismAreaChart visible={staggered[4]} />
        <IridescentLine style={{ opacity: 0.15 }} />

        {/* Allocation */}
        <AllocationBar visible={staggered[5]} />
        <IridescentLine style={{ opacity: 0.15 }} />

        {/* Table */}
        <DataTable
          visible={[
            staggered[6],
            staggered[7],
            staggered[8],
            staggered[9],
            staggered[10],
            staggered[11],
          ]}
        />
        <IridescentLine style={{ opacity: 0.15 }} />

        {/* Bottom Metrics */}
        <BottomMetrics
          visible={[staggered[12], staggered[13], staggered[14]]}
        />
      </div>
    </div>
  );
}
