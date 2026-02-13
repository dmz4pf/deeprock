"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Palette -- THREE colors. White. Gray. Red. Nothing else.
// ---------------------------------------------------------------------------

const C = {
  bg: "#0C0C0C",
  surface: "#161616",
  gridLine: "rgba(255,255,255,0.08)",
  textPrimary: "#E5E5E5",
  textSecondary: "#999999",
  textDim: "#555555",
  red: "#FF3333",
  white: "#FFFFFF",
  border: "rgba(255,255,255,0.12)",
  borderHover: "rgba(255,255,255,0.3)",
  gridFaint: "rgba(255,255,255,0.03)",
};

const FONT = "'Space Grotesk', system-ui, sans-serif";

const GRID_SIZE = 60;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CHART_DATA = [
  2420, 2380, 2450, 2410, 2490, 2530, 2510, 2580, 2560, 2620,
  2590, 2650, 2680, 2640, 2710, 2740, 2700, 2760, 2790, 2810,
  2780, 2830, 2800, 2850, 2870, 2840, 2890, 2910, 2880, 2940,
];

const METRICS = [
  { label: "APY", value: "8.42%" },
  { label: "TVL", value: "$847.2M" },
  { label: "POSITIONS", value: "28" },
  { label: "YIELD MTD", value: "$12,450" },
  { label: "RISK", value: "94" },
  { label: "PROTOCOL", value: "AVALANCHE" },
];

const LEDGER_ROWS = [
  { id: "01", asset: "US TREASURY 6M", type: "TBILL", value: "$450,000", apy: "5.20%", status: "ACTIVE" },
  { id: "02", asset: "MAPLE SENIOR POOL", type: "CREDIT", value: "$320,000", apy: "11.80%", status: "ACTIVE" },
  { id: "03", asset: "CENTRIFUGE RWA", type: "REAL", value: "$280,000", apy: "8.40%", status: "MATUR." },
  { id: "04", asset: "OPENEDEN TBILL", type: "TBILL", value: "$195,000", apy: "5.00%", status: "ACTIVE" },
  { id: "05", asset: "BACKED BCSPX", type: "EQUITY", value: "$148,000", apy: "7.20%", status: "PENDING" },
  { id: "06", asset: "GOLDFINCH SR.", type: "CREDIT", value: "$92,000", apy: "14.10%", status: "ACTIVE" },
];

// ---------------------------------------------------------------------------
// Font Loader
// ---------------------------------------------------------------------------

function useFontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Red Line Draw Hook
// ---------------------------------------------------------------------------

function useRedLineDraw() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setWidth(100);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return width;
}

// ---------------------------------------------------------------------------
// Background Structural Grid
// ---------------------------------------------------------------------------

function StructuralGrid() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          animation: "brutalistGridPulse 6s ease-in-out infinite",
        }}
      >
        <defs>
          <pattern
            id="brutalist-grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <line
              x1={GRID_SIZE}
              y1={0}
              x2={GRID_SIZE}
              y2={GRID_SIZE}
              stroke={C.gridFaint}
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={GRID_SIZE}
              x2={GRID_SIZE}
              y2={GRID_SIZE}
              stroke={C.gridFaint}
              strokeWidth={1}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#brutalist-grid)" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Title Block
// ---------------------------------------------------------------------------

function TitleBlock() {
  return (
    <div style={{ padding: "40px 0 0 0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 300,
            color: C.white,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          BRUTALIST
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          LEDGER
        </span>
      </div>
      <div
        style={{
          width: 200,
          height: 2,
          background: C.red,
          marginTop: 16,
          marginBottom: 12,
        }}
      />
      <div
        style={{
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 500,
          color: C.textDim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        FINANCIAL DATA SYSTEM
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 400,
          color: C.textDim,
          letterSpacing: "0.2em",
          marginTop: 4,
        }}
      >
        2026.02.09
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Value
// ---------------------------------------------------------------------------

function HeroValue() {
  return (
    <div style={{ padding: "60px 0 0 0" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 500,
          color: C.textDim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        PORTFOLIO VALUE
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 64,
          fontWeight: 300,
          color: C.white,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        $2,847,392
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 400,
          color: C.textSecondary,
          marginTop: 16,
        }}
      >
        <span style={{ color: C.red, fontWeight: 500 }}>+12.4%</span>
        <span
          style={{
            color: C.textDim,
            marginLeft: 12,
            fontSize: 10,
            letterSpacing: "0.2em",
          }}
        >
          FROM INCEPTION
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Red Divider (animated draw)
// ---------------------------------------------------------------------------

function RedDivider() {
  const widthPct = useRedLineDraw();

  return (
    <div style={{ padding: "48px 0" }}>
      <div
        style={{
          width: `${widthPct}%`,
          height: 2,
          background: C.red,
          transition: "width 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data Grid -- 2x3 with VISIBLE grid lines
// ---------------------------------------------------------------------------

function DataGrid() {
  return (
    <div
      style={{
        border: `2px solid ${C.border}`,
        borderRadius: 0,
      }}
    >
      {[0, 1].map((row) => (
        <div
          key={row}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: row > 0 ? `2px solid ${C.border}` : "none",
          }}
        >
          {METRICS.slice(row * 3, row * 3 + 3).map((m, col) => (
            <div
              key={m.label}
              style={{
                padding: "24px 20px",
                borderLeft: col > 0 ? `2px solid ${C.border}` : "none",
                transition: "border-color 100ms linear",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  C.borderHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  C.border;
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.textDim,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 32,
                  fontWeight: 400,
                  color: C.white,
                  lineHeight: 1,
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Line Chart -- utilitarian engineering plot
// ---------------------------------------------------------------------------

function UtilitarianChart() {
  const min = Math.min(...CHART_DATA);
  const max = Math.max(...CHART_DATA);
  const range = max - min;
  const w = 780;
  const h = 240;
  const padX = 52;
  const padY = 24;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const points = CHART_DATA.map((d, i) => ({
    x: padX + (i / (CHART_DATA.length - 1)) * plotW,
    y: padY + plotH - ((d - min) / range) * plotH,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const minIdx = CHART_DATA.indexOf(min);
  const maxIdx = CHART_DATA.indexOf(max);

  const yTicks = 5;
  const xTicks = 6;

  return (
    <div style={{ padding: "48px 0 0 0" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 500,
          color: C.textDim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        PORTFOLIO PERFORMANCE — 30D
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Structural grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padY + (i / yTicks) * plotH;
          return (
            <line
              key={`yg-${i}`}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              stroke={C.gridLine}
              strokeWidth={1}
            />
          );
        })}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const x = padX + (i / xTicks) * plotW;
          return (
            <line
              key={`xg-${i}`}
              x1={x}
              y1={padY}
              x2={x}
              y2={padY + plotH}
              stroke={C.gridLine}
              strokeWidth={1}
            />
          );
        })}

        {/* Y-axis labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padY + (i / yTicks) * plotH;
          const val = max - (i / yTicks) * range;
          return (
            <text
              key={`yl-${i}`}
              x={padX - 8}
              y={y + 3}
              textAnchor="end"
              fill={C.textDim}
              fontFamily={FONT}
              fontSize={10}
              letterSpacing="0.05em"
            >
              {Math.round(val)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const x = padX + (i / xTicks) * plotW;
          const dayIndex = Math.round((i / xTicks) * (CHART_DATA.length - 1));
          return (
            <text
              key={`xl-${i}`}
              x={x}
              y={padY + plotH + 16}
              textAnchor="middle"
              fill={C.textDim}
              fontFamily={FONT}
              fontSize={10}
              letterSpacing="0.05em"
            >
              D{String(dayIndex + 1).padStart(2, "0")}
            </text>
          );
        })}

        {/* Axis border lines */}
        <line
          x1={padX}
          y1={padY}
          x2={padX}
          y2={padY + plotH}
          stroke={C.border}
          strokeWidth={2}
        />
        <line
          x1={padX}
          y1={padY + plotH}
          x2={w - padX}
          y2={padY + plotH}
          stroke={C.border}
          strokeWidth={2}
        />

        {/* Data line -- white, 2px, no fill */}
        <path
          d={pathD}
          fill="none"
          stroke={C.white}
          strokeWidth={2}
          strokeLinecap="square"
        />

        {/* Red dots at min and max */}
        <circle
          cx={points[minIdx].x}
          cy={points[minIdx].y}
          r={4}
          fill={C.red}
        />
        <circle
          cx={points[maxIdx].x}
          cy={points[maxIdx].y}
          r={4}
          fill={C.red}
        />

        {/* Min label */}
        <text
          x={points[minIdx].x}
          y={points[minIdx].y + 16}
          textAnchor="middle"
          fill={C.red}
          fontFamily={FONT}
          fontSize={10}
          fontWeight={500}
        >
          {min}
        </text>

        {/* Max label */}
        <text
          x={points[maxIdx].x}
          y={points[maxIdx].y - 10}
          textAnchor="middle"
          fill={C.red}
          fontFamily={FONT}
          fontSize={10}
          fontWeight={500}
        >
          {max}
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ledger Table -- exposed structure, monospaced alignment
// ---------------------------------------------------------------------------

const LEDGER_COLS = [
  { key: "id", label: "NO.", width: "6%" },
  { key: "asset", label: "ASSET", width: "30%" },
  { key: "type", label: "TYPE", width: "14%" },
  { key: "value", label: "VALUE", width: "18%" },
  { key: "apy", label: "APY", width: "14%" },
  { key: "status", label: "STATUS", width: "18%" },
] as const;

function LedgerTable() {
  return (
    <div style={{ padding: "48px 0 0 0" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 500,
          color: C.textDim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        POSITION LEDGER
      </div>

      {/* Table container */}
      <div style={{ width: "100%", overflow: "hidden" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            borderBottom: `2px solid ${C.border}`,
            paddingBottom: 12,
          }}
        >
          {LEDGER_COLS.map((col) => (
            <div
              key={col.key}
              style={{
                width: col.width,
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 500,
                color: C.textDim,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {LEDGER_ROWS.map((row, rowIdx) => {
          const isMatured = row.status === "MATUR.";
          const isPending = row.status === "PENDING";

          return (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom:
                  rowIdx < LEDGER_ROWS.length - 1
                    ? `1px solid ${C.gridLine}`
                    : `2px solid ${C.border}`,
                padding: "14px 0",
                transition: "border-color 100ms linear",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  C.surface;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              {/* NO. */}
              <div
                style={{
                  width: "6%",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 400,
                  color: C.textDim,
                }}
              >
                {row.id}
              </div>

              {/* ASSET */}
              <div
                style={{
                  width: "30%",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.white,
                  letterSpacing: "0.02em",
                }}
              >
                {row.asset}
              </div>

              {/* TYPE */}
              <div
                style={{
                  width: "14%",
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 400,
                  color: C.textSecondary,
                  letterSpacing: "0.1em",
                }}
              >
                {row.type}
              </div>

              {/* VALUE */}
              <div
                style={{
                  width: "18%",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 400,
                  color: C.white,
                }}
              >
                {row.value}
              </div>

              {/* APY */}
              <div
                style={{
                  width: "14%",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 400,
                  color: C.textPrimary,
                }}
              >
                {row.apy}
              </div>

              {/* STATUS */}
              <div
                style={{
                  width: "18%",
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 500,
                  color: isMatured
                    ? C.red
                    : isPending
                      ? C.textDim
                      : C.textSecondary,
                  letterSpacing: "0.1em",
                }}
              >
                {row.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer -- system status
// ---------------------------------------------------------------------------

function SystemFooter() {
  return (
    <div
      style={{
        padding: "48px 0 40px 0",
        borderTop: `2px solid ${C.border}`,
        marginTop: 48,
      }}
    >
      <FooterLine label="SYSTEM STATUS" value="OPERATIONAL" highlight />
      <FooterLine label="LAST SYNC" value="2026-02-09T21:45:32Z" />
      <FooterLine label="CHAIN" value="AVALANCHE C-CHAIN (43114)" />
    </div>
  );
}

function FooterLine({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 400,
        color: C.textDim,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        marginBottom: 6,
        lineHeight: 1.6,
      }}
    >
      {label}:{" "}
      <span style={{ color: highlight ? C.white : C.textDim }}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyframes
// ---------------------------------------------------------------------------

const KEYFRAMES = `
  @keyframes brutalistGridPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function BrutalistLedgerPreview() {
  useFontLoader();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: FONT,
        color: C.textPrimary,
        overflow: "hidden",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Structural grid overlay */}
      <StructuralGrid />

      {/* Content -- sits on the grid */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 840,
          margin: "0 auto",
          padding: "0 40px",
        }}
      >
        <TitleBlock />
        <HeroValue />
        <RedDivider />
        <DataGrid />
        <UtilitarianChart />
        <LedgerTable />
        <SystemFooter />
      </div>
    </div>
  );
}

export default BrutalistLedgerPreview;
