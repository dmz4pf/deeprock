"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#0E0C0A",
  surface: "#1A1714",
  surfaceElevated: "#242018",
  copper: "#CD7F32",
  copperBright: "#E8A065",
  bronze: "#8B6914",
  textPrimary: "#F0E6D6",
  textSecondary: "#9B8B78",
  textDim: "#6B5D50",
  success: "#7EAA6E",
  danger: "#C45B4A",
  warning: "#D4A853",
  border: "rgba(205,127,50,0.1)",
  borderHover: "rgba(205,127,50,0.25)",
  shimmerLight: "rgba(232,160,101,0.12)",
  shimmerMid: "rgba(205,127,50,0.08)",
} as const;

const COPPER_GRADIENT = `linear-gradient(135deg, ${COLORS.copper}, ${COLORS.copperBright}, ${COLORS.copper}, ${COLORS.bronze}, ${COLORS.copper})`;
const COPPER_TEXT_GRADIENT = `linear-gradient(135deg, ${COLORS.copper} 0%, ${COLORS.copperBright} 40%, ${COLORS.copper} 60%, ${COLORS.bronze} 80%, ${COLORS.copperBright} 100%)`;

const FONT_SERIF = "'Playfair Display', Georgia, serif";
const FONT_SANS = "'Outfit', system-ui, -apple-system, sans-serif";

const ENTRANCE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const STAGGER_MS = 80;

const HOLDINGS_DATA = [
  { asset: "US Treasury 6M", type: "Government Bond", value: "$520,000", apy: "5.12%", maturity: "Aug 2026", status: "Active" as const },
  { asset: "Maple Credit Pool", type: "Private Credit", value: "$415,000", apy: "8.74%", maturity: "Open-End", status: "Active" as const },
  { asset: "Gold Bullion ETF", type: "Commodity", value: "$380,000", apy: "2.85%", maturity: "N/A", status: "Active" as const },
  { asset: "Corp Bond AA+", type: "Corporate Bond", value: "$310,000", apy: "6.35%", maturity: "Mar 2027", status: "Active" as const },
  { asset: "RE Income Trust", type: "Real Estate", value: "$275,000", apy: "7.20%", maturity: "Dec 2026", status: "Maturing" as const },
  { asset: "Silver Futures", type: "Commodity", value: "$198,000", apy: "3.40%", maturity: "Jun 2025", status: "Pending" as const },
];

const CHART_DATA = [
  42, 45, 43, 48, 52, 50, 55, 58, 56, 62, 65, 63,
  68, 72, 70, 76, 80, 78, 84, 88, 86, 92, 95, 98,
  96, 102, 106, 110, 108, 114,
];

const DONUT_SEGMENTS = [
  { label: "Treasury Bonds", value: 30, color: COLORS.copper },
  { label: "Private Credit", value: 22, color: COLORS.bronze },
  { label: "Commodities", value: 26, color: COLORS.warning },
  { label: "Real Estate", value: 22, color: COLORS.success },
];

const STAT_CARDS_DATA = [
  { label: "Total Yield", suffix: "/mo", detail: "This month" },
  { label: "Active Positions", detail: "Across 5 pools" },
  { label: "Avg APY", detail: "Weighted average" },
  { label: "Risk Score", detail: "Conservative profile" },
];

const FOOTER_GAUGES = [
  { label: "Liquidity Ratio", value: 78, suffix: "%" },
  { label: "Diversification", value: 92, suffix: "%" },
  { label: "Yield Efficiency", value: 85, suffix: "%" },
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useCountUp(end: number, duration: number = 2400): number {
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

function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Outfit:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Ambient Background -- warm copper radial glow + CSS noise texture
// ---------------------------------------------------------------------------

function AmbientBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {/* Warm copper glow top-left */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "20%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(205,127,50,0.03) 0%, transparent 70%)`,
          filter: "blur(120px)",
        }}
      />
      {/* Secondary bronze glow bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          right: "15%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(139,105,20,0.025) 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />
      {/* CSS noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compass Rose SVG -- geometric precision icon
// ---------------------------------------------------------------------------

function CompassRose({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={COLORS.copper}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.4" />
      <polygon
        points="12,2 14.5,10 12,8.5 9.5,10"
        fill={COLORS.copper}
        stroke="none"
        opacity="0.8"
      />
      <polygon
        points="12,22 14.5,14 12,15.5 9.5,14"
        fill={COLORS.textDim}
        stroke="none"
        opacity="0.5"
      />
      <polygon
        points="2,12 10,9.5 8.5,12 10,14.5"
        fill={COLORS.textDim}
        stroke="none"
        opacity="0.5"
      />
      <polygon
        points="22,12 14,9.5 15.5,12 14,14.5"
        fill={COLORS.textDim}
        stroke="none"
        opacity="0.5"
      />
      <circle cx="12" cy="12" r="1.5" fill={COLORS.copper} stroke="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Copper Gradient Text -- reusable for key values
// ---------------------------------------------------------------------------

function CopperText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        background: COPPER_TEXT_GRADIENT,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  const navItems = ["Overview", "Holdings", "Yield", "Analytics"];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        marginBottom: 48,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CompassRose size={22} />
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 20,
              fontWeight: 600,
              fontStyle: "italic",
              letterSpacing: "0.18em",
              background: COPPER_TEXT_GRADIENT,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            COPPER ATLAS
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: i === 0 ? 500 : 400,
                color: i === 0 ? COLORS.textPrimary : COLORS.textDim,
                cursor: "pointer",
                letterSpacing: "0.02em",
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
            fontFamily: FONT_SANS,
            fontSize: 12,
            color: COLORS.textDim,
            letterSpacing: "0.08em",
          }}
        >
          Forged in precision
        </span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.copper,
            }}
          >
            DA
          </span>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection({ value }: { value: string }) {
  return (
    <div
      className="copper-fadeIn"
      style={{
        textAlign: "center",
        padding: "40px 0 52px",
        position: "relative",
      }}
    >
      <p
        style={{
          fontFamily: FONT_SANS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: COLORS.textSecondary,
          marginBottom: 16,
        }}
      >
        Portfolio Value
      </p>
      <p
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: 20,
          background: COPPER_TEXT_GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.success,
            fontWeight: 500,
          }}
        >
          +14.6% all time
        </span>
        <span style={{ color: COLORS.textDim }}>|</span>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.textSecondary,
          }}
        >
          +$387,240 unrealized
        </span>
      </div>
      {/* Brushed-metal divider */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "20%",
          right: "20%",
          height: 1,
          background: COPPER_GRADIENT,
          opacity: 0.3,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card -- metallic shimmer hover + copper gradient border
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  detail,
  delay = 0,
}: {
  label: string;
  value: string;
  detail: string;
  delay?: number;
}) {
  return (
    <div
      className="copper-fadeIn copper-shimmer"
      style={{
        animationDelay: `${delay}ms`,
        background: COLORS.surface,
        borderRadius: 10,
        padding: "24px 24px 20px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: `border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease`,
      }}
    >
      {/* Top copper edge highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: COPPER_GRADIENT,
          opacity: 0.25,
        }}
      />

      <p
        style={{
          fontFamily: FONT_SANS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: COLORS.textDim,
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <CopperText
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1.1,
          display: "block",
        }}
      >
        {value}
      </CopperText>
      <p
        style={{
          fontFamily: FONT_SANS,
          fontSize: 12,
          color: COLORS.textDim,
          marginTop: 8,
        }}
      >
        {detail}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Area Chart -- copper gradient fill with bronze line
// ---------------------------------------------------------------------------

function PerformanceChart() {
  const width = 520;
  const height = 140;
  const padTop = 12;
  const padBottom = 12;
  const min = Math.min(...CHART_DATA);
  const max = Math.max(...CHART_DATA);
  const range = max - min || 1;

  const points = CHART_DATA.map((val, i) => {
    const x = (i / (CHART_DATA.length - 1)) * width;
    const y = padTop + ((max - val) / range) * (height - padTop - padBottom);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const periods = ["1W", "1M", "3M", "1Y", "ALL"];
  const [activePeriod, setActivePeriod] = useState(3);

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75].map((frac) => padTop + frac * (height - padTop - padBottom));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontFamily: FONT_SANS,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: COLORS.textDim,
          }}
        >
          Performance
        </h3>
        <div style={{ display: "flex", gap: 4 }}>
          {periods.map((p, i) => (
            <button
              key={p}
              onClick={() => setActivePeriod(i)}
              style={{
                fontFamily: FONT_SANS,
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: i === activePeriod ? `${COLORS.copper}18` : "transparent",
                color: i === activePeriod ? COLORS.copper : COLORS.textDim,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 140 }}>
        <defs>
          <linearGradient id="copperAreaFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COLORS.copper} stopOpacity="0.2" />
            <stop offset="60%" stopColor={COLORS.copper} stopOpacity="0.05" />
            <stop offset="100%" stopColor={COLORS.copper} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="copperLineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.bronze} stopOpacity="0.5" />
            <stop offset="50%" stopColor={COLORS.copper} stopOpacity="1" />
            <stop offset="100%" stopColor={COLORS.copperBright} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1="0"
            y1={y}
            x2={width}
            y2={y}
            stroke={COLORS.textDim}
            strokeOpacity="0.1"
            strokeDasharray="4 6"
          />
        ))}

        <path d={areaPath} fill="url(#copperAreaFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#copperLineStroke)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot with glow */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="5"
          fill={COLORS.copper}
          fillOpacity="0.15"
        />
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2.5"
          fill={COLORS.copperBright}
          className="copper-pulse"
        />
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: COLORS.textDim }}>
          Feb 2025
        </span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: COLORS.textDim }}>
          Feb 2026
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart
// ---------------------------------------------------------------------------

function DonutChart() {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
      <svg viewBox="0 0 120 120" style={{ width: 150, height: 150, flexShrink: 0 }}>
        {/* Background ring */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={`${COLORS.copper}08`}
          strokeWidth="13"
        />
        {DONUT_SEGMENTS.map((seg, i) => {
          const strokeLen = (seg.value / 100) * circumference;
          const offset = accumulated;
          accumulated += strokeLen;

          return (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="13"
              strokeDasharray={`${strokeLen} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                transition: "stroke-dasharray 0.8s ease",
              }}
            />
          );
        })}
        {/* Center count */}
        <text
          x="60"
          y="57"
          textAnchor="middle"
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 18,
            fontWeight: 600,
            fill: COLORS.textPrimary,
          }}
        >
          4
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          style={{
            fontFamily: FONT_SANS,
            fontSize: 7.5,
            fill: COLORS.textDim,
            letterSpacing: "0.12em",
          }}
        >
          CLASSES
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DONUT_SEGMENTS.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: seg.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.textSecondary,
                minWidth: 110,
              }}
            >
              {seg.label}
            </span>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.textDim,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {seg.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Holdings Table
// ---------------------------------------------------------------------------

function getStatusStyle(status: "Active" | "Maturing" | "Pending") {
  switch (status) {
    case "Active":
      return { bg: `${COLORS.copper}12`, color: COLORS.copper, label: "Active" };
    case "Maturing":
      return { bg: `${COLORS.warning}12`, color: COLORS.warning, label: "Maturing" };
    case "Pending":
      return { bg: `${COLORS.success}12`, color: COLORS.success, label: "Pending" };
  }
}

function HoldingsTable() {
  const headerCols = ["Asset", "Type", "Value", "APY", "Maturity", "Status"];

  return (
    <div>
      <h3
        style={{
          fontFamily: FONT_SANS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: COLORS.textDim,
          marginBottom: 20,
        }}
      >
        Holdings
      </h3>

      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 1fr 0.8fr",
          gap: 12,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {headerCols.map((col) => (
          <span
            key={col}
            style={{
              fontFamily: FONT_SANS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.copper,
            }}
          >
            {col}
          </span>
        ))}
      </div>

      {/* Data rows */}
      {HOLDINGS_DATA.map((row, i) => {
        const statusStyle = getStatusStyle(row.status);
        return (
          <div
            key={i}
            className="copper-fadeIn copper-tableRow"
            style={{
              animationDelay: `${700 + i * STAGGER_MS}ms`,
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 1fr 0.8fr",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 6,
              background: i % 2 === 1 ? `${COLORS.surface}cc` : "transparent",
              transition: "background 0.3s ease",
            }}
          >
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontWeight: 400,
              }}
            >
              {row.asset}
            </span>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              {row.type}
            </span>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
              }}
            >
              {row.value}
            </span>
            <CopperText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.apy}
            </CopperText>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              {row.maturity}
            </span>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 10,
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: 20,
                background: statusStyle.bg,
                color: statusStyle.color,
                textAlign: "center",
                alignSelf: "center",
                width: "fit-content",
              }}
            >
              {statusStyle.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Circular Gauge -- copper gradient stroke arc
// ---------------------------------------------------------------------------

function CircularGauge({
  label,
  value,
  suffix,
  delay = 0,
}: {
  label: string;
  value: number;
  suffix: string;
  delay?: number;
}) {
  const animatedValue = useCountUp(value, 2200 + delay);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (animatedValue / 100) * circumference;

  return (
    <div
      className="copper-fadeIn"
      style={{
        animationDelay: `${900 + delay}ms`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <svg viewBox="0 0 80 80" style={{ width: 90, height: 90 }}>
        <defs>
          <linearGradient id={`gauge-grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.bronze} />
            <stop offset="50%" stopColor={COLORS.copper} />
            <stop offset="100%" stopColor={COLORS.copperBright} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={`${COLORS.copper}0A`}
          strokeWidth="5"
        />
        {/* Value arc */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={`url(#gauge-grad-${label})`}
          strokeWidth="5"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{
            transformOrigin: "center",
            transform: "rotate(-90deg)",
            transition: "stroke-dasharray 0.6s ease",
          }}
        />
        {/* Center value */}
        <text
          x="40"
          y="38"
          textAnchor="middle"
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 16,
            fontWeight: 600,
            fill: COLORS.textPrimary,
          }}
        >
          {animatedValue}
        </text>
        <text
          x="40"
          y="50"
          textAnchor="middle"
          style={{
            fontFamily: FONT_SANS,
            fontSize: 8,
            fill: COLORS.textDim,
          }}
        >
          {suffix}
        </text>
      </svg>

      <span
        style={{
          fontFamily: FONT_SANS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: COLORS.textSecondary,
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Card -- metallic shimmer + copper border
// ---------------------------------------------------------------------------

function SectionCard({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="copper-fadeIn copper-shimmer"
      style={{
        animationDelay: `${delay}ms`,
        background: COLORS.surface,
        borderRadius: 12,
        padding: 28,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
        ...style,
      }}
    >
      {/* Top copper edge — light catching brushed metal */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: COPPER_GRADIENT,
          opacity: 0.2,
        }}
      />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CopperAtlasPreview() {
  useFonts();

  const portfolioRaw = useCountUp(3042580, 2800);
  const yieldRaw = useCountUp(24318, 2200);
  const apyRaw = useCountUp(628, 2000);

  const formatCurrency = (n: number) => "$" + n.toLocaleString("en-US");

  const portfolioDisplay = formatCurrency(portfolioRaw);
  const yieldDisplay = formatCurrency(yieldRaw);
  const apyDisplay = (apyRaw / 100).toFixed(2) + "%";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.textPrimary,
        padding: "0 40px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AmbientBackground />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <Header />

        {/* Hero */}
        <HeroSection value={portfolioDisplay} />

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <StatCard
            label="Total Yield"
            value={yieldDisplay}
            detail="This month"
            delay={100}
          />
          <StatCard
            label="Active Positions"
            value="8"
            detail="Across 5 pools"
            delay={100 + STAGGER_MS}
          />
          <StatCard
            label="Avg APY"
            value={apyDisplay}
            detail="Weighted average"
            delay={100 + STAGGER_MS * 2}
          />
          <StatCard
            label="Risk Score"
            value="Low"
            detail="Conservative profile"
            delay={100 + STAGGER_MS * 3}
          />
        </div>

        {/* Two-column: Chart + Donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <SectionCard delay={500}>
            <PerformanceChart />
          </SectionCard>

          <SectionCard delay={580}>
            <h3
              style={{
                fontFamily: FONT_SANS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: COLORS.textDim,
                marginBottom: 24,
              }}
            >
              Asset Allocation
            </h3>
            <DonutChart />
          </SectionCard>
        </div>

        {/* Holdings Table */}
        <SectionCard delay={660}>
          <HoldingsTable />
        </SectionCard>

        {/* Footer Gauges */}
        <div
          className="copper-fadeIn"
          style={{
            animationDelay: "800ms",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginTop: 40,
            padding: "32px 0",
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          {FOOTER_GAUGES.map((gauge, i) => (
            <CircularGauge
              key={gauge.label}
              label={gauge.label}
              value={gauge.value}
              suffix={gauge.suffix}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Footer tagline */}
        <div
          className="copper-fadeIn"
          style={{
            animationDelay: "1200ms",
            textAlign: "center",
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <p
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 14,
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.12em",
              color: COLORS.textDim,
            }}
          >
            Forged in precision
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Animations & Interaction Styles                                    */}
      {/* ----------------------------------------------------------------- */}
      <style>{`
        /* --- Entrance animation --- */
        @keyframes copperFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .copper-fadeIn {
          animation: copperFadeIn 600ms ${ENTRANCE_EASE} forwards;
          opacity: 0;
        }

        /* --- Metallic shimmer sweep on hover --- */
        .copper-shimmer {
          position: relative;
          overflow: hidden;
        }

        .copper-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            ${COLORS.shimmerMid} 45%,
            ${COLORS.shimmerLight} 50%,
            ${COLORS.shimmerMid} 55%,
            transparent 70%
          );
          transform: translateX(-100%) translateY(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 1;
        }

        .copper-shimmer:hover::after {
          transform: translateX(30%) translateY(30%);
        }

        .copper-shimmer:hover {
          border-color: ${COLORS.borderHover} !important;
          box-shadow: 0 16px 40px rgba(205,127,50,0.08) !important;
          transform: translateY(-2px);
        }

        /* --- Pulse for chart end dot --- */
        @keyframes copperPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .copper-pulse {
          animation: copperPulse 3s ease-in-out infinite;
        }

        /* --- Table row hover --- */
        .copper-tableRow:hover {
          background: ${COLORS.surfaceElevated} !important;
        }

        /* --- Subtle breathe for hero value (text shadow glow) --- */
        @keyframes copperGlow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(205,127,50,0.15));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(205,127,50,0.25));
          }
        }
      `}</style>
    </div>
  );
}
