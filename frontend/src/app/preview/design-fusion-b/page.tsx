"use client";

/* ──────────────────────────────────────────────────────────────────────
 *  Design Fusion B — "Rose Gold Editorial"
 *
 *  50% Editorial Vault + 50% Obsidian Luxe.
 *  A luxury magazine printed on velvet. Vault's massive serif scale
 *  and editorial rules meet Luxe's warm card surfaces, shine sweeps,
 *  and iridescent borders. Sections alternate between austerity and
 *  opulence to create visual rhythm.
 * ────────────────────────────────────────────────────────────────────── */

const P = {
  velvet: "#0E0B10",
  surface: "#15121A",
  elevated: "#1C1822",
  cream: "#F0EBE0",
  rose: "#E8B4B8",
  roseDark: "#C08B8D",
  roseGlow: "rgba(232,180,184,0.15)",
  pearl: "#B8A99A",
  emerald: "#6FCF97",
  ruby: "#EB5757",
  lavender: "#C9A0DC",
  dim: "#5A5347",
  champagne: "#F5E6D3",
};

const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
const sans = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', monospace";

const HOLDINGS = [
  { asset: "US Treasury Bills 3-Mo", category: "Government Bonds", value: "$842,100", apy: "5.28%", color: P.rose },
  { asset: "Manhattan REIT Class A", category: "Real Estate", value: "$624,500", apy: "7.12%", color: P.lavender },
  { asset: "Ares Senior Secured Loan", category: "Private Credit", value: "$518,200", apy: "9.45%", color: P.champagne },
  { asset: "Prologis Logistics Fund", category: "Infrastructure", value: "$392,750", apy: "6.80%", color: P.emerald },
  { asset: "Swiss Gold Vault ETP", category: "Commodities", value: "$284,342", apy: "3.14%", color: P.pearl },
  { asset: "Carbon Credit Forward 2027", category: "ESG Assets", value: "$185,500", apy: "11.20%", color: P.rose },
];

const ALLOCATION = [
  { label: "Government Bonds", pct: 29.6, color: P.rose },
  { label: "Real Estate", pct: 21.9, color: P.lavender },
  { label: "Private Credit", pct: 18.2, color: P.champagne },
  { label: "Infrastructure", pct: 13.8, color: P.emerald },
  { label: "Commodities", pct: 10.0, color: P.pearl },
  { label: "ESG Assets", pct: 6.5, color: P.roseDark },
];

const ACTIVITY = [
  { time: "14:32", desc: "Deposited into US Treasury 3-Mo", amount: "+$50,000", up: true },
  { time: "11:07", desc: "Yield claimed from Ares Senior Loan", amount: "+$1,240", up: true },
  { time: "Yesterday", desc: "Withdrew from Prologis Logistics", amount: "-$12,000", up: false },
  { time: "Feb 8", desc: "Deposited into Manhattan REIT", amount: "+$25,000", up: true },
  { time: "Feb 7", desc: "Rebalanced portfolio allocation", amount: "", up: true },
];

const POOLS = [
  { name: "Apollo Senior Credit Fund III", category: "PRIVATE CREDIT", apy: "9.82", tvl: "$124.5M", min: "$50,000" },
  { name: "BlackRock Treasury Access", category: "GOVERNMENT BONDS", apy: "5.31", tvl: "$2.1B", min: "$25,000" },
  { name: "Brookfield Real Assets", category: "INFRASTRUCTURE", apy: "7.65", tvl: "$890M", min: "$100,000" },
];

/* ═══════════════════════════════════════════════════════════════
   VAULT PRIMITIVES — Rules, diamonds, tracked labels
   ═══════════════════════════════════════════════════════════════ */

function RoseRule() {
  return <div style={{ height: 1, background: `${P.rose}30` }} />;
}

function Diamond() {
  return <span style={{ color: P.rose, fontSize: 8, margin: "0 12px" }}>&#9670;</span>;
}

const tracked = (color: string, size = 10): React.CSSProperties => ({
  fontFamily: sans,
  fontSize: size,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color,
});

function donutGrad(segs: { pct: number; color: string }[]): string {
  let acc = 0;
  const stops = segs.flatMap((s) => {
    const start = acc;
    acc += s.pct;
    return [`${s.color} ${start}%`, `${s.color} ${acc}%`];
  });
  return `conic-gradient(${stops.join(", ")})`;
}

/* ═══════════════════════════════════════════════════════════════
   1. MASTHEAD — Rose gold thin rules (Vault) + diamond separators (Luxe)
   ═══════════════════════════════════════════════════════════════ */

function Masthead() {
  return (
    <header>
      <RoseRule />
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "18px 24px",
      }}>
        <span style={{
          fontFamily: sans, fontSize: 10, letterSpacing: "0.3em",
          textTransform: "uppercase" as const, color: P.rose, fontWeight: 300,
        }}>
          RWA Gateway
        </span>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ ...tracked(P.dim, 9), fontWeight: 300 }}>
            February 2026
          </span>
          <Diamond />
          <span style={{ ...tracked(P.dim, 9), fontWeight: 300 }}>
            Private Portfolio
          </span>
        </div>
      </div>
      <RoseRule />
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <span style={{ ...tracked(P.pearl, 9), fontWeight: 300, letterSpacing: "0.25em" }}>
          Institutional Grade
        </span>
      </div>
      <RoseRule />
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. PORTFOLIO HERO — LUXE CARD with VAULT TYPOGRAPHY
      Iridescent border, shine sweep, 72px cream serif, "2.8M" watermark
   ═══════════════════════════════════════════════════════════════ */

function PortfolioHero() {
  const stats = [
    { label: "Total Invested", value: "$2,847,392" },
    { label: "Active Pools", value: "6" },
    { label: "Avg APY", value: "6.83%", accent: true },
    { label: "Locked Capital", value: "$908,842" },
  ];

  return (
    <section style={{ padding: "48px 24px 40px" }}>
      <div
        className="fb-shine fb-iri"
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          padding: "56px 48px 44px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {/* Vault ghost watermark */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            right: -10,
            transform: "translateY(-50%)",
            fontFamily: serif,
            fontWeight: 700,
            fontSize: "clamp(120px, 18vw, 200px)",
            lineHeight: 1,
            color: `${P.rose}08`,
            letterSpacing: "-0.04em",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          2.8M
        </div>

        <div style={{ position: "relative" }}>
          <p style={{ ...tracked(P.dim), letterSpacing: "0.16em" }}>
            Total Portfolio Value
          </p>

          <h1 style={{
            fontFamily: serif,
            fontSize: "clamp(56px, 9vw, 80px)",
            fontWeight: 400,
            color: P.cream,
            lineHeight: 0.88,
            letterSpacing: "-0.02em",
            marginTop: 16,
            fontVariantNumeric: "tabular-nums",
          }}>
            $2,847,392
            <span style={{ color: P.dim, fontSize: "0.45em" }}>.00</span>
          </h1>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 20 }}>
            <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 500, color: P.emerald }}>
              +$12,847.00 this month
            </span>
            <span style={{
              fontFamily: sans, fontSize: 11, color: P.emerald,
              background: `${P.emerald}12`, padding: "3px 10px", borderRadius: 4,
            }}>
              +0.45%
            </span>
          </div>

          {/* Stats row inside the card — vertical rules between */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: 40,
            borderTop: `1px solid ${P.rose}18`,
            paddingTop: 28,
          }}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  flex: "1 1 120px",
                  paddingLeft: i > 0 ? 24 : 0,
                  borderLeft: i > 0 ? `1px solid ${P.rose}12` : undefined,
                }}
              >
                <p style={{ ...tracked(P.dim, 9), letterSpacing: "0.16em", marginBottom: 6 }}>
                  {s.label}
                </p>
                <p style={{
                  fontFamily: serif, fontSize: 24, fontWeight: 600,
                  color: s.accent ? P.rose : P.cream,
                  fontVariantNumeric: "tabular-nums", lineHeight: 1,
                }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. HOLDINGS — VAULT TREATMENT (rules, no card backgrounds)
      Asymmetric: 65% editorial list + 35% allocation Luxe card
   ═══════════════════════════════════════════════════════════════ */

function HoldingsSection() {
  return (
    <section style={{ padding: "0 24px 48px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Section masthead — Vault style */}
        <h2 style={{ ...tracked(P.rose), fontWeight: 400, marginBottom: 8 }}>
          Holdings
        </h2>
        <RoseRule />

        <div className="fb-holdings-layout">
          {/* Left 65% — Editorial list with rules, diamond bullets */}
          <div className="fb-holdings-left">
            {/* Column headers */}
            <div style={{
              display: "flex", alignItems: "baseline",
              justifyContent: "space-between",
              padding: "14px 0 10px",
              borderBottom: `1px solid ${P.rose}10`,
            }}>
              <span style={{ ...tracked(P.dim, 9) }}>Asset</span>
              <div style={{ display: "flex", gap: 32 }}>
                <span style={{ ...tracked(P.dim, 9), width: 80, textAlign: "right" as const }}>
                  Value
                </span>
                <span style={{ ...tracked(P.dim, 9), width: 56, textAlign: "right" as const }}>
                  APY
                </span>
              </div>
            </div>

            {HOLDINGS.map((h) => (
              <div
                key={h.asset}
                style={{
                  display: "flex", alignItems: "baseline",
                  justifyContent: "space-between",
                  padding: "16px 0",
                  borderBottom: `1px solid ${P.rose}08`,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                  <span style={{ color: h.color, fontSize: 7, flexShrink: 0 }}>&#9670;</span>
                  <span style={{
                    fontFamily: serif, fontSize: 15, fontWeight: 600, color: P.cream,
                    whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {h.asset}
                  </span>
                  <span style={{ fontFamily: sans, fontSize: 11, color: P.dim, flexShrink: 0 }}>
                    {h.category}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 32, flexShrink: 0, marginLeft: 16 }}>
                  <span style={{
                    fontFamily: sans, fontSize: 13, fontWeight: 500, color: P.pearl,
                    width: 80, textAlign: "right" as const, fontVariantNumeric: "tabular-nums",
                  }}>
                    {h.value}
                  </span>
                  <span style={{
                    fontFamily: serif, fontSize: 15, fontWeight: 600, color: P.emerald,
                    width: 56, textAlign: "right" as const, fontVariantNumeric: "tabular-nums",
                  }}>
                    {h.apy}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Vertical rose gold rule — Vault structure */}
          <div
            className="fb-vrule"
            style={{ width: 1, background: `${P.rose}18`, flexShrink: 0, alignSelf: "stretch" }}
          />

          {/* Right 35% — Allocation donut in a Luxe card with shine */}
          <div className="fb-holdings-right">
            <div
              className="fb-shine"
              style={{
                background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
                borderRadius: 16,
                padding: "28px 24px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                border: `1px solid ${P.roseGlow}`,
                marginTop: 14,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <p style={{ ...tracked(P.rose), marginBottom: 24 }}>Allocation</p>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <div
                  className="fb-donut"
                  style={{
                    width: 130, height: 130,
                    borderRadius: "50%",
                    position: "relative",
                    background: donutGrad(ALLOCATION.map((a) => ({ pct: a.pct, color: a.color }))),
                    boxShadow: `0 0 40px ${P.roseGlow}`,
                  }}
                >
                  <div style={{
                    position: "absolute", inset: 26, borderRadius: "50%",
                    background: P.surface,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: serif, fontSize: 14, color: P.pearl }}>
                      100%
                    </span>
                  </div>
                </div>
              </div>

              {ALLOCATION.map((a) => (
                <div
                  key={a.label}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: a.color, flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: sans, fontSize: 12, color: P.pearl, flex: 1 }}>
                    {a.label}
                  </span>
                  <span style={{
                    fontFamily: serif, fontSize: 13, color: P.cream,
                    fontWeight: 500, fontVariantNumeric: "tabular-nums",
                  }}>
                    {a.pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. ACTIVITY FEED — LUXE CARD with editorial typography inside
      Monospace timestamps, tracked labels, diamond bullets
   ═══════════════════════════════════════════════════════════════ */

function ActivityFeed() {
  return (
    <section style={{ padding: "0 24px 48px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div
          className="fb-shine"
          style={{
            background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
            borderRadius: 16,
            padding: "36px 32px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            border: `1px solid ${P.roseGlow}`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <p style={{ ...tracked(P.rose), marginBottom: 24 }}>Recent Activity</p>

          {ACTIVITY.map((a, i) => (
            <div key={i}>
              <div style={{
                display: "flex", alignItems: "flex-start",
                gap: 14, padding: "14px 0",
              }}>
                <span style={{
                  color: P.rose, fontSize: 7,
                  lineHeight: "20px", flexShrink: 0,
                }}>
                  &#9670;
                </span>
                <span style={{
                  fontFamily: mono, fontSize: 11, color: P.dim,
                  width: 72, flexShrink: 0, fontVariantNumeric: "tabular-nums",
                }}>
                  {a.time}
                </span>
                <span style={{
                  fontFamily: sans, fontSize: 13, color: P.cream,
                  fontWeight: 300, flex: 1, lineHeight: 1.4,
                }}>
                  {a.desc}
                </span>
                {a.amount && (
                  <span style={{
                    fontFamily: serif, fontSize: 14, fontWeight: 500,
                    color: a.up ? P.emerald : P.ruby, flexShrink: 0,
                  }}>
                    {a.amount}
                  </span>
                )}
              </div>
              {i < ACTIVITY.length - 1 && (
                <div style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${P.rose}18, transparent)`,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. FEATURED POOLS — MIXED
      "Opportunities" in 48px thin serif (Vault), 3 pool CARDS (Luxe)
      with iridescent borders and shine sweeps, separated by
      thin vertical rose gold rules (Vault). APY as hero numbers.
   ═══════════════════════════════════════════════════════════════ */

function FeaturedPools() {
  return (
    <section style={{ padding: "0 24px 48px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Vault-style section header: 48px thin serif */}
        <h2 style={{
          fontFamily: serif,
          fontSize: "clamp(32px, 4.5vw, 48px)",
          fontWeight: 300,
          color: P.cream,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          marginBottom: 12,
        }}>
          Opportunities
        </h2>
        <RoseRule />

        {/* Pool cards separated by vertical rose rules */}
        <div className="fb-pools-grid" style={{ display: "flex", marginTop: 32 }}>
          {POOLS.map((pool, i) => (
            <div
              key={pool.name}
              className="fb-pool-col"
              style={{ display: "flex", flex: 1 }}
            >
              {i > 0 && (
                <div
                  className="fb-pool-rule"
                  style={{
                    width: 1,
                    background: `${P.rose}18`,
                    alignSelf: "stretch",
                    margin: "0 20px",
                    flexShrink: 0,
                  }}
                />
              )}
              <div
                className={`fb-iri fb-shine fb-pool-${i}`}
                style={{
                  flex: 1,
                  background: `linear-gradient(145deg, ${P.surface}, ${P.elevated})`,
                  borderRadius: 16,
                  padding: "32px 28px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <p style={{ ...tracked(P.dim, 9), letterSpacing: "0.3em", marginBottom: 8 }}>
                  {pool.category}
                </p>
                <h3 style={{
                  fontFamily: serif, fontSize: 17, fontWeight: 600,
                  color: P.cream, lineHeight: 1.3, marginBottom: 24,
                }}>
                  {pool.name}
                </h3>

                {/* Hero APY in rose gold serif */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ ...tracked(P.dim, 9), marginBottom: 6 }}>
                    Annual Yield
                  </p>
                  <span style={{
                    fontFamily: serif, fontSize: 48, fontWeight: 700,
                    color: P.rose, letterSpacing: "-0.02em",
                    lineHeight: 1, fontVariantNumeric: "tabular-nums",
                  }}>
                    {pool.apy}
                    <span style={{ fontSize: 20, color: P.dim, fontWeight: 400, marginLeft: 2 }}>
                      %
                    </span>
                  </span>
                </div>

                {/* TVL + Minimum */}
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <p style={{ ...tracked(P.dim, 9) }}>TVL</p>
                    <p style={{
                      fontFamily: sans, fontSize: 14, color: P.pearl,
                      marginTop: 4, fontVariantNumeric: "tabular-nums",
                    }}>
                      {pool.tvl}
                    </p>
                  </div>
                  <div>
                    <p style={{ ...tracked(P.dim, 9) }}>Minimum</p>
                    <p style={{
                      fontFamily: sans, fontSize: 14, color: P.pearl,
                      marginTop: 4, fontVariantNumeric: "tabular-nums",
                    }}>
                      {pool.min}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. COLOPHON — Vault rules with Luxe diamond separators
   ═══════════════════════════════════════════════════════════════ */

function Colophon() {
  return (
    <footer style={{ padding: "0 24px 48px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <RoseRule />
        <p style={{
          textAlign: "center",
          ...tracked(P.dim),
          letterSpacing: "0.12em",
          padding: "20px 0",
        }}>
          <span style={{ color: P.rose }}>&#9670;</span>
          &ensp;Secured on Avalanche C-Chain&ensp;
          <span style={{ color: P.rose }}>&#9670;</span>
          &ensp;Cryptographically Verified&ensp;
          <span style={{ color: P.rose }}>&#9670;</span>
          &ensp;Immutable Record&ensp;
          <span style={{ color: P.rose }}>&#9670;</span>
        </p>
        <RoseRule />
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ASSEMBLY
   ═══════════════════════════════════════════════════════════════ */

export default function DesignFusionBPage() {
  return (
    <div style={{ background: P.velvet, minHeight: "100vh", fontFamily: sans, color: P.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Outfit:wght@200;300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ── Shine Sweep (from Luxe) ───────────────────────── */
        @keyframes fbShineSweep {
          0%   { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(200%) rotate(25deg); }
        }
        .fb-shine {
          position: relative;
          overflow: hidden;
        }
        .fb-shine::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 40%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(232,180,184,0.05) 35%,
            rgba(245,230,211,0.10) 50%,
            rgba(232,180,184,0.05) 65%,
            transparent 100%
          );
          transform: rotate(25deg);
          animation: fbShineSweep 6s ease-in-out infinite;
          pointer-events: none;
        }

        /* Staggered shine delays on pool cards */
        .fb-pool-0::after { animation-delay: 0s; }
        .fb-pool-1::after { animation-delay: 1.5s; }
        .fb-pool-2::after { animation-delay: 3s; }

        /* ── Iridescent Border (from Luxe) ─────────────────── */
        @property --fb-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes fbIriRotate {
          0%   { --fb-angle: 0deg; }
          100% { --fb-angle: 360deg; }
        }
        .fb-iri {
          position: relative;
          border-radius: 16px;
        }
        .fb-iri::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 17px;
          padding: 1px;
          background: conic-gradient(
            from var(--fb-angle),
            #E8B4B8, #F5E6D3, #C9A0DC, #6FCF97, #E8B4B8
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: fbIriRotate 4s linear infinite;
          pointer-events: none;
        }

        /* ── Donut Pulse ───────────────────────────────────── */
        @keyframes fbDonutPulse {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.08); }
        }
        .fb-donut {
          animation: fbDonutPulse 4s ease-in-out infinite;
        }

        /* ── Scrollbar ─────────────────────────────────────── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0E0B10; }
        ::-webkit-scrollbar-thumb {
          background: rgba(232,180,184,0.18);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(232,180,184,0.32);
        }

        ::selection {
          background: rgba(232,180,184,0.25);
          color: #F0EBE0;
        }

        * { -webkit-font-smoothing: antialiased; }

        /* ── Responsive Layout ─────────────────────────────── */
        .fb-holdings-layout { display: flex; }
        .fb-holdings-left { flex: 0 0 65%; padding-right: 40px; }
        .fb-holdings-right { flex: 0 0 calc(35% - 1px); padding-left: 40px; }
        .fb-pools-grid { display: flex; }

        @media (max-width: 900px) {
          .fb-holdings-layout { flex-direction: column !important; }
          .fb-holdings-left {
            flex: 1 1 auto !important;
            padding-right: 0 !important;
          }
          .fb-holdings-right {
            flex: 1 1 auto !important;
            padding-left: 0 !important;
            margin-top: 32px;
          }
          .fb-vrule { display: none !important; }
          .fb-pools-grid {
            flex-direction: column !important;
            gap: 20px !important;
          }
          .fb-pool-rule { display: none !important; }
          .fb-pool-col { flex: 1 1 auto !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Masthead />
        <PortfolioHero />
        <HoldingsSection />
        <ActivityFeed />
        <FeaturedPools />
        <Colophon />
      </div>
    </div>
  );
}
