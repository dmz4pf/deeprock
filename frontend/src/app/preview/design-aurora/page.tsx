"use client";

/* ──────────────────────────────────────────────────────────────────────
 *  RWA Gateway — Aurora (Nordic) Dashboard Preview
 *  Inspired by northern lights, polar skies, and organic luminescence.
 *  Self-contained. Zero imports.
 * ────────────────────────────────────────────────────────────────────── */

const NAV_ITEMS = ["Portfolio", "Pools", "Yield", "Activity"] as const;

const STATS = [
  { label: "Total Value", value: "$2,847,392", dot: "#4ADE80" },
  { label: "Yield Earned", value: "$18,247", dot: "#22D3EE" },
  { label: "Active Pools", value: "7", dot: "#A78BFA" },
  { label: "Avg APY", value: "6.84%", dot: "#F472B6" },
];

const HOLDINGS = [
  { asset: "US Treasury 6M Bill", category: "Treasury", color: "#4ADE80", value: "$892,400", apy: "5.28%" },
  { asset: "Manhattan REIT Token", category: "Real Estate", color: "#22D3EE", value: "$412,000", apy: "8.12%" },
  { asset: "Centrifuge Pool 4", category: "Credit", color: "#A78BFA", value: "$287,500", apy: "9.45%" },
  { asset: "Swiss Gold Vault", category: "Commodities", color: "#FBBF24", value: "$198,000", apy: "3.20%" },
  { asset: "UK Gilt 1Y Note", category: "Treasury", color: "#4ADE80", value: "$654,200", apy: "4.95%" },
  { asset: "Berlin Office Fund", category: "Real Estate", color: "#22D3EE", value: "$403,292", apy: "7.64%" },
];

const YIELD_STREAMS = [
  { name: "Treasury Yield", pct: 72, gradient: "from-aurora-green to-aurora-cyan" },
  { name: "Credit Interest", pct: 54, gradient: "from-aurora-cyan to-aurora-purple" },
  { name: "Real Estate Rent", pct: 41, gradient: "from-aurora-purple to-aurora-pink" },
  { name: "Commodity Gain", pct: 28, gradient: "from-aurora-pink to-aurora-amber" },
];

const POOLS = [
  { name: "Maple Treasury Pool", apy: "5.42%", tvl: "$124.8M", accent: "#4ADE80" },
  { name: "Goldfinch Senior Pool", apy: "9.12%", tvl: "$48.2M", accent: "#A78BFA" },
  { name: "Lofty Austin REIT", apy: "7.89%", tvl: "$18.6M", accent: "#22D3EE" },
];

const ACTIVITY = [
  { time: "2m ago", action: "Deposited", amount: "+$50,000", type: "deposit" },
  { time: "1h ago", action: "Yield Claimed", amount: "+$1,247", type: "yield" },
  { time: "3h ago", action: "Withdrew", amount: "-$12,000", type: "withdraw" },
  { time: "8h ago", action: "Pool Joined", amount: "+$25,000", type: "deposit" },
  { time: "1d ago", action: "Rebalanced", amount: "$0", type: "system" },
  { time: "2d ago", action: "Deposited", amount: "+$100,000", type: "deposit" },
  { time: "3d ago", action: "Yield Claimed", amount: "+$3,892", type: "yield" },
];

const ACTIVITY_COLORS: Record<string, string> = {
  deposit: "#4ADE80",
  yield: "#22D3EE",
  withdraw: "#F472B6",
  system: "#A78BFA",
};

export default function DesignAuroraPage() {
  return (
    <>
      <style>{`
        /* ── Aurora Keyframes ────────────────────────────────── */
        @keyframes aurora-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes aurora-border {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 0.8; }
        }

        /* ── Star Field ──────────────────────────────────────── */
        .star-field {
          background-image:
            radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 25% 8%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 40% 22%, rgba(255,255,255,0.6) 50%, transparent 50%),
            radial-gradient(1px 1px at 55% 5%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 85% 12%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 15% 35%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 35% 42%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 60% 38%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 80% 32%, rgba(255,255,255,0.6) 50%, transparent 50%),
            radial-gradient(1px 1px at 92% 28%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 5% 55%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 48% 60%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 72% 52%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 88% 48%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 20% 70%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1.5px 1.5px at 45% 75%, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(1px 1px at 65% 68%, rgba(255,255,255,0.4) 50%, transparent 50%),
            radial-gradient(1px 1px at 30% 85%, rgba(255,255,255,0.3) 50%, transparent 50%),
            radial-gradient(1px 1px at 78% 82%, rgba(255,255,255,0.5) 50%, transparent 50%);
          animation: star-twinkle 8s ease-in-out infinite;
        }

        /* ── Aurora Band ─────────────────────────────────────── */
        .aurora-band {
          background: linear-gradient(
            90deg,
            rgba(74,222,128,0.12),
            rgba(34,211,238,0.18),
            rgba(167,139,250,0.15),
            rgba(244,114,182,0.12),
            rgba(251,191,36,0.08),
            rgba(74,222,128,0.12)
          );
          background-size: 300% 100%;
          animation: aurora-shift 18s ease-in-out infinite;
          filter: blur(40px);
        }

        /* ── Aurora Gradient Border ──────────────────────────── */
        .aurora-border {
          background: linear-gradient(
            90deg,
            #4ADE80, #22D3EE, #A78BFA, #F472B6, #FBBF24, #4ADE80
          );
          background-size: 300% 100%;
          animation: aurora-border 15s linear infinite;
        }

        /* ── Aurora Underline ────────────────────────────────── */
        .aurora-underline {
          background: linear-gradient(
            90deg,
            #4ADE80, #22D3EE, #A78BFA, #F472B6, #4ADE80
          );
          background-size: 200% 100%;
          animation: aurora-shift 12s ease-in-out infinite;
        }

        /* ── Luminous Text ───────────────────────────────────── */
        .glow-green  { text-shadow: 0 0 20px rgba(74,222,128,0.35); }
        .glow-cyan   { text-shadow: 0 0 20px rgba(34,211,238,0.35); }
        .glow-purple { text-shadow: 0 0 20px rgba(167,139,250,0.35); }
        .glow-pink   { text-shadow: 0 0 20px rgba(244,114,182,0.35); }
        .glow-amber  { text-shadow: 0 0 20px rgba(251,191,36,0.35); }

        /* ── Yield Bar Gradients ─────────────────────────────── */
        .bar-green-cyan {
          background: linear-gradient(90deg, #4ADE80, #22D3EE);
        }
        .bar-cyan-purple {
          background: linear-gradient(90deg, #22D3EE, #A78BFA);
        }
        .bar-purple-pink {
          background: linear-gradient(90deg, #A78BFA, #F472B6);
        }
        .bar-pink-amber {
          background: linear-gradient(90deg, #F472B6, #FBBF24);
        }

        /* ── Card Hover ──────────────────────────────────────── */
        .aurora-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .aurora-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 30px rgba(74,222,128,0.1), 0 8px 32px rgba(0,0,0,0.3);
        }

        /* ── Horizontal Scroll ───────────────────────────────── */
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── Aurora Gradient Fill for Footer ──────────────────── */
        .aurora-shimmer {
          background: linear-gradient(90deg, #4ADE80, #22D3EE, #A78BFA, #F472B6, #4ADE80);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: aurora-shift 10s ease-in-out infinite;
        }
      `}</style>

      <div
        className="relative min-h-screen overflow-x-hidden"
        style={{ background: "#070B14", color: "#E2E8F0" }}
      >
        {/* ── Star Field Background ───────────────────────── */}
        <div className="star-field pointer-events-none fixed inset-0 z-0" />

        {/* ── Aurora Band (top 30%) ───────────────────────── */}
        <div
          className="aurora-band pointer-events-none fixed left-0 right-0 top-0 z-0"
          style={{ height: "35vh" }}
        />

        {/* ── Content Container ───────────────────────────── */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* ══ HEADER ═══════════════════════════════════════ */}
          <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                className="text-3xl font-light tracking-wide sm:text-4xl"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                RWA Gateway
              </h1>
              <div
                className="aurora-underline mt-2"
                style={{ height: 2, width: 160, borderRadius: 1 }}
              />
            </div>

            <nav className="flex gap-1">
              {NAV_ITEMS.map((item, i) => (
                <button
                  key={item}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: i === 0 ? "rgba(74,222,128,0.1)" : "transparent",
                    color: i === 0 ? "#4ADE80" : "#475569",
                    boxShadow: i === 0 ? "0 0 16px rgba(74,222,128,0.12)" : "none",
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </header>

          {/* ══ PORTFOLIO PANORAMA ════════════════════════════ */}
          <section className="mb-10">
            <div className="relative overflow-hidden" style={{ borderRadius: 24 }}>
              {/* Animated aurora border */}
              <div
                className="aurora-border absolute inset-0"
                style={{ borderRadius: 24 }}
              />
              {/* Inner card */}
              <div
                className="relative m-[1.5px] overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(12,18,32,0.95) 0%, #0C1220 40%)",
                  borderRadius: 22.5,
                }}
              >
                {/* Top light leak */}
                <div
                  className="aurora-band pointer-events-none absolute left-0 right-0 top-0"
                  style={{ height: 120, opacity: 0.5, filter: "blur(50px)" }}
                />

                <div className="relative px-6 py-8 sm:px-10 sm:py-10">
                  <p className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: "#475569" }}>
                    Total Portfolio Value
                  </p>
                  <p
                    className="glow-green mb-8 text-5xl font-light tracking-tight sm:text-6xl"
                    style={{ color: "#fff" }}
                  >
                    $2,847,392
                  </p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                    {STATS.map((s) => (
                      <div key={s.label} className="flex items-start gap-3">
                        <div
                          className="mt-1.5 shrink-0 rounded-full"
                          style={{
                            width: 8,
                            height: 8,
                            background: s.dot,
                            boxShadow: `0 0 10px ${s.dot}44`,
                          }}
                        />
                        <div>
                          <p className="text-xs font-medium" style={{ color: "#475569" }}>
                            {s.label}
                          </p>
                          <p className="text-lg font-medium" style={{ color: "#E2E8F0" }}>
                            {s.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══ HOLDINGS GRID ═════════════════════════════════ */}
          <section className="mb-10">
            <h2 className="mb-5 text-lg font-medium tracking-wide" style={{ color: "#94A3B8" }}>
              Holdings
            </h2>

            {/* Mobile: horizontal scroll / Desktop: 3x2 grid */}
            <div className="scroll-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
              {HOLDINGS.map((h) => (
                <div
                  key={h.asset}
                  className="aurora-card relative shrink-0 overflow-hidden"
                  style={{
                    background: "#0C1220",
                    borderRadius: 20,
                    border: "1px solid rgba(74,222,128,0.06)",
                    minWidth: 260,
                  }}
                >
                  {/* Aurora top edge */}
                  <div
                    className="aurora-border"
                    style={{ height: 3, borderRadius: "20px 20px 0 0" }}
                  />

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>
                        {h.asset}
                      </p>
                    </div>

                    <span
                      className="mb-4 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        background: `${h.color}18`,
                        color: h.color,
                      }}
                    >
                      {h.category}
                    </span>

                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-xl font-medium" style={{ color: "#E2E8F0" }}>
                        {h.value}
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: h.color,
                          textShadow: `0 0 14px ${h.color}55`,
                        }}
                      >
                        {h.apy} APY
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ TWO-COLUMN: YIELD + POOLS ═════════════════════ */}
          <section className="mb-10 grid gap-6 lg:grid-cols-2">
            {/* ── Yield Streams ────────────────────────────── */}
            <div
              className="overflow-hidden"
              style={{
                background: "#0C1220",
                borderRadius: 20,
                border: "1px solid rgba(74,222,128,0.06)",
              }}
            >
              <div className="p-6">
                <h3 className="mb-6 text-base font-medium tracking-wide" style={{ color: "#94A3B8" }}>
                  Yield Streams
                </h3>

                <div className="flex flex-col gap-5">
                  {YIELD_STREAMS.map((ys, i) => {
                    const barClasses = [
                      "bar-green-cyan",
                      "bar-cyan-purple",
                      "bar-purple-pink",
                      "bar-pink-amber",
                    ];
                    return (
                      <div key={ys.name}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: "#E2E8F0" }}>
                            {ys.name}
                          </span>
                          <span className="text-sm tabular-nums" style={{ color: "#475569" }}>
                            {ys.pct}%
                          </span>
                        </div>
                        <div
                          className="overflow-hidden"
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <div
                            className={barClasses[i]}
                            style={{
                              width: `${ys.pct}%`,
                              height: "100%",
                              borderRadius: 4,
                              boxShadow: "0 0 12px rgba(74,222,128,0.15)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Pool Spotlight ───────────────────────────── */}
            <div
              className="overflow-hidden"
              style={{
                background: "#0C1220",
                borderRadius: 20,
                border: "1px solid rgba(74,222,128,0.06)",
              }}
            >
              <div className="p-6">
                <h3 className="mb-6 text-base font-medium tracking-wide" style={{ color: "#94A3B8" }}>
                  Pool Spotlight
                </h3>

                <div className="flex flex-col gap-4">
                  {POOLS.map((p) => (
                    <div
                      key={p.name}
                      className="aurora-card flex items-center justify-between overflow-hidden"
                      style={{
                        background: "#111827",
                        borderRadius: 16,
                        padding: "16px 20px",
                        borderLeft: `3px solid ${p.accent}`,
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: "#475569" }}>
                          TVL {p.tvl}
                        </p>
                      </div>
                      <p
                        className="text-lg font-semibold tabular-nums"
                        style={{
                          color: p.accent,
                          textShadow: `0 0 16px ${p.accent}44`,
                        }}
                      >
                        {p.apy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══ ACTIVITY RIBBON ═══════════════════════════════ */}
          <section className="mb-14">
            <h2 className="mb-5 text-lg font-medium tracking-wide" style={{ color: "#94A3B8" }}>
              Recent Activity
            </h2>

            <div className="scroll-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {ACTIVITY.map((a, i) => {
                const dotColor = ACTIVITY_COLORS[a.type] ?? "#475569";
                return (
                  <div
                    key={i}
                    className="flex shrink-0 items-center gap-3"
                    style={{
                      background: "#0C1220",
                      borderRadius: 40,
                      padding: "10px 18px 10px 14px",
                      border: "1px solid rgba(74,222,128,0.06)",
                    }}
                  >
                    <div
                      className="shrink-0 rounded-full"
                      style={{
                        width: 7,
                        height: 7,
                        background: dotColor,
                        boxShadow: `0 0 8px ${dotColor}66`,
                      }}
                    />
                    <span className="whitespace-nowrap text-xs" style={{ color: "#475569" }}>
                      {a.time}
                    </span>
                    <span className="whitespace-nowrap text-sm font-medium" style={{ color: "#E2E8F0" }}>
                      {a.action}
                    </span>
                    <span
                      className="whitespace-nowrap text-sm font-semibold tabular-nums"
                      style={{
                        color: dotColor,
                        textShadow: `0 0 12px ${dotColor}44`,
                      }}
                    >
                      {a.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══ FOOTER ═══════════════════════════════════════ */}
          <footer className="border-t pb-10 pt-8" style={{ borderColor: "rgba(74,222,128,0.06)" }}>
            <p className="text-center text-sm">
              <span className="aurora-shimmer font-medium">Northern Protocol</span>
              <span style={{ color: "#475569" }}> · Avalanche C-Chain</span>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
