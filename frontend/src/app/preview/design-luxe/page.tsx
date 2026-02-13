"use client";

/* ──────────────────────────────────────────────────────────────────────
 *  RWA Gateway — Dark Opulence Dashboard Preview
 *  Black velvet jewelry box aesthetic. Rose gold accents.
 *  Animated shine sweeps, iridescent borders, soft floating shadows.
 *  Zero external imports. Self-contained.
 * ────────────────────────────────────────────────────────────────────── */

const P = {
  velvet: "#0E0B10",
  surface: "#15121A",
  elevated: "#1C1822",
  rose: "#E8B4B8",
  roseGlow: "rgba(232,180,184,0.15)",
  champagne: "#F5E6D3",
  pearl: "#B8A99A",
  emerald: "#6FCF97",
  ruby: "#EB5757",
  shadow: "0 8px 32px rgba(0,0,0,0.4)",
  shadowSm: "0 4px 16px rgba(0,0,0,0.3)",
};

const serif = "'Playfair Display', Georgia, serif";

const STATS = [
  { label: "Invested", value: "$2.41M" },
  { label: "Yield Earned", value: "$18,247" },
  { label: "Active Pools", value: "7" },
  { label: "Avg APY", value: "6.84%" },
];

const HOLDINGS = [
  { asset: "US Treasury 6M Bill", category: "Government Bonds", cc: "#E8B4B8", value: "$892,400", apy: "5.28%" },
  { asset: "Manhattan REIT Class A", category: "Real Estate", cc: "#C9A0DC", value: "$412,000", apy: "8.12%" },
  { asset: "Ares Senior Secured Loan", category: "Private Credit", cc: "#F5E6D3", value: "$287,500", apy: "9.45%" },
  { asset: "Swiss Gold Vault ETP", category: "Commodities", cc: "#B8A99A", value: "$198,000", apy: "3.20%" },
  { asset: "UK Gilt 1Y Note", category: "Treasury", cc: "#E8B4B8", value: "$654,200", apy: "4.95%" },
  { asset: "Berlin Office Fund", category: "Infrastructure", cc: "#C9A0DC", value: "$403,292", apy: "7.64%" },
];

const ALLOC = [
  { label: "Treasury", pct: 38, color: "#E8B4B8" },
  { label: "Real Estate", pct: 24, color: "#F5E6D3" },
  { label: "Private Credit", pct: 18, color: "#C9A0DC" },
  { label: "Commodities", pct: 12, color: "#B8A99A" },
  { label: "Infrastructure", pct: 8, color: "#6FCF97" },
];

const ACTIVITY = [
  { time: "2h ago", desc: "Deposited into US Treasury 6M Bill", amount: "+$50,000", up: true },
  { time: "5h ago", desc: "Yield claimed from Ares Senior Loan", amount: "+$1,240", up: true },
  { time: "1d ago", desc: "Withdrew from Berlin Office Fund", amount: "-$12,000", up: false },
  { time: "2d ago", desc: "Deposited into Manhattan REIT", amount: "+$25,000", up: true },
  { time: "3d ago", desc: "Rebalanced portfolio allocation", amount: "", up: true },
];

const POOLS = [
  { name: "Maple Treasury Pool", apy: "5.42%", tvl: "$124.8M" },
  { name: "Goldfinch Senior Pool", apy: "9.12%", tvl: "$48.2M" },
  { name: "Lofty Austin REIT", apy: "7.89%", tvl: "$18.6M" },
];

function donutGrad(segs: { pct: number; color: string }[]): string {
  let acc = 0;
  const stops = segs.flatMap((s) => {
    const start = acc;
    acc += s.pct;
    return [`${s.color} ${start}%`, `${s.color} ${acc}%`];
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function DesignLuxePreview() {
  return (
    <div
      style={{
        background: P.velvet,
        minHeight: "100vh",
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
        color: P.champagne,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Outfit:wght@200;300;400;500;600&display=swap');

        /* ── Shine Sweep ─────────────────────────────────── */
        @keyframes shineSweep {
          0%   { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(200%) rotate(25deg); }
        }
        .lx-shine {
          position: relative;
          overflow: hidden;
        }
        .lx-shine::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 40%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(232,180,184,0.06) 35%,
            rgba(245,230,211,0.12) 50%,
            rgba(232,180,184,0.06) 65%,
            transparent 100%
          );
          transform: rotate(25deg);
          animation: shineSweep 6s ease-in-out infinite;
          pointer-events: none;
        }

        /* ── Iridescent Border ───────────────────────────── */
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes iriRotate {
          0%   { --angle: 0deg; }
          100% { --angle: 360deg; }
        }
        .lx-iri {
          position: relative;
          border-radius: 16px;
        }
        .lx-iri::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 17px;
          padding: 1px;
          background: conic-gradient(
            from var(--angle),
            #E8B4B8, #F5E6D3, #C9A0DC, #6FCF97, #E8B4B8
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: iriRotate 4s linear infinite;
          pointer-events: none;
        }

        /* ── Shimmer Border (buttons) ────────────────────── */
        @keyframes shimSlide {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .lx-shim {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
        }
        .lx-shim::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 11px;
          padding: 1px;
          background: linear-gradient(
            90deg,
            #E8B4B8, #F5E6D3, #C9A0DC, #E8B4B8, #F5E6D3
          );
          background-size: 200% 100%;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: shimSlide 3s linear infinite;
          pointer-events: none;
        }

        /* ── Donut Pulse ─────────────────────────────────── */
        @keyframes donutPulse {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.08); }
        }
        .lx-donut {
          animation: donutPulse 4s ease-in-out infinite;
        }

        /* ── Staggered shine on holding cards ────────────── */
        .lx-hold-0 .lx-shine::after { animation-delay: 0s; }
        .lx-hold-1 .lx-shine::after { animation-delay: 1s; }
        .lx-hold-2 .lx-shine::after { animation-delay: 2s; }
        .lx-hold-3 .lx-shine::after { animation-delay: 3s; }
        .lx-hold-4 .lx-shine::after { animation-delay: 4s; }
        .lx-hold-5 .lx-shine::after { animation-delay: 5s; }

        /* ── Responsive grid ─────────────────────────────── */
        .lx-grid3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .lx-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        @media (max-width: 1024px) {
          .lx-grid3 { grid-template-columns: repeat(2, 1fr); }
          .lx-grid2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .lx-grid3 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Section 1: Luxe Header ─────────────────────────────────────── */}
      <header style={{ padding: "0 32px" }}>
        <div style={{ height: 1, background: P.rose, opacity: 0.5 }} />
        <div style={{ textAlign: "center", padding: "18px 0 6px" }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: P.champagne,
              fontWeight: 300,
            }}
          >
            RWA Gateway
          </span>
        </div>
        <div style={{ textAlign: "center", paddingBottom: 6 }}>
          <span style={{ color: P.rose, fontSize: 10 }}>&#9670;</span>
        </div>
        <div style={{ textAlign: "center", paddingBottom: 18 }}>
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: P.pearl,
              fontWeight: 300,
            }}
          >
            Institutional Grade
          </span>
        </div>
        <div style={{ height: 1, background: P.rose, opacity: 0.3 }} />
      </header>

      {/* ── Section 2: Portfolio Statement ──────────────────────────────── */}
      <section style={{ padding: "40px 32px" }}>
        <div
          className="lx-shine"
          style={{
            background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
            borderRadius: 16,
            border: `1px solid ${P.roseGlow}`,
            boxShadow: P.shadow,
            padding: "48px 40px 36px",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: P.rose,
                fontWeight: 400,
                marginBottom: 12,
              }}
            >
              Portfolio Value
            </div>
            <div
              style={{
                fontSize: 52,
                fontFamily: serif,
                fontWeight: 500,
                color: P.champagne,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              $2,847,392
            </div>
            <div
              style={{
                fontSize: 15,
                color: P.emerald,
                marginTop: 10,
                fontWeight: 400,
              }}
            >
              +$12,847 (+0.45%)
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 48,
              marginTop: 36,
              flexWrap: "wrap",
            }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: "center", minWidth: 100 }}>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: P.rose,
                    marginBottom: 6,
                    fontWeight: 400,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontFamily: serif,
                    color: P.champagne,
                    fontWeight: 500,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Holdings ─────────────────────────────────────────── */}
      <section style={{ padding: "0 32px 40px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <SectionHeader label="Holdings" />
          <div className="lx-grid3">
            {HOLDINGS.map((h, i) => (
              <div
                key={h.asset}
                className={`lx-iri lx-shine lx-hold-${i}`}
                style={{
                  background: `linear-gradient(145deg, ${P.surface}, ${P.elevated})`,
                  borderRadius: 16,
                  padding: "28px 24px",
                  boxShadow: P.shadowSm,
                }}
              >
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 18,
                    color: P.champagne,
                    fontWeight: 500,
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {h.asset}
                </div>
                <div style={{ marginBottom: 18 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: h.cc,
                      padding: "4px 12px",
                      borderRadius: 20,
                      border: `1px solid ${h.cc}33`,
                      background: `${h.cc}0D`,
                      fontWeight: 400,
                    }}
                  >
                    {h.category}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: P.pearl,
                        marginBottom: 4,
                      }}
                    >
                      Value
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontFamily: serif,
                        color: P.champagne,
                        fontWeight: 500,
                      }}
                    >
                      {h.value}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: P.pearl,
                        marginBottom: 4,
                      }}
                    >
                      APY
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontFamily: serif,
                        color: P.emerald,
                        fontWeight: 500,
                      }}
                    >
                      {h.apy}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Allocation + Activity ───────────────────────────── */}
      <section style={{ padding: "0 32px 40px" }}>
        <div className="lx-grid2" style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Left: Allocation */}
          <div
            className="lx-shine"
            style={{
              background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
              borderRadius: 16,
              padding: "32px 28px",
              boxShadow: P.shadow,
              border: `1px solid ${P.roseGlow}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: P.rose,
                fontWeight: 400,
                marginBottom: 28,
              }}
            >
              Allocation
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div
                className="lx-donut"
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  flexShrink: 0,
                  position: "relative",
                  background: donutGrad(
                    ALLOC.map((a) => ({ pct: a.pct, color: a.color }))
                  ),
                  boxShadow: "0 0 40px rgba(232,180,184,0.08)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 28,
                    borderRadius: "50%",
                    background: P.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: P.pearl,
                      fontWeight: 300,
                      letterSpacing: "0.05em",
                    }}
                  >
                    100%
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ALLOC.map((a) => (
                  <div
                    key={a.label}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: a.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: P.pearl, flex: 1 }}>
                      {a.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: P.champagne,
                        fontFamily: serif,
                        fontWeight: 500,
                        minWidth: 36,
                        textAlign: "right",
                      }}
                    >
                      {a.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Recent Activity */}
          <div
            className="lx-shine"
            style={{
              background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
              borderRadius: 16,
              padding: "32px 28px",
              boxShadow: P.shadow,
              border: `1px solid ${P.roseGlow}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: P.rose,
                fontWeight: 400,
                marginBottom: 24,
              }}
            >
              Recent Activity
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ACTIVITY.map((a, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px 0",
                    }}
                  >
                    <span
                      style={{
                        color: P.rose,
                        fontSize: 8,
                        lineHeight: "20px",
                        flexShrink: 0,
                      }}
                    >
                      &#9670;
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: P.champagne,
                          fontWeight: 300,
                          lineHeight: 1.4,
                        }}
                      >
                        {a.desc}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: P.pearl,
                          marginTop: 3,
                          fontWeight: 300,
                        }}
                      >
                        {a.time}
                      </div>
                    </div>
                    {a.amount && (
                      <span
                        style={{
                          fontSize: 14,
                          fontFamily: serif,
                          color: a.up ? P.emerald : P.ruby,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {a.amount}
                      </span>
                    )}
                  </div>
                  {i < ACTIVITY.length - 1 && (
                    <div
                      style={{
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${P.rose}22, transparent)`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Featured Pools ──────────────────────────────────── */}
      <section style={{ padding: "0 32px 48px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <SectionHeader label="Featured Pools" />
          <div className="lx-grid3">
            {POOLS.map((p) => (
              <div
                key={p.name}
                className="lx-shine"
                style={{
                  background: `linear-gradient(145deg, ${P.surface}, ${P.elevated})`,
                  borderRadius: 16,
                  padding: "32px 28px",
                  boxShadow: P.shadow,
                  border: `1px solid ${P.roseGlow}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 18,
                    color: P.champagne,
                    fontWeight: 500,
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: P.pearl,
                    marginBottom: 20,
                    fontWeight: 300,
                  }}
                >
                  TVL {p.tvl}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontFamily: serif,
                    color: P.rose,
                    fontWeight: 600,
                    marginBottom: 24,
                    lineHeight: 1,
                  }}
                >
                  {p.apy}
                  <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>
                    APY
                  </span>
                </div>
                <div
                  className="lx-shim"
                  style={{
                    padding: "10px 36px",
                    borderRadius: 10,
                    background: P.elevated,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: P.champagne,
                      fontWeight: 400,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    Invest
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ padding: "0 32px 40px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ height: 1, background: P.rose, opacity: 0.25 }} />
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: P.pearl,
              fontWeight: 300,
            }}
          >
            <span style={{ color: P.rose }}>&#9670;</span>
            &ensp;Secured on Avalanche&ensp;
            <span style={{ color: P.rose }}>&#9670;</span>
            &ensp;Verified&ensp;
            <span style={{ color: P.rose }}>&#9670;</span>
            &ensp;Immutable&ensp;
            <span style={{ color: P.rose }}>&#9670;</span>
          </div>
          <div style={{ height: 1, background: P.rose, opacity: 0.25 }} />
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
      }}
    >
      <span style={{ color: P.rose, fontSize: 10 }}>&#9670;</span>
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: P.rose,
          fontWeight: 400,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: `${P.rose}22` }} />
    </div>
  );
}
