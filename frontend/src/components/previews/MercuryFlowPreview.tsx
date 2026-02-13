"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT = "'Instrument Sans', system-ui, -apple-system, sans-serif";

const C = {
  bg: "#08080C",
  surface: "#0F0F15",
  surfaceElevated: "#16161F",
  chromeSilver: "#C0C0C0",
  chromeBright: "#E8E8E8",
  chromeDark: "#6B6B7B",
  electricBlue: "#3B82F6",
  blueGlow: "rgba(59,130,246,0.15)",
  textPrimary: "#E8E8E8",
  textSecondary: "#6B6B7B",
  textDim: "#3D3D4A",
  success: "#E8E8E8",
  danger: "#EF4444",
  border: "rgba(192,192,192,0.08)",
};

const MERCURY_GRADIENT =
  "linear-gradient(135deg, #6B6B7B, #C0C0C0, #E8E8E8, #C0C0C0, #6B6B7B)";

const MERCURY_FLOW_GRADIENT =
  "linear-gradient(90deg, #3D3D4A, #6B6B7B, #C0C0C0, #E8E8E8, #C0C0C0, #6B6B7B, #3D3D4A)";

const LIQUID_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const CHART_DATA = [
  38, 41, 39, 44, 48, 46, 52, 55, 53, 58,
  62, 59, 65, 68, 66, 72, 75, 73, 79, 82,
  80, 85, 88, 86, 91, 94, 92, 97, 100, 98,
];

const STATS = [
  { label: "APY", value: "8.24%", change: "+0.41%", positive: true },
  { label: "TVL", value: "$84.6M", change: "+$3.2M", positive: true },
  { label: "Positions", value: "18", change: "+3", positive: true },
  { label: "Monthly Yield", value: "$6,412", change: "+$890", positive: true },
];

const ALLOCATIONS = [
  { label: "Stablecoins", pct: 30, phase: 0 },
  { label: "Blue Chips", pct: 25, phase: 1 },
  { label: "Real-World Assets", pct: 22, phase: 2 },
  { label: "DeFi Yield", pct: 15, phase: 3 },
  { label: "Liquid Staking", pct: 8, phase: 4 },
];

const TABLE_ROWS = [
  { asset: "USDC Vault", protocol: "Aave V3", apy: "6.84%", value: "$412,800", status: "active" },
  { asset: "ETH Staking", protocol: "Lido", apy: "4.21%", value: "$346,714", status: "active" },
  { asset: "T-Bill Token", protocol: "OpenEden", apy: "5.12%", value: "$289,400", status: "active" },
  { asset: "BTC Yield", protocol: "Babylon", apy: "3.47%", value: "$201,553", status: "pending" },
  { asset: "AVAX LP", protocol: "Trader Joe", apy: "12.3%", value: "$154,290", status: "active" },
  { asset: "GLP Vault", protocol: "GMX", apy: "8.96%", value: "$98,133", status: "paused" },
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
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

function useStaggeredVisible(count: number, baseDelay: number = 70) {
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
// Background: Chrome blobs
// ---------------------------------------------------------------------------

function ChromeBackground() {
  const blobs = useMemo(
    () => [
      { top: "-8%", left: "20%", size: 380, opacity: 0.03, speed: 22 },
      { top: "45%", left: "70%", size: 320, opacity: 0.025, speed: 28 },
      { top: "75%", left: "5%", size: 280, opacity: 0.02, speed: 34 },
    ],
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="mercury-blob"
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(192,192,192,${b.opacity}) 0%, rgba(107,107,123,${b.opacity * 0.4}) 40%, transparent 70%)`,
            filter: "blur(80px)",
            animation: `mercuryBlobDrift ${b.speed}s ease-in-out infinite`,
            animationDelay: `${i * -5}s`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mercury Divider
// ---------------------------------------------------------------------------

function MercuryLine({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="mercury-line"
      style={{
        height: 1,
        background: MERCURY_FLOW_GRADIENT,
        backgroundSize: "300% 100%",
        animation: "mercuryFlow 8s ease infinite",
        opacity: 0.3,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Mercury Card
// ---------------------------------------------------------------------------

function MercuryCard({
  children,
  style,
  visible = true,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  visible?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="mercury-card"
      style={{
        position: "relative",
        background: C.surface,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `all 600ms ${LIQUID_EASE}`,
        transitionDelay: `${delay}ms`,
        boxShadow: `0 8px 32px rgba(59,130,246,0.06)`,
        ...style,
      }}
    >
      {/* Mercury border glow (animated border-image via pseudo-element) */}
      <div
        className="mercury-card-border"
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: 13,
          padding: 1,
          background: MERCURY_FLOW_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "mercuryFlow 8s ease infinite",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0.2,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Chrome highlight at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(232,232,232,0.12), transparent)",
          zIndex: 2,
        }}
      />

      {/* Chrome reflection at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "15%",
          right: "15%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(192,192,192,0.06), transparent)",
          zIndex: 2,
        }}
      />

      {/* Mercury shimmer overlay */}
      <div className="mercury-shimmer" />

      <div style={{ position: "relative", zIndex: 3 }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function MercuryHeader({ visible }: { visible: boolean }) {
  const navItems = ["Overview", "Positions", "Yield", "Analytics"];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 0 20px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
        transition: `all 500ms ${LIQUID_EASE}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ position: "relative" }}>
          <span
            className="mercury-text-flow"
            style={{
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.25em",
              background: MERCURY_FLOW_GRADIENT,
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "mercuryFlow 8s ease infinite",
            }}
          >
            MERCURY
          </span>
          {/* Flowing mercury underline */}
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: 0,
              right: 0,
              height: 1,
              background: MERCURY_FLOW_GRADIENT,
              backgroundSize: "300% 100%",
              animation: "mercuryFlow 6s ease infinite",
              opacity: 0.5,
            }}
          />
        </div>

        <nav style={{ display: "flex", gap: 24 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "" : "mercury-nav-item"}
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? C.chromeBright : C.chromeDark,
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

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 500,
            color: C.textDim,
            letterSpacing: "0.06em",
            padding: "4px 10px",
            borderRadius: 6,
            background: "rgba(192,192,192,0.04)",
            border: `1px solid ${C.border}`,
          }}
        >
          Avalanche
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            className="mercury-pulse-indicator"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.electricBlue,
              boxShadow: `0 0 8px ${C.blueGlow}`,
            }}
          />
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.chromeDark }}>
            0x7a3...f19d
          </span>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroValue({ value, visible }: { value: string; visible: boolean }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 0 44px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `all 700ms ${LIQUID_EASE}`,
      }}
    >
      <p
        style={{
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: C.chromeDark,
          marginBottom: 16,
        }}
      >
        Portfolio Value
      </p>
      <p
        className="mercury-hero-value"
        style={{
          fontFamily: FONT,
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: 18,
          background: MERCURY_FLOW_GRADIENT,
          backgroundSize: "300% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "mercuryFlow 8s ease infinite",
        }}
      >
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.chromeBright }}>
          +12.4% All Time
        </span>
        <span style={{ color: C.textDim }}>|</span>
        <span style={{ fontFamily: FONT, fontSize: 13, color: C.chromeDark }}>
          +$271,430 unrealized
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Cards
// ---------------------------------------------------------------------------

function StatCards({ visible }: { visible: boolean[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        padding: "8px 0 28px",
      }}
    >
      {STATS.map((stat, i) => (
        <MercuryCard key={stat.label} visible={visible[i]} delay={i * 60}>
          <div style={{ padding: "20px 22px" }}>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 500,
                color: C.chromeDark,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 24,
                fontWeight: 700,
                color: C.chromeBright,
                marginBottom: 8,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.value}
            </p>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 500,
                color: stat.positive ? C.success : C.danger,
              }}
            >
              {stat.change}
            </span>
            {/* Electric blue accent line */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "20%",
                right: "20%",
                height: 2,
                background: `linear-gradient(90deg, transparent, ${C.electricBlue}, transparent)`,
                opacity: 0.4,
                borderRadius: 1,
              }}
            />
          </div>
        </MercuryCard>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area Chart
// ---------------------------------------------------------------------------

function MercuryChart({ visible }: { visible: boolean }) {
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

  const gridFractions = [0.25, 0.5, 0.75];
  const yLabels = ["$100K", "$80K", "$60K", "$40K"];

  return (
    <div
      style={{
        padding: "28px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `all 600ms ${LIQUID_EASE}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.chromeBright, letterSpacing: "0.02em" }}>
          Performance
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          {["1W", "1M", "3M", "1Y", "ALL"].map((period, i) => (
            <span
              key={period}
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 500,
                color: i === 3 ? C.chromeBright : C.chromeDark,
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 6,
                background: i === 3 ? "rgba(192,192,192,0.08)" : "transparent",
                border: i === 3 ? `1px solid ${C.border}` : "1px solid transparent",
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
        <div
          style={{
            position: "absolute",
            left: -48,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {yLabels.map((l) => (
            <span key={l} style={{ fontFamily: FONT, fontSize: 10, color: C.textDim }}>
              {l}
            </span>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", marginLeft: 4 }}>
          <defs>
            <linearGradient id="mercury-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.chromeSilver} stopOpacity="0.12" />
              <stop offset="40%" stopColor={C.chromeDark} stopOpacity="0.04" />
              <stop offset="100%" stopColor={C.chromeDark} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mercury-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.chromeDark} />
              <stop offset="50%" stopColor={C.electricBlue} />
              <stop offset="100%" stopColor={C.chromeBright} />
            </linearGradient>
            <filter id="mercury-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {gridFractions.map((frac) => (
            <line
              key={frac}
              x1={0}
              y1={padY + frac * (height - padY * 2)}
              x2={width}
              y2={padY + frac * (height - padY * 2)}
              stroke={C.textDim}
              strokeOpacity="0.15"
              strokeDasharray="4 8"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#mercury-area-fill)" className="mercury-area-animate" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#mercury-line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#mercury-glow)"
            className="mercury-line-animate"
          />

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={C.electricBlue}
            className="mercury-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill="none"
            stroke={C.electricBlue}
            strokeWidth="1"
            opacity="0.3"
            className="mercury-pulse-ring"
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
  const phaseOffsets = [0, 0.5, 1.0, 1.5, 2.0];

  return (
    <div
      style={{
        padding: "28px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `all 500ms ${LIQUID_EASE}`,
      }}
    >
      <p
        style={{
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 600,
          color: C.chromeBright,
          letterSpacing: "0.02em",
          marginBottom: 20,
        }}
      >
        Allocation
      </p>

      {/* Stacked bar */}
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {ALLOCATIONS.map((a, i) => (
          <div
            key={a.label}
            className="mercury-alloc-segment"
            style={{
              width: `${a.pct}%`,
              background: MERCURY_FLOW_GRADIENT,
              backgroundSize: "300% 100%",
              animation: "mercuryFlow 8s ease infinite",
              animationDelay: `${phaseOffsets[i]}s`,
              opacity: 0.3 + i * 0.15,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {ALLOCATIONS.map((a, i) => (
          <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: MERCURY_FLOW_GRADIENT,
                backgroundSize: "300% 100%",
                animation: "mercuryFlow 8s ease infinite",
                animationDelay: `${phaseOffsets[i]}s`,
                opacity: 0.3 + i * 0.15,
              }}
            />
            <span style={{ fontFamily: FONT, fontSize: 12, color: C.chromeDark }}>
              {a.label}
            </span>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.chromeBright }}>
              {a.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Dot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const isActive = status === "active";
  const isPending = status === "pending";
  const color = isActive ? C.electricBlue : isPending ? C.chromeSilver : C.textDim;

  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        boxShadow: isActive ? `0 0 8px ${C.blueGlow}` : "none",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Data Table
// ---------------------------------------------------------------------------

function DataTable({ visible }: { visible: boolean[] }) {
  const headers = ["Asset", "Protocol", "APY", "Value", "Status"];

  return (
    <div style={{ padding: "28px 0" }}>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 600,
          color: C.chromeBright,
          letterSpacing: "0.02em",
          marginBottom: 20,
        }}
      >
        Active Positions
      </p>

      {/* Header row with mercury gradient underline */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 0.6fr",
          padding: "0 0 12px",
          position: "relative",
        }}
      >
        {headers.map((h) => (
          <span
            key={h}
            style={{
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 500,
              color: C.textDim,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {h}
          </span>
        ))}
        {/* Mercury gradient header underline */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: MERCURY_FLOW_GRADIENT,
            backgroundSize: "300% 100%",
            animation: "mercuryFlow 8s ease infinite",
            opacity: 0.25,
          }}
        />
      </div>

      {/* Rows */}
      {TABLE_ROWS.map((row, i) => (
        <div
          key={row.asset}
          className="mercury-table-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 0.6fr",
            padding: "14px 0",
            alignItems: "center",
            borderBottom: `1px solid ${C.border}`,
            opacity: visible[i] ? 1 : 0,
            transform: visible[i] ? "translateX(0)" : "translateX(-10px)",
            transition: `all 400ms ${LIQUID_EASE}`,
            transitionDelay: `${i * 50}ms`,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.chromeBright }}>
            {row.asset}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 13, color: C.chromeDark }}>
            {row.protocol}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.electricBlue }}>
            {row.apy}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: C.chromeBright,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.value}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusDot status={row.status} />
            <span
              style={{
                fontFamily: FONT,
                fontSize: 12,
                color: C.chromeDark,
                textTransform: "capitalize",
              }}
            >
              {row.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mercury Progress Ring (with flowing gradient stroke)
// ---------------------------------------------------------------------------

function MercuryRing({
  pct,
  size = 56,
  strokeWidth = 4,
  index = 0,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
  index?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const gradientId = `mercury-ring-grad-${index}`;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.textDim}>
            <animate
              attributeName="stop-color"
              values={`${C.textDim};${C.chromeDark};${C.chromeSilver};${C.chromeBright};${C.chromeSilver};${C.chromeDark};${C.textDim}`}
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor={C.chromeSilver}>
            <animate
              attributeName="stop-color"
              values={`${C.chromeSilver};${C.chromeBright};${C.chromeSilver};${C.chromeDark};${C.textDim};${C.chromeDark};${C.chromeSilver}`}
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor={C.chromeBright}>
            <animate
              attributeName="stop-color"
              values={`${C.chromeBright};${C.chromeSilver};${C.chromeDark};${C.textDim};${C.chromeDark};${C.chromeSilver};${C.chromeBright}`}
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(192,192,192,0.05)"
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
        className="mercury-ring-animate"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Bottom Metrics
// ---------------------------------------------------------------------------

function BottomMetricsRow({ visible }: { visible: boolean[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        padding: "28px 0 48px",
      }}
    >
      {BOTTOM_METRICS.map((m, i) => (
        <MercuryCard key={m.label} visible={visible[i]} delay={i * 80}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px 24px",
            }}
          >
            <MercuryRing pct={m.pct} index={i} />
            <div>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.chromeDark,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {m.label}
              </p>
              <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.chromeBright }}>
                {m.value}
              </p>
            </div>
          </div>
        </MercuryCard>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reflective Floor
// ---------------------------------------------------------------------------

function ReflectiveFloor() {
  return (
    <div
      style={{
        position: "relative",
        height: 200,
        overflow: "hidden",
        pointerEvents: "none",
        marginTop: -20,
      }}
    >
      {/* Mirror reflection of bottom content */}
      <div
        style={{
          transform: "scaleY(-1)",
          opacity: 0.04,
          filter: "blur(2px)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 60%)",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 60%)",
        }}
      >
        {/* Simulated reflection content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            padding: "0 0 28px",
          }}
        >
          {BOTTOM_METRICS.map((m) => (
            <div
              key={m.label}
              style={{
                background: C.surface,
                borderRadius: 12,
                padding: "20px 24px",
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: `conic-gradient(${C.chromeSilver} ${m.pct}%, transparent ${m.pct}%)`,
                    opacity: 0.3,
                  }}
                />
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 11, color: C.chromeDark }}>{m.label}</p>
                  <p style={{ fontFamily: FONT, fontSize: 22, color: C.chromeBright }}>{m.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient fade to background */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: `linear-gradient(to top, ${C.bg}, transparent)`,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MercuryFlowPreview() {
  useFonts();
  const portfolioRaw = useCountUp(2456890, 2600);
  const staggered = useStaggeredVisible(20, 70);

  const portfolioFormatted = "$" + portfolioRaw.toLocaleString("en-US");

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: FONT,
        color: C.textPrimary,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        /* ------------------------------------------------------------ */
        /* Mercury Flow Keyframes                                        */
        /* ------------------------------------------------------------ */

        @keyframes mercuryFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes mercuryBlobDrift {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25% { transform: translate(20px, -15px) scale(1.06) rotate(2deg); }
          50% { transform: translate(-10px, 20px) scale(0.94) rotate(-1deg); }
          75% { transform: translate(15px, 10px) scale(1.03) rotate(1deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }

        @keyframes mercuryPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes mercuryPulseRing {
          0% { r: 4; opacity: 0.4; }
          100% { r: 18; opacity: 0; }
        }

        @keyframes mercuryLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes mercuryAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes mercuryRingReveal {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: inherit; }
        }

        @keyframes mercuryShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes mercuryIndicatorPulse {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 4px ${C.blueGlow}; }
          50% { opacity: 1; box-shadow: 0 0 12px ${C.blueGlow}; }
        }

        /* ------------------------------------------------------------ */
        /* Element Styles                                                */
        /* ------------------------------------------------------------ */

        .mercury-nav-item:hover {
          color: ${C.chromeBright} !important;
        }

        .mercury-card {
          transition: all 0.35s ${LIQUID_EASE};
        }

        .mercury-card:hover {
          border-color: rgba(192,192,192,0.15) !important;
          box-shadow: 0 12px 40px rgba(59,130,246,0.08) !important;
          transform: translateY(-2px) !important;
        }

        .mercury-card:hover .mercury-card-border {
          opacity: 0.45 !important;
          animation-duration: 3s !important;
        }

        .mercury-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: 12px;
          z-index: 2;
        }

        .mercury-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(192,192,192,0.02) 40%,
            rgba(232,232,232,0.04) 50%,
            rgba(192,192,192,0.02) 60%,
            transparent 100%
          );
          animation: mercuryShimmer 6s ease-in-out infinite;
        }

        .mercury-pulse-dot {
          animation: mercuryPulse 2s ease-in-out infinite;
        }

        .mercury-pulse-ring {
          animation: mercuryPulseRing 2s ease-out infinite;
        }

        .mercury-pulse-indicator {
          animation: mercuryIndicatorPulse 2.5s ease-in-out infinite;
        }

        .mercury-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: mercuryLineReveal 2s ${LIQUID_EASE} 0.3s forwards;
        }

        .mercury-area-animate {
          opacity: 0;
          animation: mercuryAreaReveal 1s ease 1.4s forwards;
        }

        .mercury-ring-animate {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: mercuryRingReveal 1.4s ${LIQUID_EASE} 0.5s forwards;
        }

        .mercury-table-row {
          transition: background 0.2s ease;
        }

        .mercury-table-row:hover {
          background: rgba(192,192,192,0.03);
        }

        .mercury-alloc-segment + .mercury-alloc-segment {
          border-left: 1px solid rgba(8,8,12,0.5);
        }

        .mercury-line {
          border: none;
        }

        /* Scrollbar */
        *::-webkit-scrollbar {
          width: 4px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(192,192,192,0.08);
          border-radius: 2px;
        }
      `}</style>

      {/* Background */}
      <ChromeBackground />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 920,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        {/* Header */}
        <MercuryHeader visible={staggered[0]} />
        <MercuryLine />

        {/* Hero */}
        <HeroValue value={portfolioFormatted} visible={staggered[1]} />
        <MercuryLine style={{ opacity: 0.15 }} />

        {/* Stat Cards */}
        <StatCards visible={[staggered[2], staggered[3], staggered[4], staggered[5]]} />
        <MercuryLine style={{ opacity: 0.15 }} />

        {/* Chart */}
        <MercuryChart visible={staggered[6]} />
        <MercuryLine style={{ opacity: 0.15 }} />

        {/* Allocation */}
        <AllocationBar visible={staggered[7]} />
        <MercuryLine style={{ opacity: 0.15 }} />

        {/* Table */}
        <DataTable
          visible={[
            staggered[8],
            staggered[9],
            staggered[10],
            staggered[11],
            staggered[12],
            staggered[13],
          ]}
        />
        <MercuryLine style={{ opacity: 0.15 }} />

        {/* Bottom Metrics */}
        <BottomMetricsRow visible={[staggered[14], staggered[15], staggered[16]]} />

        {/* Reflective Floor */}
        <ReflectiveFloor />
      </div>
    </div>
  );
}
