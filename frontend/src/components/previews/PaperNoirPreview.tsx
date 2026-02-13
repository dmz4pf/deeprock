"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_HEADING = "'Cormorant', 'Georgia', serif";
const FONT_BODY = "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'Menlo', monospace";

const COLOR = {
  bg: "#1A1815",
  surface: "#242119",
  surfaceElevated: "#2E2A22",
  inkBlack: "#0A0908",
  ivory: "#F5F0E3",
  warmGray: "#B8A99A",
  charcoal: "#7A6F63",
  brushRed: "#C2564A",
  brushIndigo: "#4A6FA5",
  inkWash: "#8B7E6E",
  mossGreen: "#7A9A6B",
  border: "rgba(245,240,227,0.06)",
} as const;

const CHART_DATA = [
  28, 32, 30, 35, 38, 36, 42, 45, 43, 48,
  52, 50, 56, 60, 58, 63, 67, 72, 69, 75,
  78, 82, 80, 86,
];

const STAT_CARDS = [
  { label: "Yield Earned", value: "$24,680", change: "+12.4%", positive: true },
  { label: "Positions", value: "14", change: "+2 this week", positive: true },
  { label: "Avg APY", value: "6.82%", change: "+0.34%", positive: true },
  { label: "Risk Score", value: "A+", change: "Stable", positive: true },
];

const LEDGER_ROWS = [
  { asset: "US Treasury 6M", protocol: "OpenEden", apy: "5.12%", value: "$489,200", status: "active" },
  { asset: "Corporate Bond", protocol: "Backed", apy: "6.84%", value: "$346,714", status: "active" },
  { asset: "USDC Lending", protocol: "Aave V3", apy: "4.21%", value: "$312,400", status: "active" },
  { asset: "Real Estate LP", protocol: "Centrifuge", apy: "8.96%", value: "$254,100", status: "urgent" },
  { asset: "Gold Token", protocol: "Paxos", apy: "3.47%", value: "$198,553", status: "completed" },
  { asset: "Carbon Credits", protocol: "Toucan", apy: "11.2%", value: "$141,723", status: "active" },
];

const BOTTOM_METRICS = [
  { label: "Collateral Ratio", value: "284%", numericValue: 94 },
  { label: "Portfolio Health", value: "Excellent", numericValue: 96 },
  { label: "Diversification", value: "8 / 10", numericValue: 80 },
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
      const eased = 1 - Math.pow(1 - t, 3);
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
      "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

// ---------------------------------------------------------------------------
// SVG Brush Strokes
// ---------------------------------------------------------------------------

function BrushStrokeDivider({
  width = 200,
  color = COLOR.inkWash,
  opacity = 0.3,
  delay = 0,
}: {
  width?: number;
  color?: string;
  opacity?: number;
  delay?: number;
}) {
  return (
    <svg
      width={width}
      height="12"
      viewBox={`0 0 ${width} 12`}
      fill="none"
      style={{ display: "block", opacity }}
      className="brush-stroke-draw"
    >
      <path
        d={`M 0,6 C ${width * 0.15},2 ${width * 0.3},9 ${width * 0.45},5 C ${width * 0.6},1 ${width * 0.75},8 ${width},6`}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: width * 1.5,
          strokeDashoffset: width * 1.5,
          animation: `brushDraw 1.2s ease-out ${delay}ms forwards`,
        }}
      />
    </svg>
  );
}

function BrushCircle({
  size = 60,
  color = COLOR.inkWash,
  opacity = 0.15,
  delay = 0,
}: {
  size?: number;
  color?: string;
  opacity?: number;
  delay?: number;
}) {
  const r = size / 2 - 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={{ opacity }}
    >
      <path
        d={`M ${size / 2 + r},${size / 2 - 2}
            C ${size / 2 + r + 1},${size / 2 + r * 0.6} ${size / 2 + r * 0.5},${size / 2 + r + 2} ${size / 2 - 2},${size / 2 + r}
            C ${size / 2 - r * 0.7},${size / 2 + r - 1} ${size / 2 - r - 1},${size / 2 + r * 0.4} ${size / 2 - r},${size / 2 + 1}
            C ${size / 2 - r + 1},${size / 2 - r * 0.5} ${size / 2 - r * 0.4},${size / 2 - r - 1} ${size / 2 + 1},${size / 2 - r}
            C ${size / 2 + r * 0.6},${size / 2 - r + 1} ${size / 2 + r + 1},${size / 2 - r * 0.6} ${size / 2 + r},${size / 2 - 2}`}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: size * 3.2,
          strokeDashoffset: size * 3.2,
          animation: `brushDraw 1.6s ease-out ${delay}ms forwards`,
        }}
      />
    </svg>
  );
}

function BrushDashes({
  width = 80,
  color = COLOR.inkWash,
  opacity = 0.2,
  delay = 0,
}: {
  width?: number;
  color?: string;
  opacity?: number;
  delay?: number;
}) {
  const dashWidth = width / 4;
  return (
    <svg
      width={width}
      height="10"
      viewBox={`0 0 ${width} 10`}
      fill="none"
      style={{ opacity }}
    >
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${i * dashWidth * 1.4 + 2},5 C ${i * dashWidth * 1.4 + dashWidth * 0.3},3 ${i * dashWidth * 1.4 + dashWidth * 0.7},7 ${i * dashWidth * 1.4 + dashWidth},5`}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            strokeDasharray: dashWidth * 1.5,
            strokeDashoffset: dashWidth * 1.5,
            animation: `brushDraw 0.8s ease-out ${delay + i * 150}ms forwards`,
          }}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Red Seal Stamp (Hanko)
// ---------------------------------------------------------------------------

function RedSealStamp() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className="seal-stamp-enter"
      style={{ position: "absolute", top: 16, right: 20 }}
    >
      <circle
        cx="20"
        cy="20"
        r="17"
        stroke={COLOR.brushRed}
        strokeWidth="2"
        fill="none"
        opacity="0.85"
      />
      <circle
        cx="20"
        cy="20"
        r="14"
        stroke={COLOR.brushRed}
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />
      <line
        x1="13"
        y1="16"
        x2="27"
        y2="16"
        stroke={COLOR.brushRed}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <line
        x1="14"
        y1="21"
        x2="26"
        y2="21"
        stroke={COLOR.brushRed}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <line
        x1="16"
        y1="26"
        x2="24"
        y2="26"
        stroke={COLOR.brushRed}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Paper Grain Texture Overlay
// ---------------------------------------------------------------------------

function PaperGrainOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Warm Vignette Background
// ---------------------------------------------------------------------------

function WarmVignette() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        background:
          "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(10,9,8,0.4) 100%)",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function NoirHeader() {
  const navItems = ["Overview", "Positions", "Yield", "Ledger"];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "28px 0 22px",
        marginBottom: 8,
        borderBottom: `1px solid ${COLOR.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 28,
              fontWeight: 500,
              fontStyle: "italic",
              color: COLOR.ivory,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            Paper Noir
          </span>
          <BrushStrokeDivider width={120} opacity={0.25} delay={400} />
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className="noir-nav-item"
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 400,
                color: i === 0 ? COLOR.ivory : COLOR.charcoal,
                cursor: "pointer",
                letterSpacing: "0.03em",
                transition: "color 0.4s ease",
              }}
            >
              {item}
            </span>
          ))}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLOR.charcoal,
            letterSpacing: "0.05em",
          }}
        >
          0x7a3f...e821
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            background: COLOR.surfaceElevated,
            border: `1px solid ${COLOR.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 35%, ${COLOR.inkWash}, ${COLOR.charcoal})`,
            }}
          />
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection() {
  const portfolioValue = useCountUp(1842690, 2600);

  const formatted = useMemo(() => {
    return `$${portfolioValue.toLocaleString("en-US")}`;
  }, [portfolioValue]);

  return (
    <div
      className="noir-fade-in"
      style={{
        position: "relative",
        padding: "36px 0 28px",
        marginBottom: 8,
      }}
    >
      <RedSealStamp />

      <p
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 14,
          fontWeight: 400,
          fontStyle: "italic",
          color: COLOR.charcoal,
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        Portfolio
      </p>

      <p
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 52,
          fontWeight: 300,
          color: COLOR.ivory,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
          marginBottom: 16,
        }}
      >
        {formatted}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: COLOR.mossGreen,
            padding: "4px 10px",
            borderRadius: 3,
            background: "rgba(122,154,107,0.08)",
            border: "1px solid rgba(122,154,107,0.15)",
          }}
        >
          +14.88% all time
        </span>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: COLOR.charcoal,
          }}
        >
          |
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: COLOR.warmGray,
          }}
        >
          +$241,320 unrealized
        </span>
      </div>

      <BrushStrokeDivider width={280} color={COLOR.inkWash} opacity={0.2} delay={600} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Cards
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  change,
  positive,
  delay = 0,
  accentIndex = 0,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  delay?: number;
  accentIndex?: number;
}) {
  const accentColors = [COLOR.inkWash, COLOR.brushIndigo, COLOR.warmGray, COLOR.brushRed];
  const accent = accentColors[accentIndex % accentColors.length];

  return (
    <div
      className="noir-card noir-fade-in"
      style={{
        animationDelay: `${delay}ms`,
        position: "relative",
        borderRadius: 4,
        padding: "20px 18px 16px",
        background: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: "0 8px 24px rgba(26,24,21,0.5)",
        overflow: "hidden",
        transition: "box-shadow 0.5s ease, border-color 0.5s ease",
      }}
    >
      {/* Paper grain on card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          pointerEvents: "none",
        }}
      />

      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 500,
          color: COLOR.charcoal,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 28,
          fontWeight: 500,
          color: COLOR.ivory,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          marginBottom: 8,
        }}
      >
        {value}
      </p>

      <p
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: positive ? COLOR.mossGreen : COLOR.brushRed,
          marginBottom: 12,
        }}
      >
        {change}
      </p>

      <div style={{ marginTop: "auto" }}>
        <BrushStrokeDivider
          width={60}
          color={accent}
          opacity={0.35}
          delay={delay + 400}
        />
      </div>
    </div>
  );
}

function StatCardsGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {STAT_CARDS.map((card, i) => (
        <StatCard
          key={card.label}
          {...card}
          delay={200 + i * 100}
          accentIndex={i}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hand-Drawn Chart
// ---------------------------------------------------------------------------

function HandDrawnChart() {
  const width = 680;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...CHART_DATA);
  const minVal = Math.min(...CHART_DATA);
  const range = maxVal - minVal;

  const points = useMemo(() => {
    return CHART_DATA.map((val, i) => {
      const x = padding.left + (i / (CHART_DATA.length - 1)) * chartW;
      const y = padding.top + (1 - (val - minVal) / range) * chartH;
      return { x, y };
    });
  }, [chartW, chartH, minVal, range]);

  // Build a slightly wobbly bezier path for hand-drawn feel
  const buildWobblyPath = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const tension = 0.3;
      const wobbleX = (Math.random() - 0.5) * 2;
      const wobbleY = (Math.random() - 0.5) * 3;
      const cp1x = prev.x + (curr.x - prev.x) * tension + wobbleX;
      const cp1y = prev.y + wobbleY;
      const cp2x = curr.x - (curr.x - prev.x) * tension + wobbleX;
      const cp2y = curr.y + wobbleY;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
    }
    return d;
  }, [points]);

  // Area fill path
  const areaPath = useMemo(() => {
    if (!buildWobblyPath) return "";
    const lastPt = points[points.length - 1];
    const firstPt = points[0];
    return `${buildWobblyPath} L ${lastPt.x},${height - padding.bottom} L ${firstPt.x},${height - padding.bottom} Z`;
  }, [buildWobblyPath, points, height, padding.bottom]);

  // Wobbly grid lines
  const gridLines = useMemo(() => {
    const lines: string[] = [];
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (i / ySteps) * chartH;
      const wobbles = 8;
      let d = `M ${padding.left},${y}`;
      for (let w = 1; w <= wobbles; w++) {
        const x = padding.left + (w / wobbles) * chartW;
        const yOff = (Math.random() - 0.5) * 1.2;
        d += ` L ${x.toFixed(1)},${(y + yOff).toFixed(1)}`;
      }
      lines.push(d);
    }
    return lines;
  }, [chartH, chartW, padding.left, padding.top]);

  // Y-axis labels
  const yLabels = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const val = minVal + (range * (4 - i)) / 4;
      const y = padding.top + (i / 4) * chartH;
      return { val: val.toFixed(0), y };
    });
  }, [minVal, range, chartH, padding.top]);

  return (
    <div
      className="noir-card noir-fade-in"
      style={{
        animationDelay: "500ms",
        borderRadius: 4,
        padding: "20px 16px 12px",
        background: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: "0 8px 24px rgba(26,24,21,0.5)",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Card grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            fontFamily: FONT_HEADING,
            fontSize: 16,
            fontWeight: 500,
            fontStyle: "italic",
            color: COLOR.warmGray,
          }}
        >
          Portfolio Performance
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLOR.charcoal,
          }}
        >
          24 months
        </span>
      </div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="noirAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR.brushIndigo} stopOpacity="0.1" />
            <stop offset="100%" stopColor={COLOR.brushIndigo} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines — slightly wobbly */}
        {gridLines.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke={COLOR.ivory}
            strokeWidth="0.5"
            strokeOpacity="0.04"
            fill="none"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((item, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={item.y + 3}
            textAnchor="end"
            fill={COLOR.charcoal}
            fontSize="9"
            fontFamily={FONT_MONO}
          >
            {item.val}
          </text>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#noirAreaGrad)"
          className="noir-chart-reveal"
        />

        {/* Main line — hand-drawn */}
        <path
          d={buildWobblyPath}
          stroke={COLOR.brushIndigo}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="noir-chart-line-draw"
          style={{
            strokeDasharray: 1200,
            strokeDashoffset: 1200,
            animation: "chartLineDraw 2s ease-out 700ms forwards",
          }}
        />

        {/* End dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={COLOR.brushIndigo}
            className="noir-fade-in"
            style={{ animationDelay: "2200ms" }}
          >
            <animate
              attributeName="r"
              values="4;5.5;4"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ledger Table
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: COLOR.brushIndigo,
    urgent: COLOR.brushRed,
    completed: COLOR.mossGreen,
  };
  const c = colorMap[status] || COLOR.charcoal;

  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: c,
        marginRight: 8,
        boxShadow: `0 0 6px ${c}40`,
      }}
    />
  );
}

function LedgerTable() {
  const columns = ["Asset", "Protocol", "APY", "Value", "Status"];

  return (
    <div
      className="noir-card noir-fade-in"
      style={{
        animationDelay: "600ms",
        borderRadius: 4,
        padding: "20px 0 8px",
        background: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: "0 8px 24px rgba(26,24,21,0.5)",
        marginBottom: 24,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Card grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "0 20px",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: FONT_HEADING,
            fontSize: 16,
            fontWeight: 500,
            fontStyle: "italic",
            color: COLOR.warmGray,
          }}
        >
          Asset Ledger
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: COLOR.charcoal,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          6 positions
        </span>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  fontFamily: FONT_HEADING,
                  fontSize: 13,
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: COLOR.charcoal,
                  textAlign: "left",
                  padding: "8px 20px",
                  borderBottom: `1px solid ${COLOR.border}`,
                  letterSpacing: "0.02em",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LEDGER_ROWS.map((row, i) => (
            <tr
              key={row.asset}
              className="noir-ledger-row"
              style={{
                transition: "background 0.3s ease",
              }}
            >
              <td
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLOR.ivory,
                  padding: "12px 20px",
                  borderBottom: `1px solid ${COLOR.border}`,
                }}
              >
                {row.asset}
              </td>
              <td
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLOR.warmGray,
                  padding: "12px 20px",
                  borderBottom: `1px solid ${COLOR.border}`,
                }}
              >
                {row.protocol}
              </td>
              <td
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLOR.mossGreen,
                  padding: "12px 20px",
                  borderBottom: `1px solid ${COLOR.border}`,
                }}
              >
                {row.apy}
              </td>
              <td
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLOR.ivory,
                  padding: "12px 20px",
                  borderBottom: `1px solid ${COLOR.border}`,
                }}
              >
                {row.value}
              </td>
              <td
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 12,
                  color: COLOR.warmGray,
                  padding: "12px 20px",
                  borderBottom: `1px solid ${COLOR.border}`,
                  textTransform: "capitalize",
                }}
              >
                <StatusDot status={row.status} />
                {row.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ink Wash Metrics Section
// ---------------------------------------------------------------------------

function InkWashMetric({
  label,
  value,
  numericValue,
  brushElement,
  delay = 0,
}: {
  label: string;
  value: string;
  numericValue: number;
  brushElement: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="noir-card noir-fade-in"
      style={{
        animationDelay: `${delay}ms`,
        borderRadius: 4,
        padding: "24px 20px",
        background: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: "0 8px 24px rgba(26,24,21,0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Card grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          pointerEvents: "none",
        }}
      />

      <div style={{ marginBottom: 4 }}>{brushElement}</div>

      <p
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 32,
          fontWeight: 500,
          color: COLOR.ivory,
          lineHeight: 1,
        }}
      >
        {value}
      </p>

      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 500,
          color: COLOR.charcoal,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </p>

      {/* Progress bar — ink-like */}
      <div
        style={{
          width: "80%",
          height: 3,
          borderRadius: 2,
          background: COLOR.border,
          overflow: "hidden",
        }}
      >
        <div
          className="noir-progress-fill"
          style={{
            width: `${numericValue}%`,
            height: "100%",
            borderRadius: 2,
            background: `linear-gradient(90deg, ${COLOR.inkWash}, ${COLOR.warmGray})`,
            transformOrigin: "left",
            animation: `progressGrow 1.5s ease-out ${delay + 400}ms both`,
          }}
        />
      </div>
    </div>
  );
}

function InkWashSection() {
  const brushElements = [
    <BrushCircle key="circle" size={50} color={COLOR.inkWash} opacity={0.2} delay={800} />,
    <BrushStrokeDivider key="stroke" width={50} color={COLOR.inkWash} opacity={0.25} delay={900} />,
    <BrushDashes key="dashes" width={50} color={COLOR.inkWash} opacity={0.25} delay={1000} />,
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {BOTTOM_METRICS.map((metric, i) => (
        <InkWashMetric
          key={metric.label}
          {...metric}
          brushElement={brushElements[i]}
          delay={700 + i * 100}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function NoirFooter() {
  return (
    <footer
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0 8px",
        borderTop: `1px solid ${COLOR.border}`,
      }}
    >
      <span
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 12,
          fontStyle: "italic",
          color: COLOR.charcoal,
          letterSpacing: "0.05em",
        }}
      >
        Handcrafted in the digital age
      </span>
      <div style={{ display: "flex", gap: 20 }}>
        {["Docs", "Support", "Terms"].map((item) => (
          <span
            key={item}
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: COLOR.charcoal,
              cursor: "pointer",
              transition: "color 0.3s ease",
              letterSpacing: "0.03em",
            }}
            className="noir-nav-item"
          >
            {item}
          </span>
        ))}
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function PaperNoirPreview() {
  useFonts();

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: COLOR.bg,
        color: COLOR.ivory,
        overflow: "hidden",
      }}
    >
      <PaperGrainOverlay />
      <WarmVignette />

      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        <NoirHeader />
        <HeroSection />
        <StatCardsGrid />
        <HandDrawnChart />
        <LedgerTable />
        <InkWashSection />
        <NoirFooter />
      </div>

      <style>{`
        /* --- Entrance Animations --- */
        @keyframes noirFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .noir-fade-in {
          opacity: 0;
          animation: noirFadeIn 700ms ease-out forwards;
        }

        /* --- Brush Stroke Draw --- */
        @keyframes brushDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        .brush-stroke-draw path {
          will-change: stroke-dashoffset;
        }

        /* --- Chart Line Draw --- */
        @keyframes chartLineDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* --- Chart Area Reveal --- */
        .noir-chart-reveal {
          opacity: 0;
          animation: noirFadeIn 1.2s ease-out 1.4s forwards;
        }

        /* --- Progress Bar --- */
        @keyframes progressGrow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        /* --- Red Seal Stamp --- */
        .seal-stamp-enter {
          opacity: 0;
          transform: scale(1.25);
          animation: sealStamp 400ms ease-out 800ms forwards;
        }

        @keyframes sealStamp {
          0% {
            opacity: 0;
            transform: scale(1.25);
          }
          60% {
            opacity: 1;
            transform: scale(0.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* --- Card Ink Bleed Hover --- */
        .noir-card {
          transition: box-shadow 0.5s ease, border-color 0.5s ease;
        }

        .noir-card:hover {
          box-shadow: 0 8px 32px rgba(26,24,21,0.6), 0 0 0 1px rgba(245,240,227,0.04);
          border-color: rgba(245,240,227,0.1);
        }

        /* --- Nav Hover --- */
        .noir-nav-item:hover {
          color: ${COLOR.ivory} !important;
        }

        /* --- Ledger Row Hover --- */
        .noir-ledger-row:hover {
          background: rgba(245,240,227,0.02);
        }

        /* --- Scrollbar --- */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: ${COLOR.bg};
        }

        ::-webkit-scrollbar-thumb {
          background: ${COLOR.surfaceElevated};
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${COLOR.charcoal};
        }
      `}</style>
    </div>
  );
}
