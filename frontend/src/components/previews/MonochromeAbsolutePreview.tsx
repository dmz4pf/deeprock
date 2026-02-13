"use client";

import { useEffect, useState, useRef } from "react";

// --- Palette ---

const C = {
  bg: "#000000",
  s1: "#0A0A0A",
  s2: "#141414",
  s3: "#1E1E1E",
  s4: "#282828",
  white: "#FFFFFF",
  g100: "#F5F5F5",
  g200: "#E5E5E5",
  g300: "#D4D4D4",
  g400: "#A3A3A3",
  g500: "#737373",
  g600: "#525252",
  g700: "#404040",
  g800: "#262626",
  red: "#EF4444",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.2)",
  rule: "rgba(255,255,255,0.08)",
};

const FONT = {
  heading: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'Space Mono', 'SF Mono', monospace",
};

// --- Hooks ---

function useLinearCount(end: number, duration: number = 1800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number;
    let frame: number;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(t * end));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return value;
}

function useStagger(count: number, interval: number = 40) {
  const [visible, setVisible] = useState<boolean[]>(Array(count).fill(false));

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, interval * i)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [count, interval]);

  return visible;
}

// --- Data ---

const CHART_DATA = [
  2420, 2380, 2450, 2410, 2490, 2530, 2510, 2580, 2560, 2620,
  2590, 2650, 2680, 2640, 2710, 2740, 2700, 2760, 2790, 2810,
  2780, 2830, 2800, 2850, 2870, 2840, 2890, 2910, 2880, 2940,
];

const METRICS = [
  { label: "APY", value: "8.42", suffix: "%", numeric: 842 },
  { label: "TVL", value: "$847.2", suffix: "M", numeric: 8472 },
  { label: "POSITIONS", value: "28", suffix: "", numeric: 28 },
  { label: "YIELD MTD", value: "$12,450", suffix: "", numeric: 12450 },
  { label: "RISK SCORE", value: "94", suffix: "/100", numeric: 94 },
  { label: "UPTIME", value: "99.97", suffix: "%", numeric: 9997 },
];

const TABLE_DATA = [
  { id: "01", asset: "US Treasury 6M", type: "TBILL", value: 450000, apy: 5.2, status: "active" },
  { id: "02", asset: "Maple Senior Pool", type: "CREDIT", value: 320000, apy: 11.8, status: "active" },
  { id: "03", asset: "Centrifuge RWA", type: "RWA", value: 280000, apy: 9.4, status: "active" },
  { id: "04", asset: "Ondo USDY", type: "YIELD", value: 245000, apy: 5.1, status: "active" },
  { id: "05", asset: "Backed bIB01", type: "BOND", value: 520000, apy: 4.8, status: "pending" },
  { id: "06", asset: "OpenEden TBILL", type: "TBILL", value: 380000, apy: 5.3, status: "active" },
  { id: "07", asset: "Goldfinch Pool", type: "CREDIT", value: 175000, apy: 17.2, status: "alert" },
  { id: "08", asset: "Flux Finance", type: "LEND", value: 177392, apy: 6.9, status: "active" },
];

const ACTIVITY_LOG = [
  { time: "2026-02-09 21:45", action: "YIELD_CLAIMED", amount: "+$1,247.80", positive: true },
  { time: "2026-02-09 21:44", action: "DEPOSIT", amount: "$50,000.00", positive: true },
  { time: "2026-02-09 18:12", action: "REBALANCE", amount: "$320,000.00", positive: true },
  { time: "2026-02-09 14:30", action: "WITHDRAWAL", amount: "-$25,000.00", positive: false },
  { time: "2026-02-09 09:00", action: "YIELD_CLAIMED", amount: "+$892.40", positive: true },
];

// --- Utility ---

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function pad(s: string, len: number): string {
  return s.padEnd(len, "\u00A0");
}

// --- Sub-components ---

function ScannerLine() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 1,
          background: C.white,
          opacity: 0.03,
          animation: "monoScan 20s linear infinite",
        }}
      />
      <style>{`
        @keyframes monoScan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

function Header() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 0",
        borderBottom: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear forwards",
      }}
    >
      <span
        style={{
          fontFamily: FONT.heading,
          fontSize: 14,
          fontWeight: 300,
          color: C.white,
          letterSpacing: "0.3em",
        }}
      >
        MONOCHROME
      </span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 12,
          color: C.g500,
          letterSpacing: "0.05em",
        }}
      >
        {time}
      </span>
    </div>
  );
}

function HeroValue() {
  const counter = useLinearCount(284739258, 2200);
  const dollars = Math.floor(counter / 100);
  const cents = counter % 100;

  const formatted = dollars.toLocaleString("en-US");
  const centsStr = String(cents).padStart(2, "0");

  return (
    <div
      style={{
        padding: "48px 0 40px 0",
        opacity: 0,
        animation: "monoFadeIn 400ms linear 80ms forwards",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        PORTFOLIO VALUE
      </div>
      <div
        style={{
          fontFamily: FONT.heading,
          fontSize: 56,
          fontWeight: 300,
          color: C.white,
          lineHeight: 1.0,
          letterSpacing: "-0.02em",
        }}
      >
        ${formatted}
        <span style={{ fontSize: 36, color: C.g400 }}>.{centsStr}</span>
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 16,
          color: C.white,
          marginTop: 12,
          letterSpacing: "0.02em",
        }}
      >
        +12.4%
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: 12,
            color: C.g600,
            marginLeft: 12,
          }}
        >
          30D RETURN
        </span>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  suffix,
  visible,
}: {
  label: string;
  value: string;
  suffix: string;
  visible: boolean;
}) {
  return (
    <div
      style={{
        padding: "20px 0",
        opacity: visible ? 1 : 0,
        transition: "opacity 400ms linear",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT.heading,
          fontSize: 24,
          fontWeight: 400,
          color: C.white,
          lineHeight: 1.0,
        }}
      >
        {value}
        <span style={{ fontSize: 16, color: C.g500 }}>{suffix}</span>
      </div>
    </div>
  );
}

function MetricsGrid() {
  const vis = useStagger(6, 40);

  return (
    <div
      style={{
        borderTop: `1px solid ${C.rule}`,
        borderBottom: `1px solid ${C.rule}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {METRICS.slice(0, 3).map((m, i) => (
          <div
            key={m.label}
            style={{
              borderRight: i < 2 ? `1px solid ${C.rule}` : "none",
              paddingLeft: i > 0 ? 24 : 0,
              paddingRight: i < 2 ? 24 : 0,
            }}
          >
            <MetricCell label={m.label} value={m.value} suffix={m.suffix} visible={vis[i]} />
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderTop: `1px solid ${C.rule}`,
        }}
      >
        {METRICS.slice(3, 6).map((m, i) => (
          <div
            key={m.label}
            style={{
              borderRight: i < 2 ? `1px solid ${C.rule}` : "none",
              paddingLeft: i > 0 ? 24 : 0,
              paddingRight: i < 2 ? 24 : 0,
            }}
          >
            <MetricCell label={m.label} value={m.value} suffix={m.suffix} visible={vis[i + 3]} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart() {
  const min = Math.min(...CHART_DATA);
  const max = Math.max(...CHART_DATA);
  const range = max - min;
  const w = 720;
  const h = 200;
  const padX = 48;
  const padY = 24;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const points = CHART_DATA.map((d, i) => {
    const x = padX + (i / (CHART_DATA.length - 1)) * plotW;
    const y = padY + plotH - ((d - min) / range) * plotH;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const yTicks = 5;
  const xTicks = 6;

  return (
    <div
      style={{
        padding: "32px 0",
        opacity: 0,
        animation: "monoFadeIn 400ms linear 360ms forwards",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        PORTFOLIO PERFORMANCE
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padY + (i / yTicks) * plotH;
          return (
            <line
              key={`yg-${i}`}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              stroke={C.g800}
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
              stroke={C.g800}
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
              fill={C.g600}
              fontFamily={FONT.mono}
              fontSize={10}
            >
              {Math.round(val)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const x = padX + (i / xTicks) * plotW;
          const dayIndex = Math.round((i / xTicks) * (CHART_DATA.length - 1));
          const label = `D${dayIndex + 1}`;
          return (
            <text
              key={`xl-${i}`}
              x={x}
              y={padY + plotH + 16}
              textAnchor="middle"
              fill={C.g600}
              fontFamily={FONT.mono}
              fontSize={10}
            >
              {label}
            </text>
          );
        })}

        {/* Data line */}
        <path
          d={pathD}
          fill="none"
          stroke={C.white}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 2000,
            strokeDashoffset: 2000,
            animation: "monoDrawLine 2s linear 600ms forwards",
          }}
        />
      </svg>
      <style>{`
        @keyframes monoDrawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === "active" ? C.white : status === "pending" ? C.g600 : C.red;
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        verticalAlign: "middle",
      }}
    />
  );
}

function DataTable() {
  const vis = useStagger(TABLE_DATA.length, 40);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const colWidths = {
    id: 40,
    asset: 200,
    type: 80,
    value: 140,
    apy: 80,
    status: 60,
  };

  return (
    <div
      style={{
        padding: "32px 0",
        opacity: 0,
        animation: "monoFadeIn 400ms linear 480ms forwards",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        POSITIONS
      </div>

      {/* Table container */}
      <div style={{ overflowX: "auto" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${C.rule}`,
            paddingBottom: 8,
            marginBottom: 0,
          }}
        >
          <div style={{ width: colWidths.id, fontFamily: FONT.mono, fontSize: 10, color: C.g600, letterSpacing: "0.1em" }}>#</div>
          <div style={{ width: colWidths.asset, fontFamily: FONT.mono, fontSize: 10, color: C.g600, letterSpacing: "0.1em" }}>ASSET</div>
          <div style={{ width: colWidths.type, fontFamily: FONT.mono, fontSize: 10, color: C.g600, letterSpacing: "0.1em" }}>TYPE</div>
          <div style={{ width: colWidths.value, fontFamily: FONT.mono, fontSize: 10, color: C.g600, letterSpacing: "0.1em", textAlign: "right" }}>VALUE</div>
          <div style={{ width: colWidths.apy, fontFamily: FONT.mono, fontSize: 10, color: C.g600, letterSpacing: "0.1em", textAlign: "right" }}>APY</div>
          <div style={{ width: colWidths.status, fontFamily: FONT.mono, fontSize: 10, color: C.g600, letterSpacing: "0.1em", textAlign: "center" }}>ST</div>
        </div>

        {/* Data rows */}
        {TABLE_DATA.map((row, i) => (
          <div
            key={row.id}
            onMouseEnter={() => setHoveredRow(i)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: `1px solid ${C.border}`,
              padding: "10px 0",
              opacity: vis[i] ? 1 : 0,
              transition: "opacity 400ms linear, background 150ms linear",
              background: hoveredRow === i ? "rgba(255,255,255,0.02)" : "transparent",
              cursor: "default",
            }}
          >
            <div
              style={{
                width: colWidths.id,
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.g600,
              }}
            >
              {row.id}
            </div>
            <div
              style={{
                width: colWidths.asset,
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.g200,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {row.asset}
            </div>
            <div
              style={{
                width: colWidths.type,
                fontFamily: FONT.mono,
                fontSize: 11,
                color: C.g500,
                letterSpacing: "0.05em",
              }}
            >
              {row.type}
            </div>
            <div
              style={{
                width: colWidths.value,
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.g200,
                textAlign: "right",
              }}
            >
              {formatCurrency(row.value)}
            </div>
            <div
              style={{
                width: colWidths.apy,
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.white,
                textAlign: "right",
              }}
            >
              {row.apy.toFixed(2)}%
            </div>
            <div
              style={{
                width: colWidths.status,
                textAlign: "center",
              }}
            >
              <StatusDot status={row.status} />
            </div>
          </div>
        ))}

        {/* Summary row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 0 0 0",
            borderTop: `1px solid ${C.rule}`,
            marginTop: 0,
          }}
        >
          <div style={{ width: colWidths.id }} />
          <div
            style={{
              width: colWidths.asset,
              fontFamily: FONT.mono,
              fontSize: 11,
              color: C.g500,
              letterSpacing: "0.1em",
            }}
          >
            TOTAL
          </div>
          <div style={{ width: colWidths.type }} />
          <div
            style={{
              width: colWidths.value,
              fontFamily: FONT.mono,
              fontSize: 12,
              color: C.white,
              textAlign: "right",
              fontWeight: 700,
            }}
          >
            {formatCurrency(TABLE_DATA.reduce((sum, r) => sum + r.value, 0))}
          </div>
          <div
            style={{
              width: colWidths.apy,
              fontFamily: FONT.mono,
              fontSize: 12,
              color: C.g400,
              textAlign: "right",
            }}
          >
            {(TABLE_DATA.reduce((sum, r) => sum + r.apy * r.value, 0) / TABLE_DATA.reduce((sum, r) => sum + r.value, 0)).toFixed(2)}%
          </div>
          <div style={{ width: colWidths.status }} />
        </div>
      </div>
    </div>
  );
}

function ActivityLog() {
  const vis = useStagger(ACTIVITY_LOG.length, 40);

  return (
    <div
      style={{
        padding: "32px 0",
        borderTop: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear 640ms forwards",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        ACTIVITY LOG
      </div>
      <div>
        {ACTIVITY_LOG.map((entry, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 0,
              padding: "6px 0",
              borderBottom: i < ACTIVITY_LOG.length - 1 ? `1px solid ${C.border}` : "none",
              opacity: vis[i] ? 1 : 0,
              transition: "opacity 400ms linear",
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.g600,
                width: 160,
                flexShrink: 0,
              }}
            >
              {entry.time}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.g400,
                width: 160,
                flexShrink: 0,
                letterSpacing: "0.03em",
              }}
            >
              {entry.action}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: entry.positive ? C.white : C.red,
                textAlign: "right",
                flex: 1,
              }}
            >
              {entry.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllocationBar() {
  const vis = useStagger(TABLE_DATA.length, 40);
  const total = TABLE_DATA.reduce((s, r) => s + r.value, 0);

  return (
    <div
      style={{
        padding: "32px 0",
        borderTop: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear 560ms forwards",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        ALLOCATION
      </div>

      {/* Bar */}
      <div
        style={{
          display: "flex",
          height: 3,
          width: "100%",
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        {TABLE_DATA.map((row, i) => {
          const pct = (row.value / total) * 100;
          const shade = Math.round(255 - (i / (TABLE_DATA.length - 1)) * 180);
          return (
            <div
              key={row.id}
              style={{
                width: `${pct}%`,
                background: `rgb(${shade},${shade},${shade})`,
                borderRight: i < TABLE_DATA.length - 1 ? `1px solid ${C.bg}` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px 16px",
        }}
      >
        {TABLE_DATA.map((row, i) => {
          const pct = ((row.value / total) * 100).toFixed(1);
          const shade = Math.round(255 - (i / (TABLE_DATA.length - 1)) * 180);
          return (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: vis[i] ? 1 : 0,
                transition: "opacity 400ms linear",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: `rgb(${shade},${shade},${shade})`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: C.g500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row.type} {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskMatrix() {
  const categories = [
    { label: "SMART CONTRACT", score: 92 },
    { label: "COUNTERPARTY", score: 88 },
    { label: "LIQUIDITY", score: 95 },
    { label: "MARKET", score: 76 },
    { label: "REGULATORY", score: 84 },
  ];
  const vis = useStagger(categories.length, 40);

  return (
    <div
      style={{
        padding: "32px 0",
        borderTop: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear 720ms forwards",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        RISK MATRIX
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {categories.map((cat, i) => (
          <div
            key={cat.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: vis[i] ? 1 : 0,
              transition: "opacity 400ms linear",
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                color: C.g600,
                letterSpacing: "0.1em",
                width: 140,
                flexShrink: 0,
              }}
            >
              {cat.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 2,
                background: C.s3,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: 2,
                  width: `${cat.score}%`,
                  background: cat.score >= 90 ? C.white : cat.score >= 80 ? C.g400 : C.g600,
                  transition: "width 1.2s linear",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: cat.score >= 90 ? C.white : cat.score >= 80 ? C.g400 : C.g600,
                width: 32,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {cat.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProtocolStats() {
  const stats = [
    { label: "TOTAL PROTOCOLS", value: "6" },
    { label: "CHAINS", value: "3" },
    { label: "AVG MATURITY", value: "4.2M" },
    { label: "NEXT MATURITY", value: "14D" },
  ];
  const vis = useStagger(stats.length, 40);

  return (
    <div
      style={{
        padding: "32px 0",
        borderTop: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear 800ms forwards",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              borderRight: i < stats.length - 1 ? `1px solid ${C.rule}` : "none",
              paddingRight: i < stats.length - 1 ? 20 : 0,
              paddingLeft: i > 0 ? 20 : 0,
              opacity: vis[i] ? 1 : 0,
              transition: "opacity 400ms linear",
            }}
          >
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 10,
                fontWeight: 500,
                color: C.g600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: FONT.heading,
                fontSize: 20,
                fontWeight: 400,
                color: C.white,
                lineHeight: 1.0,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YieldHistory() {
  const months = [
    { month: "SEP", value: 8420 },
    { month: "OCT", value: 9180 },
    { month: "NOV", value: 10240 },
    { month: "DEC", value: 11050 },
    { month: "JAN", value: 11890 },
    { month: "FEB", value: 12450 },
  ];
  const maxVal = Math.max(...months.map((m) => m.value));
  const vis = useStagger(months.length, 40);

  return (
    <div
      style={{
        padding: "32px 0",
        borderTop: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear 880ms forwards",
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 11,
          fontWeight: 500,
          color: C.g500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        MONTHLY YIELD
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
        {months.map((m, i) => {
          const h = (m.value / maxVal) * 72;
          return (
            <div
              key={m.month}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                opacity: vis[i] ? 1 : 0,
                transition: "opacity 400ms linear",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: h,
                  background: C.white,
                  opacity: 0.1 + (i / (months.length - 1)) * 0.5,
                  transition: "height 1s linear",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 2,
          marginTop: 8,
        }}
      >
        {months.map((m) => (
          <div
            key={m.month}
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: FONT.mono,
              fontSize: 9,
              color: C.g600,
              letterSpacing: "0.1em",
            }}
          >
            {m.month}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 2,
          marginTop: 2,
        }}
      >
        {months.map((m) => (
          <div
            key={`v-${m.month}`}
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: FONT.mono,
              fontSize: 9,
              color: C.g500,
            }}
          >
            ${(m.value / 1000).toFixed(1)}k
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemStatus() {
  const items = [
    { label: "RPC NODE", status: "CONNECTED", ok: true },
    { label: "ORACLE FEED", status: "LIVE", ok: true },
    { label: "REBALANCER", status: "IDLE", ok: true },
    { label: "LAST SYNC", status: "4s AGO", ok: true },
  ];

  return (
    <div
      style={{
        padding: "32px 0",
        borderTop: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear 960ms forwards",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: item.ok ? C.white : C.red,
                opacity: item.ok ? 0.6 : 1,
              }}
            />
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                color: C.g600,
                letterSpacing: "0.1em",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                color: item.ok ? C.g400 : C.red,
              }}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        padding: "24px 0",
        borderTop: `1px solid ${C.rule}`,
        opacity: 0,
        animation: "monoFadeIn 400ms linear 1040ms forwards",
      }}
    >
      <span
        style={{
          fontFamily: FONT.heading,
          fontSize: 10,
          color: C.g600,
          letterSpacing: "0.2em",
        }}
      >
        MONOCHROME ABSOLUTE {"\u2014"} DATA SPEAKS
      </span>
    </div>
  );
}

// --- Main ---

export function MonochromeAbsolutePreview() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: C.bg,
        color: C.white,
        fontFamily: FONT.body,
        padding: "0 40px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <ScannerLine />

      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Header />
        <HeroValue />
        <MetricsGrid />
        <LineChart />
        <DataTable />
        <AllocationBar />
        <RiskMatrix />
        <YieldHistory />
        <ActivityLog />
        <ProtocolStats />
        <SystemStatus />
        <Footer />
      </div>

      <style>{`
        @keyframes monoFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default MonochromeAbsolutePreview;
