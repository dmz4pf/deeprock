"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants -- Aurora Borealis Palette
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#050A0F",
  surface: "#0A1118",
  surfaceElevated: "#0E1720",
  auroraGreen: "#00FF87",
  electricTeal: "#14F5C4",
  deepViolet: "#6B21A8",
  iceBlue: "#38BDF8",
  magentaFlare: "#E879F9",
  polarWhite: "#E8F0F8",
  textPrimary: "#D8E8F0",
  textSecondary: "#7A9BB0",
  textDim: "#3E5A6E",
  success: "#00FF87",
  danger: "#F87171",
  warning: "#FBBF24",
  border: "rgba(0,255,135,0.06)",
  borderHover: "rgba(20,245,196,0.25)",
} as const;

const AURORA_GRADIENT =
  "linear-gradient(135deg, #00FF87, #14F5C4, #38BDF8, #6B21A8, #E879F9, #00FF87)";

const AURORA_TEXT_GRADIENT =
  "linear-gradient(135deg, #00FF87 0%, #14F5C4 25%, #38BDF8 45%, #6B21A8 65%, #E879F9 85%, #00FF87 100%)";

const AURORA_SHIMMER_GRADIENT =
  "linear-gradient(135deg, #00FF87, #14F5C4, #38BDF8, #6B21A8, #E879F9)";

const FONT_SERIF = "'Playfair Display', Georgia, serif";
const FONT_SANS = "'Outfit', system-ui, -apple-system, sans-serif";

const ENTRANCE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const STAGGER_MS = 70;

const CHART_DATA = [
  38, 42, 40, 46, 50, 48, 53, 57, 54, 60,
  64, 62, 67, 71, 68, 74, 78, 76, 82, 86,
  84, 89, 93, 91, 96, 100, 98, 104, 108, 112,
];

const DONUT_SEGMENTS = [
  { label: "Tokenized Bonds", value: 32, color: "#00FF87" },
  { label: "Private Credit", value: 24, color: "#14F5C4" },
  { label: "Commodity Vaults", value: 22, color: "#38BDF8" },
  { label: "Real Estate", value: 14, color: "#6B21A8" },
  { label: "Liquid Staking", value: 8, color: "#E879F9" },
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
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Outfit:wght@200;300;400;500;600;700&display=swap";
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
// Aurora Text -- gradient text with aurora cycling
// ---------------------------------------------------------------------------

function AuroraText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        background: AURORA_TEXT_GRADIENT,
        backgroundSize: "400% 400%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "auroraGradientFlow 12s ease-in-out infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Aurora Crown Icon SVG -- brand mark (northern lights crown)
// ---------------------------------------------------------------------------

function AuroraCrownIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer ring -- icy glow */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.electricTeal}
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      {/* Aurora curtain waves */}
      <path
        d="M4 14 Q6 8, 8 12 Q10 6, 12 10 Q14 5, 16 11 Q18 7, 20 14"
        stroke={COLORS.auroraGreen}
        strokeWidth="1.2"
        strokeOpacity="0.7"
        fill="none"
      />
      <path
        d="M5 15 Q7 10, 9 13 Q11 8, 13 11 Q15 7, 17 12 Q19 9, 21 15"
        stroke={COLORS.iceBlue}
        strokeWidth="0.8"
        strokeOpacity="0.4"
        fill="none"
      />
      {/* Star at apex */}
      <circle cx="12" cy="6" r="1.2" fill={COLORS.electricTeal} fillOpacity="0.9" />
      <line x1="12" y1="3.5" x2="12" y2="4.5" stroke={COLORS.magentaFlare} strokeWidth="0.7" strokeOpacity="0.6" />
      <line x1="10" y1="5" x2="10.8" y2="5.8" stroke={COLORS.auroraGreen} strokeWidth="0.6" strokeOpacity="0.5" />
      <line x1="14" y1="5" x2="13.2" y2="5.8" stroke={COLORS.iceBlue} strokeWidth="0.6" strokeOpacity="0.5" />
      {/* Ground line */}
      <line x1="6" y1="18" x2="18" y2="18" stroke={COLORS.textDim} strokeWidth="0.6" strokeOpacity="0.3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Aurora Divider
// ---------------------------------------------------------------------------

function AuroraDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: AURORA_GRADIENT,
        backgroundSize: "400% 100%",
        animation: "auroraGradientFlow 12s ease-in-out infinite",
        opacity: 0.2,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Background: Aurora curtains + polar blobs
// ---------------------------------------------------------------------------

function AuroraBackground() {
  const blobs = useMemo(
    () => [
      { top: "-10%", left: "15%", size: 520, opacity: 0.025, speed: 18 },
      { top: "30%", left: "65%", size: 440, opacity: 0.02, speed: 24 },
      { top: "60%", left: "5%", size: 380, opacity: 0.018, speed: 30 },
      { top: "75%", left: "55%", size: 320, opacity: 0.012, speed: 22 },
    ],
    []
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {/* Aurora curtain waves -- layered vertical undulations */}
      <div
        className="aurora-curtain aurora-curtain-1"
        style={{
          position: "absolute",
          top: 0,
          left: "-10%",
          width: "120%",
          height: "60%",
          background: `linear-gradient(180deg,
            rgba(0,255,135,0.03) 0%,
            rgba(20,245,196,0.025) 15%,
            rgba(56,189,248,0.02) 30%,
            rgba(107,33,168,0.015) 50%,
            transparent 70%)`,
          filter: "blur(40px)",
          transformOrigin: "top center",
        }}
      />
      <div
        className="aurora-curtain aurora-curtain-2"
        style={{
          position: "absolute",
          top: "5%",
          left: "0%",
          width: "100%",
          height: "50%",
          background: `linear-gradient(180deg,
            rgba(232,121,249,0.02) 0%,
            rgba(107,33,168,0.025) 20%,
            rgba(56,189,248,0.02) 40%,
            rgba(0,255,135,0.015) 55%,
            transparent 70%)`,
          filter: "blur(50px)",
          transformOrigin: "top center",
        }}
      />
      <div
        className="aurora-curtain aurora-curtain-3"
        style={{
          position: "absolute",
          top: "2%",
          left: "20%",
          width: "60%",
          height: "45%",
          background: `linear-gradient(180deg,
            rgba(20,245,196,0.035) 0%,
            rgba(0,255,135,0.02) 25%,
            rgba(107,33,168,0.02) 50%,
            transparent 70%)`,
          filter: "blur(35px)",
          transformOrigin: "top center",
        }}
      />

      {/* Polar blobs -- slow vertical undulation */}
      {blobs.map((b, i) => (
        <div
          key={i}
          className="aurora-blob"
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle,
              rgba(0,255,135,${b.opacity}) 0%,
              rgba(20,245,196,${b.opacity * 0.8}) 20%,
              rgba(56,189,248,${b.opacity * 0.5}) 40%,
              rgba(107,33,168,${b.opacity * 0.3}) 60%,
              transparent 75%)`,
            filter: "blur(80px)",
            animation: `auroraBlobUndulate ${b.speed}s ease-in-out infinite`,
            animationDelay: `${i * -6}s`,
          }}
        />
      ))}

      {/* Subtle noise texture -- polar frost */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.014,
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

function AuroraHeader() {
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
          <AuroraCrownIcon size={24} />
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 18,
              fontWeight: 600,
              fontStyle: "italic",
              letterSpacing: "0.22em",
              background: AURORA_TEXT_GRADIENT,
              backgroundSize: "400% 400%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "auroraGradientFlow 12s ease-in-out infinite",
            }}
          >
            OBSIDIAN FORGE
          </span>
          <span
            style={{
              fontFamily: FONT_SANS,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: COLORS.auroraGreen,
              opacity: 0.6,
              marginLeft: -4,
              alignSelf: "flex-start",
              marginTop: 2,
            }}
          >
            AURORA
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "" : "aurora-nav-item"}
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
          className="aurora-avatar"
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
              color: COLORS.electricTeal,
            }}
          >
            OA
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
      className="aurora-fadeIn"
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
        className="aurora-hero-value"
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 52,
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: 18,
          background: AURORA_TEXT_GRADIENT,
          backgroundSize: "400% 400%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "auroraGradientFlow 12s ease-in-out infinite",
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
        <AuroraText
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          +16.8% All Time
        </AuroraText>
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
// Section Card -- polar glass with aurora top shimmer
// ---------------------------------------------------------------------------

function AuroraCard({
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
      className="aurora-fadeIn aurora-shimmer aurora-card"
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
      {/* Top aurora shimmer edge -- flows left-to-right through aurora palette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: AURORA_SHIMMER_GRADIENT,
          backgroundSize: "400% 100%",
          animation: "auroraEdgeFlow 8s linear infinite",
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
      className="aurora-fadeIn aurora-shimmer aurora-card"
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
      {/* Top aurora shimmer edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: AURORA_SHIMMER_GRADIENT,
          backgroundSize: "400% 100%",
          animation: "auroraEdgeFlow 8s linear infinite",
          opacity: 0.35,
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
          <AuroraText
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.1,
              display: "block",
            }}
          >
            {value}
          </AuroraText>
        </div>

        {/* Mini sparkline with aurora gradient */}
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ marginTop: 8, flexShrink: 0 }}>
          <defs>
            <linearGradient id={`aurora-spark-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.auroraGreen} stopOpacity="0.5" />
              <stop offset="50%" stopColor={COLORS.electricTeal} stopOpacity="0.9" />
              <stop offset="100%" stopColor={COLORS.iceBlue} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d={sparkPath}
            fill="none"
            stroke={`url(#aurora-spark-${label.replace(/\s/g, "")})`}
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
// SVG Area Chart -- aurora gradient fill
// ---------------------------------------------------------------------------

function AuroraAreaChart({ visible }: { visible: boolean }) {
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
                background: i === activePeriod ? "rgba(0,255,135,0.08)" : "transparent",
                color: i === activePeriod ? COLORS.auroraGreen : COLORS.textDim,
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
            {/* Area fill: aurora green at base fading to violet */}
            <linearGradient id="aurora-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.auroraGreen} stopOpacity="0.16" />
              <stop offset="25%" stopColor={COLORS.electricTeal} stopOpacity="0.1" />
              <stop offset="50%" stopColor={COLORS.iceBlue} stopOpacity="0.06" />
              <stop offset="75%" stopColor={COLORS.deepViolet} stopOpacity="0.03" />
              <stop offset="100%" stopColor={COLORS.deepViolet} stopOpacity="0" />
            </linearGradient>
            {/* Line stroke in electric teal */}
            <linearGradient id="aurora-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.auroraGreen} />
              <stop offset="35%" stopColor={COLORS.electricTeal} />
              <stop offset="65%" stopColor={COLORS.iceBlue} />
              <stop offset="100%" stopColor={COLORS.electricTeal} />
            </linearGradient>
            <filter id="aurora-line-glow">
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
          <path d={areaPath} fill="url(#aurora-area-fill)" className="aurora-area-animate" />

          {/* Line with aurora gradient */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#aurora-line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#aurora-line-glow)"
            className="aurora-line-animate"
          />

          {/* End dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={COLORS.electricTeal}
            className="aurora-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill="none"
            stroke={COLORS.auroraGreen}
            strokeWidth="1"
            opacity="0.3"
            className="aurora-pulse-ring"
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
// Donut Chart -- aurora palette segments
// ---------------------------------------------------------------------------

function AuroraDonutChart({ visible }: { visible: boolean }) {
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
          stroke="rgba(0,255,135,0.04)"
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
                opacity: 0.8,
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
// Allocation Bar -- stacked aurora segments
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
      return { bg: "rgba(0,255,135,0.08)", color: COLORS.auroraGreen };
    case "Maturing":
      return { bg: "rgba(251,191,36,0.08)", color: COLORS.warning };
    case "Pending":
      return { bg: "rgba(56,189,248,0.08)", color: COLORS.iceBlue };
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
              color: COLORS.electricTeal,
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
            className="aurora-table-row"
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
            <AuroraText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.apy}
            </AuroraText>
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
// Aurora Gauge Ring -- flowing aurora gradient stroke
// ---------------------------------------------------------------------------

function AuroraGaugeRing({
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
  const gradientId = `aurora-gauge-${label.replace(/\s/g, "")}`;

  return (
    <div
      className="aurora-fadeIn"
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
            <stop offset="0%" stopColor={COLORS.auroraGreen} />
            <stop offset="33%" stopColor={COLORS.electricTeal} />
            <stop offset="66%" stopColor={COLORS.iceBlue} />
            <stop offset="100%" stopColor={COLORS.deepViolet} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(0,255,135,0.05)"
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
          className="aurora-ring-animate"
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
            className="aurora-yield-card"
          >
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.textPrimary }}>
                {item.value}
              </p>
            </div>
            <AuroraText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {item.pct}
            </AuroraText>
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
    { name: "OpenEden", alloc: 28, color: COLORS.auroraGreen },
    { name: "Maple Finance", alloc: 22, color: COLORS.electricTeal },
    { name: "Paxos", alloc: 20, color: COLORS.iceBlue },
    { name: "Backed Finance", alloc: 16, color: COLORS.deepViolet },
    { name: "Lido", alloc: 8, color: COLORS.magentaFlare },
    { name: "Trader Joe", alloc: 6, color: "#14F5C4" },
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
                background: "rgba(0,255,135,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.alloc}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${p.color}, ${p.color}88)`,
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
// Activity Feed -- recent aurora events
// ---------------------------------------------------------------------------

function ActivityFeed({ visible }: { visible: boolean }) {
  const activities = [
    { action: "Deposited", amount: "$50,000", target: "US Treasury 6M", time: "2h ago", color: COLORS.auroraGreen },
    { action: "Harvested", amount: "$1,240", target: "Maple Credit Pool", time: "5h ago", color: COLORS.electricTeal },
    { action: "Rebalanced", amount: "$28,000", target: "Gold Vault to ETH", time: "1d ago", color: COLORS.iceBlue },
    { action: "Claimed", amount: "$890", target: "AVAX LP Rewards", time: "2d ago", color: COLORS.magentaFlare },
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
        Recent Activity
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {activities.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
              borderBottom: i < activities.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: a.color,
                  opacity: 0.8,
                  boxShadow: `0 0 8px ${a.color}40`,
                }}
              />
              <div>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.textPrimary }}>
                  {a.action}
                </span>
                <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.textDim, marginLeft: 6 }}>
                  {a.amount}
                </span>
                <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.textSecondary, marginLeft: 6 }}>
                  {a.target}
                </span>
              </div>
            </div>
            <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.textDim }}>
              {a.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Metrics Bar
// ---------------------------------------------------------------------------

function RiskMetrics({ visible }: { visible: boolean }) {
  const metrics = [
    { label: "Volatility", value: 12, max: 100, color: COLORS.auroraGreen },
    { label: "Counterparty", value: 25, max: 100, color: COLORS.electricTeal },
    { label: "Smart Contract", value: 18, max: 100, color: COLORS.iceBlue },
    { label: "Liquidity", value: 8, max: 100, color: COLORS.magentaFlare },
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
        Risk Assessment
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {metrics.map((m) => (
          <div key={m.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: COLORS.textSecondary }}>
                {m.label}
              </span>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.textDim, fontVariantNumeric: "tabular-nums" }}>
                {m.value}/100
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "rgba(0,255,135,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${m.value}%`,
                  height: "100%",
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${m.color}CC, ${m.color}66)`,
                  boxShadow: `0 0 8px ${m.color}20`,
                  transition: "width 1.2s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ObsidianForgeAuroraPreview() {
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
        /* --- Aurora gradient cycling -- smooth wave-like flow --- */
        @keyframes auroraGradientFlow {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 75%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 25%; }
          100% { background-position: 0% 50%; }
        }

        /* --- Aurora edge shimmer -- left-to-right flow --- */
        @keyframes auroraEdgeFlow {
          0% { background-position: 0% 0%; }
          100% { background-position: 400% 0%; }
        }

        /* --- Aurora curtain undulation -- slow vertical wave --- */
        @keyframes auroraCurtain1 {
          0% { transform: scaleY(1) translateY(0) skewX(0deg); opacity: 0.8; }
          25% { transform: scaleY(1.1) translateY(-8px) skewX(1deg); opacity: 1; }
          50% { transform: scaleY(0.95) translateY(4px) skewX(-0.5deg); opacity: 0.7; }
          75% { transform: scaleY(1.05) translateY(-4px) skewX(0.5deg); opacity: 0.9; }
          100% { transform: scaleY(1) translateY(0) skewX(0deg); opacity: 0.8; }
        }

        @keyframes auroraCurtain2 {
          0% { transform: scaleY(1) translateY(0) skewX(0deg); opacity: 0.6; }
          30% { transform: scaleY(1.08) translateY(-12px) skewX(-1deg); opacity: 0.8; }
          60% { transform: scaleY(0.92) translateY(6px) skewX(0.8deg); opacity: 0.5; }
          100% { transform: scaleY(1) translateY(0) skewX(0deg); opacity: 0.6; }
        }

        @keyframes auroraCurtain3 {
          0% { transform: scaleY(1) translateY(0); opacity: 0.7; }
          35% { transform: scaleY(0.9) translateY(8px); opacity: 0.5; }
          65% { transform: scaleY(1.15) translateY(-10px); opacity: 0.9; }
          100% { transform: scaleY(1) translateY(0); opacity: 0.7; }
        }

        .aurora-curtain-1 {
          animation: auroraCurtain1 16s ease-in-out infinite;
        }

        .aurora-curtain-2 {
          animation: auroraCurtain2 22s ease-in-out infinite;
          animation-delay: -5s;
        }

        .aurora-curtain-3 {
          animation: auroraCurtain3 19s ease-in-out infinite;
          animation-delay: -10s;
        }

        /* --- Blob vertical undulation -- aurora bands --- */
        @keyframes auroraBlobUndulate {
          0% { transform: translate(0, 0) scaleX(1.1) scaleY(0.9); }
          25% { transform: translate(10px, -30px) scaleX(0.95) scaleY(1.1); }
          50% { transform: translate(-15px, 15px) scaleX(1.05) scaleY(0.95); }
          75% { transform: translate(20px, -15px) scaleX(0.9) scaleY(1.05); }
          100% { transform: translate(0, 0) scaleX(1.1) scaleY(0.9); }
        }

        /* --- Entrance animation --- */
        @keyframes auroraFadeIn {
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

        .aurora-fadeIn {
          animation: auroraFadeIn 600ms ${ENTRANCE_EASE} forwards;
          opacity: 0;
        }

        /* --- Aurora border glow cycling --- */
        @keyframes auroraBorderCycle {
          0% { border-color: rgba(0,255,135,0.1); box-shadow: 0 0 20px rgba(0,255,135,0.03); }
          20% { border-color: rgba(20,245,196,0.1); box-shadow: 0 0 20px rgba(20,245,196,0.03); }
          40% { border-color: rgba(56,189,248,0.1); box-shadow: 0 0 20px rgba(56,189,248,0.03); }
          60% { border-color: rgba(107,33,168,0.1); box-shadow: 0 0 20px rgba(107,33,168,0.03); }
          80% { border-color: rgba(232,121,249,0.1); box-shadow: 0 0 20px rgba(232,121,249,0.03); }
          100% { border-color: rgba(0,255,135,0.1); box-shadow: 0 0 20px rgba(0,255,135,0.03); }
        }

        .aurora-card {
          animation:
            auroraFadeIn 600ms ${ENTRANCE_EASE} forwards,
            auroraBorderCycle 15s linear infinite;
        }

        /* --- Aurora shimmer sweep --- */
        .aurora-shimmer {
          position: relative;
          overflow: hidden;
        }

        .aurora-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(0,255,135,0.04) 38%,
            rgba(20,245,196,0.06) 42%,
            rgba(56,189,248,0.05) 46%,
            rgba(107,33,168,0.04) 50%,
            rgba(232,121,249,0.05) 54%,
            rgba(0,255,135,0.04) 58%,
            transparent 66%
          );
          transform: translateX(-100%) translateY(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 2;
        }

        .aurora-shimmer:hover::after {
          transform: translateX(30%) translateY(30%);
        }

        .aurora-shimmer:hover {
          border-color: rgba(20,245,196,0.2) !important;
          box-shadow:
            0 16px 48px rgba(0,255,135,0.04),
            0 4px 20px rgba(107,33,168,0.03) !important;
          transform: translateY(-2px);
        }

        /* --- Nav item hover --- */
        .aurora-nav-item:hover {
          color: ${COLORS.textPrimary} !important;
        }

        /* --- Avatar aurora border on hover --- */
        .aurora-avatar:hover {
          border-color: rgba(20,245,196,0.35) !important;
          box-shadow: 0 0 16px rgba(0,255,135,0.1);
        }

        /* --- Table row hover --- */
        .aurora-table-row {
          transition: background 0.25s ease;
        }

        .aurora-table-row:hover {
          background: ${COLORS.surfaceElevated} !important;
        }

        /* --- Yield card hover --- */
        .aurora-yield-card:hover {
          border-color: rgba(0,255,135,0.15) !important;
        }

        /* --- Chart line reveal --- */
        @keyframes auroraLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes auroraAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .aurora-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: auroraLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .aurora-area-animate {
          opacity: 0;
          animation: auroraAreaReveal 1s ease 1.4s forwards;
        }

        /* --- Pulse effects --- */
        @keyframes auroraPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes auroraPulseRing {
          0% { r: 4; opacity: 0.4; }
          100% { r: 18; opacity: 0; }
        }

        .aurora-pulse-dot {
          animation: auroraPulse 2.5s ease-in-out infinite;
        }

        .aurora-pulse-ring {
          animation: auroraPulseRing 2.5s ease-out infinite;
        }

        /* --- Ring gauge animation --- */
        @keyframes auroraRingReveal {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: inherit; }
        }

        .aurora-ring-animate {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: auroraRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        /* --- Hero value glow breathe with aurora colors --- */
        @keyframes auroraHeroGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(0,255,135,0.08)) drop-shadow(0 0 4px rgba(107,33,168,0.04));
          }
          33% {
            filter: drop-shadow(0 0 20px rgba(20,245,196,0.12)) drop-shadow(0 0 6px rgba(56,189,248,0.06));
          }
          66% {
            filter: drop-shadow(0 0 16px rgba(232,121,249,0.1)) drop-shadow(0 0 8px rgba(0,255,135,0.06));
          }
        }

        .aurora-hero-value {
          animation:
            auroraGradientFlow 12s ease-in-out infinite,
            auroraHeroGlow 6s ease-in-out infinite;
        }

        /* --- Scrollbar --- */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,135,0.12); border-radius: 2px; }
      `}</style>

      {/* Background */}
      <AuroraBackground />

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
        <AuroraHeader />
        <AuroraDivider style={{ opacity: 0.3 }} />

        {/* Hero */}
        <HeroSection value={portfolioDisplay} />
        <AuroraDivider style={{ opacity: 0.12 }} />

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

        <AuroraDivider style={{ opacity: 0.12 }} />

        {/* Two-column: Chart + Donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <AuroraCard delay={400}>
            <AuroraAreaChart visible={staggered[4]} />
          </AuroraCard>

          <AuroraCard delay={480}>
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
            <AuroraDonutChart visible={staggered[5]} />
          </AuroraCard>
        </div>

        {/* Allocation Bar */}
        <AllocationBar visible={staggered[6]} />

        <AuroraDivider style={{ opacity: 0.12 }} />

        {/* Two-column: Yield Breakdown + Protocol Distribution */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <AuroraCard delay={560}>
            <YieldBreakdown visible={staggered[7]} />
          </AuroraCard>

          <AuroraCard delay={640}>
            <ProtocolDistribution visible={staggered[8]} />
          </AuroraCard>
        </div>

        <AuroraDivider style={{ opacity: 0.12 }} />

        {/* Holdings Table */}
        <AuroraCard delay={720} style={{ marginTop: 8 }}>
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
        </AuroraCard>

        <AuroraDivider style={{ opacity: 0.12, marginTop: 32 }} />

        {/* Two-column: Activity Feed + Risk Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <AuroraCard delay={800}>
            <ActivityFeed visible={staggered[16]} />
          </AuroraCard>

          <AuroraCard delay={880}>
            <RiskMetrics visible={staggered[17]} />
          </AuroraCard>
        </div>

        <AuroraDivider style={{ opacity: 0.12 }} />

        {/* Footer Gauges */}
        <div
          className="aurora-fadeIn"
          style={{
            animationDelay: "900ms",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "36px 0",
          }}
        >
          {FOOTER_GAUGES.map((gauge, i) => (
            <AuroraGaugeRing
              key={gauge.label}
              label={gauge.label}
              value={gauge.value}
              suffix={gauge.suffix}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Footer tagline */}
        <AuroraDivider style={{ opacity: 0.12 }} />
        <div
          className="aurora-fadeIn"
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
            Where light dances on the edge of darkness
          </p>
        </div>
      </div>
    </div>
  );
}
