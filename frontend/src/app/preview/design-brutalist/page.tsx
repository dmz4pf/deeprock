"use client";

/* ─────────────────────────────────────────────────────────────
   DIGITAL BRUTALISM — Exposed grid, raw concrete, monospace.
   Like an architectural blueprint for institutional finance.
   Every border visible. Every label uppercase. Nothing hidden.
   ────────────────────────────────────────────────────────────── */

// ─── PALETTE ──────────────────────────────────────────────────

const C = {
  concrete:  "#E8E6E1",
  steel:     "#D1CFC9",
  glass:     "#F5F4F1",
  charcoal:  "#1A1A1A",
  graphite:  "#555555",
  fog:       "#999999",
  red:       "#E53935",
  green:     "#2E7D32",
};

// ─── MOCK DATA ────────────────────────────────────────────────

const PORTFOLIO = [
  { label: "TOTAL VALUE",  value: "$2,847,392", large: true },
  { label: "INVESTED",     value: "$2,420,000" },
  { label: "YIELD EARNED", value: "$427,392" },
  { label: "POSITIONS",    value: "12" },
  { label: "AVG APY",      value: "7.2%" },
  { label: "LOCKED",       value: "$890,000" },
];

const POSITIONS = [
  { asset: "USDC-TBILL-01",  type: "T-BILL",       value: "$500,000",  apy: "5.24%",  yield: "$26,200",  status: "ACTIVE" },
  { asset: "AVAX-RE-FUND",   type: "REAL ESTATE",   value: "$350,000",  apy: "9.80%",  yield: "$34,300",  status: "ACTIVE" },
  { asset: "ETH-CORP-BD3",   type: "CORP BOND",     value: "$275,000",  apy: "6.15%",  yield: "$16,913",  status: "LOCKED" },
  { asset: "GOLD-VAULT-A",   type: "COMMODITY",      value: "$420,000",  apy: "3.20%",  yield: "$13,440",  status: "ACTIVE" },
  { asset: "USDT-MM-POOL",   type: "MONEY MKT",     value: "$180,000",  apy: "4.85%",  yield: "$8,730",   status: "ACTIVE" },
  { asset: "PRIV-CRD-07",    type: "PRIV CREDIT",   value: "$600,000",  apy: "12.40%", yield: "$74,400",  status: "ACTIVE" },
  { asset: "INF-LNK-02",     type: "INFLATION LNK",  value: "$225,000",  apy: "7.60%",  yield: "$17,100",  status: "LOCKED" },
  { asset: "SOV-DEBT-BR",    type: "SOVEREIGN",      value: "$297,392",  apy: "11.20%", yield: "$33,308",  status: "PENDING" },
];

const ALLOCATIONS = [
  { label: "PRIVATE CREDIT",    pct: 25 },
  { label: "T-BILLS",           pct: 21 },
  { label: "COMMODITIES",       pct: 17 },
  { label: "REAL ESTATE",       pct: 15 },
  { label: "SOVEREIGN DEBT",    pct: 12 },
  { label: "INFLATION LINKED",  pct: 10 },
];

const ACTIVITY = [
  { time: "09:41:22", event: "YIELD CLAIMED",        amount: "$847.20" },
  { time: "09:38:14", event: "DEPOSIT CONFIRMED",    amount: "$50,000" },
  { time: "09:35:07", event: "REBALANCE EXECUTED",   amount: "3.2%" },
  { time: "09:22:51", event: "POSITION OPENED",      amount: "$100,000" },
  { time: "09:18:33", event: "KYC VERIFIED",         amount: "---" },
  { time: "09:12:09", event: "WITHDRAWAL PROCESSED", amount: "$25,000" },
];

const POOLS = [
  { name: "AVALANCHE PRIME YIELD",   type: "GOV BONDS",    apy: "5.28", tvl: "$4.2M",  capacity: 78 },
  { name: "ALPINE CREDIT FACILITY",  type: "PRIV CREDIT",  apy: "9.45", tvl: "$8.7M",  capacity: 62 },
  { name: "SUMMIT REAL ESTATE",      type: "REAL ESTATE",   apy: "7.80", tvl: "$12.1M", capacity: 91 },
];

// ─── HELPERS ──────────────────────────────────────────────────

function statusColor(status: string): string {
  if (status === "ACTIVE")  return C.green;
  if (status === "LOCKED")  return C.red;
  return C.fog;
}

const POSITION_TOTAL = POSITIONS.reduce((sum, p) => {
  const num = parseFloat(p.value.replace(/[$,]/g, ""));
  return sum + num;
}, 0);

const YIELD_TOTAL = POSITIONS.reduce((sum, p) => {
  const num = parseFloat(p.yield.replace(/[$,]/g, ""));
  return sum + num;
}, 0);

// ─── CELL COMPONENT ──────────────────────────────────────────

function Cell({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`border font-mono ${className}`}
      style={{ borderColor: C.steel, ...style }}
    >
      {children}
    </div>
  );
}

function SectionMarker({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 px-4 pt-6 pb-2">
      <span
        className="text-5xl font-mono font-bold leading-none"
        style={{ color: C.steel }}
      >
        {number}
      </span>
      <span
        className="text-xs font-mono uppercase tracking-[0.2em]"
        style={{ color: C.fog }}
      >
        {title}
      </span>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function DesignBrutalistPage() {
  return (
    <div
      className="min-h-screen font-mono"
      style={{ backgroundColor: C.concrete, color: C.charcoal }}
    >
      <div className="max-w-[1400px] mx-auto border-x" style={{ borderColor: C.steel }}>

        {/* ═══ SECTION 01: HEADER ═══ */}
        <div className="grid grid-cols-3 border-b" style={{ borderColor: C.steel }}>
          <Cell className="px-5 py-4">
            <span className="text-lg font-bold tracking-[0.15em] uppercase">
              RWA Gateway
            </span>
          </Cell>
          <Cell className="px-5 py-4 flex items-center">
            <span
              className="text-[11px] uppercase tracking-[0.25em]"
              style={{ color: C.fog }}
            >
              Institutional Real World Assets
            </span>
          </Cell>
          <Cell className="px-5 py-4 flex items-center justify-end">
            <span
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ color: C.fog }}
            >
              2026.02.10
            </span>
          </Cell>
        </div>

        {/* Gradient bar — the only decorative element */}
        <div
          className="h-[3px]"
          style={{
            background: `linear-gradient(90deg, ${C.red}, ${C.green}, #2563EB)`,
          }}
        />

        {/* ═══ SECTION 02: PORTFOLIO ═══ */}
        <SectionMarker number="02" title="PORTFOLIO" />

        <div className="grid grid-cols-3 mx-4 mb-6">
          {/* Total value spans full width of first row */}
          <Cell className="col-span-3 px-5 py-5" style={{ backgroundColor: C.glass }}>
            <div
              className="text-[10px] uppercase tracking-[0.25em] mb-1"
              style={{ color: C.fog }}
            >
              TOTAL VALUE
            </div>
            <div className="text-4xl font-bold tracking-tight">
              $2,847,392
            </div>
          </Cell>
          {PORTFOLIO.slice(1).map((item) => (
            <Cell key={item.label} className="px-5 py-4">
              <div
                className="text-[10px] uppercase tracking-[0.25em] mb-1"
                style={{ color: C.fog }}
              >
                {item.label}
              </div>
              <div className="text-xl font-bold">{item.value}</div>
            </Cell>
          ))}
        </div>

        {/* ═══ SECTION 03: POSITION MATRIX ═══ */}
        <SectionMarker number="03" title="POSITIONS" />

        <div className="mx-4 mb-6 overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[13px]">
            <thead>
              <tr>
                {["#", "ASSET", "TYPE", "VALUE", "APY", "YIELD", "STATUS"].map((h) => (
                  <th
                    key={h}
                    className="border px-3 py-2 text-left text-[10px] uppercase tracking-[0.2em] font-normal"
                    style={{ borderColor: C.steel, color: C.fog, backgroundColor: C.glass }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map((pos, i) => (
                <tr key={pos.asset}>
                  <td
                    className="border px-3 py-2 text-center"
                    style={{ borderColor: C.steel, color: C.fog }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td
                    className="border px-3 py-2 font-bold"
                    style={{ borderColor: C.steel }}
                  >
                    {pos.asset}
                  </td>
                  <td
                    className="border px-3 py-2"
                    style={{ borderColor: C.steel, color: C.graphite }}
                  >
                    {pos.type}
                  </td>
                  <td
                    className="border px-3 py-2 text-right"
                    style={{ borderColor: C.steel }}
                  >
                    {pos.value}
                  </td>
                  <td
                    className="border px-3 py-2 text-right"
                    style={{ borderColor: C.steel }}
                  >
                    {pos.apy}
                  </td>
                  <td
                    className="border px-3 py-2 text-right"
                    style={{ borderColor: C.steel }}
                  >
                    {pos.yield}
                  </td>
                  <td
                    className="border px-3 py-2 text-center text-[11px] font-bold tracking-wider"
                    style={{ borderColor: C.steel, color: statusColor(pos.status) }}
                  >
                    {pos.status}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr>
                <td
                  className="border-t-2 border px-3 py-2"
                  style={{ borderColor: C.steel }}
                />
                <td
                  className="border-t-2 border px-3 py-2 font-bold text-[10px] uppercase tracking-[0.2em]"
                  style={{ borderColor: C.steel, color: C.fog }}
                >
                  TOTAL
                </td>
                <td
                  className="border-t-2 border px-3 py-2"
                  style={{ borderColor: C.steel }}
                />
                <td
                  className="border-t-2 border px-3 py-2 text-right font-bold"
                  style={{ borderColor: C.steel }}
                >
                  ${POSITION_TOTAL.toLocaleString()}
                </td>
                <td
                  className="border-t-2 border px-3 py-2"
                  style={{ borderColor: C.steel }}
                />
                <td
                  className="border-t-2 border px-3 py-2 text-right font-bold"
                  style={{ borderColor: C.steel }}
                >
                  ${YIELD_TOTAL.toLocaleString()}
                </td>
                <td
                  className="border-t-2 border px-3 py-2"
                  style={{ borderColor: C.steel }}
                />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ═══ SECTION 04: ALLOCATION + ACTIVITY ═══ */}
        <div className="grid grid-cols-2 mx-4 mb-6">

          {/* 04A: Allocation */}
          <Cell className="p-0">
            <div className="flex items-baseline gap-3 px-4 pt-4 pb-3">
              <span className="text-4xl font-bold leading-none" style={{ color: C.steel }}>
                04A
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.fog }}>
                ALLOCATION
              </span>
            </div>
            <div className="px-4 pb-4 space-y-0">
              {ALLOCATIONS.map((a) => (
                <div key={a.label} className="border-b py-2" style={{ borderColor: C.steel }}>
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: C.fog }}
                    >
                      {a.label}
                    </span>
                    <span className="text-[13px] font-bold">{a.pct}%</span>
                  </div>
                  <div
                    className="h-2 border w-full"
                    style={{ borderColor: C.steel, backgroundColor: C.concrete }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${a.pct}%`,
                        backgroundColor: C.charcoal,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Cell>

          {/* 04B: Activity Log */}
          <Cell className="p-0">
            <div className="flex items-baseline gap-3 px-4 pt-4 pb-3">
              <span className="text-4xl font-bold leading-none" style={{ color: C.steel }}>
                04B
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.fog }}>
                ACTIVITY LOG
              </span>
            </div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["TIMESTAMP", "EVENT", "AMOUNT"].map((h) => (
                    <th
                      key={h}
                      className="border px-3 py-1.5 text-left text-[9px] uppercase tracking-[0.2em] font-normal"
                      style={{ borderColor: C.steel, color: C.fog, backgroundColor: C.glass }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACTIVITY.map((a) => (
                  <tr key={a.time}>
                    <td
                      className="border px-3 py-1.5"
                      style={{ borderColor: C.steel, color: C.fog }}
                    >
                      {a.time}
                    </td>
                    <td
                      className="border px-3 py-1.5"
                      style={{ borderColor: C.steel }}
                    >
                      {a.event}
                    </td>
                    <td
                      className="border px-3 py-1.5 text-right"
                      style={{ borderColor: C.steel }}
                    >
                      {a.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Cell>
        </div>

        {/* ═══ SECTION 05: OPPORTUNITIES ═══ */}
        <SectionMarker number="05" title="OPPORTUNITIES" />

        <div className="grid grid-cols-3 mx-4 mb-6">
          {POOLS.map((pool) => (
            <Cell key={pool.name} className="p-0">
              <div className="px-4 pt-4 pb-1">
                <div className="text-[13px] font-bold tracking-wide mb-0.5">
                  {pool.name}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: C.fog }}
                >
                  {pool.type}
                </div>
              </div>
              <div
                className="border-t border-b px-4 py-3 flex items-baseline gap-1"
                style={{ borderColor: C.steel, backgroundColor: C.glass }}
              >
                <span className="text-3xl font-bold">{pool.apy}</span>
                <span className="text-[11px]" style={{ color: C.fog }}>% APY</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between">
                  <span
                    className="text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: C.fog }}
                  >
                    TVL
                  </span>
                  <span className="text-[13px] font-bold">{pool.tvl}</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span
                      className="text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: C.fog }}
                    >
                      CAPACITY
                    </span>
                    <span className="text-[11px]" style={{ color: C.graphite }}>
                      {pool.capacity}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 border w-full"
                    style={{ borderColor: C.steel, backgroundColor: C.concrete }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${pool.capacity}%`,
                        backgroundColor: pool.capacity > 85 ? C.red : C.charcoal,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Cell>
          ))}
        </div>

        {/* ═══ FOOTER ═══ */}
        <Cell className="mx-4 mb-4 px-5 py-3 flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: C.fog }}
          >
            SYSTEM: AVALANCHE C-CHAIN &nbsp;// &nbsp;STATUS: OPERATIONAL &nbsp;// &nbsp;PROTOCOL: v2.0
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: C.steel }}
          >
            DIGITAL BRUTALISM
          </span>
        </Cell>

      </div>
    </div>
  );
}
