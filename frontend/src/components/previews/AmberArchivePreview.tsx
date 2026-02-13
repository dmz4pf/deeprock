"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const C = {
  bg: "#0C0A06",
  surface: "#151208",
  surfaceElevated: "#1E1A0E",
  amber: "#FFB000",
  amberBright: "#FFD466",
  amberDim: "#CC8C00",
  amberGhost: "rgba(255,176,0,0.08)",
  amberGlow: "rgba(255,176,0,0.15)",
  textPrimary: "#FFD466",
  textSecondary: "rgba(255,176,0,0.6)",
  textDim: "rgba(255,176,0,0.3)",
  textFaded: "rgba(255,176,0,0.15)",
  redacted: "#0C0A06",
  classificationRed: "#CC3333",
  border: "rgba(255,176,0,0.08)",
  borderHover: "rgba(255,176,0,0.2)",
  shadow: "0 4px 16px rgba(255,176,0,0.04)",
} as const;

const FONT_TYPEWRITER = "'Special Elite', 'Courier New', monospace";
const FONT_MONO = "'IBM Plex Mono', 'Consolas', monospace";

const ASSETS = [
  { ref: "A-001", designation: "US TREASURY 6M", class: "T-BILL", value: 450000, yield: 5.2, maturity: "2026-08-15", riskCode: "ALPHA-2" },
  { ref: "A-002", designation: "MAPLE SR. POOL", class: "CREDIT", value: 320000, yield: 11.8, maturity: "OPEN-END", riskCode: "BETA-4" },
  { ref: "A-003", designation: "CENTRIFUGE RWA", class: "REAL-EST", value: 280000, yield: 8.4, maturity: "2027-01-20", riskCode: "BETA-3" },
  { ref: "A-004", designation: "OPENEDEN TBILL", class: "T-BILL", value: 195000, yield: 5.0, maturity: "2026-06-30", riskCode: "ALPHA-1" },
  { ref: "A-005", designation: "BACKED BCSPX", class: "EQUITY", value: 148000, yield: 7.2, maturity: "PERPETUAL", riskCode: "GAMMA-1" },
  { ref: "A-006", designation: "GOLDFINCH SR.", class: "CREDIT", value: 92000, yield: 14.1, maturity: "2026-11-01", riskCode: "BETA-5" },
] as const;

const DOSSIER_CARDS = [
  { category: "TREASURY BONDS", value: 450000, yield: 5.2, status: "ACTIVE", maturity: "2026-08-15", riskCode: "ALPHA-2" },
  { category: "PRIVATE CREDIT", value: 320000, yield: 11.8, status: "ACTIVE", maturity: "OPEN-END", riskCode: "BETA-4" },
  { category: "REAL ESTATE", value: 280000, yield: 8.4, status: "MONITORED", maturity: "2027-01-20", riskCode: "BETA-3" },
  { category: "EQUITY INDEX", value: 148000, yield: 7.2, status: "ACTIVE", maturity: "PERPETUAL", riskCode: "GAMMA-1" },
] as const;

const CHART_DATA = [
  18, 22, 20, 26, 30, 28, 34, 38, 35, 42, 46, 44,
  50, 55, 52, 58, 62, 60, 66, 70, 68, 74, 78, 82,
  80, 86, 90, 88, 94, 98,
];

const TOTAL_VALUE = 2847392.58;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

function useTypewriter(text: string, baseSpeed: number = 55, delay: number = 800) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let cancelled = false;

    const timeout = setTimeout(() => {
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
          const jitter = baseSpeed + (Math.random() * 40 - 20);
          setTimeout(tick, jitter);
        } else {
          setDone(true);
        }
      };
      tick();
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [text, baseSpeed, delay]);

  return { displayed, done };
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

function useStampAnimation(delay: number = 1600) {
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStamped(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return stamped;
}

function useStaggeredVisible(count: number, baseDelay: number = 100) {
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
        }, baseDelay * i + 600)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [count, baseDelay]);

  return visible;
}

// ---------------------------------------------------------------------------
// Redaction Bar — the signature effect
// ---------------------------------------------------------------------------

function RedactionBar({
  revealText,
  width,
  cycleDuration = 10,
  style,
}: {
  revealText: string;
  width: string;
  cycleDuration?: number;
  style?: React.CSSProperties;
}) {
  const uniqueId = useMemo(() => `redact-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: FONT_MONO,
        ...style,
      }}
    >
      <span style={{ color: C.textPrimary, visibility: "hidden" }}>{revealText}</span>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          color: C.textPrimary,
          whiteSpace: "nowrap",
        }}
      >
        {revealText}
      </span>
      <span
        className={uniqueId}
        style={{
          position: "absolute",
          left: -2,
          top: -1,
          bottom: -1,
          width,
          background: C.redacted,
          zIndex: 1,
        }}
      />
      <style>{`
        .${uniqueId} {
          animation: redactGlitch-${uniqueId} ${cycleDuration}s ease-in-out infinite;
        }
        @keyframes redactGlitch-${uniqueId} {
          0%, 88%, 100% { opacity: 1; }
          90% { opacity: 0; transform: translateX(2px); }
          92% { opacity: 1; }
          94% { opacity: 0; transform: translateX(-1px); }
          96% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Classified Stamp
// ---------------------------------------------------------------------------

function ClassifiedStamp({
  text,
  delay = 1600,
  rotation = -3,
  style,
}: {
  text: string;
  delay?: number;
  rotation?: number;
  style?: React.CSSProperties;
}) {
  const stamped = useStampAnimation(delay);

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FONT_TYPEWRITER,
        fontSize: 11,
        fontWeight: 400,
        color: C.classificationRed,
        border: `2px solid ${C.classificationRed}`,
        padding: "2px 10px",
        letterSpacing: "0.15em",
        transform: stamped
          ? `rotate(${rotation}deg) scale(1)`
          : `rotate(${rotation - 8}deg) scale(1.6)`,
        opacity: stamped ? 1 : 0,
        transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Amber Block Cursor
// ---------------------------------------------------------------------------

function AmberCursor() {
  return (
    <span
      className="amber-cursor-blink"
      style={{
        display: "inline-block",
        width: 8,
        height: 16,
        background: C.amber,
        marginLeft: 2,
        verticalAlign: "text-bottom",
        boxShadow: `0 0 6px ${C.amber}88`,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Dossier Card — folder-tab style
// ---------------------------------------------------------------------------

function DossierCard({
  card,
  visible,
  index,
}: {
  card: (typeof DOSSIER_CARDS)[number];
  visible: boolean;
  index: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `all 500ms cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: `${index * 80}ms`,
      }}
    >
      {/* Folder tab */}
      <div
        style={{
          position: "absolute",
          top: -14,
          left: 12,
          background: C.surfaceElevated,
          border: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.surfaceElevated}`,
          padding: "1px 12px",
          fontFamily: FONT_TYPEWRITER,
          fontSize: 10,
          color: C.amberDim,
          letterSpacing: "0.08em",
        }}
      >
        {card.category}
      </div>

      {/* Card content */}
      <div style={{ padding: "20px 16px 14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <DossierField label="ASSESSED VALUE" value={`$${card.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} highlight />
          <DossierField label="YIELD RATING" value={`${card.yield.toFixed(2)}% APY`} />
          <DossierField label="STATUS" value={card.status} />
          <DossierField label="MATURITY" value={card.maturity} />
          <DossierField label="RISK CODE" value={card.riskCode} />
        </div>
      </div>
    </div>
  );
}

function DossierField({
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
        fontFamily: FONT_MONO,
        fontSize: 11,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <span style={{ color: C.textDim, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
        {label}:
      </span>
      <span
        style={{
          color: highlight ? C.amberBright : C.textPrimary,
          fontWeight: highlight ? 600 : 400,
          textShadow: highlight ? `0 0 8px ${C.amber}44` : "none",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Oscilloscope Chart
// ---------------------------------------------------------------------------

function OscilloscopeChart({ visible }: { visible: boolean }) {
  const width = 600;
  const height = 180;
  const padLeft = 44;
  const padRight = 10;
  const padTop = 14;
  const padBottom = 28;
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

  const gridYPositions = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padTop + chartH - pct * chartH,
    val: Math.round(minVal + pct * range),
  }));

  const months = ["FEB", "APR", "JUN", "AUG", "OCT", "DEC", "FEB"];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="amberAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.amber} stopOpacity={0.12} />
            <stop offset="100%" stopColor={C.amber} stopOpacity={0.01} />
          </linearGradient>
          <filter id="amberGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {gridYPositions.map((g) => (
          <g key={g.val}>
            <text
              x={padLeft - 8}
              y={g.y + 3}
              fill={C.textDim}
              fontFamily={FONT_MONO}
              fontSize={8}
              textAnchor="end"
            >
              {g.val}
            </text>
            <line
              x1={padLeft}
              y1={g.y}
              x2={padLeft + chartW}
              y2={g.y}
              stroke={C.amberGhost}
              strokeDasharray="2 6"
            />
          </g>
        ))}

        {/* X-axis labels */}
        {months.map((label, i) => (
          <text
            key={`${label}-${i}`}
            x={padLeft + (i / (months.length - 1)) * chartW}
            y={height - 4}
            fill={C.textDim}
            fontFamily={FONT_MONO}
            fontSize={8}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#amberAreaFill)" className="amber-area-animate" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={C.amber}
          strokeWidth={1.5}
          filter="url(#amberGlow)"
          className="amber-line-animate"
        />

        {/* Data point markers */}
        {points.filter((_, i) => i % 5 === 0).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.5}
            fill={C.amber}
            filter="url(#amberGlow)"
          />
        ))}

        {/* Current value pulse */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={C.bg}
          stroke={C.amber}
          strokeWidth={1.5}
          filter="url(#amberGlow)"
        >
          <animate
            attributeName="r"
            values="3;5;3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Holdings Registry Row
// ---------------------------------------------------------------------------

function RegistryRow({
  asset,
  isRedacted,
  visible,
}: {
  asset: (typeof ASSETS)[number];
  isRedacted: boolean;
  visible: boolean;
}) {
  if (!visible) return null;

  if (isRedacted) {
    return (
      <div
        className="amber-registry-row"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          display: "grid",
          gridTemplateColumns: "50px 1.2fr 0.7fr 0.9fr 0.6fr",
          gap: 8,
          padding: "5px 0",
          animation: "amberRowFlash 400ms ease-out",
        }}
      >
        <span style={{ color: C.textDim }}>{asset.ref}</span>
        <span>
          <RedactionBar revealText={asset.designation} width="calc(100% + 4px)" cycleDuration={12} />
        </span>
        <span>
          <RedactionBar revealText={asset.class} width="calc(100% + 4px)" cycleDuration={14} />
        </span>
        <span style={{ textAlign: "right" }}>
          <RedactionBar revealText={`$${asset.value.toLocaleString()}`} width="calc(100% + 4px)" cycleDuration={11} />
        </span>
        <span style={{ textAlign: "right" }}>
          <RedactionBar revealText={`${asset.yield}%`} width="calc(100% + 4px)" cycleDuration={13} />
        </span>
      </div>
    );
  }

  const classColor =
    asset.class === "T-BILL" ? C.amberBright :
    asset.class === "CREDIT" ? C.amberDim :
    asset.class === "EQUITY" ? C.amber :
    C.textSecondary;

  return (
    <div
      className="amber-registry-row"
      style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        display: "grid",
        gridTemplateColumns: "50px 1.2fr 0.7fr 0.9fr 0.6fr",
        gap: 8,
        padding: "5px 0",
        cursor: "default",
        animation: "amberRowFlash 400ms ease-out",
      }}
    >
      <span style={{ color: C.textDim }}>{asset.ref}</span>
      <span style={{ color: C.textPrimary }}>{asset.designation}</span>
      <span style={{ color: classColor, fontSize: 10 }}>{asset.class}</span>
      <span style={{ color: C.amberBright, textAlign: "right", fontWeight: 500 }}>
        ${asset.value.toLocaleString()}
      </span>
      <span
        style={{
          color: asset.yield > 10 ? C.amberBright : C.textSecondary,
          textAlign: "right",
          fontWeight: asset.yield > 10 ? 600 : 400,
        }}
      >
        {asset.yield}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Divider
// ---------------------------------------------------------------------------

function SectionRule({ char = "─", length = 56 }: { char?: string; length?: number }) {
  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: C.textFaded,
        overflow: "hidden",
        whiteSpace: "nowrap",
        lineHeight: "16px",
      }}
    >
      {char.repeat(length)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AmberArchivePreview() {
  useFonts();

  const timestamp = useTimestamp();
  const heroText = `$ ${TOTAL_VALUE.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const { displayed: typedValue, done: typingDone } = useTypewriter(heroText, 50, 1400);
  const { displayed: typedDocNo } = useTypewriter("ARC-2026-0847", 70, 600);

  const cardVisibility = useStaggeredVisible(DOSSIER_CARDS.length, 120);
  const rowVisibility = useStaggeredVisible(ASSETS.length, 140);
  const [chartVisible, setChartVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const chartTimer = setTimeout(() => setChartVisible(true), 2200);
    const footerTimer = setTimeout(() => setFooterVisible(true), 3200);
    return () => {
      clearTimeout(chartTimer);
      clearTimeout(footerTimer);
    };
  }, []);

  return (
    <div
      className="amber-archive-root"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: FONT_MONO,
        color: C.textPrimary,
        overflow: "hidden",
      }}
    >
      {/* ── CRT Scanlines ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.04) 2px,
            rgba(0,0,0,0.04) 4px
          )`,
        }}
      />

      {/* ── Moving Scanline ── */}
      <div
        className="amber-scanline-sweep"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${C.amberGhost}, ${C.amberGlow}, ${C.amberGhost}, transparent)`,
          pointerEvents: "none",
          zIndex: 52,
        }}
      />

      {/* ── Paper Vignette ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 51,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(12,10,6,0.6) 100%)",
        }}
      />

      {/* ── Paper Grain Noise ── */}
      <div
        className="amber-grain"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 49,
          opacity: 0.03,
        }}
      />

      {/* ── Ambient Amber Edge Glow ── */}
      <div
        style={{
          position: "fixed",
          inset: -40,
          pointerEvents: "none",
          zIndex: -1,
          boxShadow: `inset 0 0 200px rgba(255,176,0,0.02)`,
        }}
      />

      {/* ── Main Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 860,
          margin: "0 auto",
          padding: "0 24px 60px",
        }}
      >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Classification Header                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "20px 0 16px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONT_TYPEWRITER,
                  fontSize: 22,
                  color: C.amberBright,
                  letterSpacing: "0.12em",
                  textShadow: `0 0 20px ${C.amber}44`,
                  lineHeight: 1.2,
                }}
              >
                AMBER ARCHIVE
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: C.textSecondary,
                  marginTop: 4,
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  DOCUMENT NO:{" "}
                  <span style={{ color: C.textPrimary }}>
                    {typedDocNo}
                    {typedDocNo.length < 14 && <AmberCursor />}
                  </span>
                </span>
                <span>
                  DATE: <span style={{ color: C.textPrimary }}>2026-02-09</span>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  color: C.textDim,
                  letterSpacing: "0.06em",
                }}
              >
                CLASSIFICATION: <span style={{ color: C.amberDim }}>LEVEL 5</span>
              </div>
              <ClassifiedStamp text="AUTHORIZED" delay={2000} rotation={-3} />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Subject Line                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "20px 0",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_TYPEWRITER,
              fontSize: 15,
              color: C.amberBright,
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            SUBJECT: PORTFOLIO INTELLIGENCE BRIEFING
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: C.textSecondary,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div>
              ASSET HOLDER:{" "}
              <span style={{ color: C.textDim }}>[REDACTED]</span>{" "}
              <RedactionBar revealText="DAMI" width="52px" cycleDuration={8} />
            </div>
            <div>
              CLEARANCE: <span style={{ color: C.amberDim }}>SIGMA-7</span>
            </div>
            <div>
              PREPARED BY: <span style={{ color: C.textDim }}>FINANCIAL INTELLIGENCE DIVISION</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Primary Intelligence — Hero Value                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "28px 0 24px" }}>
          <div
            style={{
              fontFamily: FONT_TYPEWRITER,
              fontSize: 12,
              color: C.textDim,
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            TOTAL ASSESSED VALUE
          </div>

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.textFaded,
              lineHeight: "12px",
              marginBottom: 6,
            }}
          >
            {"═".repeat(40)}
          </div>

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 38,
              fontWeight: 600,
              color: C.amberBright,
              lineHeight: 1.1,
              textShadow: `0 0 20px ${C.amber}55, 0 0 40px ${C.amber}22`,
              letterSpacing: "-0.01em",
            }}
          >
            {typedValue}
            {!typingDone && <AmberCursor />}
            {typingDone && (
              <span className="amber-cursor-blink" style={{ display: "inline-block", width: 8, height: 30, background: C.amber, marginLeft: 3, verticalAlign: "text-bottom", boxShadow: `0 0 6px ${C.amber}88` }} />
            )}
          </div>

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.textFaded,
              lineHeight: "12px",
              marginTop: 6,
            }}
          >
            {"═".repeat(40)}
          </div>

          <div
            style={{
              marginTop: 12,
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: C.textSecondary,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span>
              CHANGE:{" "}
              <span style={{ color: C.amberBright }}>+12.4%</span>
            </span>
            <span style={{ color: C.textFaded }}>|</span>
            <span>
              RISK ASSESSMENT:{" "}
              <span style={{ color: C.amberBright }}>LOW</span>
            </span>
            <span style={{ color: C.textFaded }}>|</span>
            <span>
              POSITIONS:{" "}
              <span style={{ color: C.amberBright }}>28</span>
            </span>
            <span style={{ color: C.textFaded }}>|</span>
            <span>
              LAST UPDATE:{" "}
              <span style={{ color: C.textDim }}>{timestamp}</span>
            </span>
          </div>
        </div>

        <SectionRule />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Asset Dossier Cards                                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "28px 0 20px" }}>
          <div
            style={{
              fontFamily: FONT_TYPEWRITER,
              fontSize: 13,
              color: C.amberDim,
              letterSpacing: "0.1em",
              marginBottom: 24,
            }}
          >
            ASSET DOSSIER — CLASSIFIED HOLDINGS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "24px 16px",
            }}
          >
            {DOSSIER_CARDS.map((card, i) => (
              <DossierCard
                key={card.category}
                card={card}
                visible={cardVisibility[i]}
                index={i}
              />
            ))}
          </div>
        </div>

        <SectionRule />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Intelligence Chart                                              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "28px 0 20px" }}>
          <div
            style={{
              fontFamily: FONT_TYPEWRITER,
              fontSize: 13,
              color: C.amberDim,
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            PERFORMANCE TRACKING — 12 MONTH
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.textDim,
              marginBottom: 12,
            }}
          >
            SOURCE: ON-CHAIN ORACLE AGGREGATOR | REFRESH INTERVAL: 30S
          </div>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              padding: "12px 12px 6px",
            }}
          >
            <OscilloscopeChart visible={chartVisible} />
          </div>
        </div>

        <SectionRule />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Holdings Registry                                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "28px 0 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontFamily: FONT_TYPEWRITER,
                fontSize: 13,
                color: C.amberDim,
                letterSpacing: "0.1em",
              }}
            >
              REGISTRY OF HOLDINGS — PAGE 1 OF 1
            </div>
            <ClassifiedStamp text="CLASSIFIED" delay={2800} rotation={2} style={{ fontSize: 9, padding: "1px 8px" }} />
          </div>

          {/* Table header */}
          <SectionRule />
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.textDim,
              display: "grid",
              gridTemplateColumns: "50px 1.2fr 0.7fr 0.9fr 0.6fr",
              gap: 8,
              padding: "6px 0",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <span>REF</span>
            <span>DESIGNATION</span>
            <span>CLASS</span>
            <span style={{ textAlign: "right" }}>VALUE</span>
            <span style={{ textAlign: "right" }}>YIELD</span>
          </div>
          <SectionRule />

          {/* Table rows */}
          {ASSETS.map((asset, idx) => (
            <RegistryRow
              key={asset.ref}
              asset={asset}
              isRedacted={idx === 2}
              visible={rowVisibility[idx]}
            />
          ))}

          <SectionRule />

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.textDim,
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>6 RECORDS RETURNED | 1 REDACTED</span>
            <span>
              TOTAL:{" "}
              <span style={{ color: C.amberBright }}>
                ${ASSETS.reduce((sum, a) => sum + a.value, 0).toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        <SectionRule />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Supplementary Intelligence                                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "24px 0 20px" }}>
          <div
            style={{
              fontFamily: FONT_TYPEWRITER,
              fontSize: 13,
              color: C.amberDim,
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            SUPPLEMENTARY INTELLIGENCE
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <IntelCard label="YIELD EFFICIENCY" value="12.4% AVG" detail="WEIGHTED ACROSS 28 POSITIONS" />
            <IntelCard label="PROTOCOL EXPOSURE" value="5 ACTIVE" detail="MAPLE | CENTRIFUGE | OPENEDEN | BACKED | GOLDFINCH" />
            <IntelCard label="CHAIN STATUS" value="AVALANCHE" detail="BLOCK: 48,291,045 | UPTIME: 99.97%" />
          </div>
        </div>

        <SectionRule />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Operational Notes                                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "24px 0 20px" }}>
          <div
            style={{
              fontFamily: FONT_TYPEWRITER,
              fontSize: 13,
              color: C.amberDim,
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            OPERATIONAL NOTES
          </div>

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: C.textSecondary,
              lineHeight: 1.7,
              background: C.surface,
              border: `1px solid ${C.border}`,
              padding: "14px 16px",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.textDim }}>NOTE 1:</span>{" "}
              ASSET HOLDER MAINTAINS DIVERSIFIED EXPOSURE ACROSS TREASURY,
              CREDIT, AND EQUITY INSTRUMENTS. RISK PROFILE CLASSIFIED AS{" "}
              <span style={{ color: C.amberBright }}>CONSERVATIVE</span>.
            </div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.textDim }}>NOTE 2:</span>{" "}
              YIELD OPTIMIZATION STRATEGY DEPLOYED ACROSS{" "}
              <RedactionBar revealText="5 PROTOCOLS" width="82px" cycleDuration={9} />{" "}
              WITH AUTOMATED REBALANCING ENABLED.
            </div>
            <div>
              <span style={{ color: C.textDim }}>NOTE 3:</span>{" "}
              NEXT MATURITY EVENT SCHEDULED FOR{" "}
              <span style={{ color: C.amberBright }}>2026-06-30</span>{" "}
              (OPENEDEN TBILL). ROLLOVER INSTRUCTIONS{" "}
              <span style={{ color: C.textDim }}>[PENDING AUTHORIZATION]</span>.
            </div>
          </div>
        </div>

        <SectionRule />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Activity Log                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "24px 0 20px" }}>
          <div
            style={{
              fontFamily: FONT_TYPEWRITER,
              fontSize: 13,
              color: C.amberDim,
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            RECENT ACTIVITY LOG
          </div>

          <ActivityLog />
        </div>

        <SectionRule />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* Footer                                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "24px 0 20px",
            opacity: footerVisible ? 1 : 0,
            transform: footerVisible ? "translateY(0)" : "translateY(8px)",
            transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.textDim,
              textAlign: "center",
              lineHeight: 1.8,
            }}
          >
            <div style={{ color: C.textFaded }}>
              {"─".repeat(20)} END OF DOCUMENT {"─".repeat(20)}
            </div>
            <div style={{ marginTop: 8 }}>
              FILE ARCHIVED: <span style={{ color: C.textSecondary }}>2026-02-09T21:45:32Z</span>
            </div>
            <div>
              NEXT REVIEW: <span style={{ color: C.textSecondary }}>2026-03-09</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 }}>
              <span>DESTROY AFTER READING:</span>
              <ClassifiedStamp text="NO" delay={3800} rotation={-1} style={{ fontSize: 9, padding: "0px 8px" }} />
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              fontFamily: FONT_TYPEWRITER,
              fontSize: 10,
              color: C.textFaded,
              textAlign: "center",
              letterSpacing: "0.15em",
            }}
          >
            {"═".repeat(48)}
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: FONT_TYPEWRITER,
              fontSize: 11,
              color: C.textDim,
              textAlign: "center",
              letterSpacing: "0.2em",
            }}
          >
            [ DECLASSIFIED WEALTH INTELLIGENCE ]
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: FONT_MONO,
              fontSize: 9,
              color: C.textFaded,
              textAlign: "center",
            }}
          >
            AMBER ARCHIVE — DEEPROCK — {timestamp}
          </div>
        </div>
      </div>

      {/* ── Keyframe Styles ── */}
      <style>{`
        /* CRT Flicker */
        .amber-archive-root {
          animation: amberCrtFlicker 4s ease-in-out infinite;
        }

        @keyframes amberCrtFlicker {
          0%, 100% { opacity: 1; }
          48% { opacity: 1; }
          50% { opacity: 0.985; }
          52% { opacity: 1; }
          78% { opacity: 1; }
          80% { opacity: 0.99; }
          82% { opacity: 1; }
        }

        /* Scanline sweep */
        .amber-scanline-sweep {
          animation: amberScanlineSweep 6s linear infinite;
        }

        @keyframes amberScanlineSweep {
          0% { top: -2px; }
          100% { top: 100%; }
        }

        /* Cursor blink */
        .amber-cursor-blink {
          animation: amberCursorBlink 1s step-end infinite;
        }

        @keyframes amberCursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        /* Chart line reveal */
        .amber-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: amberLineReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        @keyframes amberLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        /* Chart area reveal */
        .amber-area-animate {
          opacity: 0;
          animation: amberAreaReveal 1s ease 2s forwards;
        }

        @keyframes amberAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Row flash on enter */
        @keyframes amberRowFlash {
          0% { background: rgba(255,176,0,0.06); }
          100% { background: transparent; }
        }

        /* Registry row hover */
        .amber-registry-row {
          transition: background 150ms ease, border-color 150ms ease;
          border-left: 2px solid transparent;
          padding-left: 6px;
        }

        .amber-registry-row:hover {
          background: rgba(255,176,0,0.04);
          border-left-color: rgba(255,176,0,0.3);
        }

        /* Paper grain texture via SVG filter */
        .amber-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }

        /* Activity log entry flash */
        @keyframes amberLogFlash {
          0% { background: rgba(255,176,0,0.08); border-left-color: rgba(255,176,0,0.5); }
          100% { background: transparent; border-left-color: transparent; }
        }

        .amber-log-entry {
          animation: amberLogFlash 600ms ease-out;
          border-left: 2px solid transparent;
          padding-left: 8px;
          transition: background 150ms ease;
        }

        .amber-log-entry:hover {
          background: rgba(255,176,0,0.03);
        }

        /* Intel card hover */
        .amber-intel-card {
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .amber-intel-card:hover {
          border-color: rgba(255,176,0,0.2) !important;
          box-shadow: 0 4px 24px rgba(255,176,0,0.06);
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intel Card
// ---------------------------------------------------------------------------

function IntelCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      className="amber-intel-card"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: "14px 14px 12px",
        boxShadow: C.shadow,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: C.textDim,
          letterSpacing: "0.08em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 16,
          fontWeight: 600,
          color: C.amberBright,
          textShadow: `0 0 10px ${C.amber}33`,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: C.textDim,
          lineHeight: 1.4,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

const LOG_ENTRIES = [
  { time: "21:45:32", action: "YIELD_CLAIMED", target: "POOL:MAPLE-SR", amount: "+$1,247.80", code: "OK" },
  { time: "21:44:18", action: "POSITION_OPENED", target: "ASSET:UST-6M", amount: "$50,000.00", code: "OK" },
  { time: "21:43:01", action: "REBALANCE", target: "STRATEGY:AUTO", amount: "3 ASSETS", code: "PENDING" },
  { time: "21:41:55", action: "YIELD_ACCRUED", target: "POOL:GOLDFINCH", amount: "+$89.42", code: "OK" },
  { time: "21:40:22", action: "PRICE_UPDATE", target: "ORACLE:CHAINLINK", amount: "6 FEEDS", code: "OK" },
  { time: "21:38:47", action: "AUDIT_PASS", target: "CONTRACT:VAULT", amount: "SCORE:98", code: "OK" },
] as const;

function ActivityLog() {
  const [entries, setEntries] = useState<boolean[]>(new Array(LOG_ENTRIES.length).fill(false));

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    LOG_ENTRIES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setEntries((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 2600 + i * 300)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: C.textDim,
          marginBottom: 8,
          letterSpacing: "0.04em",
        }}
      >
        {">"} FEED.STREAM --tail --follow --format=dossier
      </div>

      {LOG_ENTRIES.map((entry, i) => {
        if (!entries[i]) return null;

        const isPositive = entry.amount.startsWith("+");
        const actionColor =
          entry.action === "REBALANCE" ? C.amberDim :
          entry.action === "AUDIT_PASS" ? C.amberBright :
          C.amber;

        return (
          <div
            key={i}
            className="amber-log-entry"
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              lineHeight: "20px",
              color: C.textSecondary,
              display: "flex",
              gap: 8,
              padding: "2px 0",
            }}
          >
            <span style={{ color: C.textDim }}>[{entry.time}]</span>
            <span style={{ color: actionColor, minWidth: 120, display: "inline-block" }}>
              {entry.action}
            </span>
            <span style={{ color: C.textDim, minWidth: 130, display: "inline-block" }}>
              {entry.target}
            </span>
            <span
              style={{
                color: isPositive ? C.amberBright : C.textSecondary,
                fontWeight: isPositive ? 600 : 400,
                minWidth: 90,
                display: "inline-block",
                textAlign: "right",
              }}
            >
              {entry.amount}
            </span>
            <span
              style={{
                color: entry.code === "OK" ? C.amberDim : C.textDim,
                fontSize: 10,
              }}
            >
              [{entry.code}]
            </span>
          </div>
        );
      })}

      {entries[entries.length - 1] && (
        <div
          style={{
            marginTop: 6,
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: C.textDim,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="amber-cursor-blink" style={{ display: "inline-block", width: 6, height: 12, background: C.amber }} />
          <span>AWAITING FURTHER INTELLIGENCE...</span>
        </div>
      )}
    </div>
  );
}
