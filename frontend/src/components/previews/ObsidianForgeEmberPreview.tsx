"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants -- Volcanic Forge Palette
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#080404",
  surface: "#120808",
  surfaceElevated: "#1C0E0E",
  molten: "#FF6B00",
  moltenBright: "#FF8C33",
  emberRed: "#DC2626",
  lavaGold: "#FFA500",
  whiteHot: "#FFF7ED",
  coolingCharcoal: "#374151",
  textPrimary: "#FFF7ED",
  textSecondary: "#B09080",
  textDim: "#6B4F43",
  success: "#FF6B00",
  danger: "#DC2626",
  warning: "#FFA500",
  border: "rgba(255,107,0,0.08)",
  borderHover: "rgba(220,38,38,0.3)",
} as const;

const IRIDESCENT_GRADIENT =
  "linear-gradient(135deg, #4A0000, #DC2626, #FF6B00, #FFA500, #FFF7ED, #FFA500, #FF6B00, #DC2626, #4A0000)";

const IRIDESCENT_TEXT_GRADIENT =
  "linear-gradient(135deg, #DC2626 0%, #FF6B00 25%, #FFA500 45%, #FFF7ED 60%, #FFA500 75%, #FF6B00 90%, #DC2626 100%)";

const FORGE_HEAT_GRADIENT =
  "linear-gradient(135deg, #4A0000, #DC2626, #FF6B00, #FFA500, #FFF7ED)";

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
  { label: "Tokenized Bonds", value: 32, hueOffset: 0 },
  { label: "Private Credit", value: 24, hueOffset: 30 },
  { label: "Commodity Vaults", value: 22, hueOffset: 55 },
  { label: "Real Estate", value: 14, hueOffset: 80 },
  { label: "Liquid Staking", value: 8, hueOffset: 110 },
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
// Ember Text -- gradient text cycling through heating stages
// ---------------------------------------------------------------------------

function EmberText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="ember-iridescent-text"
      style={{
        background: IRIDESCENT_TEXT_GRADIENT,
        backgroundSize: "400% 400%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "emberGradientShift 8s linear infinite",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Forge Flame Icon SVG -- brand mark
// ---------------------------------------------------------------------------

function ForgeFlameIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer ring - ember glow */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.molten}
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Flame body */}
      <path
        d="M12 3C12 3 6 10 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 10 12 3 12 3Z"
        fill={COLORS.molten}
        fillOpacity="0.6"
      />
      {/* Inner flame */}
      <path
        d="M12 8C12 8 9 12 9 14.5C9 16.2 10.3 17.5 12 17.5C13.7 17.5 15 16.2 15 14.5C15 12 12 8 12 8Z"
        fill={COLORS.lavaGold}
        fillOpacity="0.7"
      />
      {/* White-hot core */}
      <ellipse
        cx="12"
        cy="15"
        rx="1.5"
        ry="2"
        fill={COLORS.whiteHot}
        fillOpacity="0.8"
      />
      {/* Sparks rising */}
      <circle cx="10" cy="5" r="0.6" fill={COLORS.lavaGold} fillOpacity="0.6" />
      <circle cx="14.5" cy="4" r="0.4" fill={COLORS.molten} fillOpacity="0.5" />
      <circle cx="11.5" cy="3" r="0.3" fill={COLORS.whiteHot} fillOpacity="0.4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Heated Divider -- glows red through orange through gold
// ---------------------------------------------------------------------------

function EmberDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="ember-divider"
      style={{
        height: 1,
        background: IRIDESCENT_GRADIENT,
        backgroundSize: "400% 100%",
        animation: "emberGradientShift 8s linear infinite",
        opacity: 0.3,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Background: Ember particles rising on volcanic black
// ---------------------------------------------------------------------------

interface EmberParticle {
  id: number;
  left: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
  glowSize: number;
}

function EmberBackground() {
  const blobs = useMemo(
    () => [
      { top: "-8%", left: "18%", size: 480, opacity: 0.04, speed: 14 },
      { top: "35%", left: "68%", size: 400, opacity: 0.035, speed: 20 },
      { top: "65%", left: "8%", size: 360, opacity: 0.03, speed: 26 },
      { top: "80%", left: "50%", size: 300, opacity: 0.025, speed: 18 },
    ],
    []
  );

  const embers: EmberParticle[] = useMemo(() => {
    const particles: EmberParticle[] = [];
    for (let i = 0; i < 28; i++) {
      particles.push({
        id: i,
        left: `${3 + Math.random() * 94}%`,
        size: 1.5 + Math.random() * 3,
        opacity: 0.2 + Math.random() * 0.6,
        duration: 6 + Math.random() * 10,
        delay: Math.random() * 12,
        drift: -30 + Math.random() * 60,
        glowSize: 3 + Math.random() * 8,
      });
    }
    return particles;
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {/* Volcanic heat blobs */}
      {blobs.map((b, i) => (
        <div
          key={i}
          className="ember-blob"
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(220,38,38,${b.opacity}) 0%, rgba(255,107,0,${b.opacity * 0.7}) 25%, rgba(255,165,0,${b.opacity * 0.4}) 50%, transparent 70%)`,
            filter: "blur(90px)",
            animation: `emberBlobDrift 22s ease-in-out infinite, emberHueShift ${b.speed}s linear infinite`,
            animationDelay: `${i * -5}s`,
          }}
        />
      ))}

      {/* Ember particles -- sparks from the forge */}
      {embers.map((ember) => (
        <div
          key={ember.id}
          className="ember-particle"
          style={{
            position: "absolute",
            bottom: `-${ember.size * 2}px`,
            left: ember.left,
            width: ember.size,
            height: ember.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.lavaGold}, ${COLORS.molten})`,
            boxShadow: `0 0 ${ember.glowSize}px rgba(255,107,0,0.6), 0 0 ${ember.glowSize * 2}px rgba(255,165,0,0.3)`,
            animation: `emberRise ${ember.duration}s ease-out infinite, emberPulseGlow ${1.5 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${ember.delay}s`,
            opacity: 0,
          }}
        />
      ))}

      {/* Subtle volcanic heat haze */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 0%, transparent 60%, rgba(220,38,38,0.015) 80%, rgba(255,107,0,0.02) 100%)",
        }}
      />

      {/* Grain texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.02,
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

function EmberHeader() {
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
          <ForgeFlameIcon size={24} />
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 18,
              fontWeight: 600,
              fontStyle: "italic",
              letterSpacing: "0.22em",
              background: IRIDESCENT_TEXT_GRADIENT,
              backgroundSize: "400% 400%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "emberGradientShift 8s linear infinite",
            }}
          >
            OBSIDIAN EMBER
          </span>
        </div>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              className={i === 0 ? "" : "ember-nav-item"}
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
          className="ember-avatar"
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
              color: COLORS.molten,
            }}
          >
            OE
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
      className="ember-fadeIn"
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
        className="ember-hero-value"
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 52,
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: 18,
          background: IRIDESCENT_TEXT_GRADIENT,
          backgroundSize: "400% 400%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "emberGradientShift 8s linear infinite",
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
        <EmberText
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          +16.8% All Time
        </EmberText>
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
// Forge Card -- heated edge effect with ember glow bottom border
// ---------------------------------------------------------------------------

function EmberCard({
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
      className="ember-fadeIn ember-shimmer ember-card"
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
      {/* Bottom heated edge -- dark red through orange to gold */}
      <div
        className="ember-heated-edge"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, #4A0000, #DC2626, #FF6B00, #FFA500, #FFF7ED, #FFA500, #FF6B00, #DC2626, #4A0000)",
          backgroundSize: "400% 100%",
          animation: "emberGradientShift 6s linear infinite",
          opacity: 0.5,
        }}
      />
      {/* Top subtle ember edge */}
      <div
        className="ember-top-edge"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.2), rgba(255,165,0,0.15), rgba(255,107,0,0.2), transparent)",
          backgroundSize: "300% 100%",
          animation: "emberGradientShift 8s linear infinite",
          opacity: 0.4,
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
      className="ember-fadeIn ember-shimmer ember-card"
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
      {/* Bottom heated edge */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, #4A0000, #DC2626, #FF6B00, #FFA500, #FFF7ED, #FFA500, #FF6B00, #DC2626, #4A0000)",
          backgroundSize: "400% 100%",
          animation: "emberGradientShift 6s linear infinite",
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
          <EmberText
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.1,
              display: "block",
            }}
          >
            {value}
          </EmberText>
        </div>

        {/* Mini sparkline -- volcanic gradient */}
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ marginTop: 8, flexShrink: 0 }}>
          <defs>
            <linearGradient id={`ember-spark-${label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.emberRed} stopOpacity="0.5" />
              <stop offset="50%" stopColor={COLORS.molten} stopOpacity="0.9" />
              <stop offset="100%" stopColor={COLORS.lavaGold} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d={sparkPath}
            fill="none"
            stroke={`url(#ember-spark-${label})`}
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
// SVG Area Chart -- volcanic gradient fill
// ---------------------------------------------------------------------------

function EmberAreaChart({ visible }: { visible: boolean }) {
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
                background: i === activePeriod ? "rgba(255,107,0,0.12)" : "transparent",
                color: i === activePeriod ? COLORS.molten : COLORS.textDim,
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
            {/* Volcanic area fill: deep red at base, orange mid, gold at peaks */}
            <linearGradient id="ember-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.lavaGold} stopOpacity="0.22" />
              <stop offset="25%" stopColor={COLORS.molten} stopOpacity="0.14" />
              <stop offset="55%" stopColor={COLORS.emberRed} stopOpacity="0.08" />
              <stop offset="100%" stopColor="#4A0000" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="ember-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.emberRed} />
              <stop offset="35%" stopColor={COLORS.molten} />
              <stop offset="70%" stopColor={COLORS.lavaGold} />
              <stop offset="100%" stopColor={COLORS.whiteHot} />
            </linearGradient>
            <filter id="ember-line-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
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
          <path d={areaPath} fill="url(#ember-area-fill)" className="ember-area-animate" />

          {/* Line with volcanic gradient */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#ember-line-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ember-line-glow)"
            className="ember-line-animate"
          />

          {/* Ember data points along the line */}
          {points.filter((_, i) => i % 5 === 4).map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill={COLORS.molten}
              fillOpacity="0.7"
              className="ember-data-point"
            />
          ))}

          {/* End dot -- white-hot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill={COLORS.whiteHot}
            className="ember-pulse-dot"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill="none"
            stroke={COLORS.molten}
            strokeWidth="1"
            opacity="0.4"
            className="ember-pulse-ring"
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
// Donut Chart -- volcanic ember segments
// ---------------------------------------------------------------------------

function EmberDonutChart({ visible }: { visible: boolean }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const segmentColors = [
    COLORS.emberRed,
    COLORS.molten,
    COLORS.lavaGold,
    COLORS.whiteHot,
    COLORS.moltenBright,
  ];

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
          stroke="rgba(255,107,0,0.05)"
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
              stroke={segmentColors[i]}
              strokeWidth="13"
              strokeDasharray={`${strokeLen - 2} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="ember-donut-segment"
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
                background: segmentColors[i],
                flexShrink: 0,
                boxShadow: `0 0 6px ${segmentColors[i]}44`,
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
// Allocation Bar -- heated segments
// ---------------------------------------------------------------------------

function AllocationBar({ visible }: { visible: boolean }) {
  const segmentColors = [
    COLORS.emberRed,
    COLORS.molten,
    COLORS.lavaGold,
    COLORS.whiteHot,
    COLORS.moltenBright,
  ];

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
          boxShadow: "0 0 12px rgba(255,107,0,0.15)",
        }}
      >
        {DONUT_SEGMENTS.map((seg, i) => (
          <div
            key={i}
            className="ember-alloc-segment"
            style={{
              width: `${seg.value}%`,
              background: segmentColors[i],
              opacity: 0.8,
              borderLeft: i > 0 ? "1px solid rgba(8,4,4,0.5)" : "none",
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
      return { bg: "rgba(255,107,0,0.1)", color: COLORS.molten };
    case "Maturing":
      return { bg: "rgba(255,165,0,0.1)", color: COLORS.lavaGold };
    case "Pending":
      return { bg: "rgba(220,38,38,0.1)", color: COLORS.emberRed };
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
              color: COLORS.molten,
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
            className="ember-table-row"
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
            <EmberText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.apy}
            </EmberText>
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
// Forge Gauge Ring -- ember arc
// ---------------------------------------------------------------------------

function EmberGaugeRing({
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
  const gradientId = `ember-gauge-${label.replace(/\s/g, "")}`;

  return (
    <div
      className="ember-fadeIn"
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
            <stop offset="0%" stopColor={COLORS.emberRed} />
            <stop offset="33%" stopColor={COLORS.molten} />
            <stop offset="66%" stopColor={COLORS.lavaGold} />
            <stop offset="100%" stopColor={COLORS.whiteHot} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,107,0,0.06)"
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
          className="ember-ring-animate"
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
            className="ember-yield-card"
          >
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: COLORS.textPrimary }}>
                {item.value}
              </p>
            </div>
            <EmberText
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {item.pct}
            </EmberText>
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
    { name: "OpenEden", alloc: 28, color: COLORS.emberRed },
    { name: "Maple Finance", alloc: 22, color: COLORS.molten },
    { name: "Paxos", alloc: 20, color: COLORS.lavaGold },
    { name: "Backed Finance", alloc: 16, color: COLORS.whiteHot },
    { name: "Lido", alloc: 8, color: COLORS.moltenBright },
    { name: "Trader Joe", alloc: 6, color: COLORS.emberRed },
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
                background: "rgba(255,107,0,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.alloc}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${COLORS.emberRed}, ${p.color})`,
                  boxShadow: `0 0 6px ${p.color}33`,
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
// Heat Intensity Meter -- unique to Ember variant
// ---------------------------------------------------------------------------

function HeatIntensityMeter({ visible }: { visible: boolean }) {
  const stages = [
    { label: "Cold", temp: "200\u00B0", color: "#374151", width: 8 },
    { label: "Warm", temp: "400\u00B0", color: "#7F1D1D", width: 14 },
    { label: "Hot", temp: "800\u00B0", color: "#DC2626", width: 22 },
    { label: "Blazing", temp: "1200\u00B0", color: "#FF6B00", width: 30 },
    { label: "White Hot", temp: "1600\u00B0", color: "#FFA500", width: 18 },
    { label: "Critical", temp: "2000\u00B0+", color: "#FFF7ED", width: 8 },
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
        Forge Temperature
      </h3>

      {/* Heat bar */}
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          marginBottom: 16,
          boxShadow: "0 0 16px rgba(255,107,0,0.2), 0 0 32px rgba(220,38,38,0.1)",
        }}
      >
        {stages.map((stage, i) => (
          <div
            key={stage.label}
            style={{
              width: `${stage.width}%`,
              background: stage.color,
              borderLeft: i > 0 ? "1px solid rgba(8,4,4,0.3)" : "none",
              transition: "all 0.5s ease",
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {stages.map((stage) => (
          <div key={stage.label} style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: 9,
                color: stage.color === "#374151" ? COLORS.textDim : stage.color,
                letterSpacing: "0.06em",
                marginBottom: 2,
                opacity: 0.8,
              }}
            >
              {stage.temp}
            </p>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: 8,
                color: COLORS.textDim,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Heat Map -- unique to Ember variant
// ---------------------------------------------------------------------------

function RiskHeatMap({ visible }: { visible: boolean }) {
  const risks = [
    { label: "Market", level: 35, grade: "Low" },
    { label: "Credit", level: 22, grade: "Low" },
    { label: "Liquidity", level: 48, grade: "Med" },
    { label: "Smart Contract", level: 18, grade: "Low" },
    { label: "Counterparty", level: 30, grade: "Low" },
  ];

  const getHeatColor = (level: number) => {
    if (level < 25) return COLORS.coolingCharcoal;
    if (level < 40) return COLORS.emberRed;
    if (level < 60) return COLORS.molten;
    if (level < 80) return COLORS.lavaGold;
    return COLORS.whiteHot;
  };

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
        Risk Heat Map
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {risks.map((risk) => {
          const heatColor = getHeatColor(risk.level);
          return (
            <div key={risk.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  minWidth: 100,
                }}
              >
                {risk.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: "rgba(255,107,0,0.04)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${risk.level}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${COLORS.coolingCharcoal}, ${heatColor})`,
                    boxShadow: risk.level > 30 ? `0 0 8px ${heatColor}44` : "none",
                    transition: "width 1.2s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 10,
                  fontWeight: 500,
                  color: heatColor,
                  minWidth: 28,
                  textAlign: "right",
                }}
              >
                {risk.grade}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ObsidianForgeEmberPreview() {
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
        /* --- Ember gradient cycling through heating stages --- */
        @keyframes emberGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* --- Hue shift for volcanic blobs --- */
        @keyframes emberHueShift {
          0% { filter: hue-rotate(0deg) blur(90px); }
          50% { filter: hue-rotate(20deg) blur(90px); }
          100% { filter: hue-rotate(0deg) blur(90px); }
        }

        /* --- Blob drift --- */
        @keyframes emberBlobDrift {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 25px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* --- Ember particle rising animation --- */
        @keyframes emberRise {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0) scale(1);
          }
          10% {
            opacity: 0.8;
          }
          40% {
            opacity: 0.6;
            transform: translateY(-35vh) translateX(var(--ember-drift, 15px)) scale(0.8);
          }
          70% {
            opacity: 0.3;
            transform: translateY(-65vh) translateX(var(--ember-drift, -10px)) scale(0.5);
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) translateX(var(--ember-drift, 20px)) scale(0.2);
          }
        }

        /* --- Ember glow pulse --- */
        @keyframes emberPulseGlow {
          0%, 100% {
            box-shadow: 0 0 4px rgba(255,107,0,0.4), 0 0 8px rgba(255,165,0,0.2);
          }
          50% {
            box-shadow: 0 0 8px rgba(255,107,0,0.8), 0 0 16px rgba(255,165,0,0.4), 0 0 24px rgba(220,38,38,0.2);
          }
        }

        /* --- Entrance animation --- */
        @keyframes emberFadeIn {
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

        .ember-fadeIn {
          animation: emberFadeIn 600ms ${ENTRANCE_EASE} forwards;
          opacity: 0;
        }

        /* --- Heated border glow cycling --- */
        @keyframes emberBorderHeat {
          0% { border-color: rgba(220,38,38,0.12); box-shadow: 0 0 16px rgba(220,38,38,0.04), 0 4px 24px rgba(0,0,0,0.3); }
          25% { border-color: rgba(255,107,0,0.15); box-shadow: 0 0 20px rgba(255,107,0,0.06), 0 4px 24px rgba(0,0,0,0.3); }
          50% { border-color: rgba(255,165,0,0.12); box-shadow: 0 0 20px rgba(255,165,0,0.05), 0 4px 24px rgba(0,0,0,0.3); }
          75% { border-color: rgba(255,107,0,0.15); box-shadow: 0 0 20px rgba(255,107,0,0.06), 0 4px 24px rgba(0,0,0,0.3); }
          100% { border-color: rgba(220,38,38,0.12); box-shadow: 0 0 16px rgba(220,38,38,0.04), 0 4px 24px rgba(0,0,0,0.3); }
        }

        .ember-card {
          animation:
            emberFadeIn 600ms ${ENTRANCE_EASE} forwards,
            emberBorderHeat 8s linear infinite;
        }

        /* --- Heat shimmer sweep --- */
        .ember-shimmer {
          position: relative;
          overflow: hidden;
        }

        .ember-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(220,38,38,0.04) 38%,
            rgba(255,107,0,0.06) 43%,
            rgba(255,165,0,0.08) 48%,
            rgba(255,247,237,0.04) 50%,
            rgba(255,165,0,0.08) 52%,
            rgba(255,107,0,0.06) 57%,
            rgba(220,38,38,0.04) 62%,
            transparent 70%
          );
          transform: translateX(-100%) translateY(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 2;
        }

        .ember-shimmer:hover::after {
          transform: translateX(30%) translateY(30%);
        }

        /* --- Card hover: heats up --- */
        .ember-shimmer:hover {
          border-color: rgba(255,107,0,0.3) !important;
          box-shadow:
            0 0 24px rgba(255,107,0,0.1),
            0 0 48px rgba(220,38,38,0.06),
            0 16px 48px rgba(0,0,0,0.4) !important;
          transform: translateY(-2px);
        }

        /* --- Nav item hover --- */
        .ember-nav-item:hover {
          color: ${COLORS.textPrimary} !important;
        }

        /* --- Avatar ember border on hover --- */
        .ember-avatar:hover {
          border-color: rgba(255,107,0,0.4) !important;
          box-shadow: 0 0 16px rgba(255,107,0,0.15), 0 0 32px rgba(220,38,38,0.08);
        }

        /* --- Table row hover --- */
        .ember-table-row {
          transition: background 0.25s ease;
        }

        .ember-table-row:hover {
          background: ${COLORS.surfaceElevated} !important;
        }

        /* --- Yield card hover --- */
        .ember-yield-card:hover {
          border-color: rgba(255,107,0,0.2) !important;
        }

        /* --- Chart line reveal --- */
        @keyframes emberLineReveal {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes emberAreaReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ember-line-animate {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: emberLineReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .ember-area-animate {
          opacity: 0;
          animation: emberAreaReveal 1s ease 1.4s forwards;
        }

        /* --- Ember data point glow --- */
        @keyframes emberDataPointGlow {
          0%, 100% { opacity: 0.5; r: 2.5; }
          50% { opacity: 0.9; r: 3.5; }
        }

        .ember-data-point {
          animation: emberDataPointGlow 3s ease-in-out infinite;
        }

        /* --- Pulse effects --- */
        @keyframes emberPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes emberPulseRing {
          0% { r: 4; opacity: 0.5; }
          100% { r: 18; opacity: 0; }
        }

        .ember-pulse-dot {
          animation: emberPulse 2s ease-in-out infinite;
        }

        .ember-pulse-ring {
          animation: emberPulseRing 2s ease-out infinite;
        }

        /* --- Ring gauge animation --- */
        @keyframes emberRingReveal {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: inherit; }
        }

        .ember-ring-animate {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: emberRingReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }

        /* --- Hero value furnace glow --- */
        @keyframes emberHeroGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(255,107,0,0.15)) drop-shadow(0 0 4px rgba(220,38,38,0.08));
          }
          50% {
            filter: drop-shadow(0 0 28px rgba(255,107,0,0.3)) drop-shadow(0 0 12px rgba(220,38,38,0.15));
          }
        }

        .ember-hero-value {
          animation:
            emberGradientShift 8s linear infinite,
            emberHeroGlow 3s ease-in-out infinite;
        }

        /* --- Donut segment glow --- */
        .ember-donut-segment {
          transition: filter 0.3s ease, opacity 0.3s ease;
        }

        /* --- Ember particle drift variable --- */
        .ember-particle:nth-child(odd) {
          --ember-drift: 20px;
        }
        .ember-particle:nth-child(even) {
          --ember-drift: -15px;
        }
        .ember-particle:nth-child(3n) {
          --ember-drift: 30px;
        }
        .ember-particle:nth-child(5n) {
          --ember-drift: -25px;
        }
        .ember-particle:nth-child(7n) {
          --ember-drift: 10px;
        }

        /* --- Scrollbar --- */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,107,0,0.15); border-radius: 2px; }
      `}</style>

      {/* Background with ember particles */}
      <EmberBackground />

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
        <EmberHeader />
        <EmberDivider style={{ opacity: 0.4 }} />

        {/* Hero */}
        <HeroSection value={portfolioDisplay} />
        <EmberDivider style={{ opacity: 0.2 }} />

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

        <EmberDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Chart + Donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <EmberCard delay={400}>
            <EmberAreaChart visible={staggered[4]} />
          </EmberCard>

          <EmberCard delay={480}>
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
            <EmberDonutChart visible={staggered[5]} />
          </EmberCard>
        </div>

        {/* Allocation Bar */}
        <AllocationBar visible={staggered[6]} />

        <EmberDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Yield Breakdown + Protocol Distribution */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <EmberCard delay={560}>
            <YieldBreakdown visible={staggered[7]} />
          </EmberCard>

          <EmberCard delay={640}>
            <ProtocolDistribution visible={staggered[8]} />
          </EmberCard>
        </div>

        <EmberDivider style={{ opacity: 0.15 }} />

        {/* Two-column: Heat Intensity Meter + Risk Heat Map (Ember-unique) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "32px 0",
          }}
        >
          <EmberCard delay={680}>
            <HeatIntensityMeter visible={staggered[9]} />
          </EmberCard>

          <EmberCard delay={720}>
            <RiskHeatMap visible={staggered[10]} />
          </EmberCard>
        </div>

        <EmberDivider style={{ opacity: 0.15 }} />

        {/* Holdings Table */}
        <EmberCard delay={760} style={{ marginTop: 8 }}>
          <HoldingsTable
            visible={[
              staggered[11],
              staggered[12],
              staggered[13],
              staggered[14],
              staggered[15],
              staggered[16],
              staggered[17],
            ]}
          />
        </EmberCard>

        <EmberDivider style={{ opacity: 0.15, marginTop: 32 }} />

        {/* Footer Gauges */}
        <div
          className="ember-fadeIn"
          style={{
            animationDelay: "900ms",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            padding: "36px 0",
          }}
        >
          {FOOTER_GAUGES.map((gauge, i) => (
            <EmberGaugeRing
              key={gauge.label}
              label={gauge.label}
              value={gauge.value}
              suffix={gauge.suffix}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Footer tagline */}
        <EmberDivider style={{ opacity: 0.2 }} />
        <div
          className="ember-fadeIn"
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
            Forged in fire, tempered by ambition
          </p>
        </div>
      </div>
    </div>
  );
}
