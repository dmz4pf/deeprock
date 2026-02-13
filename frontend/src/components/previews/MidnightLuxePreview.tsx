"use client";

import { useEffect, useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#0A0A0A",
  surface: "#141414",
  surfaceHover: "#1A1A1A",
  gold: "#C9A84C",
  goldLight: "#E8D48B",
  goldGlow: "rgba(201,168,76,0.15)",
  cream: "#F5F0E8",
  muted: "#8A8070",
  subtle: "#5A554D",
  copper: "#B87333",
  sage: "#7EAA6E",
  border: "rgba(201,168,76,0.08)",
  borderHover: "rgba(201,168,76,0.18)",
} as const;

const FONT_SERIF = "'Cormorant Garamond', 'Georgia', serif";
const FONT_SANS = "'Inter', -apple-system, sans-serif";

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
      // easeOutExpo — fast start, long elegant deceleration
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
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Particles — gold dust motes drifting in candlelight
// ---------------------------------------------------------------------------

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    opacity: 0.03 + Math.random() * 0.05,
    driftX: -15 + Math.random() * 30,
    driftY: -20 + Math.random() * 10,
    duration: 12 + Math.random() * 18,
    delay: Math.random() * -20,
  }));
}

function GoldParticles() {
  const particles = useMemo(() => generateParticles(24), []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="midnight-particle"
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: COLORS.goldLight,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            // @ts-expect-error CSS custom properties for particle drift
            "--drift-x": `${p.driftX}px`,
            "--drift-y": `${p.driftY}px`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ambient glow — warm, restrained radial highlight
// ---------------------------------------------------------------------------

function AmbientGlow() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "30%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.goldGlow} 0%, transparent 70%)`,
          filter: "blur(120px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "20%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(184,115,51,0.06) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header Bar
// ---------------------------------------------------------------------------

function HeaderBar({ portfolioValue }: { portfolioValue: string }) {
  const navItems = ["Overview", "Positions", "Yield", "Analytics"];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        marginBottom: 48,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <span
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "0.25em",
            color: COLORS.gold,
          }}
        >
          MIDNIGHT
        </span>

        <nav style={{ display: "flex", gap: 28 }}>
          {navItems.map((item, i) => (
            <span
              key={item}
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 400,
                color: i === 0 ? COLORS.cream : COLORS.subtle,
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

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {portfolioValue}
        </span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.gold}20, ${COLORS.copper}20)`,
            border: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 14,
              color: COLORS.gold,
              fontWeight: 500,
            }}
          >
            JH
          </span>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero Metric
// ---------------------------------------------------------------------------

function HeroMetric({ value }: { value: string }) {
  return (
    <div
      className="midnight-fadeIn"
      style={{
        textAlign: "center",
        padding: "48px 0 56px",
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
          color: COLORS.muted,
          marginBottom: 16,
        }}
      >
        Total Portfolio Value
      </p>
      <p
        className="midnight-breathe"
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 64,
          fontWeight: 300,
          color: COLORS.cream,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: 20,
        }}
      >
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.sage,
            fontWeight: 500,
          }}
        >
          +12.4% all time
        </span>
        <span style={{ color: COLORS.subtle }}>|</span>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            color: COLORS.muted,
          }}
        >
          +$314,892 unrealized
        </span>
      </div>
      {/* Gold accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "30%",
          right: "30%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}40, transparent)`,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  detail,
  delay = 0,
}: {
  label: string;
  value: string;
  detail?: string;
  delay?: number;
}) {
  return (
    <div
      className="midnight-fadeIn midnight-card"
      style={{
        animationDelay: `${delay}ms`,
        background: COLORS.surface,
        borderRadius: 10,
        padding: "24px 28px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Top gold line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}25, transparent)`,
        }}
      />

      <p
        style={{
          fontFamily: FONT_SANS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: COLORS.subtle,
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 28,
          fontWeight: 400,
          color: COLORS.cream,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {detail && (
        <p
          style={{
            fontFamily: FONT_SANS,
            fontSize: 12,
            color: COLORS.muted,
            marginTop: 6,
          }}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart
// ---------------------------------------------------------------------------

const ALLOCATION_SEGMENTS = [
  { percent: 35, color: COLORS.gold, label: "Treasury Bills" },
  { percent: 25, color: COLORS.copper, label: "Private Credit" },
  { percent: 22, color: COLORS.sage, label: "Real Estate" },
  { percent: 18, color: COLORS.goldLight, label: "Commodities" },
];

function DonutChart() {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
      <svg viewBox="0 0 120 120" style={{ width: 140, height: 140, flexShrink: 0 }}>
        {/* Background ring */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(201,168,76,0.04)"
          strokeWidth="14"
        />
        {ALLOCATION_SEGMENTS.map((seg, i) => {
          const strokeLen = (seg.percent / 100) * circumference;
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
              strokeWidth="14"
              strokeDasharray={`${strokeLen} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                transition: "stroke-dasharray 0.8s ease",
              }}
            />
          );
        })}
        {/* Center text */}
        <text
          x="60"
          y="56"
          textAnchor="middle"
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 16,
            fontWeight: 400,
            fill: COLORS.cream,
          }}
        >
          4
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          style={{
            fontFamily: FONT_SANS,
            fontSize: 8,
            fill: COLORS.subtle,
            letterSpacing: "0.1em",
          }}
        >
          ASSETS
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ALLOCATION_SEGMENTS.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: seg.color,
              }}
            />
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.muted,
                minWidth: 100,
              }}
            >
              {seg.label}
            </span>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 12,
                color: COLORS.subtle,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {seg.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Performance Chart — SVG area sparkline with gold gradient fill
// ---------------------------------------------------------------------------

function PerformanceChart() {
  const dataPoints = [
    80, 78, 82, 76, 74, 79, 85, 83, 88, 92, 89, 95, 93, 98, 96, 102, 99, 105,
    110, 108, 115, 112, 118, 122, 120, 125, 128, 132, 130, 138,
  ];

  const width = 500;
  const height = 130;
  const padTop = 10;
  const padBottom = 10;
  const min = Math.min(...dataPoints);
  const max = Math.max(...dataPoints);
  const range = max - min || 1;

  const points = dataPoints.map((val, i) => {
    const x = (i / (dataPoints.length - 1)) * width;
    const y = padTop + ((max - val) / range) * (height - padTop - padBottom);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const periods = ["1W", "1M", "3M", "1Y", "ALL"];
  const [activePeriod, setActivePeriod] = useState(3);

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
            color: COLORS.subtle,
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
                background: i === activePeriod ? `${COLORS.gold}15` : "transparent",
                color: i === activePeriod ? COLORS.gold : COLORS.subtle,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 130 }}>
        <defs>
          <linearGradient id="midnightAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COLORS.gold} stopOpacity="0.18" />
            <stop offset="100%" stopColor={COLORS.gold} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="midnightLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.gold} stopOpacity="0.4" />
            <stop offset="100%" stopColor={COLORS.gold} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#midnightAreaGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#midnightLineGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={COLORS.gold}
          className="midnight-breathe"
        />
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: COLORS.subtle }}>
          Feb 2025
        </span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: COLORS.subtle }}>
          Feb 2026
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transactions Table
// ---------------------------------------------------------------------------

interface Transaction {
  type: "deposit" | "yield" | "redeem" | "rebalance" | "fee";
  description: string;
  asset: string;
  amount: string;
  date: string;
  status: "confirmed" | "pending" | "processing";
}

const TRANSACTIONS: Transaction[] = [
  {
    type: "deposit",
    description: "Invested",
    asset: "Treasury 6M Pool",
    amount: "+$250,000",
    date: "Today",
    status: "confirmed",
  },
  {
    type: "yield",
    description: "Yield Distribution",
    asset: "Private Credit Fund",
    amount: "+$4,218",
    date: "Yesterday",
    status: "confirmed",
  },
  {
    type: "redeem",
    description: "Partial Redemption",
    asset: "RE Income Trust",
    amount: "-$75,000",
    date: "Feb 6",
    status: "processing",
  },
  {
    type: "rebalance",
    description: "Auto-Rebalance",
    asset: "Portfolio",
    amount: "$0",
    date: "Feb 4",
    status: "confirmed",
  },
  {
    type: "yield",
    description: "Yield Distribution",
    asset: "Treasury 6M Pool",
    amount: "+$3,847",
    date: "Feb 1",
    status: "confirmed",
  },
];

function getTransactionIcon(type: Transaction["type"]): { symbol: string; color: string } {
  switch (type) {
    case "deposit":
      return { symbol: "\u2191", color: COLORS.gold };
    case "yield":
      return { symbol: "+", color: COLORS.sage };
    case "redeem":
      return { symbol: "\u2193", color: COLORS.copper };
    case "rebalance":
      return { symbol: "\u21C4", color: COLORS.muted };
    case "fee":
      return { symbol: "\u2212", color: COLORS.subtle };
  }
}

function getStatusStyle(status: Transaction["status"]): { bg: string; color: string; label: string } {
  switch (status) {
    case "confirmed":
      return { bg: `${COLORS.sage}12`, color: COLORS.sage, label: "Confirmed" };
    case "pending":
      return { bg: `${COLORS.gold}12`, color: COLORS.gold, label: "Pending" };
    case "processing":
      return { bg: `${COLORS.copper}15`, color: COLORS.copper, label: "Processing" };
  }
}

function TransactionsTable() {
  return (
    <div>
      <h3
        style={{
          fontFamily: FONT_SANS,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: COLORS.subtle,
          marginBottom: 20,
        }}
      >
        Recent Activity
      </h3>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {TRANSACTIONS.map((tx, i) => {
          const icon = getTransactionIcon(tx.type);
          const statusStyle = getStatusStyle(tx.status);

          return (
            <div
              key={i}
              className="midnight-fadeIn midnight-row"
              style={{
                animationDelay: `${600 + i * 80}ms`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 8,
                background: i % 2 === 0 ? "transparent" : `${COLORS.surface}80`,
                transition: "background 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `${icon.color}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: icon.color, fontSize: 14, lineHeight: 1 }}>
                    {icon.symbol}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 13,
                      color: COLORS.cream,
                      fontWeight: 400,
                      marginBottom: 2,
                    }}
                  >
                    {tx.description}
                  </p>
                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 11,
                      color: COLORS.subtle,
                    }}
                  >
                    {tx.asset}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <span
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                    color: tx.amount.startsWith("+") ? COLORS.cream : COLORS.muted,
                    minWidth: 90,
                    textAlign: "right",
                  }}
                >
                  {tx.amount}
                </span>
                <span
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 11,
                    color: COLORS.subtle,
                    minWidth: 60,
                    textAlign: "right",
                  }}
                >
                  {tx.date}
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
                    minWidth: 72,
                    textAlign: "center",
                  }}
                >
                  {statusStyle.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Card — consistent wrapper for dashboard panels
// ---------------------------------------------------------------------------

function SectionCard({
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
      className="midnight-fadeIn midnight-card"
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
      {/* Signature top edge — thin gold gradient line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}20, transparent)`,
        }}
      />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MidnightLuxePreview() {
  useFonts();

  const portfolioRaw = useCountUp(2847392, 2800);
  const yieldRaw = useCountUp(18247, 2200);
  const apyRaw = useCountUp(614, 2000); // 6.14 stored as integer * 100

  const formatCurrency = (n: number) =>
    "$" + n.toLocaleString("en-US");

  const portfolioDisplay = formatCurrency(portfolioRaw);
  const yieldDisplay = formatCurrency(yieldRaw);
  const apyDisplay = (apyRaw / 100).toFixed(2) + "%";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.cream,
        padding: "0 40px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <GoldParticles />
      <AmbientGlow />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <HeaderBar portfolioValue={portfolioDisplay} />

        {/* Hero Metric */}
        <HeroMetric value={portfolioDisplay} />

        {/* Stat Cards Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <StatCard label="Total Yield" value={yieldDisplay} detail="This month" delay={100} />
          <StatCard label="Active Positions" value="7" detail="Across 4 pools" delay={200} />
          <StatCard label="Avg APY" value={apyDisplay} detail="Weighted average" delay={300} />
          <StatCard label="Risk Score" value="Low" detail="Conservative profile" delay={400} />
        </div>

        {/* Two-column: Allocation + Performance */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <SectionCard delay={500}>
            <h3
              style={{
                fontFamily: FONT_SANS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: COLORS.subtle,
                marginBottom: 24,
              }}
            >
              Asset Allocation
            </h3>
            <DonutChart />
          </SectionCard>

          <SectionCard delay={600}>
            <PerformanceChart />
          </SectionCard>
        </div>

        {/* Transactions */}
        <SectionCard delay={700}>
          <TransactionsTable />
        </SectionCard>

        {/* Footer whisper */}
        <div
          className="midnight-fadeIn"
          style={{
            animationDelay: "1000ms",
            textAlign: "center",
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <p
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: "0.15em",
              color: COLORS.subtle,
            }}
          >
            Where old money meets new technology
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes midnightFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .midnight-fadeIn {
          animation: midnightFadeIn 0.6s cubic-bezier(0.33, 1, 0.68, 1) forwards;
          opacity: 0;
        }

        @keyframes midnightBreathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .midnight-breathe {
          animation: midnightBreathe 4s ease-in-out infinite;
        }

        @keyframes midnightParticleDrift {
          0% {
            transform: translate(0, 0);
            opacity: var(--particle-opacity, 0.04);
          }
          50% {
            opacity: calc(var(--particle-opacity, 0.04) * 1.8);
          }
          100% {
            transform: translate(var(--drift-x, 10px), var(--drift-y, -20px));
            opacity: 0;
          }
        }

        .midnight-particle {
          animation: midnightParticleDrift linear infinite;
        }

        .midnight-card:hover {
          border-color: ${COLORS.borderHover} !important;
          box-shadow: 0 8px 40px rgba(201,168,76,0.05) !important;
          transform: translateY(-2px);
        }

        .midnight-row:hover {
          background: ${COLORS.surface} !important;
        }
      `}</style>
    </div>
  );
}