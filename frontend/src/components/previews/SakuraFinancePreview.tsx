"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useCountUp(end: number, duration: number = 2200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let frame: number;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return count;
}

// ---------------------------------------------------------------------------
// Petal Particle System
// ---------------------------------------------------------------------------

function SakuraPetals() {
  const petals = Array.from({ length: 18 }, (_, i) => {
    const size = 6 + Math.random() * 8;
    const left = Math.random() * 100;
    const fallDuration = 18 + Math.random() * 17;
    const swayDuration = 8 + Math.random() * 7;
    const rotateDuration = 12 + Math.random() * 10;
    const delay = Math.random() * fallDuration;
    const opacity = 0.04 + Math.random() * 0.06;
    const colors = [
      "rgba(244,114,182,0.07)",
      "rgba(244,114,182,0.09)",
      "rgba(196,181,253,0.06)",
    ];
    const color = colors[i % 3];
    const drift = 30 + Math.random() * 40;
    const driftDir = i % 2 === 0 ? 1 : -1;

    return {
      id: i,
      size,
      left,
      fallDuration,
      swayDuration,
      rotateDuration,
      delay,
      opacity,
      color,
      drift,
      driftDir,
    };
  });

  return (
    <div className="sakura-petals-container">
      {petals.map((p) => (
        <div
          key={p.id}
          className={`sakura-petal sakura-fall-${p.id}`}
          style={{
            position: "fixed",
            left: `${p.left}%`,
            top: "-3%",
            width: `${p.size}px`,
            height: `${p.size * 0.65}px`,
            background: p.color,
            borderRadius: "50% 0 50% 0",
            opacity: p.opacity,
            pointerEvents: "none",
            zIndex: 1,
            animation: `
              sakuraFall-${p.id} ${p.fallDuration}s linear ${p.delay}s infinite,
              sakuraSway-${p.id} ${p.swayDuration}s ease-in-out ${p.delay}s infinite,
              sakuraSpin ${p.rotateDuration}s linear ${p.delay}s infinite
            `,
          }}
        />
      ))}
      <style jsx>{`
        ${petals
          .map(
            (p) => `
          @keyframes sakuraFall-${p.id} {
            0% { top: -4%; }
            100% { top: 106%; }
          }
          @keyframes sakuraSway-${p.id} {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            25% { transform: translateX(${p.drift * p.driftDir * 0.6}px) rotate(${45 * p.driftDir}deg); }
            50% { transform: translateX(${p.drift * p.driftDir}px) rotate(${90 * p.driftDir}deg); }
            75% { transform: translateX(${p.drift * p.driftDir * 0.3}px) rotate(${135 * p.driftDir}deg); }
          }
        `
          )
          .join("")}
        @keyframes sakuraSpin {
          from { rotate: 0deg; }
          to { rotate: 360deg; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decorative Branch Motif (tiny SVG for card corners)
// ---------------------------------------------------------------------------

function BranchMotif({ color }: { color: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      style={{ position: "absolute", top: 10, right: 10, opacity: 0.15 }}
    >
      <path
        d="M4 24 C8 18, 14 14, 24 4"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M14 14 C16 10, 20 8, 24 8"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <circle cx="24" cy="4" r="1.5" fill={color} opacity="0.5" />
      <circle cx="24" cy="8" r="1" fill={color} opacity="0.4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function SakuraStatCard({
  title,
  value,
  subtitle,
  accentColor,
  delay = 0,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accentColor: string;
  delay?: number;
}) {
  return (
    <div
      className="sakura-card animate-zenIn"
      style={{
        animationDelay: `${delay}ms`,
        position: "relative",
        borderRadius: 14,
        padding: "22px 20px",
        background:
          "linear-gradient(135deg, rgba(19,16,42,0.8), rgba(12,10,26,0.9))",
        border: "1px solid rgba(244,114,182,0.06)",
        boxShadow: "0 8px 32px rgba(244,114,182,0.06)",
        backdropFilter: "blur(32px) saturate(1.4)",
        overflow: "hidden",
        transition: "all 0.4s ease",
      }}
    >
      {/* Top edge accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: 0.35,
        }}
      />
      <BranchMotif color={accentColor} />
      <p
        style={{
          fontSize: 11,
          color: "#7C6FA0",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 6,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {title}
      </p>
      <p
        className="sakura-breathe"
        style={{
          fontSize: 24,
          fontWeight: 600,
          fontFamily: "'Sora', sans-serif",
          letterSpacing: "-0.02em",
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          style={{
            fontSize: 12,
            color: "#5B4F80",
            marginTop: 4,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area Chart (smooth bezier)
// ---------------------------------------------------------------------------

function YieldAreaChart() {
  const points = [
    [0, 78],
    [40, 72],
    [80, 65],
    [120, 68],
    [160, 55],
    [200, 48],
    [240, 42],
    [280, 38],
    [320, 30],
    [360, 25],
    [400, 18],
  ];

  const buildBezierPath = (pts: number[][]) => {
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx1 = prev[0] + (curr[0] - prev[0]) * 0.4;
      const cpx2 = prev[0] + (curr[0] - prev[0]) * 0.6;
      d += ` C ${cpx1} ${prev[1]}, ${cpx2} ${curr[1]}, ${curr[0]} ${curr[1]}`;
    }
    return d;
  };

  const linePath = buildBezierPath(points);
  const areaPath = `${linePath} L 400 90 L 0 90 Z`;

  const gridLines = [20, 40, 60, 80];

  return (
    <svg viewBox="0 0 400 90" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="sakuraAreaFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#F472B6" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sakuraStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="400"
          y2={y}
          stroke="rgba(196,181,253,0.06)"
          strokeWidth="0.5"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#sakuraAreaFill)" />

      {/* Stroke */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#sakuraStroke)"
        strokeWidth="1.8"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(244,114,182,0.4))" }}
      />

      {/* Dot on latest point */}
      <circle
        cx="400"
        cy="18"
        r="3"
        fill="#F472B6"
        style={{ filter: "drop-shadow(0 0 6px rgba(244,114,182,0.6))" }}
      />
      <circle cx="400" cy="18" r="5" fill="none" stroke="#F472B6" strokeWidth="0.5" opacity="0.3">
        <animate attributeName="r" values="5;9;5" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Allocation Bars
// ---------------------------------------------------------------------------

function AllocationBars() {
  const allocations = [
    { label: "Treasury Bonds", value: 35, color: "#F472B6" },
    { label: "Real Estate", value: 25, color: "#C4B5FD" },
    { label: "Private Credit", value: 22, color: "#A78BFA" },
    { label: "Commodities", value: 18, color: "#86EFAC" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {allocations.map((item, i) => (
        <div key={i}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 5,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "#EDE9FE",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#7C6FA0",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {item.value}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "rgba(244,114,182,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              className="animate-barGrow"
              style={{
                width: `${item.value}%`,
                height: "100%",
                borderRadius: 3,
                background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                animationDelay: `${800 + i * 150}ms`,
                boxShadow: `0 0 8px ${item.color}40`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Gauge
// ---------------------------------------------------------------------------

function RiskGauge() {
  const riskLevel = 0.32;
  const angle = -90 + riskLevel * 180;
  const r = 34;
  const circumference = Math.PI * r;
  const strokeLen = riskLevel * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 80 48" style={{ width: 80, height: 48 }}>
        <path
          d="M 6 44 A 34 34 0 0 1 74 44"
          fill="none"
          stroke="rgba(244,114,182,0.08)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 6 44 A 34 34 0 0 1 74 44"
          fill="none"
          stroke="#86EFAC"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${strokeLen} ${circumference}`}
          style={{ filter: "drop-shadow(0 0 4px rgba(134,239,172,0.4))" }}
        />
        <line
          x1="40"
          y1="44"
          x2={40 + 18 * Math.cos((angle * Math.PI) / 180)}
          y2={44 + 18 * Math.sin((angle * Math.PI) / 180)}
          stroke="#EDE9FE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="40" cy="44" r="2.5" fill="#EDE9FE" />
      </svg>
      <span
        style={{
          fontSize: 11,
          color: "#86EFAC",
          marginTop: 4,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        Low Risk
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Yield Sparkline
// ---------------------------------------------------------------------------

function YieldSparkline() {
  const pts = [
    [0, 18],
    [12, 15],
    [24, 16],
    [36, 12],
    [48, 10],
    [60, 8],
    [72, 9],
    [84, 6],
    [96, 4],
  ];
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx1 = prev[0] + (curr[0] - prev[0]) * 0.45;
    const cpx2 = prev[0] + (curr[0] - prev[0]) * 0.55;
    d += ` C ${cpx1} ${prev[1]}, ${cpx2} ${curr[1]}, ${curr[0]} ${curr[1]}`;
  }

  return (
    <svg viewBox="0 0 96 22" style={{ width: "100%", height: 30 }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke="url(#sparkGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px rgba(244,114,182,0.3))" }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mini Donut
// ---------------------------------------------------------------------------

function MiniDonut() {
  const segments = [
    { pct: 45, color: "#F472B6" },
    { pct: 30, color: "#C4B5FD" },
    { pct: 25, color: "#A78BFA" },
  ];
  const r = 16;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 44 44" style={{ width: 44, height: 44 }}>
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="rgba(244,114,182,0.06)"
        strokeWidth="5"
      />
      {segments.map((seg, i) => {
        const len = (seg.pct / 100) * circ;
        const dashOffset = offset;
        offset += len;
        return (
          <circle
            key={i}
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="5"
            strokeDasharray={`${len} ${circ}`}
            strokeDashoffset={-dashOffset}
            strokeLinecap="round"
            style={{
              transformOrigin: "center",
              transform: "rotate(-90deg)",
              filter: `drop-shadow(0 0 4px ${seg.color}40)`,
            }}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SakuraFinancePreview() {
  const portfolioValue = useCountUp(1456780, 2400);
  const totalYield = useCountUp(42380, 2400);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const navItems = [
    { label: "Portfolio", active: true },
    { label: "Markets", active: false },
    { label: "Yield", active: false },
    { label: "Govern", active: false },
  ];

  const activities = [
    { time: "2m ago", desc: "Deposited to Treasury Pool", amount: "+$25,000", type: "deposit" as const, status: "confirmed" },
    { time: "1h ago", desc: "Yield claimed from RE Fund", amount: "+$1,240", type: "yield" as const, status: "confirmed" },
    { time: "3h ago", desc: "Rebalanced Credit Pool", amount: "$12,500", type: "neutral" as const, status: "confirmed" },
    { time: "8h ago", desc: "Deposited to Private Credit", amount: "+$50,000", type: "deposit" as const, status: "confirmed" },
    { time: "1d ago", desc: "Yield from Infrastructure", amount: "+$890", type: "yield" as const, status: "pending" },
  ];

  return (
    <div
      className="sakura-root"
      style={{
        minHeight: "100vh",
        padding: "28px 32px",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0C0A1A 0%, #0E0B1E 50%, #0C0A1A 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: "#EDE9FE",
      }}
    >
      {/* Background ambient blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          className="animate-blobDrift1"
          style={{
            position: "absolute",
            top: "5%",
            right: "10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,114,182,0.04) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="animate-blobDrift2"
          style={{
            position: "absolute",
            bottom: "10%",
            left: "5%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,181,253,0.04) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Sakura Petals */}
      <SakuraPetals />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1080, margin: "0 auto" }}>
        {/* ---- Navigation ---- */}
        <nav
          className="animate-zenIn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 36,
            animationDelay: "0ms",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Zen circle */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1.5px solid rgba(244,114,182,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(244,114,182,0.04)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#F472B6" strokeWidth="1.2" strokeDasharray="2 3" />
                <circle cx="8" cy="8" r="2" fill="#F472B6" opacity="0.6" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 18,
                fontFamily: "'Sora', sans-serif",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "#EDE9FE",
              }}
            >
              <span style={{ color: "#F472B6", marginRight: 6 }}>桜</span>
              SAKURA
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navItems.map((item) => (
              <button
                key={item.label}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: item.active ? 500 : 400,
                  color: item.active ? "#F472B6" : "#7C6FA0",
                  background: "transparent",
                  border: "none",
                  borderBottom: item.active
                    ? "2px solid #F472B6"
                    : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            style={{
              padding: "7px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontFamily: "'Sora', sans-serif",
              color: "#C4B5FD",
              background: "rgba(196,181,253,0.06)",
              border: "1px solid rgba(196,181,253,0.1)",
            }}
          >
            0x7f3a...8b2c
          </div>
        </nav>

        {/* ---- Hero Value ---- */}
        <div
          className="animate-zenIn"
          style={{
            textAlign: "center",
            marginBottom: 36,
            animationDelay: "120ms",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#7C6FA0",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Portfolio Balance
          </p>
          <p
            className="sakura-breathe"
            style={{
              fontSize: 44,
              fontWeight: 300,
              fontFamily: "'Sora', sans-serif",
              letterSpacing: "-0.02em",
              color: "#EDE9FE",
              textShadow:
                "0 0 40px rgba(244,114,182,0.2), 0 0 80px rgba(244,114,182,0.08)",
            }}
          >
            ${portfolioValue.toLocaleString()}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#86EFAC",
                boxShadow: "0 0 8px rgba(134,239,172,0.5)",
              }}
            />
            <span
              style={{
                fontSize: 14,
                color: "#86EFAC",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              +8.7%
            </span>
            <span style={{ color: "#5B4F80", fontSize: 13 }}>all time</span>
          </div>
        </div>

        {/* ---- Stat Cards (2x2) ---- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <SakuraStatCard
            title="Total Yield"
            value={`$${totalYield.toLocaleString()}`}
            subtitle="Earned this quarter"
            accentColor="#F472B6"
            delay={240}
          />
          <SakuraStatCard
            title="Active Pools"
            value="7"
            subtitle="Across 4 protocols"
            accentColor="#C4B5FD"
            delay={360}
          />
          <SakuraStatCard
            title="Average APY"
            value="6.42%"
            subtitle="Weighted by allocation"
            accentColor="#A78BFA"
            delay={480}
          />
          <SakuraStatCard
            title="Maturity Score"
            value="92"
            subtitle="Excellent standing"
            accentColor="#86EFAC"
            delay={600}
          />
        </div>

        {/* ---- Charts Row ---- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "55% 1fr",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Area Chart */}
          <div
            className="sakura-card animate-zenIn"
            style={{
              animationDelay: "720ms",
              borderRadius: 14,
              padding: "22px 20px",
              background:
                "linear-gradient(135deg, rgba(19,16,42,0.8), rgba(12,10,26,0.9))",
              border: "1px solid rgba(244,114,182,0.06)",
              boxShadow: "0 8px 32px rgba(244,114,182,0.06)",
              backdropFilter: "blur(32px) saturate(1.4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "15%",
                right: "15%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, #F472B6, transparent)",
                opacity: 0.25,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "#7C6FA0",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Yield Performance
              </p>
              <div style={{ display: "flex", gap: 4 }}>
                {["1W", "1M", "3M", "1Y"].map((p, i) => (
                  <button
                    key={p}
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      background:
                        i === 3 ? "rgba(244,114,182,0.1)" : "transparent",
                      color: i === 3 ? "#F472B6" : "#5B4F80",
                      transition: "all 0.3s",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <YieldAreaChart />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#5B4F80",
                marginTop: 8,
              }}
            >
              <span>Feb 2025</span>
              <span>Feb 2026</span>
            </div>
          </div>

          {/* Allocation */}
          <div
            className="sakura-card animate-zenIn"
            style={{
              animationDelay: "840ms",
              borderRadius: 14,
              padding: "22px 20px",
              background:
                "linear-gradient(135deg, rgba(19,16,42,0.8), rgba(12,10,26,0.9))",
              border: "1px solid rgba(196,181,253,0.08)",
              boxShadow: "0 8px 32px rgba(244,114,182,0.04)",
              backdropFilter: "blur(32px) saturate(1.4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "15%",
                right: "15%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, #C4B5FD, transparent)",
                opacity: 0.2,
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: "#7C6FA0",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
              }}
            >
              Allocation
            </p>
            <AllocationBars />
          </div>
        </div>

        {/* ---- Recent Activity ---- */}
        <div
          className="sakura-card animate-zenIn"
          style={{
            animationDelay: "960ms",
            borderRadius: 14,
            padding: "22px 24px",
            background:
              "linear-gradient(135deg, rgba(19,16,42,0.75), rgba(12,10,26,0.88))",
            border: "1px solid rgba(244,114,182,0.06)",
            boxShadow: "0 8px 32px rgba(244,114,182,0.04)",
            backdropFilter: "blur(32px) saturate(1.4)",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "20%",
              right: "20%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, #F472B6, transparent)",
              opacity: 0.2,
            }}
          />
          <p
            style={{
              fontSize: 12,
              color: "#7C6FA0",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 18,
            }}
          >
            Recent Activity
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {activities.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 8px",
                  borderRadius: 10,
                  transition: "background 0.3s",
                  cursor: "pointer",
                }}
                className="sakura-activity-row"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Status dot */}
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background:
                        a.type === "yield"
                          ? "#86EFAC"
                          : a.type === "deposit"
                          ? "#F472B6"
                          : "#C4B5FD",
                      boxShadow:
                        a.type === "yield"
                          ? "0 0 6px rgba(134,239,172,0.4)"
                          : a.type === "deposit"
                          ? "0 0 6px rgba(244,114,182,0.4)"
                          : "0 0 6px rgba(196,181,253,0.3)",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#EDE9FE",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {a.desc}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#5B4F80",
                        marginTop: 2,
                      }}
                    >
                      {a.time}{" "}
                      {a.status === "pending" && (
                        <span style={{ color: "#FDE68A" }}>
                          {" "}pending
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'Sora', sans-serif",
                    color:
                      a.type === "yield"
                        ? "#86EFAC"
                        : a.type === "deposit"
                        ? "#F472B6"
                        : "#C4B5FD",
                  }}
                >
                  {a.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Bottom Mini Cards ---- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          {/* Risk Assessment */}
          <div
            className="sakura-card animate-zenIn"
            style={{
              animationDelay: "1080ms",
              borderRadius: 14,
              padding: "20px",
              background:
                "linear-gradient(135deg, rgba(19,16,42,0.8), rgba(12,10,26,0.9))",
              border: "1px solid rgba(244,114,182,0.06)",
              boxShadow: "0 8px 32px rgba(244,114,182,0.04)",
              backdropFilter: "blur(32px) saturate(1.4)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, #86EFAC, transparent)",
                opacity: 0.2,
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "#7C6FA0",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 14,
              }}
            >
              Risk Assessment
            </p>
            <RiskGauge />
          </div>

          {/* Yield Forecast */}
          <div
            className="sakura-card animate-zenIn"
            style={{
              animationDelay: "1200ms",
              borderRadius: 14,
              padding: "20px",
              background:
                "linear-gradient(135deg, rgba(19,16,42,0.8), rgba(12,10,26,0.9))",
              border: "1px solid rgba(196,181,253,0.08)",
              boxShadow: "0 8px 32px rgba(244,114,182,0.04)",
              backdropFilter: "blur(32px) saturate(1.4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, #C4B5FD, transparent)",
                opacity: 0.2,
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "#7C6FA0",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              Yield Forecast
            </p>
            <YieldSparkline />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 11, color: "#5B4F80" }}>Now</span>
              <span
                style={{
                  fontSize: 13,
                  color: "#C4B5FD",
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 500,
                }}
              >
                +6.8% est.
              </span>
            </div>
          </div>

          {/* Protocol Diversity */}
          <div
            className="sakura-card animate-zenIn"
            style={{
              animationDelay: "1320ms",
              borderRadius: 14,
              padding: "20px",
              background:
                "linear-gradient(135deg, rgba(19,16,42,0.8), rgba(12,10,26,0.9))",
              border: "1px solid rgba(244,114,182,0.06)",
              boxShadow: "0 8px 32px rgba(244,114,182,0.04)",
              backdropFilter: "blur(32px) saturate(1.4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, #A78BFA, transparent)",
                opacity: 0.2,
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "#7C6FA0",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              Protocol Diversity
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <MiniDonut />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { label: "Aave", color: "#F472B6", pct: "45%" },
                  { label: "Maple", color: "#C4B5FD", pct: "30%" },
                  { label: "Centrifuge", color: "#A78BFA", pct: "25%" },
                ].map((p) => (
                  <div
                    key={p.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: p.color,
                        boxShadow: `0 0 4px ${p.color}40`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "#7C6FA0",
                      }}
                    >
                      {p.label}
                    </span>
                    <span style={{ fontSize: 10, color: "#5B4F80" }}>
                      {p.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Global Styles ---- */}
      <style jsx>{`
        @keyframes zenIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-zenIn {
          animation: zenIn 700ms ease-out forwards;
          opacity: 0;
        }

        @keyframes sakuraBreathe {
          0%,
          100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.08);
          }
        }
        .sakura-breathe {
          animation: sakuraBreathe 6s ease-in-out infinite;
        }

        @keyframes blobDrift1 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(-30px, 20px);
          }
          66% {
            transform: translate(20px, -15px);
          }
        }
        @keyframes blobDrift2 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(25px, -20px);
          }
          66% {
            transform: translate(-15px, 30px);
          }
        }
        .animate-blobDrift1 {
          animation: blobDrift1 35s ease-in-out infinite;
        }
        .animate-blobDrift2 {
          animation: blobDrift2 40s ease-in-out infinite;
        }

        @keyframes barGrow {
          from {
            width: 0%;
          }
        }
        .animate-barGrow {
          animation: barGrow 1s ease-out forwards;
        }

        .sakura-card {
          transition: all 0.4s ease;
        }
        .sakura-card:hover {
          transform: scale(1.005);
          border-color: rgba(244, 114, 182, 0.15) !important;
          box-shadow: 0 8px 40px rgba(244, 114, 182, 0.1),
            0 0 24px rgba(244, 114, 182, 0.06);
        }

        .sakura-activity-row:hover {
          background: rgba(244, 114, 182, 0.04);
        }

        /* Ripple on interactive elements */
        button {
          position: relative;
          overflow: hidden;
        }
        button::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at var(--ripple-x, 50%) var(--ripple-y, 50%),
            rgba(244, 114, 182, 0.15),
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.4s;
        }
        button:active::after {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
