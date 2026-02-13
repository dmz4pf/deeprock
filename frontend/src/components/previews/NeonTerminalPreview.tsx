"use client";

import { useEffect, useState, useRef, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const C = {
  bg: "#000000",
  surface: "#0A0A0A",
  surfaceActive: "#111111",
  green: "#00FF41",
  greenDim: "#00CC33",
  greenMuted: "rgba(0,255,65,0.3)",
  greenGhost: "rgba(0,255,65,0.08)",
  pink: "#FF0080",
  blue: "#00D4FF",
  amber: "#FFB000",
  textPrimary: "#00FF41",
  textSecondary: "rgba(0,255,65,0.6)",
  textDim: "rgba(0,255,65,0.3)",
  textComment: "#666666",
  border: "rgba(0,255,65,0.1)",
  scanline: "rgba(0,255,65,0.03)",
} as const;

const FONT = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace";

const MATRIX_CHARS = "0123456789ABCDEF$%&@#><=+-*/[]{}|\\:;.,!?~^";

const ASSETS = [
  { id: "001", name: "US Treasury 6M", type: "TBILL", value: 450000, apy: 5.2 },
  { id: "002", name: "Maple Pool #7", type: "CREDIT", value: 320000, apy: 11.8 },
  { id: "003", name: "Centrifuge RWA", type: "REAL_EST", value: 280000, apy: 8.4 },
  { id: "004", name: "OpenEden TBILL", type: "TBILL", value: 195000, apy: 5.0 },
  { id: "005", name: "Backed bCSPX", type: "EQUITY", value: 148000, apy: 7.2 },
  { id: "006", name: "Goldfinch Sr.", type: "CREDIT", value: 92000, apy: 14.1 },
] as const;

const FEED_ENTRIES = [
  { time: "21:45:32", action: "YIELD_CLAIMED", target: "pool:maple-7", amount: "+$1,247.80", status: "\u2713" },
  { time: "21:44:18", action: "POSITION_OPENED", target: "asset:ust-6m", amount: "$50,000.00", status: "\u2713" },
  { time: "21:43:01", action: "REBALANCE", target: "strategy:auto", amount: "3 assets", status: "\u27F3" },
  { time: "21:41:55", action: "YIELD_ACCRUED", target: "pool:goldfinch", amount: "+$89.42", status: "\u2713" },
  { time: "21:40:22", action: "PRICE_UPDATE", target: "oracle:chainlink", amount: "6 feeds", status: "\u2713" },
  { time: "21:38:47", action: "AUDIT_PASS", target: "contract:vault", amount: "score:98", status: "\u2713" },
] as const;

const CHART_DATA = [
  12, 15, 14, 18, 22, 20, 25, 28, 26, 32, 35, 30, 38, 42, 40, 45, 48, 44,
  50, 55, 52, 58, 62, 60, 65, 68, 72, 70, 75, 78, 82, 80, 85, 88, 92, 90,
  94, 96, 93, 98,
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useFont() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

function useTypewriter(text: string, speed: number = 40, delay: number = 800) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          setDone(true);
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
}

function useFlicker(interval: number = 3000) {
  const [flickering, setFlickering] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlickering(true);
      setTimeout(() => setFlickering(false), 80);
    }, interval + Math.random() * 2000);
    return () => clearInterval(timer);
  }, [interval]);

  return flickering;
}

function useTimestamp() {
  const [ts, setTs] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTs(now.toISOString().replace("T", " ").slice(0, 19) + "Z");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return ts;
}

// ---------------------------------------------------------------------------
// Matrix Rain Column
// ---------------------------------------------------------------------------

function MatrixColumn({ index, totalColumns }: { index: number; totalColumns: number }) {
  const chars = useMemo(() => {
    const len = 20 + Math.floor(Math.random() * 15);
    return Array.from({ length: len }, () =>
      MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
    ).join("\n");
  }, []);

  const duration = 6 + Math.random() * 8;
  const delay = Math.random() * -15;
  const opacity = 0.03 + Math.random() * 0.03;
  const left = `${(index / totalColumns) * 100}%`;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 0,
        fontFamily: FONT,
        fontSize: 11,
        lineHeight: "14px",
        color: C.green,
        opacity,
        whiteSpace: "pre",
        animation: `matrixFall ${duration}s linear ${delay}s infinite`,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {chars}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Terminal Box
// ---------------------------------------------------------------------------

function TerminalBox({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        overflow: "hidden",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: "6px 10px",
            borderBottom: `1px solid ${C.border}`,
            fontFamily: FONT,
            fontSize: 11,
            color: C.textSecondary,
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: C.textDim }}>\u250C\u2500</span>
          <span style={{ textTransform: "uppercase" }}>{title}</span>
          <span style={{ color: C.textDim, flex: 1, overflow: "hidden" }}>
            {"─".repeat(40)}
          </span>
          <span style={{ color: C.textDim }}>\u2500\u2510</span>
        </div>
      )}
      <div style={{ padding: "10px 12px" }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Block
// ---------------------------------------------------------------------------

function StatBlock({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  const flicker = useFlicker(4000 + Math.random() * 3000);

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        padding: "10px 12px",
        flex: 1,
        minWidth: 0,
        transition: "border-color 100ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.greenDim;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 9,
          color: C.textDim,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}
      >
        \u250C\u2500 {label} {"─".repeat(Math.max(0, 10 - label.length))}
        \u2510
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 700,
          color: accent || C.green,
          textShadow: `0 0 12px ${accent || C.green}44, 0 0 24px ${accent || C.green}22`,
          opacity: flicker ? 0.7 : 1,
          transition: "opacity 50ms",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 10,
          color: sub.startsWith("\u25B2") ? C.green : C.textSecondary,
          marginTop: 3,
        }}
      >
        {sub}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 9,
          color: C.textDim,
          marginTop: 4,
        }}
      >
        \u2514{"─".repeat(14)}\u2518
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ASCII Chart (SVG)
// ---------------------------------------------------------------------------

function AsciiChart() {
  const width = 560;
  const height = 160;
  const padLeft = 40;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 25;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxVal = Math.max(...CHART_DATA);
  const minVal = Math.min(...CHART_DATA);
  const range = maxVal - minVal || 1;

  const points = CHART_DATA.map((v, i) => ({
    x: padLeft + (i / (CHART_DATA.length - 1)) * chartW,
    y: padTop + chartH - ((v - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const y = padTop + chartH - pct * chartH;
    const val = Math.round(minVal + pct * range);
    return { y, val };
  });

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} stopOpacity={0.15} />
          <stop offset="100%" stopColor={C.green} stopOpacity={0.01} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid dots */}
      {gridLines.map((g) => (
        <g key={g.val}>
          <text
            x={padLeft - 6}
            y={g.y + 3}
            fill={C.textDim}
            fontFamily={FONT}
            fontSize={8}
            textAnchor="end"
          >
            {g.val}
          </text>
          {Array.from({ length: 40 }, (_, i) => (
            <circle
              key={i}
              cx={padLeft + (i / 39) * chartW}
              cy={g.y}
              r={0.5}
              fill={C.textDim}
            />
          ))}
        </g>
      ))}

      {/* X-axis labels */}
      {["JAN", "APR", "JUL", "OCT", "NOW"].map((label, i) => (
        <text
          key={label}
          x={padLeft + (i / 4) * chartW}
          y={height - 4}
          fill={C.textDim}
          fontFamily={FONT}
          fontSize={8}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#chartFill)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={C.green}
        strokeWidth={1.5}
        filter="url(#glow)"
        strokeDasharray="4 2"
      />

      {/* Data points as dots */}
      {points.filter((_, i) => i % 4 === 0).map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2}
          fill={C.green}
          filter="url(#glow)"
        />
      ))}

      {/* Current value marker */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={C.bg}
        stroke={C.green}
        strokeWidth={1.5}
        filter="url(#glow)"
      >
        <animate
          attributeName="r"
          values="3;5;3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Live Feed Entry
// ---------------------------------------------------------------------------

function FeedEntry({
  entry,
  index,
}: {
  entry: (typeof FEED_ENTRIES)[number];
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      setFlash(true);
      setVisible(true);
      setTimeout(() => setFlash(false), 150);
    }, 600 + index * 400);
    return () => clearTimeout(delay);
  }, [index]);

  if (!visible) return null;

  const isPositive = entry.amount.startsWith("+");
  const amountColor = isPositive ? C.green : C.textSecondary;

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 11,
        lineHeight: "20px",
        color: C.textSecondary,
        display: "flex",
        gap: 8,
        padding: "2px 0",
        background: flash ? C.greenGhost : "transparent",
        transition: "background 100ms",
        borderLeft: `2px solid ${flash ? C.green : "transparent"}`,
        paddingLeft: 8,
      }}
    >
      <span style={{ color: C.textDim }}>[{entry.time}]</span>
      <span
        style={{
          color:
            entry.action === "REBALANCE"
              ? C.amber
              : entry.action === "AUDIT_PASS"
                ? C.blue
                : C.green,
          minWidth: 130,
          display: "inline-block",
        }}
      >
        {entry.action}
      </span>
      <span style={{ color: C.textComment, minWidth: 120, display: "inline-block" }}>
        {entry.target}
      </span>
      <span
        style={{
          color: amountColor,
          fontWeight: isPositive ? 600 : 400,
          minWidth: 90,
          display: "inline-block",
          textAlign: "right",
        }}
      >
        {entry.amount}
      </span>
      <span style={{ color: entry.status === "\u2713" ? C.greenDim : C.amber }}>
        {entry.status}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar (ASCII style)
// ---------------------------------------------------------------------------

function AsciiProgress({ percent, width = 20 }: { percent: number; width?: number }) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return (
    <span style={{ color: C.green }}>
      {"█".repeat(filled)}
      <span style={{ color: C.textDim }}>{"░".repeat(empty)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NeonTerminalPreview() {
  useFont();

  const timestamp = useTimestamp();
  const heroValue = "$2,847,392.58";
  const { displayed: typedValue, done: typingDone } = useTypewriter(heroValue, 50, 1200);
  const { displayed: typedCmd1 } = useTypewriter(
    "> PORTFOLIO.QUERY --format=summary",
    30,
    400
  );
  const { displayed: typedCmd2 } = useTypewriter(
    "> Loading... \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 100%",
    25,
    900
  );

  const [feedVisible, setFeedVisible] = useState(false);
  const [headerGlitch, setHeaderGlitch] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFeedVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeaderGlitch(true);
      setTimeout(() => setHeaderGlitch(false), 60);
    }, 7000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  const matrixColumns = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i),
    []
  );

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
      {/* ── Matrix Rain Background ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {matrixColumns.map((i) => (
          <MatrixColumn key={i} index={i} totalColumns={10} />
        ))}
      </div>

      {/* ── CRT Scanline Overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          )`,
        }}
      />

      {/* ── CRT Vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 51,
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* ── Moving Scanline ── */}
      <div
        className="crt-scanline-sweep"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${C.scanline}, ${C.greenGhost}, ${C.scanline}, transparent)`,
          pointerEvents: "none",
          zIndex: 52,
        }}
      />

      {/* ── Screen Glow ── */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          pointerEvents: "none",
          zIndex: -1,
          boxShadow: `inset 0 0 120px rgba(0,255,65,0.03)`,
          borderRadius: 8,
        }}
      />

      {/* ── Main Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 20px 40px",
        }}
      >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Terminal Header Bar                                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "14px 0 12px",
            borderBottom: `1px solid ${C.border}`,
            fontFamily: FONT,
            fontSize: 11,
            color: C.textSecondary,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            transform: headerGlitch
              ? `translateX(${Math.random() > 0.5 ? 2 : -2}px)`
              : "none",
            transition: "transform 50ms",
          }}
        >
          <span style={{ color: C.textDim }}>\u250C\u2500\u2500\u2500</span>
          <span style={{ color: C.green, fontWeight: 700, letterSpacing: "0.05em" }}>
            NEON TERMINAL
          </span>
          <span style={{ color: C.textDim }}>v3.1.4</span>
          <span style={{ color: C.textDim }}>\u2500\u2500\u2500</span>
          <span
            style={{
              color: C.green,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              className="blink-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.green,
                display: "inline-block",
                boxShadow: `0 0 6px ${C.green}`,
              }}
            />
            CONNECTED
          </span>
          <span style={{ color: C.textDim }}>\u2500\u2500\u2500</span>
          <span style={{ color: C.textComment }}>PORT:8443</span>
          <span style={{ color: C.textDim }}>\u2500\u2500\u2500</span>
          <span style={{ color: C.textSecondary }}>
            <AsciiProgress percent={99.8} width={8} />
            {" "}99.8%
          </span>
          <span
            style={{
              color: C.textDim,
              flex: 1,
              textAlign: "right",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {"─".repeat(20)}\u2500\u2510
          </span>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Command Prompt Hero                                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "24px 0 20px" }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 12,
              lineHeight: "22px",
              color: C.textSecondary,
            }}
          >
            <div style={{ color: C.textComment }}>
              {"// "}Deeprock - Secure Financial Terminal
            </div>
            <div style={{ marginTop: 4 }}>{typedCmd1}<span className="cursor-blink" style={{ color: typedCmd1.length < 37 ? C.green : "transparent" }}>{"\u2588"}</span></div>
            <div style={{ marginTop: 2, color: C.textDim }}>{typedCmd2}</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: C.textComment,
                marginBottom: 4,
              }}
            >
              {">"} TOTAL_VALUE:
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 36,
                fontWeight: 700,
                color: C.green,
                lineHeight: 1.1,
                textShadow: `0 0 20px ${C.green}66, 0 0 40px ${C.green}33, 0 0 60px ${C.green}11`,
                letterSpacing: "-0.02em",
              }}
            >
              {typedValue}
              <span
                className="cursor-blink"
                style={{
                  color: typingDone ? C.green : "transparent",
                  fontSize: 32,
                }}
              >
                {"\u2588"}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              fontFamily: FONT,
              fontSize: 11,
              color: C.textSecondary,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span>
              STATUS: <span style={{ color: C.green }}>ACTIVE</span>
            </span>
            <span style={{ color: C.textDim }}>|</span>
            <span>
              POSITIONS: <span style={{ color: C.green }}>28</span>
            </span>
            <span style={{ color: C.textDim }}>|</span>
            <span>
              YIELD: <span style={{ color: C.green }}>12.4% APY</span>
            </span>
            <span style={{ color: C.textDim }}>|</span>
            <span>
              LAST_UPDATE:{" "}
              <span style={{ color: C.textComment }}>{timestamp}</span>
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* System Stats Panel                                              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <StatBlock
            label="YIELD"
            value="12.4%"
            sub={"\u25B2 +2.1% 7d"}
          />
          <StatBlock
            label="TVL"
            value="$847.2M"
            sub={"\u25B2 +$12.4M"}
          />
          <StatBlock
            label="RISK"
            value="LOW"
            sub={"Score: 94  [\u2588\u2588\u2591\u2591]"}
            accent={C.green}
          />
          <StatBlock
            label="UPTIME"
            value="99.97%"
            sub={"364d 12h 47m"}
            accent={C.blue}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Performance Chart                                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TerminalBox title="PERFORMANCE \u2500 12M YIELD CURVE" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 6, fontSize: 10, color: C.textComment }}>
            {">"} CHART.RENDER --type=oscilloscope --period=12M
          </div>
          <AsciiChart />
          <div
            style={{
              marginTop: 6,
              fontSize: 9,
              color: C.textDim,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>\u2514\u2500 Source: on-chain oracle aggregator</span>
            <span>Refresh: 30s \u2500\u2518</span>
          </div>
        </TerminalBox>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Asset Matrix                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TerminalBox title="ASSET MATRIX" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.textComment, marginBottom: 8 }}>
            {">"} ASSETS.LIST --sort=value --desc
          </div>

          {/* Table header */}
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 2 }}>
            {"─".repeat(72)}
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 10,
              color: C.textSecondary,
              display: "grid",
              gridTemplateColumns: "40px 1fr 80px 100px 60px",
              gap: 4,
              padding: "3px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>ID</span>
            <span>ASSET</span>
            <span>TYPE</span>
            <span style={{ textAlign: "right" }}>VALUE</span>
            <span style={{ textAlign: "right" }}>APY</span>
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>
            {"─".repeat(72)}
          </div>

          {/* Table rows */}
          {ASSETS.map((asset, idx) => (
            <AssetRow key={asset.id} asset={asset} index={idx} />
          ))}

          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
            {"─".repeat(72)}
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.textComment,
              marginTop: 4,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>6 results returned in 0.023s</span>
            <span>
              TOTAL: <span style={{ color: C.green }}>$1,485,000</span>
            </span>
          </div>
        </TerminalBox>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Live Feed                                                       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TerminalBox title="LIVE FEED \u2500 TRANSACTION LOG" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.textComment, marginBottom: 8 }}>
            {">"} FEED.STREAM --tail --follow
          </div>
          {feedVisible &&
            FEED_ENTRIES.map((entry, i) => (
              <FeedEntry key={i} entry={entry} index={i} />
            ))}
          {feedVisible && (
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color: C.textDim,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span className="cursor-blink" style={{ color: C.green }}>{"\u2588"}</span>
              <span>Waiting for new events...</span>
            </div>
          )}
        </TerminalBox>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Protocol Status Footer                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 12,
            fontFamily: FONT,
            fontSize: 9,
            color: C.textDim,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            \u2514\u2500 PROTOCOLS:{" "}
            <span style={{ color: C.green }}>Maple</span>{" "}
            <span style={{ color: C.textComment }}>|</span>{" "}
            <span style={{ color: C.green }}>Centrifuge</span>{" "}
            <span style={{ color: C.textComment }}>|</span>{" "}
            <span style={{ color: C.green }}>OpenEden</span>{" "}
            <span style={{ color: C.textComment }}>|</span>{" "}
            <span style={{ color: C.green }}>Backed</span>{" "}
            <span style={{ color: C.textComment }}>|</span>{" "}
            <span style={{ color: C.green }}>Goldfinch</span>
          </span>
          <span>
            CHAIN: <span style={{ color: C.blue }}>Avalanche C-Chain</span>{" "}
            <span style={{ color: C.textComment }}>|</span> BLOCK:{" "}
            <span style={{ color: C.textSecondary }}>48,291,045</span>
          </span>
        </div>

        <div
          style={{
            marginTop: 8,
            fontFamily: FONT,
            fontSize: 9,
            color: C.textComment,
            textAlign: "center",
          }}
        >
          {"═".repeat(60)}
          <div style={{ marginTop: 4 }}>
            <span style={{ color: C.textDim }}>[ </span>
            <span style={{ color: C.green, letterSpacing: "0.15em" }}>
              HACK THE FINANCIAL MATRIX
            </span>
            <span style={{ color: C.textDim }}> ]</span>
          </div>
          <div style={{ marginTop: 4, color: C.textDim }}>
            DEEPROCK \u2500 Neon Terminal v3.1.4 \u2500 {timestamp}
          </div>
        </div>
      </div>

      {/* ── Keyframe Styles ── */}
      <style>{`
        @keyframes matrixFall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes scanlineSweep {
          0% { top: -2px; }
          100% { top: 100%; }
        }

        @keyframes cursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @keyframes dotBlink {
          0%, 40% { opacity: 1; }
          50%, 90% { opacity: 0.2; }
          100% { opacity: 1; }
        }

        @keyframes glitchShift {
          0% { transform: translateX(0); filter: none; }
          20% { transform: translateX(-3px); filter: hue-rotate(90deg); }
          40% { transform: translateX(3px); filter: hue-rotate(-90deg); }
          60% { transform: translateX(-1px); filter: none; }
          80% { transform: translateX(2px); filter: hue-rotate(45deg); }
          100% { transform: translateX(0); filter: none; }
        }

        @keyframes rowFlash {
          0% { background: rgba(0,255,65,0.08); }
          100% { background: transparent; }
        }

        .crt-scanline-sweep {
          animation: scanlineSweep 8s linear infinite;
        }

        .cursor-blink {
          animation: cursorBlink 1s step-end infinite;
        }

        .blink-dot {
          animation: dotBlink 2s ease-in-out infinite;
        }

        .neon-asset-row {
          transition: background 100ms, border-color 100ms;
        }

        .neon-asset-row:hover {
          background: rgba(0,255,65,0.04) !important;
          animation: glitchShift 120ms ease-out;
        }

        .neon-asset-row:hover .asset-id {
          color: #FF0080 !important;
        }

        .neon-asset-row:hover .asset-apy {
          color: #00FF41 !important;
          text-shadow: 0 0 8px rgba(0,255,65,0.6);
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset Row (extracted to avoid inline complexity in the main component)
// ---------------------------------------------------------------------------

function AssetRow({
  asset,
  index,
}: {
  asset: (typeof ASSETS)[number];
  index: number;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 1800 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  if (!entered) return null;

  const typeColor =
    asset.type === "TBILL"
      ? C.blue
      : asset.type === "CREDIT"
        ? C.amber
        : asset.type === "EQUITY"
          ? C.pink
          : C.textSecondary;

  return (
    <div
      className="neon-asset-row"
      style={{
        fontFamily: FONT,
        fontSize: 11,
        display: "grid",
        gridTemplateColumns: "40px 1fr 80px 100px 60px",
        gap: 4,
        padding: "4px 0",
        borderLeft: "2px solid transparent",
        cursor: "default",
        animation: "rowFlash 400ms ease-out",
      }}
    >
      <span className="asset-id" style={{ color: C.textDim }}>{asset.id}</span>
      <span style={{ color: C.textPrimary }}>{asset.name}</span>
      <span style={{ color: typeColor, fontSize: 10 }}>{asset.type}</span>
      <span style={{ color: C.green, textAlign: "right", fontWeight: 600 }}>
        ${asset.value.toLocaleString()}
      </span>
      <span
        className="asset-apy"
        style={{
          color: asset.apy > 10 ? C.green : C.textSecondary,
          textAlign: "right",
          fontWeight: asset.apy > 10 ? 600 : 400,
        }}
      >
        {asset.apy}%
      </span>
    </div>
  );
}
