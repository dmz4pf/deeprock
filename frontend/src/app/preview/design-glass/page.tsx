"use client";

/* ──────────────────────────────────────────────────────────────────────
 *  RWA Gateway — Luminous Glass Dashboard Preview
 *  Self-contained glassmorphism showcase. Zero external imports.
 * ────────────────────────────────────────────────────────────────────── */

// ── Mock Data ─────────────────────────────────────────────────────────

const NAV_ITEMS = ["Portfolio", "Pools", "Documents"] as const;

const STATS = [
  { label: "Total Invested", value: "$2,412,800", icon: "circle-violet", color: "#8B5CF6" },
  { label: "Yield Earned", value: "$434,592", icon: "circle-emerald", color: "#34D399" },
  { label: "Active Pools", value: "12", icon: "circle-sky", color: "#38BDF8" },
  { label: "Documents Sealed", value: "47", icon: "circle-pink", color: "#F472B6" },
];

const HOLDINGS = [
  { name: "US Treasury Bond Fund", category: "Fixed Income", value: "$812,400", apy: "5.2%", pct: 82, color: "#8B5CF6" },
  { name: "Tokenized Gold ETF", category: "Commodity", value: "$524,100", apy: "3.8%", pct: 68, color: "#F59E0B" },
  { name: "Real Estate LP Token", category: "Real Estate", value: "$418,300", apy: "7.1%", pct: 54, color: "#F472B6" },
  { name: "Carbon Credit Pool", category: "ESG", value: "$392,000", apy: "4.6%", pct: 48, color: "#34D399" },
  { name: "Private Credit Fund", category: "Credit", value: "$300,592", apy: "9.3%", pct: 36, color: "#38BDF8" },
];

const ALLOCATION = [
  { label: "Fixed Income", pct: 33, color: "#8B5CF6" },
  { label: "Commodity", pct: 22, color: "#F59E0B" },
  { label: "Real Estate", pct: 17, color: "#F472B6" },
  { label: "ESG", pct: 16, color: "#34D399" },
  { label: "Credit", pct: 12, color: "#38BDF8" },
];

const ACTIVITY = [
  { action: "Deposited", detail: "US Treasury Bond Fund", amount: "+$50,000", time: "2h ago", color: "#34D399" },
  { action: "Yield claimed", detail: "Carbon Credit Pool", amount: "+$1,240", time: "5h ago", color: "#8B5CF6" },
  { action: "Withdrew", detail: "Real Estate LP Token", amount: "-$12,000", time: "1d ago", color: "#F472B6" },
  { action: "Document signed", detail: "KYC Renewal", amount: "", time: "2d ago", color: "#38BDF8" },
];

const POOLS = [
  { name: "Avalanche T-Bill Vault", category: "Fixed Income", tvl: "$48.2M", apy: "5.4%", gradient: "from-violet-500/20 to-indigo-500/20" },
  { name: "DeFi Real Estate Fund", category: "Real Estate", tvl: "$31.7M", apy: "7.8%", gradient: "from-pink-500/20 to-rose-500/20" },
  { name: "Green Bond Pool", category: "ESG", tvl: "$22.1M", apy: "4.2%", gradient: "from-emerald-500/20 to-teal-500/20" },
];

// ── Helpers ────────────────────────────────────────────────────────────

function conicGradient(segments: { pct: number; color: string }[]): string {
  let acc = 0;
  const stops = segments.flatMap((s) => {
    const start = acc;
    acc += s.pct;
    return [`${s.color} ${start}%`, `${s.color} ${acc}%`];
  });
  return `conic-gradient(${stops.join(", ")})`;
}

// ── Components ────────────────────────────────────────────────────────

function GlassNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4 bg-white/[0.04] backdrop-blur-2xl border-b border-white/[0.06]">
      <span className="text-[15px] font-semibold tracking-wide text-slate-50/90">
        RWA Gateway
      </span>

      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item}
            className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ${
              i === 0
                ? "text-white bg-white/[0.1] shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                : "text-slate-50/50 hover:text-slate-50/80 hover:bg-white/[0.04]"
            }`}
          >
            {i === 0 && (
              <span className="absolute inset-0 rounded-full bg-violet-500/[0.08] blur-sm" />
            )}
            <span className="relative">{item}</span>
          </button>
        ))}
      </div>

      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400/60 to-sky-400/60 ring-2 ring-white/[0.08]" />
    </nav>
  );
}

function HeroStats() {
  return (
    <section className="glass-card p-8">
      <p className="text-sm font-medium text-slate-50/40 tracking-widest uppercase mb-1">
        Portfolio Value
      </p>
      <h1 className="text-5xl font-bold text-white tracking-tight mb-8">
        $2,847,392
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}18` }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: s.color, boxShadow: `0 0 10px ${s.color}80` }}
              />
            </div>
            <div>
              <p className="text-[13px] text-slate-50/40">{s.label}</p>
              <p className="text-lg font-semibold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HoldingsTable() {
  return (
    <div className="glass-card p-6 flex flex-col">
      <h2 className="text-sm font-semibold text-slate-50/70 tracking-wide uppercase mb-5">
        Your Holdings
      </h2>

      <div className="flex flex-col gap-3">
        {HOLDINGS.map((h) => (
          <div
            key={h.name}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors duration-200"
          >
            <div
              className="w-2 h-10 rounded-full shrink-0"
              style={{ background: h.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{h.name}</p>
              <span
                className="inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${h.color}18`, color: h.color }}
              >
                {h.category}
              </span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-white">{h.value}</p>
              <p className="text-xs text-emerald-400/80">{h.apy} APY</p>
            </div>
            <div className="w-20 shrink-0">
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${h.pct}%`,
                    background: `linear-gradient(90deg, ${h.color}80, ${h.color})`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllocationChart() {
  const conic = conicGradient(ALLOCATION);

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-slate-50/70 tracking-wide uppercase mb-5">
        Allocation
      </h2>

      <div className="flex justify-center mb-5">
        <div className="relative w-36 h-36">
          <div
            className="w-full h-full rounded-full"
            style={{ background: conic }}
          />
          <div className="absolute inset-3 rounded-full bg-[#12102e] flex items-center justify-center">
            <span className="text-xs font-semibold text-slate-50/50">100%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {ALLOCATION.map((a) => (
          <div key={a.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: a.color }}
              />
              <span className="text-xs text-slate-50/50">{a.label}</span>
            </div>
            <span className="text-xs font-medium text-slate-50/70">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-slate-50/70 tracking-wide uppercase mb-5">
        Recent Activity
      </h2>

      <div className="flex flex-col gap-3">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{ background: a.color, boxShadow: `0 0 8px ${a.color}60` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/80">
                <span className="font-medium text-white">{a.action}</span>{" "}
                {a.detail}
              </p>
              <p className="text-[11px] text-slate-50/30 mt-0.5">{a.time}</p>
            </div>
            {a.amount && (
              <span
                className="text-xs font-semibold shrink-0"
                style={{ color: a.amount.startsWith("+") ? "#34D399" : "#F472B6" }}
              >
                {a.amount}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PoolCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {POOLS.map((p) => (
        <div
          key={p.name}
          className="group relative rounded-2xl p-[1px] transition-transform duration-300 hover:-translate-y-1"
        >
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 via-sky-500/10 to-pink-500/20 opacity-40 group-hover:opacity-80 transition-opacity duration-300" />

          <div className="relative rounded-2xl bg-[#13102c]/90 backdrop-blur-xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-50/50">
                {p.category}
              </span>
              <span className="text-[11px] text-slate-50/30">Featured</span>
            </div>

            <h3 className="text-[15px] font-semibold text-white mb-4 leading-snug">
              {p.name}
            </h3>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] text-slate-50/35 mb-0.5">TVL</p>
                <p className="text-lg font-bold text-white">{p.tvl}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-50/35 mb-0.5">APY</p>
                <p className="text-2xl font-bold text-emerald-400">{p.apy}</p>
              </div>
            </div>

            {/* Hover glow */}
            <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_40px_rgba(139,92,246,0.12)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BottomGlow() {
  return (
    <footer className="flex flex-col items-center gap-3 pt-8 pb-12">
      <div className="w-48 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
      <p className="text-[11px] font-medium tracking-[0.2em] text-slate-50/25 uppercase">
        Secured on Avalanche
      </p>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function DesignGlassPreview() {
  return (
    <>
      <style>{`
        /* ── Gradient Mesh Background ───────────────────────────── */
        .glass-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: #0F0B2E;
          overflow: hidden;
        }

        .glass-bg::before,
        .glass-bg::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.5;
          will-change: transform;
        }

        .glass-bg::before {
          width: 800px;
          height: 800px;
          top: -200px;
          left: -100px;
          background: radial-gradient(circle, #4c1d95 0%, transparent 70%);
          animation: meshFloat1 18s ease-in-out infinite;
        }

        .glass-bg::after {
          width: 700px;
          height: 700px;
          bottom: -150px;
          right: -100px;
          background: radial-gradient(circle, #0e7490 0%, transparent 70%);
          animation: meshFloat2 22s ease-in-out infinite;
        }

        .mesh-blob-3 {
          position: absolute;
          width: 600px;
          height: 600px;
          top: 40%;
          left: 50%;
          border-radius: 50%;
          background: radial-gradient(circle, #581c87 0%, transparent 70%);
          filter: blur(120px);
          opacity: 0.35;
          animation: meshFloat3 25s ease-in-out infinite;
          will-change: transform;
        }

        .mesh-blob-4 {
          position: absolute;
          width: 500px;
          height: 500px;
          top: 10%;
          right: 20%;
          border-radius: 50%;
          background: radial-gradient(circle, #1e3a5f 0%, transparent 70%);
          filter: blur(100px);
          opacity: 0.4;
          animation: meshFloat4 20s ease-in-out infinite;
          will-change: transform;
        }

        .mesh-blob-5 {
          position: absolute;
          width: 400px;
          height: 400px;
          bottom: 20%;
          left: 30%;
          border-radius: 50%;
          background: radial-gradient(circle, #4a1942 0%, transparent 70%);
          filter: blur(100px);
          opacity: 0.3;
          animation: meshFloat5 28s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes meshFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(80px, 60px) scale(1.08); }
          50% { transform: translate(30px, 120px) scale(0.95); }
          75% { transform: translate(-50px, 40px) scale(1.04); }
        }

        @keyframes meshFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-70px, -50px) scale(1.06); }
          50% { transform: translate(-30px, -100px) scale(0.92); }
          75% { transform: translate(60px, -30px) scale(1.03); }
        }

        @keyframes meshFloat3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          33% { transform: translate(calc(-50% + 100px), -80px) scale(1.1); }
          66% { transform: translate(calc(-50% - 60px), 60px) scale(0.9); }
        }

        @keyframes meshFloat4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-90px, 70px) scale(1.12); }
        }

        @keyframes meshFloat5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -40px) scale(1.05); }
          66% { transform: translate(-40px, 50px) scale(0.95); }
        }

        /* ── Glass Card Shared Style ───────────────────────────── */
        .glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        /* ── Scrollbar ─────────────────────────────────────────── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.14);
        }

        /* ── Smooth global feel ────────────────────────────────── */
        .glass-page * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>

      {/* Background */}
      <div className="glass-bg">
        <div className="mesh-blob-3" />
        <div className="mesh-blob-4" />
        <div className="mesh-blob-5" />
      </div>

      {/* Nav */}
      <GlassNav />

      {/* Content */}
      <main className="glass-page relative z-10 min-h-screen pt-20 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto flex flex-col gap-6">
        {/* Hero Stats */}
        <HeroStats />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <HoldingsTable />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <AllocationChart />
            <RecentActivity />
          </div>
        </div>

        {/* Featured Pools */}
        <section>
          <h2 className="text-sm font-semibold text-slate-50/70 tracking-wide uppercase mb-4">
            Featured Pools
          </h2>
          <PoolCards />
        </section>

        {/* Bottom Glow */}
        <BottomGlow />
      </main>
    </>
  );
}
