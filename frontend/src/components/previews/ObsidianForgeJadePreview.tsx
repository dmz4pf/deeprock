"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#0A0806",
  surface: "#12100C",
  surfaceElevated: "#1A1710",
  jade: "#00C853",
  jadeDeep: "#047857",
  jadeMuted: "#065F46",
  gold: "#D4A853",
  goldBright: "#E8C96A",
  goldDim: "#8B7332",
  ivory: "#FFF8E7",
  lacquerRed: "#B91C1C",
  redSoft: "#DC2626",
  textPrimary: "#F0EBE0",
  textSecondary: "#A89E8C",
  textDim: "#5E5548",
  success: "#00C853",
  danger: "#B91C1C",
  warning: "#D4A853",
  border: "rgba(212,168,83,0.08)",
  borderHover: "rgba(0,200,83,0.3)",
} as const;

const JADE_GRADIENT =
  "linear-gradient(135deg, #047857, #00C853, #D4A853, #047857)";

const JADE_TEXT_GRADIENT =
  "linear-gradient(135deg, #047857 0%, #00C853 30%, #D4A853 60%, #00C853 85%, #047857 100%)";

const GOLD_ACCENT_GRADIENT =
  "linear-gradient(135deg, #D4A853, #E8C96A, #FFF8E7, #D4A853)";

const JADE_GLOW_GRADIENT =
  "linear-gradient(135deg, #047857, #00C853, #D4A853, #00C853, #047857)";

const FONT_SERIF = "'Cormorant', 'Cormorant Garamond', Georgia, serif";
const FONT_SANS = "'Source Sans 3', 'Source Sans Pro', system-ui, -apple-system, sans-serif";

const ENTRANCE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const STAGGER_MS = 70;

const CHART_DATA = [
  38, 42, 40, 46, 50, 48, 53, 57, 54, 60,
  64, 62, 67, 71, 68, 74, 78, 76, 82, 86,
  84, 89, 93, 91, 96, 100, 98, 104, 108, 112,
];

const DONUT_SEGMENTS = [
  { label: "Tokenized Bonds", value: 32, color: COLORS.jade },
  { label: "Private Credit", value: 24, color: COLORS.gold },
  { label: "Commodity Vaults", value: 22, color: COLORS.ivory },
  { label: "Real Estate", value: 14, color: COLORS.jadeDeep },
  { label: "Liquid Staking", value: 8, color: COLORS.goldDim },
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
// Gold Leaf Particle Definitions
// ---------------------------------------------------------------------------

const GOLD_LEAF_PARTICLES = [
  { x: 12, y: 8, size: 3, drift: 14, pulseSpeed: 3.2, delay: 0 },
  { x: 28, y: 22, size: 2, drift: 18, pulseSpeed: 4.1, delay: 1.2 },
  { x: 45, y: 5, size: 2.5, drift: 12, pulseSpeed: 3.8, delay: 0.5 },
  { x: 62, y: 15, size: 3.5, drift: 20, pulseSpeed: 2.9, delay: 2.1 },
  { x: 78, y: 30, size: 2, drift: 16, pulseSpeed: 4.5, delay: 0.8 },
  { x: 8, y: 45, size: 2.8, drift: 22, pulseSpeed: 3.5, delay: 1.5 },
  { x: 35, y: 52, size: 3, drift: 15, pulseSpeed: 3.1, delay: 2.8 },
  { x: 55, y: 40, size: 2.2, drift: 19, pulseSpeed: 4.3, delay: 0.3 },
  { x: 72, y: 55, size: 3.2, drift: 13, pulseSpeed: 3.7, delay: 1.8 },
  { x: 88, y: 18, size: 2.5, drift: 17, pulseSpeed: 4.0, delay: 2.5 },
  { x: 20, y: 68, size: 2, drift: 21, pulseSpeed: 3.4, delay: 0.9 },
  { x: 50, y: 72, size: 2.8, drift: 14, pulseSpeed: 3.9, delay: 1.6 },
  { x: 82, y: 65, size: 3, drift: 18, pulseSpeed: 2.8, delay: 2.3 },
  { x: 15, y: 82, size: 2.5, drift: 16, pulseSpeed: 4.2, delay: 0.7 },
  { x: 42, y: 88, size: 2, drift: 20, pulseSpeed: 3.6, delay: 1.1 },
  { x: 68, y: 78, size: 3.5, drift: 12, pulseSpeed: 3.3, delay: 2.0 },
  { x: 92, y: 42, size: 2.2, drift: 15, pulseSpeed: 4.4, delay: 0.4 },
  { x: 5, y: 35, size: 2.8, drift: 19, pulseSpeed: 3.0, delay: 1.9 },
  { x: 58, y: 25, size: 2, drift: 17, pulseSpeed: 4.1, delay: 2.6 },
  { x: 38, y: 62, size: 3, drift: 14, pulseSpeed: 3.5, delay: 0.6 },
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
      "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Source+Sans+3:wght@200;300;400;500;600;700&display=swap";
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
// Jade Gradient Text -- reusable
// ---------------------------------------------------------------------------

function JadeText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="jade-gradient-text"
      style={{
        background: JADE_TEXT_GRADIENT,
        backgroundSize: "300% 300%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "jadeGradientShift 10s linear infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Gold Text -- for accents
// ---------------------------------------------------------------------------

function GoldText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        background: GOLD_ACCENT_GRADIENT,
        backgroundSize: "300% 300%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "jadeGradientShift 10s linear infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Jade Seal / Hanko -- decorative stamp element in gold
// ---------------------------------------------------------------------------

function JadeHanko({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      style={{ opacity: 0.65 }}
    >
      {/* Outer square frame -- like a traditional hanko seal */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="3"
        ry="3"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1.5"
        strokeOpacity="0.7"
      />
      {/* Inner decorative border */}
      <rect
        x="5"
        y="5"
        width="30"
        height="30"
        rx="1.5"
        ry="1.5"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />
      {/* Character strokes -- stylized jade/gold kanji-inspired mark */}
      <path
        d="M12 12 L28 12"
        stroke={COLORS.gold}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M20 12 L20 28"
        stroke={COLORS.gold}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M12 20 L28 20"
        stroke={COLORS.gold}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      <path
        d="M14 28 L26 28"
        stroke={COLORS.gold}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      {/* Small jade dot -- the seal's gem */}
      <circle
        cx="26"
        cy="14"
        r="2"
        fill={COLORS.jade}
        fillOpacity="0.6"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Jade Icon SVG -- brand mark (jade stone in gold setting)
// ---------------------------------------------------------------------------

function JadeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer gold ring */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.gold}
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      {/* Inner jade stone -- faceted hexagonal shape */}
      <path
        d="M12 5 L17 8.5 L17 15.5 L12 19 L7 15.5 L7 8.5 Z"
        fill={COLORS.jadeDeep}
        fillOpacity="0.6"
        stroke={COLORS.jade}
        strokeWidth="0.7"
        strokeOpacity="0.8"
      />
      {/* Facet highlight */}
      <path
        d="M12 5 L17 8.5 L12 12 L7 8.5 Z"
        fill={COLORS.jade}
        fillOpacity="0.3"
      />
      {/* Center gleam */}
      <circle cx="12" cy="11" r="1.5" fill={COLORS.jade} fillOpacity="0.5" />
      {/* Gold setting prongs */}
      <line x1="12" y1="3" x2="12" y2="5" stroke={COLORS.gold} strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1="19" y1="8" x2="17" y2="8.5" stroke={COLORS.gold} strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="5" y1="8" x2="7" y2="8.5" stroke={COLORS.gold} strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Jade Divider -- gold line with jade glow
// ---------------------------------------------------------------------------

function JadeDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: GOLD_ACCENT_GRADIENT,
        backgroundSize: "300% 100%",
        animation: "jadeGradientShift 10s linear infinite",
        opacity: 0.2,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Background: Lacquer surface with jade glow blobs + gold leaf particles
// ---------------------------------------------------------------------------

function LacquerBackground() {
  const blobs = useMemo(
    () => [
      { top: "-8%", left: "18%", size: 480, opacity: 0.025, speed: 14 },
      { top: "35%", left: "68%", size: 400, opacity: 0.02, speed: 20 },
      { top: "65%", left: "8%", size: 360, opacity: 0.018, speed: 26 },
      { top: "80%", left: "50%", size: 300, opacity: 0.012, speed: 18 },
    ],
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {/* Jade glow blobs */}
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(0,200,83,${b.opacity}) 0%, rgba(4,120,87,${b.opacity * 0.7}) 25%, rgba(212,168,83,${b.opacity * 0.4}) 50%, transparent 70%)`,
            filter: "blur(90px)",
            animation: `jadeBlobDrift 22s ease-in-out infinite`,
            animationDelay: `${i * -5}s`,
          }}
        />
      ))}

      {/* Polished lacquer grain texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.012,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Gold leaf particles */}
      {GOLD_LEAF_PARTICLES.map((p, i) => (
        <div
          key={`gold-${i}`}
          className="jade-gold-leaf"
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.goldBright} 0%, ${COLORS.gold} 60%, transparent 100%)`,
            animation: `goldLeafDrift ${p.drift}s ease-in-out infinite, goldLeafPulse ${p.pulseSpeed}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function JadeHeader() {
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
          <JadeIcon size={24} />
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 19,
              fontWeight: 600,
              fontStyle: "italic",
              letterSpacing: "0.2em",
              background: JADE_TEXT_GRADIENT,
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "jadeGradientShift 10s linear infinite",
            }}
          >
            OBSIDIAN FORGE
          </span>
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: COLORS.gold,
              opacity: 0.5,
              marginLeft: -4,
              marginTop: 2,
            }}
          >
            Jade
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "" : "jade-nav-item"}
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
            letterSpacing: "0.06em",
          }}
        >
          0x7a3...f19d
        </span>
        <div
          className="jade-avatar"
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
              fontFamily: FONT_SERIF,
              fontSize: 12,
              fontWeight: 500,
              color: COLORS.jade,
            }}
          >
            JD
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
      className="jade-fadeIn"
      style={{
        textAlign: "center",
        padding: "44px 0 52px",
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
        className="jade-hero-value"
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 56,
          fontWeight: 600,
          lineHeight: 1,
          marginBottom: 18,
          background: JADE_TEXT_GRADIENT,
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "jadeGradientShift 10s linear infinite",
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
        <JadeText
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          +16.8% All Time
        </JadeText>
        <span style={{ color: COLORS.textDim }}>|</span>
        <span
          style={{
            fontFamily: FONT_SANS,
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
// Section Card -- jade tablet with gold top edge
// ---------------------------------------------------------------------------

function JadeCard({
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
      className="jade-fadeIn jade-shimmer jade-card"
      style={{
        animationDelay: `${delay}ms`,
        background: COLORS.surface,
        borderRadius: 10,
        padding: 28,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
        ...style,
      }}
    >
      {/* Top gold edge highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: GOLD_ACCENT_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "jadeGradientShift 10s linear infinite",
          opacity: 0.45,
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
      className="jade-fadeIn jade-shimmer jade-card"
      style={{
        animationDelay: `${delay}ms`,
        background: COLORS.surface,
        borderRadius: 10,
        padding: "22px 22px 18px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Top gold edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: GOLD_ACCENT_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "jadeGradientShift 10s linear infinite",
          opacity: 0.4,
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              fontFamily: FONT_SANS,
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
          <JadeText
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.1,
              display: "block",
            }}
          >
            {value}
          </JadeText>
        </div>

        {/* Mini sparkline */}
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ marginTop: 8, flexShrink: 0 }}>
          <defs>
            <linearGradient id={`jade-spark-${label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.jadeDeep} stopOpacity="0.4" />
              <stop offset="50%" stopColor={COLORS.jade} stopOpacity="0.8" />
              <stop offset="100%" stopColor={COLORS.gold} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d={sparkPath}
            fill="none"
            stroke={`url(#jade-spark-${label})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p
        style={{
          fontFamily: FONT_SANS,
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
// SVG Area Chart -- jade gradient fill
// ---------------------------------------------------------------------------

function JadeAreaChart({ visible }: { visible: boolean }) {
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
                background: i === activePeriod ? "rgba(0,200,83,0.08)" : "transparent",
                color: i === activePeriod ? COLORS.jade : COLORS.textDim,
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
            <span key={l} style={{ fontFamily: FONT_SANS, fontSize: 9, color: COLORS.textDim }}>
              {l}
            </span>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", marginLeft: 4 }}>
          <defs>
            <linearGradient id="jade-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.jade} stopOpacity="0.16" />
              <stop offset="35%" stopColor={COLORS.jadeDeep} stopOpacity="0.08" />
              <stop offset="70%" stopColor={COLORS.gold} stopOpacity="0.03" />
              <stop offset="100%" stopColor={COLORS.gold} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="jade-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.jadeDeep} />
              <stop offset="40%" stopColor={COLORS.jade} />
              <stop offset="75%" stopColor={COLORS.gold} />
              <stop offset="100%" stopColor={COLORS.jadeDeep} />
            </linearGradient>
            <filter id="jade-line-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
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
          <path d={areaPath} fill="url(#jade-area-fill)" className="jade-area-animate" />

          {/* Line with jade-gold gradient */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#jade-line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#jade-line-glow)"
            className="jade-line-animate"
          />

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={COLORS.ivory}
            className="jade-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill="none"
            stroke={COLORS.jade}
            strokeWidth="1"
            opacity="0.3"
            className="jade-pulse-ring"
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
// Donut Chart -- jade/gold/ivory palette
// ---------------------------------------------------------------------------

function JadeDonutChart({ visible }: { visible: boolean }) {
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
          stroke="rgba(212,168,83,0.05)"
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
              className="jade-donut-segment"
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                transition: "stroke-dasharray 0.8s ease",
                opacity: 0.8,
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
            fontFamily: FONT_SERIF,
            fontSize: 20,
            fontWeight: 600,
            fill: COLORS.ivory,
          }}
        >
          5
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          style={{
            fontFamily: FONT_SANS,
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
                opacity: 0.8,
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
// Allocation Bar -- jade/gold stacked segments
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
          fontFamily: FONT_SANS,
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
              opacity: 0.7,
              borderLeft: i > 0 ? `1px solid ${COLORS.bg}` : "none",
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
      return { bg: "rgba(0,200,83,0.08)", color: COLORS.jade };
    case "Maturing":
      return { bg: "rgba(212,168,83,0.1)", color: COLORS.gold };
    case "Pending":
      return { bg: "rgba(185,28,28,0.08)", color: COLORS.lacquerRed };
  }
}

function HoldingsTable({ visible }: { visible: boolean[] }) {
  const headerCols = ["Asset", "Protocol", "Value", "APY", "Maturity", "Status"];

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
          Holdings
        </h3>
        {/* Decorative Hanko seal beside Holdings title */}
        <JadeHanko size={28} />
      </div>

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
              fontFamily: FONT_SANS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.gold,
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
            className="jade-table-row"
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
              {row.protocol}
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
            <JadeText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.apy}
            </JadeText>
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
// Gauge Ring -- jade arc with gold track
// ---------------------------------------------------------------------------

function JadeGaugeRing({
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
  const gradientId = `jade-gauge-${label.replace(/\s/g, "")}`;

  return (
    <div
      className="jade-fadeIn"
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
            <stop offset="0%" stopColor={COLORS.jadeDeep} />
            <stop offset="40%" stopColor={COLORS.jade} />
            <stop offset="70%" stopColor={COLORS.gold} />
            <stop offset="100%" stopColor={COLORS.jadeDeep} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(212,168,83,0.06)"
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
          className="jade-ring-animate"
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
            fontSize: 17,
            fontWeight: 600,
            fill: COLORS.ivory,
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
          fontFamily: FONT_SANS,
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
            className="jade-yield-card"
          >
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: FONT_SERIF, fontSize: 20, fontWeight: 600, color: COLORS.ivory }}>
                {item.value}
              </p>
            </div>
            <JadeText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {item.pct}
            </JadeText>
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
    { name: "OpenEden", alloc: 28, color: COLORS.jade },
    { name: "Maple Finance", alloc: 22, color: COLORS.gold },
    { name: "Paxos", alloc: 20, color: COLORS.jadeDeep },
    { name: "Backed Finance", alloc: 16, color: COLORS.ivory },
    { name: "Lido", alloc: 8, color: COLORS.goldDim },
    { name: "Trader Joe", alloc: 6, color: COLORS.jadeMuted },
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
          fontFamily: FONT_SANS,
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
                fontFamily: FONT_SANS,
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
                background: "rgba(212,168,83,0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.alloc}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: p.color,
                  opacity: 0.65,
                  transition: "width 1s ease",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: FONT_SANS,
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

export function ObsidianForgeJadePreview() {
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
        fontFamily: FONT_SANS,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Keyframes & Interaction Styles                                     */}
      {/* ----------------------------------------------------------------- */}
      <style>{`
        /* --- Jade gradient cycling --- */
        @keyframes jadeGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* --- Blob drift --- */
        @keyframes jadeBlobDrift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 25px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* --- Gold leaf particle drift --- */
        @keyframes goldLeafDrift {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(8px, -12px) rotate(45deg); }
          50% { transform: translate(-4px, -6px) rotate(90deg); }
          75% { transform: translate(6px, 10px) rotate(135deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        /* --- Gold leaf opacity pulse --- */
        @keyframes goldLeafPulse {
          0%, 100% { opacity: 0.08; }
          30% { opacity: 0.35; }
          50% { opacity: 0.15; }
          80% { opacity: 0.45; }
        }

        /* --- Entrance animation --- */
        @keyframes jadeFadeIn {
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

        .jade-fadeIn {
          animation: jadeFadeIn 600ms ${ENTRANCE_EASE} forwards;
          opacity: 0;
        }

        /* --- Jade luminescence border glow cycling --- */
        @keyframes jadeBorderCycle {
          0% { border-color: rgba(212,168,83,0.12); box-shadow: 0 0 20px rgba(0,200,83,0.02); }
          25% { border-color: rgba(0,200,83,0.12); box-shadow: 0 0 20px rgba(0,200,83,0.04); }
          50% { border-color: rgba(4,120,87,0.1); box-shadow: 0 0 20px rgba(4,120,87,0.03); }
          75% { border-color: rgba(212,168,83,0.1); box-shadow: 0 0 20px rgba(212,168,83,0.03); }
          100% { border-color: rgba(212,168,83,0.12); box-shadow: 0 0 20px rgba(0,200,83,0.02); }
        }

        .jade-card {
          animation:
            jadeFadeIn 600ms ${ENTRANCE_EASE} forwards,
            jadeBorderCycle 12s linear infinite;
        }

        /* --- Jade luminescence shimmer on hover --- */
        .jade-shimmer {
          position: relative;
          overflow: hidden;
        }

        .jade-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(0,200,83,0.04) 40%,
            rgba(4,120,87,0.06) 45%,
            rgba(212,168,83,0.04) 50%,
            rgba(0,200,83,0.06) 55%,
            rgba(4,120,87,0.04) 60%,
            transparent 70%
          );
          transform: translateX(-100%) translateY(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 2;
        }

        .jade-shimmer:hover::after {
          transform: translateX(30%) translateY(30%);
        }

        .jade-shimmer:hover {
          border-color: rgba(0,200,83,0.2) !important;
          box-shadow:
            0 0 30px rgba(0,200,83,0.06),
            0 16px 48px rgba(0,200,83,0.04),
            0 4px 20px rgba(212,168,83,0.03) !important;
          transform: translateY(-2px);
        }

        /* --- Nav item hover --- */
        .jade-nav-item:hover {
          color: ${COLORS.textPrimary} !important;
        }

        /* --- Avatar jade glow on hover --- */
        .jade-avatar:hover {
          border-color: rgba(0,200,83,0.35) !important;
          box-shadow: 0 0 16px rgba(0,200,83,0.12);
        }

        /* --- Table row hover --- */
        .jade-table-row {
          transition: background 0.25s ease;
        }

        .jade-table-row:hover {
          background: ${COLORS.surfaceElevated} !important;
        }

        /* --- Yield card hover --- */
        .jade-yield-card:hover {
          border-color: rgba(0,200,83,0.15) !important;
        }

        /* --- Chart line reveal --- */
        @keyframes jadeLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes jadeAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .jade-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: jadeLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .jade-area-animate {
          opacity: 0;
          animation: jadeAreaReveal 1s ease 1.4s forwards;
        }

        /* --- Pulse effects --- */
        @keyframes jadePulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes jadePulseRing {
          0% { r: 4; opacity: 0.4; }
          100% { r: 18; opacity: 0; }
        }

        .jade-pulse-dot {
          animation: jadePulse 2.5s ease-in-out infinite;
        }

        .jade-pulse-ring {
          animation: jadePulseRing 2.5s ease-out infinite;
        }

        /* --- Ring gauge animation --- */
        @keyframes jadeRingReveal {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: inherit; }
        }

        .jade-ring-animate {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: jadeRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        /* --- Hero value jade glow breathe --- */
        @keyframes jadeHeroGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(0,200,83,0.08)) drop-shadow(0 0 4px rgba(212,168,83,0.04));
          }
          50% {
            filter: drop-shadow(0 0 24px rgba(0,200,83,0.16)) drop-shadow(0 0 8px rgba(212,168,83,0.08));
          }
        }

        .jade-hero-value {
          animation:
            jadeGradientShift 10s linear infinite,
            jadeHeroGlow 4s ease-in-out infinite;
        }

        /* --- Donut segment hover --- */
        .jade-donut-segment {
          transition: opacity 0.3s ease;
        }

        /* --- Scrollbar -- lacquer/gold --- */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,168,83,0.15); border-radius: 2px; }
      `}</style>

      {/* Background */}
      <LacquerBackground />

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
        <JadeHeader />
        <JadeDivider style={{ opacity: 0.3 }} />

        {/* Hero */}
        <HeroSection value={portfolioDisplay} />
        <JadeDivider style={{ opacity: 0.15 }} />

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

        <JadeDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Chart + Donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <JadeCard delay={400}>
            <JadeAreaChart visible={staggered[4]} />
          </JadeCard>

          <JadeCard delay={480}>
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
            <JadeDonutChart visible={staggered[5]} />
          </JadeCard>
        </div>

        {/* Allocation Bar */}
        <AllocationBar visible={staggered[6]} />

        <JadeDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Yield Breakdown + Protocol Distribution */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <JadeCard delay={560}>
            <YieldBreakdown visible={staggered[7]} />
          </JadeCard>

          <JadeCard delay={640}>
            <ProtocolDistribution visible={staggered[8]} />
          </JadeCard>
        </div>

        <JadeDivider style={{ opacity: 0.15 }} />

        {/* Holdings Table */}
        <JadeCard delay={720} style={{ marginTop: 8 }}>
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
        </JadeCard>

        <JadeDivider style={{ opacity: 0.15, marginTop: 32 }} />

        {/* Footer Gauges */}
        <div
          className="jade-fadeIn"
          style={{
            animationDelay: "900ms",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "36px 0",
          }}
        >
          {FOOTER_GAUGES.map((gauge, i) => (
            <JadeGaugeRing
              key={gauge.label}
              label={gauge.label}
              value={gauge.value}
              suffix={gauge.suffix}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Footer tagline + seal */}
        <JadeDivider style={{ opacity: 0.15 }} />
        <div
          className="jade-fadeIn"
          style={{
            animationDelay: "1200ms",
            textAlign: "center",
            padding: "28px 0 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <p
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 15,
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.12em",
              color: COLORS.textDim,
            }}
          >
            Carved from stone, worth its weight in gold
          </p>
          <JadeHanko size={32} />
        </div>
      </div>
    </div>
  );
}
