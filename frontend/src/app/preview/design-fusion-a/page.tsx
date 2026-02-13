"use client";

/* ═══════════════════════════════════════════════════════════════════════
   Design Fusion A — Editorial Vault (70%) + Obsidian Luxe (30%)

   The annual report of a Swiss private bank, printed on velvet.
   Vault DNA: thin rules as structure, asymmetric grids, watermarks,
   massive serif typography, zero card backgrounds, zero rounded corners.
   Luxe DNA: rose gold accents, velvet-black warmth, ONE shine-sweep
   hero section, diamond separators, APY text-shadow glow.
   ═══════════════════════════════════════════════════════════════════════ */

const HOLDINGS = [
  { asset: "US Treasury Bills 3-Mo", category: "Government Bonds", value: "$842,100", apy: "5.28%", status: "Active" as const },
  { asset: "Manhattan REIT Class A", category: "Real Estate", value: "$624,500", apy: "7.12%", status: "Locked" as const },
  { asset: "Ares Senior Secured Loan", category: "Private Credit", value: "$518,200", apy: "9.45%", status: "Active" as const },
  { asset: "Prologis Logistics Fund", category: "Infrastructure", value: "$392,750", apy: "6.80%", status: "Active" as const },
  { asset: "Swiss Gold Vault ETP", category: "Commodities", value: "$284,342", apy: "3.14%", status: "Locked" as const },
  { asset: "Carbon Credit Forward 2027", category: "ESG Assets", value: "$185,500", apy: "11.20%", status: "Active" as const },
];

const ACTIVITY = [
  { time: "2h ago", desc: "Deposited into US Treasury 3-Mo Bill", amount: "+$50,000" },
  { time: "5h ago", desc: "Yield claimed from Ares Senior Loan", amount: "+$1,240" },
  { time: "1d ago", desc: "Withdrew from Prologis Logistics Fund", amount: "-$12,000" },
  { time: "2d ago", desc: "Deposited into Manhattan REIT Class A", amount: "+$25,000" },
  { time: "3d ago", desc: "Rebalanced portfolio allocation", amount: "" },
];

const POOLS = [
  { name: "Apollo Senior Credit Fund III", category: "PRIVATE CREDIT", apy: "9.82", tvl: "$124.5M", min: "$50,000" },
  { name: "BlackRock Treasury Access", category: "GOVERNMENT BONDS", apy: "5.31", tvl: "$2.1B", min: "$25,000" },
  { name: "Brookfield Real Assets", category: "INFRASTRUCTURE", apy: "7.65", tvl: "$890M", min: "$100,000" },
];

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVES — Rules only. No cards. No backgrounds.
   ═══════════════════════════════════════════════════════════════ */

function RoseRule() {
  return (
    <div
      className="w-full"
      style={{ height: "1px", background: "rgba(232,180,184,0.12)" }}
    />
  );
}

function VerticalRoseRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`self-stretch ${className}`}
      style={{ width: "1px", background: "rgba(232,180,184,0.12)" }}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-sans-fa text-[10px] tracking-[0.16em] uppercase"
      style={{ color: "#B8A99A" }}
    >
      {children}
    </p>
  );
}

function Diamond() {
  return (
    <span className="text-[10px] mx-2" style={{ color: "#E8B4B8" }}>
      &#9670;
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MASTHEAD — Rose gold rules + diamond separator (Luxe touch)
   ═══════════════════════════════════════════════════════════════ */

function Masthead() {
  return (
    <header className="w-full">
      <RoseRule />
      <div className="flex items-center justify-center px-6 py-5 md:px-12 lg:px-16">
        <span
          className="font-sans-fa text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#E8B4B8" }}
        >
          RWA Gateway
        </span>
        <Diamond />
        <span
          className="font-sans-fa text-[9px] tracking-[0.25em] uppercase"
          style={{ color: "#5A5347" }}
        >
          Institutional Grade
        </span>
      </div>
      <RoseRule />
      <div className="flex items-center justify-between px-6 py-3 md:px-12 lg:px-16">
        <span
          className="font-sans-fa text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "#5A5347" }}
        >
          Private Portfolio
        </span>
        <span
          className="font-sans-fa text-[9px] tracking-[0.2em] uppercase hidden sm:block"
          style={{ color: "#5A5347" }}
        >
          February 2026
        </span>
        <span
          className="font-sans-fa text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "#5A5347" }}
        >
          Quarterly Report
        </span>
      </div>
      <RoseRule />
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THE STATEMENT (HERO) — The ONE Luxe-treated element
   Subtle gradient bg, soft shadow, shine sweep, watermark.
   ═══════════════════════════════════════════════════════════════ */

function HeroStatement() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16 pt-10 pb-6 md:pt-14 md:pb-8">
      <div
        className="hero-shine relative overflow-hidden py-14 px-8 md:py-20 md:px-14"
        style={{
          background: "linear-gradient(160deg, #0E0B10 0%, #161218 50%, #0E0B10 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Watermark */}
        <div
          className="absolute top-1/2 right-4 md:right-10 -translate-y-1/2 select-none pointer-events-none font-serif-fa font-bold leading-none"
          style={{
            fontSize: "clamp(120px, 20vw, 200px)",
            color: "rgba(240,235,224,0.03)",
            letterSpacing: "-0.04em",
          }}
          aria-hidden="true"
        >
          2.8M
        </div>

        <div className="relative flex flex-col md:flex-row md:items-end">
          <div className="md:w-[65%]">
            <Label>Total Portfolio Value</Label>

            <h1
              className="font-serif-fa tabular-nums leading-[0.88] tracking-[-0.02em] mt-5"
              style={{ fontSize: "clamp(56px, 9vw, 84px)", color: "#F0EBE0" }}
            >
              $2,847,392
              <span style={{ color: "#5A5347", fontSize: "0.5em" }}>.00</span>
            </h1>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span
                className="font-sans-fa tabular-nums text-base font-medium"
                style={{ color: "#8B9E7E" }}
              >
                +$12,847.00 this month
              </span>
              <span
                className="font-sans-fa text-[11px] px-2 py-0.5"
                style={{
                  color: "#8B9E7E",
                  background: "rgba(139,158,126,0.08)",
                }}
              >
                +0.45%
              </span>
            </div>
          </div>

          <div className="hidden md:block md:w-[35%]" />
        </div>
      </div>

      <div className="mt-6">
        <RoseRule />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VITAL STATISTICS — 4 stats, vertical rose gold rules, no bg
   ═══════════════════════════════════════════════════════════════ */

function VitalStatistics() {
  const stats = [
    { label: "Total Invested", value: "$2,847,392" },
    { label: "Active Pools", value: "6" },
    { label: "Avg APY", value: "6.83%", accent: true },
    { label: "Locked Capital", value: "$908,842" },
  ];

  return (
    <section className="w-full px-6 md:px-12 lg:px-16">
      {/* Desktop: row with vertical rules */}
      <div className="hidden sm:flex">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex flex-1">
            {i > 0 && <VerticalRoseRule />}
            <div className={`flex-1 py-8 ${i > 0 ? "pl-8" : ""} ${i < stats.length - 1 ? "pr-8" : ""}`}>
              <Label>{stat.label}</Label>
              <p
                className="font-serif-fa tabular-nums text-[28px] font-semibold leading-none mt-3"
                style={{ color: stat.accent ? "#E8B4B8" : "#F0EBE0" }}
              >
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: 2x2 grid */}
      <div className="grid grid-cols-2 gap-0 sm:hidden">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="py-6"
            style={{
              borderBottom: i < 2 ? "1px solid rgba(232,180,184,0.08)" : undefined,
              paddingLeft: i % 2 === 1 ? "16px" : undefined,
              borderLeft: i % 2 === 1 ? "1px solid rgba(232,180,184,0.08)" : undefined,
            }}
          >
            <Label>{stat.label}</Label>
            <p
              className="font-serif-fa tabular-nums text-[24px] font-semibold leading-none mt-2"
              style={{ color: stat.accent ? "#E8B4B8" : "#F0EBE0" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <RoseRule />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ASYMMETRIC GRID — 65/35: Holdings (left) + Activity (right)
   Pure Vault structure. Rules only, no cards.
   ═══════════════════════════════════════════════════════════════ */

function AsymmetricGrid() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16 py-14 md:py-20">
      <div className="flex flex-col md:flex-row gap-0">
        {/* Left 65% — Holdings */}
        <div className="md:w-[65%] md:pr-12">
          <h2
            className="font-serif-fa font-light leading-none mb-10"
            style={{
              fontSize: "clamp(32px, 4.5vw, 42px)",
              color: "#F0EBE0",
              letterSpacing: "-0.01em",
            }}
          >
            Holdings
          </h2>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <div
              className="flex items-baseline justify-between pb-3"
              style={{ borderBottom: "1px solid rgba(232,180,184,0.10)" }}
            >
              <span
                className="font-sans-fa text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "#5A5347" }}
              >
                Asset
              </span>
              <div className="flex items-baseline gap-8">
                <span className="font-sans-fa text-[9px] tracking-[0.2em] uppercase w-20 text-right" style={{ color: "#5A5347" }}>Value</span>
                <span className="font-sans-fa text-[9px] tracking-[0.2em] uppercase w-14 text-right" style={{ color: "#5A5347" }}>APY</span>
                <span className="font-sans-fa text-[9px] tracking-[0.2em] uppercase w-12 text-right" style={{ color: "#5A5347" }}>Status</span>
              </div>
            </div>

            {HOLDINGS.map((row) => (
              <HoldingRow key={row.asset} {...row} />
            ))}
          </div>

          {/* Mobile list */}
          <div className="sm:hidden space-y-0">
            {HOLDINGS.map((row) => (
              <MobileHoldingRow key={row.asset} {...row} />
            ))}
          </div>
        </div>

        {/* Vertical rose gold rule */}
        <VerticalRoseRule className="hidden md:block" />

        {/* Right 35% — Activity */}
        <div className="md:w-[35%] md:pl-12 mt-14 md:mt-0">
          <p
            className="font-sans-fa text-[10px] tracking-[0.2em] uppercase mb-10"
            style={{ color: "#B8A99A" }}
          >
            Recent Activity
          </p>

          <div>
            {ACTIVITY.map((item, i) => (
              <ActivityItem key={i} {...item} isLast={i === ACTIVITY.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HoldingRow({
  asset,
  category,
  value,
  apy,
  status,
}: {
  asset: string;
  category: string;
  value: string;
  apy: string;
  status: "Active" | "Locked";
}) {
  return (
    <div
      className="group relative flex items-baseline justify-between py-4 cursor-default"
      style={{ borderBottom: "1px solid rgba(232,180,184,0.06)" }}
    >
      {/* Rose gold hover bar — slides in from left (Vault pattern) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[2px] transition-all duration-300"
        style={{ background: "#E8B4B8" }}
      />

      <div className="flex items-baseline gap-3 group-hover:pl-4 transition-all duration-300 min-w-0">
        <span className="font-serif-fa text-[15px] font-semibold truncate" style={{ color: "#F0EBE0" }}>
          {asset}
        </span>
        <span className="font-sans-fa text-[11px] shrink-0" style={{ color: "#5A5347" }}>
          {category}
        </span>
      </div>

      <div className="flex items-baseline gap-8 shrink-0 ml-4 group-hover:pr-2 transition-all duration-300">
        <span className="font-sans-fa tabular-nums text-[13px] font-medium w-20 text-right" style={{ color: "#B8A99A" }}>
          {value}
        </span>
        <span className="font-serif-fa tabular-nums text-[15px] font-semibold w-14 text-right" style={{ color: "#8B9E7E" }}>
          {apy}
        </span>
        <span
          className="font-sans-fa text-[9px] tracking-[0.12em] uppercase w-12 text-right"
          style={{ color: status === "Locked" ? "#B07272" : "#5A5347" }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function MobileHoldingRow({
  asset,
  category,
  value,
  apy,
  status,
}: {
  asset: string;
  category: string;
  value: string;
  apy: string;
  status: "Active" | "Locked";
}) {
  return (
    <div className="py-4" style={{ borderBottom: "1px solid rgba(232,180,184,0.06)" }}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-serif-fa text-[14px] font-semibold" style={{ color: "#F0EBE0" }}>
          {asset}
        </span>
        <span
          className="font-sans-fa text-[9px] tracking-[0.12em] uppercase"
          style={{ color: status === "Locked" ? "#B07272" : "#5A5347" }}
        >
          {status}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="font-sans-fa text-[11px]" style={{ color: "#5A5347" }}>{category}</span>
        <div className="flex items-baseline gap-4">
          <span className="font-sans-fa tabular-nums text-[12px]" style={{ color: "#B8A99A" }}>{value}</span>
          <span className="font-serif-fa tabular-nums text-[13px] font-semibold" style={{ color: "#8B9E7E" }}>{apy}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  time,
  desc,
  amount,
  isLast,
}: {
  time: string;
  desc: string;
  amount: string;
  isLast: boolean;
}) {
  const isNegative = amount.startsWith("-");

  return (
    <div>
      <div className="flex items-start gap-3 py-4">
        {/* Diamond bullet (Luxe touch) */}
        <span
          className="text-[7px] leading-[20px] shrink-0"
          style={{ color: "#E8B4B8" }}
        >
          &#9670;
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-sans-fa text-[13px] font-light leading-[1.4]" style={{ color: "#F0EBE0" }}>
            {desc}
          </p>
          <p className="font-sans-fa text-[11px] mt-1 font-light" style={{ color: "#5A5347" }}>
            {time}
          </p>
        </div>
        {amount && (
          <span
            className="font-serif-fa tabular-nums text-[14px] font-medium shrink-0"
            style={{ color: isNegative ? "#B07272" : "#8B9E7E" }}
          >
            {amount}
          </span>
        )}
      </div>
      {!isLast && (
        <div style={{ height: "1px", background: "rgba(232,180,184,0.06)" }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEATURED POOLS — 3 columns, vertical rose rules, APY glow
   ═══════════════════════════════════════════════════════════════ */

function FeaturedPools() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16 py-14 md:py-20">
      <RoseRule />
      <h2
        className="font-serif-fa font-light leading-none mt-10 mb-12"
        style={{
          fontSize: "clamp(32px, 4.5vw, 42px)",
          color: "#F0EBE0",
          letterSpacing: "-0.01em",
        }}
      >
        Opportunities
      </h2>

      {/* Desktop: 3 columns with vertical rose rules */}
      <div className="hidden md:flex">
        {POOLS.map((pool, i) => (
          <div key={pool.name} className="flex flex-1">
            {i > 0 && <VerticalRoseRule />}
            <div className={`flex-1 ${i === 0 ? "pr-10" : i === 1 ? "px-10" : "pl-10"}`}>
              <PoolColumn pool={pool} />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: stacked with rules */}
      <div className="md:hidden space-y-0">
        {POOLS.map((pool, i) => (
          <div key={pool.name}>
            {i > 0 && <RoseRule />}
            <div className="py-8">
              <PoolColumn pool={pool} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <RoseRule />
      </div>
    </section>
  );
}

function PoolColumn({ pool }: { pool: typeof POOLS[number] }) {
  return (
    <>
      <p
        className="font-sans-fa text-[9px] tracking-[0.3em] uppercase mb-3"
        style={{ color: "#5A5347" }}
      >
        {pool.category}
      </p>
      <h3
        className="font-serif-fa text-[17px] font-semibold mb-8"
        style={{ color: "#F0EBE0" }}
      >
        {pool.name}
      </h3>

      {/* APY with rose gold text-shadow glow (the Luxe touch) */}
      <div className="mb-8">
        <p
          className="font-sans-fa text-[9px] tracking-[0.2em] uppercase mb-2"
          style={{ color: "#B8A99A" }}
        >
          Annual Yield
        </p>
        <span
          className="font-serif-fa tabular-nums font-bold leading-none"
          style={{
            fontSize: "48px",
            color: "#E8B4B8",
            letterSpacing: "-0.02em",
            textShadow: "0 0 24px rgba(232,180,184,0.25)",
          }}
        >
          {pool.apy}
          <span
            className="text-xl align-top ml-0.5"
            style={{ color: "#B8A99A", textShadow: "none" }}
          >
            %
          </span>
        </span>
      </div>

      <div className="flex gap-8">
        <div>
          <p className="font-sans-fa text-[9px] tracking-[0.2em] uppercase" style={{ color: "#5A5347" }}>TVL</p>
          <p className="font-sans-fa tabular-nums text-sm mt-1" style={{ color: "#B8A99A" }}>{pool.tvl}</p>
        </div>
        <div>
          <p className="font-sans-fa text-[9px] tracking-[0.2em] uppercase" style={{ color: "#5A5347" }}>Minimum</p>
          <p className="font-sans-fa tabular-nums text-sm mt-1" style={{ color: "#B8A99A" }}>{pool.min}</p>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAIN STRIP — Monospace verification data
   ═══════════════════════════════════════════════════════════════ */

function ChainStrip() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16">
      <div className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <Label>Last Verified</Label>
          <span className="font-mono-fa tabular-nums text-[12px]" style={{ color: "#5A5347" }}>
            2026-02-10T14:32:07Z
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <Label>Block</Label>
          <span className="font-mono-fa tabular-nums text-[12px]" style={{ color: "#5A5347" }}>
            #48,291,847
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <Label>Hash</Label>
          <span className="font-mono-fa tabular-nums text-[11px] truncate max-w-[200px]" style={{ color: "#5A5347" }}>
            0x7a3f...c91d
          </span>
        </div>
      </div>
      <RoseRule />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COLOPHON — Rose gold rules + diamond separators
   ═══════════════════════════════════════════════════════════════ */

function Colophon() {
  return (
    <footer className="w-full px-6 md:px-12 lg:px-16 pb-12 pt-4">
      <RoseRule />
      <p className="text-center py-6">
        <span className="font-sans-fa text-[10px] tracking-[0.2em] uppercase" style={{ color: "#5A5347" }}>
          Secured on Avalanche C-Chain
        </span>
        <Diamond />
        <span className="font-sans-fa text-[10px] tracking-[0.2em] uppercase" style={{ color: "#5A5347" }}>
          Cryptographically Verified
        </span>
        <Diamond />
        <span className="font-sans-fa text-[10px] tracking-[0.2em] uppercase" style={{ color: "#5A5347" }}>
          Immutable Record
        </span>
      </p>
      <RoseRule />
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE ASSEMBLY
   ═══════════════════════════════════════════════════════════════ */

export default function DesignFusionAPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

            .font-serif-fa {
              font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            }
            .font-sans-fa {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .font-mono-fa {
              font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
            }
            .tabular-nums {
              font-variant-numeric: tabular-nums;
            }

            /* ── Shine sweep: ONLY on hero section ───────────── */
            @keyframes heroShineSweep {
              0%   { transform: translateX(-120%) skewX(-15deg); }
              100% { transform: translateX(250%) skewX(-15deg); }
            }
            .hero-shine {
              position: relative;
              overflow: hidden;
            }
            .hero-shine::after {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              width: 30%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent 0%,
                rgba(232,180,184,0.04) 30%,
                rgba(240,235,224,0.07) 50%,
                rgba(232,180,184,0.04) 70%,
                transparent 100%
              );
              animation: heroShineSweep 6s ease-in-out infinite;
              pointer-events: none;
            }

            /* ── Warm velvet scrollbar ───────────────────────── */
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-track { background: #0E0B10; }
            ::-webkit-scrollbar-thumb {
              background: rgba(232,180,184,0.12);
              border-radius: 3px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(232,180,184,0.25);
            }

            * { -webkit-font-smoothing: antialiased; }

            ::selection {
              background: rgba(232,180,184,0.20);
              color: #F0EBE0;
            }
          `,
        }}
      />

      <div
        className="font-sans-fa min-h-screen w-full flex flex-col items-center"
        style={{ background: "#0E0B10", color: "#F0EBE0" }}
      >
        <div className="w-full max-w-[1320px]">
          <Masthead />
          <HeroStatement />
          <VitalStatistics />
          <AsymmetricGrid />
          <FeaturedPools />
          <ChainStrip />
          <Colophon />
        </div>
      </div>
    </>
  );
}
