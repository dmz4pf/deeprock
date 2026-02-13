"use client";

/* ─────────────────────────────────────────────────────────────
   Design Vault — Institutional RWA Dashboard Preview
   Swiss private-banking aesthetic: restrained luxury, serif
   typography, mathematical grid, muted earth palette.
   ────────────────────────────────────────────────────────────── */

const HOLDINGS = [
  {
    asset: "US Treasury Bills 3-Mo",
    category: "Government Bonds",
    value: "$842,100.00",
    apy: "5.28%",
    allocation: "29.6%",
    status: "Active" as const,
  },
  {
    asset: "Manhattan REIT Class A",
    category: "Real Estate",
    value: "$624,500.00",
    apy: "7.12%",
    allocation: "21.9%",
    status: "Locked" as const,
  },
  {
    asset: "Ares Senior Secured Loan",
    category: "Private Credit",
    value: "$518,200.00",
    apy: "9.45%",
    allocation: "18.2%",
    status: "Active" as const,
  },
  {
    asset: "Prologis Logistics Fund",
    category: "Infrastructure",
    value: "$392,750.00",
    apy: "6.80%",
    allocation: "13.8%",
    status: "Active" as const,
  },
  {
    asset: "Swiss Gold Vault ETP",
    category: "Commodities",
    value: "$284,342.00",
    apy: "3.14%",
    allocation: "10.0%",
    status: "Locked" as const,
  },
  {
    asset: "Carbon Credit Forward 2027",
    category: "ESG Assets",
    value: "$185,500.00",
    apy: "11.20%",
    allocation: "6.5%",
    status: "Active" as const,
  },
];

const FEATURED_POOL = {
  name: "Apollo Senior Credit Fund III",
  category: "Private Credit",
  apy: "9.82",
  tvl: "$124.5M",
  minInvestment: "$50,000",
  maturity: "36 months",
  rating: "A+",
};

const SIDE_POOLS = [
  {
    name: "BlackRock Treasury Access",
    category: "Government Bonds",
    apy: "5.31%",
    tvl: "$2.1B",
  },
  {
    name: "Brookfield Real Assets",
    category: "Infrastructure",
    apy: "7.65%",
    tvl: "$890M",
  },
  {
    name: "KKR Private Credit Select",
    category: "Private Credit",
    apy: "10.14%",
    tvl: "$445M",
  },
];

export default function DesignVaultPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap');
            .font-serif-vault { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }
            .font-sans-vault { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
            .tracking-vault { letter-spacing: 0.18em; }
            .tracking-vault-tight { letter-spacing: 0.06em; }
            .tabular-nums { font-variant-numeric: tabular-nums; }
          `,
        }}
      />

      <div
        className="font-sans-vault min-h-screen"
        style={{ background: "#1A1A1A", color: "#F5F0E8" }}
      >
        {/* ── Top Bar ── */}
        <TopBar />

        {/* ── Main Content ── */}
        <main className="mx-auto max-w-[1280px] px-6 pb-24 lg:px-10">
          <PortfolioHero />
          <StatCards />
          <HoldingsTable />
          <PoolSpotlight />
        </main>

        {/* ── Footer ── */}
        <Footer />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOP BAR
   ═══════════════════════════════════════════════════════════════ */

function TopBar() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(26,26,26,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(184,151,108,0.12)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 lg:px-10">
        {/* Brand */}
        <div className="flex items-baseline gap-4">
          <span
            className="font-serif-vault text-lg font-semibold tracking-vault-tight"
            style={{ color: "#F5F0E8" }}
          >
            RWA Gateway
          </span>
          <span
            className="tracking-vault hidden text-[10px] font-medium uppercase sm:inline"
            style={{ color: "#8A8578" }}
          >
            Institutional Grade
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {["Portfolio", "Pools", "Lending", "Governance"].map((item) => (
            <span
              key={item}
              className="tracking-vault cursor-pointer text-[11px] font-medium uppercase transition-colors duration-200"
              style={{ color: item === "Portfolio" ? "#B8976C" : "#8A8578" }}
            >
              {item}
            </span>
          ))}
        </nav>

        {/* Avatar */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium"
          style={{
            background: "rgba(184,151,108,0.12)",
            color: "#B8976C",
            border: "1px solid rgba(184,151,108,0.20)",
          }}
        >
          DK
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO HERO
   ═══════════════════════════════════════════════════════════════ */

function PortfolioHero() {
  return (
    <section className="pb-2 pt-14 lg:pt-20">
      <p
        className="tracking-vault mb-3 text-[10px] font-medium uppercase"
        style={{ color: "#8A8578" }}
      >
        Total Portfolio Value
      </p>

      <div className="flex flex-wrap items-end gap-5">
        <h1
          className="font-serif-vault tabular-nums text-5xl font-semibold leading-none lg:text-[64px]"
          style={{ color: "#F5F0E8" }}
        >
          $2,847,392
          <span className="text-3xl lg:text-[40px]" style={{ color: "#8A8578" }}>
            .00
          </span>
        </h1>

        <div className="mb-1 flex items-center gap-2 lg:mb-2">
          <span
            className="tabular-nums text-sm font-medium"
            style={{ color: "#7A8B7A" }}
          >
            +$12,847.00
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              background: "rgba(122,139,122,0.10)",
              color: "#7A8B7A",
            }}
          >
            +0.45%
          </span>
          <span className="text-[11px]" style={{ color: "#8A8578" }}>
            this month
          </span>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARDS
   ═══════════════════════════════════════════════════════════════ */

function StatCards() {
  const stats = [
    { label: "Total Invested", value: "$2,847,392", prefix: "" },
    { label: "Active Pools", value: "6", prefix: "" },
    { label: "Avg APY", value: "6.83", prefix: "", suffix: "%" },
    { label: "Locked Value", value: "$908,842", prefix: "" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 pb-14 pt-10 lg:grid-cols-4 lg:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-sm px-5 py-5 lg:px-6 lg:py-6"
          style={{
            background: "#222222",
            border: "1px solid rgba(184,151,108,0.08)",
          }}
        >
          <p
            className="tracking-vault mb-3 text-[10px] font-medium uppercase"
            style={{ color: "#8A8578" }}
          >
            {stat.label}
          </p>
          <p
            className="font-serif-vault tabular-nums text-2xl font-semibold leading-none lg:text-[28px]"
            style={{ color: "#F5F0E8" }}
          >
            {stat.prefix}
            {stat.value}
            {stat.suffix && (
              <span className="text-lg" style={{ color: "#8A8578" }}>
                {stat.suffix}
              </span>
            )}
          </p>
        </div>
      ))}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOLDINGS TABLE
   ═══════════════════════════════════════════════════════════════ */

function HoldingsTable() {
  return (
    <section className="pb-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2
            className="font-serif-vault text-xl font-semibold"
            style={{ color: "#F5F0E8" }}
          >
            Holdings
          </h2>
          <p className="mt-1 text-[12px]" style={{ color: "#8A8578" }}>
            6 positions across 5 asset categories
          </p>
        </div>
        <span
          className="tracking-vault cursor-pointer text-[10px] font-medium uppercase transition-colors duration-200"
          style={{ color: "#B8976C" }}
        >
          View All
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(184,151,108,0.12)" }}>
              {["Asset", "Category", "Value", "APY", "Allocation", "Status"].map(
                (col) => (
                  <th
                    key={col}
                    className="tracking-vault pb-3 text-left text-[10px] font-medium uppercase"
                    style={{ color: "#8A8578" }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {HOLDINGS.map((row, i) => (
              <tr
                key={row.asset}
                className="transition-colors duration-150"
                style={{
                  background: i % 2 === 1 ? "rgba(34,34,34,0.5)" : "transparent",
                  borderBottom: "1px solid rgba(184,151,108,0.06)",
                }}
              >
                <td className="py-4 pr-4 text-[13px] font-medium" style={{ color: "#F5F0E8" }}>
                  {row.asset}
                </td>
                <td className="py-4 pr-4 text-[12px]" style={{ color: "#8A8578" }}>
                  {row.category}
                </td>
                <td
                  className="tabular-nums py-4 pr-4 text-[13px] font-medium"
                  style={{ color: "#F5F0E8" }}
                >
                  {row.value}
                </td>
                <td
                  className="tabular-nums py-4 pr-4 text-[13px] font-medium"
                  style={{ color: "#7A8B7A" }}
                >
                  {row.apy}
                </td>
                <td className="py-4 pr-4">
                  <AllocationBar percentage={parseFloat(row.allocation)} />
                </td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {HOLDINGS.map((row) => (
          <MobileHoldingCard key={row.asset} holding={row} />
        ))}
      </div>
    </section>
  );
}

function AllocationBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1 w-20 overflow-hidden rounded-full"
        style={{ background: "rgba(184,151,108,0.08)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage * 3.3}%`,
            background: "#B8976C",
            opacity: 0.6,
          }}
        />
      </div>
      <span className="tabular-nums text-[12px]" style={{ color: "#8A8578" }}>
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: "Active" | "Locked" }) {
  const isActive = status === "Active";
  return (
    <span
      className="inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase"
      style={{
        background: isActive ? "rgba(122,139,122,0.10)" : "rgba(166,114,114,0.10)",
        color: isActive ? "#7A8B7A" : "#A67272",
        letterSpacing: "0.08em",
      }}
    >
      {status}
    </span>
  );
}

function MobileHoldingCard({
  holding,
}: {
  holding: (typeof HOLDINGS)[number];
}) {
  return (
    <div
      className="rounded-sm px-4 py-4"
      style={{
        background: "#222222",
        border: "1px solid rgba(184,151,108,0.08)",
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium" style={{ color: "#F5F0E8" }}>
            {holding.asset}
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "#8A8578" }}>
            {holding.category}
          </p>
        </div>
        <StatusBadge status={holding.status} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MobileStat label="Value" value={holding.value} />
        <MobileStat label="APY" value={holding.apy} color="#7A8B7A" />
        <MobileStat label="Weight" value={holding.allocation} />
      </div>
    </div>
  );
}

function MobileStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p
        className="tracking-vault mb-1 text-[9px] font-medium uppercase"
        style={{ color: "#8A8578" }}
      >
        {label}
      </p>
      <p
        className="tabular-nums text-[12px] font-medium"
        style={{ color: color ?? "#F5F0E8" }}
      >
        {value}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   POOL SPOTLIGHT
   ═══════════════════════════════════════════════════════════════ */

function PoolSpotlight() {
  return (
    <section className="pb-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2
            className="font-serif-vault text-xl font-semibold"
            style={{ color: "#F5F0E8" }}
          >
            Pool Spotlight
          </h2>
          <p className="mt-1 text-[12px]" style={{ color: "#8A8578" }}>
            Curated institutional-grade opportunities
          </p>
        </div>
        <span
          className="tracking-vault cursor-pointer text-[10px] font-medium uppercase transition-colors duration-200"
          style={{ color: "#B8976C" }}
        >
          Explore Pools
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Featured pool */}
        <FeaturedPoolCard />

        {/* Side pools */}
        <div className="flex flex-col gap-3">
          {SIDE_POOLS.map((pool) => (
            <SidePoolCard key={pool.name} pool={pool} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedPoolCard() {
  return (
    <div
      className="flex flex-col justify-between rounded-sm p-6 lg:p-8"
      style={{
        background: "#222222",
        border: "1px solid rgba(184,151,108,0.12)",
      }}
    >
      <div>
        <div className="mb-6 flex items-center justify-between">
          <span
            className="tracking-vault text-[10px] font-medium uppercase"
            style={{ color: "#B8976C" }}
          >
            Featured
          </span>
          <span
            className="rounded-sm px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "rgba(184,151,108,0.10)",
              color: "#B8976C",
              letterSpacing: "0.06em",
            }}
          >
            {FEATURED_POOL.rating}
          </span>
        </div>

        <h3
          className="font-serif-vault mb-1 text-lg font-semibold"
          style={{ color: "#F5F0E8" }}
        >
          {FEATURED_POOL.name}
        </h3>
        <p className="mb-8 text-[12px]" style={{ color: "#8A8578" }}>
          {FEATURED_POOL.category}
        </p>

        <div className="mb-8">
          <p
            className="tracking-vault mb-2 text-[10px] font-medium uppercase"
            style={{ color: "#8A8578" }}
          >
            Annual Percentage Yield
          </p>
          <p className="font-serif-vault tabular-nums flex items-end gap-1 leading-none">
            <span
              className="text-5xl font-semibold lg:text-[56px]"
              style={{ color: "#7A8B7A" }}
            >
              {FEATURED_POOL.apy}
            </span>
            <span
              className="mb-1 text-2xl font-medium lg:mb-1.5 lg:text-3xl"
              style={{ color: "#7A8B7A", opacity: 0.6 }}
            >
              %
            </span>
          </p>
        </div>
      </div>

      <div>
        <div
          className="mb-6 grid grid-cols-3 gap-4 border-t pt-6"
          style={{ borderColor: "rgba(184,151,108,0.08)" }}
        >
          <PoolMeta label="TVL" value={FEATURED_POOL.tvl} />
          <PoolMeta label="Min. Investment" value={FEATURED_POOL.minInvestment} />
          <PoolMeta label="Maturity" value={FEATURED_POOL.maturity} />
        </div>

        <button
          className="tracking-vault w-full cursor-pointer rounded-sm py-3 text-[11px] font-medium uppercase transition-opacity duration-200 hover:opacity-80"
          style={{
            background: "rgba(184,151,108,0.12)",
            color: "#B8976C",
            border: "1px solid rgba(184,151,108,0.20)",
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function PoolMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="tracking-vault mb-1 text-[9px] font-medium uppercase"
        style={{ color: "#8A8578" }}
      >
        {label}
      </p>
      <p className="tabular-nums text-[13px] font-medium" style={{ color: "#F5F0E8" }}>
        {value}
      </p>
    </div>
  );
}

function SidePoolCard({ pool }: { pool: (typeof SIDE_POOLS)[number] }) {
  return (
    <div
      className="flex items-center justify-between rounded-sm px-5 py-4 transition-colors duration-150"
      style={{
        background: "#222222",
        border: "1px solid rgba(184,151,108,0.08)",
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium" style={{ color: "#F5F0E8" }}>
          {pool.name}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-[11px]" style={{ color: "#8A8578" }}>
            {pool.category}
          </span>
          <Separator />
          <span className="text-[11px]" style={{ color: "#8A8578" }}>
            TVL {pool.tvl}
          </span>
        </div>
      </div>

      <div className="ml-4 text-right">
        <p
          className="font-serif-vault tabular-nums text-lg font-semibold leading-none"
          style={{ color: "#7A8B7A" }}
        >
          {pool.apy}
        </p>
        <p
          className="tracking-vault mt-1 text-[9px] font-medium uppercase"
          style={{ color: "#8A8578" }}
        >
          APY
        </p>
      </div>
    </div>
  );
}

function Separator() {
  return (
    <span
      className="inline-block h-3 w-px"
      style={{ background: "rgba(184,151,108,0.15)" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer
      className="py-8"
      style={{ borderTop: "1px solid rgba(184,151,108,0.08)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px]" style={{ color: "#8A8578" }}>
            Secured by Avalanche C-Chain&ensp;&middot;&ensp;Document seals verified
            on-chain
          </p>
          <div className="flex items-center gap-6">
            {["Terms", "Privacy", "Audit Reports"].map((link) => (
              <span
                key={link}
                className="tracking-vault cursor-pointer text-[10px] font-medium uppercase transition-colors duration-200 hover:opacity-70"
                style={{ color: "#8A8578" }}
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
