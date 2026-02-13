"use client";

import { useEffect, useState } from "react";

// --- Constants ---

const COLORS = {
  bg: "#0B1120",
  surface: "#111B2E",
  surfaceElevated: "#162236",
  primary: "#7DD3FC",
  accent: "#BAE6FD",
  frostWhite: "#F0F9FF",
  text: "#E2E8F0",
  muted: "#64748B",
  dim: "#475569",
  success: "#6EE7B7",
  warning: "#FCD34D",
  danger: "#FCA5A5",
  border: "rgba(125,211,252,0.06)",
  frostBorder: "rgba(255,255,255,0.04)",
};

const FONT = "'Instrument Sans', system-ui, -apple-system, sans-serif";

const SPRING_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// --- Hooks ---

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let frame: number;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return count;
}

function useStaggeredVisible(count: number, baseDelay: number = 80) {
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

// --- Data ---

const CHART_DATA = [
  42, 44, 43, 47, 51, 49, 53, 56, 54, 58,
  62, 60, 64, 68, 66, 70, 72, 75, 73, 78,
  76, 80, 83, 81, 85, 88, 86, 90, 92, 94,
];

const ASSETS = [
  { name: "USDC Vault", symbol: "USDC", allocation: 34, value: 436737, color: COLORS.primary },
  { name: "ETH Staking", symbol: "ETH", allocation: 28, value: 359666, color: COLORS.accent },
  { name: "BTC Yield", symbol: "BTC", allocation: 20, value: 256904, color: COLORS.success },
  { name: "AVAX LP", symbol: "AVAX", allocation: 12, value: 154142, color: COLORS.warning },
  { name: "stETH Pool", symbol: "stETH", allocation: 6, value: 77071, color: "#A78BFA" },
];

const TRANSACTIONS = [
  { date: "Feb 09", asset: "USDC", type: "Deposit", amount: "+$50,000.00", status: "confirmed" },
  { date: "Feb 08", asset: "ETH", type: "Stake", amount: "+12.450 ETH", status: "confirmed" },
  { date: "Feb 07", asset: "AVAX", type: "Swap", amount: "2,400 AVAX", status: "confirmed" },
  { date: "Feb 06", asset: "BTC", type: "Yield", amount: "+0.0341 BTC", status: "pending" },
  { date: "Feb 05", asset: "USDC", type: "Withdraw", amount: "-$12,500.00", status: "confirmed" },
  { date: "Feb 04", asset: "stETH", type: "Deposit", amount: "+4.200 stETH", status: "failed" },
];

const METRICS = [
  { label: "APY", value: "8.42%", sub: "30d avg" },
  { label: "TVL", value: "$48.2M", sub: "protocol" },
  { label: "POSITIONS", value: "12", sub: "active" },
  { label: "YIELD", value: "$2,847", sub: "this month" },
  { label: "RISK", value: "LOW", sub: "score: 94" },
];

const SPARKLINE_DATA = [3, 5, 4, 7, 6, 8, 7, 9, 8, 11, 10, 12];

// --- Sub-components ---

function FrostCard({
  children,
  style,
  visible = true,
  delay = 0,
  hoverable = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  visible?: boolean;
  delay?: number;
  hoverable?: boolean;
}) {
  return (
    <div
      className="frost-card"
      style={{
        background: `linear-gradient(180deg, ${COLORS.surfaceElevated} 0%, ${COLORS.surface} 100%)`,
        border: `1px solid ${COLORS.frostBorder}`,
        borderRadius: 12,
        boxShadow: `0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: "blur(40px) saturate(1.8)",
        WebkitBackdropFilter: "blur(40px) saturate(1.8)",
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
        filter: visible ? "blur(0px)" : "blur(4px)",
        transition: `all 500ms ${SPRING_EASE}`,
        transitionDelay: `${delay}ms`,
        ...(hoverable
          ? { cursor: "pointer" }
          : {}),
        ...style,
      }}
    >
      {/* Frosted top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
      {/* Ice shimmer overlay */}
      <div className="frost-shimmer" />
      {children}
    </div>
  );
}

function AreaChart() {
  const min = Math.min(...CHART_DATA);
  const max = Math.max(...CHART_DATA);
  const width = 560;
  const height = 200;
  const padY = 16;

  const points = CHART_DATA.map((v, i) => ({
    x: (i / (CHART_DATA.length - 1)) * width,
    y: padY + ((max - v) / (max - min)) * (height - padY * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="frost-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.25" />
          <stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="frost-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.4" />
          <stop offset="50%" stopColor={COLORS.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.6" />
        </linearGradient>
        <filter id="frost-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={0}
          y1={padY + frac * (height - padY * 2)}
          x2={width}
          y2={padY + frac * (height - padY * 2)}
          stroke="rgba(255,255,255,0.03)"
          strokeDasharray="4 8"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#frost-area-fill)" className="frost-area-animate" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#frost-line-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#frost-glow)"
        className="frost-line-animate"
      />

      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="4"
        fill={COLORS.primary}
        className="frost-pulse-dot"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="8"
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="1"
        opacity="0.3"
        className="frost-pulse-ring"
      />
    </svg>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 80;
  const h = 28;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = 2 + ((max - v) / (max - min || 1)) * (h - 4);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
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

function ProgressRing({
  percent,
  size = 48,
  strokeWidth = 4,
  color,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
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
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="frost-ring-animate"
      />
    </svg>
  );
}

function GaugeArc({
  percent,
  size = 56,
  color,
}: {
  percent: number;
  size?: number;
  color: string;
}) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;

  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (start: number, end: number) => {
    const s = polarToCartesian(size / 2, size / 2, radius, start);
    const e = polarToCartesian(size / 2, size / 2, radius, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const filledAngle = startAngle + (percent / 100) * totalAngle;

  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.78}`}>
      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={arcPath(startAngle, filledAngle)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="frost-ring-animate"
      />
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    confirmed: { bg: "rgba(110,231,183,0.1)", text: COLORS.success, label: "Confirmed" },
    pending: { bg: "rgba(252,211,77,0.1)", text: COLORS.warning, label: "Pending" },
    failed: { bg: "rgba(252,165,165,0.1)", text: COLORS.danger, label: "Failed" },
  };
  const s = map[status] || map.confirmed;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        background: s.bg,
        color: s.text,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: FONT,
        letterSpacing: "0.02em",
      }}
    >
      {s.label}
    </span>
  );
}

// --- Main Component ---

export function FrostProtocolPreview() {
  const portfolioValue = useCountUp(1284520, 2200);
  const staggered = useStaggeredVisible(14, 80);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const formatCurrency = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatCompact = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        fontFamily: FONT,
        color: COLORS.text,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes frostIn {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(8px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        @keyframes frostShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes frostPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes frostPulseRing {
          0% { r: 4; opacity: 0.4; }
          100% { r: 16; opacity: 0; }
        }

        @keyframes frostGridPulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }

        @keyframes frostDrift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes frostLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes frostAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes frostRingReveal {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: inherit; }
        }

        @keyframes frostBreathing {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .frost-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(125,211,252,0.02) 50%,
            transparent 100%
          );
          animation: frostShimmer 4s ease-in-out infinite;
          pointer-events: none;
        }

        .frost-card:hover {
          border-color: rgba(125,211,252,0.12) !important;
          transform: scale(1.01) !important;
        }

        .frost-pulse-dot {
          animation: frostPulse 2s ease-in-out infinite;
        }

        .frost-pulse-ring {
          animation: frostPulseRing 2s ease-out infinite;
        }

        .frost-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: frostLineReveal 1.8s ${SPRING_EASE} 0.3s forwards;
        }

        .frost-area-animate {
          opacity: 0;
          animation: frostAreaReveal 1s ease 1.2s forwards;
        }

        .frost-ring-animate {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: frostRingReveal 1.2s ${SPRING_EASE} 0.5s forwards;
        }

        .frost-breathing {
          animation: frostBreathing 3s ease-in-out infinite;
        }

        .frost-row:nth-child(even) {
          background: rgba(255,255,255,0.01);
        }

        .frost-row:hover {
          background: rgba(125,211,252,0.03) !important;
        }

        .frost-nav-pill {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: ${COLORS.muted};
          cursor: pointer;
          transition: all 200ms ease;
          border: 1px solid transparent;
          background: transparent;
          font-family: ${FONT};
        }

        .frost-nav-pill:hover {
          color: ${COLORS.text};
          background: rgba(125,211,252,0.04);
        }

        .frost-nav-pill.active {
          color: ${COLORS.primary};
          background: rgba(125,211,252,0.06);
          border-color: rgba(125,211,252,0.1);
        }
      `}</style>

      {/* Background: Grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(125,211,252,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(125,211,252,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "frostGridPulse 8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Background: Drifting ice blob */}
      <div
        style={{
          position: "fixed",
          top: "15%",
          right: "10%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}08 0%, transparent 70%)`,
          filter: "blur(60px)",
          animation: "frostDrift 20s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "20%",
          left: "5%",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accent}06 0%, transparent 70%)`,
          filter: "blur(50px)",
          animation: "frostDrift 25s ease-in-out infinite reverse",
          pointerEvents: "none",
        }}
      />

      {/* Content container */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
        {/* ===== TOP BAR ===== */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 0",
            borderBottom: `1px solid ${COLORS.frostBorder}`,
            opacity: staggered[0] ? 1 : 0,
            transform: staggered[0] ? "translateY(0)" : "translateY(-8px)",
            transition: `all 500ms ${SPRING_EASE}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {/* Wordmark */}
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "0.15em",
                color: COLORS.primary,
                fontFamily: FONT,
              }}
            >
              FROST
            </span>

            {/* Nav pills */}
            <nav style={{ display: "flex", gap: 4 }}>
              <button className="frost-nav-pill active">Portfolio</button>
              <button className="frost-nav-pill">Markets</button>
              <button className="frost-nav-pill">Vaults</button>
              <button className="frost-nav-pill">Governance</button>
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Network badge */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.dim,
                letterSpacing: "0.06em",
                padding: "4px 10px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${COLORS.frostBorder}`,
                fontFamily: FONT,
              }}
            >
              Avalanche C-Chain
            </span>
            {/* Connection dot */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: COLORS.success,
                  boxShadow: `0 0 8px ${COLORS.success}60`,
                }}
                className="frost-breathing"
              />
              <span style={{ fontSize: 11, color: COLORS.muted, fontFamily: FONT }}>0x7a...3f2d</span>
            </div>
          </div>
        </header>

        {/* ===== HERO SECTION ===== */}
        <section style={{ padding: "48px 0 32px" }}>
          <FrostCard
            visible={staggered[1]}
            delay={80}
            style={{ padding: "40px 48px", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 12,
                fontFamily: FONT,
              }}
            >
              Total Value Locked
            </p>
            <p
              style={{
                fontSize: 48,
                fontWeight: 600,
                color: COLORS.frostWhite,
                fontFamily: FONT,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {formatCurrency(portfolioValue)}
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 16,
                padding: "4px 12px",
                borderRadius: 8,
                background: "rgba(110,231,183,0.08)",
                border: "1px solid rgba(110,231,183,0.12)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2L10 7H2L6 2Z" fill={COLORS.success} />
              </svg>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.success,
                  fontFamily: FONT,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                +12.4%
              </span>
              <span style={{ fontSize: 11, color: COLORS.muted, fontFamily: FONT }}>30d</span>
            </div>
          </FrostCard>
        </section>

        {/* ===== METRICS STRIP ===== */}
        <FrostCard
          visible={staggered[2]}
          delay={160}
          style={{ padding: "0", marginBottom: 24 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
            }}
          >
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  borderRight: i < METRICS.length - 1 ? `1px solid ${COLORS.frostBorder}` : "none",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: COLORS.muted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                    fontFamily: FONT,
                  }}
                >
                  {m.label}
                </p>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: m.label === "RISK" ? COLORS.success : COLORS.frostWhite,
                    fontFamily: FONT,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.3,
                  }}
                >
                  {m.value}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: COLORS.dim,
                    fontFamily: FONT,
                    marginTop: 2,
                  }}
                >
                  {m.sub}
                </p>
              </div>
            ))}
          </div>
        </FrostCard>

        {/* ===== TWO-COLUMN LAYOUT ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24, marginBottom: 24 }}>
          {/* Left: Area Chart */}
          <FrostCard
            visible={staggered[3]}
            delay={240}
            style={{ padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: COLORS.muted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: FONT,
                  }}
                >
                  Portfolio Performance
                </p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["7D", "30D", "90D", "1Y"].map((period) => (
                  <button
                    key={period}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: FONT,
                      color: period === "30D" ? COLORS.primary : COLORS.dim,
                      background: period === "30D" ? "rgba(125,211,252,0.06)" : "transparent",
                      border: period === "30D" ? `1px solid rgba(125,211,252,0.1)` : "1px solid transparent",
                      cursor: "pointer",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 200 }}>
              <AreaChart />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
                padding: "0 4px",
              }}
            >
              {["Jan 10", "Jan 17", "Jan 24", "Jan 31", "Feb 07"].map((d) => (
                <span
                  key={d}
                  style={{
                    fontSize: 11,
                    color: COLORS.dim,
                    fontFamily: FONT,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </FrostCard>

          {/* Right: Asset Breakdown */}
          <FrostCard
            visible={staggered[4]}
            delay={320}
            style={{ padding: "24px" }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 20,
                fontFamily: FONT,
              }}
            >
              Asset Allocation
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {ASSETS.map((asset) => (
                <div key={asset.symbol}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.text,
                          fontFamily: FONT,
                        }}
                      >
                        {asset.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: COLORS.dim,
                          fontFamily: FONT,
                        }}
                      >
                        {asset.symbol}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.frostWhite,
                          fontFamily: FONT,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatCompact(asset.value)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: COLORS.muted,
                          fontFamily: FONT,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {asset.allocation}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div
                    style={{
                      height: 3,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.03)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${asset.allocation}%`,
                        borderRadius: 2,
                        background: asset.color,
                        opacity: 0.7,
                        transition: `width 1s ${SPRING_EASE}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </FrostCard>
        </div>

        {/* ===== TRANSACTION TABLE ===== */}
        <FrostCard
          visible={staggered[5]}
          delay={400}
          style={{ padding: "0", marginBottom: 24 }}
        >
          <div style={{ padding: "20px 24px 12px" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: FONT,
              }}
            >
              Recent Transactions
            </p>
          </div>

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 100px 1fr 100px",
              padding: "8px 24px",
              borderBottom: `1px solid ${COLORS.frostBorder}`,
            }}
          >
            {["Date", "Asset", "Type", "Amount", "Status"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: COLORS.dim,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: FONT,
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Table rows */}
          {TRANSACTIONS.map((tx, i) => (
            <div
              key={i}
              className="frost-row"
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 100px 1fr 100px",
                padding: "12px 24px",
                alignItems: "center",
                borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid ${COLORS.frostBorder}` : "none",
                transition: "background 200ms ease",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: COLORS.muted,
                  fontFamily: FONT,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tx.date}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLORS.text,
                  fontFamily: FONT,
                }}
              >
                {tx.asset}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: COLORS.muted,
                  fontFamily: FONT,
                }}
              >
                {tx.type}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLORS.frostWhite,
                  fontFamily: FONT,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tx.amount}
              </span>
              <StatusPill status={tx.status} />
            </div>
          ))}
        </FrostCard>

        {/* ===== BOTTOM STATS BAR ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, paddingBottom: 48 }}>
          {/* Protocol Health */}
          <FrostCard
            visible={staggered[6]}
            delay={480}
            style={{ padding: "24px", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: FONT,
              }}
            >
              Protocol Health
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <GaugeArc percent={94} color={COLORS.success} />
            </div>
            <p
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.success,
                fontFamily: FONT,
                fontVariantNumeric: "tabular-nums",
              }}
              className="frost-breathing"
            >
              94
            </p>
            <p style={{ fontSize: 11, color: COLORS.dim, fontFamily: FONT, marginTop: 2 }}>
              Excellent
            </p>
          </FrostCard>

          {/* Network Fees */}
          <FrostCard
            visible={staggered[7]}
            delay={560}
            style={{ padding: "24px", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: FONT,
              }}
            >
              Network Fees
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Sparkline data={SPARKLINE_DATA} color={COLORS.primary} />
            </div>
            <p
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.frostWhite,
                fontFamily: FONT,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              0.024 AVAX
            </p>
            <p style={{ fontSize: 11, color: COLORS.dim, fontFamily: FONT, marginTop: 2 }}>
              avg gas price
            </p>
          </FrostCard>

          {/* Vault Capacity */}
          <FrostCard
            visible={staggered[8]}
            delay={640}
            style={{ padding: "24px", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
                fontFamily: FONT,
              }}
            >
              Vault Capacity
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <ProgressRing percent={73} color={COLORS.accent} />
            </div>
            <p
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.frostWhite,
                fontFamily: FONT,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              73%
            </p>
            <p style={{ fontSize: 11, color: COLORS.dim, fontFamily: FONT, marginTop: 2 }}>
              $35.2M / $48.2M
            </p>
          </FrostCard>
        </div>
      </div>
    </div>
  );
}
