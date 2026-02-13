"use client";

/* ─────────────────────────────────────────────────────────────
   Design Editorial — Bloomberg Businessweek meets DeFi
   Dramatic typography, asymmetric grids, thin rules,
   vermillion accent on near-black. Magazine-cover energy.
   ────────────────────────────────────────────────────────────── */

const HOLDINGS = [
  { asset: "US Treasury Bills 3-Mo", value: "$842,100", apy: "5.28%" },
  { asset: "Manhattan REIT Class A", value: "$624,500", apy: "7.12%" },
  { asset: "Ares Senior Secured Loan", value: "$518,200", apy: "9.45%" },
  { asset: "Prologis Logistics Fund", value: "$392,750", apy: "6.80%" },
  { asset: "Swiss Gold Vault ETP", value: "$284,342", apy: "3.14%" },
  { asset: "Maple Leaf Credit Note", value: "$185,500", apy: "8.91%" },
];

const ACTIVITIES = [
  { time: "14:32", action: "Deposit confirmed", amount: "+$50,000", asset: "Treasury Bills" },
  { time: "13:18", action: "Yield distributed", amount: "+$1,247", asset: "REIT Class A" },
  { time: "12:05", action: "Pool rebalanced", amount: "", asset: "Senior Secured" },
  { time: "11:44", action: "KYC verified", amount: "", asset: "Gold Vault ETP" },
  { time: "10:22", action: "Withdrawal processed", amount: "-$25,000", asset: "Credit Note" },
  { time: "09:51", action: "New pool joined", amount: "+$100,000", asset: "Logistics Fund" },
  { time: "08:30", action: "Document sealed", amount: "", asset: "Compliance #847" },
  { time: "07:15", action: "Interest accrued", amount: "+$892", asset: "Treasury Bills" },
];

const POOLS = [
  {
    name: "Avalanche Prime Yield",
    category: "GOVERNMENT BONDS",
    apy: "5.28",
    tvl: "$4.2M",
    capacity: "78%",
  },
  {
    name: "Alpine Credit Facility",
    category: "PRIVATE CREDIT",
    apy: "9.45",
    tvl: "$6.1M",
    capacity: "92%",
  },
  {
    name: "Summit Real Estate Trust",
    category: "REAL ESTATE",
    apy: "7.12",
    tvl: "$4.5M",
    capacity: "65%",
  },
];

function ThinRule() {
  return <div className="w-full h-px" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />;
}

function VerticalRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-px self-stretch ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
    />
  );
}

/* ── Masthead ──────────────────────────────────────────────── */

function Masthead() {
  return (
    <header className="w-full">
      <ThinRule />
      <div className="flex items-center justify-between px-6 py-3 md:px-10">
        <span
          className="text-[10px] font-sans tracking-[0.3em] uppercase"
          style={{ color: "#888888" }}
        >
          RWA Gateway
        </span>
        <span
          className="text-[10px] font-sans tracking-[0.2em] uppercase hidden sm:block"
          style={{ color: "#888888" }}
        >
          February 10, 2026
        </span>
        <span
          className="text-[10px] font-sans tracking-[0.3em] uppercase"
          style={{ color: "#888888" }}
        >
          Institutional Grade
        </span>
      </div>
      <ThinRule />
    </header>
  );
}

/* ── Hero Block ────────────────────────────────────────────── */

function HeroBlock() {
  return (
    <section className="relative w-full px-6 md:px-10 py-16 md:py-24 overflow-hidden">
      {/* Watermark */}
      <div
        className="absolute top-1/2 right-6 md:right-16 -translate-y-1/2 select-none pointer-events-none font-serif font-black leading-none"
        style={{
          fontSize: "clamp(120px, 20vw, 240px)",
          color: "rgba(255,255,255,0.03)",
        }}
        aria-hidden="true"
      >
        2.8M
      </div>

      <div className="relative flex flex-col md:flex-row items-start gap-8 md:gap-0">
        {/* Left — Portfolio Value */}
        <div className="flex-1 md:max-w-[60%]">
          <p
            className="text-[10px] font-sans tracking-[0.3em] uppercase mb-4"
            style={{ color: "#888888" }}
          >
            Total Portfolio Value
          </p>
          <h1
            className="font-serif font-black leading-[0.9] tracking-tight"
            style={{
              fontSize: "clamp(48px, 8vw, 80px)",
              color: "#FAFAFA",
            }}
          >
            $2,847,392
          </h1>
          <p className="mt-4 font-mono text-lg" style={{ color: "#FF3B00" }}>
            +$12,847 this month
          </p>
          <p className="mt-1 font-mono text-sm" style={{ color: "#444444" }}>
            +0.45% from previous period
          </p>
        </div>

        {/* Vertical Rule */}
        <VerticalRule className="hidden md:block mx-10" />

        {/* Right — Summary stats */}
        <div className="flex-1 pt-2">
          <p
            className="text-[10px] font-sans tracking-[0.3em] uppercase mb-6"
            style={{ color: "#888888" }}
          >
            Performance Snapshot
          </p>
          <div className="space-y-5">
            {[
              { label: "30-Day Return", value: "+2.14%", accent: true },
              { label: "Unrealized P&L", value: "+$38,291", accent: true },
              { label: "Weighted Avg APY", value: "7.2%" },
              { label: "Next Distribution", value: "Feb 15, 2026" },
            ].map((item) => (
              <div key={item.label}>
                <p
                  className="text-[10px] font-sans tracking-[0.2em] uppercase"
                  style={{ color: "#444444" }}
                >
                  {item.label}
                </p>
                <p
                  className="font-mono text-xl font-semibold mt-0.5"
                  style={{ color: item.accent ? "#FF3B00" : "#FAFAFA" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Stat Block (mini) ─────────────────────────────────────── */

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4">
      <p
        className="text-[9px] font-sans tracking-[0.3em] uppercase"
        style={{ color: "#444444" }}
      >
        {label}
      </p>
      <p className="font-mono text-lg font-semibold mt-1" style={{ color: "#FAFAFA" }}>
        {value}
      </p>
    </div>
  );
}

/* ── Holdings List ─────────────────────────────────────────── */

function HoldingRow({
  asset,
  value,
  apy,
}: {
  asset: string;
  value: string;
  apy: string;
}) {
  return (
    <div
      className="group flex items-baseline justify-between py-3.5 transition-all duration-200 cursor-default"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span
        className="font-sans font-semibold text-sm transition-all duration-200 group-hover:pl-2"
        style={{ color: "#FAFAFA" }}
      >
        <span
          className="inline-block w-0 overflow-hidden transition-all duration-200 group-hover:w-2"
          style={{ color: "#FF3B00" }}
        >
          /
        </span>
        {asset}
      </span>
      <span className="flex items-baseline gap-4">
        <span className="font-mono text-sm" style={{ color: "#888888" }}>
          {value}
        </span>
        <span className="font-mono text-xs font-semibold" style={{ color: "#FF3B00" }}>
          {apy}
        </span>
      </span>
    </div>
  );
}

/* ── Activity Feed ─────────────────────────────────────────── */

function ActivityRow({
  time,
  action,
  amount,
  asset,
}: {
  time: string;
  action: string;
  amount: string;
  asset: string;
}) {
  const isPositive = amount.startsWith("+");
  const isNegative = amount.startsWith("-");

  return (
    <div
      className="py-2.5 flex items-start gap-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span className="font-mono text-[11px] shrink-0 pt-0.5" style={{ color: "#444444" }}>
        {time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs" style={{ color: "#FAFAFA" }}>
          {action}
        </p>
        <p className="font-sans text-[10px] mt-0.5" style={{ color: "#444444" }}>
          {asset}
        </p>
      </div>
      {amount && (
        <span
          className="font-mono text-xs font-semibold shrink-0"
          style={{
            color: isPositive ? "#FF3B00" : isNegative ? "#888888" : "#444444",
          }}
        >
          {amount}
        </span>
      )}
    </div>
  );
}

/* ── Data Grid (3-column asymmetric) ───────────────────────── */

function DataGrid() {
  return (
    <section className="w-full px-6 md:px-10">
      <ThinRule />
      <div className="flex flex-col md:flex-row gap-0">
        {/* Column 1 — Stats (narrow) */}
        <div className="md:w-[20%] py-6 md:pr-6">
          <StatBlock label="Active Pools" value="12" />
          <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <StatBlock label="Avg APY" value="7.2%" />
          <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <StatBlock label="TVL" value="$14.8M" />
          <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <StatBlock label="Sealed Docs" value="847" />
        </div>

        {/* Vertical Rule */}
        <VerticalRule className="hidden md:block" />

        {/* Column 2 — Holdings (wide) */}
        <div className="md:w-[50%] py-6 md:px-8">
          <div className="flex items-center gap-3 mb-4">
            <h2
              className="text-[11px] font-sans tracking-[0.3em] uppercase"
              style={{ color: "#888888" }}
            >
              Holdings
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
            <span className="font-mono text-[10px]" style={{ color: "#444444" }}>
              6 assets
            </span>
          </div>
          {HOLDINGS.map((h) => (
            <HoldingRow key={h.asset} {...h} />
          ))}
        </div>

        {/* Vertical Rule */}
        <VerticalRule className="hidden md:block" />

        {/* Column 3 — Activity (medium) */}
        <div className="md:w-[30%] py-6 md:pl-8">
          <div className="flex items-center gap-3 mb-4">
            <h2
              className="text-[11px] font-sans tracking-[0.3em] uppercase"
              style={{ color: "#888888" }}
            >
              Activity
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
            <span className="font-mono text-[10px]" style={{ color: "#444444" }}>
              today
            </span>
          </div>
          {ACTIVITIES.map((a, i) => (
            <ActivityRow key={i} {...a} />
          ))}
        </div>
      </div>
      <ThinRule />
    </section>
  );
}

/* ── Featured Pools ────────────────────────────────────────── */

function FeaturedPools() {
  return (
    <section className="w-full px-6 md:px-10 py-16 md:py-24">
      <h2
        className="font-serif font-extralight leading-none mb-12"
        style={{
          fontSize: "clamp(32px, 5vw, 56px)",
          color: "#FAFAFA",
        }}
      >
        Featured Pools
      </h2>

      <div className="flex flex-col md:flex-row gap-0">
        {POOLS.map((pool, i) => (
          <div key={pool.name} className="flex flex-1">
            {i > 0 && <VerticalRule className="hidden md:block" />}
            <div
              className={`flex-1 py-6 group cursor-default ${
                i === 0 ? "md:pr-10" : i === 1 ? "md:px-10" : "md:pl-10"
              }`}
            >
              <p
                className="text-[9px] font-sans tracking-[0.4em] uppercase mb-2"
                style={{ color: "#444444" }}
              >
                {pool.category}
              </p>
              <h3
                className="font-sans font-semibold text-lg mb-6 transition-colors duration-200"
                style={{ color: "#FAFAFA" }}
              >
                {pool.name}
              </h3>

              {/* APY — the hero number */}
              <div className="mb-6">
                <p
                  className="text-[9px] font-sans tracking-[0.3em] uppercase mb-1"
                  style={{ color: "#444444" }}
                >
                  Annual Yield
                </p>
                <span
                  className="font-mono font-black leading-none"
                  style={{ fontSize: "40px", color: "#FF3B00" }}
                >
                  {pool.apy}
                  <span className="text-lg align-top ml-0.5">%</span>
                </span>
              </div>

              {/* Details */}
              <div className="flex gap-8">
                <div>
                  <p
                    className="text-[9px] font-sans tracking-[0.2em] uppercase"
                    style={{ color: "#444444" }}
                  >
                    TVL
                  </p>
                  <p className="font-mono text-sm mt-0.5" style={{ color: "#888888" }}>
                    {pool.tvl}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[9px] font-sans tracking-[0.2em] uppercase"
                    style={{ color: "#444444" }}
                  >
                    Capacity
                  </p>
                  <p className="font-mono text-sm mt-0.5" style={{ color: "#888888" }}>
                    {pool.capacity}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ThinRule />
    </section>
  );
}

/* ── Pull Quote ────────────────────────────────────────────── */

function PullQuote() {
  return (
    <section className="w-full px-6 md:px-10 py-12 md:py-20">
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="font-serif font-light italic leading-relaxed"
          style={{
            fontSize: "clamp(20px, 3vw, 32px)",
            color: "#FAFAFA",
          }}
        >
          &ldquo;Real-world assets represent the next{" "}
          <span style={{ color: "#FF3B00" }}>$16 trillion</span> opportunity in
          decentralized finance.&rdquo;
        </div>
        <p
          className="mt-6 text-[10px] font-sans tracking-[0.3em] uppercase"
          style={{ color: "#444444" }}
        >
          Institutional Research Desk &mdash; Q1 2026
        </p>
      </div>
    </section>
  );
}

/* ── Colophon ──────────────────────────────────────────────── */

function Colophon() {
  return (
    <footer className="w-full pb-10 pt-4 px-6 md:px-10">
      <ThinRule />
      <p
        className="text-center text-[10px] font-sans tracking-[0.2em] uppercase py-4"
        style={{ color: "#444444" }}
      >
        Published on Avalanche C-Chain &bull; Verified &bull; Immutable
      </p>
      <ThinRule />
    </footer>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function DesignEditorialPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div className="w-full max-w-7xl">
        <Masthead />
        <HeroBlock />
        <DataGrid />
        <PullQuote />
        <FeaturedPools />
        <Colophon />
      </div>
    </div>
  );
}
