"use client";

/* ─────────────────────────────────────────────────────────────
   Design Sovereign — Swiss Vault x Midnight Editorial

   Basel restraint meets magazine drama. Structure via thin
   gold rules only. No card backgrounds. No rounded corners.
   No shadows. No glows. No gradients. Only: type, rules,
   color, space.
   ────────────────────────────────────────────────────────────── */

const HOLDINGS = [
  { asset: "US Treasury Bills 3-Mo", category: "GOVERNMENT BONDS", value: "$842,100", apy: "5.28%" },
  { asset: "Manhattan REIT Class A", category: "REAL ESTATE", value: "$624,500", apy: "7.12%" },
  { asset: "Ares Senior Secured Loan", category: "PRIVATE CREDIT", value: "$518,200", apy: "9.45%" },
  { asset: "Prologis Logistics Fund", category: "INFRASTRUCTURE", value: "$392,750", apy: "6.80%" },
  { asset: "Swiss Gold Vault ETP", category: "COMMODITIES", value: "$284,342", apy: "3.14%" },
  { asset: "Carbon Credit Forward 2027", category: "ESG ASSETS", value: "$185,500", apy: "11.20%" },
];

const ACTIVITY = [
  { time: "09:41:22", action: "Deposited into US Treasury Bills", amount: "+$50,000", positive: true },
  { time: "09:38:14", action: "Yield claimed from Ares Senior", amount: "+$2,847", positive: true },
  { time: "Yesterday", action: "Withdrew from Carbon Credit", amount: "-$15,000", positive: false },
  { time: "Feb 07", action: "Deposited into Manhattan REIT", amount: "+$100,000", positive: true },
  { time: "Feb 06", action: "Lock period began — Gold ETP", amount: "$284,342", positive: false },
  { time: "Feb 05", action: "Yield claimed from Prologis", amount: "+$1,204", positive: true },
  { time: "Feb 04", action: "Rebalanced Private Credit", amount: "-$25,000", positive: false },
  { time: "Feb 03", action: "New position — Carbon Credit", amount: "+$200,500", positive: true },
];

const POOLS = [
  { name: "Apollo Senior Credit Fund III", category: "PRIVATE CREDIT", apy: "9.82", tvl: "$124.5M" },
  { name: "BlackRock Treasury Access", category: "GOVERNMENT BONDS", apy: "5.31", tvl: "$2.1B" },
  { name: "Brookfield Real Assets", category: "INFRASTRUCTURE", apy: "7.65", tvl: "$890M" },
];

/* ── Color Tokens ─────────────────────────────────────────── */

const C = {
  bg: "#141210",
  cream: "#F0EBE0",
  gold: "#C4A265",
  goldRule: "rgba(196,162,101,0.15)",
  sage: "#8B9E7E",
  rose: "#B07272",
  dim: "#5A5347",
  watermark: "rgba(240,235,224,0.03)",
} as const;

/* ── Primitives ───────────────────────────────────────────── */

function GoldRule() {
  return (
    <div
      className="w-full"
      style={{ height: "1px", background: C.goldRule }}
    />
  );
}

function VerticalGoldRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`self-stretch ${className}`}
      style={{ width: "1px", background: C.goldRule }}
    />
  );
}

function SectionMasthead({ children }: { children: string }) {
  return (
    <div className="mb-8">
      <p
        className="font-sans-sv text-[10px] tracking-[0.3em] uppercase mb-3"
        style={{ color: C.gold }}
      >
        {children}
      </p>
      <div style={{ height: "1px", background: C.goldRule }} />
    </div>
  );
}

function Watermark({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute select-none pointer-events-none font-serif-sv font-bold leading-none ${className}`}
      style={{
        color: C.watermark,
        letterSpacing: "-0.04em",
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

/* ── Masthead ─────────────────────────────────────────────── */

function Masthead() {
  return (
    <header className="w-full">
      <GoldRule />
      <div className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        <span
          className="font-sans-sv text-[10px] tracking-[0.3em] uppercase"
          style={{ color: C.gold }}
        >
          RWA Gateway
        </span>
        <span
          className="font-sans-sv text-[10px] tracking-[0.2em] uppercase hidden sm:block"
          style={{ color: C.gold }}
        >
          February 2026
        </span>
        <span
          className="font-sans-sv text-[10px] tracking-[0.3em] uppercase"
          style={{ color: C.gold }}
        >
          Institutional Grade
        </span>
      </div>
      <GoldRule />
    </header>
  );
}

/* ── The Statement (Hero) ─────────────────────────────────── */

function TheStatement() {
  return (
    <section className="relative w-full px-6 md:px-12 lg:px-16 pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
      {/* Watermark — right-aligned, barely visible */}
      <Watermark className="top-1/2 right-4 md:right-12 -translate-y-1/2">
        <span style={{ fontSize: "clamp(120px, 20vw, 180px)" }}>
          2.8M
        </span>
      </Watermark>

      <div className="relative">
        <h1
          className="font-serif-sv tabular-nums leading-[0.9] tracking-[-0.02em]"
          style={{
            fontSize: "clamp(56px, 9vw, 72px)",
            color: C.cream,
          }}
        >
          $2,847,392
        </h1>

        <p
          className="font-sans-sv tabular-nums text-base mt-5"
          style={{ color: C.sage }}
        >
          +$12,847.00 this month
        </p>

        <p
          className="font-sans-sv text-[13px] mt-2"
          style={{ color: C.dim }}
        >
          across 12 active positions
        </p>
      </div>
    </section>
  );
}

/* ── Vital Statistics ─────────────────────────────────────── */

function VitalStatistics() {
  const stats = [
    { label: "Invested", value: "$2,420,000" },
    { label: "Yield Earned", value: "$427,392" },
    { label: "Avg APY", value: "7.2%" },
    { label: "Locked", value: "$890,000" },
  ];

  return (
    <section className="relative w-full px-6 md:px-12 lg:px-16 overflow-hidden">
      {/* Faint watermark behind stats */}
      <Watermark className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span style={{ fontSize: "clamp(100px, 18vw, 200px)" }}>
          7.2%
        </span>
      </Watermark>

      <GoldRule />

      <div className="relative flex flex-wrap">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex flex-1 min-w-[140px]"
          >
            {i > 0 && (
              <VerticalGoldRule className="hidden sm:block" />
            )}
            <div
              className={`flex-1 py-7 ${
                i > 0 ? "sm:pl-8" : ""
              } ${
                i < stats.length - 1 ? "sm:pr-8" : ""
              }`}
            >
              {/* Mobile-only separator between stacked stats */}
              {i > 0 && (
                <div
                  className="sm:hidden mb-4"
                  style={{
                    height: "1px",
                    background: C.goldRule,
                  }}
                />
              )}

              <p
                className="font-sans-sv text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: C.gold }}
              >
                {stat.label}
              </p>
              <p
                className="font-serif-sv tabular-nums text-[28px] md:text-[32px] font-semibold leading-none"
                style={{ color: C.cream }}
              >
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <GoldRule />
    </section>
  );
}

/* ── Holding Row ──────────────────────────────────────────── */

function HoldingRow({
  asset,
  category,
  value,
  apy,
}: {
  asset: string;
  category: string;
  value: string;
  apy: string;
}) {
  return (
    <div
      className="group relative py-5 cursor-default"
      style={{ borderBottom: `1px solid ${C.goldRule}` }}
    >
      {/* Gold hover accent bar — slides in from left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[3px] transition-all duration-300 ease-out"
        style={{ background: C.gold }}
      />

      <div className="group-hover:pl-5 transition-all duration-300 ease-out">
        <p
          className="font-serif-sv text-[18px] font-medium leading-snug"
          style={{ color: C.cream }}
        >
          {asset}
        </p>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mt-2">
          <span
            className="font-sans-sv text-[10px] tracking-[0.2em] uppercase"
            style={{ color: C.gold }}
          >
            {category}
          </span>
          <span
            className="tabular-nums text-[16px]"
            style={{
              color: C.cream,
              fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
            }}
          >
            {value}
          </span>
          <span
            className="font-sans-sv tabular-nums text-[14px] font-medium"
            style={{ color: C.sage }}
          >
            {apy}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Activity Entry ───────────────────────────────────────── */

function ActivityEntry({
  time,
  action,
  amount,
  positive,
}: {
  time: string;
  action: string;
  amount: string;
  positive: boolean;
}) {
  return (
    <div
      className="py-3"
      style={{ borderBottom: `1px solid ${C.goldRule}` }}
    >
      <p
        className="tabular-nums text-[10px]"
        style={{
          color: C.dim,
          fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
        }}
      >
        {time}
      </p>
      <p
        className="font-sans-sv text-[13px] mt-1 leading-snug"
        style={{ color: C.cream }}
      >
        {action}
      </p>
      <p
        className="tabular-nums text-[13px] mt-1 font-medium"
        style={{
          color: positive ? C.sage : C.rose,
          fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
        }}
      >
        {amount}
      </p>
    </div>
  );
}

/* ── Asymmetric Grid (Positions + Activity) ───────────────── */

function AsymmetricGrid() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16 py-12 md:py-16">
      <div className="flex flex-col md:flex-row gap-0">
        {/* Left 65% — Positions */}
        <div className="md:w-[65%] md:pr-12">
          <SectionMasthead>Positions</SectionMasthead>
          {HOLDINGS.map((h) => (
            <HoldingRow key={h.asset} {...h} />
          ))}
        </div>

        {/* Vertical rule — desktop only */}
        <VerticalGoldRule className="hidden md:block" />

        {/* Right 35% — Activity log */}
        <div className="md:w-[35%] md:pl-12 mt-12 md:mt-0">
          <SectionMasthead>Activity</SectionMasthead>
          {ACTIVITY.map((a, i) => (
            <ActivityEntry key={i} {...a} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pool Column ──────────────────────────────────────────── */

function PoolColumn({
  pool,
  position,
}: {
  pool: (typeof POOLS)[number];
  position: "first" | "middle" | "last";
}) {
  const padding =
    position === "first"
      ? "md:pr-10"
      : position === "middle"
        ? "md:px-10"
        : "md:pl-10";

  return (
    <div
      className={`flex-1 py-6 md:py-0 ${padding}`}
      style={
        position !== "last"
          ? { borderBottom: `1px solid ${C.goldRule}` }
          : undefined
      }
    >
      <p
        className="font-sans-sv text-[10px] tracking-[0.3em] uppercase mb-2"
        style={{ color: C.gold }}
      >
        {pool.category}
      </p>

      <h3
        className="font-serif-sv text-[20px] font-medium mb-8"
        style={{ color: C.cream }}
      >
        {pool.name}
      </h3>

      {/* Hero APY number */}
      <div className="mb-6">
        <span
          className="font-serif-sv tabular-nums font-bold leading-none"
          style={{
            fontSize: "36px",
            color: C.gold,
            letterSpacing: "-0.02em",
          }}
        >
          {pool.apy}
          <span
            className="text-lg align-top ml-0.5"
            style={{ color: C.dim }}
          >
            %
          </span>
        </span>
      </div>

      <p
        className="font-sans-sv text-[10px] tracking-[0.2em] uppercase"
        style={{ color: C.dim }}
      >
        Total Value Locked
      </p>
      <p
        className="font-sans-sv tabular-nums text-sm mt-0.5"
        style={{ color: C.dim }}
      >
        {pool.tvl}
      </p>
    </div>
  );
}

/* ── Featured Pools ───────────────────────────────────────── */

function FeaturedPools() {
  const positions = ["first", "middle", "last"] as const;

  return (
    <section className="w-full px-6 md:px-12 lg:px-16 py-12 md:py-16">
      <GoldRule />

      <h2
        className="font-serif-sv font-light leading-none mt-12 mb-14"
        style={{
          fontSize: "clamp(36px, 5vw, 48px)",
          color: C.cream,
          letterSpacing: "-0.01em",
        }}
      >
        Opportunities
      </h2>

      <div className="flex flex-col md:flex-row">
        {POOLS.map((pool, i) => (
          <div key={pool.name} className="flex flex-1">
            {i > 0 && (
              <VerticalGoldRule className="hidden md:block" />
            )}
            <PoolColumn
              pool={pool}
              position={positions[i]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Colophon ─────────────────────────────────────────────── */

function Colophon() {
  return (
    <footer className="w-full px-6 md:px-12 lg:px-16 pb-12 pt-4">
      <GoldRule />
      <p
        className="text-center font-sans-sv text-[10px] tracking-[0.2em] uppercase py-5"
        style={{ color: C.gold }}
      >
        Secured on Avalanche C-Chain&ensp;&middot;&ensp;Cryptographically
        Verified&ensp;&middot;&ensp;Immutable
      </p>
      <GoldRule />
    </footer>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function DesignSovereignPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

            .font-serif-sv {
              font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            }
            .font-sans-sv {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .tabular-nums {
              font-variant-numeric: tabular-nums;
            }

            /* Scrollbar — warm charcoal */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: #141210; }
            ::-webkit-scrollbar-thumb { background: rgba(196,162,101,0.20); }
            ::-webkit-scrollbar-thumb:hover { background: rgba(196,162,101,0.35); }

            /* Prevent mobile border artifacts on stacked layouts */
            @media (max-width: 767px) {
              .md\\:flex-row { border-bottom: none !important; }
            }
          `,
        }}
      />

      <div
        className="font-sans-sv min-h-screen w-full flex flex-col items-center"
        style={{ background: C.bg, color: C.cream }}
      >
        <div className="w-full max-w-[1320px]">
          <Masthead />
          <TheStatement />
          <VitalStatistics />
          <AsymmetricGrid />
          <FeaturedPools />
          <Colophon />
        </div>
      </div>
    </>
  );
}
