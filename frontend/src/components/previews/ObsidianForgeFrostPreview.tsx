"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#040810",
  surface: "rgba(8, 16, 32, 0.65)",
  surfaceElevated: "rgba(12, 22, 44, 0.55)",
  frostWhite: "#F0F9FF",
  iceBlue: "#7DD3FC",
  sapphire: "#1E40AF",
  frozenSilver: "#CBD5E1",
  glacialTeal: "#06B6D4",
  textPrimary: "#E2E8F0",
  textSecondary: "#7B8BA4",
  textDim: "#3E4E68",
  success: "#06B6D4",
  danger: "#EF4444",
  warning: "#F59E0B",
  border: "rgba(240,249,255,0.08)",
  borderHover: "rgba(125,211,252,0.3)",
} as const;

const IRIDESCENT_GRADIENT =
  "linear-gradient(135deg, #7DD3FC, #CBD5E1, #1E40AF, #F0F9FF, #7DD3FC)";

const IRIDESCENT_TEXT_GRADIENT =
  "linear-gradient(135deg, #7DD3FC 0%, #CBD5E1 25%, #1E40AF 50%, #F0F9FF 75%, #7DD3FC 100%)";

const CRYSTALLINE_GRADIENT =
  "linear-gradient(135deg, #7DD3FC, #F0F9FF, #1E40AF, #CBD5E1, #7DD3FC)";

const FONT_HEADING = "'Inter', system-ui, -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace";

const ENTRANCE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const STAGGER_MS = 70;

const CHART_DATA = [
  38, 42, 40, 46, 50, 48, 53, 57, 54, 60,
  64, 62, 67, 71, 68, 74, 78, 76, 82, 86,
  84, 89, 93, 91, 96, 100, 98, 104, 108, 112,
];

const DONUT_SEGMENTS = [
  { label: "Tokenized Bonds", value: 32, hueOffset: 0 },
  { label: "Private Credit", value: 24, hueOffset: 40 },
  { label: "Commodity Vaults", value: 22, hueOffset: 120 },
  { label: "Real Estate", value: 14, hueOffset: 200 },
  { label: "Liquid Staking", value: 8, hueOffset: 280 },
];

const SPARKLINE_DATA = [
  [4, 6, 5, 8, 7, 9, 11, 10, 13, 12, 15, 14],
  [10, 9, 11, 13, 12, 14, 13, 15, 17, 16, 18, 20],
  [6, 8, 7, 9, 11, 10, 12, 14, 13, 16, 15, 18],
  [3, 5, 4, 7, 6, 8, 10, 9, 12, 11, 14, 16],
];

const HOLDINGS_DATA = [
  { asset: "US Treasury 6M", protocol: "OpenEden", apy: "5.12%", value: "$520,000", maturity: "Aug 2026", status: "Active" as const },
  { asset: "Maple Credit Pool", protocol: "Maple Finance", apy: "8.74%", value: "$415,000", maturity: "Open-End", status: "Active" as const },
  { asset: "Gold Bullion Vault", protocol: "Paxos", apy: "2.85%", value: "$380,000", maturity: "N/A", status: "Active" as const },
  { asset: "Corp Bond AA+", protocol: "Backed Finance", apy: "6.35%", value: "$310,000", maturity: "Mar 2027", status: "Active" as const },
  { asset: "RE Income Trust", protocol: "RealT", apy: "7.20%", value: "$275,000", maturity: "Dec 2026", status: "Maturing" as const },
  { asset: "ETH Staking", protocol: "Lido", apy: "4.21%", value: "$198,000", maturity: "N/A", status: "Active" as const },
  { asset: "AVAX LP Yield", protocol: "Trader Joe", apy: "12.30%", value: "$154,290", maturity: "Rolling", status: "Pending" as const },
];

const STAT_METRICS = [
  { label: "Total Yield", suffix: "/mo", detail: "This month" },
  { label: "Active Positions", detail: "Across 6 protocols" },
  { label: "Avg APY", detail: "Weighted average" },
  { label: "Risk Score", detail: "Conservative profile" },
];

const FOOTER_GAUGES = [
  { label: "Liquidity Ratio", value: 78, suffix: "%" },
  { label: "Diversification", value: 94, suffix: "%" },
  { label: "Yield Efficiency", value: 87, suffix: "%" },
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
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
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
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

function useStaggeredVisible(count: number, baseDelay: number = STAGGER_MS) {
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
// Iridescent Text -- crystalline gradient text
// ---------------------------------------------------------------------------

function CrystallineText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        background: IRIDESCENT_TEXT_GRADIENT,
        backgroundSize: "300% 300%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "frostGradientShift 10s linear infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Frost Crystal Icon SVG -- brand mark
// ---------------------------------------------------------------------------

function CrystalIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.iceBlue}
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      {/* Hexagonal crystal structure */}
      <path
        d="M12 3 L17 7.5 L17 16.5 L12 21 L7 16.5 L7 7.5 Z"
        stroke={COLORS.iceBlue}
        strokeWidth="0.8"
        strokeOpacity="0.5"
        fill={COLORS.iceBlue}
        fillOpacity="0.06"
      />
      {/* Inner crystal facets */}
      <path
        d="M12 3 L12 21 M7 7.5 L17 16.5 M17 7.5 L7 16.5"
        stroke={COLORS.frozenSilver}
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />
      {/* Center frost point */}
      <circle cx="12" cy="12" r="2" fill={COLORS.frostWhite} fillOpacity="0.2" />
      <circle cx="12" cy="12" r="0.8" fill={COLORS.iceBlue} fillOpacity="0.8" />
      {/* Crystal spikes */}
      <line x1="12" y1="8" x2="12" y2="5" stroke={COLORS.glacialTeal} strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="15" y1="10" x2="17.5" y2="8.5" stroke={COLORS.iceBlue} strokeWidth="0.6" strokeOpacity="0.4" />
      <line x1="9" y1="10" x2="6.5" y2="8.5" stroke={COLORS.frozenSilver} strokeWidth="0.6" strokeOpacity="0.4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Frost Divider
// ---------------------------------------------------------------------------

function FrostDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: IRIDESCENT_GRADIENT,
        backgroundSize: "300% 100%",
        animation: "frostGradientShift 10s linear infinite",
        opacity: 0.2,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Ice Particle System -- falling ice crystals
// ---------------------------------------------------------------------------

function IceParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2.5,
        opacity: 0.15 + Math.random() * 0.35,
        duration: 12 + Math.random() * 20,
        delay: Math.random() * -30,
        drift: -15 + Math.random() * 30,
      })),
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {particles.map((p, i) => (
        <div
          key={i}
          className="frost-particle"
          style={{
            position: "absolute",
            top: "-4%",
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: COLORS.frostWhite,
            opacity: p.opacity,
            animation: `frostParticleFall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Background: Ice crystal hex patterns + frozen ambient glow
// ---------------------------------------------------------------------------

function FrostBackground() {
  const glows = useMemo(
    () => [
      { top: "-10%", left: "15%", size: 500, opacity: 0.025, speed: 16 },
      { top: "30%", left: "70%", size: 420, opacity: 0.02, speed: 22 },
      { top: "60%", left: "5%", size: 380, opacity: 0.018, speed: 28 },
      { top: "80%", left: "55%", size: 320, opacity: 0.015, speed: 20 },
    ],
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {/* Ambient frost glows */}
      {glows.map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: g.top,
            left: g.left,
            width: g.size,
            height: g.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(125,211,252,${g.opacity}) 0%, rgba(30,64,175,${g.opacity * 0.7}) 25%, rgba(6,182,212,${g.opacity * 0.4}) 50%, transparent 70%)`,
            filter: "blur(90px)",
            animation: `frostBlobDrift 22s ease-in-out infinite, frostHueShift ${g.speed}s linear infinite`,
            animationDelay: `${i * -5}s`,
          }}
        />
      ))}

      {/* Hexagonal ice crystal grid pattern */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.025,
          animation: "frostCrystalRotate 120s linear infinite",
        }}
      >
        <defs>
          <pattern id="frost-hex-pattern" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
            <path
              d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z"
              fill="none"
              stroke={COLORS.iceBlue}
              strokeWidth="0.5"
              strokeOpacity="0.6"
            />
            <path
              d="M30 10 L50 20 L50 32 L30 42 L10 32 L10 20 Z"
              fill="none"
              stroke={COLORS.frozenSilver}
              strokeWidth="0.3"
              strokeOpacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#frost-hex-pattern)" />
      </svg>

      {/* Subtle frozen noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function FrostHeader() {
  const navItems = ["Overview", "Holdings", "Yield", "Analytics"];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 0",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CrystalIcon size={24} />
          <span
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "0.24em",
              background: IRIDESCENT_TEXT_GRADIENT,
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "frostGradientShift 10s linear infinite",
            }}
          >
            OBSIDIAN FORGE
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 9,
              fontWeight: 400,
              letterSpacing: "0.18em",
              color: COLORS.iceBlue,
              opacity: 0.6,
              textTransform: "uppercase",
              marginLeft: -4,
              marginTop: 2,
            }}
          >
            : FROST
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "" : "frost-nav-item"}
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 13,
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? COLORS.textPrimary : COLORS.textDim,
                cursor: "pointer",
                letterSpacing: "0.03em",
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
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.textDim,
            letterSpacing: "0.04em",
          }}
        >
          0x7a3...f19d
        </span>
        <div
          className="frost-avatar"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(125,211,252,0.04)",
            border: `1px solid ${COLORS.border}`,
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
        >
          <span
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.iceBlue,
            }}
          >
            OF
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
      className="frost-fadeIn"
      style={{
        textAlign: "center",
        padding: "44px 0 52px",
        position: "relative",
      }}
    >
      <p
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: COLORS.textSecondary,
          marginBottom: 16,
        }}
      >
        Portfolio Value
      </p>
      <p
        className="frost-hero-value"
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 54,
          fontWeight: 800,
          lineHeight: 1,
          marginBottom: 18,
          letterSpacing: "-0.01em",
          background: IRIDESCENT_TEXT_GRADIENT,
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "frostGradientShift 10s linear infinite",
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
        <CrystallineText
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          +16.8% All Time
        </CrystallineText>
        <span style={{ color: COLORS.textDim }}>|</span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: COLORS.textSecondary,
          }}
        >
          +$452,290 unrealized
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Frosted Glass Card -- extra blur, crystalline edges
// ---------------------------------------------------------------------------

function FrostCard({
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
      className="frost-fadeIn frost-shimmer frost-card"
      style={{
        animationDelay: `${delay}ms`,
        background: COLORS.surface,
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderRadius: 12,
        padding: 28,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
        ...style,
      }}
    >
      {/* Top crystalline edge highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: CRYSTALLINE_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "frostGradientShift 10s linear infinite",
          opacity: 0.35,
        }}
      />
      {/* Left crystalline edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 1,
          background: `linear-gradient(180deg, rgba(125,211,252,0.15) 0%, transparent 50%, rgba(6,182,212,0.08) 100%)`,
        }}
      />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Cards Row
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  detail,
  sparkData,
  delay = 0,
}: {
  label: string;
  value: string;
  detail: string;
  sparkData: number[];
  delay?: number;
}) {
  const min = Math.min(...sparkData);
  const max = Math.max(...sparkData);
  const range = max - min || 1;
  const w = 60;
  const h = 20;

  const sparkPath = sparkData
    .map((v, i) => {
      const x = (i / (sparkData.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div
      className="frost-fadeIn frost-shimmer frost-card"
      style={{
        animationDelay: `${delay}ms`,
        background: COLORS.surface,
        backdropFilter: "blur(16px) saturate(1.1)",
        WebkitBackdropFilter: "blur(16px) saturate(1.1)",
        borderRadius: 10,
        padding: "22px 22px 18px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Top crystalline edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: CRYSTALLINE_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "frostGradientShift 10s linear infinite",
          opacity: 0.25,
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: COLORS.textDim,
              marginBottom: 10,
            }}
          >
            {label}
          </p>
          <CrystallineText
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.1,
              display: "block",
              letterSpacing: "-0.01em",
            }}
          >
            {value}
          </CrystallineText>
        </div>

        {/* Mini sparkline */}
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ marginTop: 8, flexShrink: 0 }}>
          <defs>
            <linearGradient id={`frost-spark-${label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.sapphire} stopOpacity="0.5" />
              <stop offset="50%" stopColor={COLORS.iceBlue} stopOpacity="0.9" />
              <stop offset="100%" stopColor={COLORS.glacialTeal} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d={sparkPath}
            fill="none"
            stroke={`url(#frost-spark-${label})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
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
// SVG Area Chart -- glacial gradient fill
// ---------------------------------------------------------------------------

function FrostAreaChart({ visible }: { visible: boolean }) {
  const width = 540;
  const height = 160;
  const padTop = 14;
  const padBottom = 14;
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

  const gridFracs = [0.25, 0.5, 0.75];
  const yLabels = ["$112K", "$92K", "$72K", "$52K"];
  const [activePeriod, setActivePeriod] = useState(3);
  const periods = ["1W", "1M", "3M", "1Y", "ALL"];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
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
            fontFamily: FONT_HEADING,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.16em",
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
                fontFamily: FONT_MONO,
                fontSize: 10,
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: i === activePeriod ? "rgba(125,211,252,0.08)" : "transparent",
                color: i === activePeriod ? COLORS.iceBlue : COLORS.textDim,
              }}
            >
              {p}
            </button>
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
            <span key={l} style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.textDim }}>
              {l}
            </span>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", marginLeft: 4 }}>
          <defs>
            {/* Glacial area fill: deep sapphire base -> ice blue -> frost white */}
            <linearGradient id="frost-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.sapphire} stopOpacity="0.22" />
              <stop offset="35%" stopColor={COLORS.iceBlue} stopOpacity="0.10" />
              <stop offset="70%" stopColor={COLORS.frostWhite} stopOpacity="0.04" />
              <stop offset="100%" stopColor={COLORS.glacialTeal} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="frost-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.sapphire} />
              <stop offset="30%" stopColor={COLORS.iceBlue} />
              <stop offset="60%" stopColor={COLORS.frozenSilver} />
              <stop offset="100%" stopColor={COLORS.glacialTeal} />
            </linearGradient>
            <filter id="frost-line-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {gridFracs.map((frac) => {
            const y = padTop + frac * (height - padTop - padBottom);
            return (
              <line
                key={frac}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={COLORS.iceBlue}
                strokeOpacity="0.06"
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#frost-area-fill)" className="frost-area-animate" />

          {/* Line with crystalline gradient */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#frost-line-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#frost-line-glow)"
            className="frost-line-animate"
          />

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3.5"
            fill={COLORS.frostWhite}
            className="frost-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="7"
            fill="none"
            stroke={COLORS.iceBlue}
            strokeWidth="1"
            opacity="0.3"
            className="frost-pulse-ring"
          />
        </svg>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.textDim }}>
          Feb 2025
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.textDim }}>
          Feb 2026
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart -- crystalline segments
// ---------------------------------------------------------------------------

function FrostDonutChart({ visible }: { visible: boolean }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <svg viewBox="0 0 120 120" style={{ width: 140, height: 140, flexShrink: 0 }}>
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(125,211,252,0.04)"
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
              stroke={COLORS.iceBlue}
              strokeWidth="13"
              strokeDasharray={`${strokeLen - 2} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                filter: `hue-rotate(${seg.hueOffset}deg)`,
                transition: "stroke-dasharray 0.8s ease",
              }}
            />
          );
        })}
        {/* Center label */}
        <text
          x="60"
          y="57"
          textAnchor="middle"
          style={{
            fontFamily: FONT_HEADING,
            fontSize: 18,
            fontWeight: 700,
            fill: COLORS.textPrimary,
          }}
        >
          5
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          style={{
            fontFamily: FONT_MONO,
            fontSize: 7,
            fill: COLORS.textDim,
            letterSpacing: "0.14em",
          }}
        >
          CLASSES
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DONUT_SEGMENTS.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: IRIDESCENT_GRADIENT,
                backgroundSize: "300% 300%",
                animation: "frostGradientShift 10s linear infinite",
                filter: `hue-rotate(${seg.hueOffset}deg)`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 12,
                color: COLORS.textSecondary,
                minWidth: 110,
              }}
            >
              {seg.label}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
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
// Allocation Bar -- stacked crystalline segments
// ---------------------------------------------------------------------------

function AllocationBar({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        padding: "24px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <p
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.textDim,
          marginBottom: 16,
        }}
      >
        Allocation
      </p>

      <div
        style={{
          display: "flex",
          height: 6,
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {DONUT_SEGMENTS.map((seg, i) => (
          <div
            key={i}
            style={{
              width: `${seg.value}%`,
              background: IRIDESCENT_GRADIENT,
              backgroundSize: "300% 300%",
              animation: "frostGradientShift 10s linear infinite",
              filter: `hue-rotate(${seg.hueOffset}deg)`,
              borderLeft: i > 0 ? "1px solid rgba(4,8,16,0.6)" : "none",
            }}
          />
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
      return { bg: "rgba(125,211,252,0.08)", color: COLORS.iceBlue };
    case "Maturing":
      return { bg: "rgba(245,158,11,0.08)", color: COLORS.warning };
    case "Pending":
      return { bg: "rgba(6,182,212,0.08)", color: COLORS.glacialTeal };
  }
}

function HoldingsTable({ visible }: { visible: boolean[] }) {
  const headerCols = ["Asset", "Protocol", "Value", "APY", "Maturity", "Status"];

  return (
    <div>
      <h3
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
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
          gridTemplateColumns: "1.5fr 1.1fr 1fr 0.7fr 0.9fr 0.7fr",
          gap: 12,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {headerCols.map((col) => (
          <span
            key={col}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.iceBlue,
              opacity: 0.7,
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
            key={row.asset}
            className="frost-table-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1.1fr 1fr 0.7fr 0.9fr 0.7fr",
              gap: 12,
              padding: "13px 16px",
              alignItems: "center",
              borderRadius: 6,
              background: i % 2 === 1 ? "rgba(125,211,252,0.02)" : "transparent",
              opacity: visible[i] ? 1 : 0,
              transform: visible[i] ? "translateX(0)" : "translateX(-8px)",
              transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: `${i * 50}ms`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontWeight: 500,
              }}
            >
              {row.asset}
            </span>
            <span
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              {row.protocol}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
              }}
            >
              {row.value}
            </span>
            <CrystallineText
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.apy}
            </CrystallineText>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              {row.maturity}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: 20,
                background: statusStyle.bg,
                color: statusStyle.color,
                textAlign: "center",
                width: "fit-content",
              }}
            >
              {row.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Frost Gauge Ring -- frozen gradient strokes
// ---------------------------------------------------------------------------

function FrostGaugeRing({
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
  const gradientId = `frost-gauge-${label.replace(/\s/g, "")}`;

  return (
    <div
      className="frost-fadeIn"
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
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.sapphire} />
            <stop offset="35%" stopColor={COLORS.iceBlue} />
            <stop offset="65%" stopColor={COLORS.frozenSilver} />
            <stop offset="100%" stopColor={COLORS.glacialTeal} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(125,211,252,0.05)"
          strokeWidth="5"
        />
        {/* Value arc */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="5"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          className="frost-ring-animate"
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
            fontFamily: FONT_HEADING,
            fontSize: 16,
            fontWeight: 700,
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
            fontFamily: FONT_MONO,
            fontSize: 8,
            fill: COLORS.textDim,
          }}
        >
          {suffix}
        </text>
      </svg>

      <span
        style={{
          fontFamily: FONT_HEADING,
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
// Yield Breakdown mini cards
// ---------------------------------------------------------------------------

function YieldBreakdown({ visible }: { visible: boolean }) {
  const items = [
    { label: "Bond Coupons", value: "$12,480", pct: "+2.4%" },
    { label: "Credit Interest", value: "$8,720", pct: "+8.7%" },
    { label: "Staking Rewards", value: "$3,140", pct: "+4.2%" },
    { label: "LP Fees", value: "$2,860", pct: "+12.3%" },
  ];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <h3
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.textDim,
          marginBottom: 20,
        }}
      >
        Yield Breakdown
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              padding: "16px 18px",
              borderRadius: 8,
              background: COLORS.surfaceElevated,
              backdropFilter: "blur(12px)",
              border: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "border-color 0.3s ease",
            }}
            className="frost-yield-card"
          >
            <div>
              <p style={{ fontFamily: FONT_HEADING, fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>
                {item.value}
              </p>
            </div>
            <CrystallineText
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {item.pct}
            </CrystallineText>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Protocol Distribution
// ---------------------------------------------------------------------------

function ProtocolDistribution({ visible }: { visible: boolean }) {
  const protocols = [
    { name: "OpenEden", alloc: 28, hue: 0 },
    { name: "Maple Finance", alloc: 22, hue: 40 },
    { name: "Paxos", alloc: 20, hue: 120 },
    { name: "Backed Finance", alloc: 16, hue: 200 },
    { name: "Lido", alloc: 8, hue: 280 },
    { name: "Trader Joe", alloc: 6, hue: 340 },
  ];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <h3
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.textDim,
          marginBottom: 20,
        }}
      >
        Protocol Distribution
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {protocols.map((p) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 12,
                color: COLORS.textSecondary,
                minWidth: 100,
              }}
            >
              {p.name}
            </span>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: "rgba(125,211,252,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.alloc}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: IRIDESCENT_GRADIENT,
                  backgroundSize: "300% 300%",
                  animation: "frostGradientShift 10s linear infinite",
                  filter: `hue-rotate(${p.hue}deg)`,
                  transition: "width 1s ease",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.textDim,
                minWidth: 30,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {p.alloc}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ObsidianForgeFrostPreview() {
  useFonts();

  const portfolioRaw = useCountUp(3252290, 2800);
  const yieldRaw = useCountUp(27200, 2200);
  const apyRaw = useCountUp(684, 2000);

  const formatCurrency = (n: number) => "$" + n.toLocaleString("en-US");
  const portfolioDisplay = formatCurrency(portfolioRaw);
  const yieldDisplay = formatCurrency(yieldRaw);
  const apyDisplay = (apyRaw / 100).toFixed(2) + "%";

  const staggered = useStaggeredVisible(24, STAGGER_MS);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.textPrimary,
        fontFamily: FONT_HEADING,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Keyframes & Interaction Styles                                     */}
      {/* ----------------------------------------------------------------- */}
      <style>{`
        /* --- Crystalline gradient cycling --- */
        @keyframes frostGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* --- Hue shift for frost glows --- */
        @keyframes frostHueShift {
          0% { filter: hue-rotate(0deg) blur(90px); }
          100% { filter: hue-rotate(360deg) blur(90px); }
        }

        /* --- Glow drift --- */
        @keyframes frostBlobDrift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(25px, -18px) scale(1.04); }
          66% { transform: translate(-18px, 22px) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* --- Ice crystal pattern slow rotation --- */
        @keyframes frostCrystalRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* --- Falling ice particle --- */
        @keyframes frostParticleFall {
          0% {
            transform: translateY(-5vh) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) translateX(var(--drift, 0px));
            opacity: 0;
          }
        }

        /* --- Entrance animation --- */
        @keyframes frostFadeIn {
          from {
            opacity: 0;
            transform: translateY(14px);
            filter: brightness(0.85);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: brightness(1);
          }
        }

        .frost-fadeIn {
          animation: frostFadeIn 600ms ${ENTRANCE_EASE} forwards;
          opacity: 0;
        }

        /* --- Frost crackle border glow cycling --- */
        @keyframes frostBorderCrackle {
          0% { border-color: rgba(125,211,252,0.10); box-shadow: 0 0 20px rgba(30,64,175,0.03); }
          25% { border-color: rgba(203,213,225,0.10); box-shadow: 0 0 20px rgba(125,211,252,0.04); }
          50% { border-color: rgba(30,64,175,0.10); box-shadow: 0 0 20px rgba(6,182,212,0.03); }
          75% { border-color: rgba(6,182,212,0.10); box-shadow: 0 0 20px rgba(240,249,255,0.03); }
          100% { border-color: rgba(125,211,252,0.10); box-shadow: 0 0 20px rgba(30,64,175,0.03); }
        }

        .frost-card {
          animation:
            frostFadeIn 600ms ${ENTRANCE_EASE} forwards,
            frostBorderCrackle 12s linear infinite;
        }

        /* --- Frost shimmer sweep --- */
        .frost-shimmer {
          position: relative;
          overflow: hidden;
        }

        .frost-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(125,211,252,0.04) 38%,
            rgba(240,249,255,0.06) 42%,
            rgba(203,213,225,0.05) 46%,
            rgba(6,182,212,0.04) 50%,
            rgba(30,64,175,0.05) 54%,
            rgba(125,211,252,0.04) 58%,
            transparent 66%
          );
          transform: translateX(-100%) translateY(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 2;
        }

        .frost-shimmer:hover::after {
          transform: translateX(30%) translateY(30%);
        }

        /* --- Frost crackling hover --- */
        .frost-shimmer:hover {
          border-color: rgba(125,211,252,0.25) !important;
          box-shadow:
            0 0 1px rgba(125,211,252,0.3),
            0 0 8px rgba(125,211,252,0.08),
            0 16px 48px rgba(30,64,175,0.06),
            0 4px 20px rgba(6,182,212,0.04) !important;
          transform: translateY(-2px);
        }

        /* --- Nav item hover --- */
        .frost-nav-item:hover {
          color: ${COLORS.textPrimary} !important;
        }

        /* --- Avatar hover --- */
        .frost-avatar:hover {
          border-color: rgba(125,211,252,0.35) !important;
          box-shadow: 0 0 14px rgba(125,211,252,0.1);
        }

        /* --- Table row hover --- */
        .frost-table-row {
          transition: background 0.25s ease;
        }

        .frost-table-row:hover {
          background: rgba(125,211,252,0.03) !important;
        }

        /* --- Yield card hover --- */
        .frost-yield-card:hover {
          border-color: rgba(125,211,252,0.18) !important;
        }

        /* --- Chart line reveal --- */
        @keyframes frostLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes frostAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .frost-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: frostLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .frost-area-animate {
          opacity: 0;
          animation: frostAreaReveal 1s ease 1.4s forwards;
        }

        /* --- Pulse effects --- */
        @keyframes frostPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes frostPulseRing {
          0% { r: 4; opacity: 0.35; }
          100% { r: 16; opacity: 0; }
        }

        .frost-pulse-dot {
          animation: frostPulse 2.5s ease-in-out infinite;
        }

        .frost-pulse-ring {
          animation: frostPulseRing 2.5s ease-out infinite;
        }

        /* --- Ring gauge animation --- */
        @keyframes frostRingReveal {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: inherit; }
        }

        .frost-ring-animate {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: frostRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        /* --- Hero value glow breathe --- */
        @keyframes frostHeroGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(125,211,252,0.08)) drop-shadow(0 0 4px rgba(30,64,175,0.05));
          }
          50% {
            filter: drop-shadow(0 0 24px rgba(125,211,252,0.15)) drop-shadow(0 0 8px rgba(6,182,212,0.08));
          }
        }

        .frost-hero-value {
          animation:
            frostGradientShift 10s linear infinite,
            frostHeroGlow 4s ease-in-out infinite;
        }

        /* --- Scrollbar --- */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(125,211,252,0.12); border-radius: 2px; }
      `}</style>

      {/* Background */}
      <FrostBackground />
      <IceParticles />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 40px 80px",
        }}
      >
        {/* Header */}
        <FrostHeader />
        <FrostDivider style={{ opacity: 0.3 }} />

        {/* Hero */}
        <HeroSection value={portfolioDisplay} />
        <FrostDivider style={{ opacity: 0.12 }} />

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            padding: "32px 0",
          }}
        >
          <StatCard
            label={STAT_METRICS[0].label}
            value={yieldDisplay}
            detail={STAT_METRICS[0].detail}
            sparkData={SPARKLINE_DATA[0]}
            delay={100}
          />
          <StatCard
            label={STAT_METRICS[1].label}
            value="11"
            detail={STAT_METRICS[1].detail}
            sparkData={SPARKLINE_DATA[1]}
            delay={100 + STAGGER_MS}
          />
          <StatCard
            label={STAT_METRICS[2].label}
            value={apyDisplay}
            detail={STAT_METRICS[2].detail}
            sparkData={SPARKLINE_DATA[2]}
            delay={100 + STAGGER_MS * 2}
          />
          <StatCard
            label={STAT_METRICS[3].label}
            value="Low"
            detail={STAT_METRICS[3].detail}
            sparkData={SPARKLINE_DATA[3]}
            delay={100 + STAGGER_MS * 3}
          />
        </div>

        <FrostDivider style={{ opacity: 0.12 }} />

        {/* Two-column: Chart + Donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <FrostCard delay={400}>
            <FrostAreaChart visible={staggered[4]} />
          </FrostCard>

          <FrostCard delay={480}>
            <h3
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: COLORS.textDim,
                marginBottom: 24,
              }}
            >
              Asset Allocation
            </h3>
            <FrostDonutChart visible={staggered[5]} />
          </FrostCard>
        </div>

        {/* Allocation Bar */}
        <AllocationBar visible={staggered[6]} />

        <FrostDivider style={{ opacity: 0.12 }} />

        {/* Two-column: Yield Breakdown + Protocol Distribution */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <FrostCard delay={560}>
            <YieldBreakdown visible={staggered[7]} />
          </FrostCard>

          <FrostCard delay={640}>
            <ProtocolDistribution visible={staggered[8]} />
          </FrostCard>
        </div>

        <FrostDivider style={{ opacity: 0.12 }} />

        {/* Holdings Table */}
        <FrostCard delay={720} style={{ marginTop: 8 }}>
          <HoldingsTable
            visible={[
              staggered[9],
              staggered[10],
              staggered[11],
              staggered[12],
              staggered[13],
              staggered[14],
              staggered[15],
            ]}
          />
        </FrostCard>

        <FrostDivider style={{ opacity: 0.12, marginTop: 32 }} />

        {/* Footer Gauges */}
        <div
          className="frost-fadeIn"
          style={{
            animationDelay: "900ms",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "36px 0",
          }}
        >
          {FOOTER_GAUGES.map((gauge, i) => (
            <FrostGaugeRing
              key={gauge.label}
              label={gauge.label}
              value={gauge.value}
              suffix={gauge.suffix}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Footer tagline */}
        <FrostDivider style={{ opacity: 0.12 }} />
        <div
          className="frost-fadeIn"
          style={{
            animationDelay: "1200ms",
            textAlign: "center",
            padding: "24px 0 16px",
          }}
        >
          <p
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 13,
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "0.16em",
              color: COLORS.textDim,
            }}
          >
            Precision forged in absolute zero
          </p>
        </div>
      </div>
    </div>
  );
}
