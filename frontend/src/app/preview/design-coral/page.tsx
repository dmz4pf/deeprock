"use client";

const NAV_LINKS = ["Portfolio", "Pools", "Documents", "Settings"] as const;

const STATS = [
  { icon: "\u{1F4B0}", label: "Total Value", value: "$2,847,392", change: "+3.2%", up: true },
  { icon: "\u{1F4C8}", label: "Total Yield", value: "$18,247", change: "+12.4%", up: true },
  { icon: "\u{1F3E6}", label: "Active Pools", value: "7", change: "+2", up: true },
  { icon: "\u{26A1}", label: "Avg APY", value: "6.84%", change: "-0.12%", up: false },
];

const PERIODS = ["1W", "1M", "3M", "6M", "1Y", "ALL"] as const;

const ALLOCATIONS = [
  { name: "Treasury", pct: 42, color: "#FF6B4A" },
  { name: "Real Estate", pct: 28, color: "#3B82F6" },
  { name: "Credit", pct: 18, color: "#8B5CF6" },
  { name: "Commodities", pct: 12, color: "#22C55E" },
];

const HOLDINGS = [
  { asset: "US Treasury 6M Bill", category: "Treasury", catColor: "#FF6B4A", value: "$892,400", apy: "5.28%", pnl: "+$12,847", pnlUp: true },
  { asset: "Manhattan REIT Token", category: "Real Estate", catColor: "#3B82F6", value: "$412,000", apy: "8.12%", pnl: "+$8,240", pnlUp: true },
  { asset: "Centrifuge Pool 4", category: "Credit", catColor: "#8B5CF6", value: "$287,500", apy: "9.45%", pnl: "-$3,120", pnlUp: false },
  { asset: "Swiss Gold Vault", category: "Commodities", catColor: "#22C55E", value: "$198,000", apy: "3.20%", pnl: "+$4,560", pnlUp: true },
  { asset: "UK Gilt 1Y Note", category: "Treasury", catColor: "#FF6B4A", value: "$654,200", apy: "4.95%", pnl: "+$9,102", pnlUp: true },
  { asset: "Berlin Office Fund", category: "Real Estate", catColor: "#3B82F6", value: "$403,292", apy: "7.64%", pnl: "-$1,847", pnlUp: false },
];

const POOLS = [
  { name: "Maple Treasury Pool", category: "Treasury", catColor: "#FF6B4A", apy: "5.42%", tvl: "$124.8M", capacity: 78 },
  { name: "Goldfinch Senior Pool", category: "Credit", catColor: "#8B5CF6", apy: "9.12%", tvl: "$48.2M", capacity: 45 },
  { name: "Lofty Austin REIT", category: "Real Estate", catColor: "#3B82F6", apy: "7.89%", tvl: "$18.6M", capacity: 91 },
];

const CHART_POINTS = [
  { x: 0, y: 72 }, { x: 16, y: 68 }, { x: 33, y: 74 }, { x: 50, y: 62 },
  { x: 66, y: 55 }, { x: 83, y: 58 }, { x: 100, y: 48 }, { x: 116, y: 42 },
  { x: 133, y: 46 }, { x: 150, y: 38 }, { x: 166, y: 32 }, { x: 183, y: 28 },
  { x: 200, y: 34 }, { x: 216, y: 26 }, { x: 233, y: 22 }, { x: 250, y: 18 },
  { x: 266, y: 24 }, { x: 283, y: 16 }, { x: 300, y: 12 }, { x: 316, y: 8 },
  { x: 333, y: 14 }, { x: 350, y: 6 },
];

function buildLinePath(): string {
  return CHART_POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

function buildAreaPath(): string {
  const line = buildLinePath();
  return `${line} L350,90 L0,90 Z`;
}

export default function DesignCoralPreview() {
  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Top Nav ─────────────────────────────────────────── */}
      <nav style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E5E5",
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#1A1A1A", letterSpacing: "-0.02em" }}>
            RWA Gateway
          </span>
          <div style={{ display: "flex", gap: 28 }}>
            {NAV_LINKS.map((link) => (
              <span
                key={link}
                style={{
                  fontSize: 14,
                  fontWeight: link === "Portfolio" ? 600 : 400,
                  color: link === "Portfolio" ? "#1A1A1A" : "#6B7280",
                  paddingBottom: 2,
                  borderBottom: link === "Portfolio" ? "2px solid #FF6B4A" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {link}
              </span>
            ))}
          </div>
        </div>
        <button style={{
          background: "#FF6B4A",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 8,
          padding: "8px 20px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "-0.01em",
        }}>
          Connect Wallet
        </button>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ── Welcome + Stats ──────────────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A1A1A", margin: 0, letterSpacing: "-0.03em" }}>
            Good morning, Dami
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", margin: "4px 0 24px", fontWeight: 400 }}>
            Here&apos;s your portfolio overview
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {STATS.map((stat) => (
              <div key={stat.label} style={{
                background: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: 12,
                padding: "20px 24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{stat.icon}</span>
                  <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.02em" }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: stat.up ? "#22C55E" : "#FF6B4A",
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}>
                  <span style={{ fontSize: 11 }}>{stat.up ? "\u25B2" : "\u25BC"}</span>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Chart + Allocation ────────────────────────────── */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 0.54fr", gap: 16, marginBottom: 32 }}>

          {/* Portfolio Performance */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: 12,
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                Portfolio Performance
              </h2>
              <div style={{ display: "flex", gap: 4 }}>
                {PERIODS.map((p) => (
                  <span key={p} style={{
                    fontSize: 12,
                    fontWeight: p === "6M" ? 600 : 400,
                    color: p === "6M" ? "#FFFFFF" : "#6B7280",
                    background: p === "6M" ? "#FF6B4A" : "transparent",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em" }}>
                $2,847,392
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#22C55E" }}>
                +$84,291 (3.05%)
              </span>
            </div>

            <svg viewBox="0 0 350 100" style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="coralFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FF6B4A" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={buildAreaPath()} fill="url(#coralFill)" />
              <path d={buildLinePath()} fill="none" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"].map((m) => (
                <span key={m} style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Asset Allocation */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: 12,
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: "0 0 24px" }}>
              Asset Allocation
            </h2>

            {/* Stacked Bar */}
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 32, marginBottom: 28 }}>
              {ALLOCATIONS.map((a) => (
                <div key={a.name} style={{ width: `${a.pct}%`, background: a.color, transition: "width 0.3s" }} />
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {ALLOCATIONS.map((a) => (
                <div key={a.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}>{a.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{a.pct}%</span>
                </div>
              ))}
            </div>

            {/* Total value */}
            <div style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid #E5E5E5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Total Invested</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>$2,847,392</span>
            </div>
          </div>
        </section>

        {/* ── Holdings Table ───────────────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E5E5" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Holdings</h2>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
                  {["Asset", "Category", "Value", "APY", "P&L", ""].map((h) => (
                    <th key={h} style={{
                      textAlign: "left",
                      padding: "12px 24px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.05em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOLDINGS.map((h, i) => (
                  <tr key={i} style={{ borderBottom: i < HOLDINGS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                      {h.asset}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: h.catColor,
                        background: `${h.catColor}14`,
                        borderRadius: 20,
                        padding: "3px 12px",
                      }}>
                        {h.category}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
                      {h.value}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                      {h.apy}
                    </td>
                    <td style={{
                      padding: "16px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: h.pnlUp ? "#22C55E" : "#FF6B4A",
                    }}>
                      {h.pnl}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#FF6B4A", cursor: "pointer" }}>
                        View
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Trending Pools ───────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Explore Pools
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {POOLS.map((pool) => (
              <div key={pool.name} style={{
                background: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: 12,
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}>
                <span style={{
                  alignSelf: "flex-start",
                  fontSize: 12,
                  fontWeight: 600,
                  color: pool.catColor,
                  background: `${pool.catColor}14`,
                  borderRadius: 20,
                  padding: "3px 12px",
                }}>
                  {pool.category}
                </span>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                  {pool.name}
                </h3>

                <div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 2 }}>
                    APY
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em" }}>
                    {pool.apy}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280" }}>
                  <span>TVL: <strong style={{ color: "#1A1A1A" }}>{pool.tvl}</strong></span>
                  <span>{pool.capacity}% filled</span>
                </div>

                {/* Capacity Bar */}
                <div style={{ background: "#F3F4F6", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pool.capacity}%`, height: "100%", background: pool.catColor, borderRadius: 4 }} />
                </div>

                <button style={{
                  width: "100%",
                  padding: "10px 0",
                  border: "2px solid #FF6B4A",
                  borderRadius: 8,
                  background: "transparent",
                  color: "#FF6B4A",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: 4,
                }}>
                  Invest
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{
        background: "#F3F4F6",
        borderTop: "1px solid #E5E5E5",
        padding: "24px 0",
        textAlign: "center",
      }}>
        <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400 }}>
          Powered by Avalanche
        </span>
      </footer>
    </div>
  );
}
