"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#030308",
  surface: "#0C0A14",
  surfaceElevated: "#12101E",
  magenta: "#EC4899",
  purple: "#A855F7",
  blue: "#3B82F6",
  gold: "#FBBF24",
  darkMatter: "#18181B",
  textPrimary: "#E8E4F0",
  textSecondary: "#9B8EC2",
  textDim: "#524A6B",
  success: "#34D399",
  danger: "#F87171",
  warning: "#FBBF24",
  border: "rgba(168,85,247,0.08)",
  borderHover: "rgba(236,72,153,0.3)",
} as const;

const NEBULA_GRADIENT =
  "linear-gradient(135deg, #A855F7, #EC4899, #F472B6, #3B82F6, #A855F7)";

const NEBULA_TEXT_GRADIENT =
  "linear-gradient(135deg, #A855F7 0%, #EC4899 25%, #F472B6 45%, #3B82F6 70%, #A855F7 100%)";

const COSMIC_METAL_GRADIENT =
  "linear-gradient(135deg, #A855F7, #EC4899, #F472B6, #FBBF24, #A855F7)";

const FONT_HEADING = "'Sora', system-ui, -apple-system, sans-serif";
const FONT_BODY = "'Inter', system-ui, -apple-system, sans-serif";

const ENTRANCE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const STAGGER_MS = 70;

const CHART_DATA = [
  38, 42, 40, 46, 50, 48, 53, 57, 54, 60,
  64, 62, 67, 71, 68, 74, 78, 76, 82, 86,
  84, 89, 93, 91, 96, 100, 98, 104, 108, 112,
];

const DONUT_SEGMENTS = [
  { label: "Tokenized Bonds", value: 32, color: "#A855F7" },
  { label: "Private Credit", value: 24, color: "#EC4899" },
  { label: "Commodity Vaults", value: 22, color: "#3B82F6" },
  { label: "Real Estate", value: 14, color: "#FBBF24" },
  { label: "Liquid Staking", value: 8, color: "#F472B6" },
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
// Starfield seed data
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: ((i * 17 + 31) % 100),
  y: ((i * 23 + 7) % 100),
  size: 0.5 + (i % 5) * 0.3,
  opacity: 0.2 + (i % 4) * 0.15,
  twinkle: i < 8,
  twinkleDelay: (i * 0.7) % 5,
}));

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
      "https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap";
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
// Nebula Text -- reusable gradient text
// ---------------------------------------------------------------------------

function NebulaText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        background: NEBULA_TEXT_GRADIENT,
        backgroundSize: "300% 300%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "nebulaGradientShift 10s linear infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Nebula Icon SVG -- cosmic brand mark
// ---------------------------------------------------------------------------

function NebulaIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer orbital ring */}
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        stroke={COLORS.purple}
        strokeWidth="0.8"
        strokeOpacity="0.5"
        transform="rotate(-30 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        stroke={COLORS.magenta}
        strokeWidth="0.6"
        strokeOpacity="0.3"
        transform="rotate(30 12 12)"
      />
      {/* Core nebula */}
      <circle cx="12" cy="12" r="4" fill={COLORS.purple} fillOpacity="0.3" />
      <circle cx="12" cy="12" r="2.5" fill={COLORS.magenta} fillOpacity="0.5" />
      <circle cx="12" cy="12" r="1.2" fill="#fff" fillOpacity="0.8" />
      {/* Stars */}
      <circle cx="5" cy="8" r="0.6" fill={COLORS.blue} fillOpacity="0.7" />
      <circle cx="19" cy="16" r="0.5" fill={COLORS.gold} fillOpacity="0.6" />
      <circle cx="7" cy="18" r="0.4" fill={COLORS.magenta} fillOpacity="0.5" />
      <circle cx="18" cy="7" r="0.5" fill={COLORS.purple} fillOpacity="0.6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Nebula Divider
// ---------------------------------------------------------------------------

function NebulaDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: NEBULA_GRADIENT,
        backgroundSize: "300% 100%",
        animation: "nebulaGradientShift 10s linear infinite",
        opacity: 0.25,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Background: Starfield + Nebula clouds on void black
// ---------------------------------------------------------------------------

function NebulaBackground() {
  const clouds = useMemo(
    () => [
      { top: "-5%", left: "10%", size: 550, colors: ["rgba(168,85,247,0.04)", "rgba(236,72,153,0.03)", "rgba(59,130,246,0.02)"], speed: 16 },
      { top: "30%", left: "60%", size: 480, colors: ["rgba(236,72,153,0.035)", "rgba(244,114,182,0.025)", "rgba(168,85,247,0.015)"], speed: 22 },
      { top: "55%", left: "5%", size: 420, colors: ["rgba(59,130,246,0.03)", "rgba(168,85,247,0.025)", "rgba(236,72,153,0.015)"], speed: 28 },
      { top: "75%", left: "45%", size: 380, colors: ["rgba(244,114,182,0.03)", "rgba(251,191,36,0.015)", "rgba(168,85,247,0.02)"], speed: 20 },
    ],
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {/* Starfield */}
      {STARS.map((star, i) => (
        <div
          key={`star-${i}`}
          className={star.twinkle ? "nebula-twinkle" : undefined}
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            background: "#fff",
            opacity: star.opacity,
            ...(star.twinkle ? { animationDelay: `${star.twinkleDelay}s` } : {}),
          }}
        />
      ))}

      {/* Nebula clouds */}
      {clouds.map((c, i) => (
        <div
          key={`cloud-${i}`}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${c.colors[0]} 0%, ${c.colors[1]} 30%, ${c.colors[2]} 55%, transparent 70%)`,
            filter: "blur(80px)",
            animation: `nebulaCloudDrift 24s ease-in-out infinite, nebulaCloudMorph ${c.speed}s ease-in-out infinite`,
            animationDelay: `${i * -6}s`,
          }}
        />
      ))}

      {/* Subtle cosmic dust noise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.012,
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

function NebulaHeader() {
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
          <NebulaIcon size={24} />
          <span
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "0.22em",
              background: NEBULA_TEXT_GRADIENT,
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "nebulaGradientShift 10s linear infinite",
            }}
          >
            OBSIDIAN FORGE
          </span>
          <span
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 9,
              fontWeight: 300,
              letterSpacing: "0.3em",
              color: COLORS.textDim,
              textTransform: "uppercase",
              marginLeft: -4,
              marginTop: 2,
            }}
          >
            NEBULA
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "" : "nebula-nav-item"}
              style={{
                fontFamily: FONT_BODY,
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
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: COLORS.textDim,
            letterSpacing: "0.06em",
          }}
        >
          0x7a3...f19d
        </span>
        <div
          className="nebula-avatar"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
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
              color: COLORS.purple,
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
      className="nebula-fadeIn"
      style={{
        textAlign: "center",
        padding: "44px 0 52px",
        position: "relative",
      }}
    >
      <p
        style={{
          fontFamily: FONT_BODY,
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
        className="nebula-hero-value"
        style={{
          fontFamily: FONT_HEADING,
          fontSize: 52,
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: 18,
          background: NEBULA_TEXT_GRADIENT,
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "nebulaGradientShift 10s linear infinite",
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
        <NebulaText
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          +16.8% All Time
        </NebulaText>
        <span style={{ color: COLORS.textDim }}>|</span>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
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
// Section Card -- cosmic glass with nebula bleed-through
// ---------------------------------------------------------------------------

function NebulaCard({
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
      className="nebula-fadeIn nebula-shimmer nebula-card"
      style={{
        animationDelay: `${delay}ms`,
        background: `linear-gradient(135deg, ${COLORS.surface}ee, ${COLORS.surfaceElevated}cc)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 12,
        padding: 28,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
        ...style,
      }}
    >
      {/* Top nebula edge highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: NEBULA_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "nebulaGradientShift 10s linear infinite",
          opacity: 0.35,
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
      className="nebula-fadeIn nebula-shimmer nebula-card"
      style={{
        animationDelay: `${delay}ms`,
        background: `linear-gradient(135deg, ${COLORS.surface}ee, ${COLORS.surfaceElevated}cc)`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 10,
        padding: "22px 22px 18px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Top nebula edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: NEBULA_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "nebulaGradientShift 10s linear infinite",
          opacity: 0.3,
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: COLORS.textDim,
              marginBottom: 10,
            }}
          >
            {label}
          </p>
          <NebulaText
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.1,
              display: "block",
            }}
          >
            {value}
          </NebulaText>
        </div>

        {/* Mini sparkline */}
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ marginTop: 8, flexShrink: 0 }}>
          <defs>
            <linearGradient id={`nebula-spark-${label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.purple} stopOpacity="0.5" />
              <stop offset="50%" stopColor={COLORS.magenta} stopOpacity="0.9" />
              <stop offset="100%" stopColor={COLORS.blue} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d={sparkPath}
            fill="none"
            stroke={`url(#nebula-spark-${label})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
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
// SVG Area Chart -- nebula gradient fill
// ---------------------------------------------------------------------------

function NebulaAreaChart({ visible }: { visible: boolean }) {
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
            fontFamily: FONT_BODY,
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
                fontFamily: FONT_BODY,
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: i === activePeriod ? "rgba(168,85,247,0.12)" : "transparent",
                color: i === activePeriod ? COLORS.purple : COLORS.textDim,
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
            <span key={l} style={{ fontFamily: FONT_BODY, fontSize: 9, color: COLORS.textDim }}>
              {l}
            </span>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", marginLeft: 4 }}>
          <defs>
            <linearGradient id="nebula-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.purple} stopOpacity="0.2" />
              <stop offset="25%" stopColor={COLORS.magenta} stopOpacity="0.12" />
              <stop offset="55%" stopColor="#F472B6" stopOpacity="0.06" />
              <stop offset="100%" stopColor={COLORS.blue} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nebula-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.purple} />
              <stop offset="35%" stopColor={COLORS.magenta} />
              <stop offset="65%" stopColor="#F472B6" />
              <stop offset="100%" stopColor={COLORS.blue} />
            </linearGradient>
            <filter id="nebula-line-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="nebula-point-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
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
                stroke={COLORS.textDim}
                strokeOpacity="0.1"
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#nebula-area-fill)" className="nebula-area-animate" />

          {/* Line with nebula gradient */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#nebula-line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#nebula-line-glow)"
            className="nebula-line-animate"
          />

          {/* Glowing data points every 5th point */}
          {points.filter((_, i) => i % 5 === 4 || i === points.length - 1).map((p, i) => (
            <circle
              key={`dp-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={COLORS.magenta}
              filter="url(#nebula-point-glow)"
              opacity="0.8"
              className="nebula-area-animate"
            />
          ))}

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={COLORS.textPrimary}
            className="nebula-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill="none"
            stroke={COLORS.magenta}
            strokeWidth="1"
            opacity="0.3"
            className="nebula-pulse-ring"
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
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: COLORS.textDim }}>
          Feb 2025
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: COLORS.textDim }}>
          Feb 2026
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart -- full nebula palette segments
// ---------------------------------------------------------------------------

function NebulaDonutChart({ visible }: { visible: boolean }) {
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
        <defs>
          <filter id="nebula-donut-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(168,85,247,0.05)"
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
              strokeDasharray={`${strokeLen - 2} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              filter="url(#nebula-donut-glow)"
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                transition: "stroke-dasharray 0.8s ease",
                opacity: 0.85,
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
            fontFamily: FONT_BODY,
            fontSize: 7,
            fill: COLORS.textDim,
            letterSpacing: "0.12em",
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
                background: seg.color,
                boxShadow: `0 0 6px ${seg.color}44`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: COLORS.textSecondary,
                minWidth: 110,
              }}
            >
              {seg.label}
            </span>
            <span
              style={{
                fontFamily: FONT_BODY,
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
// Allocation Bar -- stacked nebula-colored segments
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
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
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
              background: seg.color,
              opacity: 0.8,
              borderLeft: i > 0 ? "1px solid rgba(3,3,8,0.5)" : "none",
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
      return { bg: "rgba(168,85,247,0.1)", color: COLORS.purple };
    case "Maturing":
      return { bg: "rgba(251,191,36,0.1)", color: COLORS.warning };
    case "Pending":
      return { bg: "rgba(59,130,246,0.1)", color: COLORS.blue };
  }
}

function HoldingsTable({ visible }: { visible: boolean[] }) {
  const headerCols = ["Asset", "Protocol", "Value", "APY", "Maturity", "Status"];

  return (
    <div>
      <h3
        style={{
          fontFamily: FONT_BODY,
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
              fontFamily: FONT_BODY,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.purple,
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
            className="nebula-table-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1.1fr 1fr 0.7fr 0.9fr 0.7fr",
              gap: 12,
              padding: "13px 16px",
              alignItems: "center",
              borderRadius: 6,
              background: i % 2 === 1 ? `${COLORS.surface}dd` : "transparent",
              opacity: visible[i] ? 1 : 0,
              transform: visible[i] ? "translateX(0)" : "translateX(-8px)",
              transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: `${i * 50}ms`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontWeight: 400,
              }}
            >
              {row.asset}
            </span>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              {row.protocol}
            </span>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
              }}
            >
              {row.value}
            </span>
            <NebulaText
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.apy}
            </NebulaText>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              {row.maturity}
            </span>
            <span
              style={{
                fontFamily: FONT_BODY,
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
// Nebula Gauge Ring
// ---------------------------------------------------------------------------

function NebulaGaugeRing({
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
  const gradientId = `nebula-gauge-${label.replace(/\s/g, "")}`;

  return (
    <div
      className="nebula-fadeIn"
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
            <stop offset="0%" stopColor={COLORS.purple} />
            <stop offset="33%" stopColor={COLORS.magenta} />
            <stop offset="66%" stopColor="#F472B6" />
            <stop offset="100%" stopColor={COLORS.blue} />
          </linearGradient>
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(168,85,247,0.06)"
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
          filter={`url(#${gradientId}-glow)`}
          className="nebula-ring-animate"
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
            fontFamily: FONT_BODY,
            fontSize: 8,
            fill: COLORS.textDim,
          }}
        >
          {suffix}
        </text>
      </svg>

      <span
        style={{
          fontFamily: FONT_BODY,
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
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
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
              border: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "border-color 0.3s ease",
            }}
            className="nebula-yield-card"
          >
            <div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 600, color: COLORS.textPrimary }}>
                {item.value}
              </p>
            </div>
            <NebulaText
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {item.pct}
            </NebulaText>
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
    { name: "OpenEden", alloc: 28, color: COLORS.purple },
    { name: "Maple Finance", alloc: 22, color: COLORS.magenta },
    { name: "Paxos", alloc: 20, color: COLORS.blue },
    { name: "Backed Finance", alloc: 16, color: COLORS.gold },
    { name: "Lido", alloc: 8, color: "#F472B6" },
    { name: "Trader Joe", alloc: 6, color: "#818CF8" },
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
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
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
                fontFamily: FONT_BODY,
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
                background: "rgba(168,85,247,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.alloc}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: p.color,
                  opacity: 0.75,
                  boxShadow: `0 0 8px ${p.color}33`,
                  transition: "width 1s ease",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: FONT_BODY,
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

export function ObsidianForgeNebulaPreview() {
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
        fontFamily: FONT_BODY,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Keyframes & Interaction Styles                                     */}
      {/* ----------------------------------------------------------------- */}
      <style>{`
        /* --- Nebula gradient cycling --- */
        @keyframes nebulaGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* --- Nebula cloud drift --- */
        @keyframes nebulaCloudDrift {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -25px) scale(1.08); }
          50% { transform: translate(-15px, 35px) scale(0.95); }
          75% { transform: translate(-35px, -15px) scale(1.04); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* --- Nebula cloud morphing --- */
        @keyframes nebulaCloudMorph {
          0% { border-radius: 50%; }
          25% { border-radius: 45% 55% 50% 50%; }
          50% { border-radius: 55% 45% 55% 45%; }
          75% { border-radius: 50% 50% 45% 55%; }
          100% { border-radius: 50%; }
        }

        /* --- Star twinkle --- */
        @keyframes nebulaTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }

        .nebula-twinkle {
          animation: nebulaTwinkle 3s ease-in-out infinite;
        }

        /* --- Entrance animation --- */
        @keyframes nebulaFadeIn {
          from {
            opacity: 0;
            transform: translateY(14px);
            filter: brightness(0.7);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: brightness(1);
          }
        }

        .nebula-fadeIn {
          animation: nebulaFadeIn 600ms ${ENTRANCE_EASE} forwards;
          opacity: 0;
        }

        /* --- Nebula border glow cycling --- */
        @keyframes nebulaBorderCycle {
          0% { border-color: rgba(168,85,247,0.15); box-shadow: 0 0 20px rgba(168,85,247,0.04); }
          25% { border-color: rgba(236,72,153,0.15); box-shadow: 0 0 20px rgba(236,72,153,0.04); }
          50% { border-color: rgba(244,114,182,0.12); box-shadow: 0 0 20px rgba(244,114,182,0.04); }
          75% { border-color: rgba(59,130,246,0.12); box-shadow: 0 0 20px rgba(59,130,246,0.04); }
          100% { border-color: rgba(168,85,247,0.15); box-shadow: 0 0 20px rgba(168,85,247,0.04); }
        }

        .nebula-card {
          animation:
            nebulaFadeIn 600ms ${ENTRANCE_EASE} forwards,
            nebulaBorderCycle 12s linear infinite;
        }

        /* --- Cosmic shimmer sweep --- */
        .nebula-shimmer {
          position: relative;
          overflow: hidden;
        }

        .nebula-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(168,85,247,0.05) 38%,
            rgba(236,72,153,0.07) 43%,
            rgba(244,114,182,0.05) 48%,
            rgba(59,130,246,0.07) 53%,
            rgba(168,85,247,0.05) 58%,
            transparent 70%
          );
          transform: translateX(-100%) translateY(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 2;
        }

        .nebula-shimmer:hover::after {
          transform: translateX(30%) translateY(30%);
        }

        .nebula-shimmer:hover {
          border-color: rgba(236,72,153,0.3) !important;
          box-shadow:
            0 0 30px rgba(168,85,247,0.08),
            0 0 60px rgba(236,72,153,0.04),
            0 16px 48px rgba(168,85,247,0.06) !important;
          transform: translateY(-2px);
        }

        /* --- Nav item hover --- */
        .nebula-nav-item:hover {
          color: ${COLORS.textPrimary} !important;
        }

        /* --- Avatar nebula border on hover --- */
        .nebula-avatar:hover {
          border-color: rgba(236,72,153,0.4) !important;
          box-shadow: 0 0 16px rgba(168,85,247,0.15);
        }

        /* --- Table row hover --- */
        .nebula-table-row {
          transition: background 0.25s ease;
        }

        .nebula-table-row:hover {
          background: ${COLORS.surfaceElevated} !important;
        }

        /* --- Yield card hover --- */
        .nebula-yield-card:hover {
          border-color: rgba(168,85,247,0.2) !important;
        }

        /* --- Chart line reveal --- */
        @keyframes nebulaLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes nebulaAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .nebula-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: nebulaLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .nebula-area-animate {
          opacity: 0;
          animation: nebulaAreaReveal 1s ease 1.4s forwards;
        }

        /* --- Pulse effects --- */
        @keyframes nebulaPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes nebulaPulseRing {
          0% { r: 4; opacity: 0.4; }
          100% { r: 18; opacity: 0; }
        }

        .nebula-pulse-dot {
          animation: nebulaPulse 2.5s ease-in-out infinite;
        }

        .nebula-pulse-ring {
          animation: nebulaPulseRing 2.5s ease-out infinite;
        }

        /* --- Ring gauge animation --- */
        @keyframes nebulaRingReveal {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: inherit; }
        }

        .nebula-ring-animate {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: nebulaRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        /* --- Hero value glow breathe --- */
        @keyframes nebulaHeroGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(168,85,247,0.12)) drop-shadow(0 0 4px rgba(236,72,153,0.06));
          }
          50% {
            filter: drop-shadow(0 0 28px rgba(168,85,247,0.22)) drop-shadow(0 0 12px rgba(236,72,153,0.12));
          }
        }

        .nebula-hero-value {
          animation:
            nebulaGradientShift 10s linear infinite,
            nebulaHeroGlow 4s ease-in-out infinite;
        }

        /* --- Scrollbar --- */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.15); border-radius: 2px; }
      `}</style>

      {/* Background */}
      <NebulaBackground />

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
        <NebulaHeader />
        <NebulaDivider style={{ opacity: 0.35 }} />

        {/* Hero */}
        <HeroSection value={portfolioDisplay} />
        <NebulaDivider style={{ opacity: 0.15 }} />

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

        <NebulaDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Chart + Donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <NebulaCard delay={400}>
            <NebulaAreaChart visible={staggered[4]} />
          </NebulaCard>

          <NebulaCard delay={480}>
            <h3
              style={{
                fontFamily: FONT_BODY,
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
            <NebulaDonutChart visible={staggered[5]} />
          </NebulaCard>
        </div>

        {/* Allocation Bar */}
        <AllocationBar visible={staggered[6]} />

        <NebulaDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Yield Breakdown + Protocol Distribution */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <NebulaCard delay={560}>
            <YieldBreakdown visible={staggered[7]} />
          </NebulaCard>

          <NebulaCard delay={640}>
            <ProtocolDistribution visible={staggered[8]} />
          </NebulaCard>
        </div>

        <NebulaDivider style={{ opacity: 0.15 }} />

        {/* Holdings Table */}
        <NebulaCard delay={720} style={{ marginTop: 8 }}>
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
        </NebulaCard>

        <NebulaDivider style={{ opacity: 0.15, marginTop: 32 }} />

        {/* Footer Gauges */}
        <div
          className="nebula-fadeIn"
          style={{
            animationDelay: "900ms",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "36px 0",
          }}
        >
          {FOOTER_GAUGES.map((gauge, i) => (
            <NebulaGaugeRing
              key={gauge.label}
              label={gauge.label}
              value={gauge.value}
              suffix={gauge.suffix}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Footer tagline */}
        <NebulaDivider style={{ opacity: 0.15 }} />
        <div
          className="nebula-fadeIn"
          style={{
            animationDelay: "1200ms",
            textAlign: "center",
            padding: "24px 0 16px",
          }}
        >
          <p
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 14,
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "0.18em",
              color: COLORS.textDim,
            }}
          >
            Wealth measured in lightyears
          </p>
        </div>
      </div>
    </div>
  );
}
