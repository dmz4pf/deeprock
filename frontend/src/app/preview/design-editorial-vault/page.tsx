"use client";

/* ─────────────────────────────────────────────────────────────
   Design Editorial Vault — The Annual Report

   Swiss private-banking restraint married to magazine-grade
   typographic drama. Structure via thin gold rules only.
   No card backgrounds. No rounded corners. No shadows.
   The annual report of the world's most exclusive private bank,
   art-directed for Vogue.
   ────────────────────────────────────────────────────────────── */

const HOLDINGS = [
  { asset: "US Treasury Bills 3-Mo", category: "Government Bonds", value: "$842,100", apy: "5.28%", status: "Active" as const },
  { asset: "Manhattan REIT Class A", category: "Real Estate", value: "$624,500", apy: "7.12%", status: "Locked" as const },
  { asset: "Ares Senior Secured Loan", category: "Private Credit", value: "$518,200", apy: "9.45%", status: "Active" as const },
  { asset: "Prologis Logistics Fund", category: "Infrastructure", value: "$392,750", apy: "6.80%", status: "Active" as const },
  { asset: "Swiss Gold Vault ETP", category: "Commodities", value: "$284,342", apy: "3.14%", status: "Locked" as const },
  { asset: "Carbon Credit Forward 2027", category: "ESG Assets", value: "$185,500", apy: "11.20%", status: "Active" as const },
];

const ALLOCATION = [
  { label: "Government Bonds", pct: 29.6 },
  { label: "Real Estate", pct: 21.9 },
  { label: "Private Credit", pct: 18.2 },
  { label: "Infrastructure", pct: 13.8 },
  { label: "Commodities", pct: 10.0 },
  { label: "ESG Assets", pct: 6.5 },
];

const POOLS = [
  { name: "Apollo Senior Credit Fund III", category: "PRIVATE CREDIT", apy: "9.82", tvl: "$124.5M", min: "$50,000" },
  { name: "BlackRock Treasury Access", category: "GOVERNMENT BONDS", apy: "5.31", tvl: "$2.1B", min: "$25,000" },
  { name: "Brookfield Real Assets", category: "INFRASTRUCTURE", apy: "7.65", tvl: "$890M", min: "$100,000" },
];

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVES — The only structural elements allowed
   ═══════════════════════════════════════════════════════════════ */

function GoldRule() {
  return (
    <div
      className="w-full"
      style={{ height: "1px", background: "rgba(196,169,125,0.18)" }}
    />
  );
}

function VerticalGoldRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`self-stretch ${className}`}
      style={{ width: "1px", background: "rgba(196,169,125,0.18)" }}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-sans-ev text-[10px] tracking-[0.16em] uppercase"
      style={{ color: "#8A8172" }}
    >
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MASTHEAD — Newspaper-style header with gold rules
   ═══════════════════════════════════════════════════════════════ */

function Masthead() {
  return (
    <header className="w-full">
      <GoldRule />
      <div className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        <span
          className="font-sans-ev text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#C4A97D" }}
        >
          RWA Gateway
        </span>
        <span
          className="font-sans-ev text-[10px] tracking-[0.2em] uppercase hidden sm:block"
          style={{ color: "#5A5347" }}
        >
          February 2026
        </span>
        <span
          className="font-sans-ev text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#5A5347" }}
        >
          Private Portfolio
        </span>
      </div>
      <GoldRule />
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO — 72px+ serif number, watermark, full editorial drama
   ═══════════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="relative w-full px-6 md:px-12 lg:px-16 pt-16 pb-14 md:pt-24 md:pb-20 overflow-hidden">
      {/* Watermark — right side, barely visible against warm charcoal */}
      <div
        className="absolute top-1/2 right-4 md:right-10 -translate-y-1/2 select-none pointer-events-none font-serif-ev font-bold leading-none"
        style={{
          fontSize: "clamp(140px, 22vw, 220px)",
          color: "#1E1B17",
          letterSpacing: "-0.04em",
        }}
        aria-hidden="true"
      >
        2.8M
      </div>

      <div className="relative flex flex-col md:flex-row md:items-end">
        {/* Left 65% — The Portfolio Value */}
        <div className="md:w-[65%]">
          <Label>Total Portfolio Value</Label>

          <h1
            className="font-serif-ev tabular-nums leading-[0.88] tracking-[-0.02em] mt-5"
            style={{ fontSize: "clamp(56px, 9vw, 84px)", color: "#F0EBE1" }}
          >
            $2,847,392
            <span style={{ color: "#5A5347", fontSize: "0.5em" }}>.00</span>
          </h1>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span
              className="font-sans-ev tabular-nums text-base font-medium"
              style={{ color: "#8B9A7E" }}
            >
              +$12,847.00 this month
            </span>
            <span
              className="font-sans-ev text-[11px] px-2 py-0.5"
              style={{
                color: "#8B9A7E",
                background: "rgba(139,154,126,0.08)",
              }}
            >
              +0.45%
            </span>
          </div>
        </div>

        {/* Right 35% — breathing room for the watermark */}
        <div className="hidden md:block md:w-[35%]" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   METRICS ROW — 4 stats, vertical gold rules, no backgrounds
   ═══════════════════════════════════════════════════════════════ */

function MetricsRow() {
  const stats = [
    { label: "Total Invested", value: "$2,847,392" },
    { label: "Active Pools", value: "6" },
    { label: "Avg APY", value: "6.83%", gold: true },
    { label: "Locked Capital", value: "$908,842" },
  ];

  return (
    <section className="w-full px-6 md:px-12 lg:px-16">
      <GoldRule />

      {/* Desktop: all 4 in a row with vertical rules */}
      <div className="hidden sm:flex">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex flex-1">
            {i > 0 && <VerticalGoldRule />}
            <div className={`flex-1 py-8 ${i > 0 ? "pl-8" : ""} ${i < stats.length - 1 ? "pr-8" : ""}`}>
              <Label>{stat.label}</Label>
              <p
                className="font-serif-ev tabular-nums text-[28px] font-semibold leading-none mt-3"
                style={{ color: stat.gold ? "#C4A97D" : "#F0EBE1" }}
              >
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: 2x2 grid with horizontal rules */}
      <div className="grid grid-cols-2 gap-0 sm:hidden">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="py-6"
            style={{
              borderBottom: i < 2 ? "1px solid rgba(196,169,125,0.10)" : undefined,
              paddingLeft: i % 2 === 1 ? "16px" : undefined,
              borderLeft: i % 2 === 1 ? "1px solid rgba(196,169,125,0.10)" : undefined,
            }}
          >
            <Label>{stat.label}</Label>
            <p
              className="font-serif-ev tabular-nums text-[24px] font-semibold leading-none mt-2"
              style={{ color: stat.gold ? "#C4A97D" : "#F0EBE1" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <GoldRule />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOLDINGS + ALLOCATION — Asymmetric 2/3 + 1/3
   ═══════════════════════════════════════════════════════════════ */

function HoldingsSection() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16 py-14 md:py-20">
      <div className="flex flex-col md:flex-row gap-0">
        {/* Left 66% — Holdings */}
        <div className="md:w-[66%] md:pr-12">
          <h2
            className="font-serif-ev font-light leading-none mb-10"
            style={{
              fontSize: "clamp(32px, 4.5vw, 42px)",
              color: "#F0EBE1",
              letterSpacing: "-0.01em",
            }}
          >
            Holdings
          </h2>

          {/* Desktop holdings */}
          <div className="hidden sm:block">
            {/* Column headers */}
            <div
              className="flex items-baseline justify-between pb-3"
              style={{ borderBottom: "1px solid rgba(196,169,125,0.12)" }}
            >
              <span
                className="font-sans-ev text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "#5A5347" }}
              >
                Asset
              </span>
              <div className="flex items-baseline gap-8">
                <span
                  className="font-sans-ev text-[9px] tracking-[0.2em] uppercase w-20 text-right"
                  style={{ color: "#5A5347" }}
                >
                  Value
                </span>
                <span
                  className="font-sans-ev text-[9px] tracking-[0.2em] uppercase w-14 text-right"
                  style={{ color: "#5A5347" }}
                >
                  APY
                </span>
                <span
                  className="font-sans-ev text-[9px] tracking-[0.2em] uppercase w-12 text-right"
                  style={{ color: "#5A5347" }}
                >
                  Status
                </span>
              </div>
            </div>

            {HOLDINGS.map((row) => (
              <HoldingRow key={row.asset} {...row} />
            ))}
          </div>

          {/* Mobile holdings */}
          <div className="sm:hidden space-y-0">
            {HOLDINGS.map((row) => (
              <MobileHoldingRow key={row.asset} {...row} />
            ))}
          </div>
        </div>

        {/* Vertical gold rule */}
        <VerticalGoldRule className="hidden md:block" />

        {/* Right 34% — Allocation */}
        <div className="md:w-[34%] md:pl-12 mt-14 md:mt-0">
          <p
            className="font-sans-ev text-[10px] tracking-[0.2em] uppercase mb-10"
            style={{ color: "#8A8172" }}
          >
            Allocation
          </p>

          <div className="space-y-6">
            {ALLOCATION.map((item) => (
              <AllocationBar key={item.label} label={item.label} pct={item.pct} />
            ))}
          </div>

          {/* Total */}
          <div
            className="flex items-baseline justify-between mt-8 pt-6"
            style={{ borderTop: "1px solid rgba(196,169,125,0.12)" }}
          >
            <span className="font-sans-ev text-[12px] font-medium" style={{ color: "#8A8172" }}>
              Total
            </span>
            <span
              className="font-serif-ev tabular-nums text-[18px] font-semibold"
              style={{ color: "#C4A97D" }}
            >
              100.0%
            </span>
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
  const isLocked = status === "Locked";

  return (
    <div
      className="group relative flex items-baseline justify-between py-4 cursor-default"
      style={{ borderBottom: "1px solid rgba(196,169,125,0.08)" }}
    >
      {/* Gold hover indicator — left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[2px] transition-all duration-300"
        style={{ background: "#C4A97D" }}
      />

      <div className="flex items-baseline gap-3 group-hover:pl-4 transition-all duration-300 min-w-0">
        <span className="font-serif-ev text-[15px] font-semibold truncate" style={{ color: "#F0EBE1" }}>
          {asset}
        </span>
        <span className="font-sans-ev text-[11px] shrink-0" style={{ color: "#5A5347" }}>
          {category}
        </span>
      </div>

      <div className="flex items-baseline gap-8 shrink-0 ml-4 group-hover:pr-2 transition-all duration-300">
        <span
          className="font-sans-ev tabular-nums text-[13px] font-medium w-20 text-right"
          style={{ color: "#8A8172" }}
        >
          {value}
        </span>
        <span
          className="font-serif-ev tabular-nums text-[15px] font-semibold w-14 text-right"
          style={{ color: "#8B9A7E" }}
        >
          {apy}
        </span>
        <span
          className="font-sans-ev text-[9px] tracking-[0.12em] uppercase w-12 text-right"
          style={{ color: isLocked ? "#A67B7B" : "#5A5347" }}
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
  const isLocked = status === "Locked";

  return (
    <div
      className="py-4"
      style={{ borderBottom: "1px solid rgba(196,169,125,0.08)" }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-serif-ev text-[14px] font-semibold" style={{ color: "#F0EBE1" }}>
          {asset}
        </span>
        <span
          className="font-sans-ev text-[9px] tracking-[0.12em] uppercase"
          style={{ color: isLocked ? "#A67B7B" : "#5A5347" }}
        >
          {status}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="font-sans-ev text-[11px]" style={{ color: "#5A5347" }}>
          {category}
        </span>
        <div className="flex items-baseline gap-4">
          <span className="font-sans-ev tabular-nums text-[12px]" style={{ color: "#8A8172" }}>
            {value}
          </span>
          <span className="font-serif-ev tabular-nums text-[13px] font-semibold" style={{ color: "#8B9A7E" }}>
            {apy}
          </span>
        </div>
      </div>
    </div>
  );
}

function AllocationBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-sans-ev text-[12px]" style={{ color: "#8A8172" }}>
          {label}
        </span>
        <span
          className="font-serif-ev tabular-nums text-[14px] font-semibold"
          style={{ color: "#F0EBE1" }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
      {/* Thin gold bar — CSS only, no SVG */}
      <div className="w-full" style={{ height: "2px", background: "rgba(196,169,125,0.06)" }}>
        <div
          style={{
            height: "2px",
            width: `${pct * 3.3}%`,
            background: "rgba(196,169,125,0.50)",
            transition: "width 0.8s ease-out",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PULL QUOTE — Editorial centrepiece
   ═══════════════════════════════════════════════════════════════ */

function PullQuote() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16">
      <GoldRule />
      <div className="py-16 md:py-24 max-w-4xl mx-auto text-center">
        <p
          className="font-serif-ev font-light italic leading-[1.35]"
          style={{
            fontSize: "clamp(22px, 3.2vw, 36px)",
            color: "#F0EBE1",
            letterSpacing: "-0.01em",
          }}
        >
          &ldquo;$16 trillion in real-world assets are being tokenized
          &mdash;&thinsp;the largest migration of value in{" "}
          <span style={{ color: "#C4A97D" }}>financial history</span>.&rdquo;
        </p>
        <p
          className="font-sans-ev text-[10px] tracking-[0.3em] uppercase mt-8"
          style={{ color: "#5A5347" }}
        >
          Institutional Research Desk&ensp;&mdash;&ensp;Q1 2026
        </p>
      </div>
      <GoldRule />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OPPORTUNITIES — 3-column, rule-separated, hero APY numbers
   ═══════════════════════════════════════════════════════════════ */

function Opportunities() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16 py-14 md:py-20">
      <h2
        className="font-serif-ev font-light leading-none mb-12"
        style={{
          fontSize: "clamp(32px, 4.5vw, 42px)",
          color: "#F0EBE1",
          letterSpacing: "-0.01em",
        }}
      >
        Opportunities
      </h2>

      {/* Desktop: 3 columns separated by vertical gold rules */}
      <div className="hidden md:flex">
        {POOLS.map((pool, i) => (
          <div key={pool.name} className="flex flex-1">
            {i > 0 && <VerticalGoldRule />}
            <div
              className={`flex-1 ${
                i === 0 ? "pr-10" : i === 1 ? "px-10" : "pl-10"
              }`}
            >
              <PoolColumn pool={pool} />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: stacked with horizontal rules */}
      <div className="md:hidden space-y-0">
        {POOLS.map((pool, i) => (
          <div key={pool.name}>
            {i > 0 && <GoldRule />}
            <div className="py-8">
              <PoolColumn pool={pool} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PoolColumn({ pool }: { pool: typeof POOLS[number] }) {
  return (
    <>
      <p
        className="font-sans-ev text-[9px] tracking-[0.3em] uppercase mb-3"
        style={{ color: "#5A5347" }}
      >
        {pool.category}
      </p>
      <h3
        className="font-serif-ev text-[17px] font-semibold mb-8"
        style={{ color: "#F0EBE1" }}
      >
        {pool.name}
      </h3>

      {/* Hero APY number in gold */}
      <div className="mb-8">
        <p
          className="font-sans-ev text-[9px] tracking-[0.2em] uppercase mb-2"
          style={{ color: "#8A8172" }}
        >
          Annual Yield
        </p>
        <span
          className="font-serif-ev tabular-nums font-bold leading-none"
          style={{
            fontSize: "48px",
            color: "#C4A97D",
            letterSpacing: "-0.02em",
          }}
        >
          {pool.apy}
          <span
            className="text-xl align-top ml-0.5"
            style={{ color: "#8A8172" }}
          >
            %
          </span>
        </span>
      </div>

      {/* TVL + Min Investment */}
      <div className="flex gap-8">
        <div>
          <p
            className="font-sans-ev text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "#5A5347" }}
          >
            TVL
          </p>
          <p
            className="font-sans-ev tabular-nums text-sm mt-1"
            style={{ color: "#8A8172" }}
          >
            {pool.tvl}
          </p>
        </div>
        <div>
          <p
            className="font-sans-ev text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "#5A5347" }}
          >
            Minimum
          </p>
          <p
            className="font-sans-ev tabular-nums text-sm mt-1"
            style={{ color: "#8A8172" }}
          >
            {pool.min}
          </p>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAIN VERIFICATION — Monospace data strip
   ═══════════════════════════════════════════════════════════════ */

function ChainStrip() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-16">
      <GoldRule />
      <div className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <Label>Last Verified</Label>
          <span
            className="font-mono-ev tabular-nums text-[12px]"
            style={{ color: "#5A5347" }}
          >
            2026-02-10T14:32:07Z
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <Label>Block</Label>
          <span
            className="font-mono-ev tabular-nums text-[12px]"
            style={{ color: "#5A5347" }}
          >
            #48,291,847
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <Label>Hash</Label>
          <span
            className="font-mono-ev tabular-nums text-[11px] truncate max-w-[200px]"
            style={{ color: "#5A5347" }}
          >
            0x7a3f...c91d
          </span>
        </div>
      </div>
      <GoldRule />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COLOPHON — Closing rules + institutional attestation
   ═══════════════════════════════════════════════════════════════ */

function ColophonFooter() {
  return (
    <footer className="w-full px-6 md:px-12 lg:px-16 pb-12 pt-4">
      <GoldRule />
      <p
        className="text-center font-sans-ev text-[10px] tracking-[0.2em] uppercase py-6"
        style={{ color: "#5A5347" }}
      >
        Secured on Avalanche C-Chain&ensp;&middot;&ensp;Cryptographically
        Verified&ensp;&middot;&ensp;Immutable Record
      </p>
      <GoldRule />
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE — Assembly
   ═══════════════════════════════════════════════════════════════ */

export default function DesignEditorialVaultPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

            .font-serif-ev {
              font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
            }
            .font-sans-ev {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .font-mono-ev {
              font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
            }
            .tabular-nums {
              font-variant-numeric: tabular-nums;
            }

            /* Warm-toned scrollbar */
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-track { background: #161412; }
            ::-webkit-scrollbar-thumb {
              background: rgba(196,169,125,0.18);
              border-radius: 3px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(196,169,125,0.32);
            }

            /* Smooth page transitions */
            * { -webkit-font-smoothing: antialiased; }

            /* Selection color */
            ::selection {
              background: rgba(196,169,125,0.25);
              color: #F0EBE1;
            }
          `,
        }}
      />

      <div
        className="font-sans-ev min-h-screen w-full flex flex-col items-center"
        style={{ background: "#161412", color: "#F0EBE1" }}
      >
        <div className="w-full max-w-[1320px]">
          <Masthead />
          <Hero />
          <MetricsRow />
          <HoldingsSection />
          <PullQuote />
          <Opportunities />
          <ChainStrip />
          <ColophonFooter />
        </div>
      </div>
    </>
  );
}
