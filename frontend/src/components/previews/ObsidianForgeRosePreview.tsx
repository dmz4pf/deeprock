"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#0C0808",
  surface: "#151010",
  surfaceElevated: "#1E1616",
  roseGold: "#B76E79",
  roseGoldBright: "#D4919B",
  champagne: "#F5E6D3",
  blush: "#FDA4AF",
  platinum: "#E2E8F0",
  burgundy: "#881337",
  burgundyMid: "#9F1239",
  textPrimary: "#F5E6D3",
  textSecondary: "#B8A08E",
  textDim: "#6E5C50",
  success: "#B76E79",
  danger: "#C45B5B",
  warning: "#D4A07A",
  border: "rgba(183,110,121,0.08)",
  borderHover: "rgba(183,110,121,0.3)",
} as const;

const IRIDESCENT_GRADIENT =
  "linear-gradient(135deg, #F5E6D3, #B76E79, #FDA4AF, #E2E8F0, #F5E6D3)";

const IRIDESCENT_TEXT_GRADIENT =
  "linear-gradient(135deg, #F5E6D3 0%, #B76E79 30%, #FDA4AF 55%, #E2E8F0 80%, #F5E6D3 100%)";

const ROSE_METAL_GRADIENT =
  "linear-gradient(135deg, #B76E79, #D4919B, #F5E6D3, #FDA4AF, #B76E79)";

const FONT_SERIF = "'Playfair Display', Georgia, serif";
const FONT_SANS = "'DM Sans', system-ui, -apple-system, sans-serif";

const ENTRANCE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const STAGGER_MS = 70;

const CHART_DATA = [
  38, 42, 40, 46, 50, 48, 53, 57, 54, 60,
  64, 62, 67, 71, 68, 74, 78, 76, 82, 86,
  84, 89, 93, 91, 96, 100, 98, 104, 108, 112,
];

const DONUT_SEGMENTS = [
  { label: "Tokenized Bonds", value: 32, color: "#B76E79" },
  { label: "Private Credit", value: 24, color: "#F5E6D3" },
  { label: "Commodity Vaults", value: 22, color: "#881337" },
  { label: "Real Estate", value: 14, color: "#E2E8F0" },
  { label: "Liquid Staking", value: 8, color: "#FDA4AF" },
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
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,200;0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap";
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
// Sparkle Effect -- tiny rose gold glints on the hero value
// ---------------------------------------------------------------------------

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

function useSparkles(count: number = 6): Sparkle[] {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const generateSparkle = useCallback((id: number): Sparkle => ({
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    opacity: Math.random() * 0.7 + 0.3,
    duration: Math.random() * 1200 + 800,
    delay: Math.random() * 2000,
  }), []);

  useEffect(() => {
    const initial = Array.from({ length: count }, (_, i) => generateSparkle(i));
    setSparkles(initial);

    let nextId = count;
    const interval = setInterval(() => {
      setSparkles((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        next[idx] = generateSparkle(nextId++);
        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [count, generateSparkle]);

  return sparkles;
}

function SparkleLayer() {
  const sparkles = useSparkles(8);

  return (
    <div
      style={{
        position: "absolute",
        inset: "-8px -16px",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {sparkles.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: COLORS.champagne,
            boxShadow: `0 0 ${s.size * 2}px ${s.size}px rgba(245,230,211,0.3)`,
            opacity: 0,
            animation: `roseSparkle ${s.duration}ms ease-in-out ${s.delay}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Iridescent Text -- rose gold gradient text
// ---------------------------------------------------------------------------

function RoseGradientText({
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
        animation: "roseGradientShift 10s linear infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Rose Icon SVG -- brand mark (rose/gem motif)
// ---------------------------------------------------------------------------

function RoseIcon({ size = 22 }: { size?: number }) {
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
        stroke={COLORS.roseGold}
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Gem facets */}
      <path
        d="M7 10 L12 6 L17 10 L12 18 Z"
        fill={COLORS.roseGold}
        fillOpacity="0.6"
      />
      <path
        d="M7 10 L12 12.5 L17 10"
        fill="none"
        stroke={COLORS.champagne}
        strokeWidth="0.6"
        strokeOpacity="0.5"
      />
      <path
        d="M12 12.5 L12 18"
        fill="none"
        stroke={COLORS.champagne}
        strokeWidth="0.6"
        strokeOpacity="0.4"
      />
      {/* Top highlight */}
      <path
        d="M9 10 L12 7.5 L15 10"
        fill={COLORS.blush}
        fillOpacity="0.25"
      />
      {/* Sparkle */}
      <circle cx="12" cy="5" r="0.8" fill={COLORS.champagne} fillOpacity="0.7" />
      <line x1="12" y1="3.5" x2="12" y2="2.5" stroke={COLORS.blush} strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="10.5" y1="4.5" x2="9.5" y2="3.5" stroke={COLORS.roseGold} strokeWidth="0.5" strokeOpacity="0.4" />
      <line x1="13.5" y1="4.5" x2="14.5" y2="3.5" stroke={COLORS.champagne} strokeWidth="0.5" strokeOpacity="0.4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Rose Divider
// ---------------------------------------------------------------------------

function RoseDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: IRIDESCENT_GRADIENT,
        backgroundSize: "300% 100%",
        animation: "roseGradientShift 10s linear infinite",
        opacity: 0.25,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Background: Rose gold gradient blobs on warm onyx
// ---------------------------------------------------------------------------

function RoseBackground() {
  const blobs = useMemo(
    () => [
      { top: "-8%", left: "18%", size: 500, opacity: 0.025, speed: 14 },
      { top: "35%", left: "68%", size: 420, opacity: 0.02, speed: 20 },
      { top: "65%", left: "8%", size: 380, opacity: 0.018, speed: 26 },
      { top: "80%", left: "50%", size: 320, opacity: 0.015, speed: 18 },
      { top: "20%", left: "40%", size: 280, opacity: 0.012, speed: 22 },
    ],
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
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
            background: `radial-gradient(circle, rgba(183,110,121,${b.opacity}) 0%, rgba(245,230,211,${b.opacity * 0.6}) 25%, rgba(253,164,175,${b.opacity * 0.4}) 50%, transparent 70%)`,
            filter: "blur(90px)",
            animation: `roseBlobDrift 22s ease-in-out infinite`,
            animationDelay: `${i * -5}s`,
          }}
        />
      ))}
      {/* Warm noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      {/* Warm vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(12,8,8,0.4) 100%)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function RoseHeader() {
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
          <RoseIcon size={24} />
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 18,
              fontWeight: 600,
              fontStyle: "italic",
              letterSpacing: "0.22em",
              background: IRIDESCENT_TEXT_GRADIENT,
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "roseGradientShift 10s linear infinite",
            }}
          >
            OBSIDIAN FORGE
          </span>
          <span
            style={{
              fontFamily: FONT_SANS,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: COLORS.roseGold,
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: 3,
              border: `1px solid rgba(183,110,121,0.2)`,
              marginLeft: 2,
            }}
          >
            Rose
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "" : "rose-nav-item"}
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
          className="rose-avatar"
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
              color: COLORS.roseGold,
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
// Hero Section -- with sparkle effect
// ---------------------------------------------------------------------------

function HeroSection({ value }: { value: string }) {
  return (
    <div
      className="rose-fadeIn"
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
      <div style={{ position: "relative", display: "inline-block" }}>
        <SparkleLayer />
        <p
          className="rose-hero-value"
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: 18,
            background: IRIDESCENT_TEXT_GRADIENT,
            backgroundSize: "300% 300%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "roseGradientShift 10s linear infinite",
            position: "relative",
          }}
        >
          {value}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <RoseGradientText
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          +16.8% All Time
        </RoseGradientText>
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
// Section Card -- luxury packaging with rose gold edge
// ---------------------------------------------------------------------------

function RoseCard({
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
      className="rose-fadeIn rose-shimmer rose-card"
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
      {/* Top rose gold edge highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: ROSE_METAL_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "roseGradientShift 10s linear infinite",
          opacity: 0.4,
        }}
      />
      {/* Inner champagne glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "40%",
          background: "radial-gradient(ellipse at top, rgba(245,230,211,0.02) 0%, transparent 70%)",
          pointerEvents: "none",
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
      className="rose-fadeIn rose-shimmer rose-card"
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
      {/* Top rose gold edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: ROSE_METAL_GRADIENT,
          backgroundSize: "300% 100%",
          animation: "roseGradientShift 10s linear infinite",
          opacity: 0.3,
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
          <RoseGradientText
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.1,
              display: "block",
            }}
          >
            {value}
          </RoseGradientText>
        </div>

        {/* Mini sparkline */}
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ marginTop: 8, flexShrink: 0 }}>
          <defs>
            <linearGradient id={`rose-spark-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.burgundy} stopOpacity="0.5" />
              <stop offset="50%" stopColor={COLORS.roseGold} stopOpacity="0.9" />
              <stop offset="100%" stopColor={COLORS.champagne} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d={sparkPath}
            fill="none"
            stroke={`url(#rose-spark-${label.replace(/\s/g, "")})`}
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
// SVG Area Chart -- rose gradient fill
// ---------------------------------------------------------------------------

function RoseAreaChart({ visible }: { visible: boolean }) {
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
                background: i === activePeriod ? "rgba(183,110,121,0.12)" : "transparent",
                color: i === activePeriod ? COLORS.roseGold : COLORS.textDim,
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
            <linearGradient id="rose-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.champagne} stopOpacity="0.16" />
              <stop offset="30%" stopColor={COLORS.roseGold} stopOpacity="0.10" />
              <stop offset="60%" stopColor={COLORS.burgundy} stopOpacity="0.05" />
              <stop offset="100%" stopColor={COLORS.burgundy} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rose-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.burgundy} />
              <stop offset="35%" stopColor={COLORS.roseGold} />
              <stop offset="70%" stopColor={COLORS.champagne} />
              <stop offset="100%" stopColor={COLORS.platinum} />
            </linearGradient>
            <filter id="rose-line-glow">
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
                strokeOpacity="0.10"
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#rose-area-fill)" className="rose-area-animate" />

          {/* Line with rose gradient */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#rose-line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#rose-line-glow)"
            className="rose-line-animate"
          />

          {/* Data points at peaks */}
          {points.filter((_, i) => i % 6 === 0 || i === points.length - 1).map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="2.5"
              fill={COLORS.blush}
              fillOpacity="0.8"
              className="rose-area-animate"
            />
          ))}

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={COLORS.champagne}
            className="rose-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill="none"
            stroke={COLORS.roseGold}
            strokeWidth="1"
            opacity="0.3"
            className="rose-pulse-ring"
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
// Donut Chart -- rose/champagne/burgundy/platinum palette
// ---------------------------------------------------------------------------

function RoseDonutChart({ visible }: { visible: boolean }) {
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
          stroke="rgba(183,110,121,0.05)"
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
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                opacity: 0.85,
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
            fontFamily: FONT_SERIF,
            fontSize: 18,
            fontWeight: 600,
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
                opacity: 0.85,
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
// Allocation Bar -- rose gold segments
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
              opacity: 0.75,
              borderLeft: i > 0 ? "1px solid rgba(12,8,8,0.5)" : "none",
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
      return { bg: "rgba(183,110,121,0.1)", color: COLORS.roseGold };
    case "Maturing":
      return { bg: "rgba(212,160,122,0.1)", color: COLORS.warning };
    case "Pending":
      return { bg: "rgba(245,230,211,0.08)", color: COLORS.champagne };
  }
}

function HoldingsTable({ visible }: { visible: boolean[] }) {
  const headerCols = ["Asset", "Protocol", "Value", "APY", "Maturity", "Status"];

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
              color: COLORS.roseGold,
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
            className="rose-table-row"
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
            <RoseGradientText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.apy}
            </RoseGradientText>
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
// Rose Gauge Ring -- rose gold gradient arc
// ---------------------------------------------------------------------------

function RoseGaugeRing({
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
  const gradientId = `rose-gauge-${label.replace(/\s/g, "")}`;

  return (
    <div
      className="rose-fadeIn"
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
            <stop offset="0%" stopColor={COLORS.burgundy} />
            <stop offset="33%" stopColor={COLORS.roseGold} />
            <stop offset="66%" stopColor={COLORS.champagne} />
            <stop offset="100%" stopColor={COLORS.platinum} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(183,110,121,0.06)"
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
          className="rose-ring-animate"
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
            className="rose-yield-card"
          >
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.textPrimary }}>
                {item.value}
              </p>
            </div>
            <RoseGradientText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {item.pct}
            </RoseGradientText>
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
    { name: "OpenEden", alloc: 28, color: COLORS.roseGold },
    { name: "Maple Finance", alloc: 22, color: COLORS.champagne },
    { name: "Paxos", alloc: 20, color: COLORS.burgundy },
    { name: "Backed Finance", alloc: 16, color: COLORS.platinum },
    { name: "Lido", alloc: 8, color: COLORS.blush },
    { name: "Trader Joe", alloc: 6, color: COLORS.roseGoldBright },
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
                background: "rgba(183,110,121,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.alloc}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: p.color,
                  opacity: 0.7,
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

export function ObsidianForgeRosePreview() {
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
        /* --- Rose gold gradient cycling --- */
        @keyframes roseGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* --- Blob drift --- */
        @keyframes roseBlobDrift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 25px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* --- Sparkle effect for hero value --- */
        @keyframes roseSparkle {
          0% { opacity: 0; transform: scale(0); }
          20% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
          80% { opacity: 0.3; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(0); }
        }

        /* --- Entrance animation --- */
        @keyframes roseFadeIn {
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

        .rose-fadeIn {
          animation: roseFadeIn 600ms ${ENTRANCE_EASE} forwards;
          opacity: 0;
        }

        /* --- Rose gold border glow cycling --- */
        @keyframes roseBorderCycle {
          0% { border-color: rgba(183,110,121,0.15); box-shadow: 0 0 20px rgba(183,110,121,0.04); }
          25% { border-color: rgba(245,230,211,0.12); box-shadow: 0 0 20px rgba(245,230,211,0.03); }
          50% { border-color: rgba(253,164,175,0.12); box-shadow: 0 0 20px rgba(253,164,175,0.03); }
          75% { border-color: rgba(226,232,240,0.10); box-shadow: 0 0 20px rgba(226,232,240,0.03); }
          100% { border-color: rgba(183,110,121,0.15); box-shadow: 0 0 20px rgba(183,110,121,0.04); }
        }

        .rose-card {
          animation:
            roseFadeIn 600ms ${ENTRANCE_EASE} forwards,
            roseBorderCycle 12s linear infinite;
        }

        /* --- Rose gold shimmer sweep --- */
        .rose-shimmer {
          position: relative;
          overflow: hidden;
        }

        .rose-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(183,110,121,0.06) 38%,
            rgba(245,230,211,0.08) 42%,
            rgba(253,164,175,0.07) 46%,
            rgba(226,232,240,0.06) 50%,
            rgba(183,110,121,0.08) 54%,
            rgba(245,230,211,0.06) 60%,
            transparent 70%
          );
          transform: translateX(-100%) translateY(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 2;
        }

        .rose-shimmer:hover::after {
          transform: translateX(30%) translateY(30%);
        }

        .rose-shimmer:hover {
          border-color: rgba(183,110,121,0.25) !important;
          box-shadow:
            0 16px 48px rgba(183,110,121,0.06),
            0 4px 20px rgba(245,230,211,0.04) !important;
          transform: translateY(-2px);
        }

        /* --- Nav item hover --- */
        .rose-nav-item:hover {
          color: ${COLORS.textPrimary} !important;
        }

        /* --- Avatar rose border on hover --- */
        .rose-avatar:hover {
          border-color: rgba(183,110,121,0.4) !important;
          box-shadow: 0 0 16px rgba(183,110,121,0.12);
        }

        /* --- Table row hover --- */
        .rose-table-row {
          transition: background 0.25s ease;
        }

        .rose-table-row:hover {
          background: ${COLORS.surfaceElevated} !important;
        }

        /* --- Yield card hover --- */
        .rose-yield-card:hover {
          border-color: rgba(183,110,121,0.2) !important;
        }

        /* --- Chart line reveal --- */
        @keyframes roseLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes roseAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .rose-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: roseLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .rose-area-animate {
          opacity: 0;
          animation: roseAreaReveal 1s ease 1.4s forwards;
        }

        /* --- Pulse effects --- */
        @keyframes rosePulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes rosePulseRing {
          0% { r: 4; opacity: 0.4; }
          100% { r: 18; opacity: 0; }
        }

        .rose-pulse-dot {
          animation: rosePulse 2.5s ease-in-out infinite;
        }

        .rose-pulse-ring {
          animation: rosePulseRing 2.5s ease-out infinite;
        }

        /* --- Ring gauge animation --- */
        @keyframes roseRingReveal {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: inherit; }
        }

        .rose-ring-animate {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: roseRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        /* --- Hero value glow breathe --- */
        @keyframes roseHeroGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(183,110,121,0.1)) drop-shadow(0 0 4px rgba(245,230,211,0.05));
          }
          50% {
            filter: drop-shadow(0 0 24px rgba(183,110,121,0.2)) drop-shadow(0 0 8px rgba(245,230,211,0.1));
          }
        }

        .rose-hero-value {
          animation:
            roseGradientShift 10s linear infinite,
            roseHeroGlow 4s ease-in-out infinite;
        }

        /* --- Scrollbar --- */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(183,110,121,0.15); border-radius: 2px; }
      `}</style>

      {/* Background */}
      <RoseBackground />

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
        <RoseHeader />
        <RoseDivider style={{ opacity: 0.35 }} />

        {/* Hero */}
        <HeroSection value={portfolioDisplay} />
        <RoseDivider style={{ opacity: 0.15 }} />

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

        <RoseDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Chart + Donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <RoseCard delay={400}>
            <RoseAreaChart visible={staggered[4]} />
          </RoseCard>

          <RoseCard delay={480}>
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
            <RoseDonutChart visible={staggered[5]} />
          </RoseCard>
        </div>

        {/* Allocation Bar */}
        <AllocationBar visible={staggered[6]} />

        <RoseDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Yield Breakdown + Protocol Distribution */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <RoseCard delay={560}>
            <YieldBreakdown visible={staggered[7]} />
          </RoseCard>

          <RoseCard delay={640}>
            <ProtocolDistribution visible={staggered[8]} />
          </RoseCard>
        </div>

        <RoseDivider style={{ opacity: 0.15 }} />

        {/* Holdings Table */}
        <RoseCard delay={720} style={{ marginTop: 8 }}>
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
        </RoseCard>

        <RoseDivider style={{ opacity: 0.15, marginTop: 32 }} />

        {/* Footer Gauges */}
        <div
          className="rose-fadeIn"
          style={{
            animationDelay: "900ms",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "36px 0",
          }}
        >
          {FOOTER_GAUGES.map((gauge, i) => (
            <RoseGaugeRing
              key={gauge.label}
              label={gauge.label}
              value={gauge.value}
              suffix={gauge.suffix}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Footer tagline */}
        <RoseDivider style={{ opacity: 0.15 }} />
        <div
          className="rose-fadeIn"
          style={{
            animationDelay: "1200ms",
            textAlign: "center",
            padding: "24px 0 16px",
          }}
        >
          <p
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 14,
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.14em",
              color: COLORS.textDim,
            }}
          >
            Where elegance meets equity
          </p>
        </div>
      </div>
    </div>
  );
}
