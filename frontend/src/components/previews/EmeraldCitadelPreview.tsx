"use client";

import { useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#060E0B",
  surface: "#0D1A14",
  surfaceElevated: "#142820",
  emerald: "#10B981",
  emeraldLight: "#34D399",
  emeraldDim: "#059669",
  gold: "#D4A853",
  goldLight: "#E8D48B",
  textPrimary: "#ECFDF5",
  textSecondary: "#A7C4B8",
  textMuted: "#5C8A75",
  textDim: "#3D6B55",
  warning: "#FBBF24",
  danger: "#F87171",
  border: "rgba(16,185,129,0.08)",
  goldBorder: "rgba(212,168,83,0.1)",
} as const;

const FONT_SERIF = "'DM Serif Display', Georgia, serif";
const FONT_SANS = "'DM Sans', system-ui, -apple-system, sans-serif";

const HOLDINGS_DATA = [
  { asset: "US Treasury 10Y", type: "Government Bond", value: "$482,000", yield: "4.28%", maturity: "Sep 2034", status: "Active" as const },
  { asset: "REIT Index Fund", type: "Real Estate", value: "$380,000", yield: "6.15%", maturity: "Open-End", status: "Active" as const },
  { asset: "Gold Bullion ETF", type: "Commodity", value: "$325,000", yield: "2.40%", maturity: "N/A", status: "Active" as const },
  { asset: "Corp Bond AAA", type: "Private Credit", value: "$285,000", yield: "5.82%", maturity: "Mar 2026", status: "Maturing" as const },
  { asset: "Silver Futures", type: "Commodity", value: "$218,000", yield: "3.10%", maturity: "Jun 2025", status: "Maturing" as const },
  { asset: "Muni Bond CA", type: "Government Bond", value: "$196,000", yield: "3.95%", maturity: "Pending", status: "Pending" as const },
];

const CHART_DATA = [
  32, 35, 33, 38, 42, 40, 44, 48, 46, 52, 55, 53,
  58, 62, 60, 65, 68, 72, 70, 75, 78, 82, 80, 85,
];

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

const DONUT_SEGMENTS = [
  { label: "Treasury Bonds", value: 28, color: COLORS.emerald },
  { label: "Real Estate", value: 24, color: COLORS.gold },
  { label: "Commodities", value: 26, color: COLORS.textSecondary },
  { label: "Private Credit", value: 22, color: COLORS.emeraldDim },
];

const STAT_CARDS = [
  { label: "Treasury Bonds", value: "$1.2M", change: "+4.28%", accent: "emerald" as const, sparkData: [30, 35, 33, 40, 42, 45] },
  { label: "Real Estate", value: "$980K", change: "+6.15%", accent: "gold" as const, sparkData: [28, 32, 30, 38, 35, 42] },
  { label: "Commodities", value: "$650K", change: "+2.40%", accent: "emerald" as const, sparkData: [20, 22, 25, 23, 28, 30] },
  { label: "Private Credit", value: "$385K", change: "+5.82%", accent: "gold" as const, sparkData: [15, 18, 20, 22, 21, 25] },
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
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return count;
}

function useStaggerVisible(count: number, baseDelay: number = 100): boolean[] {
  const [visible, setVisible] = useState<boolean[]>(new Array(count).fill(false));

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < count; i++) {
      timers.push(setTimeout(() => {
        setVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * baseDelay + 200));
    }
    return () => timers.forEach(clearTimeout);
  }, [count, baseDelay]);

  return visible;
}

// ---------------------------------------------------------------------------
// SVG Primitives
// ---------------------------------------------------------------------------

function ArtDecoCorner({ color = COLORS.gold, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: "block" }}>
      <line x1="0" y1="0" x2="18" y2="0" stroke={color} strokeWidth="0.5" opacity="0.6" />
      <line x1="0" y1="0" x2="0" y2="18" stroke={color} strokeWidth="0.5" opacity="0.6" />
      <line x1="0" y1="0" x2="14" y2="14" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <line x1="0" y1="0" x2="8" y2="16" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="0" y1="0" x2="16" y2="8" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

function ArtDecoDivider() {
  return (
    <svg width="280" height="12" viewBox="0 0 280 12" fill="none" style={{ display: "block", margin: "0 auto" }}>
      <line x1="0" y1="6" x2="124" y2="6" stroke={COLORS.gold} strokeWidth="0.5" opacity="0.4">
        <animate attributeName="x1" from="124" to="0" dur="1.2s" fill="freeze" begin="0.5s" />
      </line>
      <rect x="132" y="2" width="8" height="8" transform="rotate(45 136 6)" stroke={COLORS.gold} strokeWidth="0.5" fill="none" opacity="0.5" />
      <line x1="156" y1="6" x2="280" y2="6" stroke={COLORS.gold} strokeWidth="0.5" opacity="0.4">
        <animate attributeName="x2" from="156" to="280" dur="1.2s" fill="freeze" begin="0.5s" />
      </line>
    </svg>
  );
}

function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={data.length > 0 ? width : 0} cy={data.length > 0 ? height - ((data[data.length - 1] - min) / range) * (height - 4) - 2 : 0} r="2" fill={color} />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L3 3.5V7.5C3 10.5 5.2 13.2 8 14C10.8 13.2 13 10.5 13 7.5V3.5L8 1Z" stroke={COLORS.emerald} strokeWidth="1" fill="none" />
      <path d="M6 8L7.5 9.5L10 6.5" stroke={COLORS.emerald} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 12L7 7L9.5 9.5L13 4" stroke={COLORS.gold} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4H13V7" stroke={COLORS.gold} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke={COLORS.textSecondary} strokeWidth="1" fill="none" />
      <line x1="2" y1="7" x2="14" y2="7" stroke={COLORS.textSecondary} strokeWidth="0.8" />
      <line x1="5" y1="2" x2="5" y2="4.5" stroke={COLORS.textSecondary} strokeWidth="1" strokeLinecap="round" />
      <line x1="11" y1="2" x2="11" y2="4.5" stroke={COLORS.textSecondary} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: "Active" | "Maturing" | "Pending" }) {
  const styles: Record<typeof status, { bg: string; color: string; border: string }> = {
    Active: { bg: "rgba(16,185,129,0.1)", color: COLORS.emerald, border: "rgba(16,185,129,0.2)" },
    Maturing: { bg: "rgba(212,168,83,0.1)", color: COLORS.gold, border: "rgba(212,168,83,0.2)" },
    Pending: { bg: "rgba(92,138,117,0.1)", color: COLORS.textSecondary, border: "rgba(167,196,184,0.15)" },
  };
  const s = styles[status];

  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "4px",
      fontSize: "11px",
      fontFamily: FONT_SANS,
      fontWeight: 500,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      letterSpacing: "0.02em",
    }}>
      {status}
    </span>
  );
}

function StatCard({ label, value, change, accent, sparkData, visible, delay }: {
  label: string;
  value: string;
  change: string;
  accent: "emerald" | "gold";
  sparkData: number[];
  visible: boolean;
  delay: number;
}) {
  const accentColor = accent === "emerald" ? COLORS.emerald : COLORS.gold;
  const accentDim = accent === "emerald" ? COLORS.emeraldDim : "rgba(212,168,83,0.6)";

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      padding: "20px",
      background: `linear-gradient(165deg, ${COLORS.surfaceElevated} 0%, ${COLORS.surface} 100%)`,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "8px",
      boxShadow: "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
      position: "relative",
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms, transform 800ms cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <ArtDecoCorner color={accentColor} />
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
      }}>
        <div>
          <p style={{
            fontFamily: FONT_SANS,
            fontSize: "11px",
            fontWeight: 500,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
            marginBottom: "6px",
          }}>{label}</p>
          <p style={{
            fontFamily: FONT_SERIF,
            fontSize: "26px",
            color: COLORS.textPrimary,
            margin: 0,
            lineHeight: 1.1,
          }}>{value}</p>
        </div>
        <Sparkline data={sparkData} color={accentColor} />
      </div>
      <p style={{
        fontFamily: FONT_SANS,
        fontSize: "12px",
        fontWeight: 500,
        color: accentColor,
        margin: 0,
      }}>{change}</p>
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "15%",
        right: "15%",
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${accentDim}, transparent)`,
        opacity: 0.2,
      }} />
    </div>
  );
}

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

const BENCHMARK_DATA = [
  30, 31, 32, 34, 36, 37, 38, 40, 41, 43, 45, 46,
  48, 50, 51, 53, 54, 56, 57, 59, 61, 63, 64, 66,
];

function AreaChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const w = 520;
  const h = 220;
  const padX = 40;
  const padTop = 20;
  const padBottom = 28;
  const chartW = w - padX * 2;
  const chartH = h - padTop - padBottom;

  const allData = [...CHART_DATA, ...BENCHMARK_DATA];
  const max = Math.max(...allData);
  const min = Math.min(...allData);
  const range = max - min || 1;

  const toPoint = (data: number[]) => data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - ((v - min) / range) * chartH,
  }));

  const mainPts = toPoint(CHART_DATA);
  const benchPts = toPoint(BENCHMARK_DATA);

  const mainLine = buildSmoothPath(mainPts);
  const benchLine = buildSmoothPath(benchPts);
  const areaPath = mainLine
    + ` L${mainPts[mainPts.length - 1].x},${padTop + chartH}`
    + ` L${mainPts[0].x},${padTop + chartH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "block" }}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <defs>
        <linearGradient id="ec-areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.emerald} stopOpacity="0.2" />
          <stop offset="60%" stopColor={COLORS.emerald} stopOpacity="0.05" />
          <stop offset="100%" stopColor={COLORS.emerald} stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="ec-goldLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={COLORS.gold} stopOpacity="0.7" />
          <stop offset="50%" stopColor={COLORS.goldLight} />
          <stop offset="100%" stopColor={COLORS.gold} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((pct, i) => {
        const y = padTop + chartH * (1 - pct);
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={padX - 6} y={y + 3} textAnchor="end" fill={COLORS.textDim} fontSize="9" fontFamily={FONT_SANS}>
              {Math.round(min + range * pct)}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {MONTHS.map((m, i) => {
        const x = padX + (i / (MONTHS.length - 1)) * chartW;
        return (
          <text key={m} x={x} y={h - 6} textAnchor="middle" fill={COLORS.textDim} fontSize="9" fontFamily={FONT_SANS}>
            {m}
          </text>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#ec-areaFill)" />

      {/* Benchmark line (dashed, subtle) */}
      <path
        d={benchLine}
        fill="none"
        stroke={COLORS.textDim}
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.5"
      />

      {/* Main gold data line */}
      <path
        d={mainLine}
        fill="none"
        stroke="url(#ec-goldLine)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Endpoint dot */}
      {mainPts.length > 0 && (
        <g>
          <circle
            cx={mainPts[mainPts.length - 1].x}
            cy={mainPts[mainPts.length - 1].y}
            r="5"
            fill={COLORS.gold}
            opacity="0.2"
          />
          <circle
            cx={mainPts[mainPts.length - 1].x}
            cy={mainPts[mainPts.length - 1].y}
            r="3"
            fill={COLORS.gold}
            stroke={COLORS.bg}
            strokeWidth="1.5"
          />
        </g>
      )}

      {/* Hover interaction zones */}
      {mainPts.map((pt, i) => (
        <g key={i}>
          <rect
            x={pt.x - chartW / (CHART_DATA.length - 1) / 2}
            y={padTop}
            width={chartW / (CHART_DATA.length - 1)}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoveredIdx(i)}
          />
          {hoveredIdx === i && (
            <g>
              <line
                x1={pt.x}
                y1={padTop}
                x2={pt.x}
                y2={padTop + chartH}
                stroke={COLORS.gold}
                strokeWidth="0.5"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <circle cx={pt.x} cy={pt.y} r="4" fill={COLORS.gold} stroke={COLORS.bg} strokeWidth="1.5" />
              <rect
                x={pt.x - 24}
                y={pt.y - 22}
                width="48"
                height="18"
                rx="3"
                fill={COLORS.surfaceElevated}
                stroke={COLORS.goldBorder}
                strokeWidth="1"
              />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fill={COLORS.goldLight}
                fontSize="9"
                fontFamily={FONT_SANS}
                fontWeight="600"
              >
                {CHART_DATA[i]}%
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(${w - padX - 120}, ${padTop + 4})`}>
        <line x1="0" y1="4" x2="16" y2="4" stroke={COLORS.gold} strokeWidth="2" />
        <text x="20" y="7" fill={COLORS.textMuted} fontSize="8" fontFamily={FONT_SANS}>Portfolio</text>
        <line x1="70" y1="4" x2="86" y2="4" stroke={COLORS.textDim} strokeWidth="1" strokeDasharray="4 4" />
        <text x="90" y="7" fill={COLORS.textMuted} fontSize="8" fontFamily={FONT_SANS}>Benchmark</text>
      </g>
    </svg>
  );
}

function DonutChart() {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 72;
  const innerR = 50;
  const total = DONUT_SEGMENTS.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;

  const arcs = DONUT_SEGMENTS.map((seg) => {
    const startAngle = (cumulative / total) * 360 - 90;
    cumulative += seg.value;
    const endAngle = (cumulative / total) * 360 - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const x1Outer = cx + outerR * Math.cos(startRad);
    const y1Outer = cy + outerR * Math.sin(startRad);
    const x2Outer = cx + outerR * Math.cos(endRad);
    const y2Outer = cy + outerR * Math.sin(endRad);
    const x1Inner = cx + innerR * Math.cos(endRad);
    const y1Inner = cy + innerR * Math.sin(endRad);
    const x2Inner = cx + innerR * Math.cos(startRad);
    const y2Inner = cy + innerR * Math.sin(startRad);

    const d = [
      `M${x1Outer},${y1Outer}`,
      `A${outerR},${outerR} 0 ${largeArc} 1 ${x2Outer},${y2Outer}`,
      `L${x1Inner},${y1Inner}`,
      `A${innerR},${innerR} 0 ${largeArc} 0 ${x2Inner},${y2Inner}`,
      "Z",
    ].join(" ");

    return { d, color: seg.color };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ position: "relative" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc, i) => (
            <path key={i} d={arc.d} fill={arc.color} opacity="0.85" stroke={COLORS.bg} strokeWidth="1.5" />
          ))}
        </svg>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: "18px", color: COLORS.textPrimary, margin: 0, lineHeight: 1.1 }}>$4.2M</p>
          <p style={{ fontFamily: FONT_SANS, fontSize: "9px", color: COLORS.textMuted, margin: 0, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total</p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", justifyContent: "center" }}>
        {DONUT_SEGMENTS.map((seg) => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: seg.color, opacity: 0.85 }} />
            <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: COLORS.textSecondary }}>{seg.label}</span>
            <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: COLORS.textMuted, fontVariantNumeric: "tabular-nums" }}>{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldingsTable({ visible }: { visible: boolean }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94), transform 800ms cubic-bezier(0.25,0.46,0.45,0.94)",
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: FONT_SANS,
          fontSize: "13px",
        }}>
          <thead>
            <tr style={{
              borderBottom: `1px solid ${COLORS.goldBorder}`,
            }}>
              {["Asset", "Type", "Value", "Yield", "Maturity", "Status"].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: "11px",
                  color: COLORS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOLDINGS_DATA.map((row, i) => (
              <tr key={i} style={{
                borderBottom: `1px solid ${COLORS.border}`,
                transition: "background 200ms",
              }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.03)"; }}
                 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <td style={{ padding: "12px 14px", color: COLORS.textPrimary, fontWeight: 500, whiteSpace: "nowrap" }}>{row.asset}</td>
                <td style={{ padding: "12px 14px", color: COLORS.textSecondary, whiteSpace: "nowrap" }}>{row.type}</td>
                <td style={{ padding: "12px 14px", color: COLORS.textPrimary, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{row.value}</td>
                <td style={{ padding: "12px 14px", color: COLORS.emerald, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{row.yield}</td>
                <td style={{ padding: "12px 14px", color: COLORS.textSecondary, whiteSpace: "nowrap" }}>{row.maturity}</td>
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label?: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      margin: "8px 0 20px",
    }}>
      <div style={{
        flex: 1,
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${COLORS.border}, ${COLORS.goldBorder}, ${COLORS.border}, transparent)`,
      }} />
      {label && (
        <span style={{
          fontFamily: FONT_SANS,
          fontSize: "9px",
          fontWeight: 500,
          color: COLORS.textDim,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      )}
      <div style={{
        flex: 1,
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${COLORS.border}, ${COLORS.goldBorder}, ${COLORS.border}, transparent)`,
      }} />
    </div>
  );
}

function FooterMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "14px 20px",
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "6px",
      flex: 1,
      minWidth: "180px",
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontFamily: FONT_SANS, fontSize: "10px", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, marginBottom: "2px" }}>{label}</p>
        <p style={{ fontFamily: FONT_SANS, fontSize: "14px", fontWeight: 600, color: COLORS.textPrimary, margin: 0, fontVariantNumeric: "tabular-nums" }}>{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyframe Styles (injected via <style>)
// ---------------------------------------------------------------------------

const KEYFRAMES = `
@keyframes ec-fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ec-goldShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes ec-drawLine {
  from { stroke-dashoffset: 280; }
  to { stroke-dashoffset: 0; }
}
@keyframes ec-pulseGlow {
  0%, 100% { opacity: 0.04; }
  50% { opacity: 0.07; }
}
`;

// ---------------------------------------------------------------------------
// Art Deco Background Pattern (SVG data URI)
// ---------------------------------------------------------------------------

const ART_DECO_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2310B981' stroke-width='0.3'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z'/%3E%3Cpath d='M30 10 L50 30 L30 50 L10 30 Z'/%3E%3Cpath d='M30 20 L40 30 L30 40 L20 30 Z'/%3E%3C/g%3E%3C/svg%3E")`;

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EmeraldCitadelPreview() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [middleVisible, setMiddleVisible] = useState(false);
  const [tableVisible, setTableVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [shimmerActive, setShimmerActive] = useState(false);

  const aumValue = useCountUp(4215680, 2400);
  const statVisibility = useStaggerVisible(4, 120);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    link.onload = () => setFontsLoaded(true);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setHeroVisible(true), 150);
    const t2 = setTimeout(() => setMiddleVisible(true), 600);
    const t3 = setTimeout(() => setTableVisible(true), 900);
    const t4 = setTimeout(() => setFooterVisible(true), 1100);
    const t5 = setTimeout(() => setShimmerActive(true), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  const formatAUM = useCallback((val: number): string => {
    const dollars = Math.floor(val);
    const cents = 42;
    return `$${dollars.toLocaleString("en-US")}.${cents.toString().padStart(2, "0")}`;
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.textPrimary,
      fontFamily: FONT_SANS,
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{KEYFRAMES}</style>

      {/* Art Deco Background Pattern */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: ART_DECO_PATTERN,
        backgroundSize: "60px 60px",
        opacity: 0.015,
        pointerEvents: "none",
      }} />

      {/* Ambient Gradient Blobs */}
      <div style={{
        position: "fixed",
        top: "-20%",
        left: "-10%",
        width: "70%",
        height: "70%",
        background: `radial-gradient(ellipse at center, ${COLORS.emerald} 0%, transparent 70%)`,
        opacity: 0.04,
        pointerEvents: "none",
        animation: "ec-pulseGlow 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed",
        top: "-10%",
        right: "-15%",
        width: "50%",
        height: "50%",
        background: `radial-gradient(ellipse at center, ${COLORS.gold} 0%, transparent 70%)`,
        opacity: 0.02,
        pointerEvents: "none",
      }} />

      {/* Content Container */}
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "0 24px",
      }}>

        {/* Header */}
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 0",
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{
              fontFamily: FONT_SERIF,
              fontSize: "18px",
              fontWeight: 400,
              color: COLORS.gold,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              margin: 0,
            }}>
              Emerald Citadel
            </h1>
            <span style={{
              fontFamily: FONT_SANS,
              fontSize: "9px",
              fontWeight: 500,
              color: COLORS.textDim,
              border: `1px solid ${COLORS.goldBorder}`,
              borderRadius: "3px",
              padding: "2px 8px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              Est. 2024
            </span>
          </div>
          <nav style={{ display: "flex", gap: "28px" }}>
            {["Portfolio", "Markets", "Analytics", "Settings"].map((item) => (
              <span key={item} style={{
                fontFamily: FONT_SANS,
                fontSize: "13px",
                fontWeight: 400,
                color: item === "Portfolio" ? COLORS.textPrimary : COLORS.textMuted,
                cursor: "pointer",
                transition: "color 300ms",
                letterSpacing: "0.02em",
              }}>
                {item}
              </span>
            ))}
          </nav>
        </header>

        {/* Hero Section */}
        <section style={{
          textAlign: "center",
          padding: "56px 0 40px",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94), transform 800ms cubic-bezier(0.25,0.46,0.45,0.94)",
        }}>
          <p style={{
            fontFamily: FONT_SANS,
            fontSize: "11px",
            fontWeight: 500,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            margin: 0,
            marginBottom: "14px",
          }}>
            Total Assets Under Management
          </p>

          <div style={{ position: "relative", display: "inline-block" }}>
            {/* Gold accent line above value */}
            <div style={{
              position: "absolute",
              top: "-8px",
              left: "10%",
              right: "10%",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
              opacity: 0.3,
            }} />

            <h2 style={{
              fontFamily: FONT_SERIF,
              fontSize: "52px",
              fontWeight: 400,
              color: COLORS.emeraldLight,
              margin: 0,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              ...(shimmerActive ? {
                backgroundImage: `linear-gradient(90deg, ${COLORS.emeraldLight} 0%, ${COLORS.goldLight} 45%, ${COLORS.gold} 50%, ${COLORS.goldLight} 55%, ${COLORS.emeraldLight} 100%)`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "ec-goldShimmer 3s ease-in-out 1",
              } : {}),
            }}>
              {formatAUM(aumValue)}
            </h2>
          </div>

          <div style={{ margin: "20px auto 0", width: "280px" }}>
            <ArtDecoDivider />
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "32px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: COLORS.emerald, fontWeight: 500 }}>
              +18.4% YTD
            </span>
            <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: COLORS.textSecondary }}>
              Risk: Conservative
            </span>
            <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: COLORS.textSecondary, fontVariantNumeric: "tabular-nums" }}>
              32 Active Positions
            </span>
          </div>
        </section>

        <SectionDivider label="Asset Classes" />

        {/* Stat Cards */}
        <section style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}>
          {STAT_CARDS.map((card, i) => (
            <StatCard
              key={card.label}
              {...card}
              visible={statVisibility[i]}
              delay={0}
            />
          ))}
        </section>

        <SectionDivider label="Performance & Allocation" />

        {/* Two-Column Middle */}
        <section style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          opacity: middleVisible ? 1 : 0,
          transform: middleVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94), transform 800ms cubic-bezier(0.25,0.46,0.45,0.94)",
          flexWrap: "wrap",
        }}>
          {/* Performance Chart */}
          <div style={{
            flex: "1.25 1 380px",
            padding: "24px",
            background: `linear-gradient(165deg, ${COLORS.surfaceElevated} 0%, ${COLORS.surface} 100%)`,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
            position: "relative",
          }}>
            {/* Gold top accent */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "15%",
              right: "15%",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
              opacity: 0.3,
              borderRadius: "1px",
            }} />
            <div style={{ position: "absolute", top: 0, left: 0 }}>
              <ArtDecoCorner color={COLORS.gold} />
            </div>
            <h3 style={{
              fontFamily: FONT_SERIF,
              fontSize: "16px",
              fontWeight: 400,
              color: COLORS.textPrimary,
              margin: "0 0 20px 0",
            }}>
              Portfolio Performance
            </h3>
            <AreaChart />
          </div>

          {/* Allocation Donut */}
          <div style={{
            flex: "1 1 280px",
            padding: "24px",
            background: `linear-gradient(165deg, ${COLORS.surfaceElevated} 0%, ${COLORS.surface} 100%)`,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <h3 style={{
              fontFamily: FONT_SERIF,
              fontSize: "16px",
              fontWeight: 400,
              color: COLORS.textPrimary,
              margin: "0 0 20px 0",
              alignSelf: "flex-start",
            }}>
              Allocation
            </h3>
            <DonutChart />
          </div>
        </section>

        <SectionDivider label="Holdings" />

        {/* Holdings Table */}
        <section style={{
          padding: "24px",
          background: `linear-gradient(165deg, ${COLORS.surfaceElevated} 0%, ${COLORS.surface} 100%)`,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
          marginBottom: "24px",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0 }}>
            <ArtDecoCorner color={COLORS.gold} />
          </div>
          <h3 style={{
            fontFamily: FONT_SERIF,
            fontSize: "16px",
            fontWeight: 400,
            color: COLORS.textPrimary,
            margin: "0 0 16px 0",
          }}>
            Active Positions
          </h3>
          <HoldingsTable visible={tableVisible} />
        </section>

        {/* Footer Strip */}
        <section style={{
          display: "flex",
          gap: "12px",
          paddingBottom: "40px",
          flexWrap: "wrap",
          opacity: footerVisible ? 1 : 0,
          transform: footerVisible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94), transform 800ms cubic-bezier(0.25,0.46,0.45,0.94)",
        }}>
          <FooterMetric icon={<ShieldIcon />} label="Risk Rating" value="AAA" />
          <FooterMetric icon={<TrendUpIcon />} label="Yield Target" value="8.2%" />
          <FooterMetric icon={<CalendarIcon />} label="Next Maturity" value="Mar 2026" />
        </section>

      </div>
    </div>
  );
}
