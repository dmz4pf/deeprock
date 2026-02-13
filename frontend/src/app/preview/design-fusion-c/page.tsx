"use client";

/* ──────────────────────────────────────────────────────────────────────
 *  Velvet Folio — 70% Obsidian Luxe + 30% Editorial Vault
 *
 *  A luxury jewelry catalog that happens to display financial data.
 *  Luxe provides the velvet surfaces, rose gold accents, animated shines,
 *  iridescent borders, and shimmer buttons. Vault contributes oversized
 *  serif typography, editorial mastheads, asymmetric layout, watermark
 *  ghost numbers, and thin rose gold section rules.
 *
 *  Zero imports. Self-contained. "use client".
 * ────────────────────────────────────────────────────────────────────── */

const P = {
  velvet: "#0E0B10",
  surface: "#15121A",
  elevated: "#1C1822",
  rose: "#E8B4B8",
  roseDark: "#C08B8D",
  roseGlow: "rgba(232,180,184,0.15)",
  champagne: "#F5E6D3",
  pearl: "#B8A99A",
  emerald: "#6FCF97",
  ruby: "#EB5757",
  lavender: "#C9A0DC",
  watermark: "rgba(245,230,211,0.03)",
  shadow: "0 8px 32px rgba(0,0,0,0.3)",
  shadowSm: "0 4px 16px rgba(0,0,0,0.25)",
};

const serif = "'Playfair Display', Georgia, serif";
const sans = "'Outfit', -apple-system, sans-serif";

const STATS = [
  { label: "Invested", value: "$2.41M" },
  { label: "Yield Earned", value: "$18,247" },
  { label: "Active Pools", value: "7" },
  { label: "Avg APY", value: "6.84%" },
];

const HOLDINGS = [
  { asset: "US Treasury 6M Bill", category: "Government Bonds", cc: P.rose, value: "$892,400", apy: "5.28%" },
  { asset: "Manhattan REIT Class A", category: "Real Estate", cc: P.lavender, value: "$412,000", apy: "8.12%" },
  { asset: "Ares Senior Secured Loan", category: "Private Credit", cc: P.champagne, value: "$287,500", apy: "9.45%" },
  { asset: "Swiss Gold Vault ETP", category: "Commodities", cc: P.pearl, value: "$198,000", apy: "3.20%" },
  { asset: "UK Gilt 1Y Note", category: "Treasury", cc: P.rose, value: "$654,200", apy: "4.95%" },
  { asset: "Berlin Office Fund", category: "Infrastructure", cc: P.lavender, value: "$403,292", apy: "7.64%" },
];

const ALLOC = [
  { label: "Treasury", pct: 38, color: P.rose },
  { label: "Real Estate", pct: 24, color: P.champagne },
  { label: "Private Credit", pct: 18, color: P.lavender },
  { label: "Commodities", pct: 12, color: P.pearl },
  { label: "Infrastructure", pct: 8, color: P.emerald },
];

const ACTIVITY = [
  { time: "2h ago", desc: "Deposited into US Treasury 6M Bill", amount: "+$50,000", up: true },
  { time: "5h ago", desc: "Yield claimed from Ares Senior Loan", amount: "+$1,240", up: true },
  { time: "1d ago", desc: "Withdrew from Berlin Office Fund", amount: "-$12,000", up: false },
  { time: "2d ago", desc: "Deposited into Manhattan REIT", amount: "+$25,000", up: true },
];

const POOLS = [
  { name: "Maple Treasury Pool", category: "Government Bonds", apy: "5.42", tvl: "$124.8M", min: "$25,000" },
  { name: "Goldfinch Senior Pool", category: "Private Credit", apy: "9.12", tvl: "$48.2M", min: "$50,000" },
  { name: "Lofty Austin REIT", category: "Real Estate", apy: "7.89", tvl: "$18.6M", min: "$10,000" },
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

export default function DesignFusionCPage() {
  return (
    <div style={{ background: P.velvet, minHeight: "100vh", fontFamily: sans, color: P.champagne }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Outfit:wght@200;300;400;500;600&display=swap');

        /* ── Shine Sweep ─────────────────────────────────── */
        @keyframes shineSweep {
          0%   { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(200%) rotate(25deg); }
        }
        .vf-shine { position: relative; overflow: hidden; }
        .vf-shine::after {
          content: "";
          position: absolute; top: -50%; left: -50%;
          width: 40%; height: 200%;
          background: linear-gradient(90deg, transparent 0%, rgba(232,180,184,0.06) 35%, rgba(245,230,211,0.12) 50%, rgba(232,180,184,0.06) 65%, transparent 100%);
          transform: rotate(25deg);
          animation: shineSweep 6s ease-in-out infinite;
          pointer-events: none;
        }

        /* ── Iridescent Border ───────────────────────────── */
        @property --vf-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes iriRotate {
          0%   { --vf-angle: 0deg; }
          100% { --vf-angle: 360deg; }
        }
        .vf-iri { position: relative; border-radius: 16px; }
        .vf-iri::before {
          content: "";
          position: absolute; inset: -1px;
          border-radius: 17px; padding: 1px;
          background: conic-gradient(from var(--vf-angle), #E8B4B8, #F5E6D3, #C9A0DC, #6FCF97, #E8B4B8);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
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
        .vf-shim { position: relative; border-radius: 10px; overflow: hidden; }
        .vf-shim::before {
          content: "";
          position: absolute; inset: -1px;
          border-radius: 11px; padding: 1px;
          background: linear-gradient(90deg, #E8B4B8, #F5E6D3, #C9A0DC, #E8B4B8, #F5E6D3);
          background-size: 200% 100%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: shimSlide 3s linear infinite;
          pointer-events: none;
        }

        /* ── Donut Pulse ─────────────────────────────────── */
        @keyframes donutPulse {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.1); }
        }
        .vf-donut { animation: donutPulse 4s ease-in-out infinite; }

        /* ── Staggered shine delays ──────────────────────── */
        .vf-d0::after { animation-delay: 0s; }
        .vf-d1::after { animation-delay: 0.8s; }
        .vf-d2::after { animation-delay: 1.6s; }
        .vf-d3::after { animation-delay: 2.4s; }
        .vf-d4::after { animation-delay: 3.2s; }
        .vf-d5::after { animation-delay: 4.0s; }

        /* ── Watermark float ─────────────────────────────── */
        @keyframes wmDrift {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%      { transform: translate(-50%, -52%) scale(1.01); }
        }
        .vf-watermark {
          animation: wmDrift 8s ease-in-out infinite;
        }

        /* ── Responsive grids ────────────────────────────── */
        .vf-grid-hold {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .vf-grid-asym {
          display: grid;
          grid-template-columns: 65fr 35fr;
          gap: 32px;
        }
        .vf-grid-pools {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .vf-grid-asym { grid-template-columns: 1fr; }
          .vf-grid-pools { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .vf-grid-hold { grid-template-columns: 1fr; }
          .vf-grid-pools { grid-template-columns: 1fr; }
        }

        /* ── Scrollbar ───────────────────────────────────── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${P.velvet}; }
        ::-webkit-scrollbar-thumb { background: ${P.roseGlow}; border-radius: 3px; }
        * { -webkit-font-smoothing: antialiased; }
        ::selection { background: rgba(232,180,184,0.2); color: ${P.champagne}; }
      `}</style>

      {/* ═══ Section 1: Luxe Header ═══════════════════════════════════ */}
      <header style={{ padding: "0 32px" }}>
        <div style={{ height: 1, background: P.rose, opacity: 0.5 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "20px 0 8px" }}>
          <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${P.rose}88)` }} />
          <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: P.champagne, fontWeight: 300 }}>
            RWA Gateway
          </span>
          <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${P.rose}88, transparent)` }} />
        </div>
        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          <span style={{ color: P.rose, fontSize: 10 }}>&#9670;</span>
        </div>
        <div style={{ textAlign: "center", paddingBottom: 20 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: P.pearl, fontWeight: 300 }}>
            Institutional Grade
          </span>
        </div>
        <div style={{ height: 1, background: P.rose, opacity: 0.3 }} />
      </header>

      {/* ═══ Section 2: Portfolio Hero (Luxe card + Vault typography) ═ */}
      <section style={{ padding: "48px 32px" }}>
        <div
          className="vf-shine vf-iri"
          style={{
            background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
            borderRadius: 16,
            boxShadow: P.shadow,
            padding: "56px 48px 44px",
            maxWidth: 960,
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* Vault watermark ghost number */}
          <div
            className="vf-watermark"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              fontFamily: serif,
              fontWeight: 700,
              fontSize: "clamp(120px, 18vw, 200px)",
              color: P.watermark,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              pointerEvents: "none",
              userSelect: "none",
            }}
            aria-hidden="true"
          >
            2.8M
          </div>

          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            {/* Vault-style editorial masthead label */}
            <div style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: P.rose,
              fontWeight: 400,
              marginBottom: 16,
            }}>
              Portfolio Value
            </div>

            {/* Vault scale: 72px serif (vs Luxe standard 52px) */}
            <div style={{
              fontSize: "clamp(52px, 8vw, 72px)",
              fontFamily: serif,
              fontWeight: 500,
              color: P.champagne,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              $2,847,392
              <span style={{ color: P.pearl, fontSize: "0.4em", fontWeight: 400 }}>.00</span>
            </div>

            <div style={{ fontSize: 15, color: P.emerald, marginTop: 14, fontWeight: 400 }}>
              +$12,847 (+0.45%)
            </div>
          </div>

          {/* 4 stat columns with rose gold labels */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 48,
            marginTop: 40,
            flexWrap: "wrap" as const,
            position: "relative",
            zIndex: 1,
          }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: "center", minWidth: 100 }}>
                <div style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  color: P.rose,
                  marginBottom: 6,
                  fontWeight: 400,
                }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontFamily: serif, color: P.champagne, fontWeight: 500 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Section 3: Holdings — Vault asymmetric 65/35 layout ═════ */}
      <section style={{ padding: "0 32px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Vault-style editorial masthead */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <span style={{ color: P.rose, fontSize: 10 }}>&#9670;</span>
            <span style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: P.rose,
              fontWeight: 400,
            }}>
              Holdings
            </span>
            <div style={{ flex: 1, height: 1, background: `${P.rose}22` }} />
          </div>

          <div className="vf-grid-asym">
            {/* Left 65%: 6 holdings in 2-col grid */}
            <div className="vf-grid-hold">
              {HOLDINGS.map((h, i) => (
                <div
                  key={h.asset}
                  className={`vf-iri vf-shine vf-d${i}`}
                  style={{
                    background: `linear-gradient(145deg, ${P.surface}, ${P.elevated})`,
                    borderRadius: 16,
                    padding: "26px 22px",
                    boxShadow: P.shadowSm,
                  }}
                >
                  <div style={{
                    fontFamily: serif,
                    fontSize: 17,
                    color: P.champagne,
                    fontWeight: 500,
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}>
                    {h.asset}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <span style={{
                      display: "inline-block",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase" as const,
                      color: h.cc,
                      padding: "3px 10px",
                      borderRadius: 20,
                      border: `1px solid ${h.cc}33`,
                      background: `${h.cc}0D`,
                      fontWeight: 400,
                    }}>
                      {h.category}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase" as const,
                        color: P.pearl,
                        marginBottom: 4,
                      }}>
                        Value
                      </div>
                      <div style={{ fontSize: 21, fontFamily: serif, color: P.champagne, fontWeight: 500 }}>
                        {h.value}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase" as const,
                        color: P.pearl,
                        marginBottom: 4,
                      }}>
                        APY
                      </div>
                      <div style={{ fontSize: 19, fontFamily: serif, color: P.emerald, fontWeight: 500 }}>
                        {h.apy}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right 35%: Allocation donut + Activity feed */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
              {/* Allocation donut card (Luxe) */}
              <div
                className="vf-shine"
                style={{
                  background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
                  borderRadius: 16,
                  padding: "28px 24px",
                  boxShadow: P.shadow,
                  border: `1px solid ${P.roseGlow}`,
                }}
              >
                <div style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  color: P.rose,
                  fontWeight: 400,
                  marginBottom: 24,
                }}>
                  Allocation
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 24 }}>
                  <div
                    className="vf-donut"
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: "50%",
                      position: "relative",
                      background: donutGrad(ALLOC.map((a) => ({ pct: a.pct, color: a.color }))),
                      boxShadow: "0 0 40px rgba(232,180,184,0.08)",
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      inset: 28,
                      borderRadius: "50%",
                      background: P.surface,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, color: P.pearl, fontWeight: 300, letterSpacing: "0.05em" }}>
                        100%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, width: "100%" }}>
                    {ALLOC.map((a) => (
                      <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: P.pearl, flex: 1 }}>{a.label}</span>
                        <span style={{ fontSize: 13, color: P.champagne, fontFamily: serif, fontWeight: 500, minWidth: 36, textAlign: "right" }}>
                          {a.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity feed card (Luxe) */}
              <div
                className="vf-shine"
                style={{
                  background: `linear-gradient(135deg, ${P.surface}, ${P.elevated})`,
                  borderRadius: 16,
                  padding: "28px 24px",
                  boxShadow: P.shadow,
                  border: `1px solid ${P.roseGlow}`,
                  flex: 1,
                }}
              >
                <div style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  color: P.rose,
                  fontWeight: 400,
                  marginBottom: 20,
                }}>
                  Recent Activity
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const }}>
                  {ACTIVITY.map((a, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 0" }}>
                        <span style={{ color: P.rose, fontSize: 7, lineHeight: "18px", flexShrink: 0 }}>&#9670;</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: P.champagne, fontWeight: 300, lineHeight: 1.4 }}>
                            {a.desc}
                          </div>
                          <div style={{ fontSize: 10, color: P.pearl, marginTop: 2, fontWeight: 300 }}>
                            {a.time}
                          </div>
                        </div>
                        {a.amount && (
                          <span style={{
                            fontSize: 13,
                            fontFamily: serif,
                            color: a.up ? P.emerald : P.ruby,
                            fontWeight: 500,
                            flexShrink: 0,
                          }}>
                            {a.amount}
                          </span>
                        )}
                      </div>
                      {i < ACTIVITY.length - 1 && (
                        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${P.rose}18, transparent)` }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 4: Vault editorial section divider ══════════════ */}
      <section style={{ padding: "32px 32px 40px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Thin rose gold rule */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${P.rose}44, transparent)` }} />

          {/* Vault editorial heading: 48px thin-weight serif */}
          <div style={{
            textAlign: "center",
            padding: "48px 0",
            position: "relative",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}>
              <span style={{ color: P.rose, fontSize: 10 }}>&#9670;</span>
              <span style={{
                fontFamily: serif,
                fontWeight: 300,
                fontSize: "clamp(32px, 5vw, 48px)",
                color: P.champagne,
                letterSpacing: "-0.01em",
                fontStyle: "italic",
              }}>
                Opportunities
              </span>
              <span style={{ color: P.rose, fontSize: 10 }}>&#9670;</span>
            </div>
            <div style={{
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase" as const,
              color: P.pearl,
              fontWeight: 300,
              marginTop: 12,
            }}>
              Curated Institutional Pools
            </div>
          </div>

          {/* Thin rose gold rule */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${P.rose}44, transparent)` }} />
        </div>
      </section>

      {/* ═══ Section 5: Featured Pools (Luxe cards + Vault APY scale) */}
      <section style={{ padding: "0 32px 56px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="vf-grid-pools">
            {POOLS.map((p, i) => (
              <div
                key={p.name}
                className={`vf-iri vf-shine vf-d${i}`}
                style={{
                  background: `linear-gradient(145deg, ${P.surface}, ${P.elevated})`,
                  borderRadius: 16,
                  padding: "36px 28px 32px",
                  boxShadow: P.shadow,
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                {/* Vault-style category masthead */}
                <div style={{
                  fontSize: 9,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase" as const,
                  color: P.pearl,
                  fontWeight: 400,
                  marginBottom: 10,
                }}>
                  {p.category}
                </div>

                <div style={{
                  fontFamily: serif,
                  fontSize: 18,
                  color: P.champagne,
                  fontWeight: 500,
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}>
                  {p.name}
                </div>

                <div style={{ fontSize: 11, color: P.pearl, marginBottom: 24, fontWeight: 300 }}>
                  TVL {p.tvl}
                </div>

                {/* Vault-influenced scale: 36px rose gold serif APY */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{
                    fontSize: 36,
                    fontFamily: serif,
                    color: P.rose,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}>
                    {p.apy}
                  </span>
                  <span style={{ fontSize: 14, fontFamily: serif, fontWeight: 400, color: P.pearl, marginLeft: 2 }}>
                    %
                  </span>
                </div>
                <div style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  color: P.pearl,
                  marginBottom: 6,
                }}>
                  Annual Yield
                </div>

                {/* Minimum Investment */}
                <div style={{ fontSize: 11, color: P.pearl, marginBottom: 28, fontWeight: 300 }}>
                  Min {p.min}
                </div>

                {/* Luxe shimmer button */}
                <div
                  className="vf-shim"
                  style={{
                    padding: "11px 40px",
                    borderRadius: 10,
                    background: P.elevated,
                    cursor: "pointer",
                  }}
                >
                  <span style={{
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase" as const,
                    color: P.champagne,
                    fontWeight: 400,
                    position: "relative",
                    zIndex: 1,
                  }}>
                    Invest
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Section 6: Luxe ornamental footer ═══════════════════════ */}
      <footer style={{ padding: "0 32px 44px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${P.rose}44, transparent)` }} />
          <div style={{
            textAlign: "center",
            padding: "24px 0",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: P.pearl,
            fontWeight: 300,
          }}>
            <span style={{ color: P.rose }}>&#9670;</span>
            &ensp;Secured on Avalanche&ensp;
            <span style={{ color: P.rose }}>&#9670;</span>
            &ensp;Cryptographically Verified&ensp;
            <span style={{ color: P.rose }}>&#9670;</span>
            &ensp;Immutable Record&ensp;
            <span style={{ color: P.rose }}>&#9670;</span>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${P.rose}44, transparent)` }} />
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <span style={{
              fontFamily: serif,
              fontSize: 13,
              fontWeight: 300,
              fontStyle: "italic",
              color: P.pearl,
              opacity: 0.6,
            }}>
              Velvet Folio
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
